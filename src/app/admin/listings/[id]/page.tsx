import Link from "next/link";
import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { cloudinaryConfigured } from "@/lib/cloudinary";
import { ListingForm } from "@/components/admin/ListingForm";
import { MediaManager } from "@/components/admin/MediaManager";
import { StatusPill } from "@/components/StatusPill";
import { deleteListing } from "../../actions";

export default async function EditListing({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ created?: string }> }) {
  const { id } = await params;
  const { created } = await searchParams;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [listing] = await db.select().from(schema.listings).where(eq(schema.listings.id, id));
  if (!listing) notFound();
  const items = await db.select().from(schema.media).where(eq(schema.media.listingId, id)).orderBy(asc(schema.media.sortOrder));
  return (
    <>
      <div className="row between">
        <div className="stack" style={{ gap: 6 }}>
          <Link href="/admin/listings" style={{ fontSize: 14 }}>← All listings</Link>
          <h1 className="serif" style={{ fontSize: 32 }}>{listing.title}</h1>
          <span className="row" style={{ gap: 10 }}><StatusPill status={listing.status} /><Link href={`/listings/${listing.slug}`} target="_blank">Preview on website ↗</Link></span>
        </div>
      </div>
      {created && <p className="alert alert-ok">Listing created.{listing.status === "draft" ? " Add photos and videos, then change the status to Published and save." : ""}</p>}
      <MediaManager listingId={id} items={items} cloudinary={cloudinaryConfigured()} />
      <ListingForm listing={listing} />
      <section className="box stack">
        <h2 style={{ fontSize: 18 }}>Delete listing</h2>
        <p className="muted">Listings with bookings or inquiries are archived (set to Unavailable) instead of deleted, so customer history is kept.</p>
        <form action={deleteListing}><input type="hidden" name="id" value={id} /><button className="btn btn-danger">Delete listing</button></form>
      </section>
    </>
  );
}
