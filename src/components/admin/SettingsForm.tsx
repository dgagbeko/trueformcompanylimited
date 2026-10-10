"use client";
import { useFormAction } from "@/components/useFormAction";
import { saveSettings } from "@/app/admin/actions";
import type { FormState } from "@/app/(site)/actions";
import type { SiteSettings } from "@/lib/settings";

export function SettingsForm({ settings: s }: { settings: SiteSettings }) {
  const [state, onSubmit, pending] = useFormAction(saveSettings);
  return (
    <form onSubmit={onSubmit} className="stack" style={{ gap: 20, maxWidth: 820 }}>
      <section className="box stack">
        <h2 style={{ fontSize: 18 }}>Home page</h2>
        <div className="field"><label htmlFor="heroTitle">Headline</label><input id="heroTitle" name="heroTitle" defaultValue={s.heroTitle} /></div>
        <div className="field"><label htmlFor="heroSubtitle">Sub-heading</label><textarea id="heroSubtitle" name="heroSubtitle" rows={3} defaultValue={s.heroSubtitle} /></div>
      </section>
      <section className="box stack">
        <h2 style={{ fontSize: 18 }}>Contact details (footer &amp; contact page)</h2>
        <div className="row">
          <div className="field"><label htmlFor="supportPhone">Support phone</label><input id="supportPhone" name="supportPhone" defaultValue={s.supportPhone} placeholder="+233 …" /></div>
          <div className="field"><label htmlFor="supportEmail">Support email</label><input id="supportEmail" name="supportEmail" type="email" defaultValue={s.supportEmail} /></div>
        </div>
        <div className="field"><label htmlFor="officeAddress">Office address</label><input id="officeAddress" name="officeAddress" defaultValue={s.officeAddress} /></div>
      </section>
      <section className="box stack">
        <h2 style={{ fontSize: 18 }}>Policies</h2>
        <div className="row">
          <div className="field"><label htmlFor="cancellationHours">Free cancellation up to (hours before start)</label><input id="cancellationHours" name="cancellationHours" inputMode="numeric" defaultValue={s.cancellationHours} /></div>
          <div className="field"><label htmlFor="landDepositPercent">Land/house deposit to reserve (%)</label><input id="landDepositPercent" name="landDepositPercent" inputMode="numeric" defaultValue={s.landDepositPercent} /></div>
        </div>
        <div className="field"><label htmlFor="cancellationPolicy">Cancellation policy text</label><textarea id="cancellationPolicy" name="cancellationPolicy" rows={3} defaultValue={s.cancellationPolicy} /></div>
        <div className="field"><label htmlFor="insurancePartner">Insurance partner name</label><input id="insurancePartner" name="insurancePartner" defaultValue={s.insurancePartner} /></div>
      </section>
      {state?.error && <p className="alert alert-error" role="alert">{state.error}</p>}
      {state?.ok && <p className="alert alert-ok" role="status">{state.ok}</p>}
      <button className="btn btn-gold" style={{ alignSelf: "flex-start" }} disabled={pending}>{pending ? "Saving…" : "Save settings"}</button>
    </form>
  );
}
