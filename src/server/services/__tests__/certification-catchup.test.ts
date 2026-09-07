import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Rattrapage : quand une nouvelle version parait, le candidat ne repond
 * qu'aux questions nouvelles ou dont le bareme a change. Les autres reponses
 * sont reportees.
 */

const REPO = process.cwd();

const opt = (id: string, value: number, label = `Reponse ${id}`) => ({ id, label, value });

const q = (id: string, weight = 2, options = [opt(`${id}-o1`, 0), opt(`${id}-o2`, 1)]) => ({
  id,
  text: `Enonce de ${id}`,
  type: "single_choice" as const,
  weight,
  options,
});

const V1 = { version: 1, questions: [q("q1"), q("q2"), q("q3")] };

let workdir: string;

beforeEach(async () => {
  workdir = mkdtempSync(path.join(tmpdir(), "catchup-"));
  mkdirSync(path.join(workdir, "certification"), { recursive: true });
  writeFileSync(
    path.join(workdir, "certification", "questions.v1.json"),
    JSON.stringify(V1),
    "utf8",
  );

  process.env.DATABASE_URL = `file:${path.join(workdir, "test.db")}`;
  vi.resetModules();

  const { db } = await import("@/db");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  migrate(db, { migrationsFolder: path.join(REPO, "drizzle") });

  vi.spyOn(process, "cwd").mockReturnValue(workdir);
  (await import("../questionnaire")).resetQuestionnaireCache();
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

/** Certifie l'utilisateur en v1 en repondant au mieux partout. */
async function certifyInV1(userId: string) {
  const certification = await import("../certification");
  const { db } = await import("@/db");
  const { certificationAnswer } = await import("@/db/schema");

  const attempt = await certification.openAttempt(userId);
  await db.insert(certificationAnswer).values(
    V1.questions.map((question) => ({
      attemptId: attempt.id,
      questionId: question.id,
      optionId: `${question.id}-o2`,
    })),
  );
  const result = await certification.submitAttempt(userId);
  expect(result.score).toBe(100);
  return attempt;
}

describe("rattrapage — questions a reposer", () => {
  it("ne repose que la question dont les reponses ont change", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");

    // v2 : q2 gagne une reponse, le reste est identique.
    questionnaire.publishQuestionnaire([
      q("q1"),
      q("q2", 2, [opt("q2-o1", 0), opt("q2-o2", 1), opt("q2-o3", 5)]),
      q("q3"),
    ]);

    const catchUp = await certification.openCatchUp("amina");
    expect(catchUp?.questionIds).toEqual(["q2"]);
    expect(catchUp?.carriedOver).toBe(2);
    expect(catchUp?.fromVersion).toBe(1);
    expect(catchUp?.toVersion).toBe(2);
  });

  it("repose une question dont l'enonce a change", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");

    // Une reecriture d'enonce est indissociable d'une simple coquille :
    // dans le doute, la question est reposee.
    questionnaire.publishQuestionnaire([
      { ...q("q1"), text: "Enonce entierement reecrit" },
      q("q2"),
      q("q3"),
    ]);

    const catchUp = await certification.openCatchUp("amina");
    expect(catchUp?.questionIds).toEqual(["q1"]);
    expect(catchUp?.carriedOver).toBe(2);
  });

  it("repose une question nouvelle", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");

    questionnaire.publishQuestionnaire([q("q1"), q("q2"), q("q3"), q("q4")]);

    const catchUp = await certification.openCatchUp("amina");
    expect(catchUp?.questionIds).toEqual(["q4"]);
    expect(catchUp?.carriedOver).toBe(3);
  });

  it("repose une question dont la ponderation a change", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");

    questionnaire.publishQuestionnaire([q("q1"), q("q2", 5), q("q3")]);

    const catchUp = await certification.openCatchUp("amina");
    expect(catchUp?.questionIds).toEqual(["q2"]);
  });

  it("repose une question dont les points ont change", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");

    questionnaire.publishQuestionnaire([
      q("q1"),
      q("q2", 2, [opt("q2-o1", 0), opt("q2-o2", 9)]),
      q("q3"),
    ]);

    const catchUp = await certification.openCatchUp("amina");
    expect(catchUp?.questionIds).toEqual(["q2"]);
  });

  it("ne reporte pas la reponse d'une question supprimee", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");

    questionnaire.publishQuestionnaire([q("q1"), q("q3")]);

    const catchUp = await certification.openCatchUp("amina");
    expect(catchUp?.questionIds).toEqual([]);
    expect(catchUp?.carriedOver).toBe(2);
  });
});

describe("rattrapage — etat et report des reponses", () => {
  it("reporte les reponses et ne laisse en attente que les questions a reposer", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");

    questionnaire.publishQuestionnaire([
      q("q1"),
      q("q2", 2, [opt("q2-o1", 0), opt("q2-o2", 1), opt("q2-o3", 5)]),
      q("q3"),
    ]);

    await certification.openCatchUp("amina");
    const state = await certification.certificationState("amina");

    expect(state.status).toBe("in_progress");
    expect(state.questionnaireVersion).toBe(2);
    expect(state.pendingQuestionIds).toEqual(["q2"]);
    // q1 et q3 sont deja repondues.
    expect(state.answers).toEqual({ q1: "q1-o2", q3: "q3-o2" });
    expect(state.outdated).toBe(false);
  });

  it("la tentative precedente n'est pas modifiee", async () => {
    await createUser("amina");
    const first = await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");
    const { db } = await import("@/db");
    const { certificationAttempt } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    questionnaire.publishQuestionnaire([q("q1"), q("q2", 5), q("q3")]);
    await certification.openCatchUp("amina");

    const [previous] = await db
      .select()
      .from(certificationAttempt)
      .where(eq(certificationAttempt.id, first.id));

    expect(previous.questionnaireVersion).toBe(1);
    expect(previous.status).toBe("submitted");
    expect(previous.score).toBe(100);
  });

  it("le score final combine reponses reportees et rattrapees", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");
    const { db } = await import("@/db");
    const { certificationAnswer } = await import("@/db/schema");

    questionnaire.publishQuestionnaire([
      q("q1"),
      q("q2", 2, [opt("q2-o1", 0), opt("q2-o2", 1), opt("q2-o3", 5)]),
      q("q3"),
    ]);

    const catchUp = await certification.openCatchUp("amina");
    // Le candidat choisit la meilleure reponse de la question rattrapee.
    await db.insert(certificationAnswer).values({
      attemptId: catchUp!.attemptId,
      questionId: "q2",
      optionId: "q2-o3",
    });

    const result = await certification.submitAttempt("amina");
    expect(result.questionnaireVersion).toBe(2);
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);
  });
});

describe("rattrapage — cas sans effet", () => {
  it("ne fait rien si la certification est deja a jour", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const certification = await import("../certification");
    expect(await certification.openCatchUp("amina")).toBeNull();
  });

  it("ne fait rien si aucune tentative n'existe", async () => {
    await createUser("karim");
    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");

    questionnaire.publishQuestionnaire([q("q1"), q("q2", 5)]);
    expect(await certification.openCatchUp("karim")).toBeNull();
  });

  it("ne coupe pas une tentative en cours", async () => {
    await createUser("amina");
    const certification = await import("../certification");
    const questionnaire = await import("../questionnaire");

    await certification.openAttempt("amina");
    questionnaire.publishQuestionnaire([q("q1"), q("q2", 5), q("q3")]);

    expect(await certification.openCatchUp("amina")).toBeNull();
    const state = await certification.certificationState("amina");
    expect(state.questionnaireVersion).toBe(1);
  });
});

describe("certification retiree sous le seuil", () => {
  it("retire le badge quand le nouveau score passe sous le seuil", async () => {
    await createUser("amina");
    const certification = await import("../certification");
    const { db } = await import("@/db");
    const { profile, certificationAnswer } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    await db.insert(profile).values({
      id: "p1",
      userId: "amina",
      sector: "Numérique",
      city: "Paris",
    });

    await certifyInV1("amina");
    const [certified] = await db.select().from(profile).where(eq(profile.id, "p1"));
    expect(certified.certifiedAt).not.toBeNull();
    expect(certified.score).toBe(100);

    // Nouvelle passation ratee : toutes les plus mauvaises reponses.
    const { certificationAttempt } = await import("@/db/schema");
    await db.insert(certificationAttempt).values({
      id: "a2",
      userId: "amina",
      status: "in_progress",
      questionnaireVersion: 1,
    });
    await db.insert(certificationAnswer).values(
      V1.questions.map((question) => ({
        attemptId: "a2",
        questionId: question.id,
        optionId: `${question.id}-o1`,
      })),
    );

    const result = await certification.submitAttempt("amina");
    expect(result.passed).toBe(false);
    expect(result.certified).toBe(false);

    const [after] = await db.select().from(profile).where(eq(profile.id, "p1"));
    expect(after.certifiedAt).toBeNull();
    expect(after.score).toBe(0);
  });
});

describe("rattrapage sans question a reposer", () => {
  it("reconduit la certification sur la nouvelle version sans rien demander", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");

    // Une question modifiee est retiree du questionnaire : plus rien a reposer
    // pour le candidat, ses autres reponses restent valables.
    questionnaire.publishQuestionnaire([q("q1"), q("q2")]);

    const catchUp = await certification.openCatchUp("amina");
    expect(catchUp?.questionIds).toEqual([]);

    // Condition exacte utilisee par la page candidat pour valider seule.
    const pending = await certification.certificationState("amina");
    expect(pending.status).toBe("in_progress");
    expect(pending.pendingQuestionIds).toEqual([]);
    expect(pending.answered).toBe(pending.questionCount);
    expect(pending.questionCount).toBe(2);

    const result = await certification.submitAttempt("amina");
    expect(result.questionnaireVersion).toBe(2);
    expect(result.score).toBe(100);
    expect(result.passed).toBe(true);

    const state = await certification.certificationState("amina");
    expect(state.outdated).toBe(false);
    expect(state.questionnaireVersion).toBe(2);
  });
});

/**
 * Reprise du questionnaire via le bouton « Repasser ». Reproduit la logique de
 * POST /api/me/certification/restart : une certification perimee ouvre un
 * RATTRAPAGE, pas une tentative vierge.
 */
async function restartRoute(userId: string) {
  const certification = await import("../certification");
  const { questionnaireVersion } = await import("../questionnaire");
  const { db } = await import("@/db");
  const { certificationAnswer, certificationAttempt } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");

  if (await certification.openCatchUp(userId)) {
    return certification.certificationState(userId);
  }

  const state = await certification.certificationState(userId);
  if (state.catchUp) return state;

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

  return certification.certificationState(userId);
}

describe("bouton « Repasser » sur une certification perimee", () => {
  it("ouvre un rattrapage au lieu d'effacer toutes les reponses", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    questionnaire.publishQuestionnaire([
      q("q1"),
      q("q2", 2, [opt("q2-o1", 0), opt("q2-o2", 1), opt("q2-o3", 5)]),
      q("q3"),
    ]);

    const state = await restartRoute("amina");

    // Une seule question reposee, les autres reponses conservees.
    expect(state.questionnaireVersion).toBe(2);
    expect(state.pendingQuestionIds).toEqual(["q2"]);
    expect(state.answered).toBe(2);
    expect(state.answers).toEqual({ q1: "q1-o2", q3: "q3-o2" });
  });

  it("efface bien tout quand la certification est deja a jour", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    // Aucune nouvelle version : « Repasser » repart de zero, comme avant.
    const state = await restartRoute("amina");

    expect(state.questionnaireVersion).toBe(1);
    expect(state.status).toBe("in_progress");
    expect(state.answered).toBe(0);
    expect(state.pendingQuestionIds).toEqual([]);
  });

  it("ne reperd pas les reponses si le candidat reclique sur Repasser", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    questionnaire.publishQuestionnaire([q("q1"), q("q2", 5), q("q3")]);

    await restartRoute("amina");
    // Second clic : le rattrapage est deja ouvert, il ne doit pas etre efface.
    const again = await restartRoute("amina");

    expect(again.questionnaireVersion).toBe(2);
    expect(again.answered).toBe(2);
    expect(again.pendingQuestionIds).toEqual(["q2"]);
  });
});

describe("rattrapage cumulant plusieurs versions", () => {
  it("repose toutes les questions modifiees depuis la version du candidat", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");

    // v2 : q2 change. Le candidat ne fait PAS son rattrapage.
    questionnaire.publishQuestionnaire([
      q("q1"),
      q("q2", 2, [opt("q2-o1", 0), opt("q2-o2", 1), opt("q2-o3", 5)]),
      q("q3"),
    ]);

    // v3 : q1 change a son tour.
    questionnaire.publishQuestionnaire([
      q("q1", 2, [opt("q1-o1", 0), opt("q1-o2", 1), opt("q1-o3", 4)]),
      q("q2", 2, [opt("q2-o1", 0), opt("q2-o2", 1), opt("q2-o3", 5)]),
      q("q3"),
    ]);

    const catchUp = await certification.openCatchUp("amina");

    // Les deux modifications sont cumulees en une seule passation : le diff
    // est calcule de v1 a v3, sans repasser par les versions intermediaires.
    expect(catchUp?.fromVersion).toBe(1);
    expect(catchUp?.toVersion).toBe(3);
    expect(catchUp?.questionIds).toEqual(["q1", "q2"]);
    expect(catchUp?.carriedOver).toBe(1);

    const state = await certification.certificationState("amina");
    expect(state.pendingQuestionIds).toEqual(["q1", "q2"]);
    expect(state.answers).toEqual({ q3: "q3-o2" });
  });

  it("ne repose qu'une fois une question modifiee a plusieurs reprises", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");

    // q2 change en v2, puis encore en v3.
    questionnaire.publishQuestionnaire([
      q("q1"),
      q("q2", 2, [opt("q2-o1", 0), opt("q2-o2", 3)]),
      q("q3"),
    ]);
    questionnaire.publishQuestionnaire([
      q("q1"),
      q("q2", 4, [opt("q2-o1", 0), opt("q2-o2", 8)]),
      q("q3"),
    ]);

    const catchUp = await certification.openCatchUp("amina");
    expect(catchUp?.questionIds).toEqual(["q2"]);
    expect(catchUp?.carriedOver).toBe(2);
  });

  it("une question modifiee puis revenue a son etat d'origine n'est pas reposee", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");

    // q2 change en v2...
    questionnaire.publishQuestionnaire([
      q("q1"),
      { ...q("q2", 5, [opt("q2-o1", 0), opt("q2-o2", 9)]), text: "Enonce provisoire" },
      q("q3"),
    ]);
    // ...puis retrouve exactement son etat initial en v3.
    questionnaire.publishQuestionnaire([q("q1"), q("q2"), q("q3")]);

    // Le candidat n'a jamais vu la v2 : pour lui, rien n'a change.
    const catchUp = await certification.openCatchUp("amina");
    expect(catchUp?.questionIds).toEqual([]);
    expect(catchUp?.carriedOver).toBe(3);
  });
});

describe("publication melangeant enonces et reponses", () => {
  it("repose les questions dont l'enonce a change ET celles dont les reponses ont change", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");

    // Cas reel : deux enonces reecrits, une question dont les reponses changent.
    questionnaire.publishQuestionnaire([
      { ...q("q1"), text: "1" },
      { ...q("q2"), text: "2" },
      q("q3", 2, [opt("q3-o1", 0), opt("q3-o2", 1), opt("q3-o3", 6)]),
    ]);

    const catchUp = await certification.openCatchUp("amina");

    // Les trois sont reposees, pas seulement celle aux reponses modifiees.
    expect(catchUp?.questionIds).toEqual(["q1", "q2", "q3"]);
    expect(catchUp?.carriedOver).toBe(0);

    const state = await certification.certificationState("amina");
    expect(state.pendingQuestionIds).toEqual(["q1", "q2", "q3"]);
  });

  it("laisse intactes les questions vraiment inchangees", async () => {
    await createUser("amina");
    await certifyInV1("amina");

    const questionnaire = await import("../questionnaire");
    const certification = await import("../certification");

    questionnaire.publishQuestionnaire([{ ...q("q1"), text: "Reecrite" }, q("q2"), q("q3")]);

    const catchUp = await certification.openCatchUp("amina");
    expect(catchUp?.questionIds).toEqual(["q1"]);
    // q2 et q3 gardent la reponse du candidat.
    expect(catchUp?.carriedOver).toBe(2);
  });
});
