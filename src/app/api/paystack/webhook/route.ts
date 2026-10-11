import { NextResponse, type NextRequest } from "next/server";
import { finalizePayment } from "@/lib/bookings";
import { validWebhookSignature } from "@/lib/paystack";

/**
 * Paystack webhook (set the URL in Dashboard > Settings > API Keys & Webhooks).
 * Confirms payments even if the customer closes the browser before returning.
 */
export async function POST(req: NextRequest) {
  const raw = await req.text();
  if (!validWebhookSignature(raw, req.headers.get("x-paystack-signature"))) {
    return NextResponse.json({ error: "invalid signature" }, { status: 401 });
  }
  const event = JSON.parse(raw) as { event: string; data?: { reference?: string } };
  if ((event.event === "charge.success" || event.event === "charge.failed") && event.data?.reference) {
    await finalizePayment(event.data.reference);
  }
  return NextResponse.json({ received: true });
}

/** Opening this address in a browser just confirms it is reachable; Paystack itself always uses POST. */
export function GET() {
  return NextResponse.json({
    ok: true,
    message: "Paystack webhook endpoint is live. Only Paystack's servers send payments here, using POST.",
  });
}
