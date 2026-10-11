import { cache } from "react";
import { db, schema } from "@/db";

export const SETTING_DEFAULTS = {
  companyName: "TrueForm Excellence",
  heroTitle: "Stay. Drive. Own. Protect.",
  heroSubtitle: "Ghana’s one account for short stays, rental cars, land, homes and insurance. Pay with MoMo or card.",
  heroImage1: "",
  heroImage2: "",
  heroImage3: "",
  supportPhone: "",
  supportEmail: "",
  officeAddress: "",
  cancellationHours: "48",
  cancellationPolicy:
    "Free cancellation up to 48 hours before check-in or pick-up. Refunds are returned to the original payment method.",
  landDepositPercent: "10",
  insurancePartner: "",
};

/** Earlier default texts: shown as the current defaults instead, so saved-but-unchanged values follow the new design. */
const LEGACY_DEFAULTS: Partial<Record<keyof typeof SETTING_DEFAULTS, string>> = {
  heroTitle: "Stay, drive, own and insure — with one trusted account.",
  heroSubtitle:
    "Book short stays and rental cars, find land and houses for sale, and protect what matters with insurance. Pay securely by card or mobile money.",
};

export type SiteSettings = typeof SETTING_DEFAULTS;
export type SettingKey = keyof SiteSettings;

export const getSettings = cache(async (): Promise<SiteSettings> => {
  const rows = await db.select().from(schema.settings);
  const out = { ...SETTING_DEFAULTS };
  for (const r of rows) {
    const key = r.key as SettingKey;
    if (key in out && r.value !== LEGACY_DEFAULTS[key]) out[key] = r.value;
  }
  return out;
});
