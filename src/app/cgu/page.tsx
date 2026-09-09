import { PublicNotice } from "@/components/layout/public-notice";
import { TermsDataAndAccess } from "@/components/legal/terms-data-and-access";
import { TermsParticipation } from "@/components/legal/terms-participation";
import { TermsPurpose } from "@/components/legal/terms-purpose";
import { TermsVersioning } from "@/components/legal/terms-versioning";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export const metadata = {
  title: "CGU",
  description: "Conditions Générales d'Utilisation de ProfilsActifs",
};

export default function CGUPage() {
  return (
    <main className="min-h-screen bg-canvas text-action">
      <header className="sticky top-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-action/10">
        <div className="mx-auto flex h-20 max-w-4xl items-center justify-between px-6 md:px-10">
          <Link
            href="/"
            className="flex items-center gap-2 transition-transform hover:translate-x-0.5"
          >
            <ArrowLeft className="size-5" />
            <span className="font-semibold">Retour</span>
          </Link>
        </div>
      </header>

      <article className="mx-auto max-w-4xl px-6 py-16 md:px-10">
        <div className="prose prose-sm max-w-none text-action">
          <h1 className="text-4xl font-bold tracking-tight text-brand">
            Conditions Générales d'Utilisation
          </h1>
          <p className="mt-2 text-lg text-ink-soft">ProfilsActifs</p>
          <hr className="my-8 border-action/10" />

          <p>
            Les présentes Conditions Générales d'Utilisation, ci-après « CGU », encadrent l'accès et
            l'utilisation de la plateforme <strong>ProfilsActifs</strong>.
          </p>

          <p>
            La publication de ces CGU est conditionnée à leur validation préalable par le service
            juridique compétent.
          </p>

          <TermsPurpose />

          <TermsParticipation />

          <TermsDataAndAccess />

          <TermsVersioning />

          <hr className="my-8 border-action/10" />

          <p className="rounded-lg bg-warning-tint p-4 text-warning-deep">
            <strong>⚠️ Statut :</strong> Ce document est un brouillon en attente de validation
            juridique. Il ne s'agit pas de conditions applicables en l'état.
          </p>

          <div className="mt-12 flex gap-4">
            <Button asChild className="rounded-2xl bg-brand text-white hover:bg-brand-700">
              <Link href="/">Retour à l'accueil</Link>
            </Button>
          </div>
        </div>
      </article>
      <PublicNotice />
    </main>
  );
}
