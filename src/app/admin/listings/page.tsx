import Link from "next/link";
import { and, desc, eq, ilike, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import { CATEGORY_LABEL, formatMoney } from "@/lib/format";
import { priceUnit } from "@/lib/listings";
import { StatusPill } from "@/components/StatusPill";

export default async function AdminListings({ searchParams }: { searchParams: Promise<{ category?: string; q?: string }> }) {
  const { category = "", q = "" } = await searchParams;
  const conds: SQL[] = [];
  if (["stay", "car", "land", "house"].includes(category)) conds.push(eq(schema.listings.category, category as "stay"));
  if (q) conds.push(ilike(schema.listings.title, `%${q.replace(/[%_]/g, "")}%`));
  const rows = await db
    .select({ l: schema.listings, media: sql<number>`(select count(*)::int from media m where m.listing_id = ${schema.listings.id})` })
    .from(schema.listings)
    .where(conds.length ? and(...conds) : undefined)
    .orderBy(desc(schema.listings.updatedAt));
  const tabs = [["", "All"], ["stay", "Stays"], ["car", "Cars"], ["land", "Land"], ["house", "Houses"]];
  return (
    <>
      <div className="row between">
        <h1 className="serif" style={{ fontSize: 32 }}>Listings</h1>
        <Link className="btn btn-gold" href="/admin/listings/new">+ New listing</Link>
      </div>
      <section className="box stack">
        <form className="row">
          {tabs.map(([v, label]) => (
            <Link key={v} href={v ? `/admin/listings?category=${v}` : "/admin/listings"} className={`btn btn-sm ${category === v ? "btn-navy" : "btn-line"}`}>{label}</Link>
          ))}
          {category && <input type="hidden" name="category" value={category} />}
          <label htmlFor="q" className="sr-only">Search listings</label>
          <input id="q" name="q" className="input" placeholder="Search by title…" defaultValue={q} style={{ marginLeft: "auto", maxWidth: 260 }} />
        </form>
        <div className="table-wrap">
          <table className="data">
            <thead><tr><th>Listing</th><th>Category</th><th>Location</th><th>Price</th><th>Media</th><th>Status</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {rows.map(({ l, media }) => (
                <tr key={l.id}>
                  <td style={{ fontWeight: 800, color: "var(--navy)" }}>{l.title}{l.featured && <span className="pill pill-info" style={{ marginLeft: 8 }}>Featured</span>}</td>
                  <td>{CATEGORY_LABEL[l.category]}</td>
                  <td>{l.location}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{formatMoney(l.price)} {priceUnit(l.category)}</td>
                  <td>{media}</td>
                  <td><StatusPill status={l.status} /></td>
                  <td style={{ whiteSpace: "nowrap" }}><Link href={`/admin/listings/${l.id}`} style={{ fontWeight: 700 }}>Edit</Link> · <Link href={`/listings/${l.slug}`}>View</Link></td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td colSpan={7} className="muted">No listings yet. Click “New listing” to add the first one.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
