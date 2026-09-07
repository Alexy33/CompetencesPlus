import { db } from "@/db";
import { certificationAnswer } from "@/db/schema";
import { ApiError } from "@/server/http";
import { defineRoute } from "@/server/openapi/routes";
import { AUTH_RESPONSES, errorResponse } from "@/server/contracts/common";
import { CertificationStateSchema, SaveAnswersBody } from "@/server/contracts/certification";
import { certificationState, openAttempt, questionsOf } from "@/server/services/certification";

export const dynamic = "force-dynamic";

export const { PUT } = defineRoute({
  method: "PUT",
  path: "/api/me/certification/answers",
  tags: ["Certification"],
  summary: "Enregistrer des reponses",
  description:
    "Appelable a chaque question : la progression est conservee si le candidat quitte le questionnaire. Les reponses envoyees sont fusionnees avec les precedentes, jamais substituees en bloc.",
  access: "candidate",
  body: SaveAnswersBody,
  responses: {
    "200": { description: "Reponses enregistrees, etat mis a jour.", schema: CertificationStateSchema },
    "400": errorResponse("Corps invalide : `answers` absent, ou une valeur non textuelle.", {
      error: {
        code: "bad_request",
        message: "Parametres invalides (body).",
        details: [
          { path: "body.answers", message: "Invalid input: expected record, received undefined" },
        ],
      },
    }),
    ...AUTH_RESPONSES,
    "422": errorResponse(
      "Corps valide, mais une cle ne designe aucune question, ou l'option choisie ne figure pas parmi celles de la question visee.",
      {
        error: {
          code: "unprocessable",
          message: "Question inconnue : question-inexistante.",
        },
      },
    ),
  },
  handler: async ({ session, body }) => {
    const attempt = await openAttempt(session.user.id);
    if (attempt.status === "submitted") {
      throw ApiError.conflict(
        "Cette tentative est deja validee. Relancez le questionnaire pour repondre a nouveau.",
      );
    }

    // Les reponses sont validees contre le questionnaire de la tentative,
    // pas contre le questionnaire en vigueur : une tentative ouverte sous v1
    // continue d'accepter exactement les reponses de v1.
    const questions = questionsOf(attempt.questionnaireVersion);
    const allowed = new Map(questions.map((item) => [item.id, item]));

    for (const [questionId, optionId] of Object.entries(body.answers)) {
      const item = allowed.get(questionId);
      if (!item) throw ApiError.unprocessable(`Question inconnue : ${questionId}.`);
      if (!item.options.some((option) => option.id === optionId)) {
        throw ApiError.unprocessable(
          `La reponse ${optionId} ne figure pas parmi les options de la question ${questionId}.`,
        );
      }

      await db
        .insert(certificationAnswer)
        .values({ attemptId: attempt.id, questionId, optionId })
        .onConflictDoUpdate({
          target: [certificationAnswer.attemptId, certificationAnswer.questionId],
          set: { optionId },
        });
    }

    return certificationState(session.user.id);
  },
});
