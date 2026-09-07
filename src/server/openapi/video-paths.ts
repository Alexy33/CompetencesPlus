const myProfile = {
  description: "Profil du candidat, bloc `video` mis à jour.",
  content: { "application/json": { schema: { $ref: "#/components/schemas/MyProfile" } } },
};

const apiError = (description: string) => ({
  description,
  content: { "application/json": { schema: { $ref: "#/components/schemas/ApiError" } } },
});

export const videoPaths: Record<string, Record<string, unknown>> = {
  "/api/me/profile/video": {
    put: {
      tags: ["Espace demandeur"],
      summary: "Téléverser ma vidéo de présentation",
      operationId: "putMeProfileVideo",
      description: [
        "Upload direct (CDC §3.2). Le corps de la requête est le fichier lui-même ;",
        "`Content-Type` porte son type. Plafond : **100 Mo**, appliqué en streaming",
        "(la requête n'est jamais bufferisée entièrement).",
        "",
        "Le fichier est confié à l'hébergeur actif (`VIDEO_PROVIDER`), qui rend un",
        "**identifiant opaque**. Après succès, `video.state` vaut `ready` — ou",
        "`processing` si l'hébergeur transcode encore : un dépôt réussi ne veut pas",
        "dire lisible. `video.playback.url` porte alors `GET /api/videos/{videoId}`.",
      ].join("\n"),
      security: [{ sessionCookie: [] }],
      requestBody: {
        required: true,
        content: {
          "video/mp4": { schema: { type: "string", format: "binary" } },
          "video/webm": { schema: { type: "string", format: "binary" } },
          "video/ogg": { schema: { type: "string", format: "binary" } },
          "video/quicktime": { schema: { type: "string", format: "binary" } },
        },
      },
      responses: {
        "200": myProfile,
        "400": apiError("Corps de requête vide."),
        "401": apiError("Aucune session."),
        "403": apiError("Session valide mais rôle ≠ candidate."),
        "404": apiError("Aucun profil rattaché au compte."),
        "422": apiError("Fichier > 100 Mo, ou type non pris en charge (Content-Type)."),
        "503": apiError("L'hébergeur vidéo configuré ne répond pas."),
      },
    },
    delete: {
      tags: ["Espace demandeur"],
      summary: "Retirer ma vidéo de présentation",
      operationId: "deleteMeProfileVideo",
      description: [
        "Passe par `VideoProvider.delete()` : les **octets** disparaissent du",
        "stockage, puis la référence est retirée de la base. Même chemin que le",
        "retrait du consentement. Idempotent.",
      ].join("\n"),
      security: [{ sessionCookie: [] }],
      responses: {
        "200": myProfile,
        "401": apiError("Aucune session."),
        "403": apiError("Session valide mais rôle ≠ candidate."),
        "404": apiError("Aucun profil rattaché au compte."),
      },
    },
  },

  "/api/videos/{videoId}": {
    get: {
      tags: ["Catalogue"],
      summary: "Lire la vidéo d'un profil",
      operationId: "getVideosById",
      description: [
        "**Seule** porte d'entrée vers les octets d'une vidéo hébergée par le",
        "dispositif. Les fichiers vivent hors du répertoire web : aucune URL",
        "physique, aucun listing, aucun chemin devinable.",
        "",
        "`videoId` est l'identifiant **opaque** rendu par l'hébergeur — il ne",
        "révèle ni le profil, ni le nom du fichier. La route l'utilise pour",
        "retrouver le profil associé, puis applique les mêmes droits que la fiche.",
        "",
        "Gère l'en-tête `Range` : réponse **206 Partial Content** avec",
        "`Content-Range` quand le lecteur cherche dans la timeline (CDC §3.2).",
        "",
        "Un profil non `published`, ou dont la vidéo n'est pas validée par la",
        "modération (R.2), n'est servi qu'à son titulaire ou à un admin : la",
        "réponse est **404** pour tout autre appelant, URL directe comprise.",
      ].join("\n"),
      parameters: [
        {
          name: "videoId",
          in: "path",
          required: true,
          description: "Identifiant opaque de la vidéo (`profile.video_id`).",
          schema: { type: "string" },
        },
        {
          name: "Range",
          in: "header",
          required: false,
          description: "Ex. `bytes=0-1048575`. Déclenche une réponse 206.",
          schema: { type: "string" },
        },
      ],
      responses: {
        "200": {
          description: "Fichier complet.",
          headers: {
            "Accept-Ranges": { schema: { type: "string" }, description: "`bytes`" },
            "Content-Length": { schema: { type: "integer" } },
          },
          content: {
            "video/mp4": { schema: { type: "string", format: "binary" } },
            "video/webm": { schema: { type: "string", format: "binary" } },
            "video/ogg": { schema: { type: "string", format: "binary" } },
            "video/quicktime": { schema: { type: "string", format: "binary" } },
          },
        },
        "206": {
          description: "Fragment demandé via `Range`.",
          headers: {
            "Content-Range": { schema: { type: "string" }, description: "Ex. `bytes 0-1048575/5242880`" },
            "Accept-Ranges": { schema: { type: "string" } },
            "Content-Length": { schema: { type: "integer" } },
          },
          content: { "video/mp4": { schema: { type: "string", format: "binary" } } },
        },
        "404": apiError("Identifiant inconnu, vidéo absente, ou profil non visible."),
        "409": apiError("Vidéo déposée mais encore en cours de traitement."),
        "503": apiError("L'hébergeur vidéo configuré ne répond pas."),
      },
    },
  },
};
