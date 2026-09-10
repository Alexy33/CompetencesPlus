"use client";

import { Action } from "@/components/common/action";
import { ErrorMessage } from "@/components/common/feedback";
import { ArrowLeft, ArrowRight, Loader2, Save } from "lucide-react";
import { OptionButton } from "./option-button";
import type { QuestionStepProps } from "./types";

export function QuestionStep({
  question,
  position,
  total,
  selected,
  busy,
  error,
  onAnswer,
  onPrevious,
  onNext,
  onSubmit,
}: QuestionStepProps) {
  const isLast = position === total;

  return (
    <section className="mt-8 border-t border-brand/15 pt-8">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-brand-200 font-mono text-sm font-bold text-brand-800">
          {String(position).padStart(2, "0")}
        </span>
        <span className="inline-flex items-center gap-2 text-xs text-ink-soft">
          <Save aria-hidden="true" className="size-3.5" />
          Réponse sauvegardée automatiquement
        </span>
      </div>

      <h2 className="mt-7 max-w-3xl text-2xl font-bold leading-snug text-ink md:text-3xl">
        {question.text}
      </h2>

      <div className="mt-8 grid gap-3">
        {question.options.map((option) => (
          <OptionButton
            key={option.id}
            label={option.label}
            active={selected === option.id}
            disabled={busy}
            onSelect={() => onAnswer(option.id)}
          />
        ))}
      </div>

      <ErrorMessage className="mt-5">{error}</ErrorMessage>

      <div className="mt-8 flex items-center justify-between gap-4 border-t border-brand/15 pt-6">
        <Action tone="ghost" onClick={onPrevious} disabled={position === 1 || busy}>
          <ArrowLeft aria-hidden="true" className="size-4" />
          Précédent
        </Action>

        {isLast ? (
          <Action onClick={onSubmit} disabled={selected === undefined || busy}>
            {busy ? <Loader2 aria-hidden="true" className="size-4 animate-spin" /> : null}
            Valider le questionnaire
          </Action>
        ) : (
          <Action onClick={onNext} disabled={selected === undefined || busy}>
            Suivant
            <ArrowRight aria-hidden="true" className="size-4" />
          </Action>
        )}
      </div>
    </section>
  );
}
