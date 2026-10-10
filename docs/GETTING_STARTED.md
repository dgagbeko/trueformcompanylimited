# Getting started: accounts, costs and going live

This guide sets up everything the website needs, using **free plans wherever possible**.
Prices were correct when this was written — check each provider's pricing page before you sign up.

## 1. The services you need

| What | Provider | Plan to start on | What you pay |
|---|---|---|---|
| Code storage | **GitHub** (you already have this repo) | Free | GH₵ 0 |
| Database (PostgreSQL) | **Neon** — neon.tech | Free (0.5 GB storage — enough for thousands of listings and bookings) | GH₵ 0 |
| Website hosting | **Vercel** — vercel.com | Hobby (free) for building and testing | GH₵ 0 while testing; see note below |
| Payments (card + mobile money) | **Paystack** — paystack.com/gh | No setup or monthly fee | A percentage of each successful payment (about 1.95% for local Ghana payments — confirm on Paystack's pricing page) |
| Photos & videos | **Cloudinary** — cloudinary.com | Free (25 monthly credits ≈ 25 GB of storage/bandwidth) | GH₵ 0 |
| Emails (verification, receipts) | **Resend** — resend.com | Free (3,000 emails/month, 100/day) | GH₵ 0 |
| Domain name | e.g. Namecheap, Cloudflare, or a .com.gh registrar | — | About US$10–15 per year for a .com; .com.gh costs more |

**Hosting note:** Vercel's free Hobby plan is for non-commercial use. Use it while you build and test.
When you start taking real bookings, either upgrade to Vercel Pro (about US$20/month) or move to a
host whose free/cheap tier allows business use, such as **Netlify** (free tier) or **Railway** (about US$5/month).
The code works on any of them — nothing in it is Vercel-specific.

**Realistic monthly cost at launch: GH₵ 0 – about US$20**, plus the yearly domain and Paystack's per-payment fee.
You only pay more when traffic grows past the free limits.

## 2. Create the accounts (about one hour)

### Neon (database)
1. Sign up at neon.tech with your GitHub account.
2. Create a project named `trueform`, region **Europe (Frankfurt)** or the closest to Ghana that is offered.
3. Copy the **connection string** (starts with `postgres://…`, ends with `?sslmode=require`). This is your `DATABASE_URL`.

### Paystack (payments)
1. Sign up at paystack.com/gh. You can use **test mode immediately** — no paperwork needed.
2. Go to **Settings → API Keys & Webhooks** and copy the **Test Secret Key** (`sk_test_…`). This is `PAYSTACK_SECRET_KEY`.
3. To accept real money, complete **Activate business** in the dashboard. Paystack asks for your business
   registration documents (Registrar-General certificate), a director's ID and a settlement bank or mobile money account.
   Approval usually takes a few days. Then switch to the **Live Secret Key** (`sk_live_…`).
4. After the site is deployed, set the **Webhook URL** in the same settings page to
   `https://YOUR-DOMAIN/api/paystack/webhook`. This confirms payments even if a customer closes their browser.
   Leave the callback URL blank — the site sends its own.

Test cards and test mobile money numbers are listed at paystack.com/docs/payments/test-payments.

### Cloudinary (photos & videos)
1. Sign up at cloudinary.com.
2. On the dashboard, copy **Cloud name**, **API Key** and **API Secret** → `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

### Resend (emails)
1. Sign up at resend.com and create an **API key** → `RESEND_API_KEY`.
2. Under **Domains**, add your domain and add the DNS records it shows you (at your domain registrar).
   Until the domain is verified, Resend only delivers to your own email address.
3. Set `EMAIL_FROM` to something like `TrueForm Excellence <no-reply@yourdomain.com>` and
   `ADMIN_NOTIFY_EMAIL` to the inbox that should receive new bookings, inquiries and quote requests.

## 3. Deploy the website (Vercel)

1. Sign in to vercel.com with GitHub → **Add New → Project** → import `dgagbeko/trueformcompanylimited`.
2. Under **Environment Variables**, add every variable from `.env.example` with your real values.
   Set `APP_URL` to the address the site will live at (e.g. `https://trueformexcellence.com`, or the
   `https://….vercel.app` address Vercel gives you at first).
3. Click **Deploy**. The build automatically creates/updates the database tables (`vercel-build` script).
4. Create the first admin account. On your own computer, with the Neon `DATABASE_URL` in a `.env` file:
   ```bash
   npm install
   npm run admin:create -- "Your Name" you@example.com "+233 24 000 0000" "AStrongPassw0rd"
   ```
   Then sign in on the website and open **Back-office** (top right) or go to `/admin`.
5. Add your domain in Vercel → **Settings → Domains**, and update `APP_URL` and the Paystack webhook URL to match.

**Netlify instead:** import the repo, set the build command to `npm run vercel-build`, and add the same environment variables.

## 4. Run it on your own computer (for developers)

Requirements: Node.js 20+ and a PostgreSQL database (a free Neon database works, or a local PostgreSQL).

```bash
cp .env.example .env          # then fill in DATABASE_URL at minimum
npm install
npm run db:migrate            # create the tables
npm run db:seed               # optional: 6 SAMPLE listings to see the site working
npm run admin:create -- "Test Admin" admin@example.com "+233200000000" "Admin12345"
npm run dev                   # open http://localhost:3000
```

Without `RESEND_API_KEY`, emails (including verification links) are printed in the terminal instead of sent.
Without Cloudinary keys, admins can still add photos by pasting an image link.

## 5. Before launch checklist

- [ ] Paystack business activated and live key set; webhook URL set to the live domain
- [ ] Resend domain verified; `EMAIL_FROM` uses that domain
- [ ] Sample listings deleted (they say "SAMPLE LISTING" in the description)
- [ ] Contact phone, email, address, cancellation hours and deposit % set in **Back-office → Site settings**
- [ ] Privacy policy and terms (`/privacy`, `/terms`) reviewed by a lawyer — they are drafts
- [ ] A test booking paid and refunded end-to-end in Paystack test mode
- [ ] Neon: turn on a paid plan or scheduled backups if you need point-in-time recovery beyond the free plan's history
