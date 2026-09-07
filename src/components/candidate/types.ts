import type { City, Sector, Skill } from "@/lib/vocabulary";

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
  bio: string;
  videoUrl: string;
  skills: Skill[];
}

export const MAX_SKILLS = 8;
