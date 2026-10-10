import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  bigint,
  boolean,
  timestamp,
  date,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const roleEnum = pgEnum("role", ["customer", "admin"]);
export const tokenTypeEnum = pgEnum("token_type", ["verify_email", "reset_password"]);
export const categoryEnum = pgEnum("category", ["stay", "car", "land", "house"]);
export const listingStatusEnum = pgEnum("listing_status", [
  "draft",
  "published",
  "unavailable",
  "reserved",
  "sold",
]);
export const mediaKindEnum = pgEnum("media_kind", ["image", "video"]);
export const bookingStatusEnum = pgEnum("booking_status", [
  "pending_payment",
  "confirmed",
  "cancelled",
  "completed",
]);
export const inquiryStatusEnum = pgEnum("inquiry_status", [
  "new",
  "in_discussion",
  "deposit_paid",
  "closed",
]);
export const insuranceStatusEnum = pgEnum("insurance_status", ["new", "quoted", "closed"]);
export const paymentStatusEnum = pgEnum("payment_status", ["pending", "success", "failed", "refunded"]);

// Money is stored in the smallest currency unit (pesewas), the same unit Paystack uses.
const money = (name: string) => bigint(name, { mode: "number" });

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone").notNull(),
  passwordHash: text("password_hash").notNull(),
  role: roleEnum("role").notNull().default("customer"),
  emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // sha256 of the cookie token
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
});

export const authTokens = pgTable("auth_tokens", {
  id: text("id").primaryKey(), // sha256 of the emailed token
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  type: tokenTypeEnum("type").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
});

export const listings = pgTable(
  "listings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    category: categoryEnum("category").notNull(),
    title: text("title").notNull(),
    slug: text("slug").notNull().unique(),
    description: text("description").notNull().default(""),
    location: text("location").notNull(), // e.g. "East Legon, Accra"
    region: text("region").notNull().default(""),
    price: money("price").notNull(), // per night (stay), per day (car), total (land/house)
    status: listingStatusEnum("status").notNull().default("draft"),
    featured: boolean("featured").notNull().default(false),
    // Stays & houses
    propertyType: text("property_type"),
    bedrooms: integer("bedrooms"),
    bathrooms: integer("bathrooms"),
    maxGuests: integer("max_guests"),
    amenities: text("amenities").array().notNull().default([]),
    // Cars
    make: text("make"),
    model: text("model"),
    year: integer("year"),
    vehicleType: text("vehicle_type"),
    transmission: text("transmission"),
    seats: integer("seats"),
    fuel: text("fuel"),
    // Land & houses
    plotSize: text("plot_size"),
    landUse: text("land_use"),
    titleType: text("title_type"),
    extra: jsonb("extra").$type<Record<string, string>>().notNull().default({}),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("listings_category_status_idx").on(t.category, t.status)],
);

export const media = pgTable(
  "media",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id, { onDelete: "cascade" }),
    kind: mediaKindEnum("kind").notNull(),
    url: text("url").notNull(),
    publicId: text("public_id"),
    sortOrder: integer("sort_order").notNull().default(0),
  },
  (t) => [index("media_listing_idx").on(t.listingId, t.sortOrder)],
);

export const bookings = pgTable(
  "bookings",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull().unique(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    listingId: uuid("listing_id")
      .notNull()
      .references(() => listings.id),
    startDate: date("start_date").notNull(), // check-in / pick-up
    endDate: date("end_date").notNull(), // check-out / return
    units: integer("units").notNull(), // nights or days
    unitPrice: money("unit_price").notNull(),
    totalAmount: money("total_amount").notNull(),
    guests: integer("guests"),
    status: bookingStatusEnum("status").notNull().default("pending_payment"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("bookings_listing_dates_idx").on(t.listingId, t.startDate, t.endDate)],
);

export const inquiries = pgTable("inquiries", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id),
  listingId: uuid("listing_id")
    .notNull()
    .references(() => listings.id),
  phone: text("phone").notNull(),
  message: text("message").notNull(),
  status: inquiryStatusEnum("status").notNull().default("new"),
  adminNote: text("admin_note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insuranceRequests = pgTable("insurance_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  coverType: text("cover_type").notNull(),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  phone: text("phone").notNull(),
  details: text("details").notNull().default(""),
  startDate: date("start_date"),
  status: insuranceStatusEnum("status").notNull().default("new"),
  adminNote: text("admin_note").notNull().default(""),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const payments = pgTable(
  "payments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    reference: text("reference").notNull(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id),
    bookingId: uuid("booking_id").references(() => bookings.id),
    inquiryId: uuid("inquiry_id").references(() => inquiries.id),
    amount: money("amount").notNull(),
    currency: text("currency").notNull(),
    status: paymentStatusEnum("status").notNull().default("pending"),
    channel: text("channel"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("payments_reference_idx").on(t.reference)],
);

export const settings = pgTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const auditLog = pgTable("audit_log", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id),
  action: text("action").notNull(),
  entity: text("entity").notNull(),
  entityId: text("entity_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Listing = typeof listings.$inferSelect;
export type Media = typeof media.$inferSelect;
export type Booking = typeof bookings.$inferSelect;
export type Category = (typeof categoryEnum.enumValues)[number];
