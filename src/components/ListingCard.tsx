import Link from "next/link";
import type { ListingWithCover } from "@/lib/listings";
import { listingMeta, priceUnit } from "@/lib/listings";
import { CATEGORY_LABEL, formatMoney } from "@/lib/format";
import { imageUrl } from "@/lib/media";

export function ListingCard({ l, showCategory = false }: { l: ListingWithCover; showCategory?: boolean }) {
  return (
    <Link href={`/listings/${l.slug}`} className="listing-card">
      <div className="photo" style={{ height: 230, alignItems: "flex-start", padding: 14 }}>
        {l.cover ? <img src={imageUrl(l.cover.url, 640)} alt="" loading="lazy" /> : <span style={{ position: "absolute", bottom: 12, left: 14 }}>Photo coming soon</span>}
        <span style={{ position: "relative", display: "flex", gap: 6 }}>
          {showCategory && <span className={`tag tag-${l.category}`}>{CATEGORY_LABEL[l.category]}</span>}
          {(l.status === "reserved" || l.status === "sold") && <span className="tag" style={{ background: "#fff", color: "var(--ink)" }}>{l.status === "sold" ? "Sold" : "Reserved"}</span>}
        </span>
      </div>
      <div className="body">
        <span style={{ fontSize: 17, fontWeight: 700 }}>{l.title}</span>
        <span className="muted" style={{ fontSize: 14 }}>{l.location}{listingMeta(l) ? ` · ${listingMeta(l)}` : ""}</span>
        <span className="price">
          {formatMoney(l.price)} <span className="muted" style={{ fontSize: 14, fontWeight: 500 }}>{priceUnit(l.category)}</span>
        </span>
      </div>
    </Link>
  );
}
