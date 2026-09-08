"use client";

import { FileQuestion, Plus, Trash2, Upload } from "lucide-react";

import { Action } from "@/components/common/action";
import { EmptyState } from "@/components/common/feedback";
import { Surface, SurfaceHeading } from "@/components/common/surface";
import type { EditableQuestion, QuestionOption } from "./types";

function OptionRow({
  option,
  index,
  canRemove,
  onPatch,
  onRemove,
}: {
  option: QuestionOption;
  index: number;
  canRemove: boolean;
  onPatch: (patch: Partial<QuestionOption>) => void;
  onRemove: () => void;
}) {
  return (
    <li className="flex items-center gap-2">
      <input
        aria-label={`Libellé de la réponse ${index + 1}`}
        value={option.label}
        onChange={(event) => onPatch({ label: event.target.value })}
        className="h-9 flex-1 rounded-lg border border-brand/15 px-2 text-sm outline-none focus:border-brand"
      />
      <label className="flex items-center gap-1 text-xs text-ink-soft">
        <span className="sr-only">{`Points de la réponse ${index + 1}`}</span>
        <input
          type="number"
          min={0}
          aria-label={`Points de la réponse ${index + 1}`}
          value={option.value}
          onChange={(event) => onPatch({ value: Number(event.target.value) })}
          className="h-9 w-16 rounded-lg border border-brand/15 px-2"
        />
        pt
      </label>
      <Action
        tone="danger"
        size="icon"
        onClick={onRemove}
        disabled={!canRemove}
        aria-label={`Supprimer la réponse ${index + 1}`}
      >
        <Trash2 aria-hidden="true" className="size-4" />
      </Action>
    </li>
  );
}

function QuestionCard({
  question,
  position,
  onPatch,
  onDelete,
}: {
  question: EditableQuestion;
  position: number;
  onPatch: (patch: Partial<EditableQuestion>) => void;
  onDelete: () => void;
}) {
  const patchOption = (id: string, patch: Partial<QuestionOption>) =>
    onPatch({
      options: question.options.map((row) => (row.id === id ? { ...row, ...patch } : row)),
    });

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

      <ul className="mt-3 space-y-2 pl-9">
        {question.options.map((option, index) => (
          <OptionRow
            key={option.id}
            option={option}
            index={index}
            canRemove={question.options.length > 2}
            onPatch={(patch) => patchOption(option.id, patch)}
            onRemove={() =>
              onPatch({ options: question.options.filter((row) => row.id !== option.id) })
            }
          />
        ))}
      </ul>

      <div className="mt-3 flex items-center justify-between gap-3 pl-9">
        <div className="flex items-center gap-3">
          <label className="text-xs text-ink-soft">
            Poids
            <input
              type="number"
              min={1}
              max={5}
              aria-label={`Poids de la question ${position}`}
              value={question.weight}
              onChange={(event) => onPatch({ weight: Number(event.target.value) })}
              className="ml-2 h-9 w-16 rounded-lg border border-brand/15 px-2"
            />
          </label>

          <Action
            tone="soft"
            size="sm"
            onClick={() =>
              onPatch({
                options: [
                  ...question.options,
                  {
                    id: `${question.id}-o${question.options.length + 1}-${Date.now()}`,
                    label: "",
                    value: question.options.length,
                  },
                ],
              })
            }
            disabled={question.options.length >= 6}
          >
            <Plus aria-hidden="true" className="size-4" /> Réponse
          </Action>
        </div>

        <Action tone="danger" size="icon" onClick={onDelete} aria-label="Supprimer la question">
          <Trash2 aria-hidden="true" className="size-4" />
        </Action>
      </div>
    </article>
  );
}

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
}: {
  questions: EditableQuestion[];
  version: number | null;
  dirty: boolean;
  publishing: boolean;
  onPatch: (id: string, patch: Partial<EditableQuestion>) => void;
  onAdd: () => void;
  onDelete: (id: string) => void;
  onPublish: () => void;
  onReset: () => void;
}) {
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
        versions déjà publiées ne sont jamais modifiées : les candidats dont la certification est
        en cours ou déjà passée conservent le barème sous lequel ils ont répondu.
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
