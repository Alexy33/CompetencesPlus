import type { CertificationStatus } from "../types";

export interface CertificationQuestion {
  id: string;
  text: string;
  position: number;
  options: { id: string; label: string }[];
}

export interface CertificationState {
  status: CertificationStatus;
  /** Identifiant de question -> identifiant de l'option choisie. */
  answers: Record<string, string>;
  answered: number;
  questionCount: number;
  threshold: number;
  score: number | null;
  passed: boolean | null;
  questionnaireVersion: number;
  currentQuestionnaireVersion: number;
  outdated: boolean;
  /** Rattrapage : questions restant a repondre. Vide sinon. */
  pendingQuestionIds: string[];
}

export interface CertificationResult {
  score: number;
  threshold: number;
  passed: boolean;
  certified: boolean;
  questionnaireVersion: number;
  currentQuestionnaireVersion: number;
  outdated: boolean;
}
