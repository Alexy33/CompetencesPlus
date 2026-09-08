"use client";

import { ProductName } from "@/components/layout/product-name";
import { PublicNotice } from "@/components/layout/public-notice";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="fr">
      <body>
        <main className="flex min-h-screen flex-col bg-canvas text-ink">
          <header className="flex h-20 items-center px-6 md:px-10"><ProductName /></header>
          <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
            <p className="font-mono text-sm font-bold uppercase tracking-widest text-brand">Erreur 500</p>
            <h1 className="mt-4 text-4xl font-bold">Une erreur est survenue</h1>
            <p className="mt-3 max-w-md text-ink-muted">Le service rencontre un problème temporaire.</p>
            <button type="button" onClick={reset} className="bouton-action mt-8">Réessayer</button>
          </section>
          <PublicNotice />
        </main>
      </body>
    </html>
  );
}
