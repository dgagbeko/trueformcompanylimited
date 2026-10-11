import Link from "next/link";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Back-office", robots: { index: false } };

const NAV = [
  ["/admin", "Dashboard"],
  ["/admin/listings", "Listings"],
  ["/admin/bookings", "Bookings"],
  ["/admin/inquiries", "Land & house inquiries"],
  ["/admin/insurance", "Insurance requests"],
  ["/admin/payments", "Payments"],
  ["/admin/users", "Customers & admins"],
  ["/admin/settings", "Site settings"],
  ["/admin/activity", "Activity log"],
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="shell">
      <nav className="shell-nav" aria-label="Back-office">
        <Link href="/admin" className="row shell-brand" style={{ gap: 12, padding: "0 8px 24px", flexWrap: "nowrap" }}>
          <span className="brand-mark" style={{ background: "var(--yellow)", color: "var(--ink)" }}>tf</span>
          <span className="stack" style={{ gap: 0, lineHeight: 1.2 }}>
            <b className="display" style={{ color: "#fff", fontSize: 21 }}>trueform</b>
            <small style={{ fontSize: 11, color: "var(--yellow)", fontWeight: 700, letterSpacing: ".18em" }}>BACK-OFFICE</small>
          </span>
        </Link>
        {NAV.map(([href, label]) => <Link key={href} href={href}>{label}</Link>)}
        <div className="shell-foot" style={{ marginTop: "auto", paddingTop: 24, fontSize: 13, color: "var(--on-ink)" }}>
          Signed in as {admin.fullName}
          <br />
          <Link href="/" style={{ padding: 0, minHeight: 32 }}>← View website</Link>
        </div>
      </nav>
      <main className="shell-main">{children}</main>
    </div>
  );
}
