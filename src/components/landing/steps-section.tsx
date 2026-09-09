import { ArrowRight } from "lucide-react";
import { STEPS } from "./landing-content";

export function StepsSection() {
  return (
    <section id="fonctionnement" className="py-20 md:py-28">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="mx-auto max-w-3xl text-center">
          <h2 className="mt-5 text-3xl font-bold uppercase tracking-tight text-ink md:text-5xl">
            Votre profil en
            <span className="text-brand"> 3 étapes.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-ink-muted">
            Créez votre profil, valorisez vos compétences et rendez-vous visible auprès des
            recruteurs.
          </p>
        </div>

        <div className="relative mt-16 grid gap-8 md:grid-cols-3 md:gap-12 lg:gap-16">
          {STEPS.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <div key={feature.number} className="relative">
                <article className="group relative h-full overflow-hidden rounded-3xl border border-brand/15 bg-white/55 p-7 transition-all duration-500 hover:-translate-y-2 hover:border-brand/35 hover:bg-white">
                  <div className="absolute left-0 top-0 h-1 w-0 bg-brand transition-all duration-500 group-hover:w-full" />

                  <span className="absolute right-6 top-6 font-mono text-4xl font-bold text-brand-500/45 transition-all duration-500 group-hover:text-brand-500/75">
                    {feature.number}
                  </span>

                  <div className="flex size-14 items-center justify-center rounded-2xl bg-brand/10 text-brand transition-all duration-500 group-hover:rotate-3 group-hover:scale-110 group-hover:bg-brand group-hover:text-white">
                    <Icon className="size-6 stroke-[1.7]" />
                  </div>

                  <div className="mt-10">
                    <h3 className="text-xl font-bold uppercase tracking-tight text-ink">
                      {feature.title}
                    </h3>

                    <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                      {feature.description}
                    </p>
                  </div>

                  <div className="mt-8 flex items-center gap-3">
                    <div className="size-1.5 rounded-full bg-brand" />

                    <div className="h-px flex-1 overflow-hidden bg-brand/15">
                      <div className="h-full w-0 bg-brand transition-all duration-700 group-hover:w-full" />
                    </div>
                  </div>
                </article>

                {index < STEPS.length - 1 && (
                  <div className="absolute -right-12 top-1/2 z-10 hidden -translate-y-1/2 md:flex lg:-right-14">
                    <div className="group/arrow flex size-12 items-center justify-center rounded-full border border-brand/20 bg-canvas text-brand">
                      <ArrowRight className="size-5 animate-[pulse_2s_ease-in-out_infinite] transition-transform duration-300 group-hover/arrow:translate-x-1" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 hidden items-center justify-center gap-3 md:flex">
          {STEPS.map((feature, index) => (
            <div key={feature.number} className="flex items-center gap-3">
              <span className="size-2 rounded-full bg-brand" />

              {index < STEPS.length - 1 && (
                <div className="h-px w-16 bg-gradient-to-r from-brand to-brand/20" />
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
