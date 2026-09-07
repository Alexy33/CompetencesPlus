import type { CertificationStatus } from "../types";

export interface CertificationQuestion {
  id: string;
  text: string;
  position: number;
  options: { id: string; label: string }[];
}

export interface CertificationState {
  status: CertificationStatus;
  answers: Record<string, number>;
  answered: number;
  questionCount: number;
  threshold: number;
  score: number | null;
  passed: boolean | null;
}

export interface CertificationResult {
  score: number;
  threshold: number;
  passed: boolean;
  certified: boolean;
}
