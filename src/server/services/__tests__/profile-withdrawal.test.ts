import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Retrait autonome et reversible du catalogue (demande du cabinet, Mme
 * Pontaillac).
 *
 * Deux exigences se croisent ici, et c'est leur intersection qui est testee :
 * le titulaire doit pouvoir se retirer et revenir SEUL, mais il ne doit pas
 * pouvoir defaire par ce biais une decision de moderation.
 */

const REPO = process.cwd();

let workdir: string;

beforeEach(async () => {
  workdir = mkdtempSync(path.join(tmpdir(), "retrait-"));
  process.env.DATABASE_URL = `file:${path.join(workdir, "test.db")}`;
  vi.resetModules();

  const { db } = await import("@/db");
  const { migrate } = await import("drizzle-orm/better-sqlite3/migrator");
  migrate(db, { migrationsFolder: path.join(REPO, "drizzle") });
});

afterEach(() => {
  vi.restoreAllMocks();
  rmSync(workdir, { recursive: true, force: true });
});

/** Un candidat majeur et son profil, dans l'etat demande. */
async function createProfile(userId: string, status: "pending" | "published" | "removed") {
  const { db } = await import("@/db");
  const { user, profile } = await import("@/db/schema");

  await db.insert(user).values({
    id: userId,
    name: userId,
    email: `${userId}@test.fr`,
    role: "candidate",
    birthDate: "1990-01-01",
  });
  await db.insert(profile).values({
    id: `p-${userId}`,
    userId,
    title: "Infirmiere",
    sector: "Santé",
    city: "Lille",
    status,
  });
  return `p-${userId}`;
}

async function readProfile(userId: string) {
  const { db } = await import("@/db");
  const { profile } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const [row] = await db.select().from(profile).where(eq(profile.userId, userId)).limit(1);
  return row;
}

describe("retrait autonome — le titulaire se retire", () => {
  it("retire du catalogue et retient le statut d'origine", async () => {
    await createProfile("amina", "published");
    const profiles = await import("../profiles");

    await profiles.withdrawOwnProfile("amina");

    const row = await readProfile("amina");
    expect(row.status).toBe("removed");
    expect(row.withdrawnAt).not.toBeNull();
    expect(row.withdrawnFrom).toBe("published");
  });

  it("fait disparaitre le profil du catalogue", async () => {
    await createProfile("amina", "published");
    const profiles = await import("../profiles");

    const avant = await profiles.searchCatalog({ page: 1, pageSize: 12, order: "recent" });
    expect(avant.items).toHaveLength(1);

    await profiles.withdrawOwnProfile("amina");

    const apres = await profiles.searchCatalog({ page: 1, pageSize: 12, order: "recent" });
    expect(apres.items).toHaveLength(0);
    expect(apres.meta.total).toBe(0);
  });

  it("n'efface rien : les donnees du profil restent en base", async () => {
    await createProfile("amina", "published");
    const profiles = await import("../profiles");

    await profiles.withdrawOwnProfile("amina");

    const row = await readProfile("amina");
    expect(row).toBeDefined();
    expect(row.title).toBe("Infirmiere");
    expect(row.sector).toBe("Santé");
  });

  it("refuse un second retrait", async () => {
    await createProfile("amina", "published");
    const profiles = await import("../profiles");

    await profiles.withdrawOwnProfile("amina");
    await expect(profiles.withdrawOwnProfile("amina")).rejects.toThrow(/deja retire/i);
  });
});

describe("retrait autonome — le titulaire republie", () => {
  it("retablit le statut d'origine et efface les marqueurs", async () => {
    await createProfile("amina", "published");
    const profiles = await import("../profiles");

    await profiles.withdrawOwnProfile("amina");
    await profiles.restoreOwnProfile("amina");

    const row = await readProfile("amina");
    expect(row.status).toBe("published");
    expect(row.withdrawnAt).toBeNull();
    expect(row.withdrawnFrom).toBeNull();
  });

  it("un profil retire alors qu'il attendait la moderation y revient", async () => {
    await createProfile("karim", "pending");
    const profiles = await import("../profiles");

    await profiles.withdrawOwnProfile("karim");
    await profiles.restoreOwnProfile("karim");

    // Le retrait ne doit pas servir de raccourci vers la publication.
    const row = await readProfile("karim");
    expect(row.status).toBe("pending");
  });

  it("refuse de republier un profil qui n'a pas ete retire", async () => {
    await createProfile("amina", "published");
    const profiles = await import("../profiles");

    await expect(profiles.restoreOwnProfile("amina")).rejects.toThrow(/n'a pas ete retire/i);
  });
});

describe("retrait autonome — la moderation prime", () => {
  it("ne permet pas de reprendre a son compte un retrait de l'administration", async () => {
    await createProfile("amina", "removed");
    const profiles = await import("../profiles");

    await expect(profiles.withdrawOwnProfile("amina")).rejects.toThrow(/administration/i);
  });

  it("une decision de moderation retire au titulaire la possibilite de republier", async () => {
    const profileId = await createProfile("amina", "published");
    const profiles = await import("../profiles");

    await profiles.withdrawOwnProfile("amina");

    // L'administration tranche pendant que le profil est retire.
    await profiles.clearSelfWithdrawal(profileId);

    await expect(profiles.restoreOwnProfile("amina")).rejects.toThrow(/n'a pas ete retire/i);
  });
});

describe("retrait autonome — vue du titulaire", () => {
  it("expose l'etat du retrait sur son propre profil", async () => {
    await createProfile("amina", "published");
    const profiles = await import("../profiles");

    const avant = await profiles.findProfileByUserId("amina");
    expect(avant?.withdrawal.withdrawn).toBe(false);
    expect(avant?.withdrawal.restoresTo).toBeNull();

    await profiles.withdrawOwnProfile("amina");

    const apres = await profiles.findProfileByUserId("amina");
    expect(apres?.withdrawal.withdrawn).toBe(true);
    expect(apres?.withdrawal.at).not.toBeNull();
    expect(apres?.withdrawal.restoresTo).toBe("published");
  });
});
