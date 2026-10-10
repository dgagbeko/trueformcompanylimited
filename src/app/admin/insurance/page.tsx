import { desc } from "drizzle-orm";
import { db, schema } from "@/db";
import { formatDate } from "@/lib/format";
import { StatusPill } from "@/components/StatusPill";
import { updateInsurance } from "../actions";

export default async function AdminInsurance() {
  const rows = await db.select().from(schema.insuranceRequests).orderBy(desc(schema.insuranceRequests.createdAt)).limit(200);
  return (
    <>
      <h1 className="serif" style={{ fontSize: 32 }}>Insurance quote requests</h1>
      {rows.length === 0 && <p className="box muted">No requests yet.</p>}
      {rows.map((r) => (
        <section key={r.id} className="box stack" style={{ gap: 12 }}>
          <div className="row between">
            <b style={{ color: "var(--navy)" }}>{r.coverType}</b>
            <StatusPill status={r.status} />
          </div>
          <span><b>{r.fullName}</b> · <a href={`tel:${r.phone}`}>{r.phone}</a> · <a href={`mailto:${r.email}`}>{r.email}</a> · {formatDate(r.createdAt)}{r.startDate ? ` · Start ${formatDate(r.startDate)}` : ""}</span>
          {r.details && <p style={{ background: "var(--mist)", padding: 12, borderRadius: 8 }}>{r.details}</p>}
          <form action={updateInsurance} className="row" style={{ alignItems: "flex-end" }}>
            <input type="hidden" name="id" value={r.id} />
            <div className="field" style={{ flex: "0 1 180px" }}><label htmlFor={`s-${r.id}`}>Status</label>
              <select id={`s-${r.id}`} name="status" defaultValue={r.status}><option value="new">New</option><option value="quoted">Quoted</option><option value="closed">Closed</option></select></div>
            <div className="field" style={{ flex: "3 1 300px" }}><label htmlFor={`n-${r.id}`}>Quote / note to customer</label><input id={`n-${r.id}`} name="adminNote" defaultValue={r.adminNote} placeholder="e.g. Comprehensive cover: GH₵ 3,200 per year" /></div>
            <label className="check"><input type="checkbox" name="notify" /> Email the customer</label>
            <button className="btn btn-navy btn-sm">Save</button>
          </form>
        </section>
      ))}
    </>
  );
}
