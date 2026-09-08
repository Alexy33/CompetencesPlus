import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Versionnement au niveau de la TENTATIVE, sur une vraie base migree.
 *
 *   charger v1 -> creer une tentative -> la tentative porte la version 1
 *   -> remplacer le questionnaire par v2 -> la tentative reste en version 1
 *
 * La base est jetable et le questionnaire de production n'est jamais modifie.
 */

const REPO = process.cwd();

const option = (id: string, value: number) => ({ id, label: `Reponse ${id}`, value });

const question = (id: string, weight = 2) => ({
  id,
  text: `Enonce de ${id}`,
  type: "single_choice",
  weight,
  options: [option(`${id}-o1`, 0), option(`${id}-o2`, 1)],
});

const V1 = { version: 1, questions: [question("q1"), question("q2", 3)] };

/** Alias expressif pour les scenarios de publication. */
const QUESTION = question;
const V2 = { version: 2, questions: [question("q1", 5), question("q3")] };

let workdir: string;

function writeVersion(doc: { version: number }) {
  writeFileSync(
    path.join(workdir, "certification", `questions.v${doc.version}.json`),
    JSON.stringify(doc),
    "utf8",
  );
}

beforeEach(async () => {
  workdir = mkdtempSync(path.join(tmpdir(), "certif-attempt-"));
  mkdirSync(path.join(workdir, "certification"), { recursive: true });
  writeVersion(V1);

  process.env.DATABASE_URL = `file:${path.join(workdir, "test.db")}`;
  vi.resetModules();

  // Migrations reelles du depot, appliquees a la base jetable.
  const { db } = await import("@/db");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  migrate(db, { migrationsFolder: path.join(REPO, "drizzle") });

  // Le loader du questionnaire lit `${cwd}/certification`.
  vi.spyOn(process, "cwd").mockReturnValue(workdir);
  const questionnaire = await import("../questionnaire");
  questionnaire.resetQuestionnaireCache();
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(workdir, { recursive: true, force: true });
});

async function createUser(id: string) {
  const { db } = await import("@/db");
  const { user } = await import("@/db/schema");
  await db.insert(user).values({ id, name: id, email: `${id}@test.fr`, role: "candidate" });
}

describe("tentative de certification — enregistrement de la version", () => {
  it("stocke la version du questionnaire en vigueur a l'ouverture", async () => {
    await createUser("u1");
    const { openAttempt } = await import("../certification");

    const attempt = await openAttempt("u1");
    expect(attempt.questionnaireVersion).toBe(1);
  });

  it("n'exige aucune version fournie par l'appelant", async () => {
    await createUser("u1");
    const { openAttempt } = await import("../certification");

    // openAttempt ne prend que l'utilisateur : la version vient du fichier.
    expect(openAttempt.length).toBe(1);
    expect((await openAttempt("u1")).questionnaireVersion).toBe(1);
  });

  it("expose la version de la tentative dans l'etat de certification", async () => {
    await createUser("u1");
    const { openAttempt, certificationState } = await import("../certification");

    await openAttempt("u1");
    const state = await certificationState("u1");

    expect(state.questionnaireVersion).toBe(1);
    expect(state.questionCount).toBe(2);
  });
});

describe("tentative de certification — preservation apres passage a v2", () => {
  it("une tentative v1 reste en v1 apres le deploiement de v2", async () => {
    await createUser("u1");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");

    const before = await certification.openAttempt("u1");
    expect(before.questionnaireVersion).toBe(1);

    // Deploiement de v2.
    writeVersion(V2);
    questionnaire.resetQuestionnaireCache();
    expect(questionnaire.questionnaireVersion()).toBe(2);

    // La tentative deja ouverte n'est pas reinterpretee.
    const after = await certification.currentAttempt("u1");
    expect(after?.questionnaireVersion).toBe(1);

    const state = await certification.certificationState("u1");
    expect(state.questionnaireVersion).toBe(1);
    // Elle continue de voir les questions de v1, pas celles de v2.
    expect(certification.questionsOf(state.questionnaireVersion).map((q) => q.id)).toEqual([
      "q1",
      "q2",
    ]);
  });

  it("une tentative soumise sous v1 conserve sa version et son score", async () => {
    await createUser("u1");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");
    const { db } = await import("@/db");
    const { certificationAnswer } = await import("@/db/schema");

    const attempt = await certification.openAttempt("u1");
    await db.insert(certificationAnswer).values([
      { attemptId: attempt.id, questionId: "q1", optionId: "q1-o2" },
      { attemptId: attempt.id, questionId: "q2", optionId: "q2-o2" },
    ]);

    const result = await certification.submitAttempt("u1");
    expect(result.questionnaireVersion).toBe(1);
    expect(result.score).toBe(100);

    // v2 change les ponderations et la composition du questionnaire.
    writeVersion(V2);
    questionnaire.resetQuestionnaireCache();

    const state = await certification.certificationState("u1");
    expect(state.questionnaireVersion).toBe(1);
    expect(state.score).toBe(100);
    expect(state.status).toBe("submitted");
  });

  it("une tentative ouverte apres le deploiement porte la version 2", async () => {
    await createUser("u1");
    await createUser("u2");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");

    const old = await certification.openAttempt("u1");
    expect(old.questionnaireVersion).toBe(1);

    writeVersion(V2);
    questionnaire.resetQuestionnaireCache();

    const fresh = await certification.openAttempt("u2");
    expect(fresh.questionnaireVersion).toBe(2);

    // Les deux coexistent, chacune sur sa version.
    expect((await certification.currentAttempt("u1"))?.questionnaireVersion).toBe(1);
    expect((await certification.currentAttempt("u2"))?.questionnaireVersion).toBe(2);
  });

  it("un nouvel essai apres le deploiement repart sur la version en vigueur", async () => {
    await createUser("u1");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");
    const { db } = await import("@/db");
    const { certificationAttempt } = await import("@/db/schema");

    const first = await certification.openAttempt("u1");
    await certification.submitAttempt("u1");

    writeVersion(V2);
    questionnaire.resetQuestionnaireCache();

    // Equivalent d'un « repasser le questionnaire ».
    await db.insert(certificationAttempt).values({
      id: crypto.randomUUID(),
      userId: "u1",
      status: "in_progress",
      questionnaireVersion: questionnaire.questionnaireVersion(),
    });

    const current = await certification.currentAttempt("u1");
    expect(current?.questionnaireVersion).toBe(2);

    // L'ancienne tentative n'a pas bouge.
    const [previous] = await db
      .select()
      .from(certificationAttempt)
      .where((await import("drizzle-orm")).eq(certificationAttempt.id, first.id));
    expect(previous.questionnaireVersion).toBe(1);
  });
});

describe("tentative en cours pendant une publication admin", () => {
  it("un candidat en cours de questionnaire garde son bareme quand l'admin publie", async () => {
    await createUser("amina");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");
    const { db } = await import("@/db");
    const { certificationAnswer } = await import("@/db/schema");

    // Amina ouvre sa tentative sous v1 et repond a la premiere question.
    const attempt = await certification.openAttempt("amina");
    expect(attempt.questionnaireVersion).toBe(1);

    await db
      .insert(certificationAnswer)
      .values({ attemptId: attempt.id, questionId: "q2", optionId: "q2-o2" });

    // Pendant ce temps, l'administrateur publie une v2 qui supprime q2,
    // change le poids de q1 et ajoute q3.
    questionnaire.publishQuestionnaire([
      { ...QUESTION("q1", 5) },
      { ...QUESTION("q3") },
    ]);
    expect(questionnaire.questionnaireVersion()).toBe(2);

    // Amina continue : elle voit toujours le questionnaire v1.
    const state = await certification.certificationState("amina");
    expect(state.questionnaireVersion).toBe(1);
    expect(state.questionCount).toBe(2);
    expect(certification.questionsOf(state.questionnaireVersion).map((q) => q.id)).toEqual([
      "q1",
      "q2",
    ]);

    // Sa reponse a q2 — question qui n'existe plus en v2 — est conservee.
    expect(state.answers).toEqual({ q2: "q2-o2" });

    // Et son score est calcule avec le bareme v1.
    await db
      .insert(certificationAnswer)
      .values({ attemptId: attempt.id, questionId: "q1", optionId: "q1-o2" });

    const result = await certification.submitAttempt("amina");
    expect(result.questionnaireVersion).toBe(1);
    expect(result.score).toBe(100);
  });

  it("le candidat suivant demarre sur la version publiee", async () => {
    await createUser("amina");
    await createUser("karim");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");

    await certification.openAttempt("amina");
    questionnaire.publishQuestionnaire([QUESTION("q1", 5), QUESTION("q3")]);

    const karim = await certification.openAttempt("karim");
    expect(karim.questionnaireVersion).toBe(2);
    expect(certification.questionsOf(2).map((q) => q.id)).toEqual(["q1", "q3"]);

    // Amina n'a pas bouge.
    expect((await certification.currentAttempt("amina"))?.questionnaireVersion).toBe(1);
  });
});

describe("certification perimee — signalement au candidat", () => {
  it("ne signale rien tant qu'aucune nouvelle version n'est parue", async () => {
    await createUser("amina");
    const certification = await import("../certification");
    const { db } = await import("@/db");
    const { certificationAnswer } = await import("@/db/schema");

    const attempt = await certification.openAttempt("amina");
    await db.insert(certificationAnswer).values([
      { attemptId: attempt.id, questionId: "q1", optionId: "q1-o2" },
      { attemptId: attempt.id, questionId: "q2", optionId: "q2-o2" },
    ]);
    await certification.submitAttempt("amina");

    const state = await certification.certificationState("amina");
    expect(state.outdated).toBe(false);
    expect(state.questionnaireVersion).toBe(1);
    expect(state.currentQuestionnaireVersion).toBe(1);
  });

  it("signale une certification obtenue sous une version anterieure", async () => {
    await createUser("amina");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");
    const { db } = await import("@/db");
    const { certificationAnswer } = await import("@/db/schema");

    const attempt = await certification.openAttempt("amina");
    await db.insert(certificationAnswer).values([
      { attemptId: attempt.id, questionId: "q1", optionId: "q1-o2" },
      { attemptId: attempt.id, questionId: "q2", optionId: "q2-o2" },
    ]);
    const result = await certification.submitAttempt("amina");
    expect(result.passed).toBe(true);

    questionnaire.publishQuestionnaire([QUESTION("q1", 5), QUESTION("q3")]);

    const state = await certification.certificationState("amina");
    expect(state.outdated).toBe(true);
    expect(state.questionnaireVersion).toBe(1);
    expect(state.currentQuestionnaireVersion).toBe(2);
    // Le score obtenu reste celui de la v1 : le badge n'est pas retire.
    expect(state.score).toBe(100);
    expect(state.passed).toBe(true);
  });

  it("ne signale pas une tentative EN COURS sous une version anterieure", async () => {
    await createUser("amina");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");

    await certification.openAttempt("amina");
    questionnaire.publishQuestionnaire([QUESTION("q1", 5), QUESTION("q3")]);

    // Elle est en train de repondre : on ne lui coupe pas son questionnaire.
    const state = await certification.certificationState("amina");
    expect(state.status).toBe("in_progress");
    expect(state.outdated).toBe(false);
    expect(state.questionnaireVersion).toBe(1);
  });

  it("signale la peremption si une version parait pendant la passation", async () => {
    await createUser("amina");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");
    const { db } = await import("@/db");
    const { certificationAnswer } = await import("@/db/schema");

    const attempt = await certification.openAttempt("amina");
    await db.insert(certificationAnswer).values([
      { attemptId: attempt.id, questionId: "q1", optionId: "q1-o2" },
      { attemptId: attempt.id, questionId: "q2", optionId: "q2-o2" },
    ]);

    // v2 parait avant qu'elle valide.
    questionnaire.publishQuestionnaire([QUESTION("q1", 5), QUESTION("q3")]);

    const result = await certification.submitAttempt("amina");
    // Son score reste calcule en v1...
    expect(result.questionnaireVersion).toBe(1);
    expect(result.score).toBe(100);
    // ...mais on lui dit de repasser.
    expect(result.outdated).toBe(true);
    expect(result.currentQuestionnaireVersion).toBe(2);
  });

  it("un candidat jamais certifie n'est pas marque perime", async () => {
    await createUser("karim");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");

    questionnaire.publishQuestionnaire([QUESTION("q1", 5), QUESTION("q3")]);

    const state = await certification.certificationState("karim");
    expect(state.status).toBe("not_started");
    expect(state.outdated).toBe(false);
    // Il demarrera directement sur la version en vigueur.
    expect(state.questionnaireVersion).toBe(2);
  });
});

/**
 * Reprise du questionnaire apres peremption. Reproduit la logique de
 * POST /api/me/certification/restart : une tentative en cours n'est recyclee
 * que si elle porte deja la version en vigueur.
 */
async function restart(userId: string) {
  const { db } = await import("@/db");
  const { certificationAnswer, certificationAttempt } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const certification = await import("../certification");
  const { questionnaireVersion } = await import("../questionnaire");

  const existing = await certification.currentAttempt(userId);
  const current = questionnaireVersion();

  if (existing && existing.status === "in_progress" && existing.questionnaireVersion === current) {
    await db.delete(certificationAnswer).where(eq(certificationAnswer.attemptId, existing.id));
  } else {
    if (existing && existing.status === "in_progress") {
      await db.delete(certificationAttempt).where(eq(certificationAttempt.id, existing.id));
    }
    await db.insert(certificationAttempt).values({
      id: crypto.randomUUID(),
      userId,
      status: "in_progress",
      questionnaireVersion: current,
    });
  }

  return certification.currentAttempt(userId);
}

describe("repasser le questionnaire apres peremption", () => {
  it("repart sur la version en vigueur apres une certification perimee", async () => {
    await createUser("amina");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");
    const { db } = await import("@/db");
    const { certificationAnswer } = await import("@/db/schema");

    const attempt = await certification.openAttempt("amina");
    await db.insert(certificationAnswer).values([
      { attemptId: attempt.id, questionId: "q1", optionId: "q1-o2" },
      { attemptId: attempt.id, questionId: "q2", optionId: "q2-o2" },
    ]);
    await certification.submitAttempt("amina");

    questionnaire.publishQuestionnaire([QUESTION("q1", 5), QUESTION("q3")]);

    const fresh = await restart("amina");
    expect(fresh?.questionnaireVersion).toBe(2);
    expect(fresh?.status).toBe("in_progress");

    const state = await certification.certificationState("amina");
    expect(state.outdated).toBe(false);
    expect(certification.questionsOf(state.questionnaireVersion).map((q) => q.id)).toEqual([
      "q1",
      "q3",
    ]);
  });

  it("ne laisse pas un candidat bloque sur une version perimee en cours", async () => {
    await createUser("amina");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");

    // Tentative ouverte en v1, JAMAIS soumise.
    const old = await certification.openAttempt("amina");
    expect(old.questionnaireVersion).toBe(1);

    questionnaire.publishQuestionnaire([QUESTION("q1", 5), QUESTION("q3")]);

    // Sans la correction, le restart recyclait la tentative v1 et le candidat
    // ne pouvait jamais atteindre la v2.
    const fresh = await restart("amina");
    expect(fresh?.questionnaireVersion).toBe(2);
    expect(fresh?.id).not.toBe(old.id);
  });

  it("recycle la tentative quand la version n'a pas change", async () => {
    await createUser("amina");
    const certification = await import("../certification");
    const { db } = await import("@/db");
    const { certificationAnswer } = await import("@/db/schema");

    const attempt = await certification.openAttempt("amina");
    await db
      .insert(certificationAnswer)
      .values({ attemptId: attempt.id, questionId: "q1", optionId: "q1-o2" });

    const same = await restart("amina");
    // Meme tentative, reponses effacees.
    expect(same?.id).toBe(attempt.id);
    expect(await certification.answersOf(attempt.id)).toEqual({});
  });
});

describe("bareme libre — points non contigus", () => {
  /**
   * Regression : le front envoyait l'INDEX de l'option, ce qui ne coincidait
   * avec les points que tant qu'ils valaient 0,1,2,3. Des qu'un administrateur
   * saisit des points libres (11, 40...), l'index ne veut plus rien dire.
   * La reponse transporte donc l'identifiant de l'option.
   */
  const LIBRE = {
    id: "q1",
    text: "Question a bareme libre",
    type: "single_choice" as const,
    weight: 3,
    options: [
      { id: "q1-o1", label: "Nulle", value: 0 },
      { id: "q1-o2", label: "Moyenne", value: 7 },
      { id: "q1-o3-1788771458154", label: "Excellente", value: 11 },
    ],
  };

  it("accepte une option dont les points ne suivent pas l'index", async () => {
    await createUser("amina");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");

    questionnaire.publishQuestionnaire([LIBRE]);
    const questions = certification.questionsOf(2);

    // La meilleure reponse rapporte 11 points, et non 2 comme son index.
    expect(certification.computeScore(questions, { q1: "q1-o3-1788771458154" })).toBe(100);
    expect(certification.computeScore(questions, { q1: "q1-o1" })).toBe(0);
    // 7/11 arrondi.
    expect(certification.computeScore(questions, { q1: "q1-o2" })).toBe(64);
  });

  it("ignore une option qui n'existe pas dans la question", async () => {
    await createUser("amina");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");

    questionnaire.publishQuestionnaire([LIBRE]);
    const questions = certification.questionsOf(2);

    // Un index envoye par erreur ne rapporte plus rien, au lieu d'etre pris
    // pour des points.
    expect(certification.computeScore(questions, { q1: "2" })).toBe(0);
  });

  it("enregistre et relit l'option choisie de bout en bout", async () => {
    await createUser("amina");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");
    const { db } = await import("@/db");
    const { certificationAnswer } = await import("@/db/schema");

    questionnaire.publishQuestionnaire([LIBRE]);
    const attempt = await certification.openAttempt("amina");
    expect(attempt.questionnaireVersion).toBe(2);

    await db.insert(certificationAnswer).values({
      attemptId: attempt.id,
      questionId: "q1",
      optionId: "q1-o3-1788771458154",
    });

    const state = await certification.certificationState("amina");
    expect(state.answers).toEqual({ q1: "q1-o3-1788771458154" });

    const result = await certification.submitAttempt("amina");
    expect(result.score).toBe(100);
  });
});
