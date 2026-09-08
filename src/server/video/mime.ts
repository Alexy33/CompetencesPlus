/** Types acceptes a l'entree, et extension de fichier associee. */
const EXTENSION_BY_MIME: Record<string, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
  "video/ogg": "ogv",
  "video/quicktime": "mov",
};

const MIME_BY_EXTENSION: Record<string, string> = {
  mp4: "video/mp4",
  webm: "video/webm",
  ogv: "video/ogg",
  ogg: "video/ogg",
  mov: "video/quicktime",
  m4v: "video/mp4",
};

/** Extensions qu'un fichier stocke peut porter. Sert a le retrouver sans listing. */
export const STORED_EXTENSIONS = Object.keys(MIME_BY_EXTENSION);

export function extensionForMime(mime: string | null | undefined): string | null {
  if (!mime) return null;
  return EXTENSION_BY_MIME[mime.split(";")[0].trim().toLowerCase()] ?? null;
}

export function mimeForExtension(extension: string): string {
  return MIME_BY_EXTENSION[extension.toLowerCase()] ?? "application/octet-stream";
}
