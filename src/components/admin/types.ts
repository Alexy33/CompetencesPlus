import type { ProfileStatus } from "@/lib/vocabulary";

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
  videoUrl: string | null;
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
  weight: number;
  position: number;
  options: QuestionOption[];
}

export interface PlatformSettings {
  certificationThreshold: number;
  catalogPageSize: number;
}
