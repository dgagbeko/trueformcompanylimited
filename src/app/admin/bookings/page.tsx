import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { CATEGORY_LABEL, formatDate, formatMoney } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { adminBookingAction } from "../actions";

export default async function AdminBookings({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status = "" } = await searchParams;
  const valid = ["pending_payment", "confirmed", "cancelled", "completed"].includes(status);
  const rows = await db
    .select({
      b: schema.bookings,
      l: schema.listings,
      u: schema.users,
      paid: sql<string | null>`(select p.status from payments p where p.booking_id = ${schema.bookings.id} order by (p.status = 'success') desc, p.created_at desc limit 1)`,
    })
    .from(schema.bookings)
    .innerJoin(schema.listings, eq(schema.bookings.listingId, schema.listings.id))
    .innerJoin(schema.users, eq(schema.bookings.userId, schema.users.id))
    .where(valid ? eq(schema.bookings.status, status as "confirmed") : undefined)
    .orderBy(desc(schema.bookings.startDate))
    .limit(200);
  const tabs = [["", "All"], ["confirmed", "Confirmed"], ["pending_payment", "Awaiting payment"], ["completed", "Completed"], ["cancelled", "Cancelled"]];
  return (
    <>
      <h1 className="serif" style={{ fontSize: 32 }}>Bookings</h1>
      <section className="box stack">
        <div className="row">
          {tabs.map(([v, label]) => <Link key={v} href={v ? `/admin/bookings?status=${v}` : "/admin/bookings"} className={`btn btn-sm ${status === v ? "btn-navy" : "btn-line"}`}>{label}</Link>)}
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Ref</th><th>Listing</th><th>Customer</th><th>Dates</th><th>Total</th><th>Payment</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {rows.map(({ b, l, u, paid }) => (
                <tr key={b.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{b.reference}</td>
                  <td><span className="muted" style={{ fontSize: 12 }}>{CATEGORY_LABEL[l.category]}</span><br />{l.title}</td>
                  <td>{u.fullName}<br /><a href={`tel:${u.phone}`} style={{ fontSize: 13 }}>{u.phone}</a></td>
                  <td style={{ whiteSpace: "nowrap" }}>{formatDate(b.startDate)} –<br />{formatDate(b.endDate)}{b.guests ? ` · ${b.guests} guests` : ""}</td>
                  <td>{formatMoney(b.totalAmount)}</td>
                  <td>{paid ? <StatusPill status={paid} /> : <span className="muted">—</span>}</td>
                  <td><StatusPill status={b.status} /></td>
                  <td>
                    <form action={adminBookingAction} className="row" style={{ gap: 6, flexWrap: "nowrap" }}>
                      <input type="hidden" name="id" value={b.id} />
                      <label htmlFor={`op-${b.id}`} className="sr-only">Action</label>
                      <select id={`op-${b.id}`} name="op" className="input" style={{ minHeight: 38, width: "auto" }} defaultValue="">
                        <option value="" disabled>Choose…</option>
                        {b.status === "pending_payment" && <option value="confirm">Confirm (paid offline)</option>}
                        {b.status === "confirmed" && <option value="complete">Mark completed</option>}
                        {(b.status === "confirmed" || b.status === "pending_payment") && <option value="cancel_refund">Cancel &amp; refund</option>}
                        {(b.status === "confirmed" || b.status === "pending_payment") && <option value="cancel">Cancel, no refund</option>}
                      </select>
                      <button className="btn btn-line btn-sm">Apply</button>
                    </form>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={8} className="muted">No bookings.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
