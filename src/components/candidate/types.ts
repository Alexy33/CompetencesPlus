import type { Availability, City, Sector, Skill } from "@/lib/vocabulary";
import type { OwnProfile, VideoConsentView } from "@/server/services/profiles";
import type { VideoView } from "@/server/video/presentation";
import type { ReactNode } from "react";
import type { CertificationQuestion, CertificationState } from "./certification/types";

export type CertificationStatus = "not_started" | "in_progress" | "submitted";

export interface CertificationSummary {
  status: CertificationStatus;
  answered: number;
  questionCount: number;
  score: number | null;
  passed: boolean | null;
  questionnaireVersion: number;
  currentQuestionnaireVersion: number;
  /** Certification obtenue sous une version anterieure : a repasser. */
  outdated: boolean;
  catchUp: boolean;
  pendingQuestionIds: string[];
}

export interface Notification {
  id: string;
  text: string;
  createdAt: string;
}

export interface ProfileDraft {
  name: string;
  title: string;
  sector: Sector;
  city: City;
  availability: Availability;
  bio: string;
  videoUrl: string;
  skills: Skill[];
}

export type CandidateDashboardProps = {
  initialProfile: OwnProfile;
  sectors: readonly Sector[];
  cities: readonly City[];
  skills: readonly Skill[];
  /** Hébergement par lien tiers activé sur ce déploiement (éteint par défaut). */
  embedEnabled: boolean;
};

export type CertificationPanelProps = {
  certification: CertificationSummary | null;
  fallbackScore: number | null;
};

export type CertificationQuestionnaireProps = {
  initialQuestions: CertificationQuestion[];
  initialState: CertificationState;
};

export type ConsentNotice = { version: string; text: string };

export type ConsentManagerProps = { initialConsent: VideoConsentView; hasVideo: boolean };

export type ConsentSummaryProps = { consent: OwnProfile["videoConsent"] };

export type NotificationsPanelProps = { notifications: Notification[] };

export type ProfileFormProps = {
  draft: ProfileDraft;
  sectors: readonly Sector[];
  cities: readonly City[];
  skills: readonly Skill[];
  saving: boolean;
  disabled: boolean;
  onPatch: (patch: Partial<ProfileDraft>) => void;
  onToggleSkill: (skill: Skill) => void;
  onSave: () => void;
};

export type VideoManagerProps = {
  name: string;
  video: VideoView;
  draftUrl: string;
  /** Hébergement par lien tiers (YouTube, Vimeo) : éteint par défaut. */
  embedEnabled: boolean;
  uploading: boolean;
  removing: boolean;
  disabled: boolean;
  onDraftUrlChange: (value: string) => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onSave: () => void;
  children?: ReactNode;
};

export type VideoModerationNoticeProps = {
  moderation: OwnProfile["videoModeration"];
};

export type ConsentStatusProps = { consent: VideoConsentView; videoPresent: boolean };

export type ConsentNoticeTextProps = { consent: VideoConsentView; notice: ConsentNotice | null };
