"use client";

import { formatTimestamp } from "@/lib/dates";
import type { VideoStatus } from "@/lib/vocabulary";
import { CircleCheck, CircleX, Clock } from "lucide-react";
import type { ComponentType } from "react";
import type { VideoModerationNoticeProps } from "./types";

const PRESENTATION: Record<
  VideoStatus,
  {
    frame: string;
    icon: string;
    glyph: ComponentType<{ className?: string }>;
    title: string;
    detail: string;
  }
> = {
  approved: {
    frame: "border-success-fg/25 bg-success",
    icon: "text-success-fg",
    glyph: CircleCheck,
    title: "Vidéo validée",
    detail: "Elle est visible des recruteurs sur votre profil public.",
  },
  rejected: {
    frame: "border-danger-fg/25 bg-danger",
    icon: "text-danger-fg",
    glyph: CircleX,
    title: "Vidéo refusée",
    detail:
      "Elle n’est pas diffusée. Corrigez le point ci-dessous puis envoyez une nouvelle vidéo.",
  },
  pending: {
    frame: "border-warning-fg/25 bg-warning",
    icon: "text-warning-fg",
    glyph: Clock,
    title: "Vidéo en attente de validation",
    detail:
      "Elle n’est visible que de vous et de l’administration tant qu’elle n’a pas été examinée.",
  },
};

export function VideoModerationNotice({ moderation }: VideoModerationNoticeProps) {
  const view = PRESENTATION[moderation.status];
  const Glyph = view.glyph;

  return (
    <div className={`mt-6 rounded-2xl border p-5 ${view.frame}`}>
      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl bg-white ${view.icon}`}
        >
          <Glyph className="size-5" />
        </span>
        <div>
          <h3 className="text-lg font-bold uppercase text-action">{view.title}</h3>
          <p className="text-sm text-ink-muted">{view.detail}</p>
        </div>
      </div>

      {moderation.status === "rejected" && moderation.reason ? (
        <p className="mt-4 rounded-xl bg-white p-4 text-sm text-action">
          <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
            Motif du refus
          </span>
          <br />
          {moderation.reason}
        </p>
      ) : null}

      {moderation.decidedAt ? (
        <p className="mt-3 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
          Décision du {formatTimestamp(moderation.decidedAt)}
          {moderation.decidedBy ? ` — ${moderation.decidedBy}` : ""}
        </p>
      ) : null}
    </div>
  );
}
