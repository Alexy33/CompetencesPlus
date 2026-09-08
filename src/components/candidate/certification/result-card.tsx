"use client";

import { AlertTriangle, BadgeCheck, RotateCcw } from "lucide-react";

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
          {result.passed ? "Badge de certification obtenu !" : "Continuez vos efforts"}
        </h1>

        <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-soft">
          {result.passed
            ? "Votre badge de certification est maintenant visible sur votre profil public."
            : `Le seuil est de ${result.threshold}/100. Vous pouvez repasser le questionnaire sans délai.`}
        </p>

        <p className="mt-4 font-mono text-xs text-ink-soft">
          Questionnaire version {result.questionnaireVersion}
        </p>

        {result.outdated ? (
          <div
            role="status"
            className="mx-auto mt-5 flex max-w-xl gap-2 rounded-xl bg-warning/15 p-4 text-left text-sm text-warning-fg"
          >
            <AlertTriangle aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <p className="leading-relaxed">
              <strong>Vous devez repasser le questionnaire.</strong> Ce résultat porte sur la
              version {result.questionnaireVersion}, or la version{" "}
              {result.currentQuestionnaireVersion} est désormais en vigueur. Votre badge reste
              visible des recruteurs jusqu’à votre nouvelle passation.
            </p>
          </div>
        ) : null}

        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
          <ActionLink
            href="/candidate"
            size="lg"
            tone={result.outdated ? "outline" : "action"}
            className="rounded-2xl"
          >
            Retour à mon espace
          </ActionLink>
          <Action
            tone={result.outdated ? "action" : "outline"}
            size="lg"
            className="rounded-2xl"
            onClick={onRestart}
            disabled={busy}
          >
            <RotateCcw aria-hidden="true" className="size-4" />
            {result.outdated ? "Repasser en version " + result.currentQuestionnaireVersion : "Repasser"}
          </Action>
        </div>
      </section>
    </main>
  );
}
