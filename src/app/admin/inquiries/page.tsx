import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatDate, formatMoney } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { setListingStatus, updateInquiry } from "../actions";

export default async function AdminInquiries() {
  const rows = await db
    .select({ i: schema.inquiries, l: schema.listings, u: schema.users })
    .from(schema.inquiries)
    .innerJoin(schema.listings, eq(schema.inquiries.listingId, schema.listings.id))
    .innerJoin(schema.users, eq(schema.inquiries.userId, schema.users.id))
    .orderBy(desc(schema.inquiries.createdAt))
    .limit(200);
  return (
    <>
      <h1 className="display" style={{ fontSize: 32 }}>Land &amp; house inquiries</h1>
      {rows.length === 0 && <p className="box muted">No inquiries yet.</p>}
      {rows.map(({ i, l, u }) => (
        <section key={i.id} className="box stack" style={{ gap: 12 }}>
          <div className="row between">
            <div className="stack" style={{ gap: 2 }}>
              <Link href={`/admin/listings/${l.id}`} style={{ fontWeight: 800 }}>{l.title}</Link>
              <span className="muted" style={{ fontSize: 14 }}>{formatMoney(l.price)} · listing is <StatusPill status={l.status} /></span>
            </div>
            <StatusPill status={i.status} />
          </div>
          <div className="stack" style={{ gap: 4 }}>
            <span><b>{u.fullName}</b> · <a href={`tel:${i.phone}`}>{i.phone}</a> · <a href={`mailto:${u.email}`}>{u.email}</a> · {formatDate(i.createdAt)}</span>
            <p style={{ whiteSpace: "pre-line", background: "var(--mist)", padding: 12, borderRadius: 8 }}>{i.message}</p>
          </div>
          <form action={updateInquiry} className="row" style={{ alignItems: "flex-end" }}>
            <input type="hidden" name="id" value={i.id} />
            <div className="field" style={{ flex: "0 1 200px" }}><label htmlFor={`s-${i.id}`}>Status</label>
              <select id={`s-${i.id}`} name="status" defaultValue={i.status}><option value="new">New</option><option value="in_discussion">In discussion</option><option value="deposit_paid">Deposit paid</option><option value="closed">Closed</option></select></div>
            <div className="field" style={{ flex: "3 1 300px" }}><label htmlFor={`n-${i.id}`}>Note to customer</label><input id={`n-${i.id}`} name="adminNote" defaultValue={i.adminNote} placeholder="e.g. Site visit booked for Saturday 10am" /></div>
            <label className="check"><input type="checkbox" name="notify" /> Email the customer</label>
            <button className="btn btn-ink btn-sm">Save</button>
          </form>
          {l.status === "published" && (
            <form action={setListingStatus} className="row">
              <input type="hidden" name="id" value={l.id} />
              <span className="hint">Agreed a sale?</span>
              <button name="status" value="reserved" className="btn btn-line btn-sm">Mark listing Reserved</button>
              <button name="status" value="sold" className="btn btn-line btn-sm">Mark listing Sold</button>
            </form>
          )}
        </section>
      ))}
    </>
  );
}
