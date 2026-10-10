import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";

export default async function AdminPayments() {
  const rows = await db
    .select({ p: schema.payments, u: schema.users, b: schema.bookings })
    .from(schema.payments)
    .innerJoin(schema.users, eq(schema.payments.userId, schema.users.id))
    .leftJoin(schema.bookings, eq(schema.payments.bookingId, schema.bookings.id))
    .orderBy(desc(schema.payments.createdAt))
    .limit(300);
  return (
    <>
      <div className="row between">
        <h1 className="serif" style={{ fontSize: 32 }}>Payments</h1>
        <span className="hint">For full settlement reports and exports, use the Paystack dashboard.</span>
      </div>
      <section className="box table-wrap">
        <table className="data">
          <thead><tr><th>Date</th><th>Paystack reference</th><th>Customer</th><th>For</th><th>Method</th><th>Amount</th><th>Status</th></tr></thead>
          <tbody>
            {rows.map(({ p, u, b }) => (
              <tr key={p.id}>
                <td style={{ whiteSpace: "nowrap" }}>{formatDate(p.createdAt)}</td>
                <td>{p.reference}</td>
                <td>{u.fullName}</td>
                <td>{b ? `Booking ${b.reference}` : p.inquiryId ? "Property deposit" : "—"}</td>
                <td>{p.channel === "mobile_money" ? "Mobile money" : p.channel === "card" ? "Card" : "—"}</td>
                <td>{formatMoney(p.amount)}</td>
                <td><StatusPill status={p.status} /></td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={7} className="muted">No payments yet.</td></tr>}
          </tbody>
        </table>
      </section>
    </>
  );
}
