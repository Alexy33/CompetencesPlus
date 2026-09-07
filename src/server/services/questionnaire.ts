import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { z } from "zod";
import { QUESTIONNAIRE_FILE } from "@/lib/vocabulary";
import {
  QuestionnaireFileSchema,
  type QuestionnaireFile,
  type QuestionnaireQuestion,
} from "@/server/contracts/questionnaire";

/**
 * Chargement du questionnaire de certification.
 *
 * Le fichier `certification/questions.vN.json` est LA source de verite du
 * bareme : libelles, ponderations et points par reponse. Il est versionne
 * dans Git, pas en base — seule la version retenue par chaque tentative est
 * stockee (certification_attempt.questionnaire_version).
 *
 * Un questionnaire invalide fait echouer le chargement : il n'est jamais
 * charge partiellement, et aucun sous-ensemble valide n'est retenu.
 */

export const QUESTIONNAIRE_DIR = path.join(process.cwd(), "certification");

export class QuestionnaireError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuestionnaireError";
  }
}

export interface Questionnaire {
  version: number;
  questions: QuestionnaireQuestion[];
}

/**
 * Rend une issue Zod lisible, en nommant la question fautive des que le
 * chemin de l'erreur permet de l'identifier.
 */
function describeIssue(issue: z.core.$ZodIssue, file: unknown): string {
  const [root, index, ...rest] = issue.path;

  if (root !== "questions" || typeof index !== "number") {
    return `Champ « ${issue.path.join(".") || "(racine)"} » : ${issue.message}.`;
  }

  const questions = (file as { questions?: unknown }).questions;
  const raw = Array.isArray(questions) ? questions[index] : undefined;
  const id =
    raw && typeof raw === "object" && typeof (raw as { id?: unknown }).id === "string"
      ? (raw as { id: string }).id
      : `#${index + 1}`;

  const field = rest.length > 0 ? ` (« ${rest.join(".")} »)` : "";
  return `Question « ${id} »${field} :\n${issue.message}.`;
}

function invalid(reason: string, details: string[] = []): QuestionnaireError {
  const body = details.length > 0 ? `\n\n${details.join("\n\n")}` : "";
  return new QuestionnaireError(`Questionnaire de certification invalide.\n${reason}${body}`);
}

/**
 * Valide un questionnaire deja desserialise. Exportee pour les tests et pour
 * tout outil de verification hors application.
 */
export function parseQuestionnaire(data: unknown, source = "(memoire)"): Questionnaire {
  const result = QuestionnaireFileSchema.safeParse(data);

  if (!result.success) {
    throw invalid(
      `Fichier : ${source}`,
      result.error.issues.map((issue) => describeIssue(issue, data)),
    );
  }

  return freeze(result.data);
}

function freeze(file: QuestionnaireFile): Questionnaire {
  for (const question of file.questions) {
    Object.freeze(question.options);
    for (const option of question.options) Object.freeze(option);
    Object.freeze(question);
  }
  Object.freeze(file.questions);
  return Object.freeze(file);
}

/**
 * Lit et valide un fichier questionnaire. Toute erreur — fichier absent,
 * JSON malforme, schema non respecte — interrompt le chargement.
 */
export function readQuestionnaireFile(filePath: string): Questionnaire {
  let raw: string;

  try {
    raw = readFileSync(filePath, "utf8");
  } catch (error) {
    throw invalid(
      `Fichier illisible : ${filePath}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw invalid(
      `JSON malforme : ${filePath}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }

  return parseQuestionnaire(parsed, filePath);
}

const FILE_PATTERN = /^questions\.v(\d+)\.json$/;

/**
 * Version la plus elevee presente dans `certification/`.
 *
 * Publier `questions.v2.json` suffit donc a faire entrer v2 en vigueur, sans
 * toucher au code. Les fichiers des versions anterieures restent en place :
 * ils servent aux tentatives ouvertes sous ces versions.
 */
function latestVersion(): number {
  let entries: string[];

  try {
    entries = readdirSync(QUESTIONNAIRE_DIR);
  } catch (error) {
    throw invalid(
      `Dossier illisible : ${QUESTIONNAIRE_DIR}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const versions = entries
    .map((entry) => FILE_PATTERN.exec(entry)?.[1])
    .filter((match): match is string => match !== undefined)
    .map(Number);

  if (versions.length === 0) {
    throw invalid(
      `Aucun questionnaire dans ${QUESTIONNAIRE_DIR} (attendu : ${QUESTIONNAIRE_FILE} ou une version ulterieure).`,
    );
  }

  return Math.max(...versions);
}

let cached: Questionnaire | null = null;

/**
 * Questionnaire en vigueur : le fichier de version la plus elevee.
 *
 * Le resultat est memorise — le fichier ne change pas en cours d'execution, et
 * une tentative en cours doit voir un bareme stable.
 */
export function getQuestionnaire(): Questionnaire {
  if (cached) return cached;

  const version = latestVersion();
  const file = path.join(QUESTIONNAIRE_DIR, `questions.v${version}.json`);
  const loaded = readQuestionnaireFile(file);

  // La version declaree fait foi, mais elle doit s'accorder au nom du fichier :
  // une divergence rendrait le versionnement des tentatives inexploitable.
  if (loaded.version !== version) {
    throw invalid(
      `Fichier : ${file}\nLa version declaree (${loaded.version}) ne correspond pas au nom de fichier (v${version}).`,
    );
  }

  cached = loaded;
  return cached;
}

/** Version du questionnaire en vigueur, telle que declaree dans le fichier. */
export function questionnaireVersion(): number {
  return getQuestionnaire().version;
}

const byVersion = new Map<number, Questionnaire>();

/**
 * Questionnaire d'une version donnee, lu dans `questions.v<version>.json`.
 *
 * Sert a rejouer le bareme d'une tentative ouverte sous une version anterieure :
 * une tentative v1 reste calculee avec le questionnaire v1, meme apres le
 * deploiement de v2. La version declaree DANS le fichier doit correspondre a
 * celle demandee — le nom de fichier seul ne fait pas foi.
 */
export function getQuestionnaireVersion(version: number): Questionnaire {
  const current = getQuestionnaire();
  if (version === current.version) return current;

  const known = byVersion.get(version);
  if (known) return known;

  const file = path.join(QUESTIONNAIRE_DIR, `questions.v${version}.json`);
  const loaded = readQuestionnaireFile(file);

  if (loaded.version !== version) {
    throw invalid(
      `Fichier : ${file}\nLa version declaree (${loaded.version}) ne correspond pas au nom de fichier (v${version}).`,
    );
  }

  byVersion.set(version, loaded);
  return loaded;
}

/** Vide les caches. Reservee aux tests. */
export function resetQuestionnaireCache(): void {
  cached = null;
  byVersion.clear();
}
