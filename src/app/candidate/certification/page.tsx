import { CertificationQuestionnaire } from "@/components/candidate/certification-questionnaire";
import { SiteShell } from "@/components/layout/site-shell";
import { getCurrentSession } from "@/lib/auth-session";
import {
  certificationState,
  openCatchUp,
  questionsOf,
  submitAttempt,
} from "@/server/services/certification";

export const dynamic = "force-dynamic";

export default async function CertificationPage() {
  const session = await getCurrentSession();
  if (!session?.user) return null;

  // Certification obtenue sous une version anterieure : on ouvre le rattrapage
  // avant d'afficher quoi que ce soit, pour ne poser que les questions
  // nouvelles ou modifiees. Sans effet si tout est deja a jour.
  await openCatchUp(session.user.id);

  let state = await certificationState(session.user.id);

  // Rattrapage sans aucune question a reposer (seuls des enonces ont ete
  // reformules, ou les questions modifiees ont disparu) : la certification est
  // reconduite sur la nouvelle version sans deranger le candidat. On se fie a
  // l'etat, et non au retour de openCatchUp : la tentative peut avoir ete
  // ouverte par un chargement precedent.
  const catchUpComplete =
    state.status === "in_progress" &&
    state.pendingQuestionIds.length === 0 &&
    state.answered > 0 &&
    state.answered === state.questionCount;

  if (catchUpComplete) {
    await submitAttempt(session.user.id);
    state = await certificationState(session.user.id);
  }
  // Le candidat voit le questionnaire de SA tentative, jamais un autre.
  const all = questionsOf(state.questionnaireVersion);

  // Rattrapage : seules les questions nouvelles ou modifiees sont posees, les
  // autres reponses ayant ete reportees depuis la tentative precedente.
  const questions =
    state.pendingQuestionIds.length > 0
      ? all.filter((question) => state.pendingQuestionIds.includes(question.id))
      : all;

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
