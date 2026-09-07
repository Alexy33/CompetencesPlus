import { z } from "zod";
import { defineRoute } from "@/server/openapi/routes";
import { AUTH_RESPONSES, VALIDATION_RESPONSE, errorResponse } from "@/server/contracts/common";
import { AdminQuestionSchema } from "@/server/contracts/certification";
import { PublishQuestionnaireBody } from "@/server/contracts/admin";
import { ApiError } from "@/server/http";
import { named } from "@/server/openapi/schemas";
import { loadQuestions } from "@/server/services/certification";
import {
  QuestionnaireError,
  listVersions,
  publishQuestionnaire,
  questionnaireVersion,
} from "@/server/services/questionnaire";

export const dynamic = "force-dynamic";

const AdminQuestionnaireSchema = named(
  "AdminQuestionnaire",
  z.object({
    version: z.number().int().meta({ description: "Version du questionnaire en vigueur." }),
    versions: z
      .array(z.number().int())
      .meta({ description: "Toutes les versions publiees, de la plus ancienne a la plus recente." }),
    items: z.array(AdminQuestionSchema),
  }),
);

/**
 * Le questionnaire evolue par PUBLICATION d'une nouvelle version, jamais par
 * modification d'une version existante : une tentative deja notee doit rester
 * rejouable a l'identique.
 */
export const PUBLISH_CONFLICT = errorResponse(
  "Publication impossible : questionnaire refuse par la validation, ou dossier non inscriptible.",
  {
    error: {
      code: "conflict",
      message: "Questionnaire de certification invalide.\n\nQuestion « q3 » (« weight ») :\nInvalid input: expected number, received undefined.",
    },
  },
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
    "200": {
      description: "Questions dans l'ordre du questionnaire.",
      schema: AdminQuestionnaireSchema,
    },
    ...AUTH_RESPONSES,
  },
  handler: () => ({
    version: questionnaireVersion(),
    versions: listVersions(),
    items: loadQuestions(),
  }),
});

export const { PUT } = defineRoute({
  method: "PUT",
  path: "/api/admin/questions",
  tags: ["Administration"],
  summary: "Publier une nouvelle version du questionnaire",
  description:
    "Enregistre le questionnaire fourni sous une version NOUVELLE (la plus haute + 1). " +
    "Les versions deja publiees ne sont jamais modifiees : les tentatives ouvertes ou " +
    "deja notees conservent leur bareme d'origine. La nouvelle version entre en vigueur " +
    "pour les tentatives ouvertes ensuite.",
  successStatus: 201,
  access: "admin",
  body: PublishQuestionnaireBody,
  responses: {
    "201": { description: "Nouvelle version publiee.", schema: AdminQuestionnaireSchema },
    ...VALIDATION_RESPONSE,
    ...AUTH_RESPONSES,
    "409": PUBLISH_CONFLICT,
  },
  handler: ({ body }) => {
    try {
      publishQuestionnaire(body.questions);
    } catch (error) {
      // Message de validation destine a l'administrateur : il nomme la
      // question fautive.
      if (error instanceof QuestionnaireError) throw ApiError.conflict(error.message);
      throw error;
    }

    return {
      version: questionnaireVersion(),
      versions: listVersions(),
      items: loadQuestions(),
    };
  },
});
