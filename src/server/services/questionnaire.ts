import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
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
 * Le fichier `questions.vN.json` est LA source de verite du bareme : libelles,
 * ponderations et points par reponse. Seule la version retenue par chaque
 * tentative est stockee en base (certification_attempt.questionnaire_version).
 *
 * Les fichiers sont cherches dans DEUX dossiers :
 *
 *  1. `certification/` du depot — versions livrees avec le code, suivies par
 *     Git. En production ce dossier est DANS l'image, donc en lecture seule.
 *  2. le dossier de donnees (`<dir de la base>/certification`, surchargeable
 *     par QUESTIONNAIRE_DIR) — versions publiees depuis l'administration.
 *     C'est le seul emplacement inscriptible et persistant : le conteneur de
 *     production tourne en `read_only`, seul le volume /data accepte
 *     l'ecriture et survit a un redeploiement.
 *
 * A version egale, le dossier de donnees l'emporte. La version en vigueur est
 * toujours la plus elevee des deux.
 *
 * Un questionnaire invalide fait echouer le chargement : il n'est jamais
 * charge partiellement, et aucun sous-ensemble valide n'est retenu.
 */

/** Versions livrees avec le code, suivies par Git. */
export const BUNDLED_QUESTIONNAIRE_DIR = path.join(process.cwd(), "certification");

/**
 * Dossier inscriptible ou l'administration publie les nouvelles versions.
 * Meme convention que les videos : derive du repertoire de la base, qui est
 * le volume persistant, et surchargeable par variable d'environnement.
 */
export function questionnaireDataDir(): string {
  const custom = process.env.QUESTIONNAIRE_DIR?.trim();
  if (custom) return path.resolve(custom);

  const dbPath = (process.env.DATABASE_URL ?? "file:./local.db").replace(/^file:/, "");
  return path.resolve(path.dirname(dbPath), "certification");
}

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

/** Dossiers fouilles, du moins prioritaire au plus prioritaire. */
function searchDirs(): string[] {
  const data = questionnaireDataDir();
  return data === BUNDLED_QUESTIONNAIRE_DIR
    ? [BUNDLED_QUESTIONNAIRE_DIR]
    : [BUNDLED_QUESTIONNAIRE_DIR, data];
}

/** Versions disponibles, avec le chemin retenu pour chacune. */
function availableVersions(): Map<number, string> {
  const found = new Map<number, string>();

  for (const dir of searchDirs()) {
    let entries: string[];

    try {
      entries = readdirSync(dir);
    } catch {
      // Un dossier absent n'est pas une erreur : le dossier de donnees
      // n'existe que si l'administration a deja publie une version.
      continue;
    }

    for (const entry of entries) {
      const match = FILE_PATTERN.exec(entry);
      // Dossiers parcourus dans l'ordre de priorite : le dernier ecrase.
      if (match) found.set(Number(match[1]), path.join(dir, entry));
    }
  }

  return found;
}

/**
 * Version la plus elevee disponible.
 *
 * Publier `questions.v2.json` suffit a faire entrer v2 en vigueur, sans
 * toucher au code. Les fichiers des versions anterieures restent en place :
 * ils servent aux tentatives ouvertes sous ces versions.
 */
function latestVersion(available: Map<number, string>): number {
  if (available.size === 0) {
    throw invalid(
      `Aucun questionnaire trouve (attendu : ${QUESTIONNAIRE_FILE} ou une version ulterieure) ` +
        `dans ${searchDirs().join(" ni ")}.`,
    );
  }

  return Math.max(...available.keys());
}

/** Versions publiees, de la plus ancienne a la plus recente. */
export function listVersions(): number[] {
  return [...availableVersions().keys()].sort((a, b) => a - b);
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

  const available = availableVersions();
  const version = latestVersion(available);
  const file = available.get(version)!;
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

  const file = availableVersions().get(version);
  if (!file) {
    throw invalid(
      `Version ${version} introuvable dans ${searchDirs().join(" ni ")}. ` +
        "Le fichier d'une version utilisee par des tentatives ne doit jamais etre supprime.",
    );
  }

  const loaded = readQuestionnaireFile(file);

  if (loaded.version !== version) {
    throw invalid(
      `Fichier : ${file}\nLa version declaree (${loaded.version}) ne correspond pas au nom de fichier (v${version}).`,
    );
  }

  byVersion.set(version, loaded);
  return loaded;
}

/**
 * Publie un questionnaire comme NOUVELLE version.
 *
 * C'est le seul moyen de faire evoluer le bareme depuis l'application. Le
 * contenu est valide avant ecriture, puis ecrit sous un numero strictement
 * superieur a toutes les versions existantes.
 *
 * Les fichiers deja publies ne sont JAMAIS modifies : une tentative notee
 * sous v1 doit pouvoir etre rejouee a l'identique indefiniment. C'est ce qui
 * donne son sens a certification_attempt.questionnaire_version.
 */
export function publishQuestionnaire(questions: unknown): Questionnaire {
  const available = availableVersions();
  const version = available.size === 0 ? 1 : Math.max(...available.keys()) + 1;

  // Valide AVANT d'ecrire : un fichier invalide ne doit jamais toucher le disque.
  const candidate = parseQuestionnaire(
    { version, questions },
    `questions.v${version}.json (publication)`,
  );

  const dir = questionnaireDataDir();

  try {
    mkdirSync(dir, { recursive: true });
  } catch (error) {
    throw invalid(
      `Dossier de publication inaccessible : ${dir}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }

  const file = path.join(dir, `questions.v${version}.json`);

  // Ecriture exclusive : si le fichier existe deja, on n'ecrase pas une
  // version publiee — on echoue.
  try {
    writeFileSync(file, `${JSON.stringify(candidate, null, 2)}\n`, { encoding: "utf8", flag: "wx" });
  } catch (error) {
    throw invalid(
      `Publication impossible : ${file}\n${error instanceof Error ? error.message : String(error)}`,
    );
  }

  // La version en vigueur change : le cache doit repartir du disque.
  cached = null;
  return candidate;
}

/**
 * Signature d'une question : ce qui, en changeant, rend caduque une reponse
 * donnee sous une version anterieure.
 *
 * L'enonce EN FAIT PARTIE. On ne peut pas distinguer une coquille corrigee
 * d'une question entierement reecrite, et conserver la reponse a une question
 * dont le sens a change est bien plus grave que reposer une question pour une
 * virgule. Des qu'une question bouge, elle est reposee.
 */
function scoringSignature(question: QuestionnaireQuestion): string {
  const options = question.options
    .map((option) => `${option.id}:${option.value}:${option.label}`)
    .join("|");
  return `${question.type}#${question.weight}#${question.text}#${options}`;
}

/**
 * Questions a reposer pour passer de `from` a `to`.
 *
 * Une question est a reposer si elle est nouvelle, ou si son bareme a change.
 * Les autres gardent la reponse deja donnee par le candidat.
 */
export function questionsToReanswer(from: number, to: number): string[] {
  const previous = new Map(
    getQuestionnaireVersion(from).questions.map((q) => [q.id, scoringSignature(q)]),
  );

  return getQuestionnaireVersion(to)
    .questions.filter((question) => previous.get(question.id) !== scoringSignature(question))
    .map((question) => question.id);
}

/** Vide les caches. Reservee aux tests. */
export function resetQuestionnaireCache(): void {
  cached = null;
  byVersion.clear();
}
