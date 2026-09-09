import { randomBytes } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, rename, rm, stat } from "node:fs/promises";
import { dirname, join } from "node:path";
import { Readable } from "node:stream";

import { STORED_EXTENSIONS, extensionForMime, mimeForExtension } from "./mime";
import {
  EmptyVideoError,
  UnsupportedVideoTypeError,
  VideoProviderUnavailableError,
  VideoTooLargeError,
  type StoredVideo,
  type VideoByteRange,
  type VideoPlayback,
  type VideoProvider,
  type VideoStatusReport,
  type VideoStreamSlice,
  type VideoUpload,
} from "./provider";

/**
 * Hebergement sur le disque de l'application.
 *
 * Tout ce qui suit — racine de stockage, decoupage en sous-dossiers, nom des
 * fichiers, fichier temporaire `.part` — est un detail interne. Rien de tout
 * cela ne sort de cette classe : l'exterieur ne manipule qu'un identifiant
 * opaque de 32 caracteres hexadecimaux.
 */
export interface LocalVideoProviderOptions {
  /** Racine de stockage. Toujours HORS du repertoire web servi par Next. */
  root: string;
  /** Prefixe de la route applicative qui sert les octets. */
  playbackRoute?: string;
  /**
   * Duree de « transcodage » simulee, en millisecondes. A zero, une video
   * deposee est immediatement `ready`. Au-dessus, elle reste `processing`
   * le temps indique : de quoi eprouver le chemin asynchrone sans attendre
   * l'instance PeerTube.
   */
  processingDelayMs?: number;
}

const ID_BYTES = 16;

const ERREURS_STOCKAGE = new Set(["EACCES", "EPERM", "EROFS", "ENOSPC", "EMFILE", "ENFILE", "EDQUOT"]);

function estPanneDeStockage(error: unknown): boolean {
  const code = (error as { code?: unknown } | null)?.code;
  return typeof code === "string" && ERREURS_STOCKAGE.has(code);
}

export class LocalVideoProvider implements VideoProvider {
  readonly name = "local" as const;

  private readonly root: string;
  private readonly playbackRoute: string;
  private readonly processingDelayMs: number;

  constructor(options: LocalVideoProviderOptions) {
    this.root = options.root;
    this.playbackRoute = options.playbackRoute ?? "/api/videos";
    this.processingDelayMs = Math.max(0, options.processingDelayMs ?? 0);
  }

  /** Identifiant opaque : aleatoire, sans lien avec le profil ni le fichier. */
  static newVideoId(): string {
    return randomBytes(ID_BYTES).toString("hex");
  }

  /**
   * Chemin physique d'une video. Prive : jamais expose a l'application.
   *
   * `turbopackIgnore` : la racine vient de la configuration, pas du code. Sans
   * cette annotation, Next trace tout le projet comme dependance du serveur.
   */
  private pathFor(videoId: string, extension: string): string {
    return join(/*turbopackIgnore: true*/ this.root, videoId.slice(0, 2), `${videoId}.${extension}`);
  }

  /**
   * Retrouve le fichier d'un identifiant sans jamais lister un repertoire :
   * les extensions possibles sont connues, on interroge chaque candidat.
   */
  private async locate(
    videoId: string,
  ): Promise<{ path: string; extension: string; size: number; mtimeMs: number } | null> {
    if (!isOpaqueId(videoId)) return null;

    for (const extension of STORED_EXTENSIONS) {
      const path = this.pathFor(videoId, extension);
      try {
        const info = await stat(/*turbopackIgnore: true*/ path);
        if (info.isFile()) {
          return { path, extension, size: info.size, mtimeMs: info.mtimeMs };
        }
      } catch {
        // Extension suivante.
      }
    }
    return null;
  }

  /** Un `.part` residuel signale un depot interrompu, pas une video lisible. */
  private async hasPending(videoId: string): Promise<boolean> {
    if (!isOpaqueId(videoId)) return false;

    for (const extension of STORED_EXTENSIONS) {
      try {
        await stat(/*turbopackIgnore: true*/ `${this.pathFor(videoId, extension)}.part`);
        return true;
      } catch {
        // Extension suivante.
      }
    }
    return false;
  }

  async store(upload: VideoUpload): Promise<StoredVideo> {
    const extension = extensionForMime(upload.mimeType);
    if (!extension) throw new UnsupportedVideoTypeError(upload.mimeType);

    const videoId = LocalVideoProvider.newVideoId();
    const finalPath = this.pathFor(videoId, extension);
    const partPath = `${finalPath}.part`;

    try {
      await mkdir(/*turbopackIgnore: true*/ dirname(finalPath), { recursive: true });
    } catch (error) {
      if (estPanneDeStockage(error)) {
        console.error("[video] stockage local inaccessible :", error);
        throw new VideoProviderUnavailableError(this.name, "Le stockage est inaccessible.");
      }
      throw error;
    }

    const out = createWriteStream(/*turbopackIgnore: true*/ partPath);
    let bytes = 0;

    let erreurFlux: Error | null = null;
    out.on("error", (error: Error) => {
      erreurFlux = error;
    });
    const verifierFlux = () => {
      if (erreurFlux) throw erreurFlux;
    };

    try {
      const reader = upload.body.getReader();
      for (;;) {
        verifierFlux();
        const { done, value } = await reader.read();
        if (done) break;

        bytes += value.byteLength;
        if (bytes > upload.maxBytes) throw new VideoTooLargeError(upload.maxBytes);

        if (!out.write(value)) {
          await new Promise<void>((ok, ko) => {
            out.once("drain", ok);
            out.once("error", ko);
          });
        }
      }
      verifierFlux();
      await new Promise<void>((ok, ko) => out.end((error?: Error | null) => (error ? ko(error) : ok())));
    } catch (error) {
      out.destroy();
      await rm(/*turbopackIgnore: true*/ partPath, { force: true }).catch(() => {});

      if (estPanneDeStockage(error)) {
        console.error("[video] ecriture impossible sur le stockage local :", error);
        throw new VideoProviderUnavailableError(this.name, "Le stockage est inaccessible.");
      }
      throw error;
    }

    if (bytes === 0) {
      await rm(/*turbopackIgnore: true*/ partPath, { force: true });
      throw new EmptyVideoError();
    }

    // Renommage atomique : aucun demi-fichier n'est jamais servi.
    await rename(/*turbopackIgnore: true*/ partPath, finalPath);

    const { state } = await this.status(videoId);
    return { videoId, provider: this.name, state, bytes };
  }

  async status(videoId: string): Promise<VideoStatusReport> {
    const found = await this.locate(videoId);

    if (!found) {
      return (await this.hasPending(videoId))
        ? { state: "processing", reason: "Depot en cours." }
        : { state: "unavailable", reason: "Aucun fichier pour cet identifiant." };
    }

    if (this.processingDelayMs > 0 && Date.now() - found.mtimeMs < this.processingDelayMs) {
      return { state: "processing", reason: "Traitement en cours.", totalBytes: found.size };
    }

    return { state: "ready", reason: null, totalBytes: found.size };
  }

  async playbackUrl(videoId: string): Promise<VideoPlayback | null> {
    const { state } = await this.status(videoId);
    if (state !== "ready") return null;

    // Une route applicative, pas un chemin de fichier : les droits sont
    // verifies a chaque lecture.
    return { kind: "stream", url: `${this.playbackRoute}/${videoId}` };
  }

  async delete(videoId: string): Promise<boolean> {
    if (!isOpaqueId(videoId)) return false;

    let removed = false;
    for (const extension of STORED_EXTENSIONS) {
      const path = this.pathFor(videoId, extension);
      for (const candidate of [path, `${path}.part`]) {
        try {
          await stat(/*turbopackIgnore: true*/ candidate);
          await rm(/*turbopackIgnore: true*/ candidate, { force: true });
          removed = true;
        } catch {
          // Rien a supprimer pour ce candidat.
        }
      }
    }
    return removed;
  }

  async openStream(videoId: string, range: VideoByteRange | null): Promise<VideoStreamSlice | null> {
    const found = await this.locate(videoId);
    if (!found) return null;

    const { state } = await this.status(videoId);
    if (state !== "ready") return null;

    const mimeType = mimeForExtension(found.extension);

    if (!range) {
      return {
        status: 200,
        mimeType,
        totalBytes: found.size,
        headers: { "Content-Length": String(found.size), "Accept-Ranges": "bytes" },
        stream: Readable.toWeb(createReadStream(/*turbopackIgnore: true*/ found.path)) as ReadableStream<Uint8Array>,
      };
    }

    const end = Math.min(range.end, found.size - 1);
    return {
      status: 206,
      mimeType,
      totalBytes: found.size,
      headers: {
        "Content-Length": String(end - range.start + 1),
        "Content-Range": `bytes ${range.start}-${end}/${found.size}`,
        "Accept-Ranges": "bytes",
      },
      stream: Readable.toWeb(
        createReadStream(/*turbopackIgnore: true*/ found.path, { start: range.start, end }),
      ) as ReadableStream<Uint8Array>,
    };
  }

  /**
   * Reservee au script de migration : reprend un fichier deja present sur le
   * disque et le range dans le stockage de cet hebergeur, sous un identifiant
   * opaque neuf. Le fichier d'origine est deplace, jamais duplique.
   */
  async adoptExistingFile(sourcePath: string, extension: string): Promise<StoredVideo> {
    const videoId = LocalVideoProvider.newVideoId();
    const target = this.pathFor(videoId, extension);

    await mkdir(/*turbopackIgnore: true*/ dirname(target), { recursive: true });
    await rename(/*turbopackIgnore: true*/ sourcePath, target).catch(async (error: NodeJS.ErrnoException) => {
      // Systemes de fichiers differents : copie puis suppression de la source.
      if (error.code !== "EXDEV") throw error;
      const { copyFile } = await import("node:fs/promises");
      await copyFile(/*turbopackIgnore: true*/ sourcePath, target);
      await rm(/*turbopackIgnore: true*/ sourcePath, { force: true });
    });

    const info = await stat(/*turbopackIgnore: true*/ target);
    const { state } = await this.status(videoId);
    return { videoId, provider: this.name, state, bytes: info.size };
  }
}

/** 32 caracteres hexadecimaux. Bloque toute tentative de traversee de chemin. */
export function isOpaqueId(value: string): boolean {
  return /^[0-9a-f]{32}$/.test(value);
}
