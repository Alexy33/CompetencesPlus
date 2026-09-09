import { ActionLink } from "@/components/common/action";
import { ErrorPageShell } from "@/components/layout/error-page-shell";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Page introuvable — ProfilsActifs",
};

export default function NotFound() {
  return (
    <ErrorPageShell
      code="404"
      title="Cette page n'existe pas"
      description="L'adresse demandée ne correspond à aucune page du service. Elle a peut-être été supprimée, ou le lien qui vous a mené ici est incomplet."
      actions={
        <>
          <ActionLink href="/" size="lg" className="rounded-2xl">
            Retour à l&apos;accueil
          </ActionLink>
          <ActionLink href="/catalogue" tone="outline" size="lg" className="rounded-2xl">
            Consulter le catalogue
          </ActionLink>
        </>
      }
    />
  );
}
