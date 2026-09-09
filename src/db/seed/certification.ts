import { eq } from "drizzle-orm";

import { db } from "@/db";
import { certificationAnswer, certificationAttempt, profile, user } from "@/db/schema";
import { computeScore, questionsOf, type LoadedQuestion } from "@/server/services/certification";
import { listVersions } from "@/server/services/questionnaire";

const DAY_MS = 86_400_000;

function optionForTarget(question: LoadedQuestion, ratio: number): string {
  const values = question.options.map((option) => option.value);
  const best = Math.max(...values);
  const wanted = best * ratio;

  let closest = question.options[0];
  for (const option of question.options) {
    if (Math.abs(option.value - wanted) < Math.abs(closest.value - wanted)) closest = option;
  }
  return closest.id;
}

function answersForTarget(
  questions: LoadedQuestion[],
  target: number,
): { answers: Record<string, string>; score: number } {
  let best: { answers: Record<string, string>; score: number } | null = null;

  for (let step = 0; step <= 100; step += 1) {
    const ratio = step / 100;
    const answers: Record<string, string> = {};
    for (const [index, question] of questions.entries()) {
      const nudge = index % 3 === 0 ? 0.08 : index % 3 === 1 ? -0.05 : 0;
      answers[question.id] = optionForTarget(question, Math.min(1, Math.max(0, ratio + nudge)));
    }
    const score = computeScore(questions, answers);
    if (!best || Math.abs(score - target) < Math.abs(best.score - target)) {
      best = { answers, score };
    }
    if (score >= target) break;
  }

  return best!;
}

export async function seedCertificationAttempts(
  threshold: number,
): Promise<{ attempts: number; version: number }> {
  const version = listVersions()[0];
  const questions = questionsOf(version);

  const certifies = await db
    .select({ userId: profile.userId, profileId: profile.id, target: profile.score })
    .from(profile)
    .innerJoin(user, eq(user.id, profile.userId))
    .where(eq(user.role, "candidate"));

  let attempts = 0;

  for (const [index, candidat] of certifies.entries()) {
    if (candidat.target === null) continue;

    const { answers, score } = answersForTarget(questions, candidat.target);
    const submittedAt = new Date(Date.now() - (index + 3) * DAY_MS);
    const attemptId = crypto.randomUUID();

    await db.insert(certificationAttempt).values({
      id: attemptId,
      userId: candidat.userId,
      status: "submitted",
      questionnaireVersion: version,
      score,
      passed: score >= threshold,
      submittedAt,
      createdAt: new Date(submittedAt.getTime() - 3600_000),
    });

    await db.insert(certificationAnswer).values(
      Object.entries(answers).map(([questionId, optionId]) => ({
        attemptId,
        questionId,
        optionId,
      })),
    );

    await db
      .update(profile)
      .set({
        score,
        certifiedAt: score >= threshold ? submittedAt : null,
      })
      .where(eq(profile.id, candidat.profileId));

    attempts += 1;
  }

  return { attempts, version };
}
