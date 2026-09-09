import type { ComponentType } from "react";

export interface LandingItem {
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
  title: string;
  description: string;
}

export interface LandingStep extends LandingItem {
  number: string;
}

export interface DemoAccount {
  role: string;
  email: string;
  chipClassName: string;
  destination: "/candidate" | "/recruiter" | "/admin";
}

export type LandingHeaderProps = { connected: boolean };
