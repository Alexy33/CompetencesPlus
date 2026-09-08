import Link from "next/link";

import { ProductName } from "@/components/layout/product-name";
import { PublicNotice } from "@/components/layout/public-notice";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col bg-canvas text-ink">
      <header className="flex h-20 items-center px-6 md:px-10"><ProductName /></header>
      <section className="flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="font-mono text-sm font-bold uppercase tracking-widest text-brand">Erreur 404</p>
        <h1 className="mt-4 text-4xl font-bold">Page introuvable</h1>
        <p className="mt-3 max-w-md text-ink-muted">La page demandée n’existe pas ou n’est plus disponible.</p>
        <Link href="/" className="bouton-action mt-8">Retour à l’accueil</Link>
      </section>
      <PublicNotice />
    </main>
  );
}
