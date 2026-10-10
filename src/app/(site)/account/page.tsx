import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/auth";
import { CATEGORY_LABEL, formatDate, formatMoney, todayIso } from "@/lib/format";
import { getSettings } from "@/lib/settings";
import { PAYMENT_HOLD_MINUTES } from "@/lib/bookings";
import { StatusPill } from "@/components/StatusPill";
import { ModifyBooking } from "@/components/ModifyBooking";
import { ActionForm } from "@/components/AuthForm";
import { cancelMyBooking, startPayment } from "../actions";
import { logout, updateProfile } from "../auth-actions";

export const metadata = { title: "My account" };

const MESSAGES: Record<string, [string, string]> = {
  cancelled: ["Your booking has been cancelled. Any refund is on its way to your original payment method.", "alert-ok"],
  "password-reset": ["Your password has been changed.", "alert-ok"],
  paid: ["Payment received — thank you! A receipt has been emailed to you.", "alert-ok"],
  "payment-failed": ["Your payment was not completed, so nothing has been confirmed. You can try again below.", "alert-error"],
  "payment-pending": ["Your payment is still processing. We will email you as soon as it is confirmed.", "alert-info"],
  "dates-taken": ["Sorry — the dates for that booking were taken while it was unpaid. Please choose new dates.", "alert-error"],
  "outside-cancellation-window": ["This booking is inside the cancellation window and can't be cancelled online. Please contact us.", "alert-error"],
  "payments-not-configured": ["Online payments are not available yet. Please contact us to complete your booking.", "alert-error"],
  "payment-start-failed": ["We could not reach the payment provider. Please try again in a moment.", "alert-error"],
};

export default async function AccountPage({ searchParams }: { searchParams: Promise<{ ok?: string; error?: string }> }) {
  const user = await requireUser("/account");
  const sp = await searchParams;
  const flash = MESSAGES[sp.ok ?? sp.error ?? ""];
  const settings = await getSettings();
  const deposit = Number(settings.landDepositPercent) || 0;
  const today = todayIso();
  const holdStart = Date.now() - PAYMENT_HOLD_MINUTES * 60_000;

  const [bookings, inquiries, quotes, payments] = await Promise.all([
    db.select({ b: schema.bookings, l: schema.listings }).from(schema.bookings).innerJoin(schema.listings, eq(schema.bookings.listingId, schema.listings.id)).where(eq(schema.bookings.userId, user.id)).orderBy(desc(schema.bookings.createdAt)),
    db.select({ i: schema.inquiries, l: schema.listings }).from(schema.inquiries).innerJoin(schema.listings, eq(schema.inquiries.listingId, schema.listings.id)).where(eq(schema.inquiries.userId, user.id)).orderBy(desc(schema.inquiries.createdAt)),
    db.select().from(schema.insuranceRequests).where(eq(schema.insuranceRequests.userId, user.id)).orderBy(desc(schema.insuranceRequests.createdAt)),
    db.select().from(schema.payments).where(eq(schema.payments.userId, user.id)).orderBy(desc(schema.payments.createdAt)).limit(20),
  ]);

  return (
    <div className="band">
      <div className="wrap stack" style={{ padding: "40px 24px 88px", gap: 24 }}>
        <div className="row between">
          <h1 className="serif" style={{ fontSize: 34 }}>Welcome back, {user.fullName.split(" ")[0]}</h1>
          <form action={logout}><button className="btn btn-line btn-sm">Log out</button></form>
        </div>
        {!user.emailVerifiedAt && (
          <p className="alert alert-info">Please verify your email to book or send inquiries. <Link href="/verify-email?pending=1">Resend the link</Link></p>
        )}
        {flash && <p className={`alert ${flash[1]}`} role="status">{flash[0]}</p>}

        <section className="box stack" aria-labelledby="bk">
          <h2 id="bk" style={{ fontSize: 20 }}>Bookings</h2>
          {bookings.length === 0 && <p className="muted">No bookings yet. <Link href="/stays">Find a stay</Link> or <Link href="/cars">rent a car</Link>.</p>}
          {bookings.map(({ b, l }) => {
            const expired = b.status === "pending_payment" && b.createdAt.getTime() < holdStart;
            const active = (b.status === "pending_payment" && !expired) || b.status === "confirmed";
            return (
              <div key={b.id} className="stack" style={{ gap: 10, borderTop: "1px solid var(--line)", paddingTop: 16 }}>
                <div className="row" style={{ gap: "12px 20px" }}>
                  <span className="eyebrow" style={{ flex: "0 0 52px", fontSize: 12 }}>{CATEGORY_LABEL[l.category]}</span>
                  <div className="stack" style={{ gap: 2, flex: "1 1 240px", minWidth: 0 }}>
                    <Link href={`/listings/${l.slug}`} style={{ fontWeight: 800, textDecoration: "none" }}>{l.title}</Link>
                    <span className="muted" style={{ fontSize: 14 }}>{formatDate(b.startDate)} – {formatDate(b.endDate)} · {b.units} {l.category === "car" ? "day" : "night"}{b.units > 1 ? "s" : ""} · Ref {b.reference}</span>
                  </div>
                  <b style={{ flex: "0 0 120px" }}>{formatMoney(b.totalAmount)}</b>
                  {expired ? <span className="pill pill-grey">Expired</span> : <StatusPill status={b.status} />}
                </div>
                {active && b.startDate >= today && (
                  <div className="row" style={{ gap: 8 }}>
                    {b.status === "pending_payment" && <Link className="btn btn-gold btn-sm" href={`/checkout/${b.reference}`}>Pay now</Link>}
                    <ModifyBooking id={b.id} start={b.startDate} end={b.endDate} today={today} />
                    <form action={cancelMyBooking}><input type="hidden" name="id" value={b.id} /><button className="btn btn-danger btn-sm">Cancel booking</button></form>
                  </div>
                )}
              </div>
            );
          })}
        </section>

        <section className="box stack" aria-labelledby="inq">
          <h2 id="inq" style={{ fontSize: 20 }}>Land &amp; house inquiries</h2>
          {inquiries.length === 0 && <p className="muted">No inquiries yet. <Link href="/land">Browse land</Link> or <Link href="/houses">houses</Link>.</p>}
          {inquiries.map(({ i, l }) => (
            <div key={i.id} className="row" style={{ gap: "12px 20px", borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <span className="eyebrow" style={{ flex: "0 0 52px", fontSize: 12 }}>{CATEGORY_LABEL[l.category]}</span>
              <div className="stack" style={{ gap: 2, flex: "1 1 240px", minWidth: 0 }}>
                <Link href={`/listings/${l.slug}`} style={{ fontWeight: 800, textDecoration: "none" }}>{l.title}</Link>
                <span className="muted" style={{ fontSize: 14 }}>Sent {formatDate(i.createdAt)}{i.adminNote ? ` · Note from our team: ${i.adminNote}` : ""}</span>
              </div>
              <b style={{ flex: "0 0 140px" }}>{formatMoney(l.price)}</b>
              <StatusPill status={i.status} />
              {deposit > 0 && l.status === "published" && (i.status === "new" || i.status === "in_discussion") && (
                <form action={startPayment}>
                  <input type="hidden" name="kind" value="deposit" /><input type="hidden" name="id" value={i.id} />
                  <button className="btn btn-gold btn-sm">Pay {deposit}% deposit ({formatMoney(Math.round((l.price * deposit) / 100))})</button>
                </form>
              )}
            </div>
          ))}
        </section>

        <section className="box stack" aria-labelledby="ins">
          <h2 id="ins" style={{ fontSize: 20 }}>Insurance quote requests</h2>
          {quotes.length === 0 && <p className="muted">No quote requests yet. <Link href="/insurance">Get a quote</Link>.</p>}
          {quotes.map((q) => (
            <div key={q.id} className="row" style={{ gap: "12px 20px", borderTop: "1px solid var(--line)", paddingTop: 16 }}>
              <div className="stack" style={{ gap: 2, flex: "1 1 240px" }}>
                <b>{q.coverType}</b>
                <span className="muted" style={{ fontSize: 14 }}>Requested {formatDate(q.createdAt)}{q.adminNote ? ` · ${q.adminNote}` : ""}</span>
              </div>
              <StatusPill status={q.status} />
            </div>
          ))}
        </section>

        <section className="box stack" aria-labelledby="pay">
          <h2 id="pay" style={{ fontSize: 20 }}>Payments &amp; receipts</h2>
          {payments.length === 0 ? <p className="muted">No payments yet.</p> : (
            <div className="table-wrap">
              <table className="data">
                <thead><tr><th>Date</th><th>Reference</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}><td>{formatDate(p.createdAt)}</td><td>{p.reference}</td><td>{p.channel === "mobile_money" ? "Mobile money" : p.channel === "card" ? "Card" : "—"}</td><td>{formatMoney(p.amount)}</td><td><StatusPill status={p.status} /></td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="box stack" aria-labelledby="prof" style={{ maxWidth: 560 }}>
          <h2 id="prof" style={{ fontSize: 20 }}>Profile</h2>
          <p className="muted" style={{ fontSize: 14 }}>Email: {user.email}</p>
          <ActionForm
            action={updateProfile}
            submit="Save profile"
            fields={[
              { name: "fullName", label: "Full name", defaultValue: user.fullName },
              { name: "phone", label: "Phone", type: "tel", defaultValue: user.phone },
              { name: "currentPassword", label: "Current password (only to change password)", type: "password", required: false, autoComplete: "current-password" },
              { name: "newPassword", label: "New password", type: "password", required: false, autoComplete: "new-password" },
            ]}
          />
        </section>
      </div>
    </div>
  );
}
