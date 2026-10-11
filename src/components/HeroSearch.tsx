"use client";
import { useState } from "react";

const TABS = [
  { id: "stays", label: "Stays" },
  { id: "cars", label: "Car rentals" },
  { id: "land", label: "Land" },
  { id: "houses", label: "Houses" },
  { id: "insurance", label: "Insurance" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export function HeroSearch() {
  const [tab, setTab] = useState<Tab>("stays");
  return (
    <div className="search-panel">
      <div role="tablist" aria-label="Search category" className="tabs">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" className="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>
      {tab === "stays" && (
        <form action="/stays" className="search-form">
          <div className="field" style={{ flexBasis: 260 }}><label htmlFor="s-q">Location</label><input id="s-q" name="q" placeholder="City, area or landmark" /></div>
          <div className="field"><label htmlFor="s-in">Check-in</label><input id="s-in" name="start" type="date" /></div>
          <div className="field"><label htmlFor="s-out">Check-out</label><input id="s-out" name="end" type="date" /></div>
          <div className="field wide" style={{ flexBasis: 120 }}><label htmlFor="s-g">Guests</label>
            <select id="s-g" name="guests" defaultValue="2"><option value="1">1 guest</option><option value="2">2 guests</option><option value="3">3 guests</option><option value="4">4 guests</option><option value="6">6+ guests</option></select>
          </div>
          <button className="btn btn-accent">Search stays</button>
        </form>
      )}
      {tab === "cars" && (
        <form action="/cars" className="search-form">
          <div className="field" style={{ flexBasis: 260 }}><label htmlFor="c-q">Pick-up location</label><input id="c-q" name="q" placeholder="City or airport" /></div>
          <div className="field"><label htmlFor="c-from">Pick-up date</label><input id="c-from" name="start" type="date" /></div>
          <div className="field"><label htmlFor="c-to">Return date</label><input id="c-to" name="end" type="date" /></div>
          <div className="field wide" style={{ flexBasis: 140 }}><label htmlFor="c-type">Vehicle type</label>
            <select id="c-type" name="type" defaultValue=""><option value="">Any type</option><option>Sedan</option><option>SUV</option><option>Pickup</option><option>Van</option><option>Bus</option></select>
          </div>
          <button className="btn btn-accent">Find cars</button>
        </form>
      )}
      {tab === "land" && (
        <form action="/land" className="search-form">
          <div className="field" style={{ flexBasis: 260 }}><label htmlFor="l-q">Location</label><input id="l-q" name="q" placeholder="Region, town or area" /></div>
          <div className="field"><label htmlFor="l-use">Land use</label>
            <select id="l-use" name="use" defaultValue=""><option value="">Any use</option><option>Residential</option><option>Commercial</option><option>Agricultural</option><option>Mixed use</option></select>
          </div>
          <div className="field"><label htmlFor="l-max">Max price (GH₵)</label><input id="l-max" name="max" inputMode="numeric" placeholder="No limit" /></div>
          <button className="btn btn-accent">Browse land</button>
        </form>
      )}
      {tab === "houses" && (
        <form action="/houses" className="search-form">
          <div className="field" style={{ flexBasis: 260 }}><label htmlFor="h-q">Location</label><input id="h-q" name="q" placeholder="Region, town or area" /></div>
          <div className="field"><label htmlFor="h-bed">Bedrooms</label>
            <select id="h-bed" name="bedrooms" defaultValue=""><option value="">Any</option><option value="2">2+</option><option value="3">3+</option><option value="4">4+</option></select>
          </div>
          <div className="field"><label htmlFor="h-max">Max price (GH₵)</label><input id="h-max" name="max" inputMode="numeric" placeholder="No limit" /></div>
          <button className="btn btn-accent">Browse houses</button>
        </form>
      )}
      {tab === "insurance" && (
        <form action="/insurance" className="search-form">
          <div className="field" style={{ flexBasis: 260 }}><label htmlFor="i-type">Cover type</label>
            <select id="i-type" name="cover" defaultValue="motor"><option value="motor">Motor insurance</option><option value="home">Home &amp; property</option><option value="travel">Travel</option><option value="health">Health</option></select>
          </div>
          <button className="btn btn-accent">Get a quote</button>
        </form>
      )}
    </div>
  );
}
