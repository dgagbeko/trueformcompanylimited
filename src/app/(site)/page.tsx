import Link from "next/link";
import { HeroSearch } from "@/components/HeroSearch";
import { ListingCard } from "@/components/ListingCard";
import { Icon } from "@/components/Icon";
import { featuredListings } from "@/lib/listings";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

const SERVICES = [
  { title: "Short stays", body: "Furnished homes, apartments and rooms by the night.", cta: "Find a stay", href: "/stays", icon: "bed" },
  { title: "Car rentals", body: "Sedans, SUVs and vans for any date range.", cta: "Rent a car", href: "/cars", icon: "car" },
  { title: "Land sales", body: "Plots with clear location, size and zoning.", cta: "Browse land", href: "/land", icon: "land" },
  { title: "House sales", body: "Homes for sale with full details and media.", cta: "Browse houses", href: "/houses", icon: "home" },
  { title: "Insurance", body: "Motor, home, travel and health cover.", cta: "Get a quote", href: "/insurance", icon: "shield" },
] as const;

const STEPS = [
  ["Create and verify your account", "Sign up with your name, email and phone, then confirm the link we email you."],
  ["Book, inquire or request a quote", "Choose dates for stays and cars, send an inquiry on land or houses, or request insurance cover."],
  ["Pay securely and manage it all", "Pay by card or mobile money, get an emailed receipt, and modify or cancel from your dashboard."],
];

export default async function HomePage() {
  const [settings, featured] = await Promise.all([getSettings(), featuredListings(4)]);
  return (
    <>
      <section className="hero">
        <div className="inner">
          <div className="stack" style={{ gap: 20 }}>
            <span className="eyebrow" style={{ color: "var(--gold)", letterSpacing: ".2em" }}>STAYS · CARS · LAND · HOMES · INSURANCE</span>
            <h1>{settings.heroTitle}</h1>
            <p>{settings.heroSubtitle}</p>
          </div>
          <HeroSearch />
        </div>
      </section>

      <section className="section" style={{ paddingBottom: 40 }}>
        <div className="wrap">
          <div className="section-head">
            <div className="stack" style={{ gap: 10 }}>
              <span className="eyebrow">Our services</span>
              <h2 className="section-title">Five services, one account</h2>
            </div>
            <p className="muted" style={{ maxWidth: 440, lineHeight: 1.6 }}>
              Register once, verify your email, and manage every booking, inquiry and quote from your personal dashboard.
            </p>
          </div>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 18 }}>
            {SERVICES.map((s) => (
              <Link key={s.title} href={s.href} className="card service-card">
                <span className="icon-tile"><Icon name={s.icon} /></span>
                <span style={{ fontSize: 19, fontWeight: 800, color: "var(--navy)" }}>{s.title}</span>
                <span className="muted" style={{ fontSize: 15, lineHeight: 1.55 }}>{s.body}</span>
                <span style={{ marginTop: "auto", fontSize: 14, fontWeight: 700, color: "var(--gold-text)" }}>{s.cta} →</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section" style={{ paddingTop: 40 }}>
          <div className="wrap">
            <div className="section-head">
              <div className="stack" style={{ gap: 10 }}>
                <span className="eyebrow">Featured</span>
                <h2 className="section-title">Hand-picked for you</h2>
              </div>
              <Link className="btn btn-line" href="/stays">View all stays</Link>
            </div>
            <div className="grid">
              {featured.map((l) => <ListingCard key={l.id} l={l} showCategory />)}
            </div>
          </div>
        </section>
      )}

      <section className="section band">
        <div className="wrap stack" style={{ gap: 40 }}>
          <h2 className="section-title" style={{ textAlign: "center" }}>How it works</h2>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
            {STEPS.map(([t, b], i) => (
              <div key={t} className="box stack" style={{ padding: 30, gap: 12 }}>
                <span className="serif" style={{ fontSize: 44, color: "var(--gold)", lineHeight: 1 }}>0{i + 1}</span>
                <span style={{ fontSize: 19, fontWeight: 800, color: "var(--navy)" }}>{t}</span>
                <span className="muted" style={{ lineHeight: 1.6 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          <div className="card stack" style={{ padding: 36 }}>
            <span className="eyebrow">Secure payments</span>
            <h3 className="serif" style={{ fontSize: 30 }}>Pay the way you already do</h3>
            <p className="muted" style={{ lineHeight: 1.6 }}>Payments run through Paystack's secure hosted checkout. Your card and wallet details are never stored on our servers.</p>
            <div className="row" style={{ gap: 10 }}>
              {["Visa", "Mastercard", "MTN MoMo", "Telecel Cash", "AirtelTigo Money"].map((m) => (
                <span key={m} style={{ border: "1px solid var(--input)", borderRadius: 8, padding: "10px 14px", fontWeight: 700, fontSize: 14 }}>{m}</span>
              ))}
            </div>
          </div>
          <div className="stack" style={{ padding: 36, background: "var(--navy)", color: "#fff", borderRadius: 14 }}>
            <span className="eyebrow" style={{ color: "var(--gold)" }}>Insurance</span>
            <h3 className="serif" style={{ fontSize: 30, color: "#fff" }}>Protect your car, home and travels</h3>
            <p style={{ color: "var(--on-navy)", lineHeight: 1.6 }}>Compare motor, home, travel and health cover and request a quote in minutes. Our team gets back to you with options.</p>
            <Link className="btn btn-gold" href="/insurance" style={{ alignSelf: "flex-start" }}>Explore cover</Link>
          </div>
        </div>
      </section>
    </>
  );
}
