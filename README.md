# TrueForm Excellence — multi-service marketplace

One website and one customer account for **short stays**, **car rentals**, **land sales**, **house sales** and **insurance quotes**,
with card and mobile money payments through Paystack and a back-office for staff.

- **Setting up accounts, costs and deploying:** [docs/GETTING_STARTED.md](docs/GETTING_STARTED.md)
- **How admins update listings and site details:** [docs/ADMIN_GUIDE.md](docs/ADMIN_GUIDE.md)

## Stack

| Layer | Choice |
|---|---|
| Web app | Next.js 16 (App Router, Server Actions), React 19, TypeScript |
| Database | PostgreSQL via Drizzle ORM (`src/db/schema.ts`, migrations in `drizzle/`) |
| Payments | Paystack hosted checkout — card + mobile money (`src/lib/paystack.ts`) |
| Media | Cloudinary direct uploads with automatic resizing (`src/lib/cloudinary.ts`) |
| Email | Resend REST API (`src/lib/email.ts`); printed to the console when no key is set |
| Auth | Email + password (bcrypt), email verification, password reset, DB-backed sessions (`src/lib/auth.ts`) |

## Quick start

```bash
cp .env.example .env     # set DATABASE_URL at minimum
npm install
npm run db:migrate
npm run db:seed          # optional sample listings
npm run admin:create -- "Test Admin" admin@example.com "+233200000000" "Admin12345"
npm run dev
```

## Where things are

```
src/app/(site)/          public website, customer account, checkout
  actions.ts             bookings, payments, inquiries, insurance, contact
  auth-actions.ts        register, login, verification, password reset, profile
src/app/admin/           back-office pages and admin actions
src/app/payments/callback  Paystack return URL (verifies the payment server-side)
src/app/api/paystack/webhook  Paystack webhook (signature-checked)
src/lib/bookings.ts      availability, double-booking prevention, payment confirmation, refunds
src/lib/listings.ts      search and filters
```

## Requirements coverage (SRS v1.0, MVP)

- Accounts: sign-up with name/email/phone, email verification before booking or inquiring, login/logout, password reset, profile editing, password strength rule.
- Listings: multiple images + video, cover image, Draft/Published/Unavailable/Reserved/Sold, unique shareable URLs, Cloudinary compression.
- Search: keyword/location, price range, bedrooms/guests, car type/transmission/seats, land use, date availability, sorting.
- Cars & stays: date-range booking, total cost calculation, double-booking prevention (row lock + overlap check), modify and cancel.
- Land & houses: inquiries routed to admins with email notification, status tracking for customers, optional deposit-to-reserve payment.
- Payments: Paystack card + mobile money, receipt email on success, clear failure message, refunds on cancellation, payment status for admins.
- Back-office: role-based access, listing CRUD, media upload/reorder/remove, bookings/inquiries/insurance management, users, dashboard totals, activity log, site settings.
- Insurance (added to the SRS scope): motor/home/travel/health quote requests, managed in the back-office.
