import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

const API = "https://api.paystack.co";

export const paystackConfigured = () => Boolean(process.env.PAYSTACK_SECRET_KEY);
export const currency = () => process.env.PAYSTACK_CURRENCY || "GHS";

async function call<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
    cache: "no-store",
  });
  const json = (await res.json()) as { status: boolean; message: string; data: T };
  if (!res.ok || !json.status) throw new Error(`Paystack: ${json.message || res.status}`);
  return json.data;
}

/** Start a hosted checkout. Card and mobile money are both offered on Paystack's page. */
export function initializeTransaction(opts: {
  email: string;
  amount: number; // minor units
  reference: string;
  callbackUrl: string;
  metadata?: Record<string, unknown>;
}) {
  return call<{ authorization_url: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: opts.email,
      amount: opts.amount,
      currency: currency(),
      reference: opts.reference,
      callback_url: opts.callbackUrl,
      channels: ["card", "mobile_money"],
      metadata: opts.metadata,
    }),
  });
}

export function verifyTransaction(reference: string) {
  return call<{ status: string; amount: number; currency: string; channel: string; paid_at: string | null; reference: string }>(
    `/transaction/verify/${encodeURIComponent(reference)}`,
  );
}

export function refundTransaction(reference: string) {
  return call<unknown>("/refund", { method: "POST", body: JSON.stringify({ transaction: reference }) });
}

/** Webhooks are signed with HMAC-SHA512 of the raw body using the secret key. */
export function validWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature || !process.env.PAYSTACK_SECRET_KEY) return false;
  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
