"use client";

import { FileQuestion, Save, Trash2 } from "lucide-react";

import { Action } from "@/components/common/action";
import { EmptyState } from "@/components/common/feedback";
import { Surface, SurfaceHeading } from "@/components/common/surface";
import type { EditableQuestion } from "./types";

function QuestionCard({
  question,
  position,
  onPatch,
  onSave,
  onDelete,
}: {
  question: EditableQuestion;
  position: number;
  onPatch: (patch: Partial<EditableQuestion>) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  return (
    <article className="rounded-2xl bg-white p-4">
      <div className="flex gap-3">
        <span className="font-mono text-xs font-bold text-brand">
          {String(position).padStart(2, "0")}
        </span>
        <textarea
          aria-label={`Libellé de la question ${position}`}
          value={question.text}
          onChange={(event) => onPatch({ text: event.target.value })}
          className="min-h-20 flex-1 resize-none rounded-xl border border-brand/15 p-3 text-sm outline-none focus:border-brand"
        />
      </div>

      <div className="mt-3 flex items-center justify-between gap-3">
        <label className="text-xs text-ink-soft">
          Poids
          <input
            type="number"
            min={1}
            max={5}
            value={question.weight}
            onChange={(event) => onPatch({ weight: Number(event.target.value) })}
            className="ml-2 h-9 w-16 rounded-lg border border-brand/15 px-2"
          />
        </label>

        <div className="flex gap-2">
          <Action tone="soft" size="icon" onClick={onSave} aria-label="Enregistrer la question">
            <Save aria-hidden="true" className="size-4" />
          </Action>
          <Action tone="danger" size="icon" onClick={onDelete} aria-label="Supprimer la question">
            <Trash2 aria-hidden="true" className="size-4" />
          </Action>
        </div>
      </div>
    </article>
  );
}

export function QuestionEditor({
  questions,
  onPatch,
  onSave,
  onDelete,
}: {
  questions: EditableQuestion[];
  onPatch: (id: string, patch: Partial<EditableQuestion>) => void;
  onSave: (question: EditableQuestion) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <Surface padding="responsive" >
      <SurfaceHeading
        title="Questionnaire"
        description="Libellés et pondérations du calcul JEB."
        icon={<FileQuestion className="size-5" />}
      />

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {questions.length ? (
          questions.map((question, index) => (
            <QuestionCard
              key={question.id}
              question={question}
              position={index + 1}
              onPatch={(patch) => onPatch(question.id, patch)}
              onSave={() => onSave(question)}
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
