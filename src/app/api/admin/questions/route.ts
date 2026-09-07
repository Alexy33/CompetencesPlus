import { z } from "zod";
import { defineRoute } from "@/server/openapi/routes";
import { AUTH_RESPONSES, errorResponse } from "@/server/contracts/common";
import { AdminQuestionSchema } from "@/server/contracts/certification";
import { CreateQuestionBody } from "@/server/contracts/admin";
import { ApiError } from "@/server/http";
import { named } from "@/server/openapi/schemas";
import { loadQuestions } from "@/server/services/certification";
import { questionnaireVersion } from "@/server/services/questionnaire";

export const dynamic = "force-dynamic";

const AdminQuestionListSchema = named(
  "AdminQuestionList",
  z.object({
    version: z.number().int().meta({ description: "Version du questionnaire en vigueur." }),
    items: z.array(AdminQuestionSchema),
  }),
);

/**
 * Le questionnaire n'est plus modifiable a chaud : il est versionne dans Git
 * (certification/questions.vN.json). Editer le bareme en base laisserait les
 * tentatives en cours sans reference stable et ferait diverger deux copies du
 * questionnaire.
 */
const READ_ONLY =
  "Le questionnaire est versionne dans le depot (certification/questions.vN.json). " +
  "Pour le faire evoluer, publiez une nouvelle version du fichier puis redeployez : " +
  "les tentatives deja ouvertes conservent leur version.";

export const READ_ONLY_RESPONSE = errorResponse(
  "Le questionnaire est en lecture seule : il est versionne dans le depot.",
  { error: { code: "conflict", message: READ_ONLY } },
);

export const { GET } = defineRoute({
  method: "GET",
  path: "/api/admin/questions",
  tags: ["Administration"],
  summary: "Questions et ponderations",
  description:
    "Vue complete du bareme en vigueur, ponderations et points par reponse compris, avec sa version.",
  access: "admin",
  responses: {
    "200": { description: "Questions dans l'ordre du questionnaire.", schema: AdminQuestionListSchema },
    ...AUTH_RESPONSES,
  },
  handler: () => ({ version: questionnaireVersion(), items: loadQuestions() }),
});

export const { POST } = defineRoute({
  method: "POST",
  path: "/api/admin/questions",
  tags: ["Administration"],
  summary: "Ajouter une question (indisponible)",
  description: READ_ONLY,
  access: "admin",
  body: CreateQuestionBody,
  responses: {
    "409": READ_ONLY_RESPONSE,
    ...AUTH_RESPONSES,
  },
  handler: () => {
    throw ApiError.conflict(READ_ONLY);
  },
});
