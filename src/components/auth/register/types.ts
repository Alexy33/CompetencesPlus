import { SECTORS, type Sector } from "@/lib/vocabulary";

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

export const EMPTY_COMPANY: CompanyDraft = {
  name: "",
  siren: "",
  position: "",
  address: "",
  postalCode: "",
  city: "",
  sector: SECTORS[0],
  phone: "",
  website: "",
};
