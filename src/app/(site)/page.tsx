import Link from "next/link";
import { HeroSearch } from "@/components/HeroSearch";
import { ListingCard } from "@/components/ListingCard";
import { featuredListings } from "@/lib/listings";
import { getSettings } from "@/lib/settings";
import { imageUrl } from "@/lib/media";

export const dynamic = "force-dynamic";

const LANES = [
  { title: "Stays", body: "Homes and apartments by the night.", href: "/stays", cls: "lane-stay" },
  { title: "Cars", body: "Sedans, SUVs and vans for any dates.", href: "/cars", cls: "lane-car" },
  { title: "Land", body: "Plots with clear size, title and zoning.", href: "/land", cls: "lane-land" },
  { title: "Houses", body: "Homes for sale, fully documented.", href: "/houses", cls: "lane-house" },
  { title: "Insurance", body: "Motor, home, travel and health cover.", href: "/insurance", cls: "lane-ins" },
];

const STEPS = [
  ["Join free", "Sign up with your name, email and phone, then confirm the link we email you."],
  ["Book or inquire", "Pick dates for stays and cars, send an inquiry on land or homes, or request a quote."],
  ["Pay your way", "MoMo or card. Receipt by email. Change or cancel from your dashboard."],
];

/** "Stay. Drive. Own. Protect." → the 3rd sentence in orange and the 4th in green. */
function Headline({ text }: { text: string }) {
  const parts = text.split(/(?<=\.)\s+/);
  if (parts.length < 2) return <>{text}</>;
  return (
    <>
      {parts.map((p, i) => (
        <span key={i} className={i === 2 ? "t-accent" : i === 3 ? "t-green" : undefined}>
          {p}
          {i < parts.length - 1 ? " " : ""}
        </span>
      ))}
    </>
  );
}

export default async function HomePage() {
  const [s, featured] = await Promise.all([getSettings(), featuredListings(4)]);
  // Large photo: the one chosen in the back-office, else a stay's cover photo.
  // The two small slots show their own photos if set, else the "Book a stay" / "Find land" tiles.
  const stayCover = featured.find((l) => l.category === "stay" && l.cover)?.cover ?? featured.find((l) => l.cover)?.cover;
  const mosaic = [s.heroImage1 || stayCover?.url || "", s.heroImage2, s.heroImage3];
  const fallbacks = [
    { label: "Stays", href: "/stays", bg: "var(--photo)", color: "var(--ink)" },
    { label: "Book a stay →", href: "/stays", bg: "var(--accent)", color: "#fff" },
    { label: "Find land →", href: "/land", bg: "var(--green)", color: "#fff" },
  ];

  return (
    <>
      <section className="hero">
        <div className="inner">
          <div className="hero-copy">
            <h1><Headline text={s.heroTitle} /></h1>
            <p>{s.heroSubtitle}</p>
          </div>
          <div className="hero-mosaic">
            {mosaic.map((url, i) =>
              url ? (
                <div key={i} className="photo" style={{ padding: 0 }}>
                  <img src={imageUrl(url, i === 0 ? 900 : 600)} alt="" />
                </div>
              ) : (
                <Link key={i} href={fallbacks[i].href} className="mosaic-tile" style={{ background: fallbacks[i].bg, color: fallbacks[i].color }}>
                  {fallbacks[i].label}
                </Link>
              ),
            )}
          </div>
        </div>
        <div className="wrap" style={{ paddingTop: 36 }}>
          <HeroSearch />
        </div>
      </section>

      <section className="section" style={{ paddingBottom: 32 }}>
        <div className="wrap">
          <div className="section-head">
            <h2 className="section-title">Pick your lane.</h2>
            <p className="muted" style={{ maxWidth: 420, lineHeight: 1.6 }}>One account for everything. Verified listings, and payments you can trust.</p>
          </div>
          <div className="lanes">
            {LANES.map((l) => (
              <Link key={l.href} href={l.href} className={`lane ${l.cls}`}>
                <span className="stack" style={{ gap: 6 }}>
                  <span className="t">{l.title}</span>
                  <span className="b">{l.body}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="section" style={{ paddingTop: 48 }}>
          <div className="wrap">
            <div className="section-head">
              <h2 className="section-title" style={{ fontSize: "clamp(30px, 3.5vw, 40px)" }}>Fresh this week</h2>
              <Link href="/stays" style={{ fontWeight: 700 }}>See everything →</Link>
            </div>
            <div className="grid">
              {featured.map((l) => <ListingCard key={l.id} l={l} showCategory />)}
            </div>
          </div>
        </section>
      )}

      <section className="section band">
        <div className="wrap stack" style={{ gap: 32 }}>
          <h2 className="section-title">Three steps. That’s it.</h2>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: 16 }}>
            {STEPS.map(([t, b], i) => (
              <div key={t} className="box stack" style={{ padding: 28, gap: 10, border: "2px solid var(--ink)" }}>
                <span className="display" style={{ fontSize: 48, lineHeight: 1, color: ["var(--accent)", "var(--green)", "var(--ink)"][i] }}>0{i + 1}</span>
                <span className="display" style={{ fontSize: 24 }}>{t}</span>
                <span className="muted" style={{ lineHeight: 1.6 }}>{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="band-ink">
        <div className="wrap row between" style={{ paddingTop: 64, paddingBottom: 64, gap: 32 }}>
          <h2 className="display" style={{ fontSize: "clamp(32px, 4vw, 48px)", lineHeight: 1.02, maxWidth: 620 }}>
            MoMo or card. <span className="t-yellow">Receipt every time.</span>
          </h2>
          <div className="row" style={{ gap: 10 }}>
            {["MTN MoMo", "Telecel Cash", "AirtelTigo Money", "Visa · Mastercard"].map((m) => (
              <span key={m} style={{ border: "1px solid #4a4a4a", borderRadius: 999, padding: "10px 16px", fontWeight: 600 }}>{m}</span>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="wrap">
        <div className="row between" style={{ gap: 24, border: "2px solid var(--ink)", borderRadius: 22, padding: "clamp(22px, 4vw, 36px)", boxShadow: "8px 8px 0 var(--green)" }}>
          <div className="stack" style={{ gap: 10, maxWidth: 640 }}>
            <span className="eyebrow">Insurance</span>
            <h2 className="display" style={{ fontSize: "clamp(28px, 3.5vw, 40px)" }}>Protect your car, home and travels.</h2>
            <p className="muted" style={{ lineHeight: 1.6 }}>Request a motor, home, travel or health quote in two minutes. Our team gets back to you with options.</p>
          </div>
          <Link className="btn btn-ink" href="/insurance">Get a quote</Link>
        </div>
        </div>
      </section>
    </>
  );
}
