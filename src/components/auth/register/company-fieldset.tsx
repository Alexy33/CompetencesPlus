"use client";

import { AuthField, authControl } from "@/components/auth/auth-form-parts";
import { SECTORS } from "@/lib/vocabulary";
import { Building2 } from "lucide-react";
import type { CompanyFieldsetProps } from "./types";

export function CompanyFieldset({
  company,
  loading,
  sirenInvalid,
  onChange,
}: CompanyFieldsetProps) {
  return (
    <fieldset className="grid gap-5 rounded-2xl border border-brand/20 bg-panel p-5">
      <legend className="flex items-center gap-2 px-2 text-sm font-semibold text-ink">
        <Building2 aria-hidden="true" className="size-4" />
        Votre entreprise
      </legend>

      <AuthField
        id="companyName"
        label="Raison sociale"
        value={company.name}
        onChange={(event) => onChange("name", event.target.value)}
        placeholder="Atelier Vasseur SAS"
        autoComplete="organization"
        disabled={loading}
        required
      />

      <AuthField
        id="siren"
        label="SIREN"
        value={company.siren}
        onChange={(event) => onChange("siren", event.target.value)}
        placeholder="800 000 002"
        inputMode="numeric"
        disabled={loading}
        required
        aria-describedby="siren-help"
        aria-invalid={sirenInvalid || undefined}
        hint={
          <>
            Neuf chiffres, tels qu&apos;ils figurent à l&apos;annuaire des entreprises. Les espaces
            sont acceptés. Le dernier chiffre est une clé de contrôle : un numéro inventé sera
            refusé, même s&apos;il comporte bien neuf chiffres.
          </>
        }
        error={
          sirenInvalid
            ? "Ce numéro ne passe pas la clé de contrôle du SIREN. Vérifiez-le sur l'annuaire des entreprises : ce n'est pas une question de longueur."
            : null
        }
      />

      <AuthField
        id="position"
        label={<>Votre poste dans l&apos;entreprise</>}
        value={company.position}
        onChange={(event) => onChange("position", event.target.value)}
        placeholder="Responsable des ressources humaines"
        autoComplete="organization-title"
        disabled={loading}
        required
      />

      <AuthField
        id="address"
        label="Adresse"
        value={company.address}
        onChange={(event) => onChange("address", event.target.value)}
        placeholder="12 rue des Tanneurs"
        autoComplete="street-address"
        disabled={loading}
        required
      />

      <div className="grid gap-5 sm:grid-cols-[minmax(0,140px)_minmax(0,1fr)]">
        <AuthField
          id="postalCode"
          label="Code postal"
          value={company.postalCode}
          onChange={(event) => onChange("postalCode", event.target.value)}
          placeholder="44000"
          inputMode="numeric"
          pattern="\d{5}"
          autoComplete="postal-code"
          disabled={loading}
          required
        />

        <AuthField
          id="companyCity"
          label="Ville"
          value={company.city}
          onChange={(event) => onChange("city", event.target.value)}
          placeholder="Nantes"
          autoComplete="address-level2"
          disabled={loading}
          required
        />
      </div>

      <div className="grid gap-2">
        <label htmlFor="companySector" className="text-sm text-ink">
          Secteur d&apos;activité
        </label>
        <select
          id="companySector"
          value={company.sector}
          onChange={(event) => onChange("sector", event.target.value)}
          disabled={loading}
          required
          className={`${authControl} w-full`}
        >
          {SECTORS.map((sector) => (
            <option key={sector} value={sector}>
              {sector}
            </option>
          ))}
        </select>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <AuthField
          id="companyPhone"
          label={
            <>
              Téléphone <span className="font-normal text-ink-muted">(facultatif)</span>
            </>
          }
          type="tel"
          value={company.phone}
          onChange={(event) => onChange("phone", event.target.value)}
          placeholder="02 40 00 00 00"
          autoComplete="tel"
          disabled={loading}
        />

        <AuthField
          id="companyWebsite"
          label={
            <>
              Site web <span className="font-normal text-ink-muted">(facultatif)</span>
            </>
          }
          value={company.website}
          onChange={(event) => onChange("website", event.target.value)}
          placeholder="https://exemple.fr"
          autoComplete="url"
          disabled={loading}
        />
      </div>
    </fieldset>
  );
}
