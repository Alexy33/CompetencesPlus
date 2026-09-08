import {
  VideoProviderUnavailableError,
  type StoredVideo,
  type VideoPlayback,
  type VideoProvider,
  type VideoStatusReport,
  type VideoUpload,
} from "./provider";

/**
 * Instance video PeerTube — pas encore provisionnee.
 *
 * Cette implementation n'appelle aucune API PeerTube : elle n'existe pas
 * encore. Son role est double :
 *
 *   1. prouver que l'abstraction tient : le meme contrat, une deuxieme fois,
 *      sans qu'une ligne des routes ou des pages ne change ;
 *   2. permettre d'eprouver le mode degrade pour de vrai, en basculant
 *      `VIDEO_PROVIDER=peertube`.
 *
 * Elle est deterministe : chaque appel echoue de la meme facon, sauf `status()`
 * qui rend `unavailable` plutot que de jeter — c'est ce que l'application lit
 * pour afficher son message a la place du lecteur.
 *
 * Le jour ou l'instance existe, cette classe devient le vrai client :
 * `store()` televerse via l'API, `status()` interroge l'etat de transcodage,
 * `playbackUrl()` rend l'URL d'embarquement, `delete()` appelle la suppression.
 * Rien d'autre ne bouge.
 */
export class FakePeerTubeProvider implements VideoProvider {
  readonly name = "peertube" as const;

  /** URL de l'instance, telle qu'elle sera configuree. Jamais contactee ici. */
  private readonly instanceUrl: string | null;

  constructor(instanceUrl?: string | null) {
    this.instanceUrl = instanceUrl?.trim() || null;
  }

  private unavailable(): VideoProviderUnavailableError {
    return new VideoProviderUnavailableError(
      this.name,
      this.instanceUrl
        ? `Instance ${this.instanceUrl} non provisionnee.`
        : "Instance non provisionnee (aucune URL configuree).",
    );
  }

  async store(_upload: VideoUpload): Promise<StoredVideo> {
    void _upload;
    throw this.unavailable();
  }

  /**
   * Ne jette pas : un hebergeur muet est un etat metier, pas une panne de
   * l'application. C'est ce qui permet a la fiche profil de rester servie.
   */
  async status(_videoId: string): Promise<VideoStatusReport> {
    void _videoId;
    return { state: "unavailable", reason: this.unavailable().message };
  }

  async playbackUrl(_videoId: string): Promise<VideoPlayback | null> {
    void _videoId;
    return null;
  }

  async delete(_videoId: string): Promise<boolean> {
    void _videoId;
    throw this.unavailable();
  }
}
