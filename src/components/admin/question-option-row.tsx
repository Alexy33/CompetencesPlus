"use client";

import { Action } from "@/components/common/action";
import { Trash2 } from "lucide-react";
import type { OptionRowProps } from "./types";

export function OptionRow({ option, index, canRemove, onPatch, onRemove }: OptionRowProps) {
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
