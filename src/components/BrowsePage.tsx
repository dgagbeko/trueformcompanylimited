import Link from "next/link";
import type { Category } from "@/db/schema";
import { searchListings, type SearchParams } from "@/lib/listings";
import { ListingCard } from "./ListingCard";

const COPY: Record<Category, { title: string; noun: string; one: string; path: string; n: string; tagline: string }> = {
  stay: { title: "Short stays", noun: "places", one: "place", path: "/stays", n: "01", tagline: "Homes and apartments by the night. Book and pay with MoMo or card." },
  car: { title: "Car rentals", noun: "cars", one: "car", path: "/cars", n: "02", tagline: "Sedans, SUVs and vans for any dates — pick up where it suits you." },
  land: { title: "Land for sale", noun: "plots", one: "plot", path: "/land", n: "03", tagline: "Plots with clear size, title and zoning. Inquire and reserve online." },
  house: { title: "Houses for sale", noun: "houses", one: "house", path: "/houses", n: "04", tagline: "Homes for sale, fully documented and photographed." },
};

const v = (sp: SearchParams, k: string) => {
  const x = sp[k];
  return (Array.isArray(x) ? x[0] : x) ?? "";
};

export async function BrowsePage({ category, sp }: { category: Category; sp: SearchParams }) {
  const results = await searchListings(category, sp);
  const c = COPY[category];
  const dated = category === "stay" || category === "car";
  return (
    <>
      <section className={`browse-band browse-${category}`}>
        <div className="wrap browse-head">
          <span className="browse-n" aria-hidden="true">{c.n}</span>
          <div className="stack" style={{ gap: 8 }}>
            <h1>{c.title}</h1>
            <p>{c.tagline}</p>
          </div>
        </div>
        <div className="wrap">
        <form className="browse-card search-form" action={c.path} aria-label={`Search ${c.title.toLowerCase()}`}>
          <div className="field" style={{ flex: "2 1 240px" }}>
            <label htmlFor="q">{category === "car" ? "Pick-up location" : "Location"}</label>
            <input id="q" name="q" defaultValue={v(sp, "q")} placeholder="City, area or landmark" />
          </div>
          {dated && (
            <>
              <div className="field"><label htmlFor="start">{category === "car" ? "Pick-up date" : "Check-in"}</label><input id="start" name="start" type="date" defaultValue={v(sp, "start")} /></div>
              <div className="field"><label htmlFor="end">{category === "car" ? "Return date" : "Check-out"}</label><input id="end" name="end" type="date" defaultValue={v(sp, "end")} /></div>
            </>
          )}
          <div className="field" style={{ flex: "1 1 120px" }}><label htmlFor="min">Min price (GH₵)</label><input id="min" name="min" inputMode="numeric" defaultValue={v(sp, "min")} /></div>
          <div className="field" style={{ flex: "1 1 120px" }}><label htmlFor="max">Max price (GH₵)</label><input id="max" name="max" inputMode="numeric" defaultValue={v(sp, "max")} /></div>
          {category === "stay" && (
            <>
              <div className="field" style={{ flex: "1 1 120px" }}><label htmlFor="guests">Guests</label>
                <select id="guests" name="guests" defaultValue={v(sp, "guests")}><option value="">Any</option>{[1, 2, 3, 4, 6, 8].map((n) => <option key={n} value={n}>{n}+</option>)}</select></div>
              <div className="field" style={{ flex: "1 1 120px" }}><label htmlFor="bedrooms">Bedrooms</label>
                <select id="bedrooms" name="bedrooms" defaultValue={v(sp, "bedrooms")}><option value="">Any</option>{[1, 2, 3, 4].map((n) => <option key={n} value={n}>{n}+</option>)}</select></div>
            </>
          )}
          {category === "car" && (
            <>
              <div className="field" style={{ flex: "1 1 130px" }}><label htmlFor="type">Type</label>
                <select id="type" name="type" defaultValue={v(sp, "type")}><option value="">Any</option>{["Sedan", "SUV", "Pickup", "Van", "Bus"].map((t) => <option key={t}>{t}</option>)}</select></div>
              <div className="field" style={{ flex: "1 1 130px" }}><label htmlFor="transmission">Transmission</label>
                <select id="transmission" name="transmission" defaultValue={v(sp, "transmission")}><option value="">Any</option><option>Automatic</option><option>Manual</option></select></div>
              <div className="field" style={{ flex: "1 1 110px" }}><label htmlFor="seats">Seats</label>
                <select id="seats" name="seats" defaultValue={v(sp, "seats")}><option value="">Any</option>{[4, 5, 7, 12].map((n) => <option key={n} value={n}>{n}+</option>)}</select></div>
            </>
          )}
          {category === "land" && (
            <div className="field" style={{ flex: "1 1 150px" }}><label htmlFor="use">Land use</label>
              <select id="use" name="use" defaultValue={v(sp, "use")}><option value="">Any</option>{["Residential", "Commercial", "Agricultural", "Mixed use", "Industrial"].map((t) => <option key={t}>{t}</option>)}</select></div>
          )}
          {category === "house" && (
            <div className="field" style={{ flex: "1 1 120px" }}><label htmlFor="bedrooms">Bedrooms</label>
              <select id="bedrooms" name="bedrooms" defaultValue={v(sp, "bedrooms")}><option value="">Any</option>{[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}+</option>)}</select></div>
          )}
          <div className={`field${category === "stay" ? " wide" : ""}`} style={{ flex: "0 1 220px" }}><label htmlFor="sort">Sort</label>
            <select id="sort" name="sort" defaultValue={v(sp, "sort")}>
              <option value="">Recommended</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option><option value="newest">Newest</option>
            </select></div>
          <button className="btn btn-accent">Search</button>
        </form>
        </div>
      </section>
      <section className="wrap browse-results">
        <div className="row between" style={{ marginBottom: 24 }}>
          <h2 className="display" style={{ fontSize: 26 }}>{results.length === 0 ? `No ${c.noun} match your search yet.` : `${results.length} ${results.length === 1 ? c.one : c.noun} found`}</h2>
          {Object.keys(sp).length > 0 && <Link href={c.path} className="btn btn-line btn-sm">Clear filters</Link>}
        </div>
        <div className="grid">
          {results.map((l) => <ListingCard key={l.id} l={l} />)}
        </div>
      </section>
    </>
  );
}
