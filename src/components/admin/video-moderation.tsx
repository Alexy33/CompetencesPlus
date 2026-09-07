"use client";

import { useState } from "react";
import { Check, Loader2, ShieldQuestion, X } from "lucide-react";

import { ProfileVideo } from "@/components/catalogue/profile-video";
import { formatTimestamp } from "@/lib/dates";
import type { ProfileStatus, VideoStatus } from "@/lib/vocabulary";

export type VideoRow = {
  profileId: string;
  name: string;
  title: string;
  videoUrl: string | null;
  profileStatus: ProfileStatus;
  videoStatus: VideoStatus;
  reason: string | null;
  decidedBy: string | null;
  decidedAt: string | null;
  submittedAt: string;
};

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

export function VideoModeration({
  rows,
  onDecide,
}: {
  rows: VideoRow[];
  onDecide: (profileId: string, decision: "approved" | "rejected", reason: string) => Promise<void>;
}) {
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
            Une vidéo n&apos;est diffusée qu&apos;après validation. Un refus exige un motif, communiqué au candidat.
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
            <article key={row.profileId} className="grid gap-5 rounded-2xl bg-white p-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)]">
              <ProfileVideo videoUrl={row.videoUrl} name={row.name} />

              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-bold text-action">{row.name}</h3>
                  <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${TONE[row.videoStatus]}`}>
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
                      Décision — {row.decidedBy ?? "administrateur supprimé"}, le {formatTimestamp(row.decidedAt)}
                    </p>
                    {row.reason && <p className="mt-1">Motif : {row.reason}</p>}
                  </div>
                )}

                <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-ink-soft">
                  Motif du refus
                  <textarea
                    value={reasons[row.profileId] ?? ""}
                    onChange={(e) => setReasons((current) => ({ ...current, [row.profileId]: e.target.value }))}
                    placeholder="Ce que le candidat doit corriger."
                    className="mt-2 min-h-20 w-full resize-y rounded-xl border border-brand/20 bg-white p-3 text-sm font-normal normal-case tracking-normal text-action outline-none focus:border-brand"
                  />
                </label>

                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => void decide(row, "approved")}
                    disabled={busy !== null || row.videoStatus === "approved"}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-success px-3 py-2 text-xs font-semibold text-success-fg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {busy === row.profileId ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    Valider
                  </button>
                  <button
                    type="button"
                    onClick={() => void decide(row, "rejected")}
                    disabled={busy !== null}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-danger px-3 py-2 text-xs font-semibold text-danger-fg disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <X className="size-3.5" /> Refuser
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
