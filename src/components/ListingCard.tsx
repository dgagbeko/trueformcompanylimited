import Link from "next/link";
import type { ListingWithCover } from "@/lib/listings";
import { listingMeta, priceUnit } from "@/lib/listings";
import { CATEGORY_LABEL, formatMoney } from "@/lib/format";
import { imageUrl } from "@/lib/media";

export function ListingCard({ l, showCategory = false }: { l: ListingWithCover; showCategory?: boolean }) {
  return (
    <Link href={`/listings/${l.slug}`} className="card listing-card">
      <div className="photo" style={{ height: 200, alignItems: "flex-start" }}>
        {l.cover ? <img src={imageUrl(l.cover.url, 640)} alt="" loading="lazy" /> : <span>No photo yet</span>}
        <span style={{ position: "relative", display: "flex", gap: 6 }}>
          {showCategory && <span className="tag">{CATEGORY_LABEL[l.category].toUpperCase()}</span>}
          {(l.status === "reserved" || l.status === "sold") && <span className="tag" style={{ background: "#6b4a07" }}>{l.status.toUpperCase()}</span>}
        </span>
      </div>
      <div className="body">
        <span style={{ fontSize: 13, fontWeight: 700, color: "var(--gold-text)", letterSpacing: ".04em", textTransform: "uppercase" }}>{l.location}</span>
        <span style={{ fontSize: 17, fontWeight: 800, color: "var(--navy)" }}>{l.title}</span>
        <span className="muted" style={{ fontSize: 14 }}>{listingMeta(l)}</span>
        <span className="price">
          {formatMoney(l.price)} <span className="muted" style={{ fontSize: 13, fontWeight: 500 }}>{priceUnit(l.category)}</span>
        </span>
      </div>
    </Link>
  );
}
