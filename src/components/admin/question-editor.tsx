"use client";

import { FileQuestion, Lock } from "lucide-react";

import { EmptyState } from "@/components/common/feedback";
import { Surface, SurfaceHeading } from "@/components/common/surface";
import type { EditableQuestion } from "./types";

function QuestionCard({
  question,
  position,
}: {
  question: EditableQuestion;
  position: number;
}) {
  return (
    <article className="rounded-2xl bg-white p-4">
      <div className="flex gap-3">
        <span className="font-mono text-xs font-bold text-brand">
          {String(position).padStart(2, "0")}
        </span>
        <p className="flex-1 text-sm">{question.text}</p>
      </div>

      <ul className="mt-3 space-y-1 pl-9">
        {question.options.map((option) => (
          <li key={option.id} className="flex justify-between gap-3 text-xs text-ink-soft">
            <span>{option.label}</span>
            <span className="font-mono shrink-0">{option.value} pt</span>
          </li>
        ))}
      </ul>

      <p className="mt-3 pl-9 text-xs text-ink-soft">Poids : {question.weight}</p>
    </article>
  );
}

export function QuestionEditor({
  questions,
  version,
}: {
  questions: EditableQuestion[];
  version: number | null;
}) {
  return (
    <Surface padding="responsive">
      <SurfaceHeading
        title="Questionnaire"
        description={
          version === null
            ? "Libellés et pondérations du calcul JEB."
            : `Version ${version} — libellés et pondérations du calcul JEB.`
        }
        icon={<FileQuestion className="size-5" />}
      />

      <p className="mt-4 flex items-start gap-2 rounded-xl bg-brand/5 p-3 text-xs text-ink-soft">
        <Lock aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>
          Le questionnaire est versionné dans le dépôt (
          <code>certification/questions.v{version ?? 1}.json</code>) et n’est pas modifiable ici.
          Pour le faire évoluer, publiez une nouvelle version du fichier puis redéployez : les
          tentatives déjà ouvertes conservent leur version.
        </span>
      </p>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {questions.length ? (
          questions.map((question, index) => (
            <QuestionCard key={question.id} question={question} position={index + 1} />
          ))
        ) : (
          <EmptyState>Aucune question configurée.</EmptyState>
        )}
      </div>
    </Surface>
  );
}
