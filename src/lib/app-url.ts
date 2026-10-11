/**
 * The site's public address, e.g. "https://trueformcompanylimited.vercel.app" (no trailing slash).
 * Tolerates common typos in APP_URL (missing https://, quotes, spaces, a trailing slash or path)
 * and falls back to Vercel's production domain, so a bad value cannot break the build.
 */
export function appUrl(): string {
  const candidates = [process.env.APP_URL, process.env.VERCEL_PROJECT_PRODUCTION_URL, process.env.VERCEL_URL];
  for (const raw of candidates) {
    const cleaned = raw?.trim().replace(/^["']|["']$/g, "").trim();
    if (!cleaned) continue;
    try {
      const url = new URL(/^https?:\/\//i.test(cleaned) ? cleaned : `https://${cleaned}`);
      return url.origin;
    } catch {
      if (raw === process.env.APP_URL) console.warn(`[config] APP_URL "${raw}" is not a valid web address; ignoring it.`);
    }
  }
  return "http://localhost:3000";
}
