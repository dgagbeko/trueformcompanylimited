"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { NAV_LINKS } from "./NavLinks";
import { Brand } from "./Brand";

/** Phone/tablet navigation: one ☰ button that opens a full-screen menu. */
export function MobileMenu({ signedIn, isAdmin }: { signedIn: boolean; isAdmin: boolean }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    if (!open) return;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = overflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <button type="button" className="menu-btn" aria-label="Open menu" aria-expanded={open} onClick={() => setOpen(true)}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M4 7h16M4 12h10M4 17h16" /></svg>
      </button>
      {open && (
        <div className="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu">
          <div className="kente" />
          <div className="top">
            <Brand />
            <button ref={closeRef} type="button" className="menu-btn" style={{ display: "grid" }} aria-label="Close menu" onClick={() => setOpen(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg>
            </button>
          </div>
          <nav aria-label="Main">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href} aria-current={path.startsWith(l.href) ? "page" : undefined}>
                {l.label} <span aria-hidden="true">→</span>
              </Link>
            ))}
          </nav>
          <div className="actions">
            {signedIn ? (
              <>
                <Link className="btn btn-ink" href="/account">My account</Link>
                {isAdmin && <Link className="btn btn-line" href="/admin">Back-office</Link>}
              </>
            ) : (
              <>
                <Link className="btn btn-ink" href="/register">Create account</Link>
                <Link className="btn btn-line" href="/login">Sign in</Link>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
