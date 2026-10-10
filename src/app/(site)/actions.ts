"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import { getCurrentUser, requireVerifiedUser } from "@/lib/auth";
import { cancelBooking, canCancelFree, createBooking, isAvailable, newReference } from "@/lib/bookings";
import { daysBetween, formatDate, isIsoDate, todayIso } from "@/lib/format";
import { appUrl, notifyAdmins, sendEmail } from "@/lib/email";
import { currency, initializeTransaction, paystackConfigured } from "@/lib/paystack";
import { getSettings } from "@/lib/settings";

export type FormState = { error?: string; ok?: string } | undefined;

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();

/* ---------- Bookings (cars & stays) ---------- */

export async function bookListing(_: FormState, fd: FormData): Promise<FormState> {
  const slug = str(fd, "slug");
  const user = await requireVerifiedUser(`/listings/${slug}`);
  const start = str(fd, "start");
  const end = str(fd, "end");
  if (!isIsoDate(start) || !isIsoDate(end)) return { error: "Please choose both dates." };
  if (start < todayIso()) return { error: "The start date cannot be in the past." };
  const guests = Number(str(fd, "guests")) || null;

  const result = await createBooking({ userId: user.id, listingId: str(fd, "listingId"), start, end, guests });
  if (!result.ok) return { error: result.error };
  redirect(`/checkout/${result.reference}`);
}

/** Start Paystack checkout for a booking or a land/house deposit. */
export async function startPayment(fd: FormData) {
  const user = await requireVerifiedUser("/account");
  if (!paystackConfigured()) redirect("/account?error=payments-not-configured");
  const kind = str(fd, "kind");
  const id = str(fd, "id");

  let amount = 0;
  let bookingId: string | null = null;
  let inquiryId: string | null = null;
  let back = "/account";

  if (kind === "booking") {
    const [b] = await db
      .select()
      .from(schema.bookings)
      .where(and(eq(schema.bookings.reference, id), eq(schema.bookings.userId, user.id)));
    if (!b || b.status !== "pending_payment") redirect("/account");
    // Re-check: an expired hold may have let someone else take the dates.
    if (!(await isAvailable(db, b.listingId, b.startDate, b.endDate, b.id))) {
      await db.update(schema.bookings).set({ status: "cancelled" }).where(eq(schema.bookings.id, b.id));
      redirect("/account?error=dates-taken");
    }
    amount = b.totalAmount;
    bookingId = b.id;
    back = `/checkout/${b.reference}`;
  } else if (kind === "deposit") {
    const [row] = await db
      .select({ inq: schema.inquiries, listing: schema.listings })
      .from(schema.inquiries)
      .innerJoin(schema.listings, eq(schema.inquiries.listingId, schema.listings.id))
      .where(and(eq(schema.inquiries.id, id), eq(schema.inquiries.userId, user.id)));
    if (!row || row.inq.status === "deposit_paid" || row.inq.status === "closed" || row.listing.status !== "published") redirect("/account");
    const pct = Number((await getSettings()).landDepositPercent) || 0;
    amount = Math.round((row.listing.price * pct) / 100);
    if (amount <= 0) redirect("/account");
    inquiryId = row.inq.id;
  } else {
    redirect("/account");
  }

  const reference = newReference("TFP");
  await db.insert(schema.payments).values({ reference, userId: user.id, bookingId, inquiryId, amount, currency: currency() });
  let url: string;
  try {
    const init = await initializeTransaction({
      email: user.email,
      amount,
      reference,
      callbackUrl: `${appUrl()}/payments/callback`,
      metadata: { bookingId, inquiryId, userId: user.id },
    });
    url = init.authorization_url;
  } catch (err) {
    console.error(err);
    await db.update(schema.payments).set({ status: "failed" }).where(eq(schema.payments.reference, reference));
    redirect(`${back}${back.includes("?") ? "&" : "?"}error=payment-start-failed`);
  }
  redirect(url);
}

export async function cancelMyBooking(fd: FormData) {
  const user = await requireVerifiedUser("/account");
  const [b] = await db
    .select()
    .from(schema.bookings)
    .where(and(eq(schema.bookings.id, str(fd, "id")), eq(schema.bookings.userId, user.id)));
  if (!b) redirect("/account");
  if (b.status === "confirmed" && !(await canCancelFree(b.startDate))) redirect("/account?error=outside-cancellation-window");
  await cancelBooking(b.id, true);
  revalidatePath("/account");
  redirect("/account?ok=cancelled");
}

/** Change dates of an existing booking, subject to availability (FR-CAR-05, FR-STAY-05). */
export async function modifyMyBooking(_: FormState, fd: FormData): Promise<FormState> {
  const user = await requireVerifiedUser("/account");
  const start = str(fd, "start");
  const end = str(fd, "end");
  if (!isIsoDate(start) || !isIsoDate(end)) return { error: "Please choose both dates." };
  if (start < todayIso()) return { error: "The new start date cannot be in the past." };
  const units = daysBetween(start, end);
  if (units < 1) return { error: "The end date must be after the start date." };

  return db.transaction(async (tx) => {
    const [b] = await tx
      .select()
      .from(schema.bookings)
      .where(and(eq(schema.bookings.id, str(fd, "id")), eq(schema.bookings.userId, user.id)))
      .for("update");
    if (!b || !["pending_payment", "confirmed"].includes(b.status)) return { error: "This booking can no longer be changed." };
    if (b.status === "confirmed" && units !== b.units)
      return { error: `Paid bookings can move to new dates of the same length (${b.units}). To change the length, cancel and book again, or contact us.` };
    await tx.select({ id: schema.listings.id }).from(schema.listings).where(eq(schema.listings.id, b.listingId)).for("update");
    if (!(await isAvailable(tx, b.listingId, start, end, b.id))) return { error: "Those dates are not available." };
    await tx
      .update(schema.bookings)
      .set({ startDate: start, endDate: end, units, totalAmount: b.unitPrice * units, updatedAt: new Date() })
      .where(eq(schema.bookings.id, b.id));
    await sendEmail(
      user.email,
      `Booking ${b.reference} updated`,
      [`Hello ${user.fullName},`, `Your booking ${b.reference} now runs from ${formatDate(start)} to ${formatDate(end)}.`],
      { label: "View my bookings", url: `${appUrl()}/account` },
    );
    revalidatePath("/account");
    return { ok: "Your booking dates have been updated." };
  });
}

/* ---------- Land & house inquiries ---------- */

export async function sendInquiry(_: FormState, fd: FormData): Promise<FormState> {
  const slug = str(fd, "slug");
  const user = await requireVerifiedUser(`/listings/${slug}`);
  const parsed = z
    .object({ phone: z.string().min(6, "Please enter a phone number."), message: z.string().min(5, "Please add a short message.").max(2000) })
    .safeParse({ phone: str(fd, "phone"), message: str(fd, "message") });
  if (!parsed.success) return { error: parsed.error.issues[0].message };

  const [listing] = await db.select().from(schema.listings).where(eq(schema.listings.id, str(fd, "listingId")));
  if (!listing || !["land", "house"].includes(listing.category) || listing.status !== "published")
    return { error: "This listing is no longer open for inquiries." };

  await db.insert(schema.inquiries).values({ userId: user.id, listingId: listing.id, ...parsed.data });
  await sendEmail(user.email, "We received your inquiry", [
    `Hello ${user.fullName},`,
    `Thank you for your interest in ${listing.title}. Our team will contact you shortly to arrange next steps.`,
  ]);
  await notifyAdmins("New property inquiry", [`${user.fullName} (${parsed.data.phone}) asked about ${listing.title}:`, parsed.data.message], "/admin/inquiries");
  return { ok: "Inquiry sent. You can follow its status in your dashboard." };
}

/* ---------- Insurance ---------- */

export async function requestInsurance(_: FormState, fd: FormData): Promise<FormState> {
  const user = await getCurrentUser();
  const parsed = z
    .object({
      coverType: z.enum(["Motor insurance", "Home & property", "Travel", "Health"]),
      fullName: z.string().min(2, "Please enter your name."),
      email: z.email("Please enter a valid email."),
      phone: z.string().min(6, "Please enter a phone number."),
      details: z.string().max(2000),
      startDate: z.string(),
    })
    .safeParse({
      coverType: str(fd, "coverType"),
      fullName: str(fd, "fullName"),
      email: str(fd, "email"),
      phone: str(fd, "phone"),
      details: str(fd, "details"),
      startDate: str(fd, "startDate"),
    });
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  await db.insert(schema.insuranceRequests).values({
    ...d,
    userId: user?.id ?? null,
    startDate: isIsoDate(d.startDate) ? d.startDate : null,
  });
  await sendEmail(d.email, "Your insurance quote request", [
    `Hello ${d.fullName},`,
    `We received your request for ${d.coverType}. Our team will contact you with a quote.`,
  ]);
  await notifyAdmins("New insurance quote request", [`${d.fullName} (${d.phone}, ${d.email}) requested ${d.coverType}.`, d.details], "/admin/insurance");
  return { ok: "Thank you — your request has been sent. We will contact you with a quote." };
}

/* ---------- Contact ---------- */

export async function sendContact(_: FormState, fd: FormData): Promise<FormState> {
  const parsed = z
    .object({ name: z.string().min(2), email: z.email(), message: z.string().min(5).max(3000) })
    .safeParse({ name: str(fd, "name"), email: str(fd, "email"), message: str(fd, "message") });
  if (!parsed.success) return { error: "Please fill in your name, a valid email and a message." };
  const { supportEmail } = await getSettings();
  const to = process.env.ADMIN_NOTIFY_EMAIL || supportEmail;
  if (to)
    await sendEmail(to, `Website message from ${parsed.data.name}`, [`From: ${parsed.data.name} <${parsed.data.email}>`, parsed.data.message]);
  else console.log("[contact]", parsed.data);
  return { ok: "Thank you — we will get back to you soon." };
}
