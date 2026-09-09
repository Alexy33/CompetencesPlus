"use client";

import { Action } from "@/components/common/action";
import { EmptyState } from "@/components/common/feedback";
import { Surface, SurfaceHeading } from "@/components/common/surface";
import { FileQuestion, Plus, Upload } from "lucide-react";
import { QuestionCard } from "./question-card";
import type { QuestionEditorProps } from "./types";

export function QuestionEditor({
  questions,
  version,
  dirty,
  publishing,
  onPatch,
  onAdd,
  onDelete,
  onPublish,
  onReset,
}: QuestionEditorProps) {
  return (
    <Surface padding="responsive">
      <SurfaceHeading
        title="Questionnaire"
        description={
          version === null
            ? "Libellés et pondérations du score d'évaluation."
            : `Version ${version} en vigueur — libellés et pondérations du score d'évaluation.`
        }
        icon={<FileQuestion className="size-5" />}
      />

      <p className="mt-4 rounded-xl bg-brand/5 p-3 text-xs text-ink-soft">
        Vos modifications sont publiées comme <strong>version {(version ?? 0) + 1}</strong>. Les
        versions déjà publiées ne sont jamais modifiées : les candidats dont la certification est en
        cours ou déjà passée conservent le barème sous lequel ils ont répondu.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Action tone="soft" size="sm" onClick={onAdd}>
          <Plus aria-hidden="true" className="size-4" /> Ajouter une question
        </Action>

        <Action onClick={onPublish} disabled={!dirty || publishing}>
          <Upload aria-hidden="true" className="size-4" />
          {publishing ? "Publication…" : `Publier la version ${(version ?? 0) + 1}`}
        </Action>

        {dirty ? (
          <Action tone="soft" size="sm" onClick={onReset} disabled={publishing}>
            Annuler les modifications
          </Action>
        ) : null}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {questions.length ? (
          questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              position={index + 1}
              onPatch={(patch) => onPatch(question.id, patch)}
              onDelete={() => onDelete(question.id)}
            />
          ))
        ) : (
          <EmptyState>Aucune question configurée.</EmptyState>
        )}
      </div>
    </Surface>
  );
}
