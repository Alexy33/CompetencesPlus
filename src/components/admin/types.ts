import type { ProfileStatus, QuestionType, VideoStatus } from "@/lib/vocabulary";
import type { VideoView } from "@/server/video/presentation";
import type { ComponentType } from "react";

export type Tab = "profils" | "videos" | "questionnaire";

export interface AdminStats {
  publishedProfiles: number;
  pendingProfiles: number;
  removedProfiles: number;
  certificationRate: number;
  questionCount: number;
  recruiterContacts: number;
}

export interface ModeratedProfile {
  id: string;
  name: string;
  title: string;
  hasVideo: boolean;
  status: ProfileStatus;
  createdAt: string;
}

export interface QuestionOption {
  id: string;
  label: string;
  value: number;
}

export interface EditableQuestion {
  id: string;
  text: string;
  type: QuestionType;
  weight: number;
  position: number;
  options: QuestionOption[];
}

export interface PlatformSettings {
  certificationThreshold: number;
  catalogPageSize: number;
}

export type AdminTabsProps = {
  current: Tab;
  pendingVideos: number;
  onChange: (tab: Tab) => void;
};

export type ModerationListProps = {
  profiles: ModeratedProfile[];
  deletingProfileId: string | null;
  onModerate: (id: string, status: ProfileStatus) => void;
  onDelete: (profile: ModeratedProfile) => void;
};

export type ModerationRowProps = {
  profile: ModeratedProfile;
  deleting: boolean;
  onModerate: (status: ProfileStatus) => void;
  onDelete: () => void;
};

export type QuestionCardProps = {
  question: EditableQuestion;
  position: number;
  onPatch: (patch: Partial<EditableQuestion>) => void;
  onDelete: () => void;
};

export type QuestionEditorProps = {
  questions: EditableQuestion[];
  version: number | null;
  dirty: boolean;
  publishing: boolean;
  onPatch: (id: string, patch: Partial<EditableQuestion>) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onPublish: () => void;
  onReset: () => void;
};

export type OptionRowProps = {
  option: QuestionOption;
  index: number;
  canRemove: boolean;
  onPatch: (patch: Partial<QuestionOption>) => void;
  onRemove: () => void;
};

export type SettingsFormProps = {
  settings: PlatformSettings | null;
  onChange: (settings: PlatformSettings) => void;
  onSave: () => void;
};

export type VideoRow = {
  profileId: string;
  name: string;
  title: string;
  video: VideoView;
  profileStatus: ProfileStatus;
  videoStatus: VideoStatus;
  reason: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  submittedAt: string;
};

export type VideoModerationProps = {
  rows: VideoRow[];
  onDecide: (profileId: string, decision: "approved" | "rejected", reason: string) => Promise<void>;
};

export type VideoDecision = "approved" | "rejected";

export type VideoModerationCardProps = {
  row: VideoRow;
  reason: string;
  busy: string | null;
  onReasonChange: (reason: string) => void;
  onDecide: (decision: VideoDecision) => Promise<void>;
};

export type AdminTab = {
  id: Tab;
  label: string;
  icon: ComponentType<{ className?: string }>;
};

export type ProfileTransition = {
  status: ProfileStatus;
  label: string;
  tone: "success" | "warning" | "danger";
};
