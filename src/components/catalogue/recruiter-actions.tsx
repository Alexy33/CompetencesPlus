"use client";

import { Action } from "@/components/common/action";
import { StatusMessage } from "@/components/common/feedback";
import { apiLoad, apiSend } from "@/lib/api-client";
import { Heart, Loader2, MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";
import type { RecruiterActionsProps } from "./types";

const MAX_MESSAGE_LENGTH = 2000;

export function RecruiterActions({ profileId }: RecruiterActionsProps) {
  const [favorite, setFavorite] = useState(false);
  const [message, setMessage] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void apiLoad<{ items: { profile: { id: string } }[] }>("/api/me/favorites").then((data) => {
      if (data) setFavorite(data.items.some((item) => item.profile.id === profileId));
    });
  }, [profileId]);

  async function toggleFavorite() {
    setBusy(true);
    setFeedback(null);

    const result = await apiSend(favorite ? "DELETE" : "PUT", `/api/me/favorites/${profileId}`);

    if (result.ok) {
      setFavorite(!favorite);
      setFeedback(favorite ? "Profil retiré des favoris." : "Profil ajouté aux favoris.");
    } else {
      setFeedback("Impossible de modifier les favoris.");
    }
    setBusy(false);
  }

  async function contact() {
    const body = message.trim();
    if (!body) return;

    setBusy(true);
    setFeedback(null);

    const result = await apiSend("POST", `/api/profiles/${profileId}/contact`, { message: body });

    if (result.ok) {
      setMessage("");
      setFeedback("Votre message a été envoyé au candidat.");
    } else {
      setFeedback(result.message);
    }
    setBusy(false);
  }

  return (
    <div>
      <h3 className="text-sm font-bold uppercase text-ink">Actions recruteur</h3>

      <textarea
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        maxLength={MAX_MESSAGE_LENGTH}
        placeholder="Présentez votre opportunité et proposez un échange…"
        className="mt-3 min-h-28 w-full resize-y rounded-xl border border-brand/20 bg-white p-3 text-sm text-ink outline-none placeholder:text-ink-soft focus:border-brand"
      />

      <div className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-1 2xl:grid-cols-2">
        <Action onClick={contact} disabled={busy || !message.trim()}>
          {busy ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <MessageSquare aria-hidden="true" className="size-4" />
          )}
          Prendre contact
        </Action>

        <Action tone={favorite ? "danger" : "outline"} onClick={toggleFavorite} disabled={busy}>
          <Heart aria-hidden="true" className={`size-4 ${favorite ? "fill-current" : ""}`} />
          {favorite ? "Dans mes favoris" : "Ajouter aux favoris"}
        </Action>
      </div>

      <StatusMessage className="mt-3 px-3 py-2 text-xs">{feedback}</StatusMessage>
    </div>
  );
}
