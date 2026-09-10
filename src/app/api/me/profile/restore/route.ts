import { ApiError } from "@/server/http";
import { defineRoute } from "@/server/openapi/routes";
import { AUTH_RESPONSES, CONFLICT_RESPONSE, NOT_FOUND_RESPONSE } from "@/server/contracts/common";
import { MyProfileSchema } from "@/server/contracts/profile";
import { findProfileByUserId, restoreOwnProfile } from "@/server/services/profiles";

export const dynamic = "force-dynamic";

export const { POST } = defineRoute({
  method: "POST",
  path: "/api/me/profile/restore",
  tags: ["Espace demandeur"],
  summary: "Republier mon profil apres un retrait",
  description:
    "Leve un retrait prononce par le titulaire et retablit le statut d'origine. Un profil retire " +
    "alors qu'il attendait la moderation revient **en attente**, jamais directement au catalogue : " +
    "le retrait n'est pas un raccourci vers la publication.\n\n" +
    "Sans retrait autonome en cours, la route repond 409 — un retrait decide par l'administration " +
    "ne se leve pas ici.",
  access: "candidate",
  responses: {
    "200": { description: "Profil republie.", schema: MyProfileSchema },
    ...CONFLICT_RESPONSE,
    ...AUTH_RESPONSES,
    ...NOT_FOUND_RESPONSE,
  },
  handler: async ({ session }) => {
    await restoreOwnProfile(session.user.id);

    const updated = await findProfileByUserId(session.user.id);
    if (!updated) throw ApiError.notFound("Aucun profil rattache a ce compte.");
    return updated;
  },
});
