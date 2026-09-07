import { defineRoute } from "@/server/openapi/routes";
import { AUTH_RESPONSES, IdParam } from "@/server/contracts/common";
import { UpdateQuestionBody } from "@/server/contracts/admin";
import { ApiError } from "@/server/http";
import { READ_ONLY_RESPONSE } from "../route";

export const dynamic = "force-dynamic";

/**
 * Modifier ou supprimer une question a chaud changerait le bareme des
 * tentatives en cours. Le questionnaire evolue desormais par publication
 * d'un nouveau fichier `certification/questions.vN.json`.
 */
const READ_ONLY =
  "Le questionnaire est versionne dans le depot (certification/questions.vN.json). " +
  "Modifier une question a chaud changerait le bareme des tentatives en cours : " +
  "publiez une nouvelle version du fichier puis redeployez.";

export const { PATCH } = defineRoute({
  method: "PATCH",
  path: "/api/admin/questions/{id}",
  tags: ["Administration"],
  summary: "Modifier une question (indisponible)",
  description: READ_ONLY,
  access: "admin",
  params: IdParam,
  body: UpdateQuestionBody,
  responses: {
    "409": READ_ONLY_RESPONSE,
    ...AUTH_RESPONSES,
  },
  handler: () => {
    throw ApiError.conflict(READ_ONLY);
  },
});

export const { DELETE } = defineRoute({
  method: "DELETE",
  path: "/api/admin/questions/{id}",
  tags: ["Administration"],
  summary: "Supprimer une question (indisponible)",
  description: READ_ONLY,
  access: "admin",
  params: IdParam,
  responses: {
    "409": READ_ONLY_RESPONSE,
    ...AUTH_RESPONSES,
  },
  handler: () => {
    throw ApiError.conflict(READ_ONLY);
  },
});
