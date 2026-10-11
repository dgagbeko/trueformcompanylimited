import Link from "next/link";
import { getSettings } from "@/lib/settings";

export async function SiteFooter() {
  const s = await getSettings();
  return (
    <footer className="site-footer">
      <div className="kente" />
      <div className="inner">
        <div className="footer-cols">
          <div className="stack" style={{ gap: 12 }}>
            <span className="display" style={{ fontSize: 30, color: "#fff" }}>
              trueform<span className="t-yellow">.</span>
            </span>
            <span>Stays, car rentals, land, houses and insurance under one trusted brand.</span>
          </div>
          <nav aria-label="Services" className="stack" style={{ gap: 10 }}>
            <h2>Services</h2>
            <Link href="/stays">Stays</Link>
            <Link href="/cars">Car rentals</Link>
            <Link href="/land">Land</Link>
            <Link href="/houses">Houses</Link>
            <Link href="/insurance">Insurance</Link>
          </nav>
          <nav aria-label="Company" className="stack" style={{ gap: 10 }}>
            <h2>Company</h2>
            <Link href="/contact">Contact us</Link>
            <Link href="/privacy">Privacy policy</Link>
            <Link href="/terms">Terms &amp; cancellation</Link>
          </nav>
          <div className="stack" style={{ gap: 10 }}>
            <h2>Contact</h2>
            {s.supportPhone && <a href={`tel:${s.supportPhone.replace(/\s/g, "")}`}>{s.supportPhone}</a>}
            {s.supportEmail && <a href={`mailto:${s.supportEmail}`}>{s.supportEmail}</a>}
            {s.officeAddress && <span>{s.officeAddress}</span>}
            {!s.supportPhone && !s.supportEmail && <Link href="/contact">Send us a message</Link>}
          </div>
        </div>
        <div className="footer-legal">
          © {new Date().getFullYear()} TrueForm Excellence Company Limited. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
