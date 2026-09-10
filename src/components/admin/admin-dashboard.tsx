"use client";

import { LoadingBlock, StatusMessage } from "@/components/common/feedback";
import { PageHeader } from "@/components/common/page-header";
import { StatGrid } from "@/components/common/stat-card";
import type { Stat } from "@/components/common/types";
import { BadgeCheck, Check, ShieldCheck, Users } from "lucide-react";
import { useState } from "react";
import { AdminTabs } from "./admin-tabs";
import { ModerationList } from "./moderation-list";
import { QuestionEditor } from "./question-editor";
import { SettingsForm } from "./settings-form";
import type { AdminStats, Tab } from "./types";
import { useAdminConsole } from "./use-admin-console";
import { VideoModeration } from "./video-moderation";

function statsOf(stats: AdminStats | null): Stat[] {
  return [
    { label: "Profils publiés", value: stats?.publishedProfiles ?? 0, icon: Users, tone: "brand" },
    { label: "En attente", value: stats?.pendingProfiles ?? 0, icon: ShieldCheck, tone: "warning" },
    {
      label: "Certification",
      value: `${stats?.certificationRate ?? 0}%`,
      icon: BadgeCheck,
      tone: "success",
    },
    {
      label: "Contacts recruteurs",
      value: stats?.recruiterContacts ?? 0,
      icon: Check,
      tone: "info",
    },
  ];
}

export function AdminDashboard() {
  const admin = useAdminConsole();
  const [tab, setTab] = useState<Tab>("profils");

  const pendingVideos = admin.videos.filter((row) => row.videoStatus === "pending").length;

  return (
    <main className="mx-auto w-full max-w-[1480px] px-5 pb-24 pt-8 md:px-10 md:pt-12 lg:px-6">
      <PageHeader
        eyebrow="Administration du dispositif"
        title="Pilotez la"
        highlight="plateforme."
      />

      <StatusMessage className="mt-5">{admin.message}</StatusMessage>

      <StatGrid stats={statsOf(admin.stats)} className="mt-6 grid-cols-2 xl:grid-cols-4" />

      {admin.loading ? (
        <LoadingBlock />
      ) : (
        <>
          <AdminTabs current={tab} pendingVideos={pendingVideos} onChange={setTab} />

          {tab === "profils" ? (
            <div className="mt-7 grid items-start gap-7 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
              <ModerationList
                profiles={admin.profiles}
                deletingProfileId={admin.deletingProfileId}
                onModerate={admin.moderate}
                onDelete={admin.deleteProfile}
              />

              <aside className="space-y-7 xl:sticky xl:top-6">
                <SettingsForm
                  settings={admin.settings}
                  onChange={admin.setSettings}
                  onSave={admin.saveSettings}
                />
              </aside>
            </div>
          ) : null}

          {tab === "videos" ? (
            <VideoModeration rows={admin.videos} onDecide={admin.decideVideo} />
          ) : null}

          {tab === "questionnaire" ? (
            <QuestionEditor
              questions={admin.questions}
              version={admin.questionnaireVersion}
              dirty={admin.questionsDirty}
              publishing={admin.publishing}
              onPatch={admin.patchQuestion}
              onAdd={admin.addQuestion}
              onDelete={admin.removeQuestion}
              onPublish={admin.publishQuestionnaire}
              onReset={admin.resetQuestions}
            />
          ) : null}
        </>
      )}
    </main>
  );
}
