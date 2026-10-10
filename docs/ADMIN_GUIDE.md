# Admin guide: updating the website

Everything on the site — listings, photos, prices, availability, contact details and policies — is managed
from the **back-office** at `https://YOUR-DOMAIN/admin`. No coding or redeploying is needed; changes go
live the moment you save.

## Who can use the back-office

- Only accounts with the **admin** role can open `/admin`. Customers who try are sent back to the home page.
- The first admin is created with `npm run admin:create` (see GETTING_STARTED.md).
- To add a staff member: ask them to register a normal account on the website, then go to
  **Customers & admins** and click **Make admin**. Click **Remove admin** to take access away (this also signs them out).
- Every admin change is recorded in the **Activity log** (who did what, and when).

## Adding a listing

1. **Listings → + New listing**.
2. Choose the **category** — Short stay, Car rental, Land for sale or House for sale. The form shows the fields that
   category needs (bedrooms and guests for stays; make, seats and transmission for cars; plot size and land use for land, and so on).
3. Fill in the title, location, region and price:
   - Stays: price **per night** · Cars: **daily rate** · Land and houses: **asking price**.
4. Leave status as **Draft** and click **Create listing**. Drafts are invisible to the public.
5. On the next screen, **upload photos and videos** (or paste a link). The **first photo is the cover image** —
   use the ← → arrows to reorder. Images are resized and compressed automatically.
6. Change status to **Published** and click **Save changes**. The listing now appears in search and has its own shareable page.
   Use **Preview on website** to check it.
7. Tick **Feature on home page** to show it in "Hand-picked for you".

## Listing statuses

| Status | Who sees it | Use it when |
|---|---|---|
| Draft | Admins only | Still preparing the listing |
| Published | Everyone; open for booking or inquiries | It is ready |
| Unavailable | Hidden | A car is in the garage, a house is off the market, etc. |
| Reserved (land/houses) | Visible with a "Reserved" badge; no new inquiries | A buyer has paid a deposit / agreed terms |
| Sold (land/houses) | Visible with a "Sold" badge | The sale is complete |

**Deleting:** a listing with no bookings or inquiries is deleted. One with history is set to Unavailable instead,
so customers' records are kept.

## Bookings (stays and cars)

- The system **prevents double-booking**: overlapping dates for the same car or property are refused.
- A new booking holds its dates for **30 minutes** while the customer pays. Unpaid bookings then release the dates.
- When Paystack confirms payment, the booking becomes **Confirmed** and the customer gets an emailed receipt.
- **Bookings** page actions:
  - **Confirm (paid offline)** — for a customer who paid cash or by bank transfer.
  - **Mark completed** — after the stay or rental ends.
  - **Cancel & refund** — cancels and refunds the payment to the customer's card or mobile money wallet automatically through Paystack.
  - **Cancel, no refund** — cancels without refunding.
- Customers can change dates or cancel themselves from **My account**, up to the free-cancellation window set in Site settings.

## Land & house inquiries

1. A customer sends an inquiry from the listing page. You get an email (if `ADMIN_NOTIFY_EMAIL` is set) and it appears under **Land & house inquiries**.
2. Call or email them (their phone and email are shown), then update the **status** and write a **note to the customer**
   (e.g. "Site visit booked for Saturday 10am"). Tick **Email the customer** to send them the note.
3. The customer can pay a **deposit** (the % you set in Site settings) from their dashboard. The inquiry then shows **Deposit paid**.
4. When the sale is agreed, click **Mark listing Reserved**, and later **Mark listing Sold**.

## Insurance quote requests

Requests arrive under **Insurance requests** with the cover type, contact details and what the customer wants insured.
Write the quote in the note field, set the status to **Quoted**, and tick **Email the customer** to send it.

## Payments

**Payments** lists every payment attempt with its Paystack reference, method (card or mobile money) and status
(Pending, Paid, Failed, Refunded). For settlement reports and bookkeeping exports, use the Paystack dashboard.

## Site settings

**Site settings** controls text that appears across the website:
- Home page headline and sub-heading
- Support phone, support email and office address (footer and Contact page)
- Free-cancellation window (hours before start), and the cancellation policy text shown to customers
- Deposit percentage for reserving land and houses
- Insurance partner name
