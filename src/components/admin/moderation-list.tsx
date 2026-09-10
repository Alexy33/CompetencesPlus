"use client";

import { EmptyState } from "@/components/common/feedback";
import { Surface, SurfaceHeading } from "@/components/common/surface";
import { ModerationRow } from "./moderation-row";
import type { ModerationListProps } from "./types";

export function ModerationList({
  profiles,
  deletingProfileId,
  onModerate,
  onDelete,
}: ModerationListProps) {
  return (
    <Surface tone="elevated" padding="responsive">
      <SurfaceHeading
        title="Modération des profils"
        description="Validez, retirez ou supprimez les profils."
      />

      <div className="mt-6 space-y-3">
        {profiles.length ? (
          profiles.map((profile) => (
            <ModerationRow
              key={profile.id}
              profile={profile}
              deleting={deletingProfileId === profile.id}
              onModerate={(status) => onModerate(profile.id, status)}
              onDelete={() => onDelete(profile)}
            />
          ))
        ) : (
          <EmptyState>Aucun profil à modérer.</EmptyState>
        )}
      </div>
    </Surface>
  );
}
