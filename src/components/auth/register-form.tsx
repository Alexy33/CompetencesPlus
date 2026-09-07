"use client";

import { FormAlert } from "@/components/common/feedback";
import { MINIMUM_AGE, latestAllowedBirthDate } from "@/lib/age";
import { AuthField, AuthSubmit, AuthSwitch } from "./auth-form-parts";
import { CompanyFieldset } from "./register/company-fieldset";
import { MinorApplicantNotice } from "./register/minor-notice";
import { RoleSelector } from "./register/role-selector";
import { useRegistration } from "./register/use-registration";

const MIN_PASSWORD_LENGTH = 8;

export function RegisterForm() {
  const form = useRegistration();
  const { role, loading } = form;

  return (
    <div className="grid gap-6">
      <form onSubmit={form.handleSubmit} className="grid gap-5">
        <FormAlert>{form.error}</FormAlert>

        <RoleSelector value={role} disabled={loading} onChange={form.setRole} />

        <AuthField
          id="name"
          label="Nom complet"
          type="text"
          value={form.name}
          onChange={(event) => form.setName(event.target.value)}
          placeholder="Jean Dupont"
          autoCapitalize="words"
          autoComplete="name"
          autoCorrect="off"
          disabled={loading}
          required
        />

        <AuthField
          id="email"
          label="Adresse e-mail"
          type="email"
          value={form.email}
          onChange={(event) => form.setEmail(event.target.value)}
          placeholder={role === "recruiter" ? "jean.dupont@entreprise.fr" : "jean@exemple.fr"}
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          disabled={loading}
          required
        />

        <AuthField
          id="birthDate"
          label="Date de naissance"
          type="date"
          value={form.birthDate}
          onChange={(event) => form.setBirthDate(event.target.value)}
          max={latestAllowedBirthDate()}
          autoComplete="bday"
          disabled={loading}
          required
          aria-describedby="birthDate-help"
          aria-invalid={form.tooYoung || undefined}
          hint={`L'inscription est réservée aux personnes de ${MINIMUM_AGE} ans et plus.`}
          error={
            form.tooYoung
              ? `Vous devez avoir au moins ${MINIMUM_AGE} ans pour créer un compte sur ProfilsActifs.`
              : null
          }
        >
          {form.isMinorApplicant && role === "candidate" ? <MinorApplicantNotice /> : null}
        </AuthField>

        <AuthField
          id="password"
          label="Mot de passe"
          type="password"
          value={form.password}
          onChange={(event) => form.setPassword(event.target.value)}
          placeholder={`${MIN_PASSWORD_LENGTH} caractères minimum`}
          autoComplete="new-password"
          minLength={MIN_PASSWORD_LENGTH}
          disabled={loading}
          required
          hint={`Doit contenir au moins ${MIN_PASSWORD_LENGTH} caractères.`}
        />

        {role === "recruiter" ? (
          <CompanyFieldset
            company={form.company}
            loading={loading}
            sirenInvalid={form.sirenInvalid}
            onChange={form.setCompanyField}
          />
        ) : null}

        <AuthSubmit loading={loading} disabled={form.tooYoung}>
          {loading
            ? "Création du compte..."
            : role === "recruiter"
              ? "Créer le compte recruteur"
              : "Créer le compte"}
        </AuthSubmit>
      </form>

      <AuthSwitch prompt="Vous avez déjà un compte ?" href="/login" label="Se connecter" />
    </div>
  );
}
