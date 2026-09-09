import { eq } from "drizzle-orm";

import { db } from "@/db";
import { profile, profileSkill } from "@/db/schema";
import { VIDEO_CONSENT_VERSION } from "@/lib/vocabulary";
import type { StoredVideo } from "@/server/video/provider";
import { createAccount } from "./accounts";
import { generateDemoVideo } from "./demo-video";
import { SEED_PROFILES, type SeedProfile } from "./profiles.fixture";

const CONSENT_BACKDATE_MS = 30 * 24 * 60 * 60 * 1000;

async function ownedProfileId(userId: string): Promise<string | undefined> {
  const [row] = await db
    .select({ id: profile.id })
    .from(profile)
    .where(eq(profile.userId, userId))
    .limit(1);

  return row?.id;
}

async function seedOne(item: SeedProfile): Promise<boolean> {
  const userId = await createAccount(item.name, item.email, "candidate", item.birthDate);
  const profileId = await ownedProfileId(userId);

  let stored: StoredVideo | null = null;
  let videoFailed = false;

  if (profileId && item.hasVideo) {
    stored = await generateDemoVideo(item.name, item.title).catch(() => {
      videoFailed = true;
      return null;
    });
  }

  const consentAt = stored ? new Date(Date.now() - CONSENT_BACKDATE_MS) : null;

  await db
    .update(profile)
    .set({
      title: item.title,
      sector: item.sector,
      city: item.city,
      bio: item.bio,
      videoId: stored?.videoId ?? null,
      videoProvider: stored?.provider ?? null,
      status: item.status,
      availability: item.availability,
      score: item.score > 0 ? item.score : null,
      certifiedAt: item.score > 0 ? new Date() : null,
      views: item.views,
      contactCount: item.contactCount,
      videoConsentGranted: consentAt !== null,
      videoConsentAt: consentAt,
      videoConsentVersion: consentAt ? VIDEO_CONSENT_VERSION : null,
      videoConsentRevokedAt: null,
    })
    .where(eq(profile.userId, userId));

  if (profileId && item.skills.length > 0) {
    await db.insert(profileSkill).values(item.skills.map((skill) => ({ profileId, skill })));
  }

  return videoFailed;
}

export async function seedProfiles(): Promise<{ count: number; videoFailures: number }> {
  let videoFailures = 0;

  for (const item of SEED_PROFILES) {
    if (await seedOne(item)) videoFailures += 1;
  }

  return { count: SEED_PROFILES.length, videoFailures };
}
