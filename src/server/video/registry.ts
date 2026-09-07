import { dirname, resolve } from "node:path";

import { ExternalEmbedProvider } from "./embed-provider";
import { LocalVideoProvider } from "./local-provider";
import { FakePeerTubeProvider } from "./peertube-provider";
import { VIDEO_PROVIDERS, isVideoProviderName, type VideoProvider, type VideoProviderName } from "./provider";

/**
 * Point unique ou l'on choisit un hebergeur.
 *
 * Aucun `if (provider === "local")` ailleurs dans le code : le reste de
 * l'application demande un hebergeur par son nom et applique le contrat.
 */
export interface VideoConfig {
  /** Hebergeur actif : celui qui recoit les nouveaux depots. */
  provider: VideoProviderName;
  /** Racine de stockage de l'hebergeur local. Hors du repertoire web. */
  storageDir: string;
  /** Ancien repertoire de depot, lu par le script de migration uniquement. */
  legacyUploadDir: string;
  /** Lien YouTube / Vimeo : desactive par defaut (decision du cabinet). */
  embedEnabled: boolean;
  /** URL de l'instance ministerielle, quand elle existera. */
  peertubeUrl: string | null;
  /** Transcodage simule de l'hebergeur local, en millisecondes. */
  processingDelayMs: number;
}

type Env = Record<string, string | undefined>;

function databaseDir(env: Env): string {
  const dbPath = (env.DATABASE_URL ?? "file:./local.db").replace(/^file:/, "");
  return dirname(dbPath);
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  const normalized = value?.trim().toLowerCase();
  if (normalized === undefined || normalized === "") return fallback;
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function readVideoConfig(env: Env = process.env): VideoConfig {
  const requested = env.VIDEO_PROVIDER?.trim() || "local";
  if (!isVideoProviderName(requested)) {
    throw new Error(
      `VIDEO_PROVIDER=« ${requested} » inconnu. Valeurs acceptees : ${VIDEO_PROVIDERS.join(", ")}.`,
    );
  }

  const base = databaseDir(env);
  const delay = Number(env.VIDEO_LOCAL_PROCESSING_MS ?? "0");

  return {
    provider: requested,
    storageDir: env.VIDEO_STORAGE_DIR?.trim()
      ? resolve(env.VIDEO_STORAGE_DIR.trim())
      : resolve(base, "videos"),
    legacyUploadDir: env.VIDEO_UPLOAD_DIR?.trim()
      ? resolve(env.VIDEO_UPLOAD_DIR.trim())
      : resolve(base, "uploads"),
    embedEnabled: readBoolean(env.VIDEO_EMBED_ENABLED, false),
    peertubeUrl: env.VIDEO_PEERTUBE_URL?.trim() || null,
    processingDelayMs: Number.isFinite(delay) && delay > 0 ? delay : 0,
  };
}

/** Fabrique une implementation a partir de son nom. Aucun etat global. */
export function createVideoProvider(
  name: VideoProviderName,
  config: VideoConfig,
): VideoProvider {
  switch (name) {
    case "local":
      return new LocalVideoProvider({
        root: config.storageDir,
        processingDelayMs: config.processingDelayMs,
      });
    case "peertube":
      return new FakePeerTubeProvider(config.peertubeUrl);
    case "embed":
      return new ExternalEmbedProvider();
  }
}

export interface VideoRegistry {
  config: VideoConfig;
  /** Hebergeur actif : celui qui recoit les nouveaux depots. */
  active: VideoProvider;
  /**
   * Hebergeurs en service sur ce deploiement. Une video dont l'hebergeur n'y
   * figure pas est signalee indisponible — c'est exactement ce qui rend le
   * mode degrade observable en basculant `VIDEO_PROVIDER`.
   */
  enabled: Map<VideoProviderName, VideoProvider>;
}

export function buildVideoRegistry(config: VideoConfig): VideoRegistry {
  const enabled = new Map<VideoProviderName, VideoProvider>();

  const active = createVideoProvider(config.provider, config);
  enabled.set(config.provider, active);

  // Le lien tiers coexiste avec l'hebergeur actif, uniquement s'il est
  // explicitement rallume.
  if (config.embedEnabled && !enabled.has("embed")) {
    enabled.set("embed", createVideoProvider("embed", config));
  }

  return { config, active, enabled };
}

let registry: VideoRegistry | null = null;

function current(): VideoRegistry {
  registry ??= buildVideoRegistry(readVideoConfig());
  return registry;
}

/** Remet la resolution a zero. Reservee aux tests et aux scripts. */
export function resetVideoRegistry(): void {
  registry = null;
}

export function videoConfig(): VideoConfig {
  return current().config;
}

/** Hebergeur qui recoit les nouveaux depots. */
export function activeVideoProvider(): VideoProvider {
  return current().active;
}

/** Hebergeur en service portant ce nom, ou `null` s'il ne l'est pas ici. */
export function enabledVideoProvider(name: string | null | undefined): VideoProvider | null {
  if (!isVideoProviderName(name)) return null;
  return current().enabled.get(name) ?? null;
}

/** Hebergeur `VideoProvider` sachant adopter une URL (cf. `storeLink`). */
export type LinkCapableProvider = VideoProvider &
  Required<Pick<VideoProvider, "storeLink">>;

/**
 * Hebergeur en service capable d'adopter un lien tiers, s'il y en a un.
 *
 * Resolution par CAPACITE, pas par nom : rien ici ne mentionne « embed ». Sur
 * un deploiement ou l'hebergement par lien est eteint, il n'y en a aucun, et
 * l'application refuse le lien sans avoir a savoir pourquoi.
 */
export function linkVideoProvider(): LinkCapableProvider | null {
  for (const provider of current().enabled.values()) {
    if (typeof provider.storeLink === "function") return provider as LinkCapableProvider;
  }
  return null;
}

/**
 * Hebergeur a solliciter pour SUPPRIMER, meme s'il n'est pas en service.
 *
 * La suppression obeit a une obligation legale (retrait du consentement) : on
 * ne laisse pas d'octets derriere soi sous pretexte que le deploiement ne sert
 * plus cet hebergeur.
 */
export function deletionVideoProvider(name: string | null | undefined): VideoProvider | null {
  if (!isVideoProviderName(name)) return null;
  return current().enabled.get(name) ?? createVideoProvider(name, current().config);
}
