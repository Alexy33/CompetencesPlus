"use client";

import { useEffect, useState } from "react";

import { apiLoad, apiSend, apiUpload } from "@/lib/api-client";
import type { Skill } from "@/lib/vocabulary";
import type { OwnProfile } from "@/server/services/profiles";
import { MAX_SKILLS, type CertificationSummary, type Notification, type ProfileDraft } from "./types";

/**
 * Lien tiers eventuellement en place. Une video hebergee par le dispositif ne
 * remplit jamais ce champ : elle n'a pas d'URL a saisir.
 *
 * On lit la FORME de la lecture (un lecteur encapsule), pas le nom de
 * l'hebergeur : le client n'a aucune raison de connaitre la liste.
 */
function embedLinkOf(profile: OwnProfile): string {
  const { playback } = profile.video;
  return playback?.kind === "embed" ? playback.url : "";
}

function draftFrom(profile: OwnProfile): ProfileDraft {
  return {
    name: profile.name,
    title: profile.title,
    sector: profile.sector,
    city: profile.city,
    availability: profile.availability,
    bio: profile.bio,
    videoUrl: embedLinkOf(profile),
    skills: profile.skills,
  };
}

export function useCandidateDashboard(initialProfile: OwnProfile, embedEnabled: boolean) {
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState<ProfileDraft>(() => draftFrom(initialProfile));
  const [certification, setCertification] = useState<CertificationSummary | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [busy, setBusy] = useState<"save" | "upload" | "remove" | "visibility" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    void apiLoad<CertificationSummary>("/api/me/certification").then((data) => {
      if (data) setCertification(data);
    });
    void apiLoad<{ items: Notification[] }>("/api/me/notifications").then((data) => {
      if (data) setNotifications(data.items);
    });
  }, []);

  function patchDraft(patch: Partial<ProfileDraft>) {
    setDraft((current) => ({ ...current, ...patch }));
  }

  function toggleSkill(skill: Skill) {
    setDraft((current) => {
      if (current.skills.includes(skill)) {
        return { ...current, skills: current.skills.filter((item) => item !== skill) };
      }
      if (current.skills.length >= MAX_SKILLS) return current;
      return { ...current, skills: [...current.skills, skill] };
    });
  }

  async function save() {
    setBusy("save");
    setMessage(null);

    // Le champ « lien » ne pilote la video que si l'hebergeur tiers est allume.
    // Sinon on n'envoie rien : enregistrer le profil ne doit jamais effacer une
    // video televersee.
    const link = draft.videoUrl.trim();
    const videoUrl = !embedEnabled
      ? undefined
      : link
        ? link
        : embedLinkOf(profile)
          ? null
          : undefined;

    const result = await apiSend<OwnProfile>("PATCH", "/api/me/profile", { ...draft, videoUrl });

    if (result.ok) {
      setProfile(result.data);
      setMessage("Profil enregistré.");
    } else {
      setMessage(result.message);
    }
    setBusy(null);
  }

  async function uploadVideo(file: File) {
    setBusy("upload");
    setMessage(null);

    const result = await apiUpload<OwnProfile>("/api/me/profile/video", file);

    if (result.ok) {
      setProfile(result.data);
      patchDraft({ videoUrl: embedLinkOf(result.data) });
      setMessage(
        result.data.video.state === "processing"
          ? "Vidéo reçue. Elle sera visible dès la fin du traitement."
          : "Vidéo mise en ligne.",
      );
    } else {
      setMessage(result.message);
    }
    setBusy(null);
  }

  /**
   * Retrait de la video. Passe par la meme suppression que le retrait du
   * consentement : les octets partent, pas seulement la ligne en base.
   */
  async function removeVideo() {
    setBusy("remove");
    setMessage(null);

    const result = await apiSend<OwnProfile>("DELETE", "/api/me/profile/video");

    if (result.ok) {
      setProfile(result.data);
      patchDraft({ videoUrl: "" });
      setMessage("Vidéo supprimée du stockage.");
    } else {
      setMessage(result.message);
    }
    setBusy(null);
  }

  /**
   * Retrait autonome du catalogue, et retour. Une seule fonction pour les deux
   * sens : c'est la meme decision, prise dans un sens ou dans l'autre, et
   * l'ecran n'a jamais a choisir laquelle des deux routes appeler.
   */
  async function setListed(listed: boolean) {
    setBusy("visibility");
    setMessage(null);

    const result = await apiSend<OwnProfile>(
      "POST",
      listed ? "/api/me/profile/restore" : "/api/me/profile/withdraw",
    );

    if (result.ok) {
      setProfile(result.data);
      setMessage(
        listed
          ? "Profil republié."
          : "Profil retiré du catalogue. Vous pouvez le republier à tout moment.",
      );
    } else {
      setMessage(result.message);
    }
    setBusy(null);
  }

  return {
    profile,
    draft,
    certification,
    notifications,
    busy,
    message,
    patchDraft,
    toggleSkill,
    save,
    uploadVideo,
    removeVideo,
    setListed,
  };
}
