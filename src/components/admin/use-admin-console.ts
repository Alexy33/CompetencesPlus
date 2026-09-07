"use client";

import { useCallback, useEffect, useState } from "react";

import { apiLoad, apiSend } from "@/lib/api-client";
import type { ProfileStatus } from "@/lib/vocabulary";
import type { VideoRow } from "./video-moderation";
import type {
  AdminStats,
  EditableQuestion,
  ModeratedProfile,
  PlatformSettings,
} from "./types";

interface Collection<T> {
  items: T[];
}

export function useAdminConsole() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [profiles, setProfiles] = useState<ModeratedProfile[]>([]);
  const [questions, setQuestions] = useState<EditableQuestion[]>([]);
  const [settings, setSettings] = useState<PlatformSettings | null>(null);
  const [videos, setVideos] = useState<VideoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingProfileId, setDeletingProfileId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const reload = useCallback(async () => {
    const [nextStats, profilePage, questionPage, nextSettings, videoPage] = await Promise.all([
      apiLoad<AdminStats>("/api/admin/stats"),
      apiLoad<Collection<ModeratedProfile>>("/api/admin/profiles"),
      apiLoad<Collection<EditableQuestion>>("/api/admin/questions"),
      apiLoad<PlatformSettings>("/api/admin/settings"),
      apiLoad<Collection<VideoRow>>("/api/admin/videos"),
    ]);

    if (nextStats) setStats(nextStats);
    if (profilePage) setProfiles(profilePage.items);
    if (questionPage) setQuestions(questionPage.items);
    if (nextSettings) setSettings(nextSettings);
    if (videoPage) setVideos(videoPage.items);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function moderate(id: string, status: ProfileStatus) {
    const result = await apiSend(`PATCH`, `/api/admin/profiles/${id}`, { status });
    if (!result.ok) return setMessage(result.message);

    setProfiles((rows) => rows.map((row) => (row.id === id ? { ...row, status } : row)));
    setMessage("Statut du profil mis à jour.");
    void reload();
  }

  async function deleteProfile(profile: ModeratedProfile) {
    const confirmed = window.confirm(
      `Supprimer définitivement le profil de ${profile.name} ? Cette action est irréversible.`,
    );
    if (!confirmed) return;

    setDeletingProfileId(profile.id);
    const result = await apiSend("DELETE", `/api/admin/profiles/${profile.id}`);
    setDeletingProfileId(null);

    if (!result.ok) return setMessage("Impossible de supprimer le profil.");

    setProfiles((rows) => rows.filter((row) => row.id !== profile.id));
    setMessage("Profil supprimé.");
    void reload();
  }

  async function saveSettings() {
    if (!settings) return;

    const result = await apiSend<PlatformSettings>("PATCH", "/api/admin/settings", settings);
    if (!result.ok) return setMessage(result.message);

    setSettings(result.data);
    setMessage("Réglages enregistrés.");
  }

  async function saveQuestion(question: EditableQuestion) {
    const result = await apiSend("PATCH", `/api/admin/questions/${question.id}`, {
      text: question.text,
      weight: question.weight,
    });
    setMessage(result.ok ? "Question enregistrée." : result.message);
  }

  async function deleteQuestion(id: string) {
    const result = await apiSend("DELETE", `/api/admin/questions/${id}`);
    if (!result.ok) return setMessage(result.message);

    setQuestions((rows) => rows.filter((row) => row.id !== id));
    setMessage("Question supprimée.");
    void reload();
  }

  async function decideVideo(
    profileId: string,
    decision: "approved" | "rejected",
    reason: string,
  ) {
    const result = await apiSend<VideoRow>(
      "PATCH",
      `/api/admin/videos/${profileId}`,
      decision === "rejected" ? { decision, reason } : { decision },
    );

    if (!result.ok) return setMessage(result.message);

    setVideos((rows) => rows.map((row) => (row.profileId === profileId ? result.data : row)));
    setMessage(
      decision === "approved"
        ? "Vidéo validée : elle est désormais diffusée."
        : "Vidéo refusée : le motif a été transmis au candidat.",
    );
    void reload();
  }

  function patchQuestion(id: string, patch: Partial<EditableQuestion>) {
    setQuestions((rows) => rows.map((row) => (row.id === id ? { ...row, ...patch } : row)));
  }

  return {
    stats,
    profiles,
    questions,
    settings,
    videos,
    loading,
    deletingProfileId,
    message,
    setSettings,
    moderate,
    decideVideo,
    deleteProfile,
    saveSettings,
    saveQuestion,
    deleteQuestion,
    patchQuestion,
  };
}
