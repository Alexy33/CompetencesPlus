import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export const fieldControl =
  "mt-2 h-11 w-full rounded-xl border border-brand/20 bg-white px-4 text-sm text-ink outline-none transition-colors focus:border-brand";

export function Field({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <label
      className={cn("block text-xs font-semibold uppercase tracking-wider text-ink-soft", className)}
    >
      {label}
      {children}
    </label>
  );
}

export function FieldLegend({ children }: { children: ReactNode }) {
  return (
    <span className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-soft">
      {children}
    </span>
  );
}
