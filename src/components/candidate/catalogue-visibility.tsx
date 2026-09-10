"use client";

import { EyeOff, Eye, Lock } from "lucide-react";

import { Action } from "@/components/common/action";
import { formatTimestamp } from "@/lib/dates";
import type { OwnProfile } from "@/server/services/profiles";

/**
 * Retrait autonome du catalogue.
 *
 * Trois etats, et le troisieme est le seul qui n'offre pas de bouton : un
 * profil retire par l'administration ne se republie pas d'un clic. Sans cette
 * distinction, l'ecran proposerait une action que l'API refuse en 409.
 */
export function CatalogueVisibility({
  profile,
  busy,
  disabled,
  onSetListed,
}: {
  profile: OwnProfile;
  busy: boolean;
  disabled: boolean;
  onSetListed: (listed: boolean) => void;
}) {
  const selfWithdrawn = profile.withdrawal.withdrawn;
  const removedByAdmin = profile.status === "removed" && !selfWithdrawn;

  return (
    <div className="rounded-2xl border border-brand-300 bg-white p-5">
      <div className="flex items-center gap-3">
        <span
          className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${
            removedByAdmin
              ? "bg-danger text-danger-fg"
              : selfWithdrawn
                ? "bg-warning text-warning-fg"
                : "bg-success text-success-fg"
          }`}
        >
          {removedByAdmin ? (
            <Lock aria-hidden="true" className="size-5" />
          ) : selfWithdrawn ? (
            <EyeOff aria-hidden="true" className="size-5" />
          ) : (
            <Eye aria-hidden="true" className="size-5" />
          )}
        </span>
        <h2 className="font-heading text-lg font-bold tracking-tight text-ink">
          Visibilité au catalogue
        </h2>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
        {removedByAdmin
          ? "Votre profil a été retiré par l’administration. Ce retrait ne peut pas être levé depuis cet espace : répondez à la notification reçue pour en discuter."
          : selfWithdrawn
            ? `Vous avez retiré votre profil du catalogue le ${formatTimestamp(profile.withdrawal.at)}. Il n’est plus consultable, vidéo comprise. Rien n’a été supprimé : vous pouvez le republier quand vous le souhaitez.`
            : "Votre profil suit le statut de la modération et reste consultable par les recruteurs. Vous pouvez le retirer du catalogue à tout moment, sans perdre vos informations."}
      </p>

      {removedByAdmin ? null : (
        <Action
          tone={selfWithdrawn ? "action" : "outline"}
          className="mt-5"
          disabled={disabled}
          onClick={() => onSetListed(selfWithdrawn)}
        >
          {busy
            ? "…"
            : selfWithdrawn
              ? "Republier mon profil"
              : "Retirer mon profil du catalogue"}
        </Action>
      )}

      {selfWithdrawn && profile.withdrawal.restoresTo === "pending" ? (
        <p className="mt-3 text-xs leading-relaxed text-ink-soft">
          Votre profil attendait la modération avant le retrait : il y reviendra après
          republication, et non directement au catalogue.
        </p>
      ) : null}
    </div>
  );
}
