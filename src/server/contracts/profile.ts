import { z } from "zod";
import { named } from "../openapi/schemas";
import {
  CitySchema,
  PaginationQuery,
  ProfileStatusSchema,
  QueryBoolean,
  SectorSchema,
  SkillSchema,
  VideoProviderSchema,
  VideoStatusSchema,
  VideoViewStateSchema,
  pageOf,
} from "./common";

export const VideoPlaybackSchema = named(
  "VideoPlayback",
  z.object({
    kind: z.enum(["stream", "embed"]).meta({
      description:
        "stream : octets servis par GET /api/videos/{videoId} (balise video). embed : lecteur tiers a encapsuler.",
    }),
    url: z.string(),
  }),
);

export const VideoViewSchema = named(
  "VideoView",
  z
    .object({
      state: VideoViewStateSchema,
      provider: VideoProviderSchema.nullable().meta({
        description: "Hebergeur declare sur la fiche. Informatif.",
      }),
      playback: VideoPlaybackSchema.nullable().meta({
        description: "Renseigne uniquement quand state vaut ready.",
      }),
      message: z.string().nullable().meta({
        description: "Message a afficher a la place du lecteur, hors etat ready.",
      }),
    })
    .meta({
      description:
        "Etat de la video, hebergeur deja interroge. Aucun chemin de fichier n'est expose : la lecture passe toujours par une adresse controlee.",
    }),
);

export const VideoConsentSchema = named(
  "VideoConsent",
  z.object({
    granted: z.boolean().meta({ description: "Accord en cours. false apres un retrait." }),
    grantedAt: z.iso
      .datetime()
      .nullable()
      .meta({ description: "Horodatage de l'accord ; conserve apres un retrait, comme trace." }),
    version: z
      .string()
      .nullable()
      .meta({ description: "Version du texte de consentement effectivement acceptee." }),
    revokedAt: z.iso.datetime().nullable().meta({ description: "Horodatage du retrait." }),
  }),
);

export const VideoConsentNoticeSchema = named(
  "VideoConsentNotice",
  z.object({
    version: z.string(),
    text: z.string(),
    consent: VideoConsentSchema,
  }),
);

export const VideoModerationSchema = named(
  "VideoModeration",
  z.object({
    status: VideoStatusSchema,
    reason: z
      .string()
      .nullable()
      .meta({ description: "Motif de la decision. Renseigne pour tout refus." }),
    decidedBy: z
      .string()
      .nullable()
      .meta({ description: "Nom de l'administrateur qui a decide." }),
    decidedAt: z.iso.datetime().nullable().meta({ description: "Horodatage de la decision." }),
  }),
);

export const ProfileCardSchema = named(
  "ProfileCard",
  z.object({
    id: z.string(),
    name: z.string().meta({ description: "Nom du titulaire du compte." }),
    initials: z.string().meta({ description: "Initiales pretes a afficher dans une pastille." }),
    title: z.string(),
    sector: SectorSchema,
    city: CitySchema,
    skills: z.array(SkillSchema),
    certified: z.boolean(),
    score: z.number().int().nullable().meta({ description: "Nul tant que la certification n'est pas obtenue." }),
  }),
);

export const ProfileSchema = named(
  "Profile",
  ProfileCardSchema.extend({
    bio: z.string(),
    video: VideoViewSchema,
    status: ProfileStatusSchema,
    certifiedAt: z.iso.datetime().nullable(),
    createdAt: z.iso.datetime(),
  }),
);

export const MyProfileSchema = named(
  "MyProfile",
  ProfileSchema.extend({
    contactCount: z.number().int().meta({
      description:
        "Nombre de sollicitations recues. Compteur d'engagement : visible du seul titulaire, jamais du public ni d'un recruteur.",
    }),
    views: z.number().int().meta({
      description: "Nombre de consultations. Visible du seul titulaire du profil.",
    }),
    videoConsent: VideoConsentSchema,
    videoModeration: VideoModerationSchema,
  }),
);

export const ProfilePageSchema = pageOf("ProfilePage", ProfileCardSchema);

export const CatalogQuery = PaginationQuery.extend({
  q: z
    .string()
    .trim()
    .optional()
    .meta({ description: "Recherche libre sur l'intitulé, le secteur, la ville et les compétences." }),
  sector: SectorSchema.optional(),
  city: CitySchema.optional(),
  certified: QueryBoolean.optional().meta({
    description: "true : uniquement les profils dont l'évaluation est validée.",
  }),
  skills: z
    .array(SkillSchema)
    .optional()
    .meta({
      description:
        "Repeter le parametre pour cumuler : un profil doit posseder TOUTES les competences demandees.",
    }),
});

export const UpdateMyProfileBody = named(
  "UpdateProfileInput",
  z.object({
    name: z.string().trim().min(1).max(120).optional(),
    title: z.string().trim().max(120).optional(),
    sector: SectorSchema.optional(),
    city: CitySchema.optional(),
    bio: z.string().trim().max(2000).optional(),
    videoUrl: z
      .string()
      .trim()
      .max(500)
      .nullable()
      .optional()
      .meta({
        description:
          "Lien de presentation video (YouTube, Vimeo). null pour retirer la video. Ce mode d'hebergement est DESACTIVE par defaut (VIDEO_EMBED_ENABLED) : un lien est alors refuse en 403.",
      }),
    skills: z.array(SkillSchema).max(8).optional(),
  }),
);
