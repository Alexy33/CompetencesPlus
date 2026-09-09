"use client";

import { ShieldQuestion } from "lucide-react";
import { useState } from "react";
import type { VideoModerationProps, VideoRow } from "./types";
import { VideoModerationCard } from "./video-moderation-card";

export function VideoModeration({ rows, onDecide }: VideoModerationProps) {
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function decide(row: VideoRow, decision: "approved" | "rejected") {
    const reason = (reasons[row.profileId] ?? "").trim();
    if (decision === "rejected" && !reason) {
      setError(`Indiquez le motif du refus de la vidéo de ${row.name} : il lui sera communiqué.`);
      return;
    }
    setError(null);
    setBusy(row.profileId);
    await onDecide(row.profileId, decision, reason);
    setReasons((current) => ({ ...current, [row.profileId]: "" }));
    setBusy(null);
  }

  return (
    <section className="mt-7 rounded-3xl bg-canvas p-6 shadow-raised-2xl md:p-8">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-warning text-warning-fg">
          <ShieldQuestion className="size-5" />
        </span>
        <div>
          <h2 className="text-2xl font-bold uppercase text-action">Modération des vidéos</h2>
          <p className="text-sm text-ink-soft">
            Une vidéo n&apos;est diffusée qu&apos;après validation. Un refus exige un motif,
            communiqué au candidat.
          </p>
        </div>
      </div>

      {error && (
        <p role="alert" className="mt-5 rounded-xl bg-danger px-4 py-3 text-sm text-danger-fg">
          {error}
        </p>
      )}

      {rows.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-white p-5 text-sm text-ink-soft">
          Aucune vidéo déposée pour le moment.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {rows.map((row) => (
            <VideoModerationCard
              key={row.profileId}
              row={row}
              reason={reasons[row.profileId] ?? ""}
              busy={busy}
              onReasonChange={(reason) =>
                setReasons((current) => ({ ...current, [row.profileId]: reason }))
              }
              onDecide={(decision) => decide(row, decision)}
            />
          ))}
        </div>
      )}
    </section>
  );
}
