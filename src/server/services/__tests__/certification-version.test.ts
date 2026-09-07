import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Scenario complet du versionnement :
 *
 *   questionnaire v1 -> tentative ouverte -> tentative en version 1
 *   -> deploiement de v2 -> la tentative reste en version 1
 *
 * Le questionnaire de production n'est jamais touche : chaque test travaille
 * dans un dossier temporaire, et une base SQLite jetable.
 */

const option = (id: string, value: number) => ({ id, label: `Reponse ${id}`, value });

const question = (id: string, weight = 2) => ({
  id,
  text: `Enonce de ${id}`,
  type: "single_choice",
  weight,
  options: [option(`${id}-o1`, 0), option(`${id}-o2`, 1)],
});

const V1 = { version: 1, questions: [question("q1"), question("q2", 3)] };

// v2 : une question disparait, une autre arrive, une ponderation change.
const V2 = { version: 2, questions: [question("q1", 5), question("q3")] };

let workdir: string;
let dbFile: string;

beforeEach(() => {
  workdir = mkdtempSync(path.join(tmpdir(), "certif-version-"));
  dbFile = path.join(workdir, "test.db");

  // Le loader lit `${cwd}/certification/questions.vN.json`.
  const dir = path.join(workdir, "certification");
  writeFileSync(path.join(workdir, ".keep"), "");
  vi.spyOn(process, "cwd").mockReturnValue(workdir);

  require("node:fs").mkdirSync(dir, { recursive: true });
  writeFileSync(path.join(dir, "questions.v1.json"), JSON.stringify(V1), "utf8");

  process.env.DATABASE_URL = `file:${dbFile}`;
  vi.resetModules();
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(workdir, { recursive: true, force: true });
});

/** Publie le fichier v2 et vide le cache du loader. */
async function deployV2() {
  writeFileSync(
    path.join(workdir, "certification", "questions.v2.json"),
    JSON.stringify(V2),
    "utf8",
  );
  // v1 reste sur le disque : les tentatives ouvertes sous v1 doivent
  // pouvoir continuer a etre lues et calculees.
  writeFileSync(
    path.join(workdir, "certification", "questions.v1.json"),
    JSON.stringify(V1),
    "utf8",
  );
}

async function loadModules() {
  const questionnaire = await import("../questionnaire");
  questionnaire.resetQuestionnaireCache();
  return questionnaire;
}

describe("questionnaire — version exposee a l'application", () => {
  it("expose la version du fichier en vigueur", async () => {
    const { questionnaireVersion } = await loadModules();
    expect(questionnaireVersion()).toBe(1);
  });

  it("sert le questionnaire v1 apres publication de v2", async () => {
    const module = await loadModules();
    await deployV2();

    // v1 reste lisible pour les tentatives deja ouvertes.
    expect(module.getQuestionnaireVersion(1).version).toBe(1);
    expect(module.getQuestionnaireVersion(1).questions.map((q) => q.id)).toEqual(["q1", "q2"]);
  });

  it("refuse un fichier dont la version declaree contredit le nom", async () => {
    const module = await loadModules();
    writeFileSync(
      path.join(workdir, "certification", "questions.v9.json"),
      JSON.stringify({ ...V1, version: 3 }),
      "utf8",
    );

    expect(() => module.getQuestionnaireVersion(9)).toThrow(/ne correspond pas au nom de fichier/);
  });
});

describe("questionnaire — calcul du score par version", () => {
  it("calcule une tentative v1 avec le bareme v1, meme apres le passage a v2", async () => {
    const { resetQuestionnaireCache } = await loadModules();
    const certification = await import("../certification");

    // Sous v1 : q1 (poids 2) et q2 (poids 3), meilleure reponse = 1 point.
    const v1Questions = certification.questionsOf(1);
    expect(v1Questions.map((q) => q.id)).toEqual(["q1", "q2"]);

    const perfectV1 = certification.computeScore(v1Questions, { q1: 1, q2: 1 });
    expect(perfectV1).toBe(100);

    await deployV2();
    resetQuestionnaireCache();

    // Le bareme v1 est inchange apres la publication de v2.
    const afterDeploy = certification.questionsOf(1);
    expect(afterDeploy.map((q) => q.id)).toEqual(["q1", "q2"]);
    expect(afterDeploy.map((q) => q.weight)).toEqual([2, 3]);
    expect(certification.computeScore(afterDeploy, { q1: 1, q2: 1 })).toBe(perfectV1);

    // Le bareme v2 est bien different : sans le figement, le score changerait.
    const v2Questions = certification.questionsOf(2);
    expect(v2Questions.map((q) => q.id)).toEqual(["q1", "q3"]);
    expect(certification.computeScore(v2Questions, { q1: 1, q2: 1 })).not.toBe(perfectV1);
  });
});
