"use client";

import Link from "next/link";
import { ArrowLeft, FileQuestion } from "lucide-react";

import { QuestionStep } from "./certification/question-step";
import { ResultCard } from "./certification/result-card";
import { useCertification } from "./certification/use-certification";
import type { CertificationQuestion, CertificationState } from "./certification/types";

function UnavailableNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <FileQuestion aria-hidden="true" className="size-10 text-brand" />
      <h1 className="mt-5 text-2xl font-bold text-ink">Questionnaire indisponible</h1>
      <p className="mt-3 text-ink-soft">
        Aucune question n’est configurée. Demandez à un administrateur d’ajouter le questionnaire.
      </p>
      <Link href="/candidate" className="mt-6 font-semibold text-brand hover:text-brand-700">
        Retour à mon espace
      </Link>
    </main>
  );
}

export function CertificationQuestionnaire({
  initialQuestions,
  initialState,
}: {
  initialQuestions: CertificationQuestion[];
  initialState: CertificationState;
}) {
  const certification = useCertification(initialQuestions, initialState);
  // Rattrapage : le candidat ne repond qu'aux questions qui ont change.
  const catchingUp = initialState.pendingQuestionIds.length > 0;

  if (initialQuestions.length === 0) return <UnavailableNotice />;

  if (certification.result) {
    return (
      <ResultCard
        result={certification.result}
        busy={certification.busy}
        onRestart={certification.restart}
      />
    );
  }

  return (
    <main className="mx-auto w-full max-w-5xl px-5 pb-20 pt-8 md:px-10 md:pt-12">
      <Link
        href="/candidate"
        className="inline-flex items-center gap-2 text-sm font-semibold text-brand hover:text-brand-700"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Retour à mon espace
      </Link>

      <header className="mt-8 flex items-end justify-between gap-5">
        <div>
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-soft">
            Certification professionnelle JEB
          </p>
          {catchingUp ? (
            <>
              <h1 className="mt-3 text-3xl font-extrabold uppercase text-ink md:text-5xl">
                Mise à jour de votre <span className="text-brand">certification.</span>
              </h1>
              <p className="mt-3 max-w-2xl text-sm text-ink-soft">
                Le questionnaire a évolué. Seules les{" "}
                {initialQuestions.length === 1
                  ? "questions qui ont changé vous sont posées"
                  : `${initialQuestions.length} questions qui ont changé vous sont posées`}{" "}
                : vos autres réponses sont conservées.
              </p>
            </>
          ) : (
            <h1 className="mt-3 text-3xl font-extrabold uppercase text-ink md:text-5xl">
              Valorisez vos <span className="text-brand">aptitudes.</span>
            </h1>
          )}
        </div>
        <p className="shrink-0 font-mono text-xs font-semibold text-ink-soft">
          {certification.index + 1} / {initialQuestions.length}
        </p>
      </header>

      <div className="mt-7 h-2 overflow-hidden rounded-full bg-track">
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-500"
          style={{ width: `${certification.progress}%` }}
        />
      </div>

      <QuestionStep
        question={certification.question}
        position={certification.index + 1}
        total={initialQuestions.length}
        selected={certification.selected}
        busy={certification.busy}
        error={certification.error}
        onAnswer={certification.answer}
        onPrevious={certification.goPrevious}
        onNext={certification.goNext}
        onSubmit={certification.submit}
      />
    </main>
  );
}
