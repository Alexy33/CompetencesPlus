import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profile, user } from "@/db/schema";
import { ApiError } from "@/server/http";
import { defineRoute } from "@/server/openapi/routes";
import { AUTH_RESPONSES, errorResponse } from "@/server/contracts/common";
import { MyProfileSchema, UpdateMyProfileBody } from "@/server/contracts/profile";
import { findProfileByUserId, replaceSkills } from "@/server/services/profiles";
import {
  deleteProfileVideo,
  EmbedProviderDisabledError,
  MissingVideoConsentError,
  setProfileVideoLink,
} from "@/server/services/video";
import { UnsupportedVideoTypeError } from "@/server/video/provider";

export const dynamic = "force-dynamic";

const PROFILE_NOT_FOUND = {
  "404": errorResponse("Aucun profil rattache a ce compte.", {
    error: { code: "not_found", message: "Aucun profil rattache a ce compte." },
  }),
} as const;

const CONSENT_REQUIRED = {
  "403": errorResponse(
    "Role insuffisant, diffusion video sans consentement en cours, ou hebergement par lien tiers desactive.",
    {
      error: {
        code: "forbidden",
        message:
          "Aucun consentement en cours pour la diffusion de la video. " +
          "Acceptez le texte en vigueur avant de mettre une video en ligne ou d'en publier le lien.",
      },
    },
  ),
} as const;

const PROFILE_VALIDATION = {
  "400": errorResponse("Corps de requete invalide.", {
    error: {
      code: "bad_request",
      message: "Parametres invalides (body).",
      details: [{ path: "body.title", message: "Too big: expected string to have <=120 characters" }],
    },
  }),
} as const;

export const { GET } = defineRoute({
  method: "GET",
  path: "/api/me/profile",
  tags: ["Espace demandeur"],
  summary: "Mon profil",
  description:
    "Le candidat voit exactement ce que voient les recruteurs, statut de moderation compris.",
  access: "candidate",
  responses: {
    "200": { description: "Profil du candidat connecte.", schema: MyProfileSchema },
    ...AUTH_RESPONSES,
    ...PROFILE_NOT_FOUND,
  },
  handler: async ({ session }) => {
    const owned = await findProfileByUserId(session.user.id);
    if (!owned) throw ApiError.notFound("Aucun profil rattache a ce compte.");
    return owned;
  },
});

export const { PATCH } = defineRoute({
  method: "PATCH",
  path: "/api/me/profile",
  tags: ["Espace demandeur"],
  summary: "Mettre a jour mon profil",
  description: [
    "Mise a jour partielle : n'envoyez que les champs modifies. Le statut de",
    "moderation, le score et les compteurs ne sont pas modifiables ici.",
    "",
    "`videoUrl` confie un lien tiers (YouTube, Vimeo) au fournisseur `embed`,",
    "**desactive par defaut** : sans `VIDEO_EMBED_ENABLED=true`, la reponse est",
    "403. `null` retire la video en passant par la suppression du fournisseur,",
    "octets compris.",
  ].join("\n"),
  access: "candidate",
  body: UpdateMyProfileBody,
  responses: {
    "200": { description: "Profil mis a jour.", schema: MyProfileSchema },
    ...PROFILE_VALIDATION,
    ...AUTH_RESPONSES,
    ...CONSENT_REQUIRED,
    ...PROFILE_NOT_FOUND,
  },
  handler: async ({ session, body }) => {
    const owned = await findProfileByUserId(session.user.id);
    if (!owned) throw ApiError.notFound("Aucun profil rattache a ce compte.");

    if (body.name !== undefined) {
      await db
        .update(user)
        .set({ name: body.name, updatedAt: new Date() })
        .where(eq(user.id, session.user.id));
    }

    // La video n'est plus une colonne comme une autre : elle passe par le
    // fournisseur, seul a savoir ou vivent les octets et comment les effacer.
    const { name: _name, skills, videoUrl, ...columns } = body;

    if (Object.keys(columns).length > 0) {
      await db
        .update(profile)
        .set({ ...columns, updatedAt: new Date() })
        .where(eq(profile.id, owned.id));
    }

    if (skills) await replaceSkills(owned.id, skills);

    if (videoUrl !== undefined) {
      if (videoUrl === null || videoUrl.trim() === "") {
        await deleteProfileVideo(owned.id);
      } else {
        try {
          await setProfileVideoLink(owned.id, videoUrl);
        } catch (error) {
          if (error instanceof MissingVideoConsentError) throw ApiError.forbidden(error.message);
          if (error instanceof EmbedProviderDisabledError) throw ApiError.forbidden(error.message);
          if (error instanceof UnsupportedVideoTypeError) throw ApiError.unprocessable(error.message);
          throw error;
        }
      }
    }

    const updated = await findProfileByUserId(session.user.id);
    if (!updated) throw ApiError.notFound("Aucun profil rattache a ce compte.");
    return updated;
  },
});
