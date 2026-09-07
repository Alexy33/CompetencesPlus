import type { ContactStatus } from "@/lib/vocabulary";

export interface RecruiterProfile {
  id: string;
  name: string;
  title: string;
  city: string;
  sector: string;
  score: number | null;
  certified: boolean;
}

export interface RecruiterContact {
  id: string;
  profile: RecruiterProfile;
  message: string;
  status: ContactStatus;
  updatedAt: string;
}

export interface RecruiterFavorite {
  profile: RecruiterProfile;
  createdAt: string;
}

export interface RecruiterStats {
  contacted: number;
  favorites: number;
  interviewsPlanned: number;
}

export interface RecruiterCompany {
  name: string;
  siren: string;
  position: string;
  address: string;
  postalCode: string;
  city: string;
  sector: string;
  phone: string | null;
  website: string | null;
}
