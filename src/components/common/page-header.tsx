import { cn } from "@/lib/utils";
import type { PageHeaderProps } from "./types";

export function PageHeader({
  eyebrow,
  title,
  highlight,
  description,
  action,
  className,
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-wrap items-end justify-between gap-5 border-b border-brand/15 pb-7",
        className,
      )}
    >
      <div>
        {eyebrow ? (
          <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-soft">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="mt-3 text-4xl font-extrabold uppercase leading-tight tracking-tight text-ink md:text-5xl">
          {title}
          {highlight ? <span className="text-brand"> {highlight}</span> : null}
        </h1>
        {description ? (
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-ink-soft">{description}</p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
