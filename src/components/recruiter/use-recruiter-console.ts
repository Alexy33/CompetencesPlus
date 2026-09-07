"use client";

import { useCallback, useEffect, useState } from "react";

import { apiLoad, apiSend } from "@/lib/api-client";
import type { ContactStatus } from "@/lib/vocabulary";
import type {
  RecruiterCompany,
  RecruiterContact,
  RecruiterFavorite,
  RecruiterStats,
} from "./types";

interface Collection<T> {
  items: T[];
}

export function useRecruiterConsole() {
  const [contacts, setContacts] = useState<RecruiterContact[]>([]);
  const [favorites, setFavorites] = useState<RecruiterFavorite[]>([]);
  const [stats, setStats] = useState<RecruiterStats | null>(null);
  const [company, setCompany] = useState<RecruiterCompany | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    const [contactPage, favoritePage, nextStats, nextCompany] = await Promise.all([
      apiLoad<Collection<RecruiterContact>>("/api/me/contacts"),
      apiLoad<Collection<RecruiterFavorite>>("/api/me/favorites"),
      apiLoad<RecruiterStats>("/api/me/stats"),
      apiLoad<RecruiterCompany>("/api/me/company"),
    ]);

    if (contactPage) setContacts(contactPage.items);
    if (favoritePage) setFavorites(favoritePage.items);
    if (nextStats) setStats(nextStats);
    if (nextCompany) setCompany(nextCompany);
    setLoading(false);
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  async function updateContactStatus(id: string, status: ContactStatus) {
    const result = await apiSend("PATCH", `/api/me/contacts/${id}`, { status });
    if (!result.ok) return;

    setContacts((items) => items.map((item) => (item.id === id ? { ...item, status } : item)));
    void reload();
  }

  async function removeFavorite(profileId: string) {
    const result = await apiSend("DELETE", `/api/me/favorites/${profileId}`);
    if (!result.ok) return;

    setFavorites((items) => items.filter((item) => item.profile.id !== profileId));
    void reload();
  }

  return { contacts, favorites, stats, company, loading, updateContactStatus, removeFavorite };
}
