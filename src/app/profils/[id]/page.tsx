import { ProfileActions } from "@/components/catalogue/profile-actions";
import { ProfileCertification } from "@/components/catalogue/profile-certification";
import { ProfileDetails } from "@/components/catalogue/profile-details";
import { ProfileHeading } from "@/components/catalogue/profile-heading";
import { SiteShell } from "@/components/layout/site-shell";
import { getCurrentSession } from "@/lib/auth-session";
import type { UserRole } from "@/lib/vocabulary";
import { findProfileById, recordProfileView, type SessionLike } from "@/server/services/profiles";
import { getSettings } from "@/server/services/settings";
import type { ProfilePageProps } from "@/types/pages";
import { ArrowLeft } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

async function loadPublishedProfile(id: string, session?: SessionLike) {
  const found = await findProfileById(id, session);
  if (!found || found.status !== "published") return null;
  return found;
}

export async function generateMetadata({ params }: ProfilePageProps): Promise<Metadata> {
  const { id } = await params;
  const profile = await loadPublishedProfile(id);

  if (!profile) return { title: "Profil introuvable" };

  return {
    title: `${profile.name} — ${profile.title}`,
    description: profile.bio.slice(0, 160),
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
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

          <ProfileHeading profile={profile} />

          <div className="mt-8 grid items-start gap-8 xl:grid-cols-[minmax(0,1.45fr)_minmax(320px,0.75fr)] xl:gap-10">
            <ProfileDetails profile={profile} />

            <aside className="space-y-5 xl:sticky xl:top-8 xl:self-start">
              <ProfileCertification profile={profile} threshold={settings.certificationThreshold} />

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
