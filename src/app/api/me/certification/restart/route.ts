import { eq } from "drizzle-orm";
import { db } from "@/db";
import { certificationAnswer, certificationAttempt } from "@/db/schema";
import { defineRoute } from "@/server/openapi/routes";
import { AUTH_RESPONSES } from "@/server/contracts/common";
import { CertificationStateSchema } from "@/server/contracts/certification";
import { certificationState, currentAttempt, openCatchUp } from "@/server/services/certification";
import { questionnaireVersion } from "@/server/services/questionnaire";

export const dynamic = "force-dynamic";

export const { POST } = defineRoute({
  method: "POST",
  path: "/api/me/certification/restart",
  tags: ["Certification"],
  summary: "Repasser le questionnaire",
  description:
    "Ouvre une tentative vierge. Les tentatives precedentes sont conservees pour le suivi du " +
    "dispositif ; aucun delai de carence n'est applique. Si la certification porte sur une " +
    "version anterieure du questionnaire, un rattrapage est ouvert a la place : seules les " +
    "questions nouvelles ou modifiees sont reposees.",
  access: "candidate",
  responses: {
    "200": { description: "Nouvelle tentative ouverte.", schema: CertificationStateSchema },
    ...AUTH_RESPONSES,
  },
  handler: async ({ session }) => {
    // Certification obtenue sous une version anterieure : on n'efface rien, on
    // ouvre un rattrapage. Le candidat ne repond qu'aux questions qui ont
    // change, ses autres reponses etant reportees.
    if (await openCatchUp(session.user.id)) {
      return certificationState(session.user.id);
    }

    const state = await certificationState(session.user.id);

    // Rattrapage deja ouvert : on ne le vide pas. Effacer les reponses
    // reportees obligerait le candidat a tout refaire, ce que le rattrapage
    // existe justement pour eviter.
    if (state.catchUp) return state;

    const existing = await currentAttempt(session.user.id);
    const current = questionnaireVersion();

    // Une tentative en cours n'est recyclee que si elle porte deja la version
    // en vigueur. Sinon il faut en ouvrir une neuve, sans quoi le candidat
    // resterait indefiniment bloque sur une version perimee.
    if (existing && existing.status === "in_progress" && existing.questionnaireVersion === current) {
      await db
        .delete(certificationAnswer)
        .where(eq(certificationAnswer.attemptId, existing.id));
    } else {
      if (existing && existing.status === "in_progress") {
        // La tentative perimee est abandonnee : ses reponses portaient sur un
        // questionnaire qui n'est plus en vigueur.
        await db
          .delete(certificationAttempt)
          .where(eq(certificationAttempt.id, existing.id));
      }

      await db.insert(certificationAttempt).values({
        id: crypto.randomUUID(),
        userId: session.user.id,
        status: "in_progress",
        // Une nouvelle tentative repart sur le questionnaire en vigueur.
        questionnaireVersion: current,
      });
    }

    return certificationState(session.user.id);
  },
});
