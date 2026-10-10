import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { InsuranceForm } from "@/components/InsuranceForm";

export const metadata = { title: "Insurance" };

export default async function InsurancePage({ searchParams }: { searchParams: Promise<{ cover?: string }> }) {
  const [{ cover = "motor" }, user, settings] = await Promise.all([searchParams, getCurrentUser(), getSettings()]);
  return (
    <>
      <section className="hero">
        <div className="inner" style={{ padding: "72px 24px", gap: 18 }}>
          <span className="eyebrow" style={{ color: "var(--gold)" }}>Insurance</span>
          <h1 style={{ fontSize: "clamp(34px, 4.5vw, 56px)" }}>Cover for the car you drive, the home you own and the trips you take.</h1>
          <p>Choose a cover type, tell us a little about what you want to protect, and our team returns a quote.</p>
        </div>
      </section>
      <InsuranceForm initial={cover} name={user?.fullName ?? ""} email={user?.email ?? ""} phone={user?.phone ?? ""} partner={settings.insurancePartner} />
    </>
  );
}
