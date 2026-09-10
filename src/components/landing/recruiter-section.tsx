import { Button } from "@/components/ui/button";
import { ArrowRight, BriefcaseBusiness, ShieldCheck } from "lucide-react";
import Link from "next/link";

export function RecruiterSection() {
  return (
    <section id="recruteurs" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="overflow-hidden rounded-[2rem] border border-brand/15 bg-white/55">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">
            <div className="relative flex flex-col justify-center p-8 md:p-12 lg:p-14">
              <h2 className="mt-6 max-w-xl text-3xl font-bold uppercase leading-tight tracking-tight text-ink md:text-5xl">
                Trouvez les bons profils
                <span className="text-brand"> plus rapidement.</span>
              </h2>

              <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted">
                Recherchez des candidats selon leurs compétences, leur secteur et leur localisation,
                puis consultez directement les profils qui correspondent à vos besoins.
              </p>

              <div className="mt-8">
                <Button
                  asChild
                  className="group h-12 rounded-2xl bg-action px-6 font-semibold text-white transition-all duration-300 hover:-translate-y-1 hover:bg-action-hover"
                >
                  <Link href="/catalogue">
                    Parcourir le catalogue
                    <ArrowRight className="ml-2 size-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                  </Link>
                </Button>
              </div>
            </div>

            <div className="grid border-t border-brand/10 sm:grid-cols-2 lg:border-l lg:border-t-0">
              <div className="group relative overflow-hidden border-b border-brand/10 p-8 transition-all duration-500 hover:bg-brand/5 sm:border-b-0 sm:border-r">
                <div className="absolute right-6 top-6 font-mono text-5xl font-bold text-brand-500/45 transition-all duration-500 group-hover:text-brand-500/75">
                  01
                </div>

                <div className="flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand transition-all duration-500 group-hover:-rotate-3 group-hover:scale-110 group-hover:bg-brand group-hover:text-white">
                  <BriefcaseBusiness className="size-6 stroke-[1.6]" />
                </div>

                <h3 className="mt-10 text-xl font-bold uppercase tracking-tight text-ink">
                  Recherche ciblée
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  Filtrez les profils par secteur, localisation et compétences pour aller
                  directement aux candidats les plus pertinents.
                </p>

                <div className="mt-8 h-px overflow-hidden bg-brand/15">
                  <div className="h-full w-0 bg-brand transition-all duration-700 group-hover:w-full" />
                </div>
              </div>

              <div className="group relative overflow-hidden p-8 transition-all duration-500 hover:bg-brand/5">
                <div className="absolute right-6 top-6 font-mono text-5xl font-bold text-brand-500/45 transition-all duration-500 group-hover:text-brand-500/75">
                  02
                </div>

                <div className="flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand transition-all duration-500 group-hover:rotate-3 group-hover:scale-110 group-hover:bg-brand group-hover:text-white">
                  <ShieldCheck className="size-6 stroke-[1.6]" />
                </div>

                <h3 className="mt-10 text-xl font-bold uppercase tracking-tight text-ink">
                  Profils certifiés
                </h3>

                <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                  Identifiez rapidement les candidats ayant validé leur certification et consultez
                  leurs aptitudes professionnelles.
                </p>

                <div className="mt-8 h-px overflow-hidden bg-brand/15">
                  <div className="h-full w-0 bg-brand transition-all duration-700 group-hover:w-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="border-t border-brand/10 px-8 py-5 md:px-12">
            <div className="flex flex-wrap items-center gap-4 text-xs font-semibold uppercase tracking-wider text-ink-muted">
              <span className="transition-colors hover:text-brand">Rechercher</span>
              <ArrowRight className="size-4 text-brand/50" />
              <span className="transition-colors hover:text-brand">Comparer</span>
              <ArrowRight className="size-4 text-brand/50" />
              <span className="transition-colors hover:text-brand">Consulter</span>
              <ArrowRight className="size-4 text-brand/50" />
              <span className="text-brand">Contacter</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
