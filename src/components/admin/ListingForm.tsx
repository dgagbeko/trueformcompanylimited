"use client";
import { useFormAction } from "@/components/useFormAction";
import { useState } from "react";
import type { Listing } from "@/db/schema";
import { saveListing } from "@/app/admin/actions";
import type { FormState } from "@/app/(site)/actions";

type Cat = "stay" | "car" | "land" | "house";

function F({ name, label, defaultValue, type = "text", placeholder, required, list }: { name: string; label: string; defaultValue?: string | number | null; type?: string; placeholder?: string; required?: boolean; list?: string }) {
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <input id={name} name={name} type={type} defaultValue={defaultValue ?? ""} placeholder={placeholder} required={required} list={list} inputMode={type === "number" ? "numeric" : undefined} />
    </div>
  );
}

export function ListingForm({ listing }: { listing?: Listing }) {
  const [state, onSubmit, pending] = useFormAction(saveListing);
  const [cat, setCat] = useState<Cat>(listing?.category ?? "stay");
  const l = listing;
  const priceLabel = cat === "stay" ? "Price per night (GH₵)" : cat === "car" ? "Daily rate (GH₵)" : "Asking price (GH₵)";

  return (
    <form onSubmit={onSubmit} className="stack" style={{ gap: 20 }}>
      {l && <input type="hidden" name="id" value={l.id} />}
      <section className="box stack">
        <h2 style={{ fontSize: 18 }}>Basics</h2>
        <div className="row" style={{ alignItems: "flex-end" }}>
          <div className="field">
            <label htmlFor="category">Category</label>
            <select id="category" name="category" value={cat} onChange={(e) => setCat(e.target.value as Cat)} disabled={Boolean(l)}>
              <option value="stay">Short stay (Airbnb)</option>
              <option value="car">Car rental</option>
              <option value="land">Land for sale</option>
              <option value="house">House for sale</option>
            </select>
            {l && <input type="hidden" name="category" value={cat} />}
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select id="status" name="status" defaultValue={l?.status ?? "draft"}>
              <option value="draft">Draft — hidden from the public</option>
              <option value="published">Published — visible and open</option>
              <option value="unavailable">Unavailable — hidden</option>
              {(cat === "land" || cat === "house") && <option value="reserved">Reserved — visible, no new inquiries</option>}
              {(cat === "land" || cat === "house") && <option value="sold">Sold — visible as sold</option>}
            </select>
          </div>
          <label className="check" style={{ flex: "1 1 180px", minHeight: 46 }}>
            <input type="checkbox" name="featured" defaultChecked={l?.featured} /> Feature on home page
          </label>
        </div>
        <F name="title" label="Title" defaultValue={l?.title} required placeholder={cat === "car" ? "e.g. Toyota RAV4 2021" : cat === "land" ? "e.g. Residential plot, Oyarifa" : "e.g. Modern 2-bed apartment"} />
        <div className="row">
          <F name="location" label={cat === "car" ? "Pick-up location" : "Location (area, town)"} defaultValue={l?.location} required placeholder="e.g. East Legon, Accra" />
          <F name="region" label="Region" defaultValue={l?.region} placeholder="e.g. Greater Accra" list="regions" />
          <F name="price" label={priceLabel} defaultValue={l ? l.price / 100 : ""} required placeholder="e.g. 850" />
        </div>
        <datalist id="regions">
          {["Greater Accra", "Ashanti", "Central", "Eastern", "Western", "Western North", "Volta", "Oti", "Northern", "Savannah", "North East", "Upper East", "Upper West", "Bono", "Bono East", "Ahafo"].map((r) => <option key={r} value={r} />)}
        </datalist>
        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea id="description" name="description" defaultValue={l?.description} rows={6} placeholder="Describe the listing, the neighbourhood and anything customers should know." />
        </div>
      </section>

      {(cat === "stay" || cat === "house") && (
        <section className="box stack">
          <h2 style={{ fontSize: 18 }}>{cat === "stay" ? "Stay details" : "House details"}</h2>
          <div className="row">
            <F name="propertyType" label="Property type" defaultValue={l?.propertyType} placeholder={cat === "stay" ? "Apartment, Entire house, Room…" : "Detached, Townhouse…"} list="ptypes" />
            <F name="bedrooms" label="Bedrooms" type="number" defaultValue={l?.bedrooms} />
            <F name="bathrooms" label="Bathrooms" type="number" defaultValue={l?.bathrooms} />
            {cat === "stay" ? <F name="maxGuests" label="Max guests" type="number" defaultValue={l?.maxGuests} /> : <F name="plotSize" label="Plot size" defaultValue={l?.plotSize} placeholder="e.g. 100 × 70 ft" />}
          </div>
          {cat === "house" && <F name="titleType" label="Title / documentation" defaultValue={l?.titleType} placeholder="e.g. Land title certificate, Indenture" />}
          <datalist id="ptypes">{["Apartment", "Entire house", "Private room", "Studio", "Villa", "Detached house", "Townhouse", "Semi-detached"].map((t) => <option key={t} value={t} />)}</datalist>
        </section>
      )}

      {cat === "car" && (
        <section className="box stack">
          <h2 style={{ fontSize: 18 }}>Vehicle details</h2>
          <div className="row">
            <F name="make" label="Make" defaultValue={l?.make} placeholder="Toyota" />
            <F name="model" label="Model" defaultValue={l?.model} placeholder="RAV4" />
            <F name="year" label="Year" type="number" defaultValue={l?.year} />
          </div>
          <div className="row">
            <div className="field"><label htmlFor="vehicleType">Type</label>
              <select id="vehicleType" name="vehicleType" defaultValue={l?.vehicleType ?? "Sedan"}>{["Sedan", "SUV", "Pickup", "Van", "Bus", "Hatchback"].map((t) => <option key={t}>{t}</option>)}</select></div>
            <div className="field"><label htmlFor="transmission">Transmission</label>
              <select id="transmission" name="transmission" defaultValue={l?.transmission ?? "Automatic"}><option>Automatic</option><option>Manual</option></select></div>
            <F name="seats" label="Seats" type="number" defaultValue={l?.seats} />
            <div className="field"><label htmlFor="fuel">Fuel</label>
              <select id="fuel" name="fuel" defaultValue={l?.fuel ?? "Petrol"}>{["Petrol", "Diesel", "Hybrid", "Electric"].map((t) => <option key={t}>{t}</option>)}</select></div>
          </div>
        </section>
      )}

      {cat === "land" && (
        <section className="box stack">
          <h2 style={{ fontSize: 18 }}>Land details</h2>
          <div className="row">
            <F name="plotSize" label="Plot size" defaultValue={l?.plotSize} placeholder="e.g. 100 × 70 ft or 2 acres" />
            <div className="field"><label htmlFor="landUse">Land use / zoning</label>
              <select id="landUse" name="landUse" defaultValue={l?.landUse ?? "Residential"}>{["Residential", "Commercial", "Agricultural", "Mixed use", "Industrial"].map((t) => <option key={t}>{t}</option>)}</select></div>
            <F name="titleType" label="Title / documentation" defaultValue={l?.titleType} placeholder="e.g. Land title certificate" />
          </div>
        </section>
      )}

      {cat !== "land" && (
        <section className="box stack">
          <h2 style={{ fontSize: 18 }}>{cat === "car" ? "Features" : "Amenities"}</h2>
          <div className="field">
            <label htmlFor="amenities">One per line</label>
            <textarea id="amenities" name="amenities" rows={5} defaultValue={l?.amenities.join("\n")} placeholder={cat === "car" ? "Air conditioning\nBluetooth\nReverse camera" : "Air conditioning\nWi-Fi\nBackup generator\nSecure parking"} />
          </div>
        </section>
      )}

      {state?.error && <p className="alert alert-error" role="alert">{state.error}</p>}
      {state?.ok && <p className="alert alert-ok" role="status">{state.ok}</p>}
      <div className="row">
        <button className="btn btn-accent" disabled={pending}>{pending ? "Saving…" : l ? "Save changes" : "Create listing"}</button>
        {!l && <span className="hint">You can add photos and videos after creating the listing.</span>}
      </div>
    </form>
  );
}
