"use client";

import { ProfileVideo } from "@/components/catalogue/profile-video";
import { formatTimestamp } from "@/lib/dates";
import type { VideoStatus } from "@/lib/vocabulary";
import { Check, Loader2, X } from "lucide-react";
import type { VideoModerationCardProps } from "./types";

const LABEL: Record<VideoStatus, string> = {
  pending: "En attente",
  approved: "Validée",
  rejected: "Refusée",
};

const TONE: Record<VideoStatus, string> = {
  pending: "bg-warning text-warning-fg",
  approved: "bg-success text-success-fg",
  rejected: "bg-danger text-danger-fg",
};

export function VideoModerationCard({
  row,
  reason,
  busy,
  onReasonChange,
  onDecide,
}: VideoModerationCardProps) {
  return (
    <article className="grid gap-5 rounded-2xl bg-white p-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
      <ProfileVideo video={row.video} name={row.name} />

      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-action">{row.name}</h3>
          <span
            className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${TONE[row.videoStatus]}`}
          >
            {LABEL[row.videoStatus]}
          </span>
        </div>
        <p className="mt-1 text-sm text-ink-soft">{row.title}</p>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-wider text-ink-soft">
          Déposée le {formatTimestamp(row.submittedAt)}
        </p>

        {row.decidedAt && (
          <div className="mt-3 rounded-xl bg-panel p-3 text-xs text-ink-muted">
            <p className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
              Décision — {row.decidedBy ?? "administrateur supprimé"}, le{" "}
              {formatTimestamp(row.decidedAt)}
            </p>
            {row.reason && <p className="mt-1">Motif : {row.reason}</p>}
          </div>
        )}

        <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
          Motif du refus
          <textarea
            value={reason}
            onChange={(e) => onReasonChange(e.target.value)}
            placeholder="Ce que le candidat doit corriger."
            className="mt-2 min-h-20 w-full resize-y rounded-xl border border-brand/20 bg-white p-3 text-sm font-normal normal-case tracking-normal text-action outline-none focus:border-brand"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void onDecide("approved")}
            disabled={busy !== null || row.videoStatus === "approved"}
            className="inline-flex items-center gap-1.5 rounded-xl bg-success px-3 py-2 text-xs font-semibold text-success-fg disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === row.profileId ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : (
              <Check className="size-3.5" />
            )}
            Valider
          </button>
          <button
            type="button"
            onClick={() => void onDecide("rejected")}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-xl bg-danger px-3 py-2 text-xs font-semibold text-danger-fg disabled:cursor-not-allowed disabled:opacity-50"
          >
            <X className="size-3.5" /> Refuser
          </button>
        </div>
      </div>
    </article>
  );
}
