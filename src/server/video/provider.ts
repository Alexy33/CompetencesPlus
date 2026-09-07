/**
 * Contrat commun a tous les hebergeurs de video.
 *
 * L'application ne connait jamais le systeme de fichiers, ni PeerTube, ni
 * YouTube : elle connait ce contrat. Chaque implementation garde pour elle
 * l'emplacement physique des octets, le nom des fichiers et le protocole de
 * lecture. Ajouter l'instance ministerielle = ajouter une classe ici, pas
 * reecrire les routes.
 */

import {
  VIDEO_PROCESSING_STATES,
  VIDEO_PROVIDERS,
  type VideoProcessingState,
  type VideoProviderName,
} from "@/lib/vocabulary";

// Les listes fermees vivent avec le reste du vocabulaire du dispositif ; on les
// re-expose ici pour que le contrat se lise d'un seul tenant.
export { VIDEO_PROCESSING_STATES, VIDEO_PROVIDERS };
export type { VideoProcessingState, VideoProviderName };

export function isVideoProviderName(value: unknown): value is VideoProviderName {
  return typeof value === "string" && (VIDEO_PROVIDERS as readonly string[]).includes(value);
}

export interface VideoStatusReport {
  state: VideoProcessingState;
  /** Explication courte, destinee aux journaux et a l'administration. */
  reason: string | null;
  /**
   * Taille totale en octets, quand l'hebergeur la connait. Evite d'ouvrir un
   * flux entier juste pour interpreter un en-tete `Range`.
   */
  totalBytes?: number | null;
}

/** Comment le lecteur doit consommer la video une fois `ready`. */
export type VideoPlayback =
  /** Octets servis par une route de CETTE application (balise `<video>`). */
  | { kind: "stream"; url: string }
  /** Lecteur tiers a encapsuler (`<iframe>`). */
  | { kind: "embed"; url: string };

export interface VideoUpload {
  /** Corps de la requete. Lu une seule fois, en flux : jamais bufferise. */
  body: ReadableStream<Uint8Array>;
  /** Type MIME declare par le client, deja valide en amont. */
  mimeType: string;
  /** Plafond en octets. Depasse => `VideoTooLargeError`. */
  maxBytes: number;
}

export interface StoredVideo {
  /** Identifiant opaque, propre a l'hebergeur. Ne revele ni chemin ni profil. */
  videoId: string;
  provider: VideoProviderName;
  /** Etat au moment du depot. Souvent `processing`, jamais suppose `ready`. */
  state: VideoProcessingState;
  /** Octets recus, quand l'hebergeur les compte. */
  bytes: number | null;
}

/** Reponse d'un hebergeur qui sert lui-meme les octets (cf. `openStream`). */
export interface VideoByteRange {
  start: number;
  end: number;
}

export interface VideoStreamSlice {
  /** 200 (fichier entier) ou 206 (fragment demande via `Range`). */
  status: 200 | 206;
  mimeType: string;
  /** Taille totale de la video, tous fragments confondus. */
  totalBytes: number;
  headers: Record<string, string>;
  stream: ReadableStream<Uint8Array>;
}

export interface VideoProvider {
  readonly name: VideoProviderName;

  /** Depose un fichier et rend son identifiant opaque. */
  store(upload: VideoUpload): Promise<StoredVideo>;

  /** Ou en est le traitement. Ne jette pas si la video est absente : `unavailable`. */
  status(videoId: string): Promise<VideoStatusReport>;

  /** Adresse de lecture, ou `null` tant que la video n'est pas `ready`. */
  playbackUrl(videoId: string): Promise<VideoPlayback | null>;

  /**
   * Supprime les octets. Idempotent : supprimer deux fois n'est pas une erreur.
   * Rend `true` si quelque chose a reellement ete efface.
   */
  delete(videoId: string): Promise<boolean>;

  /**
   * Optionnel : hebergeurs dont les octets transitent par notre propre route
   * controlee (`GET /api/videos/{videoId}`). Un hebergeur tiers ne l'implemente
   * pas — l'application lit alors `playbackUrl()`.
   */
  openStream?(videoId: string, range: VideoByteRange | null): Promise<VideoStreamSlice | null>;

  /**
   * Optionnel : hebergeurs qui adoptent un contenu deja publie ailleurs, par son
   * URL, plutot qu'un fichier. Rend `null` si l'URL n'est pas reconnue.
   *
   * L'application ne demande jamais « es-tu l'hebergeur de liens ? » mais
   * « quelqu'un sait-il prendre une URL ? ». Un futur client PeerTube capable
   * d'importer depuis une URL n'aurait qu'a implementer cette methode.
   */
  storeLink?(rawUrl: string): Promise<StoredVideo | null>;
}

/** L'hebergeur ne repond pas. Declenche le mode degrade, jamais un 500. */
export class VideoProviderUnavailableError extends Error {
  readonly provider: VideoProviderName;

  constructor(provider: VideoProviderName, detail?: string) {
    super(
      `L'hebergeur video « ${provider} » est indisponible.` + (detail ? ` ${detail}` : ""),
    );
    this.name = "VideoProviderUnavailableError";
    this.provider = provider;
  }
}

export class VideoTooLargeError extends Error {
  constructor(maxBytes: number) {
    super(`Fichier trop volumineux : ${Math.round(maxBytes / (1024 * 1024))} Mo maximum (CDC §3.2).`);
    this.name = "VideoTooLargeError";
  }
}

export class UnsupportedVideoTypeError extends Error {
  constructor(mimeType: string) {
    super(`Type de fichier non pris en charge par cet hebergeur : ${mimeType}.`);
    this.name = "UnsupportedVideoTypeError";
  }
}

export class EmptyVideoError extends Error {
  constructor() {
    super("Corps de requete vide.");
    this.name = "EmptyVideoError";
  }
}
