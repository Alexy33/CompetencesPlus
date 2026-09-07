import { CertificationQuestionnaire } from "@/components/candidate/certification-questionnaire";
import { SiteShell } from "@/components/layout/site-shell";
import { getCurrentSession } from "@/lib/auth-session";
import { certificationState, questionsOf } from "@/server/services/certification";

export const dynamic = "force-dynamic";

export default async function CertificationPage() {
  const session = await getCurrentSession();
  if (!session?.user) return null;

  const state = await certificationState(session.user.id);
  // Le candidat voit le questionnaire de SA tentative, jamais un autre.
  const questions = questionsOf(state.questionnaireVersion);

  return (
    <SiteShell>
      <CertificationQuestionnaire
        initialQuestions={questions.map((question) => ({
          id: question.id,
          text: question.text,
          position: question.position,
          options: question.options.map((option) => ({ id: option.id, label: option.label })),
        }))}
        initialState={state}
      />
    </SiteShell>
  );
}
