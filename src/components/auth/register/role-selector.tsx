"use client";

import { BriefcaseBusiness, UserRound } from "lucide-react";
import type { RegistrationRoleOption, RoleSelectorProps } from "./types";

const ROLES: RegistrationRoleOption[] = [
  {
    id: "candidate",
    label: "Demandeur d'emploi",
    hint: "Créer et publier mon profil professionnel.",
    icon: UserRound,
  },
  {
    id: "recruiter",
    label: "Recruteur",
    hint: "Découvrir et contacter des profils.",
    icon: BriefcaseBusiness,
  },
];

export function RoleSelector({ value, disabled, onChange }: RoleSelectorProps) {
  const selectedRole = ROLES.find((role) => role.id === value) ?? ROLES[0];

  return (
    <fieldset className="grid gap-2.5">
      <legend className="text-sm font-medium text-ink">Choisissez votre type de compte</legend>

      <div className="mt-2 grid grid-cols-2 gap-1.5 rounded-2xl bg-canvas p-1.5 shadow-pressed-sm">
        {ROLES.map(({ id, label, icon: Icon }) => {
          const active = value === id;

          return (
            <label
              key={id}
              className={disabled ? "cursor-not-allowed opacity-60" : "cursor-pointer"}
            >
              <input
                type="radio"
                name="registration-role"
                value={id}
                checked={active}
                onChange={() => onChange(id)}
                disabled={disabled}
                aria-describedby="selected-role-hint"
                className="peer sr-only"
              />
              <span
                className={`flex h-12 items-center justify-center gap-2 rounded-xl px-3 text-sm font-bold transition-all duration-200 peer-focus-visible:outline-3 peer-focus-visible:outline-offset-3 peer-focus-visible:outline-brand ${
                  active
                    ? "bg-brand text-white shadow-raised-sm"
                    : "text-ink-muted hover:bg-white/75 hover:text-brand-700"
                }`}
              >
                <Icon aria-hidden="true" className="size-4.5 shrink-0" />
                <span className="leading-tight">{label}</span>
              </span>
            </label>
          );
        })}
      </div>
      <p id="selected-role-hint" className="px-1 text-sm text-ink-muted">
        {selectedRole.hint}
      </p>
    </fieldset>
  );
}
