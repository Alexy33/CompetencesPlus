"use client";

import { BadgeCheck, Eye, FileVideo, MessageSquare } from "lucide-react";

import { ActionLink } from "@/components/common/action";
import { StatusMessage } from "@/components/common/feedback";
import { PageHeader } from "@/components/common/page-header";
import { StatGrid, type Stat } from "@/components/common/stat-card";
import { PROFILE_STATUS_LABELS } from "@/lib/labels";
import type { City, Sector, Skill } from "@/lib/vocabulary";
import type { OwnProfile } from "@/server/services/profiles";
import { CertificationPanel } from "./certification-panel";
import { ConsentSummary } from "./consent-summary";
import { NotificationsPanel } from "./notifications-panel";
import { ProfileForm } from "./profile-form";
import { useCandidateDashboard } from "./use-candidate-dashboard";
import { VideoManager } from "./video-manager";
import { VideoModerationNotice } from "./video-moderation-notice";

function statsOf(profile: OwnProfile): Stat[] {
  return [
    { label: "Vues du profil", value: profile.views, icon: Eye, tone: "brand" },
    { label: "Contacts reçus", value: profile.contactCount, icon: MessageSquare, tone: "success" },
    {
      label: "Statut",
      value: PROFILE_STATUS_LABELS[profile.status],
      icon: FileVideo,
      tone: "warning",
    },
    { label: "Score JEB", value: profile.score ?? "—", icon: BadgeCheck, tone: "info" },
  ];
}

export function CandidateDashboard({
  initialProfile,
  sectors,
  cities,
  skills,
  embedEnabled,
}: {
  initialProfile: OwnProfile;
  sectors: readonly Sector[];
  cities: readonly City[];
  skills: readonly Skill[];
  /** Hébergement par lien tiers activé sur ce déploiement (éteint par défaut). */
  embedEnabled: boolean;
}) {
  const dashboard = useCandidateDashboard(initialProfile, embedEnabled);
  const { profile, draft, busy } = dashboard;

  return (
    <main className="mx-auto w-full max-w-[1480px] px-5 pb-24 pt-8 md:px-10 md:pt-12 lg:px-6">
      <PageHeader
        eyebrow="Espace demandeur d'emploi"
        title="Bonjour,"
        highlight={`${profile.name.split(" ")[0]}.`}
        action={
          profile.status === "published" ? (
            <ActionLink href={`/profils/${profile.id}`}>Voir mon profil public</ActionLink>
          ) : null
        }
      />

      <StatusMessage className="mt-5">{dashboard.message}</StatusMessage>

      <StatGrid stats={statsOf(profile)} className="mt-6 grid-cols-2 lg:grid-cols-4" />

      <div className="mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-7">
          <ProfileForm
            draft={draft}
            sectors={sectors}
            cities={cities}
            skills={skills}
            saving={busy === "save"}
            disabled={busy !== null}
            onPatch={dashboard.patchDraft}
            onToggleSkill={dashboard.toggleSkill}
            onSave={dashboard.save}
          />

          <VideoManager
            name={profile.name}
            video={profile.video}
            draftUrl={draft.videoUrl}
            embedEnabled={embedEnabled}
            uploading={busy === "upload"}
            removing={busy === "remove"}
            disabled={busy !== null}
            onDraftUrlChange={(videoUrl) => dashboard.patchDraft({ videoUrl })}
            onUpload={dashboard.uploadVideo}
            onRemove={dashboard.removeVideo}
            onSave={dashboard.save}
          >
            {profile.video.state !== "none" ? (
              <VideoModerationNotice moderation={profile.videoModeration} />
            ) : null}
            <ConsentSummary consent={profile.videoConsent} />
          </VideoManager>
        </div>

        <aside className="space-y-6 xl:sticky xl:top-6">
          <CertificationPanel
            certification={dashboard.certification}
            fallbackScore={profile.score}
          />
          <NotificationsPanel notifications={dashboard.notifications} />
        </aside>
      </div>
    </main>
  );
}
