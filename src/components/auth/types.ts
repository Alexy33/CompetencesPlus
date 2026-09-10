import type { DemoAccount } from "@/components/landing/types";
import type { Input } from "@/components/ui/input";
import type * as React from "react";
import type { ComponentProps, ReactNode } from "react";

export type AuthFieldProps = ComponentProps<typeof Input> & {
  id: string;
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  children?: ReactNode;
};

export type AuthSubmitProps = {
  loading: boolean;
  disabled?: boolean;
  children: ReactNode;
};

export type AuthSwitchProps = {
  prompt: string;
  href: string;
  label: string;
};

export type AuthPopupProps = Readonly<{ children: React.ReactNode }>;

export type DemoAccountCardProps = { account: DemoAccount };
