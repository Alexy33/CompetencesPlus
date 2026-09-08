import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BadgeCheck } from "lucide-react";

import { ProfileVideo } from "@/components/catalogue/profile-video";
import { ProfileActions } from "@/components/catalogue/profile-actions";
import { SiteShell } from "@/components/layout/site-shell";
import { getCurrentSession } from "@/lib/auth-session";
import type { UserRole } from "@/lib/vocabulary";
import {
  findProfileById,
  recordProfileView,
  type SessionLike,
} from "@/server/services/profiles";
import { getSettings } from "@/server/services/settings";

export const dynamic = "force-dynamic";

async function loadPublishedProfile(id: string, session?: SessionLike) {
  const found = await findProfileById(id, session);
  if (!found || found.status !== "published") return null;
  return found;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const profile = await loadPublishedProfile(id);

  if (!profile) return { title: "Profil introuvable" };

  return {
    title: `${profile.name} — ${profile.title}`,
    description: profile.bio.slice(0, 160),
  };
}

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const session = await getCurrentSession();
  const profile = await loadPublishedProfile(id, session ?? undefined);

  if (!profile) notFound();

  await recordProfileView(profile.id);

  const settings = await getSettings();

  return (
    <SiteShell>
      <main>
        <div className="w-full px-5 pb-24 pt-10 md:px-10 md:pt-14 lg:pl-4">
          <Link
            href="/catalogue"
            className="group inline-flex items-center gap-2 font-mono text-xs font-semibold uppercase tracking-wider text-brand transition-colors hover:text-brand-700 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
          >
            <ArrowLeft
              aria-hidden="true"
              className="size-4 transition-transform duration-300 group-hover:-translate-x-1"
            />
            Retour au catalogue
          </Link>

          <div className="mt-7 border-b border-brand/15 pb-7">
            <p className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">
              Profil public · présentation vidéo
            </p>
            <h1 className="mt-3 text-4xl font-extrabold uppercase leading-tight tracking-tight text-ink md:text-5xl">
              {profile.name}
            </h1>
            <p className="mt-2 text-lg text-ink-muted">{profile.title}</p>
          </div>

          <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)] xl:gap-10">
            <div>
              <ProfileVideo video={profile.video} name={profile.name} />

              <div className="mt-5 flex flex-wrap items-center gap-2 font-mono text-[11px] font-semibold uppercase tracking-wider">
                <span className="rounded-full bg-brand-200 px-3 py-1.5 text-brand-800">{profile.city}</span>
                <span className="rounded-full bg-info px-3 py-1.5 text-info-fg">{profile.sector}</span>
              </div>

              {profile.bio ? (
                <div className="mt-6 rounded-3xl border border-brand-300 bg-panel p-6">
                  <h2 className="font-mono text-xs font-semibold uppercase tracking-wider text-ink-muted">Présentation</h2>
                  <p className="mt-3 max-w-[70ch] text-[15.5px] leading-[1.65] text-ink-muted">
                    {profile.bio}
                  </p>
                </div>
              ) : null}

              {profile.skills.length > 0 ? (
                <div className="mt-6 rounded-3xl border border-brand-300 bg-panel p-6">
                  <h2 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.14em] text-ink-muted">
                    Compétences déclarées
                  </h2>
                  <ul className="mt-3 flex flex-wrap gap-1.5">
                    {profile.skills.map((skill) => (
                      <li
                        key={skill}
                        className="rounded-full bg-teal px-3 py-1.5 text-xs font-semibold text-teal-fg"
                      >
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>

            <aside className="space-y-5 xl:sticky xl:top-8 xl:self-start">
              {profile.certified ? (

                <div className="rounded-3xl bg-brand p-7 text-white">
                  <div className="flex items-center gap-2">
                    <BadgeCheck aria-hidden="true" className="size-5 stroke-[2]" />
                    <span className="font-mono text-[10.5px] font-bold uppercase tracking-[0.16em] text-white/80">
                      Badge de certification
                    </span>
                  </div>
                  <p className="mt-4 text-6xl font-bold leading-none tracking-tight">
                    {profile.score}
                    <span className="text-2xl font-bold text-white/70"> / 100</span>
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-white/80">
                    Évaluation des aptitudes professionnelles. Seuil : {settings.certificationThreshold}/100.
                  </p>
                </div>
              ) : (
                <div className="rounded-3xl bg-canvas p-7 shadow-raised-xl">
                  <span className="font-mono text-xs font-bold uppercase tracking-wider text-ink-muted">
                    Badge de certification
                  </span>
                  <p className="mt-5 text-lg font-bold uppercase tracking-tight text-ink">
                    Non certifié
                  </p>
                  <p className="mt-3 text-sm leading-relaxed text-ink-muted">
                    Ce candidat n&apos;a pas encore validé le questionnaire de
                    certification des aptitudes professionnelles.
                  </p>
                </div>
              )}

              {/* Le nombre de sollicitations recues n'est plus affiche ici : c'est
                  un compteur d'engagement, il reste en base et visible du seul
                  titulaire (instruction du cabinet, 7 septembre). */}
              <div className="rounded-3xl bg-canvas p-7 shadow-raised-xl">
                <ProfileActions
                  profileId={profile.id}
                  role={(session?.user.role as UserRole | undefined) ?? null}
                />
              </div>
            </aside>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
