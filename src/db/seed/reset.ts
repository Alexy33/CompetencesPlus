import { db } from "@/db";
import {
  account,
  certificationAnswer,
  certificationAttempt,
  company,
  contact,
  favorite,
  notification,
  profile,
  profileSkill,
  question,
  questionOption,
  session,
  setting,
  user,
  verification,
} from "@/db/schema";

const TABLES = [
  certificationAnswer,
  certificationAttempt,
  company,
  contact,
  favorite,
  notification,
  profileSkill,
  profile,
  questionOption,
  question,
  setting,
  session,
  account,
  verification,
  user,
];

export async function resetDomain(): Promise<void> {
  for (const table of TABLES) {
    await db.delete(table);
  }
}
