import type { UserRole } from "@/lib/vocabulary";
import type { ComponentType } from "react";

export interface SidebarSession {
  name: string;
  role: UserRole;
}

export interface NavLink {
  href: string;
  label: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean }>;
}

export type SidebarPanelProps = {
  session: SidebarSession | null;
  onClose?: () => void;
};

export type SidebarSessionCardProps = { session: SidebarSession | null };
