import "server-only";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export const appUrl = () => (process.env.APP_URL || "http://localhost:3000").replace(/\/$/, "");

/** Wrap content in the branded email layout. `lines` are plain text paragraphs (escaped). */
function layout(title: string, lines: string[], cta?: { label: string; url: string }) {
  const body = lines.map((l) => `<p style="margin:0 0 14px;line-height:1.6">${esc(l)}</p>`).join("");
  const button = cta
    ? `<p style="margin:24px 0"><a href="${esc(cta.url)}" style="background:#C49A3A;color:#0E2238;padding:12px 22px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">${esc(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#F4F6F9;font-family:Arial,Helvetica,sans-serif;color:#0E1A26">
<div style="max-width:560px;margin:0 auto;padding:24px">
<div style="background:#0E2238;color:#fff;padding:18px 24px;border-radius:12px 12px 0 0;font-size:18px;font-weight:700">TrueForm <span style="color:#C49A3A">Excellence</span></div>
<div style="background:#fff;padding:28px 24px;border-radius:0 0 12px 12px">
<h1 style="font-size:22px;margin:0 0 16px;color:#0E2238">${esc(title)}</h1>${body}${button}
</div></div></body></html>`;
}

export async function sendEmail(to: string, subject: string, lines: string[], cta?: { label: string; url: string }) {
  const html = layout(subject, lines, cta);
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    // Development fallback: print the email so flows can be tested without an email provider.
    console.log(`\n[email] To: ${to}\n[email] Subject: ${subject}\n${lines.join("\n")}${cta ? `\n${cta.label}: ${cta.url}` : ""}\n`);
    return;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to, subject, html }),
    });
    if (!res.ok) console.error("[email] Resend error", res.status, await res.text());
  } catch (err) {
    // Email failures must never break a booking or payment.
    console.error("[email] send failed", err);
  }
}

export async function notifyAdmins(subject: string, lines: string[], path: string) {
  const to = process.env.ADMIN_NOTIFY_EMAIL;
  if (to) await sendEmail(to, subject, lines, { label: "Open back-office", url: `${appUrl()}${path}` });
}
