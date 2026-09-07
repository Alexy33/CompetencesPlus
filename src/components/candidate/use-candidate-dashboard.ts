"use client";

import { useEffect, useState } from "react";

import { apiLoad, apiSend, apiUpload } from "@/lib/api-client";
import type { Skill } from "@/lib/vocabulary";
import type { OwnProfile } from "@/server/services/profiles";
import { MAX_SKILLS, type CertificationSummary, type Notification, type ProfileDraft } from "./types";

const UPLOADED_VIDEO_PREFIX = "/api/videos/";

function isUploadedVideo(url: string | null): boolean {
  return Boolean(url?.startsWith(UPLOADED_VIDEO_PREFIX));
}

function draftFrom(profile: OwnProfile): ProfileDraft {
  return {
    name: profile.name,
    title: profile.title,
    sector: profile.sector,
    city: profile.city,
    bio: profile.bio,
    videoUrl: isUploadedVideo(profile.videoUrl) ? "" : (profile.videoUrl ?? ""),
    skills: profile.skills,
  };
}

export function useCandidateDashboard(initialProfile: OwnProfile) {
  const [profile, setProfile] = useState(initialProfile);
  const [draft, setDraft] = useState<ProfileDraft>(() => draftFrom(initialProfile));
  const [certification, setCertification] = useState<CertificationSummary | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [busy, setBusy] = useState<"save" | "upload" | null>(null);
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

    const videoUrl = draft.videoUrl.trim() || (isUploadedVideo(profile.videoUrl) ? undefined : null);
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
      patchDraft({ videoUrl: "" });
      setMessage("Vidéo mise en ligne.");
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
  };
}
