import { Loader2 } from "lucide-react";
import type { ConsentNoticeTextProps } from "./types";

export function ConsentNoticeText({ consent, notice }: ConsentNoticeTextProps) {
  return (
    <section className="mt-6 rounded-3xl border border-brand-300 bg-white p-6">
      <h2 className="text-lg font-bold uppercase text-ink">Texte soumis à votre accord</h2>
      {notice ? (
        <>
          <p className="mt-2 font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted">
            Version en vigueur : {notice.version}
          </p>
          <blockquote className="mt-4 rounded-2xl border-l-4 border-brand bg-panel p-5 text-sm leading-relaxed text-ink">
            {notice.text}
          </blockquote>
        </>
      ) : (
        <p className="mt-4 inline-flex items-center gap-2 text-sm text-ink-muted">
          <Loader2 className="size-4 animate-spin" />
          Chargement du texte en vigueur…
        </p>
      )}

      {consent.version && notice && consent.version !== notice.version ? (
        <p className="mt-4 rounded-xl bg-warning-soft p-3 text-xs leading-relaxed text-warning-ink">
          Vous avez accepté la version {consent.version}, antérieure au texte ci-dessus. Redonner
          votre consentement enregistrera la version {notice.version}.
        </p>
      ) : null}
    </section>
  );
}
