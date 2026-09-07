import type { ComponentProps, ReactNode } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const surface = cva("rounded-3xl", {
  variants: {
    tone: {
      raised: "bg-canvas shadow-raised-xl",
      elevated: "bg-canvas shadow-raised-2xl",
      outlined: "border border-brand-300 bg-panel",
      plain: "border border-brand/15 bg-white",
    },
    padding: { md: "p-6", lg: "p-7", responsive: "p-6 md:p-8" },
  },
  defaultVariants: { tone: "outlined", padding: "md" },
});

export function Surface({
  tone,
  padding,
  className,
  ...props
}: ComponentProps<"section"> & VariantProps<typeof surface>) {
  return <section className={cn(surface({ tone, padding }), className)} {...props} />;
}

export function SurfaceHeading({
  title,
  description,
  icon,
  action,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-3">
        {icon ? (
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-info text-info-fg">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-xl font-bold uppercase text-ink md:text-2xl">{title}</h2>
          {description ? <p className="mt-1 text-sm text-ink-soft">{description}</p> : null}
        </div>
      </div>
      {action}
    </div>
  );
}
