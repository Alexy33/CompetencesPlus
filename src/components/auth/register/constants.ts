import { SECTORS } from "@/lib/vocabulary";
import type { CompanyDraft } from "./types";

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
