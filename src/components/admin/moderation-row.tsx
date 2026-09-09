"use client";

import { Action, ActionLink } from "@/components/common/action";
import { ProfileStatusChip } from "@/components/common/chip";
import { Loader2, Trash2 } from "lucide-react";
import type { ModerationRowProps, ProfileTransition } from "./types";

const TRANSITIONS: ProfileTransition[] = [
  { status: "published", label: "Publier", tone: "success" },
  { status: "pending", label: "En attente", tone: "warning" },
  { status: "removed", label: "Retirer", tone: "danger" },
];

export function ModerationRow({ profile, deleting, onModerate, onDelete }: ModerationRowProps) {
  return (
    <article className="grid gap-4 rounded-2xl bg-white p-4 md:grid-cols-[minmax(0,1fr)_auto] md:items-center">
      <div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-bold text-ink">{profile.name}</h3>
          <ProfileStatusChip status={profile.status} />
        </div>
        <p className="mt-1 text-sm text-ink-soft">{profile.title}</p>
        <p className="mt-2 text-xs text-ink-muted">
          {profile.hasVideo ? "Vidéo renseignée" : "Aucune vidéo"}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {TRANSITIONS.filter((transition) => transition.status !== profile.status).map(
          (transition) => (
            <Action
              key={transition.status}
              tone={transition.tone}
              size="xs"
              onClick={() => onModerate(transition.status)}
            >
              {transition.label}
            </Action>
          ),
        )}

        {profile.status === "published" ? (
          <ActionLink tone="soft" size="xs" href={`/profils/${profile.id}`}>
            Voir
          </ActionLink>
        ) : null}

        <Action
          tone="destructive"
          size="xs"
          onClick={onDelete}
          disabled={deleting}
          aria-label={`Supprimer le profil de ${profile.name}`}
        >
          {deleting ? (
            <Loader2 aria-hidden="true" className="size-3.5 animate-spin" />
          ) : (
            <Trash2 aria-hidden="true" className="size-3.5" />
          )}
          Supprimer
        </Action>
      </div>
    </article>
  );
}
