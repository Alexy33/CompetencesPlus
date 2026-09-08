import { Info } from "lucide-react";

import { MENTION_DROITS_ALLOCATIONS } from "@/lib/mentions";
import { cn } from "@/lib/utils";

export function MentionDroits({ className }: { className?: string }) {
  return (
    <div
      role="note"
      aria-label="Information sur l'usage des données"
      data-testid="mention-droits"
      className={cn("border-b border-brand-300 bg-brand-100", className)}
    >
      <p className="mx-auto flex max-w-7xl items-start gap-2.5 px-5 py-2.5 text-sm leading-snug text-brand-800 md:px-10">
        <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
        <span>{MENTION_DROITS_ALLOCATIONS}</span>
      </p>
    </div>
  );
}
