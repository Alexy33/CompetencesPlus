"use client";

import { FileQuestion, Users, Video } from "lucide-react";
import type { ComponentType } from "react";

import type { Tab } from "./types";

const TABS: {
  id: Tab;
  label: string;
  icon: ComponentType<{ className?: string }>;
}[] = [
  { id: "profils", label: "Profils", icon: Users },
  { id: "videos", label: "Vidéos", icon: Video },
  { id: "questionnaire", label: "Questionnaire", icon: FileQuestion },
];

export function AdminTabs({
  current,
  pendingVideos,
  onChange,
}: {
  current: Tab;
  pendingVideos: number;
  onChange: (tab: Tab) => void;
}) {
  return (
    <nav
      aria-label="Sections de l'administration"
      className="mt-7 flex flex-wrap gap-2 border-b border-brand/15 pb-3"
    >
      {TABS.map(({ id, label, icon: Icon }) => {
        const active = current === id;
        const badge = id === "videos" ? pendingVideos : 0;

        return (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id)}
            aria-current={active ? "page" : undefined}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold ${
              active ? "bg-brand text-white" : "bg-white text-ink-muted hover:bg-brand-200"
            }`}
          >
            <Icon className="size-4" />
            {label}
            {badge > 0 ? (
              <span
                className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  active ? "bg-white text-brand" : "bg-warning text-warning-fg"
                }`}
              >
                {badge}
              </span>
            ) : null}
          </button>
        );
      })}
    </nav>
  );
}
