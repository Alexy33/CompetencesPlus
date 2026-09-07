"use client";

import { Briefcase, UserRound } from "lucide-react";
import type { ComponentType } from "react";

import type { RegistrationRole } from "./types";

const ROLES: {
  id: RegistrationRole;
  label: string;
  hint: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
}[] = [
  {
    id: "candidate",
    label: "Demandeur d'emploi",
    hint: "Publier mon profil et ma vidéo de présentation.",
    icon: UserRound,
  },
  {
    id: "recruiter",
    label: "Recruteur",
    hint: "Consulter le catalogue et contacter des candidats.",
    icon: Briefcase,
  },
];

export function RoleSelector({
  value,
  disabled,
  onChange,
}: {
  value: RegistrationRole;
  disabled: boolean;
  onChange: (role: RegistrationRole) => void;
}) {
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm text-ink">Je crée un compte en tant que</legend>

      <div role="radiogroup" aria-label="Type de compte" className="grid gap-3 sm:grid-cols-2">
        {ROLES.map(({ id, label, hint, icon: Icon }) => {
          const active = value === id;

          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(id)}
              disabled={disabled}
              className={`flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors ${
                active
                  ? "bg-brand text-white"
                  : "bg-canvas text-ink shadow-pressed-sm hover:bg-brand-200"
              }`}
            >
              <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
              <span>
                <span className="block text-base font-semibold">{label}</span>
                <span
                  className={`mt-0.5 block text-sm ${active ? "text-white/80" : "text-ink-muted"}`}
                >
                  {hint}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
