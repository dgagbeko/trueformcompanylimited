import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { NavLinks } from "./NavLinks";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="site-header">
      <div className="inner">
        <Link href="/" className="brand" aria-label="TrueForm Excellence home">
          <span className="brand-mark">TF</span>
          <span className="brand-name">
            <b>TrueForm</b>
            <small>EXCELLENCE</small>
          </span>
        </Link>
        <NavLinks />
        <div className="row">
          {user ? (
            <>
              {user.role === "admin" && (
                <Link className="navlink" href="/admin">
                  Back-office
                </Link>
              )}
              <Link className="btn btn-navy" href="/account">
                My account
              </Link>
            </>
          ) : (
            <>
              <Link className="navlink" href="/login">
                Sign in
              </Link>
              <Link className="btn btn-navy" href="/register">
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
