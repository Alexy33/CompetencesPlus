import { cn } from "@/lib/utils";
import type { PublicNoticeProps } from "./types";

export const PUBLIC_NOTICE =
  "Démonstrateur technique, ne constitue pas un service public en exploitation.";

export function PublicNotice({ className }: PublicNoticeProps) {
  return (
    <footer
      className={cn(
        "border-t border-brand/15 bg-white px-6 py-5 text-center text-sm text-ink-muted",
        className,
      )}
    >
      {PUBLIC_NOTICE}
    </footer>
  );
}
