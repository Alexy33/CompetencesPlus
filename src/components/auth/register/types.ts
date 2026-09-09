import type { Sector } from "@/lib/vocabulary";
import type { ComponentType } from "react";

export type RegistrationRole = "candidate" | "recruiter";

export interface CompanyDraft {
  name: string;
  siren: string;
  position: string;
  address: string;
  postalCode: string;
  city: string;
  sector: Sector;
  phone: string;
  website: string;
}

export type CompanyFieldsetProps = {
  company: CompanyDraft;
  loading: boolean;
  sirenInvalid: boolean;
  onChange: (field: keyof CompanyDraft, value: string) => void;
};

export type RoleSelectorProps = {
  value: RegistrationRole;
  disabled: boolean;
  onChange: (role: RegistrationRole) => void;
};

export type RegistrationRoleOption = {
  id: RegistrationRole;
  label: string;
  hint: string;
  icon: ComponentType<{ className?: string; "aria-hidden"?: boolean | "true" }>;
};
