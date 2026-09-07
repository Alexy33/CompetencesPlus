import { PlayCircle } from "lucide-react";
import type { ReactNode } from "react";

import { resolveVideoSource } from "./video-source";

export { toEmbedUrl } from "./video-source";

function VideoFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand-300 bg-panel">
      {children}
    </div>
  );
}

function VideoPlaceholder({ children }: { children: ReactNode }) {
  return (
    <VideoFrame>
      <div className="flex aspect-video w-full flex-col items-center justify-center bg-brand-100 px-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-200 text-brand-800">
          <PlayCircle aria-hidden="true" className="size-7 stroke-[1.6]" />
        </div>
        {children}
      </div>
    </VideoFrame>
  );
}

export function ProfileVideo({ videoUrl, name }: { videoUrl: string | null; name: string }) {
  const source = resolveVideoSource(videoUrl);

  if (source.kind === "none") {
    return (
      <VideoPlaceholder>
        <p className="mt-4 font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-800">
          Aucune présentation vidéo
        </p>
      </VideoPlaceholder>
    );
  }

  if (source.kind === "upload") {
    return (
      <VideoFrame>
        <video
          src={source.src}
          controls
          preload="metadata"
          playsInline
          className="aspect-video w-full"
        />
      </VideoFrame>
    );
  }

  if (source.kind === "embed") {
    return (
      <VideoFrame>
        <iframe
          src={source.src}
          title={`Présentation vidéo de ${name}`}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full"
        />
      </VideoFrame>
    );
  }

  return (
    <VideoPlaceholder>
      <p className="mt-5 max-w-md break-all font-mono text-xs text-ink-soft">{source.src}</p>
      <p className="mt-2 font-mono text-xs font-semibold uppercase tracking-wider text-ink-soft">
        Format d&apos;hébergement non pris en charge
      </p>
    </VideoPlaceholder>
  );
}
