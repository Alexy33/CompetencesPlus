"use client";

import { AVAILABILITY_SHORT_LABELS } from "@/lib/labels";

import { Chip, SkillChip } from "@/components/common/chip";
import { ArrowRight, MapPin } from "lucide-react";
import Link from "next/link";
import { CertificationChip } from "./certification-chip";
import { FavoriteButton } from "./favorite-button";
import type { ProfileCardProps } from "./types";

export function ProfileCard({
  profile,
  canFavorite = false,
  initialFavorite = false,
}: ProfileCardProps) {
  return (
    <article className="group flex w-full items-center gap-4 overflow-hidden rounded-xl border border-brand-300 bg-panel px-5 py-4 transition-colors hover:border-brand-muted hover:bg-panel-hover">
      <div className="flex min-w-0 flex-1 items-start gap-4">
        <div className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-brand-200 font-mono text-base font-bold text-brand-800">
          {profile.initials}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold uppercase leading-tight tracking-tight text-ink">
              {profile.name}
            </h3>
            <CertificationChip certified={profile.certified} score={profile.score} />
          </div>

          <p className="mt-1 text-sm leading-snug text-ink-muted">{profile.title}</p>

          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 font-mono text-[11px] font-semibold uppercase tracking-wider text-ink-soft">
            <span className="flex items-center gap-1.5">
              <MapPin aria-hidden="true" className="size-3.5 text-brand" />
              {profile.city}
            </span>
            <Chip tone="info" size="xs">
              {profile.sector}
            </Chip>
            <Chip tone={profile.availability === "immediate" ? "success" : "warning"} size="xs">
              {AVAILABILITY_SHORT_LABELS[profile.availability]}
            </Chip>
          </div>

          {profile.skills.length > 0 ? (
            <ul className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
              {profile.skills.map((skill, index) => (
                <li key={skill}>
                  <SkillChip skill={skill} index={index} />
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </div>

      <div className="flex shrink-0 flex-col gap-2">
        <Link
          href={`/profils/${profile.id}`}
          aria-label={`Consulter le profil de ${profile.name}`}
          className="group/link inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand text-white transition-colors hover:bg-brand-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand sm:w-auto sm:gap-2 sm:px-4"
        >
          <span className="hidden text-sm font-semibold sm:inline">Voir le profil</span>
          <ArrowRight
            aria-hidden="true"
            className="size-4 transition-transform group-hover/link:translate-x-0.5"
          />
        </Link>

        {canFavorite ? (
          <FavoriteButton profile={profile} initialFavorite={initialFavorite} />
        ) : null}
      </div>
    </article>
  );
}
