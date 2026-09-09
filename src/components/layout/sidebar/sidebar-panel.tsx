"use client";

import { ProductName } from "@/components/layout/product-name";
import { X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { isActivePath, navigationFor } from "./navigation";
import { SidebarSessionCard } from "./sidebar-session";
import type { SidebarPanelProps } from "./types";

export function SidebarPanel({ session, onClose }: SidebarPanelProps) {
  const pathname = usePathname();
  const links = navigationFor(session?.role ?? null);

  return (
    <div className="flex h-full flex-col bg-canvas px-5 py-7">
      <div className="flex items-start justify-between gap-2">
        <ProductName />
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer le menu"
            className="rounded-xl p-2 text-ink-muted transition-colors hover:text-brand-700"
          >
            <X aria-hidden="true" className="size-5" />
          </button>
        ) : null}
      </div>

      <nav
        aria-label={onClose ? "Navigation principale (menu mobile)" : "Navigation principale"}
        className="mt-8 flex flex-col gap-2"
      >
        {links.map(({ href, label, icon: Icon }) => {
          const active = isActivePath(pathname, href);

          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                active
                  ? "bg-brand text-white"
                  : "text-ink-muted hover:bg-white/70 hover:text-brand-700"
              }`}
            >
              <Icon aria-hidden className="size-5 stroke-[1.7]" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto pt-8">
        <SidebarSessionCard session={session} />
      </div>
    </div>
  );
}
