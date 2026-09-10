import { BadgeCheck } from "lucide-react";
import type { ProfileCertificationProps } from "./types";

export function ProfileCertification({ profile, threshold }: ProfileCertificationProps) {
  return profile.certified ? (
    <div className="rounded-3xl bg-brand p-7 text-white">
      <div className="flex items-center gap-2">
        <BadgeCheck aria-hidden="true" className="size-5 stroke-[2]" />
        <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/90">
          Badge de certification
        </span>
      </div>
      <p className="mt-4 text-6xl font-bold leading-none tracking-tight">
        {profile.score}
        <span className="text-2xl font-bold text-white/70"> / 100</span>
      </p>
      <p className="mt-3 text-sm leading-relaxed text-white/90">
        Évaluation des aptitudes professionnelles. Seuil : {threshold}/100.
      </p>
    </div>
  ) : (
    <div className="rounded-3xl bg-canvas p-7 shadow-raised-xl">
      <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-muted">
        Badge de certification
      </span>
      <p className="mt-5 text-lg font-bold uppercase tracking-tight text-ink">Non certifié</p>
      <p className="mt-3 text-sm leading-relaxed text-ink-muted">
        Ce candidat n&apos;a pas encore validé le questionnaire de certification des aptitudes
        professionnelles.
      </p>
    </div>
  );
}
