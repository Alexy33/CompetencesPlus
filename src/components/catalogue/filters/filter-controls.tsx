"use client";

import { Search } from "lucide-react";
import type { ReactNode } from "react";

import { FieldLegend } from "@/components/common/field";

const CONTROL =
  "h-12 w-full rounded-2xl border-0 bg-canvas text-sm text-ink outline-none transition-all shadow-pressed-sm focus-visible:ring-2 focus-visible:ring-brand/30";

export function FilterGroup({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor?: string;
  children: ReactNode;
}) {
  return (
    <div className="mt-6">
      {htmlFor ? (
        <label
          htmlFor={htmlFor}
          className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-soft"
        >
          {label}
        </label>
      ) : (
        <FieldLegend>{label}</FieldLegend>
      )}
      {children}
    </div>
  );
}

export function SearchFilter({
  value,
  onChange,
  onSubmit,
}: {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
}) {
  return (
    <form
      className="contents"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit();
      }}
    >
      <div className="relative mt-2">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-ink-soft"
        />
        <input
          id="catalogue-search"
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Intitulé, secteur, ville ou compétence"
          className={`${CONTROL} pl-11 pr-4 placeholder:text-ink-soft`}
        />
      </div>
    </form>
  );
}

export function SelectFilter({
  id,
  value,
  placeholder,
  options,
  onChange,
}: {
  id: string;
  value: string;
  placeholder: string;
  options: readonly string[];
  onChange: (value: string) => void;
}) {
  return (
    <select
      id={id}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className={`${CONTROL} mt-2 appearance-none px-4 font-semibold hover:text-brand-700`}
    >
      <option value="">{placeholder}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

export function ToggleFilter({
  active,
  offLabel,
  onLabel,
  onChange,
}: {
  active: boolean;
  offLabel: string;
  onLabel: string;
  onChange: (active: boolean) => void;
}) {
  const base = "h-10 rounded-xl text-sm font-semibold transition-all";
  const idle = "text-ink-soft hover:text-brand-700";

  return (
    <div className="mt-2 grid grid-cols-2 gap-2 rounded-2xl bg-canvas p-1.5 shadow-pressed-xs">
      <button
        type="button"
        aria-pressed={!active}
        onClick={() => onChange(false)}
        className={`${base} ${active ? idle : "bg-canvas text-ink shadow-raised-xs"}`}
      >
        {offLabel}
      </button>
      <button
        type="button"
        aria-pressed={active}
        onClick={() => onChange(true)}
        className={`${base} ${active ? "bg-brand text-white" : idle}`}
      >
        {onLabel}
      </button>
    </div>
  );
}

export function ChipFilter({
  options,
  selected,
  onToggle,
}: {
  options: readonly string[];
  selected: string[];
  onToggle: (value: string) => void;
}) {
  return (
    <div className="mt-3 flex flex-wrap gap-2">
      {options.map((option) => {
        const active = selected.includes(option);

        return (
          <button
            key={option}
            type="button"
            aria-pressed={active}
            onClick={() => onToggle(option)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
              active
                ? "bg-brand text-white shadow-raised-xs"
                : "bg-canvas text-ink-muted shadow-raised-2xs hover:text-brand-700"
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
