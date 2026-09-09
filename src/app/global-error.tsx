"use client";

import { Action, ActionLink } from "@/components/common/action";
import { ErrorPageShell } from "@/components/layout/error-page-shell";
import type { ErrorBoundaryProps } from "@/types/pages";
import { RotateCcw } from "lucide-react";
import { useEffect } from "react";
import "./globals.css";

export default function GlobalError({ error, reset }: ErrorBoundaryProps) {
  useEffect(() => {
    console.error("[app] erreur de mise en page racine :", error);
  }, [error]);

  return (
    <html lang="fr">
      <body className="min-h-screen antialiased">
        <title>Erreur du service — ProfilsActifs</title>

        <ErrorPageShell
          code="500"
          title="Le service a rencontré une erreur"
          description="Une erreur inattendue est survenue de notre côté. Vous pouvez réessayer : si elle persiste, revenez dans quelques instants."
          actions={
            <>
              <Action size="lg" className="rounded-2xl" onClick={() => reset()}>
                <RotateCcw aria-hidden="true" className="size-4" />
                Réessayer
              </Action>
              <ActionLink href="/" tone="outline" size="lg" className="rounded-2xl">
                Retour à l&apos;accueil
              </ActionLink>
            </>
          }
        >
          {error.digest ? (
            <p className="mt-8 font-mono text-xs uppercase tracking-wider text-ink-soft">
              Référence de l&apos;incident : {error.digest}
            </p>
          ) : null}
        </ErrorPageShell>
      </body>
    </html>
  );
}
