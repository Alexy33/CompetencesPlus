"use client";

import Link from "next/link";
import { Heart, Trash2 } from "lucide-react";

import { EmptyState } from "@/components/common/feedback";
import { Surface } from "@/components/common/surface";
import type { RecruiterFavorite } from "./types";

export function FavoritesPanel({
  favorites,
  onRemove,
}: {
  favorites: RecruiterFavorite[];
  onRemove: (profileId: string) => void;
}) {
  return (
    <Surface>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-danger text-danger-fg">
          <Heart aria-hidden="true" className="size-5" />
        </span>
        <h2 className="text-xl font-bold uppercase text-ink">Favoris</h2>
      </div>

      <div className="mt-5 space-y-3">
        {favorites.length ? (
          favorites.map(({ profile }) => (
            <article key={profile.id} className="flex items-center gap-3 rounded-xl bg-white p-4">
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{profile.name}</p>
                <p className="truncate text-xs text-ink-soft">{profile.title}</p>
              </div>
              <Link
                href={`/profils/${profile.id}`}
                className="text-xs font-semibold text-brand hover:text-brand-700"
              >
                Voir
              </Link>
              <button
                type="button"
                onClick={() => onRemove(profile.id)}
                aria-label={`Retirer ${profile.name} des favoris`}
                className="text-danger-fg transition-opacity hover:opacity-70"
              >
                <Trash2 aria-hidden="true" className="size-4" />
              </button>
            </article>
          ))
        ) : (
          <EmptyState>Aucun profil enregistré.</EmptyState>
        )}
      </div>
    </Surface>
  );
}
