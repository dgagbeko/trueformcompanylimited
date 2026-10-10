import { NextResponse, type NextRequest } from "next/server";
import { finalizePayment } from "@/lib/bookings";
import { appUrl } from "@/lib/email";

/** Paystack sends the customer back here after checkout. We verify server-side; the URL alone proves nothing. */
export async function GET(req: NextRequest) {
  const reference = req.nextUrl.searchParams.get("reference") ?? req.nextUrl.searchParams.get("trxref");
  if (!reference) return NextResponse.redirect(`${appUrl()}/account`);
  const result = await finalizePayment(reference);
  const flag = result === "success" ? "ok=paid" : result === "pending" ? "error=payment-pending" : "error=payment-failed";
  return NextResponse.redirect(`${appUrl()}/account?${flag}`);
}
