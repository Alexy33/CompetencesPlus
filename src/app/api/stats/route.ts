import { and, eq, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import { profile } from "@/db/schema";
import { defineRoute } from "@/server/openapi/routes";
import { PublicStatsSchema } from "@/server/contracts/reference";
import { loadQuestions } from "@/server/services/certification";

export const dynamic = "force-dynamic";

export const { GET } = defineRoute({
  method: "GET",
  path: "/api/stats",
  tags: ["Reference"],
  summary: "Compteurs publics du dispositif",
  description: "Chiffres affiches sur la page d'accueil. Accessible sans session.",
  responses: {
    "200": { description: "Compteurs a jour.", schema: PublicStatsSchema },
  },
  handler: async () => {
    const [published] = await db
      .select({
        total: sql<number>`count(*)`,
        certified: sql<number>`sum(case when ${profile.certifiedAt} is not null then 1 else 0 end)`,
        contacts: sql<number>`coalesce(sum(${profile.contactCount}), 0)`,
      })
      .from(profile)
      .where(eq(profile.status, "published"));


    const total = published?.total ?? 0;
    const certified = published?.certified ?? 0;

    return {
      publishedProfiles: total,
      certificationRate: total ? Math.round((certified / total) * 100) : 0,
      questionCount: loadQuestions().length,
      recruiterContacts: published?.contacts ?? 0,
    };
  },
});
