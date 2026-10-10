import "server-only";
import { randomBytes } from "node:crypto";
import { and, eq, gt, inArray, lt, ne, or } from "drizzle-orm";
import { db, schema } from "@/db";
import { daysBetween, formatDate, formatMoney } from "./format";
import { appUrl, notifyAdmins, sendEmail } from "./email";
import { refundTransaction, verifyTransaction } from "./paystack";
import { getSettings } from "./settings";

/** Unpaid bookings hold their dates for this long before the dates are released. */
export const PAYMENT_HOLD_MINUTES = 30;

export const newReference = (prefix: string) =>
  `${prefix}-${Date.now().toString(36).toUpperCase()}${randomBytes(3).toString("hex").toUpperCase()}`;

type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Bookings that block the given range: confirmed ones, plus unpaid ones still inside their hold. */
function blockingCondition(listingId: string, start: string, end: string, excludeId?: string) {
  const holdStart = new Date(Date.now() - PAYMENT_HOLD_MINUTES * 60_000);
  return and(
    eq(schema.bookings.listingId, listingId),
    lt(schema.bookings.startDate, end),
    gt(schema.bookings.endDate, start),
    or(
      eq(schema.bookings.status, "confirmed"),
      and(eq(schema.bookings.status, "pending_payment"), gt(schema.bookings.createdAt, holdStart)),
    ),
    excludeId ? ne(schema.bookings.id, excludeId) : undefined,
  );
}

export async function isAvailable(tx: Tx | typeof db, listingId: string, start: string, end: string, excludeId?: string) {
  const clash = await tx
    .select({ id: schema.bookings.id })
    .from(schema.bookings)
    .where(blockingCondition(listingId, start, end, excludeId))
    .limit(1);
  return clash.length === 0;
}

/** Date ranges already taken for a listing, for display on the listing page. */
export async function bookedRanges(listingId: string) {
  const today = new Date().toISOString().slice(0, 10);
  return db
    .select({ start: schema.bookings.startDate, end: schema.bookings.endDate })
    .from(schema.bookings)
    .where(blockingCondition(listingId, today, "9999-12-31"))
    .orderBy(schema.bookings.startDate);
}

/**
 * Create a booking inside a transaction that locks the listing row, so two customers
 * can never book overlapping dates for the same car or property.
 */
export async function createBooking(opts: {
  userId: string;
  listingId: string;
  start: string;
  end: string;
  guests: number | null;
}): Promise<{ ok: true; reference: string } | { ok: false; error: string }> {
  const units = daysBetween(opts.start, opts.end);
  if (units < 1) return { ok: false, error: "The end date must be after the start date." };
  if (units > 90) return { ok: false, error: "Bookings are limited to 90 days. Please contact us for longer periods." };

  return db.transaction(async (tx) => {
    const [listing] = await tx
      .select()
      .from(schema.listings)
      .where(eq(schema.listings.id, opts.listingId))
      .for("update");
    if (!listing || listing.status !== "published" || !["stay", "car"].includes(listing.category))
      return { ok: false as const, error: "This listing is not available for booking." };
    if (listing.category === "stay" && listing.maxGuests && (opts.guests ?? 1) > listing.maxGuests)
      return { ok: false as const, error: `This stay hosts at most ${listing.maxGuests} guests.` };
    if (!(await isAvailable(tx, listing.id, opts.start, opts.end)))
      return { ok: false as const, error: "Those dates are already booked. Please choose different dates." };

    const reference = newReference("TFB");
    await tx.insert(schema.bookings).values({
      reference,
      userId: opts.userId,
      listingId: listing.id,
      startDate: opts.start,
      endDate: opts.end,
      units,
      unitPrice: listing.price,
      totalAmount: listing.price * units,
      guests: listing.category === "stay" ? opts.guests : null,
    });
    return { ok: true as const, reference };
  });
}

/** Whether the customer may still cancel for free under the cancellation window. */
export async function canCancelFree(startDate: string) {
  const { cancellationHours } = await getSettings();
  const hours = Number(cancellationHours) || 0;
  return Date.parse(`${startDate}T00:00:00Z`) - Date.now() >= hours * 3_600_000;
}

/**
 * Cancel a booking and refund any successful payment through Paystack.
 * Used by customers (inside the free window) and by admins (any time).
 */
export async function cancelBooking(bookingId: string, refund: boolean) {
  const [booking] = await db
    .update(schema.bookings)
    .set({ status: "cancelled", updatedAt: new Date() })
    .where(and(eq(schema.bookings.id, bookingId), inArray(schema.bookings.status, ["pending_payment", "confirmed"])))
    .returning();
  if (!booking) return { refunded: false };

  let refunded = false;
  if (refund) {
    const paid = await db
      .select()
      .from(schema.payments)
      .where(and(eq(schema.payments.bookingId, booking.id), eq(schema.payments.status, "success")));
    for (const p of paid) {
      try {
        await refundTransaction(p.reference);
        await db.update(schema.payments).set({ status: "refunded" }).where(eq(schema.payments.id, p.id));
        refunded = true;
      } catch (err) {
        console.error("[refund] failed for", p.reference, err);
        await notifyAdmins("Refund needs attention", [`Automatic refund failed for payment ${p.reference}.`], "/admin/payments");
      }
    }
  }

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, booking.userId));
  if (user) {
    await sendEmail(
      user.email,
      `Booking ${booking.reference} cancelled`,
      [
        `Hello ${user.fullName},`,
        `Your booking ${booking.reference} (${formatDate(booking.startDate)} – ${formatDate(booking.endDate)}) has been cancelled.`,
        refunded
          ? `A refund of ${formatMoney(booking.totalAmount)} has been sent to your original payment method. It can take a few working days to arrive.`
          : "No payment was taken for this booking, or your refund will be handled by our team.",
      ],
      { label: "View my bookings", url: `${appUrl()}/account` },
    );
  }
  return { refunded };
}

/**
 * Confirm a payment with Paystack and apply it. Safe to call more than once for the
 * same reference (from the browser callback and from the webhook).
 */
export async function finalizePayment(reference: string): Promise<"success" | "failed" | "pending" | "unknown"> {
  const [payment] = await db.select().from(schema.payments).where(eq(schema.payments.reference, reference));
  if (!payment) return "unknown";
  if (payment.status === "success" || payment.status === "refunded") return "success";

  let tx;
  try {
    tx = await verifyTransaction(reference);
  } catch (err) {
    console.error("[paystack] verify failed", err);
    return "pending";
  }

  if (tx.status === "failed" || tx.status === "abandoned" || tx.status === "reversed") {
    await db
      .update(schema.payments)
      .set({ status: "failed" })
      .where(and(eq(schema.payments.id, payment.id), eq(schema.payments.status, "pending")));
    return "failed";
  }
  if (tx.status !== "success") return "pending";
  if (tx.amount !== payment.amount || tx.currency !== payment.currency) {
    console.error("[paystack] amount/currency mismatch", reference, tx.amount, payment.amount);
    return "failed";
  }

  // Claim the payment exactly once.
  const [claimed] = await db
    .update(schema.payments)
    .set({ status: "success", channel: tx.channel, paidAt: tx.paid_at ? new Date(tx.paid_at) : new Date() })
    .where(and(eq(schema.payments.id, payment.id), eq(schema.payments.status, "pending")))
    .returning();
  if (!claimed) return "success";

  const [user] = await db.select().from(schema.users).where(eq(schema.users.id, payment.userId));

  if (payment.bookingId) {
    const result = await db.transaction(async (t) => {
      const [booking] = await t.select().from(schema.bookings).where(eq(schema.bookings.id, payment.bookingId!)).for("update");
      if (!booking) return { booking: null, clash: false };
      await t.select({ id: schema.listings.id }).from(schema.listings).where(eq(schema.listings.id, booking.listingId)).for("update");
      // If the hold expired and someone else took the dates meanwhile, refund instead of double-booking.
      const clash = !(await isAvailable(t, booking.listingId, booking.startDate, booking.endDate, booking.id));
      await t
        .update(schema.bookings)
        .set({ status: clash ? "cancelled" : "confirmed", updatedAt: new Date() })
        .where(eq(schema.bookings.id, booking.id));
      return { booking, clash };
    });
    const booking = result.booking;
    if (booking && result.clash) {
      try {
        await refundTransaction(reference);
        await db.update(schema.payments).set({ status: "refunded" }).where(eq(schema.payments.id, payment.id));
      } catch (err) {
        console.error("[refund] failed", err);
      }
      if (user)
        await sendEmail(user.email, "We could not confirm your booking", [
          `Hello ${user.fullName},`,
          `Your payment for booking ${booking.reference} arrived after the dates were taken by another customer. We have refunded ${formatMoney(payment.amount)} to your original payment method.`,
        ]);
      return "failed";
    }
    if (booking && user) {
      const [listing] = await db.select().from(schema.listings).where(eq(schema.listings.id, booking.listingId));
      const unit = listing?.category === "car" ? "day" : "night";
      await sendEmail(
        user.email,
        `Booking confirmed — ${booking.reference}`,
        [
          `Hello ${user.fullName},`,
          `Your booking for ${listing?.title ?? "your listing"} is confirmed.`,
          `Dates: ${formatDate(booking.startDate)} – ${formatDate(booking.endDate)} (${booking.units} ${unit}${booking.units === 1 ? "" : "s"})`,
          `Location: ${listing?.location ?? ""}`,
          `Amount paid: ${formatMoney(payment.amount)} via ${tx.channel === "mobile_money" ? "mobile money" : "card"}`,
          `Payment reference: ${reference}`,
          "Keep this email as your receipt.",
        ],
        { label: "Manage booking", url: `${appUrl()}/account` },
      );
      await notifyAdmins("New paid booking", [`${user.fullName} booked ${listing?.title} (${booking.reference}).`], "/admin/bookings");
    }
  }

  if (payment.inquiryId) {
    await db.update(schema.inquiries).set({ status: "deposit_paid" }).where(eq(schema.inquiries.id, payment.inquiryId));
    const [inq] = await db
      .select({ title: schema.listings.title })
      .from(schema.inquiries)
      .innerJoin(schema.listings, eq(schema.inquiries.listingId, schema.listings.id))
      .where(eq(schema.inquiries.id, payment.inquiryId));
    if (user)
      await sendEmail(
        user.email,
        "Deposit received",
        [
          `Hello ${user.fullName},`,
          `We have received your deposit of ${formatMoney(payment.amount)} for ${inq?.title ?? "your property"}.`,
          `Payment reference: ${reference}`,
          "Our team will contact you to complete the reservation and documentation.",
        ],
        { label: "View my inquiries", url: `${appUrl()}/account` },
      );
    await notifyAdmins("Deposit paid", [`${user?.fullName} paid a deposit for ${inq?.title}. Mark the listing Reserved when agreed.`], "/admin/inquiries");
  }
  return "success";
}
