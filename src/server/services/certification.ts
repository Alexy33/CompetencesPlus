import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { certificationAnswer, certificationAttempt, profile } from "@/db/schema";
import type { QuestionType } from "@/lib/vocabulary";
import {
  getQuestionnaire,
  getQuestionnaireVersion,
  questionnaireVersion,
  questionsToReanswer,
} from "./questionnaire";
import { getSettings } from "./settings";
import { toIsoOrNull } from "@/lib/dates";

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
  return toLoadedQuestions(getQuestionnaireVersion(version));
}

export function readableVersion(version: number): number {
  try {
    getQuestionnaireVersion(version);
    return version;
  } catch {
    return questionnaireVersion();
  }
}

function toLoadedQuestions(questionnaire: {
  questions: readonly {
    id: string;
    text: string;
    type: QuestionType;
    weight: number;
    options: readonly { id: string; label: string; value: number }[];
  }[];
}): LoadedQuestion[] {
  return questionnaire.questions.map((item, position) => ({
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

  // createdAt est en secondes : deux tentatives rapprochees s'y confondent.
  // On departage par date de soumission, puis par version, pour toujours
  // rendre le resultat le plus recent.
  const [last] = await db
    .select()
    .from(certificationAttempt)
    .where(eq(certificationAttempt.userId, userId))
    .orderBy(
      desc(certificationAttempt.submittedAt),
      desc(certificationAttempt.questionnaireVersion),
      desc(certificationAttempt.createdAt),
    )
    .limit(1);
  return last ?? null;
}

/**
 * Vrai si l'erreur est le refus, par l'index partiel
 * `certification_attempt_one_in_progress`, d'une seconde tentative en cours.
 */
function isDuplicateAttempt(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    (error as { code?: unknown }).code === "SQLITE_CONSTRAINT_UNIQUE"
  );
}

export async function openAttempt(userId: string) {
  const existing = await currentAttempt(userId);
  if (existing && existing.status === "in_progress") return existing;

  try {
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
  } catch (error) {
    // Course perdue : un autre appel a insere entre notre lecture et notre
    // ecriture. L'index a fait son travail — il reste a relire la tentative
    // gagnante et a la rendre, comme si nous l'avions trouvee du premier coup.
    // Repondre 500 ici transformerait une concurrence normale en panne.
    if (!isDuplicateAttempt(error)) throw error;

    const winner = await currentAttempt(userId);
    if (winner && winner.status === "in_progress") return winner;
    throw error;
  }
}

/** Reponses enregistrees : identifiant de question -> option choisie. */
export async function answersOf(attemptId: string): Promise<Record<string, string>> {
  const rows = await db
    .select()
    .from(certificationAnswer)
    .where(eq(certificationAnswer.attemptId, attemptId));
  return Object.fromEntries(rows.map((row) => [row.questionId, row.optionId]));
}

export interface CertificationState {
  status: "not_started" | "in_progress" | "submitted";
  answers: Record<string, string>;
  answered: number;
  questionCount: number;
  questionnaireVersion: number;
  currentQuestionnaireVersion: number;
  /**
   * Vrai quand la tentative porte sur une version anterieure a celle en
   * vigueur : le candidat doit repasser le questionnaire. Le badge deja
   * obtenu reste affiche aux recruteurs en attendant.
   */
  outdated: boolean;
  /** Vrai si la tentative en cours est un rattrapage de certification. */
  catchUp: boolean;
  /**
   * Rattrapage en cours : identifiants des questions restant a repondre.
   * Vide pour une passation ordinaire, ou tout le questionnaire est pose.
   */
  pendingQuestionIds: string[];
  threshold: number;
  score: number | null;
  passed: boolean | null;
  submittedAt: string | null;
}

export async function certificationState(userId: string): Promise<CertificationState> {
  const [attempt, settings] = await Promise.all([currentAttempt(userId), getSettings()]);

  // Une tentative existante reste lue avec SA version : le nombre de
  // questions affiche ne change pas sous les pieds du candidat.
  const version = readableVersion(attempt?.questionnaireVersion ?? questionnaireVersion());
  const questions = questionsOf(version);

  const answers = attempt ? await answersOf(attempt.id) : {};

  const current = questionnaireVersion();

  // Rattrapage en cours : seules les questions sans reponse restent a poser.
  // On se fie au marqueur de la tentative, pas au nombre de reponses reportees
  // — une version peut avoir modifie TOUTES les questions.
  const pendingQuestionIds =
    attempt?.status === "in_progress" && attempt.catchUp
      ? questions.filter((question) => answers[question.id] === undefined).map((q) => q.id)
      : [];

  return {
    status: attempt ? attempt.status : "not_started",
    answers,
    answered: Object.keys(answers).length,
    questionCount: questions.length,
    questionnaireVersion: version,
    currentQuestionnaireVersion: current,
    catchUp: attempt?.status === "in_progress" && attempt.catchUp,
    pendingQuestionIds,
    // Seule une tentative DEJA SOUMISE peut etre perimee : une tentative en
    // cours reste legitimement sur sa version jusqu'a sa validation.
    outdated: attempt?.status === "submitted" && version < current,
    threshold: settings.certificationThreshold,
    score: attempt?.score ?? null,
    passed: attempt?.passed ?? null,
    submittedAt: toIsoOrNull(attempt?.submittedAt),
  };
}

/**
 * Score sur 100. Les points viennent du questionnaire, jamais du client :
 * `answers` ne porte que l'option choisie par le candidat.
 */
export function computeScore(
  questions: LoadedQuestion[],
  answers: Record<string, string>,
): number {
  let obtained = 0;
  let maximum = 0;

  for (const item of questions) {
    const best = Math.max(0, ...item.options.map((option) => option.value));
    maximum += item.weight * best;

    const chosen = item.options.find((option) => option.id === answers[item.id]);
    // Une option inconnue (question repondue puis questionnaire modifie) ne
    // rapporte rien, mais la question reste comptee dans le maximum.
    if (chosen) obtained += item.weight * chosen.value;
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
  currentQuestionnaireVersion: number;
  outdated: boolean;
}

export async function submitAttempt(userId: string): Promise<SubmitResult> {
  const attempt = await openAttempt(userId);
  const [settings, answers] = await Promise.all([getSettings(), answersOf(attempt.id)]);

  // Le bareme applique est celui sous lequel la tentative a ete ouverte,
  // meme si une version plus recente est deployee entre-temps.
  const questions = questionsOf(readableVersion(attempt.questionnaireVersion));
  const current = questionnaireVersion();
  const score = computeScore(questions, answers);
  const passed = score >= settings.certificationThreshold;
  const now = new Date();

  await db
    .update(certificationAttempt)
    .set({ status: "submitted", score, passed, submittedAt: now })
    .where(eq(certificationAttempt.id, attempt.id));

  const [owned] = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);

  if (owned) {
    // Le dernier resultat fait foi : sous le seuil, la certification est
    // retiree du profil public. Le score, lui, est toujours mis a jour.
    await db
      .update(profile)
      .set({ score, certifiedAt: passed ? now : null, updatedAt: now })
      .where(eq(profile.id, owned.id));
  }

  return {
    score,
    threshold: settings.certificationThreshold,
    passed,
    certified: passed,
    questionnaireVersion: attempt.questionnaireVersion,
    currentQuestionnaireVersion: current,
    // Le candidat vient de valider : perime seulement si une version plus
    // recente est parue pendant qu'il repondait.
    outdated: attempt.questionnaireVersion < current,
  };
}


export interface CatchUp {
  attemptId: string;
  fromVersion: number;
  toVersion: number;
  /** Questions que le candidat doit (re)passer. */
  questionIds: string[];
  /** Reponses reprises telles quelles depuis la tentative precedente. */
  carriedOver: number;
}

/**
 * Ouvre un rattrapage vers le questionnaire en vigueur.
 *
 * Le candidat ne repond qu'aux questions nouvelles ou dont le bareme a change ;
 * ses autres reponses sont reportees. La tentative precedente n'est pas
 * modifiee : elle garde sa version, son score et son horodatage.
 *
 * Rend null s'il n'y a rien a rattraper.
 */
export async function openCatchUp(userId: string): Promise<CatchUp | null> {
  const previous = await currentAttempt(userId);
  const current = questionnaireVersion();

  // Rien a rattraper : aucune tentative, ou deja a jour.
  if (!previous || previous.questionnaireVersion >= current) return null;

  // Une tentative en cours n'est pas un rattrapage : le candidat est en train
  // de repondre, on ne lui reprend pas ses reponses a mi-parcours.
  if (previous.status !== "submitted") return null;

  const toReanswer = new Set(questionsToReanswer(previous.questionnaireVersion, current));
  const previousAnswers = await answersOf(previous.id);
  const target = questionsOf(current);

  const [created] = await db
    .insert(certificationAttempt)
    .values({
      id: crypto.randomUUID(),
      userId,
      status: "in_progress",
      questionnaireVersion: current,
      catchUp: true,
    })
    .returning();

  // Report des reponses encore valables : la question existe dans la nouvelle
  // version, son bareme n'a pas bouge, et l'option choisie y figure toujours.
  const carried = target
    .filter((question) => !toReanswer.has(question.id))
    .map((question) => ({ question, optionId: previousAnswers[question.id] }))
    .filter(
      (entry): entry is { question: LoadedQuestion; optionId: string } =>
        entry.optionId !== undefined &&
        entry.question.options.some((option) => option.id === entry.optionId),
    );

  if (carried.length > 0) {
    await db.insert(certificationAnswer).values(
      carried.map((entry) => ({
        attemptId: created.id,
        questionId: entry.question.id,
        optionId: entry.optionId,
      })),
    );
  }

  return {
    attemptId: created.id,
    fromVersion: previous.questionnaireVersion,
    toVersion: current,
    questionIds: target.filter((q) => toReanswer.has(q.id)).map((q) => q.id),
    carriedOver: carried.length,
  };
}
