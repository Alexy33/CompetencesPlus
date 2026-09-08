import { eq } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import type { UserRole } from "@/lib/vocabulary";

export const DEMO_PASSWORD = "demo1234";

export async function createAccount(
  name: string,
  email: string,
  role: UserRole,
  birthDate: string,
): Promise<string> {
  const created = await auth.api.signUpEmail({
    body: { name, email, password: DEMO_PASSWORD, birthDate },
  });

  if (role !== "candidate") {
    await db.update(user).set({ role }).where(eq(user.id, created.user.id));
  }

  return created.user.id;
}
