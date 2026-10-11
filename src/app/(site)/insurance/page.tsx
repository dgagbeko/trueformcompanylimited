import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { InsuranceForm } from "@/components/InsuranceForm";

export const metadata = { title: "Insurance" };

export default async function InsurancePage({ searchParams }: { searchParams: Promise<{ cover?: string }> }) {
  const [{ cover = "motor" }, user, settings] = await Promise.all([searchParams, getCurrentUser(), getSettings()]);
  return (
    <>
      <section className="wrap stack" style={{ paddingTop: 56, gap: 18 }}>
        <span className="eyebrow">Insurance</span>
        <h1 className="display" style={{ fontSize: "clamp(40px, 6vw, 80px)", lineHeight: 0.98, maxWidth: 900 }}>
          Cover for your car, your home <span className="t-green">and your travels.</span>
        </h1>
        <p style={{ fontSize: 19, lineHeight: 1.55, color: "var(--body)", maxWidth: 620 }}>
          Choose a cover type, tell us what you want to protect, and our team returns a quote.
        </p>
      </section>
      <InsuranceForm initial={cover} name={user?.fullName ?? ""} email={user?.email ?? ""} phone={user?.phone ?? ""} partner={settings.insurancePartner} />
    </>
  );
}
