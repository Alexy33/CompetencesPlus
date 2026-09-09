"use client";

import { FileQuestion } from "lucide-react";
import Link from "next/link";

export function UnavailableNotice() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 text-center">
      <FileQuestion aria-hidden="true" className="size-10 text-brand" />
      <h1 className="mt-5 text-2xl font-bold text-ink">Questionnaire indisponible</h1>
      <p className="mt-3 text-ink-soft">
        Aucune question n’est configurée. Demandez à un administrateur d’ajouter le questionnaire.
      </p>
      <Link href="/candidate" className="mt-6 font-semibold text-brand hover:text-brand-700">
        Retour à mon espace
      </Link>
    </main>
  );
}
