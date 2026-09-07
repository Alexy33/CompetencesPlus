import { defineRoute } from "@/server/openapi/routes";
import { AUTH_RESPONSES } from "@/server/contracts/common";
import { CertificationStateSchema } from "@/server/contracts/certification";
import { certificationState, openCatchUp } from "@/server/services/certification";

export const dynamic = "force-dynamic";

export const { POST } = defineRoute({
  method: "POST",
  path: "/api/me/certification/catch-up",
  tags: ["Certification"],
  summary: "Mettre a jour sa certification",
  description:
    "Ouvre une tentative sur le questionnaire en vigueur en ne reposant que les questions " +
    "nouvelles ou dont le bareme a change : les autres reponses sont reportees. Sans effet " +
    "si la certification est deja a jour, ou si une tentative est en cours.",
  access: "candidate",
  responses: {
    "200": {
      description:
        "Rattrapage ouvert. `pendingQuestionIds` liste les questions restant a repondre.",
      schema: CertificationStateSchema,
    },
    ...AUTH_RESPONSES,
  },
  handler: async ({ session }) => {
    await openCatchUp(session.user.id);
    return certificationState(session.user.id);
  },
});
