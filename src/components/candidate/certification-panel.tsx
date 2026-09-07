"use client";

import { BadgeCheck } from "lucide-react";

import { ActionLink } from "@/components/common/action";
import { Surface, SurfaceHeading } from "@/components/common/surface";
import type { CertificationSummary } from "./types";

function summaryText(certification: CertificationSummary | null): string {
  if (certification?.status === "in_progress") {
    return `Questionnaire en cours : ${certification.answered}/${certification.questionCount} réponses.`;
  }
  if (certification?.passed) return "Badge obtenu et visible sur votre profil public.";
  return "Passez le questionnaire pour certifier vos aptitudes professionnelles.";
}

function callToAction(certification: CertificationSummary | null): string {
  if (certification?.status === "in_progress") return "Reprendre le questionnaire";
  if (certification?.status === "submitted") return "Voir mon résultat";
  return "Commencer le questionnaire";
}

export function CertificationPanel({
  certification,
  fallbackScore,
}: {
  certification: CertificationSummary | null;
  fallbackScore: number | null;
}) {
  const score = certification?.score ?? fallbackScore;

  return (
    <Surface tone="raised">
      <SurfaceHeading title="Certification JEB" icon={<BadgeCheck className="size-5" />} />

      <p className="mt-5 text-4xl font-extrabold text-brand">
        {score ?? "—"}
        <span className="text-lg text-ink-soft"> / 100</span>
      </p>

      <p className="mt-3 text-sm leading-relaxed text-ink-soft">{summaryText(certification)}</p>

      <ActionLink href="/candidate/certification" block className="mt-5">
        {callToAction(certification)}
      </ActionLink>
    </Surface>
  );
}
