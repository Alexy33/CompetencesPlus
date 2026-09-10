import { ConsentManager } from "@/components/candidate/consent-manager";
import { SiteShell } from "@/components/layout/site-shell";
import { getCurrentSession } from "@/lib/auth-session";
import { findProfileByUserId } from "@/server/services/profiles";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Consentement à la diffusion",
  description:
    "Donner ou retirer votre consentement à la diffusion de votre vidéo de présentation.",
};

export default async function ConsentPage() {
  const session = await getCurrentSession();
  if (!session?.user) return null;

  const profile = await findProfileByUserId(session.user.id);
  if (!profile) notFound();

  return (
    <SiteShell>
      <ConsentManager
        initialConsent={profile.videoConsent}
        hasVideo={profile.video.state !== "none"}
      />
    </SiteShell>
  );
}
