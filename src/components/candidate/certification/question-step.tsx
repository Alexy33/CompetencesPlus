"use client";

import { ArrowLeft, ArrowRight, Check, Loader2, Save } from "lucide-react";

import { Action } from "@/components/common/action";
import { ErrorMessage } from "@/components/common/feedback";
import type { CertificationQuestion } from "./types";

function OptionButton({
  label,
  active,
  disabled,
  onSelect,
}: {
  label: string;
  active: boolean;
  disabled: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onSelect}
      disabled={disabled}
      className={`flex min-h-16 items-center gap-4 rounded-2xl border px-5 py-4 text-left text-sm font-semibold transition-colors md:text-base ${
        active
          ? "border-brand bg-brand-200 text-brand-800"
          : "border-brand/15 bg-white text-ink-muted hover:border-brand/50 hover:bg-panel"
      }`}
    >
      <span
        className={`flex size-6 shrink-0 items-center justify-center rounded-full border ${
          active ? "border-brand bg-brand text-white" : "border-brand/25"
        }`}
      >
        {active ? <Check aria-hidden="true" className="size-3.5" /> : null}
      </span>
      {label}
    </button>
  );
}

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
}: {
  question: CertificationQuestion;
  position: number;
  total: number;
  selected: number | undefined;
  busy: boolean;
  error: string | null;
  onAnswer: (value: number) => void;
  onPrevious: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
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
        {question.options.map((option, optionIndex) => (
          <OptionButton
            key={option.id}
            label={option.label}
            active={selected === optionIndex}
            disabled={busy}
            onSelect={() => onAnswer(optionIndex)}
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
