"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/creators", label: "Creators" },
  { href: "/niches", label: "Niches" },
  { href: "/brands", label: "Brands" },
  { href: "/about", label: "About" },
] as const;

export default function NavBar() {
  const pathname = usePathname() || "/";
  return (
    <nav className="flex items-center gap-7 text-sm">
      {LINKS.map(({ href, label }) => {
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`relative pb-1 transition-colors ${
              active ? "font-medium text-ink" : "text-muted hover:text-ink"
            }`}
          >
            {label}
            {active && (
              <span
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-teal"
                aria-hidden
              />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
