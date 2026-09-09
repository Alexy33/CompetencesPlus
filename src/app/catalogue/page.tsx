import { CatalogueFilters } from "@/components/catalogue/catalogue-filters";
import { CataloguePagination } from "@/components/catalogue/catalogue-pagination";
import {
  parseCatalogFilters,
  toCarriedParams,
} from "@/components/catalogue/catalogue-search-params";
import { NoResults } from "@/components/catalogue/no-results";
import { ProfileCard } from "@/components/catalogue/profile-card";
import { PageHeader } from "@/components/common/page-header";
import { SiteShell } from "@/components/layout/site-shell";
import { db } from "@/db";
import { favorite } from "@/db/schema";
import { getCurrentSession } from "@/lib/auth-session";
import { CITIES, SECTORS, SKILLS } from "@/lib/vocabulary";
import { catalogViewerOf, searchCatalog } from "@/server/services/profiles";
import { getSettings } from "@/server/services/settings";
import type { CataloguePageProps } from "@/types/pages";
import { eq } from "drizzle-orm";
import type { Metadata } from "next";
import { Suspense } from "react";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Catalogue des profils",
  description:
    "Consultez les profils : compétences, secteur, localisation et évaluation professionnelle. Accessible sans compte recruteur.",
};

async function favoriteIdsOf(recruiterId: string): Promise<Set<string>> {
  const rows = await db
    .select({ profileId: favorite.profileId })
    .from(favorite)
    .where(eq(favorite.recruiterId, recruiterId));

  return new Set(rows.map((row) => row.profileId));
}

export default async function CataloguePage({ searchParams }: CataloguePageProps) {
  const [raw, settings] = await Promise.all([searchParams, getSettings()]);
  const filters = parseCatalogFilters(raw, settings.catalogPageSize);

  const session = await getCurrentSession();
  const { items, meta } = await searchCatalog({ ...filters, viewer: catalogViewerOf(session) });

  const isRecruiter = session?.user.role === "recruiter";
  const favoriteIds = isRecruiter ? await favoriteIdsOf(session.user.id) : new Set<string>();

  return (
    <SiteShell>
      <main className="lg:h-screen lg:overflow-hidden">
        <div className="w-full px-5 pb-24 pt-10 md:px-10 md:pt-14 lg:flex lg:h-full lg:min-h-0 lg:flex-col lg:pb-0 lg:pl-4">
          <PageHeader
            className="lg:shrink-0"
            title="Découvrez les"
            highlight="talents."
            description="Parcourez les compétences et repérez les profils dont les aptitudes ont été évaluées."
            action={
              <p className="font-mono text-sm font-semibold uppercase tracking-wider text-brand">
                {meta.total} profil{meta.total > 1 ? "s" : ""}
              </p>
            }
          />

          <div className="mt-10 grid gap-8 lg:min-h-0 lg:flex-1 lg:grid-cols-[320px_1fr] lg:gap-12">
            <div className="lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pb-8 lg:pr-2">
              <Suspense fallback={<div className="h-[520px] border border-brand/20 bg-white" />}>
                <CatalogueFilters sectors={SECTORS} cities={CITIES} skills={SKILLS} />
              </Suspense>
            </div>

            <div className="lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pb-8 lg:pr-3">
              {items.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  {items.map((profile) => (
                    <ProfileCard
                      key={profile.id}
                      profile={profile}
                      canFavorite={isRecruiter}
                      initialFavorite={favoriteIds.has(profile.id)}
                    />
                  ))}
                </div>
              ) : (
                <NoResults />
              )}

              <CataloguePagination
                page={meta.page}
                totalPages={meta.totalPages}
                params={toCarriedParams(filters)}
              />
            </div>
          </div>
        </div>
      </main>
    </SiteShell>
  );
}
