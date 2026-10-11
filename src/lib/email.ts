import "server-only";
import { appUrl } from "./app-url";

const esc = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export { appUrl };

/** Wrap content in the branded email layout. `lines` are plain text paragraphs (escaped). */
function layout(title: string, lines: string[], cta?: { label: string; url: string }) {
  const body = lines.map((l) => `<p style="margin:0 0 14px;line-height:1.6">${esc(l)}</p>`).join("");
  const button = cta
    ? `<p style="margin:24px 0"><a href="${esc(cta.url)}" style="background:#C13D14;color:#ffffff;padding:13px 24px;border-radius:12px;text-decoration:none;font-weight:700;display:inline-block">${esc(cta.label)}</a></p>`
    : "";
  return `<!doctype html><html><body style="margin:0;background:#FAF7F2;font-family:Arial,Helvetica,sans-serif;color:#141414">
<div style="max-width:560px;margin:0 auto;padding:24px">
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="border-radius:16px 16px 0 0;overflow:hidden"><tr><td style="height:6px;background:#C13D14"></td><td style="height:6px;background:#141414"></td><td style="height:6px;background:#F2B33D"></td><td style="height:6px;background:#1D6B47"></td></tr></table>
<div style="background:#141414;color:#fff;padding:18px 24px;font-size:22px;font-weight:800;letter-spacing:-0.5px">trueform<span style="color:#F2B33D">.</span></div>
<div style="background:#fff;padding:28px 24px;border-radius:0 0 16px 16px;border:1px solid #E8E2D9;border-top:0">
<h1 style="font-size:24px;margin:0 0 16px;color:#141414">${esc(title)}</h1>${body}${button}
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
