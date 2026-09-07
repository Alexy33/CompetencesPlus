import { defineRoute } from "@/server/openapi/routes";
import { QuestionnaireSchema } from "@/server/contracts/certification";
import { loadQuestions } from "@/server/services/certification";
import { questionnaireVersion } from "@/server/services/questionnaire";
import { getSettings } from "@/server/services/settings";

export const dynamic = "force-dynamic";

export const { GET } = defineRoute({
  method: "GET",
  path: "/api/certification/questions",
  tags: ["Certification"],
  summary: "Questionnaire de certification",
  description:
    "Les ponderations ne sont PAS exposees ici : les connaitre permettrait d'optimiser ses reponses. Elles ne figurent que dans la vue administration.",
  responses: {
    "200": { description: "Questions dans l'ordre d'affichage.", schema: QuestionnaireSchema },
  },
  handler: async () => {
    const questions = loadQuestions();
    const settings = await getSettings();

    return {
      version: questionnaireVersion(),
      questions: questions.map((item) => ({
        id: item.id,
        text: item.text,
        type: item.type,
        position: item.position,
        options: item.options.map((option) => ({ id: option.id, label: option.label })),
      })),
      threshold: settings.certificationThreshold,
    };
  },
});
