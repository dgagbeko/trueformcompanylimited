"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireAdmin } from "@/lib/auth";
import { audit } from "@/lib/audit";
import { cancelBooking } from "@/lib/bookings";
import { cloudinaryConfigured, signUpload } from "@/lib/cloudinary";
import { appUrl, sendEmail } from "@/lib/email";
import { slugify, toMinor } from "@/lib/format";
import { SETTING_DEFAULTS, type SettingKey } from "@/lib/settings";
import type { FormState } from "@/app/(site)/actions";

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const optStr = (fd: FormData, k: string) => str(fd, k) || null;
const optInt = (fd: FormData, k: string) => (/^\d+$/.test(str(fd, k)) ? Number(str(fd, k)) : null);

const CATEGORIES = ["stay", "car", "land", "house"] as const;
const STATUSES = ["draft", "published", "unavailable", "reserved", "sold"] as const;

/* ---------- Listings ---------- */

export async function saveListing(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const category = str(fd, "category") as (typeof CATEGORIES)[number];
  const status = str(fd, "status") as (typeof STATUSES)[number];
  if (!CATEGORIES.includes(category)) return { error: "Choose a category." };
  if (!STATUSES.includes(status)) return { error: "Choose a status." };
  const title = str(fd, "title");
  const location = str(fd, "location");
  const price = toMinor(str(fd, "price"));
  if (title.length < 3) return { error: "Title is required." };
  if (!location) return { error: "Location is required." };
  if (price === null || price <= 0) return { error: "Enter a valid price in GH₵." };

  const values = {
    category,
    status,
    title,
    location,
    price,
    region: str(fd, "region"),
    description: str(fd, "description"),
    featured: fd.get("featured") === "on",
    propertyType: optStr(fd, "propertyType"),
    bedrooms: optInt(fd, "bedrooms"),
    bathrooms: optInt(fd, "bathrooms"),
    maxGuests: optInt(fd, "maxGuests"),
    amenities: str(fd, "amenities").split(/\n|,/).map((s) => s.trim()).filter(Boolean),
    make: optStr(fd, "make"),
    model: optStr(fd, "model"),
    year: optInt(fd, "year"),
    vehicleType: optStr(fd, "vehicleType"),
    transmission: optStr(fd, "transmission"),
    seats: optInt(fd, "seats"),
    fuel: optStr(fd, "fuel"),
    plotSize: optStr(fd, "plotSize"),
    landUse: optStr(fd, "landUse"),
    titleType: optStr(fd, "titleType"),
    updatedAt: new Date(),
  };

  let listingId = id;
  if (id) {
    await db.update(schema.listings).set(values).where(eq(schema.listings.id, id));
    await audit(admin.id, `updated listing (${status})`, "listing", id);
  } else {
    // Unique, readable URL for each listing (FR-LIST-07).
    const base = slugify(`${title} ${location}`) || "listing";
    let slug = base;
    for (let n = 2; (await db.select({ id: schema.listings.id }).from(schema.listings).where(eq(schema.listings.slug, slug))).length; n++) slug = `${base}-${n}`;
    const [row] = await db.insert(schema.listings).values({ ...values, slug }).returning({ id: schema.listings.id });
    listingId = row.id;
    await audit(admin.id, "created listing", "listing", listingId);
  }
  revalidatePath("/", "layout");
  if (!id) redirect(`/admin/listings/${listingId}?created=1`);
  return { ok: "Listing saved." };
}

export async function deleteListing(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const used =
    (await db.select({ id: schema.bookings.id }).from(schema.bookings).where(eq(schema.bookings.listingId, id)).limit(1)).length +
    (await db.select({ id: schema.inquiries.id }).from(schema.inquiries).where(eq(schema.inquiries.listingId, id)).limit(1)).length;
  if (used > 0) {
    // Keep history intact: listings with bookings or inquiries are hidden, not deleted.
    await db.update(schema.listings).set({ status: "unavailable", updatedAt: new Date() }).where(eq(schema.listings.id, id));
    await audit(admin.id, "archived listing (has bookings/inquiries)", "listing", id);
  } else {
    await db.delete(schema.listings).where(eq(schema.listings.id, id));
    await audit(admin.id, "deleted listing", "listing", id);
  }
  revalidatePath("/", "layout");
  redirect("/admin/listings");
}

export async function setListingStatus(fd: FormData) {
  const admin = await requireAdmin();
  const status = str(fd, "status") as (typeof STATUSES)[number];
  if (!STATUSES.includes(status)) return;
  await db.update(schema.listings).set({ status, updatedAt: new Date() }).where(eq(schema.listings.id, str(fd, "id")));
  await audit(admin.id, `set listing status to ${status}`, "listing", str(fd, "id"));
  revalidatePath("/", "layout");
}

/* ---------- Media ---------- */

export async function getUploadSignature(listingId: string) {
  await requireAdmin();
  if (!cloudinaryConfigured()) return null;
  return signUpload(`trueform/listings/${listingId}`);
}

export async function addMedia(listingId: string, url: string, kind: "image" | "video", publicId: string | null) {
  const admin = await requireAdmin();
  if (!/^https:\/\//.test(url)) return { error: "Media must be an https:// URL." };
  const [last] = await db
    .select({ max: sql<number>`coalesce(max(${schema.media.sortOrder}), -1)` })
    .from(schema.media)
    .where(eq(schema.media.listingId, listingId));
  await db.insert(schema.media).values({ listingId, url, kind, publicId, sortOrder: Number(last?.max ?? -1) + 1 });
  await audit(admin.id, `added ${kind}`, "listing", listingId);
  revalidatePath(`/admin/listings/${listingId}`);
  revalidatePath("/", "layout");
  return { ok: true };
}

export async function removeMedia(fd: FormData) {
  const admin = await requireAdmin();
  const [m] = await db.delete(schema.media).where(eq(schema.media.id, str(fd, "id"))).returning();
  if (m) {
    await audit(admin.id, `removed ${m.kind}`, "listing", m.listingId);
    revalidatePath(`/admin/listings/${m.listingId}`);
  }
  revalidatePath("/", "layout");
}

/**
 * Save the full order of a listing's photos/videos exactly as the admin sees it.
 * Sending the whole order (instead of "move one step") means quick repeated clicks
 * can never undo each other. The first image is the cover (FR-LIST-05).
 */
export async function reorderMedia(listingId: string, orderedIds: string[]) {
  await requireAdmin();
  await db.transaction(async (tx) => {
    // Lock this listing's media rows so two saves cannot interleave.
    const rows = await tx.select({ id: schema.media.id }).from(schema.media).where(eq(schema.media.listingId, listingId)).for("update");
    const known = new Set(rows.map((r) => r.id));
    const order = orderedIds.filter((id) => known.has(id));
    // Anything not in the submitted list (e.g. added in another tab) keeps its place at the end.
    for (const r of rows) if (!order.includes(r.id)) order.push(r.id);
    for (const [n, id] of order.entries()) await tx.update(schema.media).set({ sortOrder: n }).where(eq(schema.media.id, id));
  });
  revalidatePath(`/admin/listings/${listingId}`);
  revalidatePath("/", "layout");
}

/* ---------- Bookings, inquiries, insurance ---------- */

export async function adminBookingAction(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const op = str(fd, "op");
  if (op === "cancel_refund" || op === "cancel") {
    await cancelBooking(id, op === "cancel_refund");
    await audit(admin.id, op === "cancel_refund" ? "cancelled booking with refund" : "cancelled booking", "booking", id);
  } else if (op === "complete") {
    await db.update(schema.bookings).set({ status: "completed", updatedAt: new Date() }).where(eq(schema.bookings.id, id));
    await audit(admin.id, "marked booking completed", "booking", id);
  } else if (op === "confirm") {
    // Manual confirmation, e.g. for an offline (cash/bank) payment.
    await db.update(schema.bookings).set({ status: "confirmed", updatedAt: new Date() }).where(eq(schema.bookings.id, id));
    await audit(admin.id, "confirmed booking manually", "booking", id);
  }
  revalidatePath("/admin/bookings");
}

export async function updateInquiry(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status") as "new" | "in_discussion" | "deposit_paid" | "closed";
  const note = str(fd, "adminNote");
  const [inq] = await db.update(schema.inquiries).set({ status, adminNote: note }).where(eq(schema.inquiries.id, id)).returning();
  await audit(admin.id, `updated inquiry to ${status}`, "inquiry", id);
  if (inq && fd.get("notify") === "on") {
    const [row] = await db
      .select({ u: schema.users, l: schema.listings })
      .from(schema.users)
      .innerJoin(schema.listings, eq(schema.listings.id, inq.listingId))
      .where(eq(schema.users.id, inq.userId));
    if (row)
      await sendEmail(
        row.u.email,
        `Update on your inquiry: ${row.l.title}`,
        [`Hello ${row.u.fullName},`, note || "There is an update on your inquiry.", `Status: ${status.replace("_", " ")}`],
        { label: "View in my account", url: `${appUrl()}/account` },
      );
  }
  revalidatePath("/admin/inquiries");
}

export async function updateInsurance(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const status = str(fd, "status") as "new" | "quoted" | "closed";
  const note = str(fd, "adminNote");
  const [req] = await db.update(schema.insuranceRequests).set({ status, adminNote: note }).where(eq(schema.insuranceRequests.id, id)).returning();
  await audit(admin.id, `updated insurance request to ${status}`, "insurance", id);
  if (req && fd.get("notify") === "on")
    await sendEmail(req.email, `Your ${req.coverType} quote`, [`Hello ${req.fullName},`, note || "There is an update on your quote request."]);
  revalidatePath("/admin/insurance");
}

/* ---------- Users & settings ---------- */

export async function setUserRole(fd: FormData) {
  const admin = await requireAdmin();
  const id = str(fd, "id");
  const role = str(fd, "role") === "admin" ? "admin" : "customer";
  if (id === admin.id) return; // Admins cannot demote themselves and lock everyone out.
  await db.update(schema.users).set({ role }).where(eq(schema.users.id, id));
  if (role === "customer") await db.delete(schema.sessions).where(eq(schema.sessions.userId, id));
  await audit(admin.id, `set role to ${role}`, "user", id);
  revalidatePath("/admin/users");
}

export async function saveSettings(_: FormState, fd: FormData): Promise<FormState> {
  const admin = await requireAdmin();
  for (const key of Object.keys(SETTING_DEFAULTS) as SettingKey[]) {
    if (!fd.has(key)) continue;
    const value = str(fd, key);
    await db.insert(schema.settings).values({ key, value }).onConflictDoUpdate({ target: schema.settings.key, set: { value } });
  }
  await audit(admin.id, "updated site settings", "settings");
  revalidatePath("/", "layout");
  return { ok: "Settings saved. The website is updated." };
}
