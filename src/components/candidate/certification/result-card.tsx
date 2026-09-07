"use client";

import { BadgeCheck, RotateCcw } from "lucide-react";

import { Action, ActionLink } from "@/components/common/action";
import type { CertificationResult } from "./types";

export function ResultCard({
  result,
  busy,
  onRestart,
}: {
  result: CertificationResult;
  busy: boolean;
  onRestart: () => void;
}) {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-5 py-12 md:px-10">
      <section className="w-full px-2 py-8 text-center md:px-8 md:py-12">
        <div
          className={`mx-auto flex size-16 items-center justify-center rounded-2xl ${
            result.passed ? "bg-success text-success-fg" : "bg-warning text-warning-fg"
          }`}
        >
          <BadgeCheck aria-hidden="true" className="size-8" />
        </div>

        <p className="mt-6 font-mono text-xs font-semibold uppercase tracking-[0.16em] text-ink-soft">
          Résultat de certification
        </p>

        <p className="mt-5 text-7xl font-extrabold tracking-tight text-brand">
          {result.score}
          <span className="text-2xl text-ink-soft"> / 100</span>
        </p>

        <h1 className="mt-6 text-3xl font-extrabold uppercase text-ink md:text-4xl">
          {result.passed ? "Certification obtenue !" : "Continuez vos efforts"}
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
          {result.passed
            ? "Votre badge JEB est maintenant visible sur votre profil public."
            : `Le seuil est de ${result.threshold}/100. Vous pouvez repasser le questionnaire sans délai.`}
        </p>

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ActionLink href="/candidate" size="lg" className="rounded-2xl">
            Retour à mon espace
          </ActionLink>
          <Action tone="outline" size="lg" className="rounded-2xl" onClick={onRestart} disabled={busy}>
            <RotateCcw aria-hidden="true" className="size-4" />
            Repasser
          </Action>
        </div>
      </section>
    </main>
  );
}
