import Link from "next/link";
import { LuUserRound } from "react-icons/lu";
import { ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { PROFILE_MODULES } from "./landing-content";

export function HeroSection() {
  return (
    <section id="concept" className="py-12 md:py-20">
      <div className="mx-auto grid max-w-[1440px] gap-12 px-6 md:px-10 lg:grid-cols-2 lg:items-center lg:gap-24 xl:gap-40">
        <div className="flex flex-col justify-center">

          <h1 className="text-4xl font-extrabold uppercase leading-tight tracking-tight text-ink sm:text-6xl lg:text-7xl">
            La compétence
            <br />
            se voit,
            <br />
            <span className="text-brand"> se certifie.</span>
          </h1>

          <p className="mt-6 max-w-xl text-base leading-relaxed text-ink-muted md:text-lg">
            ProfilsActifs transforme le CV traditionnel en une présentation
            professionnelle plus vivante : compétences, vidéo et
            certification réunies dans un profil clair et accessible aux
            recruteurs.
          </p>

          <p className="mt-4 font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
            Un outil de mise en relation professionnelle, pas un réseau social.
          </p>

          <div className="mt-10 flex flex-col gap-4 sm:flex-row">
            <Button
              asChild
              size="lg"
              className="group h-14 rounded-2xl bg-action px-8 text-base font-semibold text-white shadow-raised-xl transition-all hover:bg-action-hover active:scale-[0.97]"
            >
              <Link href="/register">
                Créer mon profil
                <ArrowRight className="ml-2 size-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="ghost"
              className="h-14 rounded-2xl bg-canvas px-8 text-base font-semibold text-ink shadow-raised-xl hover:bg-canvas hover:shadow-pressed-sm active:scale-[0.97]"
            >
              <Link href="/catalogue">Consulter les profils</Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-center">
          <div className="w-full rounded-3xl border border-brand-700/15 bg-white p-8 md:p-10">
            <div className="flex items-start justify-between gap-4 border-b border-brand/12 pb-6">
              <div className="flex items-center gap-4">
                <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
                  <LuUserRound aria-hidden="true" className="size-6" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-ink">
                    Votre profil, en un coup d’œil
                  </h2>
                  <p className="mt-1 text-sm text-ink-muted">
                    Tout ce qui aide un recruteur à vous comprendre
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              {PROFILE_MODULES.map((profileModule) => {
                const Icon = profileModule.icon;

                return (
                  <div
                    key={profileModule.title}
                    className="group flex items-center gap-4 rounded-2xl bg-canvas p-4 transition-colors hover:bg-brand/15"
                  >
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand">
                      <Icon aria-hidden="true" className="size-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-ink">
                        {profileModule.title}
                      </h3>
                      <p className="mt-1 text-sm leading-snug text-ink-muted">
                        {profileModule.description}
                      </p>
                    </div>
                    <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-white">
                      <Check aria-hidden="true" className="size-3.5 stroke-[2.5]" />
                    </div>
                  </div>
                );
              })}
            </div>

            <p className="mt-6 border-t border-brand/12 pt-5 text-base leading-relaxed text-ink-muted">
              Un profil unique pour présenter vos compétences aux recruteurs
              et faire reconnaître vos aptitudes par des certificateurs.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
