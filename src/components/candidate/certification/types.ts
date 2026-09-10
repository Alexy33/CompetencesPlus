import type { CertificationStatus } from "@/components/candidate/types";

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
  catchUp: boolean;
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

export type OptionButtonProps = {
  label: string;
  active: boolean;
  disabled: boolean;
  onSelect: () => void;
};

export type QuestionStepProps = {
  question: CertificationQuestion;
  position: number;
  total: number;
  selected: string | undefined;
  busy: boolean;
  error: string | null;
  onAnswer: (optionId: string) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
};

export type ResultCardProps = {
  result: CertificationResult;
  busy: boolean;
  onRestart: () => void;
};
