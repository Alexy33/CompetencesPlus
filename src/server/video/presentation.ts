import {
  VIDEO_PROCESSING_MESSAGE,
  VIDEO_UNAVAILABLE_MESSAGE,
  type VideoProviderName,
  type VideoViewState,
} from "@/lib/vocabulary";

import { enabledVideoProvider } from "./registry";
import type { VideoPlayback } from "./provider";

/** Reference persistee d'une video : un identifiant opaque et son hebergeur. */
export interface VideoReference {
  videoId: string | null;
  videoProvider: VideoProviderName | null;
}

/**
 * Ce que l'application affiche a la place — ou en guise — de lecteur.
 *
 * C'est la seule forme que voient les pages, les composants et l'API. Ni
 * chemin de fichier, ni nom d'hebergeur impose : le front n'a pas a savoir si
 * les octets viennent du disque, de PeerTube ou d'ailleurs.
 */
export interface VideoView {
  state: VideoViewState;
  /** Hebergeur declare sur la ligne. Informatif (administration, journaux). */
  provider: VideoProviderName | null;
  /** Renseigne uniquement quand `state === "ready"`. */
  playback: VideoPlayback | null;
  /** Message a afficher quand il n'y a pas de lecteur. */
  message: string | null;
}

export const NO_VIDEO: VideoView = {
  state: "none",
  provider: null,
  playback: null,
  message: null,
};

function degraded(provider: VideoProviderName | null): VideoView {
  return { state: "unavailable", provider, playback: null, message: VIDEO_UNAVAILABLE_MESSAGE };
}

/**
 * Interroge l'hebergeur d'une video et rend de quoi l'afficher.
 *
 * Ne jette JAMAIS. Un hebergeur muet, une configuration qui ne le sert plus,
 * une exception inattendue : tout finit en `unavailable`. La fiche profil
 * reste servie, le lecteur est remplace par un message — pas par un 500.
 */
export async function describeVideo(reference: VideoReference | null): Promise<VideoView> {
  if (!reference?.videoId || !reference.videoProvider) return NO_VIDEO;

  const { videoId, videoProvider } = reference;

  // Hebergeur inconnu de ce deploiement : la video existe, on ne sait pas la
  // servir. C'est le cas d'une bascule VIDEO_PROVIDER sans migration.
  const provider = enabledVideoProvider(videoProvider);
  if (!provider) return degraded(videoProvider);

  try {
    const { state } = await provider.status(videoId);

    if (state === "processing") {
      return {
        state: "processing",
        provider: videoProvider,
        playback: null,
        message: VIDEO_PROCESSING_MESSAGE,
      };
    }

    if (state === "unavailable") return degraded(videoProvider);

    const playback = await provider.playbackUrl(videoId);
    if (!playback) return degraded(videoProvider);

    return { state: "ready", provider: videoProvider, playback, message: null };
  } catch (error) {
    console.warn(
      `[video] hebergeur « ${videoProvider} » injoignable pour ${videoId} :`,
      error instanceof Error ? error.message : error,
    );
    return degraded(videoProvider);
  }
}
