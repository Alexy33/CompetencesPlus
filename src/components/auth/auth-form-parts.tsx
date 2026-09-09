"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import Link from "next/link";
import type { AuthFieldProps, AuthSubmitProps, AuthSwitchProps } from "./types";

export const authControl =
  "h-11 rounded-xl border-0 bg-canvas px-3.5 text-base shadow-pressed-sm placeholder:text-ink-muted focus-visible:border-0 focus-visible:ring-2 focus-visible:ring-brand/30 md:text-base";

export function AuthField({
  id,
  label,
  hint,
  error,
  className,
  children,
  ...props
}: AuthFieldProps) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={id} className="text-sm text-ink">
        {label}
      </Label>
      <Input id={id} className={cn(authControl, className)} {...props} />
      {hint ? (
        <p id={`${id}-help`} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="text-sm font-medium text-destructive">
          {error}
        </p>
      ) : null}
      {children}
    </div>
  );
}

export function AuthSubmit({ loading, disabled, children }: AuthSubmitProps) {
  return (
    <Button
      type="submit"
      size="lg"
      disabled={loading || disabled}
      className="mt-1 h-11 w-full rounded-xl bg-ink text-base text-white shadow-raised-lg hover:bg-action-hover hover:shadow-pressed-brand"
    >
      {loading ? <Loader2 aria-hidden="true" className="animate-spin" /> : null}
      {children}
    </Button>
  );
}

export function AuthSwitch({ prompt, href, label }: AuthSwitchProps) {
  return (
    <p className="text-center text-base text-ink-muted">
      {prompt}{" "}
      <Link
        href={href}
        className="font-medium text-brand-700 underline underline-offset-4 transition-colors hover:text-brand"
      >
        {label}
      </Link>
    </p>
  );
}
