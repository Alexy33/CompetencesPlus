import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";

import {
  QuestionnaireError,
  parseQuestionnaire,
  readQuestionnaireFile,
} from "../questionnaire";

/**
 * Les tests n'ecrivent JAMAIS dans certification/ : le questionnaire de
 * production est lu tel quel, les variantes sont ecrites dans un dossier
 * temporaire.
 */

const dirs: string[] = [];

function fixtureDir(): string {
  const dir = mkdtempSync(path.join(tmpdir(), "questionnaire-"));
  dirs.push(dir);
  return dir;
}

function writeQuestionnaire(content: unknown, name = "questions.v1.json"): string {
  const file = path.join(fixtureDir(), name);
  writeFileSync(file, typeof content === "string" ? content : JSON.stringify(content), "utf8");
  return file;
}

const option = (id: string, value: number) => ({ id, label: `Reponse ${id}`, value });

function question(id: string, overrides: Record<string, unknown> = {}) {
  return {
    id,
    text: `Enonce de ${id}`,
    type: "single_choice",
    weight: 2,
    options: [option(`${id}-o1`, 0), option(`${id}-o2`, 1)],
    ...overrides,
  };
}

const valid = (overrides: Record<string, unknown> = {}) => ({
  version: 1,
  questions: [question("q1"), question("q2", { weight: 3 })],
  ...overrides,
});

afterEach(() => {
  for (const dir of dirs.splice(0)) rmSync(dir, { recursive: true, force: true });
});

describe("questionnaire — fichier valide", () => {
  it("charge un questionnaire valide depuis le disque", () => {
    const loaded = readQuestionnaireFile(writeQuestionnaire(valid()));
    expect(loaded.questions).toHaveLength(2);
  });

  it("expose la version declaree dans le fichier", () => {
    expect(readQuestionnaireFile(writeQuestionnaire(valid({ version: 4 }))).version).toBe(4);
  });

  it("rend les questions dans l'ordre du fichier, ponderations comprises", () => {
    const loaded = parseQuestionnaire(valid());

    expect(loaded.questions.map((item) => item.id)).toEqual(["q1", "q2"]);
    expect(loaded.questions.map((item) => item.weight)).toEqual([2, 3]);
  });

  it("accepte le type de question existant et ses reponses", () => {
    const loaded = parseQuestionnaire(valid());
    const [first] = loaded.questions;

    expect(first.type).toBe("single_choice");
    expect(first.options).toEqual([
      { id: "q1-o1", label: "Reponse q1-o1", value: 0 },
      { id: "q1-o2", label: "Reponse q1-o2", value: 1 },
    ]);
  });

  it("charge le questionnaire de production", () => {
    const production = readQuestionnaireFile(
      path.join(process.cwd(), "certification", "questions.v1.json"),
    );

    expect(production.version).toBe(1);
    expect(production.questions.length).toBeGreaterThan(0);
    for (const item of production.questions) {
      expect(item.options.length).toBeGreaterThanOrEqual(2);
    }
  });
});

describe("questionnaire — fichier invalide", () => {
  const rejects = (content: unknown) => () => parseQuestionnaire(content);

  it("refuse un questionnaire sans version", () => {
    const file = valid() as Record<string, unknown>;
    delete file.version;
    expect(rejects(file)).toThrow(QuestionnaireError);
  });

  it("refuse une version non entiere ou nulle", () => {
    expect(rejects(valid({ version: 0 }))).toThrow(QuestionnaireError);
    expect(rejects(valid({ version: 1.5 }))).toThrow(QuestionnaireError);
    expect(rejects(valid({ version: "1" }))).toThrow(QuestionnaireError);
  });

  it("refuse un questionnaire sans liste de questions", () => {
    const file = valid() as Record<string, unknown>;
    delete file.questions;
    expect(rejects(file)).toThrow(QuestionnaireError);
  });

  it("refuse des questions qui ne sont pas un tableau", () => {
    expect(rejects(valid({ questions: { q1: question("q1") } }))).toThrow(QuestionnaireError);
  });

  it("refuse une question sans identifiant", () => {
    const broken = question("q2") as Record<string, unknown>;
    delete broken.id;
    expect(rejects(valid({ questions: [question("q1"), broken] }))).toThrow(QuestionnaireError);
  });

  it("refuse deux questions au meme identifiant", () => {
    expect(rejects(valid({ questions: [question("q1"), question("q1")] }))).toThrow(
      /identifiant de question en double/,
    );
  });

  it("refuse une question sans enonce", () => {
    const broken = question("q2") as Record<string, unknown>;
    delete broken.text;
    expect(rejects(valid({ questions: [broken] }))).toThrow(QuestionnaireError);
  });

  it("refuse un enonce vide", () => {
    expect(rejects(valid({ questions: [question("q1", { text: "   " })] }))).toThrow(
      QuestionnaireError,
    );
  });

  it("refuse un type de question inconnu", () => {
    expect(rejects(valid({ questions: [question("q1", { type: "essai_libre" })] }))).toThrow(
      QuestionnaireError,
    );
  });

  it("refuse un choix unique avec moins de deux reponses", () => {
    const broken = question("q1", { options: [option("q1-o1", 0)] });
    expect(rejects(valid({ questions: [broken] }))).toThrow(/au moins deux reponses/);
  });

  it("refuse une reponse sans libelle", () => {
    const broken = question("q1", {
      options: [option("q1-o1", 0), { id: "q1-o2", value: 1 }],
    });
    expect(rejects(valid({ questions: [broken] }))).toThrow(QuestionnaireError);
  });

  it("refuse deux reponses au meme identifiant", () => {
    const broken = question("q1", { options: [option("dup", 0), option("dup", 1)] });
    expect(rejects(valid({ questions: [broken] }))).toThrow(/identifiant de reponse en double/);
  });

  it("refuse deux reponses rapportant le meme nombre de points", () => {
    const broken = question("q1", { options: [option("q1-o1", 2), option("q1-o2", 2)] });
    expect(rejects(valid({ questions: [broken] }))).toThrow(/deux reponses rapportent/);
  });

  it("refuse une ponderation absente", () => {
    const broken = question("q1") as Record<string, unknown>;
    delete broken.weight;
    expect(rejects(valid({ questions: [broken] }))).toThrow(QuestionnaireError);
  });

  it("refuse une ponderation nulle, negative ou hors bornes", () => {
    for (const weight of [0, -1, 6, 1.5, "2"]) {
      expect(rejects(valid({ questions: [question("q1", { weight })] }))).toThrow(
        QuestionnaireError,
      );
    }
  });

  it("nomme la question fautive dans le message d'erreur", () => {
    const broken = question("q17") as Record<string, unknown>;
    delete broken.weight;

    expect(rejects(valid({ questions: [question("q1"), broken] }))).toThrow(/Question « q17 »/);
  });

  it("designe la propriete manquante dans le message d'erreur", () => {
    const broken = question("q8", {
      options: [option("q8-o1", 0), { id: "q8-o2", value: 1 }],
    });

    let message = "";
    try {
      parseQuestionnaire(valid({ questions: [broken] }));
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain("Question « q8 »");
    expect(message).toContain("options.1.label");
  });

  it("refuse un JSON malforme", () => {
    expect(() => readQuestionnaireFile(writeQuestionnaire("{ pas du json"))).toThrow(
      /JSON malforme/,
    );
  });

  it("refuse un fichier absent", () => {
    expect(() => readQuestionnaireFile(path.join(fixtureDir(), "absent.json"))).toThrow(
      /illisible/,
    );
  });

  it("ne charge PAS le sous-ensemble valide d'un questionnaire invalide", () => {
    const broken = question("q2") as Record<string, unknown>;
    delete broken.weight;

    // q1 est valide, q2 ne l'est pas : rien ne doit etre charge.
    expect(rejects(valid({ questions: [question("q1"), broken] }))).toThrow(QuestionnaireError);
  });

  it("signale toutes les questions fautives, pas seulement la premiere", () => {
    const first = question("q3") as Record<string, unknown>;
    delete first.weight;
    const second = question("q9") as Record<string, unknown>;
    delete second.text;

    let message = "";
    try {
      parseQuestionnaire(valid({ questions: [first, second] }));
    } catch (error) {
      message = (error as Error).message;
    }

    expect(message).toContain("Question « q3 »");
    expect(message).toContain("Question « q9 »");
  });
});
