"use client";
import { useFormAction } from "@/components/useFormAction";
import { useState } from "react";
import { requestInsurance, type FormState } from "@/app/(site)/actions";
import { Icon } from "./Icon";

const PLANS = {
  motor: { name: "Motor insurance", body: "Comprehensive or third-party cover for private and commercial vehicles.", detail: "Vehicle make, model and year", hint: "e.g. Toyota Corolla 2020", points: ["Accident damage to your vehicle (comprehensive)", "Third-party injury and property damage", "Theft and fire", "Optional roadside assistance"] },
  home: { name: "Home & property", body: "Protect your house, developments and contents.", detail: "Property location and estimated value", hint: "e.g. East Legon, GH₵ 2,000,000", points: ["Building damage from fire, flood and storm", "Contents and valuables", "Burglary and theft", "Public liability"] },
  travel: { name: "Travel", body: "Medical and trip cover for local and international travel.", detail: "Destination and travel dates", hint: "e.g. Dubai, 3–17 Dec", points: ["Emergency medical expenses", "Trip cancellation and delay", "Lost or delayed baggage", "Personal liability abroad"] },
  health: { name: "Health", body: "Individual and family plans for outpatient and inpatient care.", detail: "Number of people to cover", hint: "e.g. 2 adults, 2 children", points: ["Outpatient consultations", "Hospital admission", "Maternity (selected plans)", "Prescribed medication"] },
} as const;
type PlanId = keyof typeof PLANS;

export function InsuranceForm({ initial, name, email, phone, partner }: { initial: string; name: string; email: string; phone: string; partner: string }) {
  const [plan, setPlan] = useState<PlanId>(initial in PLANS ? (initial as PlanId) : "motor");
  const [state, onSubmit, pending] = useFormAction(requestInsurance);
  const p = PLANS[plan];
  return (
    <>
      <section className="wrap stack" style={{ padding: "64px 24px 24px", gap: 24 }}>
        <h2 className="serif" style={{ fontSize: 32 }}>1. Choose your cover</h2>
        <div className="grid" role="radiogroup" aria-label="Cover type" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16 }}>
          {(Object.keys(PLANS) as PlanId[]).map((k) => (
            <button
              key={k}
              type="button"
              role="radio"
              aria-checked={plan === k}
              onClick={() => setPlan(k)}
              className="stack"
              style={{ gap: 12, padding: 24, borderRadius: 12, textAlign: "left", cursor: "pointer", font: "inherit", background: plan === k ? "var(--navy)" : "#fff", color: plan === k ? "#fff" : "var(--navy)", border: `2px solid ${plan === k ? "var(--gold)" : "var(--line)"}` }}
            >
              <span style={{ fontSize: 20, fontWeight: 800 }}>{PLANS[k].name}</span>
              <span style={{ fontSize: 15, lineHeight: 1.55, opacity: 0.85 }}>{PLANS[k].body}</span>
              <span style={{ fontSize: 13, fontWeight: 800, letterSpacing: ".08em" }}>{plan === k ? "SELECTED" : "SELECT"}</span>
            </button>
          ))}
        </div>
      </section>
      <section className="wrap with-aside" style={{ padding: "32px 24px 88px" }}>
        <div className="stack" style={{ flex: "1 1 380px", minWidth: 0 }}>
          <h2 className="serif" style={{ fontSize: 32 }}>What {p.name.toLowerCase()} covers</h2>
          <ul className="stack" style={{ listStyle: "none", padding: 0, margin: 0, gap: 12 }}>
            {p.points.map((pt) => (
              <li key={pt} className="row" style={{ gap: 12, alignItems: "flex-start", flexWrap: "nowrap" }}><span style={{ color: "var(--gold-text)" }}><Icon name="check" size={20} /></span>{pt}</li>
            ))}
          </ul>
          <p className="hint">Final terms and premiums are set by our insurance partner{partner ? ` (${partner})` : ""}.</p>
        </div>
        <div className="panel" style={{ flex: "1 1 420px", minWidth: 0 }}>
          {state?.ok ? (
            <p className="alert alert-ok" role="status">{state.ok}</p>
          ) : (
            <form onSubmit={onSubmit} className="stack">
              <h2 className="serif" style={{ fontSize: 26 }}>2. Request a quote</h2>
              <input type="hidden" name="coverType" value={p.name} />
              <div className="row" style={{ gap: 12 }}>
                <div className="field"><label htmlFor="fullName">Full name</label><input id="fullName" name="fullName" defaultValue={name} required /></div>
                <div className="field"><label htmlFor="phone">Phone</label><input id="phone" name="phone" type="tel" defaultValue={phone} required /></div>
              </div>
              <div className="field"><label htmlFor="email">Email</label><input id="email" name="email" type="email" defaultValue={email} required /></div>
              <div className="field"><label htmlFor="details">{p.detail}</label><input id="details" name="details" placeholder={p.hint} /></div>
              <div className="field"><label htmlFor="startDate">Cover start date</label><input id="startDate" name="startDate" type="date" /></div>
              {state?.error && <p className="alert alert-error" role="alert">{state.error}</p>}
              <button className="btn btn-gold" disabled={pending}>{pending ? "Sending…" : "Request my quote"}</button>
              <span className="hint">We reply by email and phone. No payment is taken until you accept a quote.</span>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
