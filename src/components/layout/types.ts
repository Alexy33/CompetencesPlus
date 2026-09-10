import type * as React from "react";
import type { ReactNode } from "react";
import type { SidebarSession } from "./sidebar/types";

export type ErrorPageShellProps = {
  code: string;
  title: string;
  description: string;
  actions: ReactNode;
  children?: ReactNode;
};

export type LandingSessionActionsProps = { connected: boolean };

export type MentionDroitsProps = { className?: string };

export type ProductNameProps = { asLink?: boolean };

export type PublicNoticeProps = { className?: string };

export type SiteShellProps = { children: React.ReactNode };

export type SiteSidebarProps = { session: SidebarSession | null };
