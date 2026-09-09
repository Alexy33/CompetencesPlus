"use client";

import { Menu } from "lucide-react";
import { ProductName } from "./product-name";
import { SidebarPanel } from "./sidebar/sidebar-panel";
import type { SidebarSession } from "./sidebar/types";
import { useModalDrawer } from "./sidebar/use-modal-drawer";
import type { SiteSidebarProps } from "./types";

export type { SidebarSession };

export function SiteSidebar({ session }: SiteSidebarProps) {
  const { open, setOpen } = useModalDrawer();

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 lg:block">
        <SidebarPanel session={session} />
      </aside>

      <div className="sticky top-0 z-30 flex h-16 items-center gap-3 bg-canvas/90 px-5 backdrop-blur-md lg:hidden">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Ouvrir le menu"
          aria-expanded={open}
          className="rounded-xl p-2 text-ink transition-colors hover:text-brand-700"
        >
          <Menu aria-hidden="true" className="size-6" />
        </button>
        <ProductName />
      </div>

      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Fermer le menu"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/40 backdrop-blur-sm"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-2xl">
            <SidebarPanel session={session} onClose={() => setOpen(false)} />
          </div>
        </div>
      ) : null}
    </>
  );
}
