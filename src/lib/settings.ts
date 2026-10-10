import { cache } from "react";
import { db, schema } from "@/db";

export const SETTING_DEFAULTS = {
  companyName: "TrueForm Excellence",
  heroTitle: "Stay, drive, own and insure — with one trusted account.",
  heroSubtitle:
    "Book short stays and rental cars, find land and houses for sale, and protect what matters with insurance. Pay securely by card or mobile money.",
  supportPhone: "",
  supportEmail: "",
  officeAddress: "",
  cancellationHours: "48",
  cancellationPolicy:
    "Free cancellation up to 48 hours before check-in or pick-up. Refunds are returned to the original payment method.",
  landDepositPercent: "10",
  insurancePartner: "",
};

export type SiteSettings = typeof SETTING_DEFAULTS;
export type SettingKey = keyof SiteSettings;

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await db.select().from(schema.settings);
  const out = { ...SETTING_DEFAULTS };
  for (const r of rows) {
    if (r.key in out) out[r.key as SettingKey] = r.value;
  }
  return out;
});
