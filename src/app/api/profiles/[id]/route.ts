import { auth } from "@/lib/auth";
import { ApiError } from "@/server/http";
import { defineRoute } from "@/server/openapi/routes";
import { IdParam, NOT_FOUND_RESPONSE } from "@/server/contracts/common";
import { ProfileSchema } from "@/server/contracts/profile";
import { findProfileById, recordProfileView } from "@/server/services/profiles";

export const dynamic = "force-dynamic";

export const { GET } = defineRoute({
  method: "GET",
  path: "/api/profiles/{id}",
  tags: ["Catalogue"],
  summary: "Fiche publique d'un profil",
  description:
    "Chaque appel incremente le compteur de vues, visible du seul titulaire depuis son espace. Un profil non publie repond 404, y compris a un recruteur.",
  params: IdParam,
  responses: {
    "200": { description: "Profil trouve.", schema: ProfileSchema },
    ...NOT_FOUND_RESPONSE,
  },
  handler: async ({ params, request }) => {

    const session = await auth.api.getSession({ headers: request.headers });
    const found = await findProfileById(params.id, session ?? undefined);
    if (!found || found.status !== "published") {
      throw ApiError.notFound("Ce profil n'existe pas ou n'est pas publie.");
    }

    await recordProfileView(found.id);
    return found;
  },
});
