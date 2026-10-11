import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { NavLinks } from "./NavLinks";
import { MobileMenu } from "./MobileMenu";
import { Brand } from "./Brand";

export async function SiteHeader() {
  const user = await getCurrentUser();
  return (
    <header className="site-header">
      <div className="kente" />
      <div className="inner">
        <Brand />
        <NavLinks />
        <div className="header-actions">
          {user ? (
            <>
              {user.role === "admin" && <Link className="navlink" href="/admin">Back-office</Link>}
              <Link className="btn btn-ink" href="/account">My account</Link>
            </>
          ) : (
            <>
              <Link className="navlink" href="/login">Sign in</Link>
              <Link className="btn btn-ink" href="/register">Join free</Link>
            </>
          )}
        </div>
        <MobileMenu signedIn={Boolean(user)} isAdmin={user?.role === "admin"} />
      </div>
    </header>
  );
}
