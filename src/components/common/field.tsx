import { cn } from "@/lib/utils";
import type { FieldLegendProps, FieldProps } from "./types";

export const fieldControl =
  "mt-2 h-11 w-full rounded-xl border border-brand/20 bg-white px-4 text-sm text-ink outline-none transition-colors focus:border-brand";

export function Field({ label, className, children }: FieldProps) {
  return (
    <label
      className={cn(
        "block text-xs font-semibold uppercase tracking-wider text-ink-soft",
        className,
      )}
    >
      {label}
      {children}
    </label>
  );
}

export function FieldLegend({ children }: FieldLegendProps) {
  return (
    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-soft">
      {children}
    </span>
  );
}
