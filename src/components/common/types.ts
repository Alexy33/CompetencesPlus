import type { ProfileStatus, VideoStatus } from "@/lib/vocabulary";
import type { VariantProps } from "class-variance-authority";
import type Link from "next/link";
import type { ComponentProps, ComponentType, ReactNode } from "react";
import type { action } from "./action-variants";
import type { chip } from "./chip-variants";
import type { surface } from "./surface-variants";

export type ActionVariants = VariantProps<typeof action>;

export type ActionProps = ComponentProps<"button"> & ActionVariants;

export type ActionLinkProps = ComponentProps<typeof Link> & ActionVariants;

export type ChipTone = NonNullable<VariantProps<typeof chip>["tone"]>;

export type ChipProps = ComponentProps<"span"> & VariantProps<typeof chip>;

export type ProfileStatusChipProps = { status: ProfileStatus };

export type VideoStatusChipProps = { status: VideoStatus };

export type SkillChipProps = { skill: string; index: number };

export type StatusMessageProps = { children: ReactNode; className?: string };

export type ErrorMessageProps = { children: ReactNode; className?: string };

export type FormAlertProps = { children: ReactNode };

export type EmptyStateProps = { children: ReactNode };

export type LoadingBlockProps = { label?: string };

export type FieldProps = {
  label: string;
  className?: string;
  children: ReactNode;
};

export type FieldLegendProps = { children: ReactNode };

export type PageHeaderProps = {
  eyebrow?: string;
  title: string;
  highlight?: string;
  description?: string;
  action?: ReactNode;
  className?: string;
};

export type StatTone = "brand" | "success" | "warning" | "info" | "danger";

export interface Stat {
  label: string;
  value: ReactNode;
  icon: ComponentType<{ className?: string }>;
  tone: StatTone;
}

export type StatGridProps = { stats: Stat[]; className?: string };

export type SurfaceProps = ComponentProps<"section"> & VariantProps<typeof surface>;

export type SurfaceHeadingProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};
