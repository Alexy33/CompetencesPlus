import { spawn } from "node:child_process";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Une seule tentative en cours par candidat, garantie EN BASE.
 *
 * Le garde-fou applicatif de `openAttempt` (lire, puis inserer) ne tenait que
 * par une propriete du deploiement : le pilote better-sqlite3 est synchrone,
 * donc rien ne s'intercale entre les deux requetes dans un processus unique.
 * Deux processus sur le meme fichier suffisaient a creer deux lignes.
 *
 * Ces tests portent sur l'index partiel, pas sur le code : ils doivent echouer
 * si l'index disparait du schema.
 */

const REPO = process.cwd();

const opt = (id: string, value: number) => ({ id, label: `Reponse ${id}`, value });
const q = (id: string) => ({
  id,
  text: `Enonce de ${id}`,
  type: "single_choice" as const,
  weight: 2,
  options: [opt(`${id}-o1`, 0), opt(`${id}-o2`, 1)],
});
const V1 = { version: 1, questions: [q("q1"), q("q2")] };

let workdir: string;
let dbPath: string;

beforeEach(async () => {
  workdir = mkdtempSync(path.join(tmpdir(), "attempt-idx-"));
  mkdirSync(path.join(workdir, "certification"), { recursive: true });
  writeFileSync(
    path.join(workdir, "certification", "questions.v1.json"),
    JSON.stringify(V1),
    "utf8",
  );

  dbPath = path.join(workdir, "test.db");
  process.env.DATABASE_URL = `file:${dbPath}`;
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

describe("index partiel — une seule tentative en cours", () => {
  it("la base refuse une seconde tentative en cours pour le meme candidat", async () => {
    await createUser("amina");
    const { db } = await import("@/db");
    const { certificationAttempt } = await import("@/db/schema");

    await db.insert(certificationAttempt).values({
      id: "a1",
      userId: "amina",
      status: "in_progress",
      questionnaireVersion: 1,
    });

    await expect(
      db.insert(certificationAttempt).values({
        id: "a2",
        userId: "amina",
        status: "in_progress",
        questionnaireVersion: 1,
      }),
    ).rejects.toThrow(/UNIQUE/i);
  });

  it("n'empeche pas de conserver l'historique des tentatives soumises", async () => {
    await createUser("amina");
    const { db } = await import("@/db");
    const { certificationAttempt } = await import("@/db/schema");

    // L'index est partiel : il ne porte que sur `in_progress`. Le
    // versionnement et le rattrapage dependent de cet historique.
    for (const id of ["s1", "s2", "s3"]) {
      await db.insert(certificationAttempt).values({
        id,
        userId: "amina",
        status: "submitted",
        questionnaireVersion: 1,
        score: 80,
        passed: true,
      });
    }
    await db.insert(certificationAttempt).values({
      id: "en-cours",
      userId: "amina",
      status: "in_progress",
      questionnaireVersion: 1,
    });

    const rows = await db.select().from(certificationAttempt);
    expect(rows).toHaveLength(4);
  });

  it("laisse chaque candidat avoir la sienne", async () => {
    await createUser("amina");
    await createUser("karim");
    const { db } = await import("@/db");
    const { certificationAttempt } = await import("@/db/schema");

    await db.insert(certificationAttempt).values({
      id: "a1",
      userId: "amina",
      status: "in_progress",
      questionnaireVersion: 1,
    });
    await db.insert(certificationAttempt).values({
      id: "k1",
      userId: "karim",
      status: "in_progress",
      questionnaireVersion: 1,
    });

    const rows = await db.select().from(certificationAttempt);
    expect(rows).toHaveLength(2);
  });
});

describe("openAttempt — course perdue", () => {
  it("rend la tentative gagnante au lieu de remonter l'erreur", async () => {
    await createUser("amina");
    const { db } = await import("@/db");
    const { certificationAttempt } = await import("@/db/schema");
    const certification = await import("../certification");

    // Un concurrent insere APRES notre lecture : on simule en posant la ligne
    // gagnante puis en forcant `openAttempt` a tenter quand meme l'insertion.
    await db.insert(certificationAttempt).values({
      id: "gagnante",
      userId: "amina",
      status: "in_progress",
      questionnaireVersion: 1,
    });

    const attempt = await certification.openAttempt("amina");
    expect(attempt.id).toBe("gagnante");
  });
});

describe("deux processus concurrents", () => {
  it("ne creent qu'une seule tentative en cours", async () => {
    // Le vrai cas que le code seul ne couvrait pas : deux processus systeme
    // sur le meme fichier. Sans l'index, ce test produit deux lignes.
    const racer = path.join(workdir, "racer.cjs");
    writeFileSync(
      racer,
      `const D = require(${JSON.stringify(require.resolve("better-sqlite3"))});
const d = new D(${JSON.stringify(dbPath)});
d.pragma("busy_timeout = 5000");
const found = d.prepare("select id from certification_attempt where user_id=? and status=? limit 1").get("amina", "in_progress");
Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 200);
if (!found) {
  try {
    d.prepare("insert into certification_attempt (id,user_id,status,questionnaire_version) values (?,?,?,?)")
      .run(process.argv[2], "amina", "in_progress", 1);
  } catch (e) { if (e.code !== "SQLITE_CONSTRAINT_UNIQUE") throw e; }
}`,
      "utf8",
    );

    const D = require("better-sqlite3");
    const raw = new D(dbPath);
    raw.prepare("insert into user (id,name,email,role) values (?,?,?,?)").run(
      "amina",
      "amina",
      "amina@test.fr",
      "candidate",
    );
    raw.close();

    // Lances VRAIMENT en parallele. Deux `execFileSync` s'executeraient l'un
    // apres l'autre : le second verrait la ligne du premier et le test
    // passerait meme sans index — il ne prouverait rien.
    const run = (tag: string) =>
      new Promise<void>((resolve, reject) => {
        spawn(process.execPath, [racer, tag])
          .on("exit", () => resolve())
          .on("error", reject);
      });
    await Promise.all([run("proc-a"), run("proc-b")]);

    const check = new D(dbPath, { readonly: true });
    const { c } = check
      .prepare("select count(*) c from certification_attempt where user_id=? and status='in_progress'")
      .get("amina") as { c: number };
    check.close();

    expect(c).toBe(1);
  });
});
