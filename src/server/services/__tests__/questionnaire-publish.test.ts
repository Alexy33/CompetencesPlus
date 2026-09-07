import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Publication d'une nouvelle version depuis l'administration.
 *
 * Regle cardinale : publier n'ecrase JAMAIS une version existante. Une
 * tentative deja notee doit rester rejouable a l'identique.
 */

let repo: string;
let data: string;

const option = (id: string, value: number) => ({ id, label: `Reponse ${id}`, value });

const question = (id: string, weight = 2) => ({
  id,
  text: `Enonce de ${id}`,
  type: "single_choice" as const,
  weight,
  options: [option(`${id}-o1`, 0), option(`${id}-o2`, 1)],
});

const V1 = { version: 1, questions: [question("q1"), question("q2", 3)] };

async function loadModule() {
  const module = await import("../questionnaire");
  module.resetQuestionnaireCache();
  return module;
}

beforeEach(() => {
  const root = mkdtempSync(path.join(tmpdir(), "publish-"));
  repo = path.join(root, "repo");
  data = path.join(root, "data");

  mkdirSync(path.join(repo, "certification"), { recursive: true });
  writeFileSync(
    path.join(repo, "certification", "questions.v1.json"),
    JSON.stringify(V1, null, 2),
    "utf8",
  );

  vi.spyOn(process, "cwd").mockReturnValue(repo);
  process.env.QUESTIONNAIRE_DIR = path.join(data, "certification");
  vi.resetModules();
});

afterEach(() => {
  delete process.env.QUESTIONNAIRE_DIR;
  vi.restoreAllMocks();
  rmSync(path.dirname(repo), { recursive: true, force: true });
});

describe("publication — nouvelle version", () => {
  it("publie sous la version suivante, sans toucher a la precedente", async () => {
    const module = await loadModule();
    const before = readFileSync(path.join(repo, "certification", "questions.v1.json"), "utf8");

    const published = module.publishQuestionnaire([question("q1", 5), question("q3")]);

    expect(published.version).toBe(2);
    // v1 est intacte, octet pour octet.
    expect(readFileSync(path.join(repo, "certification", "questions.v1.json"), "utf8")).toBe(before);
  });

  it("ecrit dans le dossier de donnees, pas dans le depot", async () => {
    const module = await loadModule();
    module.publishQuestionnaire([question("q1")]);

    expect(existsSync(path.join(data, "certification", "questions.v2.json"))).toBe(true);
    expect(existsSync(path.join(repo, "certification", "questions.v2.json"))).toBe(false);
  });

  it("fait entrer la nouvelle version en vigueur", async () => {
    const module = await loadModule();
    expect(module.questionnaireVersion()).toBe(1);

    module.publishQuestionnaire([question("q1", 5), question("q3")]);

    expect(module.questionnaireVersion()).toBe(2);
    expect(module.getQuestionnaire().questions.map((q) => q.id)).toEqual(["q1", "q3"]);
  });

  it("laisse l'ancienne version lisible pour les tentatives ouvertes sous elle", async () => {
    const module = await loadModule();
    module.publishQuestionnaire([question("q1", 5), question("q3")]);

    const v1 = module.getQuestionnaireVersion(1);
    expect(v1.version).toBe(1);
    expect(v1.questions.map((q) => q.id)).toEqual(["q1", "q2"]);
    // La ponderation d'origine est preservee.
    expect(v1.questions.map((q) => q.weight)).toEqual([2, 3]);
  });

  it("incremente a chaque publication successive", async () => {
    const module = await loadModule();

    expect(module.publishQuestionnaire([question("q1")]).version).toBe(2);
    expect(module.publishQuestionnaire([question("q1")]).version).toBe(3);
    expect(module.publishQuestionnaire([question("q1")]).version).toBe(4);
    expect(module.listVersions()).toEqual([1, 2, 3, 4]);
  });

  it("expose la liste des versions publiees", async () => {
    const module = await loadModule();
    expect(module.listVersions()).toEqual([1]);

    module.publishQuestionnaire([question("q1")]);
    expect(module.listVersions()).toEqual([1, 2]);
  });
});

describe("publication — questionnaire refuse", () => {
  it("refuse une ponderation invalide et n'ecrit rien", async () => {
    const module = await loadModule();

    expect(() => module.publishQuestionnaire([{ ...question("q1"), weight: 0 }])).toThrow(
      module.QuestionnaireError,
    );

    expect(existsSync(path.join(data, "certification", "questions.v2.json"))).toBe(false);
    expect(module.questionnaireVersion()).toBe(1);
  });

  it("refuse un choix unique a une seule reponse", async () => {
    const module = await loadModule();

    expect(() =>
      module.publishQuestionnaire([{ ...question("q1"), options: [option("q1-o1", 0)] }]),
    ).toThrow(/au moins deux reponses/);
  });

  it("refuse deux questions au meme identifiant", async () => {
    const module = await loadModule();

    expect(() => module.publishQuestionnaire([question("q1"), question("q1")])).toThrow(
      /identifiant de question en double/,
    );
  });

  it("nomme la question fautive", async () => {
    const module = await loadModule();
    const broken = question("q7") as Record<string, unknown>;
    delete broken.weight;

    expect(() => module.publishQuestionnaire([question("q1"), broken])).toThrow(/Question « q7 »/);
  });

  it("refuse un questionnaire vide", async () => {
    const module = await loadModule();
    expect(() => module.publishQuestionnaire([])).toThrow(module.QuestionnaireError);
  });

  it("n'ecrase pas un fichier de version deja present", async () => {
    const module = await loadModule();

    // Une v2 existe deja dans le dossier de donnees.
    mkdirSync(path.join(data, "certification"), { recursive: true });
    const squatted = path.join(data, "certification", "questions.v2.json");
    writeFileSync(squatted, JSON.stringify({ version: 2, questions: [question("dejala")] }), "utf8");

    // La publication suivante prend v3, et v2 reste intacte.
    const published = module.publishQuestionnaire([question("q1")]);
    expect(published.version).toBe(3);
    expect(JSON.parse(readFileSync(squatted, "utf8")).questions[0].id).toBe("dejala");
  });
});
