"use client";

import { Loader2, Save } from "lucide-react";

import { Action } from "@/components/common/action";
import { Field, fieldControl } from "@/components/common/field";
import { Surface, SurfaceHeading } from "@/components/common/surface";
import { AVAILABILITIES, type Availability, type City, type Sector, type Skill } from "@/lib/vocabulary";
import { AVAILABILITY_LABELS } from "@/lib/labels";
import type { ProfileDraft } from "./types";

export function ProfileForm({
  draft,
  sectors,
  cities,
  skills,
  saving,
  disabled,
  onPatch,
  onToggleSkill,
  onSave,
}: {
  draft: ProfileDraft;
  sectors: readonly Sector[];
  cities: readonly City[];
  skills: readonly Skill[];
  saving: boolean;
  disabled: boolean;
  onPatch: (patch: Partial<ProfileDraft>) => void;
  onToggleSkill: (skill: Skill) => void;
  onSave: () => void;
}) {
  return (
    <Surface tone="elevated" padding="responsive">
      <SurfaceHeading
        title="Mon profil"
        description="Informations visibles dans le catalogue."
        action={
          <Action size="sm" onClick={onSave} disabled={disabled}>
            {saving ? (
              <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="size-4" />
            )}
            Enregistrer
          </Action>
        }
      />

      <div className="mt-7 grid gap-5 md:grid-cols-2">
        <Field label="Nom affiché">
          <input
            className={fieldControl}
            value={draft.name}
            onChange={(event) => onPatch({ name: event.target.value })}
          />
        </Field>

        <Field label="Intitulé recherché">
          <input
            className={fieldControl}
            value={draft.title}
            onChange={(event) => onPatch({ title: event.target.value })}
          />
        </Field>

        <Field label="Secteur">
          <select
            className={fieldControl}
            value={draft.sector}
            onChange={(event) => onPatch({ sector: event.target.value as Sector })}
          >
            {sectors.map((sector) => (
              <option key={sector}>{sector}</option>
            ))}
          </select>
        </Field>

        <Field label="Localisation">
          <select
            className={fieldControl}
            value={draft.city}
            onChange={(event) => onPatch({ city: event.target.value as City })}
          >
            {cities.map((city) => (
              <option key={city}>{city}</option>
            ))}
          </select>
        </Field>

        <Field label="Disponibilité">
          <select
            className={fieldControl}
            value={draft.availability}
            onChange={(event) => onPatch({ availability: event.target.value as Availability })}
          >
            {AVAILABILITIES.map((valeur) => (
              <option key={valeur} value={valeur}>
                {AVAILABILITY_LABELS[valeur]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Présentation" className="mt-5">
        <textarea
          className={`${fieldControl} min-h-32 resize-y py-3`}
          value={draft.bio}
          onChange={(event) => onPatch({ bio: event.target.value })}
        />
      </Field>

      <div className="mt-5">
        <p className="text-xs font-semibold uppercase tracking-wider text-ink-soft">Compétences</p>
        <div className="mt-3 flex flex-wrap gap-2">
          {skills.map((skill) => {
            const active = draft.skills.includes(skill);

            return (
              <button
                key={skill}
                type="button"
                aria-pressed={active}
                onClick={() => onToggleSkill(skill)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                  active ? "bg-brand text-white" : "bg-white text-ink-muted hover:bg-brand-200"
                }`}
              >
                {skill}
              </button>
            );
          })}
        </div>
      </div>
    </Surface>
  );
}
