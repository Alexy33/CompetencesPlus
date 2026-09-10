"use client";

import { Action } from "@/components/common/action";
import { Plus, Trash2 } from "lucide-react";
import { OptionRow } from "./question-option-row";
import type { QuestionCardProps, QuestionOption } from "./types";

export function QuestionCard({ question, position, onPatch, onDelete }: QuestionCardProps) {
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
