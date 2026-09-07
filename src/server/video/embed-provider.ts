import {
  UnsupportedVideoTypeError,
  type StoredVideo,
  type VideoPlayback,
  type VideoProvider,
  type VideoStatusReport,
  type VideoUpload,
} from "./provider";

/**
 * Lien vers une plateforme tierce (YouTube, Vimeo).
 *
 * Conserve pour l'existant, mais DESACTIVE par defaut : le cabinet ne veut pas
 * renvoyer les usagers d'un service public vers une plateforme publicitaire.
 * Il faut poser `VIDEO_EMBED_ENABLED=true` pour qu'il soit enregistre.
 *
 * Il n'heberge rien : `store()` d'un fichier n'a pas de sens ici, et
 * l'identifiant « opaque » est l'URL elle-meme, puisqu'elle est deja publique
 * chez le tiers. Aucun octet ne nous appartient, donc `delete()` n'efface que
 * la reference — c'est la limite assumee de ce fournisseur, et la raison pour
 * laquelle il n'est pas le defaut.
 */
export class ExternalEmbedProvider implements VideoProvider {
  readonly name = "embed" as const;

  async store(_upload: VideoUpload): Promise<StoredVideo> {
    void _upload;
    throw new UnsupportedVideoTypeError(
      "un hebergeur tiers ne recoit pas de fichier : seul un lien peut lui etre confie",
    );
  }

  /** Enregistre un lien tiers, apres normalisation. Rend `null` si non reconnu. */
  async storeLink(rawUrl: string): Promise<StoredVideo | null> {
    const embedUrl = toEmbedUrl(rawUrl);
    if (!embedUrl) return null;
    return { videoId: embedUrl, provider: this.name, state: "ready", bytes: null };
  }

  async status(videoId: string): Promise<VideoStatusReport> {
    return toEmbedUrl(videoId)
      ? { state: "ready", reason: null }
      : { state: "unavailable", reason: "Lien tiers non reconnu." };
  }

  async playbackUrl(videoId: string): Promise<VideoPlayback | null> {
    const embedUrl = toEmbedUrl(videoId);
    return embedUrl ? { kind: "embed", url: embedUrl } : null;
  }

  /** Aucun octet chez nous : il n'y a que la reference a retirer. */
  async delete(_videoId: string): Promise<boolean> {
    void _videoId;
    return false;
  }
}

/** Normalise une URL YouTube / Vimeo en URL de lecteur encapsulable. */
export function toEmbedUrl(raw: string): string | null {
  let url: URL;
  try {
    url = new URL(raw, "https://localhost");
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\./, "");

  if (host === "youtu.be") {
    const id = url.pathname.slice(1);
    return id ? `https://www.youtube.com/embed/${id}` : null;
  }

  if (host === "youtube.com" || host === "m.youtube.com") {
    if (url.pathname === "/watch") {
      const id = url.searchParams.get("v");
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    return url.pathname.startsWith("/embed/") ? url.toString() : null;
  }

  if (host === "vimeo.com") {
    const id = url.pathname.split("/").filter(Boolean)[0];
    return id ? `https://player.vimeo.com/video/${id}` : null;
  }

  if (host === "player.vimeo.com") return url.toString();

  return null;
}
