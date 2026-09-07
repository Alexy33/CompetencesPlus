"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { apiSend } from "@/lib/api-client";
import { MAJORITY_AGE, MINIMUM_AGE, ageOn } from "@/lib/age";
import { authClient } from "@/lib/auth-client";
import { isValidSiren, normalizeSiren } from "@/lib/siren";
import { EMPTY_COMPANY, type CompanyDraft, type RegistrationRole } from "./types";

const SIREN_LENGTH = 9;

export function useRegistration() {
  const router = useRouter();
  const [role, setRole] = useState<RegistrationRole>("candidate");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [company, setCompany] = useState<CompanyDraft>(EMPTY_COMPANY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const declaredAge = ageOn(birthDate);
  const tooYoung = declaredAge !== null && declaredAge < MINIMUM_AGE;
  const isMinorApplicant =
    declaredAge !== null && declaredAge >= MINIMUM_AGE && declaredAge < MAJORITY_AGE;

  const sirenDigits = normalizeSiren(company.siren);
  const sirenInvalid = sirenDigits.length >= SIREN_LENGTH && !isValidSiren(sirenDigits);

  function setCompanyField(field: keyof CompanyDraft, value: string) {
    setCompany((current) => ({ ...current, [field]: value }));
  }

  function validate(): string | null {
    if (tooYoung) {
      return `L'inscription est réservée aux personnes de ${MINIMUM_AGE} ans et plus.`;
    }
    if (declaredAge === null) return "Indiquez une date de naissance valide.";
    if (role === "recruiter" && !isValidSiren(company.siren)) {
      return "Le SIREN de l'entreprise est invalide : neuf chiffres attendus.";
    }
    return null;
  }

  function payload() {
    const account = { role, name, email, password, birthDate };
    if (role !== "recruiter") return account;

    return {
      ...account,
      company: {
        ...company,
        phone: company.phone.trim() || undefined,
        website: company.website.trim() || undefined,
      },
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const invalid = validate();
    if (invalid) {
      setError(invalid);
      return;
    }

    setLoading(true);

    try {
      const result = await apiSend<{ role: RegistrationRole }>(
        "POST",
        "/api/register",
        payload(),
      );

      if (!result.ok) {
        setError(result.message);
        setLoading(false);
        return;
      }

      await authClient.getSession();
      router.push(result.data.role === "recruiter" ? "/recruiter" : "/candidate");
      router.refresh();
    } catch {
      setError("Une erreur inattendue est survenue. Réessayez.");
      setLoading(false);
    }
  }

  return {
    role,
    setRole,
    name,
    setName,
    email,
    setEmail,
    password,
    setPassword,
    birthDate,
    setBirthDate,
    company,
    setCompanyField,
    error,
    loading,
    tooYoung,
    isMinorApplicant,
    sirenInvalid,
    handleSubmit,
  };
}
