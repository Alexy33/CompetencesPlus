"use client";

import { ArrowLeft, Loader2, ShieldCheck, ShieldOff, Trash2 } from "lucide-react";
import Link from "next/link";
import { ConsentNoticeText } from "./consent-notice-text";
import { ConsentStatus } from "./consent-status";
import type { ConsentManagerProps } from "./types";
import { useVideoConsent } from "./use-video-consent";

export function ConsentManager({ initialConsent, hasVideo }: ConsentManagerProps) {
  const { consent, videoPresent, notice, busy, message, submit } = useVideoConsent(
    initialConsent,
    hasVideo,
  );

  return (
    <main className="min-h-screen bg-canvas px-6 py-10 text-action md:px-10">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/candidate"
          className="inline-flex items-center gap-2 text-sm font-semibold text-ink-muted hover:text-brand"
        >
          <ArrowLeft className="size-4" />
          Retour à mon espace
        </Link>

        <header className="mt-6 flex items-center gap-4">
          <span
            className={`flex size-14 items-center justify-center rounded-2xl ${consent.granted ? "bg-success text-success-fg" : "bg-danger text-danger-fg"}`}
          >
            {consent.granted ? (
              <ShieldCheck className="size-7" />
            ) : (
              <ShieldOff className="size-7" />
            )}
          </span>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-brand">
              Consentement à la diffusion
            </h1>
            <p className="mt-1 text-sm text-ink-muted">
              {consent.granted
                ? "Votre accord est en cours : votre vidéo peut être diffusée auprès des recruteurs inscrits."
                : "Aucun accord en cours : aucune vidéo ne peut être hébergée ni diffusée."}
            </p>
          </div>
        </header>

        <ConsentStatus consent={consent} videoPresent={videoPresent} />

        <ConsentNoticeText consent={consent} notice={notice} />

        <section className="mt-6 rounded-3xl border border-brand-300 bg-white p-6">
          <h2 className="text-lg font-bold uppercase text-ink">Ce que change votre décision</h2>
          <ul className="mt-4 space-y-3 text-sm leading-relaxed text-ink-muted">
            <li className="flex gap-3">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-success-fg" />
              <span>
                <strong className="text-ink">Donner votre consentement</strong> autorise
                l’hébergement et la diffusion de votre vidéo de présentation, image et voix
                comprises, auprès des recruteurs inscrits. La date et la version acceptée sont
                enregistrées.
              </span>
            </li>
            <li className="flex gap-3">
              <Trash2 className="mt-0.5 size-4 shrink-0 text-danger-fg" />
              <span>
                <strong className="text-ink">Retirer votre consentement</strong> supprime
                définitivement le fichier vidéo du stockage. Votre profil reste en ligne, sans
                vidéo. La date de l’accord et la version acceptée sont conservées comme trace de ce
                qui avait été consenti.
              </span>
            </li>
          </ul>

          {message ? (
            <p className="mt-5 rounded-xl bg-panel p-3 text-sm text-ink">{message}</p>
          ) : null}

          {consent.granted ? (
            <button
              type="button"
              onClick={() => void submit(false)}
              disabled={busy}
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-danger-fg px-6 text-sm font-semibold text-white hover:bg-danger-deep disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldOff className="size-4" />
              )}
              Retirer mon consentement et supprimer ma vidéo
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void submit(true)}
              disabled={busy || !notice}
              className="mt-6 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-action px-6 text-sm font-semibold text-white hover:bg-action-hover disabled:opacity-60"
            >
              {busy ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <ShieldCheck className="size-4" />
              )}
              {consent.revokedAt ? "Redonner mon consentement" : "Donner mon consentement"}
            </button>
          )}
        </section>
      </div>
    </main>
  );
}
