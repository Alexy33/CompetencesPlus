"use client";

import { ActionLink } from "@/components/common/action";
import { Surface, SurfaceHeading } from "@/components/common/surface";
import { AlertTriangle, BadgeCheck } from "lucide-react";
import type { CertificationPanelProps, CertificationSummary } from "./types";

function summaryText(certification: CertificationSummary | null): string {
  if (certification?.status === "in_progress") {
    return `Questionnaire en cours : ${certification.answered}/${certification.questionCount} réponses.`;
  }
  if (certification?.passed)
    return "Badge de certification obtenu et visible sur votre profil public.";
  return "Passez le questionnaire pour certifier vos aptitudes professionnelles.";
}

function callToAction(certification: CertificationSummary | null): string {
  if (certification?.outdated) return "Mettre à jour ma certification";
  if (certification?.status === "in_progress") return "Reprendre le questionnaire";
  if (certification?.status === "submitted") return "Voir mon résultat";
  return "Commencer le questionnaire";
}

export function CertificationPanel({ certification, fallbackScore }: CertificationPanelProps) {
  const score = certification?.score ?? fallbackScore;

  return (
    <Surface tone="raised">
      <SurfaceHeading title="Badge de certification" icon={<BadgeCheck className="size-5" />} />

      <p className="mt-5 text-4xl font-extrabold text-brand">
        {score ?? "—"}
        <span className="text-lg text-ink-soft"> / 100</span>
      </p>

      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{summaryText(certification)}</p>

      {certification?.outdated ? (
        <div
          role="status"
          className="mt-4 flex gap-2 rounded-xl bg-warning/15 p-3 text-sm text-warning-fg"
        >
          <AlertTriangle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          <p className="leading-relaxed">
            <strong>Certification à mettre à jour.</strong> Vous l’avez obtenue avec la version{" "}
            {certification.questionnaireVersion} du questionnaire, or la version{" "}
            {certification.currentQuestionnaireVersion} est désormais en vigueur. Vous ne répondrez
            qu’aux questions qui ont changé. Votre badge reste visible des recruteurs en attendant.
          </p>
        </div>
      ) : null}

      <ActionLink href="/candidate/certification" block className="mt-5">
        {callToAction(certification)}
      </ActionLink>
    </Surface>
  );
}
