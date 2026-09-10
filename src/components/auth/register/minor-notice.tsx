import { MAJORITY_AGE } from "@/lib/age";

export function MinorApplicantNotice() {
  return (
    <div
      role="note"
      className="rounded-lg border border-brand/20 bg-brand/5 px-4 py-3 text-sm text-ink"
    >
      <p className="font-medium">Vous avez moins de {MAJORITY_AGE} ans</p>
      <p className="mt-1 text-brand-500">
        Votre compte est créé normalement, mais votre présentation vidéo ne sera pas diffusée
        publiquement : elle reste visible de vous seul et de l&apos;administration. Votre profil
        n&apos;apparaît pas dans le catalogue consultable sans compte recruteur.
      </p>
    </div>
  );
}
