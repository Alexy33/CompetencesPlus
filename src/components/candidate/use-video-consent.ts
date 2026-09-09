"use client";

import type { VideoConsentView } from "@/server/services/profiles";
import { useEffect, useState } from "react";
import type { ConsentNotice } from "./types";

export function useVideoConsent(initialConsent: VideoConsentView, hasVideo: boolean) {
  const [consent, setConsent] = useState(initialConsent);
  const [videoPresent, setVideoPresent] = useState(hasVideo);
  const [notice, setNotice] = useState<ConsentNotice | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void fetch("/api/me/profile/video/consent").then(
      async (r) => r.ok && setNotice(await r.json()),
    );
  }, []);

  async function submit(granted: boolean) {
    if (
      !granted &&
      !window.confirm(
        "Retirer votre consentement supprime définitivement votre vidéo du stockage. Continuer ?",
      )
    )
      return;

    setBusy(true);
    setMessage(null);
    const response = await fetch("/api/me/profile/video/consent", {
      method: granted ? "POST" : "DELETE",
    });
    const data = await response.json();
    if (!response.ok) {
      setMessage(data?.error?.message ?? "Impossible de modifier le consentement.");
      setBusy(false);
      return;
    }
    setConsent(data as VideoConsentView);

    if (!granted) setVideoPresent(false);
    setMessage(
      granted
        ? "Consentement enregistré."
        : "Consentement retiré : la vidéo a été supprimée du stockage.",
    );
    setBusy(false);
  }

  return { consent, videoPresent, notice, busy, message, submit };
}
