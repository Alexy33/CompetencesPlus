import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { PROFILE_STATUS_LABELS, VIDEO_STATUS_LABELS } from "@/lib/labels";
import type { ProfileStatus, VideoStatus } from "@/lib/vocabulary";
import { cn } from "@/lib/utils";

const chip = cva("inline-flex items-center gap-1 rounded-full font-semibold", {
  variants: {
    tone: {
      brand: "bg-brand-200 text-brand-800",
      success: "bg-success text-success-fg",
      warning: "bg-warning text-warning-fg",
      danger: "bg-danger text-danger-fg",
      info: "bg-info text-info-fg",
      teal: "bg-teal text-teal-fg",
    },
    size: {
      xs: "px-2 py-1 text-[10px]",
      sm: "px-2.5 py-1 text-[11px]",
      md: "px-3 py-1.5 text-xs",
    },
  },
  defaultVariants: { tone: "brand", size: "sm" },
});

type ChipTone = NonNullable<VariantProps<typeof chip>["tone"]>;

export function Chip({
  tone,
  size,
  className,
  ...props
}: ComponentProps<"span"> & VariantProps<typeof chip>) {
  return <span className={cn(chip({ tone, size }), className)} {...props} />;
}

const PROFILE_STATUS_TONES: Record<ProfileStatus, ChipTone> = {
  published: "success",
  pending: "warning",
  removed: "danger",
};

const VIDEO_STATUS_TONES: Record<VideoStatus, ChipTone> = {
  approved: "success",
  pending: "warning",
  rejected: "danger",
};

export function ProfileStatusChip({ status }: { status: ProfileStatus }) {
  return (
    <Chip tone={PROFILE_STATUS_TONES[status]} size="xs" className="font-bold uppercase">
      {PROFILE_STATUS_LABELS[status]}
    </Chip>
  );
}

export function VideoStatusChip({ status }: { status: VideoStatus }) {
  return (
    <Chip tone={VIDEO_STATUS_TONES[status]} size="xs" className="font-bold uppercase">
      {VIDEO_STATUS_LABELS[status]}
    </Chip>
  );
}

const SKILL_TONES: ChipTone[] = ["teal", "danger", "warning"];

export function SkillChip({ skill, index }: { skill: string; index: number }) {
  return (
    <Chip tone={SKILL_TONES[index % SKILL_TONES.length]} size="sm">
      {skill}
    </Chip>
  );
}
