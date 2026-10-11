"use client";
import { useFormAction } from "@/components/useFormAction";
import { useState } from "react";
import { bookListing, type FormState } from "@/app/(site)/actions";

export function BookingForm(props: {
  listingId: string;
  slug: string;
  priceMinor: number;
  priceLabel: string;
  unit: "night" | "day";
  maxGuests: number | null;
  today: string;
}) {
  const [state, onSubmit, pending] = useFormAction(bookListing);
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const units = start && end ? Math.round((Date.parse(end) - Date.parse(start)) / 86_400_000) : 0;
  const total = units > 0 ? ((props.priceMinor * units) / 100).toLocaleString("en-US") : null;
  const isCar = props.unit === "day";

  return (
    <form onSubmit={onSubmit} className="stack">
      <input type="hidden" name="listingId" value={props.listingId} />
      <input type="hidden" name="slug" value={props.slug} />
      <div className="row" style={{ gap: 10, alignItems: "flex-end" }}>
        <div className="field" style={{ flexBasis: 130 }}>
          <label htmlFor="start">{isCar ? "Pick-up" : "Check-in"}</label>
          <input id="start" name="start" type="date" min={props.today} required defaultValue="" onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="field" style={{ flexBasis: 130 }}>
          <label htmlFor="end">{isCar ? "Return" : "Check-out"}</label>
          <input id="end" name="end" type="date" min={start || props.today} required defaultValue="" onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      {!isCar && (
        <div className="field">
          <label htmlFor="guests">Guests</label>
          <select id="guests" name="guests" defaultValue="1">
            {Array.from({ length: props.maxGuests ?? 8 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>
      )}
      {total && (
        <div className="stack" style={{ gap: 8, borderTop: "1px solid var(--line)", paddingTop: 14 }}>
          <div className="row between"><span>{props.priceLabel} × {units} {props.unit}{units > 1 ? "s" : ""}</span><span>GH₵ {total}</span></div>
          <div className="row between" style={{ fontWeight: 800, fontSize: 18 }}><span>Total</span><span>GH₵ {total}</span></div>
        </div>
      )}
      {state?.error && <p className="alert alert-error" role="alert">{state.error}</p>}
      <button className="btn btn-accent" disabled={pending}>{pending ? "Checking availability…" : isCar ? "Book this car" : "Reserve and pay"}</button>
      <span className="hint" style={{ textAlign: "center" }}>Requires a verified account. Pay by card or mobile money.</span>
    </form>
  );
}
