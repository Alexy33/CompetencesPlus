import { formatTimestamp } from "@/lib/dates";
import { FileVideo } from "lucide-react";
import type { ConsentStatusProps } from "./types";

export function ConsentStatus({ consent, videoPresent }: ConsentStatusProps) {
  return (
    <section className="mt-8 rounded-3xl border border-brand-300 bg-white p-6">
      <h2 className="text-lg font-bold uppercase text-ink">État de votre accord</h2>
      <dl className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl bg-panel p-4">
          <dt className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            État
          </dt>
          <dd className="mt-1 text-sm font-semibold text-ink">
            {consent.granted ? "Accordé" : consent.revokedAt ? "Retiré" : "Jamais donné"}
          </dd>
        </div>
        <div className="rounded-xl bg-panel p-4">
          <dt className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            Accordé le
          </dt>
          <dd className="mt-1 text-sm font-semibold text-ink">
            {formatTimestamp(consent.grantedAt)}
          </dd>
        </div>
        <div className="rounded-xl bg-panel p-4">
          <dt className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            Version acceptée
          </dt>
          <dd className="mt-1 text-sm font-semibold text-ink">{consent.version ?? "—"}</dd>
        </div>
      </dl>

      {consent.revokedAt ? (
        <p className="mt-4 rounded-xl bg-danger p-3 font-mono text-[11px] uppercase tracking-wider text-danger-fg">
          Retiré le {formatTimestamp(consent.revokedAt)} — vidéo supprimée du stockage
        </p>
      ) : null}

      <p className="mt-4 inline-flex items-center gap-2 text-sm text-ink-muted">
        <FileVideo className="size-4" />
        {videoPresent
          ? "Une vidéo est actuellement hébergée sur votre profil."
          : "Aucune vidéo n’est hébergée sur votre profil."}
      </p>
    </section>
  );
}
