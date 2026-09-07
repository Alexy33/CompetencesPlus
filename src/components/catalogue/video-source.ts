const UPLOAD_PREFIX = "/api/videos/";

export type VideoSource =
  | { kind: "none" }
  | { kind: "upload"; src: string }
  | { kind: "embed"; src: string }
  | { kind: "unsupported"; src: string };

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

export function resolveVideoSource(videoUrl: string | null): VideoSource {
  if (!videoUrl) return { kind: "none" };
  if (videoUrl.startsWith(UPLOAD_PREFIX)) return { kind: "upload", src: videoUrl };

  const embed = toEmbedUrl(videoUrl);
  return embed ? { kind: "embed", src: embed } : { kind: "unsupported", src: videoUrl };
}
