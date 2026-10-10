import { getSettings } from "@/lib/settings";

export const metadata = { title: "Terms & cancellation" };

export default async function TermsPage() {
  const s = await getSettings();
  return (
    <article className="wrap stack" style={{ padding: "56px 24px 88px", maxWidth: 820, lineHeight: 1.7 }}>
      <h1 className="serif" style={{ fontSize: 40 }}>Terms of service</h1>
      <p className="alert alert-info">Draft for review — have this text checked by a lawyer before launch.</p>
      <h2>Bookings</h2>
      <p>Stay and car bookings are confirmed only after successful payment. Unpaid bookings hold the dates for 30 minutes.</p>
      <h2>Cancellation policy</h2>
      <p>{s.cancellationPolicy}</p>
      <h2>Land and house sales</h2>
      <p>Inquiries are expressions of interest and do not create a sale. A deposit of {s.landDepositPercent}% reserves a property once the price has been agreed with our team; final sale terms are set out in a separate written agreement.</p>
      <h2>Insurance</h2>
      <p>Quotes are provided by our insurance partner and are subject to their underwriting terms.</p>
    </article>
  );
}
