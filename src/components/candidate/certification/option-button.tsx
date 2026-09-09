"use client";

import { Check } from "lucide-react";
import type { OptionButtonProps } from "./types";

export function OptionButton({ label, active, disabled, onSelect }: OptionButtonProps) {
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
