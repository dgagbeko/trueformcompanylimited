import { getSettings } from "@/lib/settings";
import { SettingsForm } from "@/components/admin/SettingsForm";

export default async function AdminSettings() {
  const s = await getSettings();
  return (
    <>
      <h1 className="display" style={{ fontSize: 32 }}>Site settings</h1>
      <p className="muted">These details appear across the website. Changes go live as soon as you save.</p>
      <SettingsForm settings={s} />
    </>
  );
}
