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
      { attemptId: attempt.id, questionId: "q1", value: 1 },
      { attemptId: attempt.id, questionId: "q2", value: 1 },
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
