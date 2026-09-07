/**
 * Migration des videos existantes vers l'abstraction VideoProvider.
 *
 * Rejouable, et sans effet la deuxieme fois : une video deja rangee dans le
 * stockage du fournisseur est comptee « deja migree », pas recopiee.
 *
 *   npm run video:migrate           # migre
 *   npm run video:migrate -- --dry  # n'ecrit rien, affiche ce qui serait fait
 *
 * Ce que fait le script, pour chaque profil portant une reference video :
 *
 *   1. si le fournisseur retrouve deja les octets sous l'identifiant opaque,
 *      il n'y a rien a faire ;
 *   2. sinon, il cherche l'ancien fichier `<uploads>/<profileId>.<ext>` et le
 *      DEPLACE sous un identifiant opaque, qui est ecrit en base ;
 *   3. si aucun fichier n'est trouve, la ligne est signalee — et laissee
 *      telle quelle. Rien n'est efface : une incoherence se corrige a la main,
 *      elle ne se resout pas en supprimant des donnees.
 *
 * La migration SQL (drizzle/0007) a deja pose `video_provider` et un
 * identifiant opaque a partir de l'ancienne colonne `video_url`. Ce script
 * s'occupe des octets, que le SQL ne sait pas deplacer.
 */

import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { profile } from "@/db/schema";
import { LocalVideoProvider } from "@/server/video/local-provider";
import { readVideoConfig } from "@/server/video/registry";

const DRY_RUN = process.argv.includes("--dry");

interface Report {
  migrated: number;
  skipped: number;
  failed: number;
}

interface LegacyFile {
  path: string;
  extension: string;
}

/**
 * Ancien emplacement : un fichier par profil, `<profileId>.<ext>`, dans le
 * repertoire d'upload historique. Ce script est le SEUL endroit du depot qui
 * connaisse encore cette convention.
 */
async function findLegacyFile(directory: string, profileId: string): Promise<LegacyFile | null> {
  let entries: string[];
  try {
    entries = await readdir(directory);
  } catch {
    return null;
  }

  const match = entries.find(
    (name) => name.startsWith(`${profileId}.`) && !name.endsWith(".part"),
  );
  if (!match) return null;

  const path = join(directory, match);
  const info = await stat(path).catch(() => null);
  if (!info?.isFile() || info.size === 0) return null;

  return { path, extension: match.slice(profileId.length + 1).toLowerCase() };
}

async function countLegacyFiles(directory: string): Promise<number> {
  const entries = await readdir(directory).catch(() => [] as string[]);
  return entries.filter((name) => !name.endsWith(".part")).length;
}

async function main(): Promise<void> {
  const config = readVideoConfig();
  const local = new LocalVideoProvider({
    root: config.storageDir,
    processingDelayMs: config.processingDelayMs,
  });

  const rows = await db
    .select({
      id: profile.id,
      videoId: profile.videoId,
      videoProvider: profile.videoProvider,
    })
    .from(profile)
    .where(isNotNull(profile.videoId));

  const localRows = rows.filter((row) => row.videoProvider === "local");
  const embedRows = rows.filter((row) => row.videoProvider === "embed");

  console.log("Avant migration :");
  console.log(`  Lignes portant une video      : ${rows.length}`);
  console.log(`  dont hebergeur « local »      : ${localRows.length}`);
  console.log(`  dont lien tiers « embed »     : ${embedRows.length}`);
  console.log(`  Fichiers dans ${config.legacyUploadDir} : ${await countLegacyFiles(config.legacyUploadDir)}`);
  console.log("");

  if (DRY_RUN) console.log("Mode --dry : aucune ecriture.\n");
  console.log("Migration...\n");

  const report: Report = { migrated: 0, skipped: 0, failed: 0 };
  const problems: string[] = [];

  for (const row of localRows) {
    if (!row.videoId) continue;

    // 1. Deja range chez le fournisseur ? On ne touche a rien.
    const { state } = await local.status(row.videoId);
    if (state !== "unavailable") {
      report.skipped += 1;
      continue;
    }

    // 2. Reprendre l'ancien fichier, s'il existe encore.
    const legacy = await findLegacyFile(config.legacyUploadDir, row.id);
    if (!legacy) {
      report.failed += 1;
      problems.push(
        `profil ${row.id} : reference « ${row.videoId} » sans octets, et aucun fichier ` +
          `${row.id}.* dans ${config.legacyUploadDir}. Ligne laissee en l'etat.`,
      );
      continue;
    }

    if (DRY_RUN) {
      console.log(`  [dry] ${legacy.path} -> identifiant opaque (profil ${row.id})`);
      report.migrated += 1;
      continue;
    }

    try {
      const stored = await local.adoptExistingFile(legacy.path, legacy.extension);
      await db
        .update(profile)
        .set({ videoId: stored.videoId, videoProvider: stored.provider })
        .where(eq(profile.id, row.id));

      report.migrated += 1;
      console.log(`  profil ${row.id} : ${legacy.path} -> ${stored.videoId} (${stored.bytes} octets)`);
    } catch (error) {
      report.failed += 1;
      problems.push(
        `profil ${row.id} : deplacement impossible (${(error as Error).message}). Fichier conserve.`,
      );
    }
  }

  console.log("");
  console.log(`Migrees : ${report.migrated}`);
  console.log(`Ignorees (deja migrees) : ${report.skipped}`);
  console.log(`En echec : ${report.failed}`);
  console.log("");

  // Etat reel apres coup : on relit la base — les identifiants ont change —
  // et on interroge le fournisseur. Pas de confiance au compteur de la boucle.
  const after = await db
    .select({ videoId: profile.videoId, videoProvider: profile.videoProvider })
    .from(profile)
    .where(isNotNull(profile.videoId));

  const afterLocal = after.filter((row) => row.videoProvider === "local");

  let servable = 0;
  for (const row of afterLocal) {
    if (!row.videoId) continue;
    const { state } = await local.status(row.videoId);
    if (state !== "unavailable") servable += 1;
  }

  console.log("Apres migration :");
  console.log(`  Videos servies par l'hebergeur local : ${servable} / ${afterLocal.length}`);
  console.log(`  Liens tiers (aucun octet a deplacer) : ${after.length - afterLocal.length}`);
  console.log(`  Fichiers restants dans ${config.legacyUploadDir} : ${await countLegacyFiles(config.legacyUploadDir)}`);

  if (problems.length > 0) {
    console.log("");
    console.log("Incoherences a traiter a la main (rien n'a ete supprime) :");
    for (const problem of problems) console.log(`  - ${problem}`);
  }

  if (report.failed > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("[video:migrate] echec :", error);
  process.exit(1);
});
