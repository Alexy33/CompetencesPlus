import type { Availability, ProfileStatus, UserRole, VideoStatus } from "@/lib/vocabulary";

export const PROFILE_STATUS_LABELS: Record<ProfileStatus, string> = {
  pending: "En attente",
  published: "Publié",
  removed: "Retiré",
};

export const VIDEO_STATUS_LABELS: Record<VideoStatus, string> = {
  pending: "En attente",
  approved: "Approuvée",
  rejected: "Refusée",
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  candidate: "Demandeur d'emploi",
  recruiter: "Recruteur",
  admin: "Administration",
};

export const ROLE_WORKSPACE: Record<UserRole, string> = {
  candidate: "/candidate",
  recruiter: "/recruiter",
  admin: "/admin",
};

export const AVAILABILITY_LABELS: Record<Availability, string> = {
  immediate: "Disponible immédiatement",
  sous_preavis: "Disponible sous préavis",
  non_disponible: "Pas en recherche active",
};

export const AVAILABILITY_SHORT_LABELS: Record<Availability, string> = {
  immediate: "Immédiate",
  sous_preavis: "Sous préavis",
  non_disponible: "Non disponible",
};
