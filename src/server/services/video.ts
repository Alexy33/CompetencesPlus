import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { VIDEO_CONSENT_VERSION, type VideoProviderName, type VideoStatus } from "@/lib/vocabulary";
import { extensionForMime } from "@/server/video/mime";
import {
  describeVideo,
  NO_VIDEO,
  type VideoReference,
  type VideoView,
} from "@/server/video/presentation";
import {
  UnsupportedVideoTypeError,
  VideoProviderUnavailableError,
  type StoredVideo,
  type VideoByteRange,
} from "@/server/video/provider";
import {
  activeVideoProvider,
  deletionVideoProvider,
  linkVideoProvider,
} from "@/server/video/registry";

export const MAX_VIDEO_BYTES = 100 * 1024 * 1024;

/**
 * Conserve pour les appelants existants (et teste unitairement) : c'est la
 * seule chose que les routes ont encore besoin de savoir d'un type MIME, pour
 * refuser un fichier avant meme de solliciter un hebergeur.
 */
export { extensionForMime };

export { describeVideo, NO_VIDEO };
export type { VideoReference, VideoView };

export class MissingVideoConsentError extends Error {
  constructor() {
    super(
      "Aucun consentement en cours pour la diffusion de la video. " +
        "Acceptez le texte en vigueur avant de mettre une video en ligne ou d'en publier le lien.",
    );
    this.name = "MissingVideoConsentError";
  }
}

export class EmbedProviderDisabledError extends Error {
  constructor() {
    super(
      "L'hebergement par lien tiers (YouTube, Vimeo) est desactive sur ce " +
        "deploiement. Televersez votre video : elle sera hebergee par le dispositif.",
    );
    this.name = "EmbedProviderDisabledError";
  }
}

// --- Lecture de la reference persistee -------------------------------------

async function readReference(profileId: string): Promise<VideoReference | null> {
  const [row] = await db
    .select({ videoId: profile.videoId, videoProvider: profile.videoProvider })
    .from(profile)
    .where(eq(profile.id, profileId))
    .limit(1);

  return row ?? null;
}

/** Profil proprietaire d'un identifiant opaque. Sert a autoriser la lecture. */
export async function findProfileByVideoId(videoId: string) {
  const [row] = await db
    .select({
      profileId: profile.id,
      userId: profile.userId,
      videoId: profile.videoId,
      videoProvider: profile.videoProvider,
      profileStatus: profile.status,
      videoStatus: profile.videoStatus,
    })
    .from(profile)
    .where(eq(profile.videoId, videoId))
    .limit(1);

  return row ?? null;
}

// --- Depot -----------------------------------------------------------------

export async function assertVideoConsent(profileId: string): Promise<void> {
  const consent = await readVideoConsent(profileId);
  if (!consent?.granted) throw new MissingVideoConsentError();
}

async function persistReference(profileId: string, stored: StoredVideo | null): Promise<void> {
  await db
    .update(profile)
    .set({
      videoId: stored?.videoId ?? null,
      videoProvider: stored?.provider ?? null,
      updatedAt: new Date(),
    })
    .where(eq(profile.id, profileId));
}

/**
 * Confie le fichier a l'hebergeur actif et enregistre la reference rendue.
 *
 * L'ancienne video est supprimee AVANT d'enregistrer la nouvelle : jamais deux
 * references, jamais d'octets orphelins. L'etat rendu peut etre `processing` —
 * l'appelant ne doit pas supposer que la video est lisible.
 */
export async function storeProfileVideo(
  profileId: string,
  mimeType: string,
  body: ReadableStream<Uint8Array>,
): Promise<StoredVideo> {
  await assertVideoConsent(profileId);

  const stored = await activeVideoProvider().store({
    body,
    mimeType,
    maxBytes: MAX_VIDEO_BYTES,
  });

  await deleteProfileVideo(profileId);
  await persistReference(profileId, stored);
  await resetVideoModeration(profileId);

  return stored;
}

/**
 * Enregistre un lien tiers (YouTube, Vimeo) — uniquement si ce fournisseur est
 * allume sur ce deploiement. Il ne l'est pas par defaut.
 */
export async function setProfileVideoLink(profileId: string, rawUrl: string): Promise<StoredVideo> {
  await assertVideoConsent(profileId);

  // Par capacite, jamais par nom : aucun hebergeur en service ne sait adopter
  // une URL => le lien est refuse.
  const provider = linkVideoProvider();
  if (!provider) throw new EmbedProviderDisabledError();

  const stored = await provider.storeLink(rawUrl);
  if (!stored) {
    throw new UnsupportedVideoTypeError(
      "lien non reconnu : seuls YouTube et Vimeo sont acceptes par cet hebergeur",
    );
  }

  await deleteProfileVideo(profileId);
  await persistReference(profileId, stored);
  await resetVideoModeration(profileId);

  return stored;
}

// --- Suppression -----------------------------------------------------------

export interface VideoDeletion {
  /** Une reference existait bel et bien. */
  hadVideo: boolean;
  /** Des octets ont reellement disparu du stockage. */
  bytesRemoved: boolean;
  /** L'hebergeur n'a pas repondu : la reference est retiree, pas les octets. */
  providerUnavailable: boolean;
}

/**
 * Chemin de suppression UNIQUE du dispositif.
 *
 * Suppression volontaire par le candidat, retrait du consentement, remplacement
 * d'une video : tout passe ici, donc par `VideoProvider.delete()`. Il n'existe
 * aucune autre facon d'effacer un fichier video dans le code.
 */
export async function deleteProfileVideo(profileId: string): Promise<VideoDeletion> {
  const reference = await readReference(profileId);

  if (!reference?.videoId || !reference.videoProvider) {
    return { hadVideo: false, bytesRemoved: false, providerUnavailable: false };
  }

  // L'hebergeur est sollicite meme s'il n'est plus celui qui sert les lectures :
  // laisser des octets derriere soi n'est pas une option.
  const provider = deletionVideoProvider(reference.videoProvider);

  let bytesRemoved = false;
  let providerUnavailable = false;

  if (!provider) {
    providerUnavailable = true;
    console.warn(
      `[video] hebergeur « ${reference.videoProvider} » inconnu : reference ${reference.videoId} retiree sans suppression.`,
    );
  } else {
    try {
      bytesRemoved = await provider.delete(reference.videoId);
    } catch (error) {
      if (!(error instanceof VideoProviderUnavailableError)) throw error;
      providerUnavailable = true;
      // Le retrait est une obligation : la reference part quand meme, mais le
      // fait est trace pour que la suppression puisse etre rejouee.
      console.error(
        `[video] suppression impossible chez « ${reference.videoProvider} » (${reference.videoId}) : ${error.message}`,
      );
    }
  }

  await persistReference(profileId, null);

  return { hadVideo: true, bytesRemoved, providerUnavailable };
}

// --- Consentement ----------------------------------------------------------

export interface VideoConsent {
  granted: boolean;

  grantedAt: Date | null;

  version: string | null;
  revokedAt: Date | null;
}

export async function readVideoConsent(profileId: string): Promise<VideoConsent | null> {
  const [row] = await db
    .select({
      granted: profile.videoConsentGranted,
      grantedAt: profile.videoConsentAt,
      version: profile.videoConsentVersion,
      revokedAt: profile.videoConsentRevokedAt,
    })
    .from(profile)
    .where(eq(profile.id, profileId))
    .limit(1);

  return row ?? null;
}

export async function grantVideoConsent(profileId: string): Promise<VideoConsent> {
  const now = new Date();
  await db
    .update(profile)
    .set({
      videoConsentGranted: true,
      videoConsentAt: now,
      videoConsentVersion: VIDEO_CONSENT_VERSION,
      videoConsentRevokedAt: null,
      updatedAt: now,
    })
    .where(eq(profile.id, profileId));

  const stored = await readVideoConsent(profileId);
  return stored ?? { granted: true, grantedAt: now, version: VIDEO_CONSENT_VERSION, revokedAt: null };
}

export async function revokeVideoConsent(profileId: string): Promise<VideoConsent> {
  // Meme chemin que la suppression ordinaire : `VideoProvider.delete()`. Le
  // retrait du consentement fait disparaitre les octets, pas seulement la ligne.
  await deleteProfileVideo(profileId);

  const now = new Date();
  await db
    .update(profile)
    .set({
      videoConsentGranted: false,
      videoConsentRevokedAt: now,

      videoStatus: "pending",
      videoReviewReason: null,
      videoReviewedBy: null,
      videoReviewedAt: null,
      updatedAt: now,
    })
    .where(eq(profile.id, profileId));

  const after = await readVideoConsent(profileId);
  return after ?? { granted: false, grantedAt: null, version: null, revokedAt: now };
}

// --- Moderation ------------------------------------------------------------

export interface VideoModeration {
  status: VideoStatus;

  reason: string | null;

  decidedBy: string | null;
  decidedAt: Date | null;
}

export async function readVideoModeration(profileId: string): Promise<VideoModeration | null> {
  const [row] = await db
    .select({
      status: profile.videoStatus,
      reason: profile.videoReviewReason,
      decidedBy: profile.videoReviewedBy,
      decidedAt: profile.videoReviewedAt,
    })
    .from(profile)
    .where(eq(profile.id, profileId))
    .limit(1);

  return row ?? null;
}

export async function resetVideoModeration(profileId: string): Promise<void> {
  await db
    .update(profile)
    .set({
      videoStatus: "pending",
      videoReviewReason: null,
      videoReviewedBy: null,
      videoReviewedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(profile.id, profileId));
}

export async function decideVideoModeration(
  profileId: string,
  decision: Exclude<VideoStatus, "pending">,
  moderatorId: string,
  reason: string | null,
): Promise<VideoModeration | null> {
  await db
    .update(profile)
    .set({
      videoStatus: decision,
      videoReviewReason: reason,
      videoReviewedBy: moderatorId,
      videoReviewedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(profile.id, profileId));

  return readVideoModeration(profileId);
}

// --- Lecture ---------------------------------------------------------------

/** `Range: bytes=…`. Rend `null` si l'en-tete est absent ou inexploitable. */
export function parseRangeHeader(header: string | null, size: number): VideoByteRange | null {
  if (!header) return null;
  const match = /^bytes=(\d*)-(\d*)$/.exec(header.trim());
  if (!match) return null;

  const [, rawStart, rawEnd] = match;
  let start = rawStart ? Number(rawStart) : 0;
  let end = rawEnd ? Number(rawEnd) : size - 1;

  if (rawStart === "" && rawEnd !== "") {
    start = Math.max(0, size - Number(rawEnd));
    end = size - 1;
  }

  if (Number.isNaN(start) || Number.isNaN(end) || start > end || start >= size) return null;
  return { start, end: Math.min(end, size - 1) };
}

export type { VideoProviderName };
