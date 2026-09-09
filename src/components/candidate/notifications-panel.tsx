"use client";

import { Surface } from "@/components/common/surface";
import { formatDay } from "@/lib/dates";
import { Bell } from "lucide-react";
import type { NotificationsPanelProps } from "./types";

const VISIBLE_COUNT = 5;

export function NotificationsPanel({ notifications }: NotificationsPanelProps) {
  return (
    <Surface>
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-200 text-brand-800">
          <Bell aria-hidden="true" className="size-5" />
        </span>
        <h2 className="text-xl font-bold uppercase text-ink">Notifications</h2>
      </div>

      <div className="mt-5 space-y-3">
        {notifications.length ? (
          notifications.slice(0, VISIBLE_COUNT).map((notification) => (
            <article key={notification.id} className="rounded-xl bg-white p-4">
              <p className="text-sm text-ink-muted">{notification.text}</p>
              <time className="mt-2 block font-mono text-[10px] text-ink-soft">
                {formatDay(notification.createdAt)}
              </time>
            </article>
          ))
        ) : (
          <p className="text-sm text-ink-soft">Aucune interaction reçue pour le moment.</p>
        )}
      </div>
    </Surface>
  );
}
