import { and, eq, isNotNull, ne } from "drizzle-orm";

import { db } from "@/db";
import { profile, user } from "@/db/schema";

const PENDING_VIDEO_EMAIL = "marion.esteve@exemple.fr";
const REJECTED_VIDEO_EMAIL = "yann.kervella@exemple.fr";
const REJECTION_REASON =
  "Le son est inaudible sur toute la seconde moitie de la video. " +
  "Merci de la reenregistrer dans un environnement plus calme.";

async function userIdForEmail(email: string): Promise<string | undefined> {
  const [row] = await db.select({ id: user.id }).from(user).where(eq(user.email, email)).limit(1);
  return row?.id;
}

export async function seedVideoModeration(adminId: string): Promise<void> {
  const decidedAt = new Date();

  const rejectedUserId = await userIdForEmail(REJECTED_VIDEO_EMAIL);
  if (rejectedUserId) {
    await db
      .update(profile)
      .set({
        videoStatus: "rejected",
        videoReviewReason: REJECTION_REASON,
        videoReviewedBy: adminId,
        videoReviewedAt: decidedAt,
      })
      .where(eq(profile.userId, rejectedUserId));
  }

  const waitingUserId = await userIdForEmail(PENDING_VIDEO_EMAIL);

  await db
    .update(profile)
    .set({ videoStatus: "approved", videoReviewedBy: adminId, videoReviewedAt: decidedAt })
    .where(
      and(
        isNotNull(profile.videoUrl),
        eq(profile.videoStatus, "pending"),
        waitingUserId ? ne(profile.userId, waitingUserId) : undefined,
      ),
    );
}
