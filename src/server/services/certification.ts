import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { certificationAnswer, certificationAttempt, profile } from "@/db/schema";
import type { QuestionType } from "@/lib/vocabulary";
import {
  getQuestionnaire,
  getQuestionnaireVersion,
  questionnaireVersion,
} from "./questionnaire";
import { getSettings } from "./settings";

export interface LoadedQuestion {
  id: string;
  text: string;
  type: QuestionType;
  weight: number;
  position: number;
  options: { id: string; label: string; value: number }[];
}

/**
 * Questions du questionnaire en vigueur, dans l'ordre du fichier.
 *
 * La position n'est plus une colonne : c'est le rang dans
 * `certification/questions.vN.json`, seule source de verite du bareme.
 */
export function loadQuestions(): LoadedQuestion[] {
  return questionsOf(getQuestionnaire().version);
}

/**
 * Questions d'une version donnee. Une tentative est TOUJOURS lue et calculee
 * avec la version sous laquelle elle a ete ouverte.
 */
export function questionsOf(version: number): LoadedQuestion[] {
  return getQuestionnaireVersion(version).questions.map((item, position) => ({
    id: item.id,
    text: item.text,
    type: item.type,
    weight: item.weight,
    position,
    options: item.options.map((option) => ({
      id: option.id,
      label: option.label,
      value: option.value,
    })),
  }));
}

export async function currentAttempt(userId: string) {
  const [inProgress] = await db
    .select()
    .from(certificationAttempt)
    .where(
      and(eq(certificationAttempt.userId, userId), eq(certificationAttempt.status, "in_progress")),
    )
    .limit(1);
  if (inProgress) return inProgress;

  const [last] = await db
    .select()
    .from(certificationAttempt)
    .where(eq(certificationAttempt.userId, userId))
    .orderBy(desc(certificationAttempt.createdAt))
    .limit(1);
  return last ?? null;
}

export async function openAttempt(userId: string) {
  const existing = await currentAttempt(userId);
  if (existing && existing.status === "in_progress") return existing;

  const [created] = await db
    .insert(certificationAttempt)
    .values({
      id: crypto.randomUUID(),
      userId,
      status: "in_progress",
      // Figee ici, jamais recalculee ensuite.
      questionnaireVersion: questionnaireVersion(),
    })
    .returning();
  return created;
}

export async function answersOf(attemptId: string): Promise<Record<string, number>> {
  const rows = await db
    .select()
    .from(certificationAnswer)
    .where(eq(certificationAnswer.attemptId, attemptId));
  return Object.fromEntries(rows.map((row) => [row.questionId, row.value]));
}

export interface CertificationState {
  status: "not_started" | "in_progress" | "submitted";
  answers: Record<string, number>;
  answered: number;
  questionCount: number;
  questionnaireVersion: number;
  threshold: number;
  score: number | null;
  passed: boolean | null;
  submittedAt: string | null;
}

export async function certificationState(userId: string): Promise<CertificationState> {
  const [attempt, settings] = await Promise.all([currentAttempt(userId), getSettings()]);

  // Une tentative existante reste lue avec SA version : le nombre de
  // questions affiche ne change pas sous les pieds du candidat.
  const version = attempt?.questionnaireVersion ?? questionnaireVersion();
  const questions = questionsOf(version);

  const answers = attempt ? await answersOf(attempt.id) : {};

  return {
    status: attempt ? attempt.status : "not_started",
    answers,
    answered: Object.keys(answers).length,
    questionCount: questions.length,
    questionnaireVersion: version,
    threshold: settings.certificationThreshold,
    score: attempt?.score ?? null,
    passed: attempt?.passed ?? null,
    submittedAt: attempt?.submittedAt?.toISOString() ?? null,
  };
}

export function computeScore(
  questions: LoadedQuestion[],
  answers: Record<string, number>,
): number {
  let obtained = 0;
  let maximum = 0;

  for (const item of questions) {
    const best = Math.max(0, ...item.options.map((option) => option.value));
    maximum += item.weight * best;

    const given = answers[item.id];
    if (typeof given === "number") obtained += item.weight * given;
  }

  if (maximum === 0) return 0;
  return Math.round((obtained / maximum) * 100);
}

export interface SubmitResult {
  score: number;
  threshold: number;
  passed: boolean;
  certified: boolean;
  questionnaireVersion: number;
}

export async function submitAttempt(userId: string): Promise<SubmitResult> {
  const attempt = await openAttempt(userId);
  const [settings, answers] = await Promise.all([getSettings(), answersOf(attempt.id)]);

  // Le bareme applique est celui sous lequel la tentative a ete ouverte,
  // meme si une version plus recente est deployee entre-temps.
  const questions = questionsOf(attempt.questionnaireVersion);
  const score = computeScore(questions, answers);
  const passed = score >= settings.certificationThreshold;
  const now = new Date();

  await db
    .update(certificationAttempt)
    .set({ status: "submitted", score, passed, submittedAt: now })
    .where(eq(certificationAttempt.id, attempt.id));

  const [owned] = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);

  if (owned && passed) {
    await db
      .update(profile)
      .set({ score, certifiedAt: now, updatedAt: now })
      .where(eq(profile.id, owned.id));
  }

  return {
    score,
    threshold: settings.certificationThreshold,
    passed,
    certified: passed || (owned?.certifiedAt ?? null) !== null,
    questionnaireVersion: attempt.questionnaireVersion,
  };
}
