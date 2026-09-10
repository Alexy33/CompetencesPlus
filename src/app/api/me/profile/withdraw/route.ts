import { ApiError } from "@/server/http";
import { defineRoute } from "@/server/openapi/routes";
import { AUTH_RESPONSES, CONFLICT_RESPONSE, NOT_FOUND_RESPONSE } from "@/server/contracts/common";
import { MyProfileSchema } from "@/server/contracts/profile";
import { findProfileByUserId, withdrawOwnProfile } from "@/server/services/profiles";

export const dynamic = "force-dynamic";

export const { POST } = defineRoute({
  method: "POST",
  path: "/api/me/profile/withdraw",
  tags: ["Espace demandeur"],
  summary: "Retirer mon profil du catalogue",
  description:
    "Retire le profil du catalogue sans intervention de l'administration. Le profil cesse d'etre " +
    "consultable, video comprise, y compris par son adresse directe. **Rien n'est efface** : le " +
    "titulaire peut republier lui-meme via `POST /api/me/profile/restore`, ce qui retablit le " +
    "statut d'origine.\n\n" +
    "Un profil deja retire par l'administration ne releve pas de cette route : lever une decision " +
    "de moderation n'appartient pas au titulaire.",
  access: "candidate",
  responses: {
    "200": { description: "Profil retire du catalogue.", schema: MyProfileSchema },
    ...CONFLICT_RESPONSE,
    ...AUTH_RESPONSES,
    ...NOT_FOUND_RESPONSE,
  },
  handler: async ({ session }) => {
    await withdrawOwnProfile(session.user.id);

    const updated = await findProfileByUserId(session.user.id);
    if (!updated) throw ApiError.notFound("Aucun profil rattache a ce compte.");
    return updated;
  },
});
