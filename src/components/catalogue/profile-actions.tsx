"use client";

import { ActionLink } from "@/components/common/action";
import { ShieldCheck } from "lucide-react";
import { RecruiterActions } from "./recruiter-actions";
import type { ProfileActionsProps } from "./types";

export function ProfileActions({ profileId, role }: ProfileActionsProps) {
  if (role === "recruiter") return <RecruiterActions profileId={profileId} />;

  if (role === "candidate") {
    return (
      <div>
        <p className="text-sm leading-relaxed text-ink-soft">
          La prise de contact et les favoris sont réservés aux recruteurs. Depuis votre espace, vous
          pouvez modifier et suivre votre propre profil.
        </p>
        <ActionLink href="/candidate" block className="mt-4">
          Mon espace candidat
        </ActionLink>
      </div>
    );
  }

  if (role === "admin") {
    return (
      <div>
        <ActionLink href="/admin" block>
          <ShieldCheck aria-hidden="true" className="size-4" />
          Administrer les profils
        </ActionLink>
      </div>
    );
  }

  return (
    <div>
      <p className="text-sm leading-relaxed text-ink-soft">
        Le catalogue et les profils sont publics. Connectez-vous avec un compte recruteur pour
        contacter ou enregistrer ce candidat.
      </p>
      <ActionLink href="/login" block className="mt-4">
        Connexion recruteur
      </ActionLink>
    </div>
  );
}
