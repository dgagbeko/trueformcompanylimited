"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/stays", label: "Stays" },
  { href: "/cars", label: "Car Rentals" },
  { href: "/land", label: "Land" },
  { href: "/houses", label: "Houses" },
  { href: "/insurance", label: "Insurance" },
];

export function NavLinks() {
  const path = usePathname();
  return (
    <nav aria-label="Main" className="main-nav">
      {LINKS.map((l) => (
        <Link key={l.href} className="navlink" href={l.href} aria-current={path.startsWith(l.href) ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
