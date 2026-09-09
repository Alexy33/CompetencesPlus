import { MentionDroits } from "@/components/layout/mention-droits";
import { ProductName } from "@/components/layout/product-name";
import { PublicNotice } from "@/components/layout/public-notice";
import type { ErrorPageShellProps } from "./types";

export function ErrorPageShell({
  code,
  title,
  description,
  actions,
  children,
}: ErrorPageShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <MentionDroits />

      <header className="flex h-20 items-center px-5 md:px-10">
        <ProductName />
      </header>

      <main className="flex flex-1 items-center justify-center px-5 py-16 md:px-10">
        <div className="w-full max-w-2xl text-center">
          <p className="font-mono text-6xl font-bold tracking-tight text-brand-300 md:text-7xl">
            {code}
          </p>

          <h1 className="mt-6 text-3xl font-extrabold uppercase tracking-tight text-ink md:text-4xl">
            {title}
          </h1>

          <p className="mx-auto mt-4 max-w-xl text-base leading-relaxed text-ink-muted">
            {description}
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">{actions}</div>

          {children}
        </div>
      </main>

      <PublicNotice />
    </div>
  );
}
