"use client";

import { apiSend } from "@/lib/api-client";
import { Heart, Loader2 } from "lucide-react";
import { useState } from "react";
import type { FavoriteButtonProps } from "./types";

export function FavoriteButton({ profile, initialFavorite }: FavoriteButtonProps) {
  const [favorite, setFavorite] = useState(initialFavorite);
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    const result = await apiSend(favorite ? "DELETE" : "PUT", `/api/me/favorites/${profile.id}`);
    if (result.ok) setFavorite((current) => !current);
    setBusy(false);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={favorite}
      aria-label={
        favorite ? `Retirer ${profile.name} des favoris` : `Ajouter ${profile.name} aux favoris`
      }
      className={`inline-flex h-10 items-center justify-center gap-2 rounded-lg px-3 text-xs font-semibold transition-colors disabled:opacity-60 ${
        favorite
          ? "bg-danger text-danger-fg"
          : "border border-brand/25 bg-white text-brand hover:bg-brand-100"
      }`}
    >
      {busy ? (
        <Loader2 aria-hidden="true" className="size-4 animate-spin" />
      ) : (
        <Heart aria-hidden="true" className={`size-4 ${favorite ? "fill-current" : ""}`} />
      )}
      <span className="hidden sm:inline">{favorite ? "Favori" : "Ajouter"}</span>
    </button>
  );
}
