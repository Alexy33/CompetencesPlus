import { PROFILE_STATUS_LABELS, VIDEO_STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/utils";
import type { ProfileStatus, VideoStatus } from "@/lib/vocabulary";
import { chip } from "./chip-variants";
import type {
  ChipProps,
  ChipTone,
  ProfileStatusChipProps,
  SkillChipProps,
  VideoStatusChipProps,
} from "./types";

export function Chip({ tone, size, className, ...props }: ChipProps) {
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

export function ProfileStatusChip({ status }: ProfileStatusChipProps) {
  return (
    <Chip tone={PROFILE_STATUS_TONES[status]} size="xs" className="font-bold uppercase">
      {PROFILE_STATUS_LABELS[status]}
    </Chip>
  );
}

export function VideoStatusChip({ status }: VideoStatusChipProps) {
  return (
    <Chip tone={VIDEO_STATUS_TONES[status]} size="xs" className="font-bold uppercase">
      {VIDEO_STATUS_LABELS[status]}
    </Chip>
  );
}

const SKILL_TONES: ChipTone[] = ["teal", "danger", "warning"];

export function SkillChip({ skill, index }: SkillChipProps) {
  return (
    <Chip tone={SKILL_TONES[index % SKILL_TONES.length]} size="sm">
      {skill}
    </Chip>
  );
}
