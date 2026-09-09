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

/**
 * Hebergeurs video implementes. Le nom est stocke en base a cote de
 * l'identifiant opaque : c'est lui qui dit a qui reclamer les octets.
 */
export const VIDEO_PROVIDERS = ["local", "peertube", "embed"] as const;

/**
 * Etat de traitement chez l'hebergeur. Un depot reussi n'est pas forcement
 * lisible : le transcodage n'est pas instantane.
 */
export const VIDEO_PROCESSING_STATES = ["processing", "ready", "unavailable"] as const;

/** Etats affichables cote fiche profil, « pas de video » compris. */
export const VIDEO_VIEW_STATES = ["none", "processing", "ready", "unavailable"] as const;

export const CONTACT_STATUSES = [
  "À qualifier",
  "Entretien planifié",
  "Retenu",
  "Écarté",
] as const;

export const AVAILABILITIES = ["immediate", "sous_preavis", "non_disponible"] as const;

export const DEFAULT_AVAILABILITY = "immediate";

export const USER_ROLES = ["candidate", "recruiter", "admin"] as const;

// Types de question acceptes dans certification/questions.vN.json.
// Le dispositif n'en connait qu'un a ce jour : un choix unique parmi des
// reponses ponderees. Ajouter un type ici impose d'etendre la validation
// (src/server/contracts/questionnaire.ts) et le calcul du score.
export const QUESTION_TYPES = ["single_choice"] as const;

export type Sector = (typeof SECTORS)[number];
export type City = (typeof CITIES)[number];
export type Skill = (typeof SKILLS)[number];
export type ProfileStatus = (typeof PROFILE_STATUSES)[number];
export type VideoStatus = (typeof VIDEO_STATUSES)[number];
export type VideoProviderName = (typeof VIDEO_PROVIDERS)[number];
export type VideoProcessingState = (typeof VIDEO_PROCESSING_STATES)[number];
export type VideoViewState = (typeof VIDEO_VIEW_STATES)[number];
export type ContactStatus = (typeof CONTACT_STATUSES)[number];
export type Availability = (typeof AVAILABILITIES)[number];
export type UserRole = (typeof USER_ROLES)[number];
export type QuestionType = (typeof QUESTION_TYPES)[number];

export function mutable<T extends readonly [string, ...string[]]>(list: T): [...T] {
  return [...list];
}

export const MAX_PAGE_SIZE = 20;
export const DEFAULT_PAGE_SIZE = 12;

export const DEFAULT_CERTIFICATION_THRESHOLD = 70;

// Questionnaire charge par le dispositif. Le fichier porte lui-meme sa
// version : celle-ci n'est PAS deduite du nom de fichier, elle est validee
// a l'ouverture (voir src/server/services/questionnaire.ts).
export const QUESTIONNAIRE_FILE = "questions.v1.json";

export const VIDEO_CONSENT_VERSION = "2026-01-v1";

export const VIDEO_CONSENT_TEXT =
  "J'autorise le dispositif ProfilsActifs a heberger et diffuser ma video de " +
  "presentation, image et voix comprises, aupres des recruteurs inscrits. " +
  "Je peux retirer cet accord a tout moment : le retrait entraine la " +
  "suppression definitive du fichier video.";

// --- Messages affiches a la place du lecteur video -------------------------
// Le dispositif n'a pas de couche i18n : le francais est ecrit ici, en un
// seul endroit, comme pour les autres libelles du domaine.

export const VIDEO_UNAVAILABLE_MESSAGE = "La vidéo est temporairement indisponible.";

export const VIDEO_PROCESSING_MESSAGE =
  "La vidéo est en cours de traitement. Elle sera visible dans quelques instants.";

export const VIDEO_NONE_MESSAGE = "Aucune présentation vidéo";
