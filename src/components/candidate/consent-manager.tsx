"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileVideo, Loader2, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";

import { formatTimestamp } from "@/lib/dates";
import type { VideoConsentView } from "@/server/services/profiles";

type ConsentNotice = { version: string; text: string };
type Props = { initialConsent: VideoConsentView; hasVideo: boolean };

export function ConsentManager({ initialConsent, hasVideo }: Props) {
  const [consent, setConsent] = useState(initialConsent);
  const [videoPresent, setVideoPresent] = useState(hasVideo);
  const [notice, setNotice] = useState<ConsentNotice | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/me/profile/video/consent").then(async (r) => r.ok && setNotice(await r.json()));
  }, []);

  async function submit(granted: boolean) {
    if (!granted && !window.confirm(
      "Retirer votre consentement supprime définitivement votre vidéo du stockage. Continuer ?",
    )) return;

    setBusy(true); setMessage(null);
    const response = await fetch("/api/me/profile/video/consent", { method: granted ? "POST" : "DELETE" });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data?.error?.message ?? "Impossible de modifier le consentement.");
      setBusy(false);
      return;
    }
    setConsent(data as VideoConsentView);

    if (!granted) setVideoPresent(false);
    setMessage(granted
      ? "Consentement enregistré."
      : "Consentement retiré : la vidéo a été supprimée du stockage.");
    setBusy(false);
  }

  return (
    <main className="min-h-screen bg-canvas px-6 py-10 text-action md:px-10">
      <div className="mx-auto max-w-3xl">
        <Link href="/candidate" className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-brand">
          <ArrowLeft className="size-4" />
          Retour à mon espace
        </Link>

        <header className="mt-6 flex items-center gap-4">
          <span className={`flex size-14 items-center justify-center rounded-2xl ${consent.granted ? "bg-success text-success-fg" : "bg-danger text-danger-fg"}`}>
            {consent.granted ? <ShieldCheck className="size-7" /> : <ShieldOff className="size-7" />}
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-brand">Consentement à la diffusion</h1>
            <p className="mt-1 text-sm text-ink-muted">
              {consent.granted
                ? "Votre accord est en cours : votre vidéo peut être diffusée auprès des recruteurs inscrits."
                : "Aucun accord en cours : aucune vidéo ne peut être hébergée ni diffusée."}
            </p>
          </div>
        </header>

        <section className="mt-8 rounded-3xl border border-brand-300 bg-white p-6">
          <h2 className="text-lg font-bold uppercase text-ink">État de votre accord</h2>
          <dl className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl bg-panel p-4">
              <dt className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted">État</dt>
              <dd className="mt-1 text-sm font-semibold text-ink">
                {consent.granted ? "Accordé" : consent.revokedAt ? "Retiré" : "Jamais donné"}
              </dd>
            </div>
            <div className="rounded-xl bg-panel p-4">
              <dt className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Accordé le</dt>
              <dd className="mt-1 text-sm font-semibold text-ink">{formatTimestamp(consent.grantedAt)}</dd>
            </div>
            <div className="rounded-xl bg-panel p-4">
              <dt className="font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-muted">Version acceptée</dt>
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
            {videoPresent ? "Une vidéo est actuellement hébergée sur votre profil." : "Aucune vidéo n’est hébergée sur votre profil."}
          </p>
        </section>

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
              Vous avez accepté la version {consent.version}, antérieure au texte ci-dessus.
              Redonner votre consentement enregistrera la version {notice.version}.
            </p>
          ) : null}
        </section>

        <section className="mt-6 rounded-3xl border border-brand-300 bg-white p-6">
          <h2 className="text-lg font-bold uppercase text-ink">Ce que change votre décision</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-muted">
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success-fg" />
              <span>
                <strong className="text-ink">Donner votre consentement</strong> autorise l’hébergement et la
                diffusion de votre vidéo de présentation, image et voix comprises, auprès des recruteurs inscrits.
                La date et la version acceptée sont enregistrées.
              </span>
            </li>
            <li className="flex gap-3">
              <Trash2 className="mt-0.5 size-4 shrink-0 text-danger-fg" />
              <span>
                <strong className="text-ink">Retirer votre consentement</strong> supprime définitivement le
                fichier vidéo du stockage. Votre profil reste en ligne, sans vidéo. La date de l’accord et la version
                acceptée sont conservées comme trace de ce qui avait été consenti.
              </span>
            </li>
          </ul>

          {message ? (
            <p className="mt-5 rounded-xl bg-panel p-3 text-sm text-ink">{message}</p>
          ) : null}

          {consent.granted ? (
            <button type="button" onClick={() => void submit(false)} disabled={busy}
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-danger-fg px-6 text-sm font-semibold text-white hover:bg-danger-deep disabled:opacity-60">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldOff className="size-4" />}
              Retirer mon consentement et supprimer ma vidéo
            </button>
          ) : (
            <button type="button" onClick={() => void submit(true)} disabled={busy || !notice}
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-action px-6 text-sm font-semibold text-white hover:bg-action-hover disabled:opacity-60">
              {busy ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
              {consent.revokedAt ? "Redonner mon consentement" : "Donner mon consentement"}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
