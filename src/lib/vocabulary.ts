export const SECTORS = [
  "Numérique",
  "Santé",
  "Logistique",
  "Éducation",
  "Bâtiment",
  "Commerce",
  "Industrie",
] as const;

export const CITIES = [
  "Paris",
  "Lyon",
  "Marseille",
  "Lille",
  "Nantes",
  "Bordeaux",
  "Strasbourg",
  "Toulouse",
] as const;

export const SKILLS = [
  "Communication",
  "Organisation",
  "Adaptabilité",
  "Travail en équipe",
  "Autonomie",
  "Rigueur",
  "Relation client",
  "Gestion de projet",
] as const;

export const PROFILE_STATUSES = ["pending", "published", "removed"] as const;

export const VIDEO_STATUSES = ["pending", "approved", "rejected"] as const;

export const CONTACT_STATUSES = [
  "À qualifier",
  "Entretien planifié",
  "Retenu",
  "Écarté",
] as const;

export const USER_ROLES = ["candidate", "recruiter", "admin"] as const;

export type Sector = (typeof SECTORS)[number];
export type City = (typeof CITIES)[number];
export type Skill = (typeof SKILLS)[number];
export type ProfileStatus = (typeof PROFILE_STATUSES)[number];
export type VideoStatus = (typeof VIDEO_STATUSES)[number];
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export type UserRole = (typeof USER_ROLES)[number];

export function mutable<T extends readonly [string, ...string[]]>(list: T): [...T] {
  return [...list];
}

export const MAX_PAGE_SIZE = 20;
export const DEFAULT_PAGE_SIZE = 12;

export const DEFAULT_CERTIFICATION_THRESHOLD = 70;

export const VIDEO_CONSENT_VERSION = "2026-01-v1";

export const VIDEO_CONSENT_TEXT =
  "J'autorise le dispositif ProfilsActifs a heberger et diffuser ma video de " +
  "presentation, image et voix comprises, aupres des recruteurs inscrits. " +
  "Je peux retirer cet accord a tout moment : le retrait entraine la " +
  "suppression definitive du fichier video.";
