import type { ContactStatus } from "@/lib/vocabulary";
import type { ReactNode } from "react";

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

export type RowProps = { label: string; children: ReactNode };

export type CompanyPanelProps = { company: RecruiterCompany | null };

export type ContactPipelineProps = {
  contacts: RecruiterContact[];
  onStatusChange: (id: string, status: ContactStatus) => void;
};

export type ContactRowProps = {
  contact: RecruiterContact;
  onStatusChange: (status: ContactStatus) => void;
};

export type FavoritesPanelProps = {
  favorites: RecruiterFavorite[];
  onRemove: (profileId: string) => void;
};
