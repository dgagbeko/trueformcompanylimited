import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getPublicListing, priceUnit } from "@/lib/listings";
import { bookedRanges } from "@/lib/bookings";
import { getSettings } from "@/lib/settings";
import { CATEGORY_PATH, formatDate, formatMoney, todayIso } from "@/lib/format";
import { imageUrl } from "@/lib/media";
import { BookingForm } from "@/components/BookingForm";
import { InquiryForm } from "@/components/InquiryForm";
import { Icon } from "@/components/Icon";
import { Gallery } from "@/components/Gallery";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getPublicListing((await params).slug, false);
  if (!data) return {};
  const cover = data.gallery.find((m) => m.kind === "image");
  return {
    title: data.listing.title,
    description: `${data.listing.location} · ${formatMoney(data.listing.price)} ${priceUnit(data.listing.category)}`,
    openGraph: cover ? { images: [imageUrl(cover.url, 1200)] } : undefined,
  };
}

const STATUS_PILL = { published: ["Available", "pill-ok"], reserved: ["Reserved", "pill-warn"], sold: ["Sold", "pill-bad"], unavailable: ["Unavailable", "pill-grey"], draft: ["Draft (admin preview)", "pill-grey"] } as const;

export default async function ListingPage({ params }: Props) {
  const { slug } = await params;
  const user = await getCurrentUser();
  const data = await getPublicListing(slug, user?.role === "admin");
  if (!data) notFound();
  const { listing: l, gallery } = data;
  const settings = await getSettings();
  const bookable = l.category === "stay" || l.category === "car";
  const booked = bookable ? await bookedRanges(l.id) : [];
  const images = gallery.filter((m) => m.kind === "image");
  const videos = gallery.filter((m) => m.kind === "video");
  const [statusLabel, statusClass] = STATUS_PILL[l.status];

  const facts: [string, string | number | null][] =
    l.category === "stay"
      ? [["Property", l.propertyType], ["Bedrooms", l.bedrooms], ["Bathrooms", l.bathrooms], ["Max guests", l.maxGuests]]
      : l.category === "car"
        ? [["Make & model", [l.make, l.model, l.year].filter(Boolean).join(" ") || null], ["Type", l.vehicleType], ["Transmission", l.transmission], ["Seats", l.seats], ["Fuel", l.fuel]]
        : l.category === "land"
          ? [["Plot size", l.plotSize], ["Land use", l.landUse], ["Title", l.titleType], ["Region", l.region || null]]
          : [["Property", l.propertyType], ["Bedrooms", l.bedrooms], ["Bathrooms", l.bathrooms], ["Plot size", l.plotSize], ["Title", l.titleType]];

  const deposit = Number(settings.landDepositPercent) || 0;

  return (
    <div className="wrap stack" style={{ padding: "24px 24px 88px", gap: 28 }}>
      <nav aria-label="Breadcrumb" className="muted" style={{ fontSize: 14 }}>
        <Link href="/">Home</Link> / <Link href={CATEGORY_PATH[l.category]}>{CATEGORY_PATH[l.category].slice(1).replace(/^\w/, (c) => c.toUpperCase())}</Link> / {l.title}
      </nav>
      <div className="row between" style={{ alignItems: "flex-end", gap: 16 }}>
        <div className="stack" style={{ gap: 10 }}>
          <span className={`pill ${statusClass}`} style={{ alignSelf: "flex-start" }}>{statusLabel}</span>
          <h1 className="display" style={{ fontSize: "clamp(30px, 4vw, 40px)" }}>{l.title}</h1>
          <span className="muted" style={{ fontSize: 16 }}>{l.location}{l.region ? `, ${l.region}` : ""}</span>
        </div>
        <div className="stack" style={{ gap: 2, alignItems: "flex-end" }}>
          <span className="label">{bookable ? "Price" : "Asking price"}</span>
          <span style={{ fontSize: 30, fontWeight: 800 }}>{formatMoney(l.price)} <span className="muted" style={{ fontSize: 15, fontWeight: 500 }}>{priceUnit(l.category)}</span></span>
        </div>
      </div>

      <Gallery photos={images.map((m) => ({ id: m.id, url: m.url }))} title={l.title} />

      <div className="with-aside">
        <div className="main stack" style={{ gap: 32 }}>
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            {facts.filter(([, v]) => v != null && v !== "").map(([k, v]) => (
              <div className="fact" key={k}><span>{k}</span><b>{v}</b></div>
            ))}
          </div>
          {l.description && (
            <div className="stack" style={{ gap: 12 }}>
              <h2 style={{ fontSize: 22 }}>{l.category === "car" ? "About this car" : "Description"}</h2>
              <p style={{ whiteSpace: "pre-line", lineHeight: 1.7, color: "var(--body)" }}>{l.description}</p>
            </div>
          )}
          {l.amenities.length > 0 && (
            <div className="stack" style={{ gap: 14 }}>
              <h2 style={{ fontSize: 22 }}>{l.category === "car" ? "Features" : "Amenities"}</h2>
              <ul className="grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10, listStyle: "none", padding: 0, margin: 0 }}>
                {l.amenities.map((a) => (
                  <li key={a} className="row" style={{ gap: 10 }}><span style={{ color: "var(--accent-text)" }}><Icon name="check" size={18} /></span>{a}</li>
                ))}
              </ul>
            </div>
          )}
          {videos.length > 0 && (
            <div className="stack" style={{ gap: 14 }}>
              <h2 style={{ fontSize: 22 }}>Video tour</h2>
              {videos.map((v) => (
                <video key={v.id} src={v.url} controls preload="metadata" style={{ width: "100%", borderRadius: 12, background: "#000" }} />
              ))}
            </div>
          )}
          {bookable && (
            <div className="stack" style={{ gap: 10 }}>
              <h2 style={{ fontSize: 22 }}>Availability</h2>
              {booked.length === 0 ? (
                <p className="muted">No upcoming bookings — all dates are open.</p>
              ) : (
                <>
                  <p className="muted">These dates are already taken:</p>
                  <ul className="row" style={{ listStyle: "none", padding: 0, margin: 0, gap: 8 }}>
                    {booked.map((r) => (
                      <li key={r.start + r.end} className="spec">{formatDate(r.start)} – {formatDate(r.end)}</li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}
          {bookable && (
            <div className="stack" style={{ gap: 10 }}>
              <h2 style={{ fontSize: 22 }}>Cancellation policy</h2>
              <p style={{ lineHeight: 1.7, color: "var(--body)" }}>{settings.cancellationPolicy}</p>
            </div>
          )}
          {!bookable && (
            <div className="box stack" style={{ background: "var(--mist)", gap: 8 }}>
              <b style={{ color: "var(--ink)" }}>How buying works</b>
              <span style={{ lineHeight: 1.7, color: "var(--body)" }}>
                Send an inquiry. Our team contacts you to arrange a viewing and verify documents. Once you agree a price, you can pay a {deposit}% deposit online to reserve the property.
              </span>
            </div>
          )}
        </div>

        <aside className="aside panel stack" aria-label={bookable ? "Book" : "Send an inquiry"}>
          {l.status !== "published" ? (
            <p className="alert alert-info">This listing is currently {statusLabel.toLowerCase()} and not open for {bookable ? "booking" : "new inquiries"}.</p>
          ) : bookable ? (
            <>
              <span style={{ fontSize: 26, fontWeight: 800 }}>{formatMoney(l.price)} <span className="muted" style={{ fontSize: 15, fontWeight: 500 }}>{priceUnit(l.category)}</span></span>
              {user ? (
                <BookingForm listingId={l.id} slug={l.slug} priceMinor={l.price} priceLabel={formatMoney(l.price)} unit={l.category === "car" ? "day" : "night"} maxGuests={l.maxGuests} today={todayIso()} />
              ) : (
                <Link className="btn btn-accent" href={`/login?next=/listings/${l.slug}`}>Sign in to book</Link>
              )}
            </>
          ) : (
            <>
              <h2 className="display" style={{ fontSize: 24 }}>Interested in this {l.category === "land" ? "plot" : "house"}?</h2>
              <span className="muted" style={{ fontSize: 15 }}>Send an expression of interest. You can track its status in your dashboard.</span>
              {user ? <InquiryForm listingId={l.id} slug={l.slug} phone={user.phone} /> : <Link className="btn btn-ink" href={`/login?next=/listings/${l.slug}`}>Sign in to inquire</Link>}
              {deposit > 0 && <span className="hint">After your inquiry, you can pay a {deposit}% deposit ({formatMoney(Math.round((l.price * deposit) / 100))}) from your dashboard to reserve.</span>}
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
