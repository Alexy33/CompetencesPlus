import { cn } from "@/lib/utils";
import { surface } from "./surface-variants";
import type { SurfaceHeadingProps, SurfaceProps } from "./types";

export function Surface({ tone, padding, className, ...props }: SurfaceProps) {
  return <section className={cn(surface({ tone, padding }), className)} {...props} />;
}

export function SurfaceHeading({ title, description, icon, action }: SurfaceHeadingProps) {
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
