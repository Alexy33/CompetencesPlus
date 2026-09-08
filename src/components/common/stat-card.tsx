import type { ComponentType, ReactNode } from "react";

import { cn } from "@/lib/utils";

export type StatTone = "brand" | "success" | "warning" | "info" | "danger";

const TONE_STYLES: Record<StatTone, string> = {
  brand: "bg-brand-200 text-brand-800",
  success: "bg-success text-success-fg",
  warning: "bg-warning text-warning-fg",
  info: "bg-info text-info-fg",
  danger: "bg-danger text-danger-fg",
};

export interface Stat {
  label: string;
  value: ReactNode;
  icon: ComponentType<{ className?: string }>;
  tone: StatTone;
}

export function StatCard({ label, value, icon: Icon, tone }: Stat) {
  return (
    <article className="flex items-center gap-4 rounded-2xl border border-brand/15 bg-white p-4 sm:p-5">
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-xl",
          TONE_STYLES[tone],
        )}
      >
        <Icon className="size-5" />
      </span>
      <div className="min-w-0">
        <p className="truncate text-xl font-extrabold text-ink sm:text-2xl">{value}</p>
        <p className="mt-0.5 text-xs text-ink-soft">{label}</p>
      </div>
    </article>
  );
}

export function StatGrid({ stats, className }: { stats: Stat[]; className?: string }) {
  return (
    <section className={cn("grid gap-3", className)}>
      {stats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </section>
  );
}
