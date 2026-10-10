const CURRENCY = process.env.PAYSTACK_CURRENCY || "GHS";
const SYMBOL: Record<string, string> = { GHS: "GH₵", NGN: "₦", KES: "KSh", ZAR: "R", USD: "$" };

/** Format an amount stored in minor units (pesewas) for display. */
export function formatMoney(minor: number): string {
  const major = minor / 100;
  const digits = Number.isInteger(major) ? 0 : 2;
  return `${SYMBOL[CURRENCY] ?? CURRENCY} ${major.toLocaleString("en-US", {
    minimumFractionDigits: digits,
    maximumFractionDigits: 2,
  })}`;
}

/** Parse a user-entered major-unit amount ("1,250.50") into minor units. */
export function toMinor(input: string): number | null {
  const n = Number(String(input).replace(/[,\s]/g, ""));
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.round(n * 100);
}

export function formatDate(d: string | Date): string {
  const date = typeof d === "string" ? new Date(`${d}T00:00:00Z`) : d;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

/** Whole days between two ISO dates (YYYY-MM-DD). */
export function daysBetween(start: string, end: string): number {
  const a = Date.parse(`${start}T00:00:00Z`);
  const b = Date.parse(`${end}T00:00:00Z`);
  return Math.round((b - a) / 86_400_000);
}

export function todayIso(): string {
  return new Date().toISOString().slice(0, 10);
}

export function isIsoDate(s: unknown): s is string {
  return typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

export function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .slice(0, 80);
}

export const CATEGORY_LABEL = {
  stay: "Stay",
  car: "Car",
  land: "Land",
  house: "House",
} as const;

export const CATEGORY_PATH = {
  stay: "/stays",
  car: "/cars",
  land: "/land",
  house: "/houses",
} as const;
