import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

export function CtaSection() {
  return (
    <section className="pb-20 pt-6 md:pb-28 md:pt-10">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="p-8 md:p-12 lg:p-14">
          <div className="grid items-center gap-10 lg:grid-cols-[1fr_auto]">
            <div>
              <h2 className="mt-6 max-w-3xl text-3xl font-bold uppercase leading-tight tracking-tight text-ink md:text-5xl">
                Montrez ce que votre CV
                <span className="text-brand"> ne peut pas montrer.</span>
              </h2>

              <p className="mt-5 max-w-2xl text-base leading-relaxed text-ink-muted">
                Créez votre profil, mettez en avant vos compétences et commencez votre parcours de
                certification.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-wider text-ink-muted">
                <span className="transition-colors duration-300 hover:text-brand">Créer</span>
                <ArrowRight className="size-4 text-brand/50" />
                <span className="transition-colors duration-300 hover:text-brand">Compléter</span>
                <ArrowRight className="size-4 text-brand/50" />
                <span className="transition-colors duration-300 hover:text-brand">Certifier</span>
                <ArrowRight className="size-4 text-brand/50" />
                <span className="text-brand">Être visible</span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
              <Button
                asChild
                size="lg"
                className="group/button h-14 rounded-2xl bg-action px-8 text-base font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-action-hover"
              >
                <Link href="/register">
                  Commencer
                  <ArrowRight className="ml-2 size-5 transition-transform duration-300 group-hover/button:translate-x-1.5" />
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-14 rounded-2xl border border-brand/15 bg-transparent px-8 text-base font-semibold text-ink transition-all duration-300 hover:-translate-y-1 hover:bg-brand/5"
              >
                <Link href="/login">Se connecter</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
