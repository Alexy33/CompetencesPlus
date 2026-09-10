import { LandingSessionActions } from "@/components/layout/landing-session-actions";
import { ProductName } from "@/components/layout/product-name";
import Link from "next/link";
import { NAV_LINKS } from "./landing-content";
import type { LandingHeaderProps } from "./types";

export function LandingHeader({ connected }: LandingHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-canvas/80 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-6 md:px-10">
        <ProductName />

        <nav
          aria-label="Sections de la page"
          className="hidden items-center gap-2 rounded-full bg-canvas p-2 shadow-pressed-xs md:flex"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-full px-5 py-2 text-sm font-semibold text-ink-muted transition-all hover:text-brand-700"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <LandingSessionActions connected={connected} />
      </div>
    </header>
  );
}
