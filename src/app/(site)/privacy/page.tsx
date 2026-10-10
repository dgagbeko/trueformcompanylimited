export const metadata = { title: "Privacy policy" };

export default function PrivacyPage() {
  return (
    <article className="wrap stack" style={{ padding: "56px 24px 88px", maxWidth: 820, lineHeight: 1.7 }}>
      <h1 className="serif" style={{ fontSize: 40 }}>Privacy policy</h1>
      <p className="alert alert-info">Draft for review — have this text checked against the Data Protection Act, 2012 (Act 843) before launch.</p>
      <h2>What we collect</h2>
      <p>Your name, email address and phone number when you create an account; the bookings, inquiries and quote requests you make; and payment status from our payment partner. We never receive or store your full card number or mobile money PIN.</p>
      <h2>How we use it</h2>
      <p>To verify your account, process bookings and payments, respond to inquiries and quote requests, send you receipts and service emails, and keep the platform secure.</p>
      <h2>Who we share it with</h2>
      <p>Our payment processor (Paystack), email delivery provider, media hosting provider and insurance partners when you request a quote. We do not sell your personal data.</p>
      <h2>Your rights</h2>
      <p>You can view and update your profile from your account, and ask us to correct or delete your data by contacting us.</p>
    </article>
  );
}
