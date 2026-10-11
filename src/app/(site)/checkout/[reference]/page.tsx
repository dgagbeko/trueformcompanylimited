import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireVerifiedUser } from "@/lib/auth";
import { formatDate, formatMoney } from "@/lib/format";
import { imageUrl } from "@/lib/media";
import { paystackConfigured } from "@/lib/paystack";
import { PAYMENT_HOLD_MINUTES } from "@/lib/bookings";
import { Icon } from "@/components/Icon";
import { startPayment } from "../../actions";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage({ params, searchParams }: { params: Promise<{ reference: string }>; searchParams: Promise<{ error?: string }> }) {
  const { reference } = await params;
  const { error } = await searchParams;
  const user = await requireVerifiedUser(`/checkout/${reference}`);
  const [row] = await db
    .select({ b: schema.bookings, l: schema.listings })
    .from(schema.bookings)
    .innerJoin(schema.listings, eq(schema.bookings.listingId, schema.listings.id))
    .where(and(eq(schema.bookings.reference, reference), eq(schema.bookings.userId, user.id)));
  if (!row) notFound();
  const { b, l } = row;
  const [cover] = await db.select().from(schema.media).where(and(eq(schema.media.listingId, l.id), eq(schema.media.kind, "image"))).orderBy(asc(schema.media.sortOrder), asc(schema.media.id)).limit(1);
  const unit = l.category === "car" ? "day" : "night";
  const expiresAt = new Date(b.createdAt.getTime() + PAYMENT_HOLD_MINUTES * 60_000);
  const expired = b.status === "pending_payment" && expiresAt < new Date();

  return (
    <div className="band">
      <div className="wrap with-aside" style={{ maxWidth: 1100, padding: "40px 24px 80px" }}>
        <section className="main box stack" style={{ padding: 32, gap: 22 }}>
          <div className="row between">
            <h1 className="serif" style={{ fontSize: 32 }}>Payment</h1>
            <span className="row" style={{ gap: 8, fontSize: 14, fontWeight: 700, color: "var(--ok)" }}><Icon name="lock" size={18} />Secure checkout</span>
          </div>
          {b.status === "confirmed" ? (
            <p className="alert alert-ok">This booking is already paid and confirmed. <Link href="/account">View my bookings</Link></p>
          ) : b.status === "cancelled" ? (
            <p className="alert alert-error">This booking was cancelled. <Link href={`/listings/${l.slug}`}>Book again</Link></p>
          ) : (
            <>
              {error && <p className="alert alert-error" role="alert">We could not start the payment. Please try again.</p>}
              <p style={{ lineHeight: 1.6 }}>
                You will be taken to Paystack&apos;s secure page to pay with <b>card</b> (Visa, Mastercard) or <b>mobile money</b> (MTN MoMo, Telecel Cash, AirtelTigo Money). For mobile money you approve the payment with your PIN on your phone — we never see it.
              </p>
              <p className="alert alert-info">
                {expired
                  ? "Your 30-minute hold has ended. You can still pay if the dates are free — we check again before charging."
                  : `Your dates are held until ${expiresAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" })} (GMT).`}
              </p>
              {paystackConfigured() ? (
                <form action={startPayment}>
                  <input type="hidden" name="kind" value="booking" />
                  <input type="hidden" name="id" value={b.reference} />
                  <button className="btn btn-gold" style={{ width: "100%" }}>Pay {formatMoney(b.totalAmount)}</button>
                </form>
              ) : (
                <p className="alert alert-error">Online payments are not configured yet. Set PAYSTACK_SECRET_KEY to enable checkout.</p>
              )}
            </>
          )}
          <span className="hint">TrueForm never stores your card or wallet details. A receipt is emailed when payment succeeds.</span>
        </section>
        <aside className="aside box stack" aria-label="Booking summary" style={{ padding: 28 }}>
          <span className="eyebrow" style={{ fontSize: 12 }}>Booking summary</span>
          <div className="row" style={{ gap: 14, flexWrap: "nowrap" }}>
            <div className="photo" style={{ width: 84, height: 68, borderRadius: 8, flex: "0 0 auto", padding: 0 }}>{cover && <img src={imageUrl(cover.url, 200)} alt="" />}</div>
            <div className="stack" style={{ gap: 2 }}><b style={{ color: "var(--navy)" }}>{l.title}</b><span className="muted" style={{ fontSize: 14 }}>{l.location}</span></div>
          </div>
          <div className="stack" style={{ gap: 10, borderTop: "1px solid var(--line)", paddingTop: 14, fontSize: 15 }}>
            <div className="row between"><span className="muted">{l.category === "car" ? "Pick-up" : "Check-in"}</span><b>{formatDate(b.startDate)}</b></div>
            <div className="row between"><span className="muted">{l.category === "car" ? "Return" : "Check-out"}</span><b>{formatDate(b.endDate)}</b></div>
            {b.guests && <div className="row between"><span className="muted">Guests</span><b>{b.guests}</b></div>}
            <div className="row between"><span className="muted">{formatMoney(b.unitPrice)} × {b.units} {unit}{b.units > 1 ? "s" : ""}</span><b>{formatMoney(b.totalAmount)}</b></div>
          </div>
          <div className="row between" style={{ borderTop: "1px solid var(--line)", paddingTop: 14, fontSize: 20, fontWeight: 800 }}><span>Total</span><span>{formatMoney(b.totalAmount)}</span></div>
          <span className="hint">Reference {b.reference}</span>
        </aside>
      </div>
    </div>
  );
}
