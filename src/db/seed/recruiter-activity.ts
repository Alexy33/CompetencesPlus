import { eq } from "drizzle-orm";

import { db } from "@/db";
import { contact, favorite, notification, profile, user } from "@/db/schema";
import { RECRUITER_FAVORITES, RECRUITER_PIPELINE } from "./recruiter.fixture";

const DAY_MS = 86_400_000;
const RECRUITER_DISPLAY_NAME = "Hélène Vaugirard";
const MESSAGE_PREVIEW_LENGTH = 70;

const daysAgo = (days: number) => new Date(Date.now() - days * DAY_MS);

async function findProfileByEmail(email: string) {
  const [row] = await db
    .select({ id: profile.id, userId: profile.userId })
    .from(profile)
    .innerJoin(user, eq(profile.userId, user.id))
    .where(eq(user.email, email))
    .limit(1);

  return row;
}

export async function seedRecruiterActivity(recruiterId: string): Promise<void> {
  for (const [index, item] of RECRUITER_PIPELINE.entries()) {
    const target = await findProfileByEmail(item.email);
    if (!target) continue;

    await db.insert(contact).values({
      id: crypto.randomUUID(),
      recruiterId,
      profileId: target.id,
      message: item.message,
      status: item.status,
      createdAt: daysAgo(index + 2),
      updatedAt: daysAgo(index),
    });

    await db.insert(notification).values({
      id: crypto.randomUUID(),
      userId: target.userId,
      type: "contact",
      text: `${RECRUITER_DISPLAY_NAME} (recruteur) vous a contacté·e : « ${item.message.slice(0, MESSAGE_PREVIEW_LENGTH)}… »`,
      readAt: index === 0 ? null : daysAgo(index),
      createdAt: daysAgo(index + 2),
    });
  }

  for (const [index, email] of RECRUITER_FAVORITES.entries()) {
    const target = await findProfileByEmail(email);
    if (!target) continue;

    await db
      .insert(favorite)
      .values({ recruiterId, profileId: target.id, createdAt: daysAgo(index + 1) })
      .onConflictDoNothing();
  }
}
