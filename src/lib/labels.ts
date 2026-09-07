import type { ProfileStatus, UserRole, VideoStatus } from "@/lib/vocabulary";

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
