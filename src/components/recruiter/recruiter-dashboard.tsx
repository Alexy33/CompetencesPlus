"use client";

import { ActionLink } from "@/components/common/action";
import { LoadingBlock } from "@/components/common/feedback";
import { PageHeader } from "@/components/common/page-header";
import { StatGrid } from "@/components/common/stat-card";
import type { Stat } from "@/components/common/types";
import { BriefcaseBusiness, CalendarCheck, Heart, Search } from "lucide-react";
import { CompanyPanel } from "./company-panel";
import { ContactPipeline } from "./contact-pipeline";
import { FavoritesPanel } from "./favorites-panel";
import type { RecruiterStats } from "./types";
import { useRecruiterConsole } from "./use-recruiter-console";

function statsOf(stats: RecruiterStats | null): Stat[] {
  return [
    {
      label: "Candidats contactés",
      value: stats?.contacted ?? 0,
      icon: BriefcaseBusiness,
      tone: "brand",
    },
    { label: "Favoris", value: stats?.favorites ?? 0, icon: Heart, tone: "danger" },
    {
      label: "Entretiens planifiés",
      value: stats?.interviewsPlanned ?? 0,
      icon: CalendarCheck,
      tone: "success",
    },
  ];
}

export function RecruiterDashboard() {
  const recruiter = useRecruiterConsole();

  return (
    <main className="mx-auto w-full max-w-[1480px] px-5 pb-24 pt-8 md:px-10 md:pt-12 lg:px-6">
      <PageHeader
        eyebrow="Espace recruteur"
        title="Suivez vos"
        highlight="candidats."
        action={
          <ActionLink href="/catalogue">
            <Search aria-hidden="true" className="size-4" />
            Parcourir le catalogue
          </ActionLink>
        }
      />

      <StatGrid stats={statsOf(recruiter.stats)} className="mt-6 sm:grid-cols-3" />

      {recruiter.loading ? (
        <LoadingBlock />
      ) : (
        <div className="mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.6fr)]">
          <ContactPipeline
            contacts={recruiter.contacts}
            onStatusChange={recruiter.updateContactStatus}
          />

          <div className="space-y-7">
            <CompanyPanel company={recruiter.company} />
            <FavoritesPanel favorites={recruiter.favorites} onRemove={recruiter.removeFavorite} />
          </div>
        </div>
      )}
    </main>
  );
}
