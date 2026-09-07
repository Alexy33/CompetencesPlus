import { ArrowLeft, LayoutGrid, Shield, UserRound, Users } from "lucide-react";
import type { ComponentType } from "react";

import type { UserRole } from "@/lib/vocabulary";

export interface NavLink {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

const PUBLIC_LINKS: NavLink[] = [
  { href: "/", label: "Accueil", icon: ArrowLeft },
  { href: "/catalogue", label: "Catalogue", icon: LayoutGrid },
];

const WORKSPACE_LINKS: Record<UserRole, NavLink> = {
  candidate: { href: "/candidate", label: "Mon espace", icon: UserRound },
  recruiter: { href: "/recruiter", label: "Mes candidats", icon: Users },
  admin: { href: "/admin", label: "Administration", icon: Shield },
};

export function navigationFor(role: UserRole | null): NavLink[] {
  return role ? [...PUBLIC_LINKS, WORKSPACE_LINKS[role]] : PUBLIC_LINKS;
}

export function isActivePath(pathname: string, href: string): boolean {
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}
