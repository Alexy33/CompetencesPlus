import { cn } from "@/lib/utils";
import { AlertCircle, Loader2 } from "lucide-react";
import type {
  EmptyStateProps,
  ErrorMessageProps,
  FormAlertProps,
  LoadingBlockProps,
  StatusMessageProps,
} from "./types";

export function StatusMessage({ children, className }: StatusMessageProps) {
  if (!children) return null;

  return (
    <p
      role="status"
      className={cn(
        "rounded-xl border border-brand-300 bg-brand-200 px-4 py-3 text-sm text-brand-800",
        className,
      )}
    >
      {children}
    </p>
  );
}

export function ErrorMessage({ children, className }: ErrorMessageProps) {
  if (!children) return null;

  return (
    <p
      role="alert"
      className={cn("rounded-xl bg-danger px-4 py-3 text-sm text-danger-fg", className)}
    >
      {children}
    </p>
  );
}

export function FormAlert({ children }: FormAlertProps) {
  if (!children) return null;

  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-base text-destructive"
    >
      <AlertCircle aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <p>{children}</p>
    </div>
  );
}

export function EmptyState({ children }: EmptyStateProps) {
  return (
    <div className="rounded-2xl border border-dashed border-brand/25 px-5 py-10 text-center text-sm text-ink-soft">
      {children}
    </div>
  );
}

export function LoadingBlock({ label = "Chargement" }: LoadingBlockProps) {
  return (
    <div role="status" aria-label={label} className="flex justify-center py-24">
      <Loader2 aria-hidden="true" className="size-7 animate-spin text-brand" />
    </div>
  );
}
