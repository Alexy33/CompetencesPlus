import { AlertTriangle, Loader2, PlayCircle } from "lucide-react";
import type { ReactNode } from "react";

import { VIDEO_NONE_MESSAGE } from "@/lib/vocabulary";
import type { VideoView } from "@/server/video/presentation";

/**
 * Lecteur de la video d'un profil.
 *
 * Le composant ne sait pas d'ou viennent les octets : il lit l'etat rendu par
 * l'hebergeur (`VideoView`). Quand il n'y a rien a lire — traitement en cours,
 * hebergeur muet — il affiche le message a la place du lecteur. La fiche,
 * elle, reste entiere.
 */

function VideoFrame({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-brand-300 bg-panel">
      {children}
    </div>
  );
}

function VideoPlaceholder({
  icon,
  children,
}: {
  icon: ReactNode;
  children: ReactNode;
}) {
  return (
    <VideoFrame>
      <div className="flex aspect-video w-full flex-col items-center justify-center bg-brand-100 px-6 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-brand-200 text-brand-800">
          {icon}
        </div>
        {children}
      </div>
    </VideoFrame>
  );
}

function PlaceholderText({ children }: { children: ReactNode }) {
  return (
    <p className="mt-4 max-w-md font-mono text-[11px] font-semibold uppercase tracking-[0.12em] text-brand-800">
      {children}
    </p>
  );
}

export function ProfileVideo({ video, name }: { video: VideoView; name: string }) {
  if (video.state === "processing") {
    return (
      <VideoPlaceholder
        icon={<Loader2 aria-hidden="true" className="size-7 animate-spin stroke-[1.6]" />}
      >
        <PlaceholderText>{video.message}</PlaceholderText>
      </VideoPlaceholder>
    );
  }

  if (video.state === "unavailable") {
    return (
      <VideoPlaceholder
        icon={<AlertTriangle aria-hidden="true" className="size-7 stroke-[1.6]" />}
      >
        <PlaceholderText>{video.message}</PlaceholderText>
      </VideoPlaceholder>
    );
  }

  if (video.state === "ready" && video.playback) {
    if (video.playback.kind === "stream") {
      return (
        <VideoFrame>
          <video
            src={video.playback.url}
            controls
            preload="metadata"
            playsInline
            className="aspect-video w-full"
          />
        </VideoFrame>
      );
    }

    return (
      <VideoFrame>
        <iframe
          src={video.playback.url}
          title={`Présentation vidéo de ${name}`}
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="aspect-video w-full"
        />
      </VideoFrame>
    );
  }

  return (
    <VideoPlaceholder icon={<PlayCircle aria-hidden="true" className="size-7 stroke-[1.6]" />}>
      <PlaceholderText>{VIDEO_NONE_MESSAGE}</PlaceholderText>
    </VideoPlaceholder>
  );
}
