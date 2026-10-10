import Link from "next/link";
import { desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";

const count = async (q: Promise<{ n: number }[]>) => (await q)[0]?.n ?? 0;
const n = sql<number>`count(*)::int`;

export default async function AdminDashboard() {
  const [published, upcoming, openInquiries, newQuotes, customers, revenue, recent] = await Promise.all([
    count(db.select({ n }).from(schema.listings).where(eq(schema.listings.status, "published"))),
    count(db.select({ n }).from(schema.bookings).where(sql`${schema.bookings.status} = 'confirmed' and ${schema.bookings.endDate} >= current_date`)),
    count(db.select({ n }).from(schema.inquiries).where(sql`${schema.inquiries.status} in ('new','in_discussion','deposit_paid')`)),
    count(db.select({ n }).from(schema.insuranceRequests).where(eq(schema.insuranceRequests.status, "new"))),
    count(db.select({ n }).from(schema.users).where(eq(schema.users.role, "customer"))),
    db.select({ total: sql<number>`coalesce(sum(${schema.payments.amount}),0)::bigint` }).from(schema.payments).where(sql`${schema.payments.status} = 'success' and ${schema.payments.paidAt} >= date_trunc('month', now())`),
    db.select({ b: schema.bookings, l: schema.listings, u: schema.users }).from(schema.bookings).innerJoin(schema.listings, eq(schema.bookings.listingId, schema.listings.id)).innerJoin(schema.users, eq(schema.bookings.userId, schema.users.id)).orderBy(desc(schema.bookings.createdAt)).limit(8),
  ]);
  return (
    <>
      <div className="row between">
        <h1 className="serif" style={{ fontSize: 32 }}>Dashboard</h1>
        <Link className="btn btn-gold" href="/admin/listings/new">+ New listing</Link>
      </div>
      <div className="stats">
        <div className="stat"><span>Published listings</span><b>{published}</b></div>
        <div className="stat"><span>Upcoming confirmed bookings</span><b>{upcoming}</b></div>
        <div className="stat"><span>Open inquiries</span><b>{openInquiries}</b></div>
        <div className="stat"><span>New insurance requests</span><b>{newQuotes}</b></div>
        <div className="stat"><span>Customers</span><b>{customers}</b></div>
        <div className="stat"><span>Paid this month</span><b>{formatMoney(Number(revenue[0]?.total ?? 0))}</b></div>
      </div>
      <section className="box stack">
        <div className="row between"><h2 style={{ fontSize: 20 }}>Latest bookings</h2><Link href="/admin/bookings">All bookings →</Link></div>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Ref</th><th>Listing</th><th>Customer</th><th>Dates</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {recent.map(({ b, l, u }) => (
                <tr key={b.id}><td>{b.reference}</td><td>{l.title}</td><td>{u.fullName}</td><td>{formatDate(b.startDate)} – {formatDate(b.endDate)}</td><td>{formatMoney(b.totalAmount)}</td><td><StatusPill status={b.status} /></td></tr>
              ))}
              {recent.length === 0 && <tr><td colSpan={6} className="muted">No bookings yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
