import "server-only";
import { and, asc, desc, eq, gt, gte, ilike, inArray, lte, notExists, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";
import type { Category, Listing, Media } from "@/db/schema";
import { isIsoDate } from "./format";
import { PAYMENT_HOLD_MINUTES } from "./bookings";

export type ListingWithCover = Listing & { cover: Media | null };

async function attachCovers(rows: Listing[]): Promise<ListingWithCover[]> {
  if (rows.length === 0) return [];
  const all = await db
    .select()
    .from(schema.media)
    .where(and(inArray(schema.media.listingId, rows.map((r) => r.id)), eq(schema.media.kind, "image")))
    .orderBy(asc(schema.media.sortOrder));
  const first = new Map<string, Media>();
  for (const m of all) if (!first.has(m.listingId)) first.set(m.listingId, m);
  return rows.map((r) => ({ ...r, cover: first.get(r.id) ?? null }));
}

export type SearchParams = Record<string, string | string[] | undefined>;
const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)?.trim() || "";
const int = (v: string) => (/^\d+$/.test(v) ? Number(v) : null);

/** Public search: published listings only, with category-specific filters (FR-SRCH-01..06). */
export async function searchListings(category: Category, sp: SearchParams) {
  const conds: SQL[] = [eq(schema.listings.category, category), inArray(schema.listings.status, ["published", "reserved", "sold"])];
  const q = one(sp.q);
  if (q) {
    const like = `%${q.replace(/[%_]/g, "")}%`;
    conds.push(or(ilike(schema.listings.title, like), ilike(schema.listings.location, like), ilike(schema.listings.region, like))!);
  }
  const min = int(one(sp.min));
  const max = int(one(sp.max));
  if (min !== null) conds.push(gte(schema.listings.price, min * 100));
  if (max !== null) conds.push(lte(schema.listings.price, max * 100));
  const bedrooms = int(one(sp.bedrooms));
  if (bedrooms) conds.push(gte(schema.listings.bedrooms, bedrooms));
  const guests = int(one(sp.guests));
  if (guests) conds.push(gte(schema.listings.maxGuests, guests));
  const seats = int(one(sp.seats));
  if (seats) conds.push(gte(schema.listings.seats, seats));
  const type = one(sp.type);
  if (type) conds.push(category === "car" ? eq(schema.listings.vehicleType, type) : eq(schema.listings.propertyType, type));
  const transmission = one(sp.transmission);
  if (transmission) conds.push(eq(schema.listings.transmission, transmission));
  const landUse = one(sp.use);
  if (landUse) conds.push(eq(schema.listings.landUse, landUse));

  // Availability filter for stays and cars (FR-SRCH-04).
  const start = one(sp.start);
  const end = one(sp.end);
  if ((category === "stay" || category === "car") && isIsoDate(start) && isIsoDate(end) && start < end) {
    const holdStart = new Date(Date.now() - PAYMENT_HOLD_MINUTES * 60_000);
    conds.push(
      notExists(
        db
          .select({ one: sql`1` })
          .from(schema.bookings)
          .where(
            and(
              eq(schema.bookings.listingId, schema.listings.id),
              sql`${schema.bookings.startDate} < ${end}`,
              sql`${schema.bookings.endDate} > ${start}`,
              or(
                eq(schema.bookings.status, "confirmed"),
                and(eq(schema.bookings.status, "pending_payment"), gt(schema.bookings.createdAt, holdStart)),
              ),
            ),
          ),
      ),
    );
  }

  const sort = one(sp.sort);
  const order =
    sort === "price_asc" ? [asc(schema.listings.price)] : sort === "price_desc" ? [desc(schema.listings.price)] : sort === "newest" ? [desc(schema.listings.createdAt)] : [desc(schema.listings.featured), desc(schema.listings.createdAt)];

  const rows = await db.select().from(schema.listings).where(and(...conds)).orderBy(...order).limit(60);
  return attachCovers(rows);
}

export async function featuredListings(limit = 4) {
  let rows = await db
    .select()
    .from(schema.listings)
    .where(and(eq(schema.listings.status, "published"), eq(schema.listings.featured, true)))
    .orderBy(desc(schema.listings.updatedAt))
    .limit(limit);
  if (rows.length < limit) {
    const more = await db
      .select()
      .from(schema.listings)
      .where(and(eq(schema.listings.status, "published"), eq(schema.listings.featured, false)))
      .orderBy(desc(schema.listings.createdAt))
      .limit(limit - rows.length);
    rows = rows.concat(more);
  }
  return attachCovers(rows);
}

/** Only listings the public may see (FR-LIST-04). Admins can preview drafts. */
export async function getPublicListing(slug: string, isAdmin: boolean) {
  const [listing] = await db.select().from(schema.listings).where(eq(schema.listings.slug, slug));
  if (!listing) return null;
  if (!isAdmin && listing.status === "draft") return null;
  const gallery = await db.select().from(schema.media).where(eq(schema.media.listingId, listing.id)).orderBy(asc(schema.media.sortOrder));
  return { listing, gallery };
}

/** Short attribute line shown on result cards. */
export function listingMeta(l: Listing): string {
  const parts: (string | null | false)[] =
    l.category === "stay"
      ? [l.bedrooms != null && `${l.bedrooms} bedroom${l.bedrooms === 1 ? "" : "s"}`, l.bathrooms != null && `${l.bathrooms} bath`, l.maxGuests != null && `${l.maxGuests} guests`]
      : l.category === "car"
        ? [l.vehicleType, l.transmission, l.seats != null && `${l.seats} seats`]
        : l.category === "land"
          ? [l.plotSize, l.landUse]
          : [l.bedrooms != null && `${l.bedrooms} bed`, l.bathrooms != null && `${l.bathrooms} bath`, l.propertyType];
  return parts.filter(Boolean).join(" · ");
}

export const priceUnit = (c: Category) => (c === "stay" ? "/ night" : c === "car" ? "/ day" : "");
