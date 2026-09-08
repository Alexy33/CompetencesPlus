import { db } from "@/db";
import { notification } from "@/db/schema";

export async function notify(
  userId: string,
  type: "contact" | "moderation" | "certification",
  text: string,
): Promise<void> {
  await db.insert(notification).values({
    id: crypto.randomUUID(),
    userId,
    type,
    text,
  });
}
