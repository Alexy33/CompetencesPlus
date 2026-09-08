/**
 * Remet le temoin de non-regression dans un etat demonstrable.
 *
 *   npm run video:temoin
 *
 * La recette manuelle deplace, remplace et supprime des videos — c'est son
 * travail. Le temoin (cf. docs/temoin-video.md) finit donc regulierement sans
 * video, et la bascule d'hebergeur n'est plus observable. Ce script le
 * restaure depuis la sauvegarde prise avant migration, par le meme chemin que
 * le reste du dispositif : `VideoProvider.store()`, jamais un fichier pose a
 * la main dans le stockage.
 *
 * Comme le script de migration, il connait l'hebergement local — c'est la ou
 * vit la sauvegarde. Il est sans effet si elle a disparu.
 */

import { createReadStream } from "node:fs";
import { readdir, stat } from "node:fs/promises";
import { basename, dirname, join, resolve } from "node:path";
import { Readable } from "node:stream";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profile, user } from "@/db/schema";
import { LocalVideoProvider } from "@/server/video/local-provider";
import { mimeForExtension } from "@/server/video/mime";
import { readVideoConfig } from "@/server/video/registry";

/** Sauvegarde prise avant la migration : <dossier de la base>/sauvegarde-avant-video/uploads */
function backupDir(): string {
  const dbPath = (process.env.DATABASE_URL ?? "file:./local.db").replace(/^file:/, "");
  return resolve(dirname(dbPath), "sauvegarde-avant-video", "uploads");
}

async function main(): Promise<void> {
  const config = readVideoConfig();
  const local = new LocalVideoProvider({
    root: config.storageDir,
    processingDelayMs: config.processingDelayMs,
  });

  const directory = backupDir();
  const entries = await readdir(directory).catch(() => [] as string[]);
  const backups = entries.filter((name) => !name.endsWith(".part"));

  if (backups.length === 0) {
    console.error(`Aucune sauvegarde dans ${directory}.`);
    console.error("Rien a restaurer : deposez une video depuis /candidate, puis validez-la depuis /admin.");
    process.exitCode = 1;
    return;
  }

  let restored = 0;

  for (const entry of backups) {
    // Convention de la sauvegarde : <profileId>.<ext>
    const source = join(directory, entry);
    const extension = entry.split(".").pop()!.toLowerCase();
    const profileId = basename(entry, `.${extension}`);

    const [row] = await db
      .select({ id: profile.id, videoId: profile.videoId, name: user.name })
      .from(profile)
      .innerJoin(user, eq(user.id, profile.userId))
      .where(eq(profile.id, profileId))
      .limit(1);

    if (!row) {
      console.warn(`  ${profileId} : ce profil n'existe plus en base. Ignore.`);
      continue;
    }

    const { state } = row.videoId
      ? await local.status(row.videoId)
      : { state: "unavailable" as const };

    if (state === "ready") {
      console.log(`  ${row.name} : porte deja une video lisible. Rien a faire.`);
      continue;
    }

    const info = await stat(source);
    const stored = await local.store({
      body: Readable.toWeb(createReadStream(source)) as ReadableStream<Uint8Array>,
      mimeType: mimeForExtension(extension),
      maxBytes: info.size,
    });

    await db
      .update(profile)
      .set({
        videoId: stored.videoId,
        videoProvider: stored.provider,
        // Le temoin sert a demontrer la lecture publique : sans validation, la
        // fiche masque la video avant meme d'interroger l'hebergeur.
        videoStatus: "approved",
        videoConsentGranted: true,
        updatedAt: new Date(),
      })
      .where(eq(profile.id, profileId));

    restored += 1;
    console.log(`  ${row.name} : restaure (${stored.bytes} octets) -> ${stored.videoId}, video validee.`);
  }

  console.log("");
  console.log(restored > 0 ? `Temoin(s) restaure(s) : ${restored}.` : "Rien a restaurer.");
  if (restored > 0) console.log("Verifiez avec : make video-etat");
}

main().catch((error) => {
  console.error("[video:temoin] echec :", error);
  process.exit(1);
});
