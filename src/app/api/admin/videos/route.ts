import { and, desc, eq, isNotNull, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/sqlite-core";
import { z } from "zod";
import { db } from "@/db";
import { profile, user } from "@/db/schema";
import { defineRoute } from "@/server/openapi/routes";
import { AUTH_RESPONSES, VideoStatusSchema, VALIDATION_RESPONSE } from "@/server/contracts/common";
import { VideoModerationRowSchema } from "@/server/contracts/admin";
import { named } from "@/server/openapi/schemas";

export const dynamic = "force-dynamic";

const VideoModerationQueueSchema = named(
  "VideoModerationQueue",
  z.object({ items: z.array(VideoModerationRowSchema) }),
);

const moderator = alias(user, "moderator");

export const { GET } = defineRoute({
  method: "GET",
  path: "/api/admin/videos",
  tags: ["Administration"],
  summary: "File de moderation des videos",
  description:
    "Les profils qui portent une video, avec son statut de moderation et la decision deja prise. Seule route qui expose l'URL d'une video non validee.",
  access: "admin",
  query: z.object({
    status: VideoStatusSchema.optional().meta({
      description: "Filtre optionnel. Sans lui, toutes les videos sont renvoyees.",
    }),
  }),
  responses: {
    "200": { description: "Videos a moderer.", schema: VideoModerationQueueSchema },
    ...VALIDATION_RESPONSE,
    ...AUTH_RESPONSES,
  },
  handler: async ({ query }) => {
    const rows = await db
      .select({ profile, name: user.name, moderatorName: moderator.name })
      .from(profile)
      .innerJoin(user, eq(user.id, profile.userId))
      .leftJoin(moderator, eq(moderator.id, profile.videoReviewedBy))
      .where(
        and(
          isNotNull(profile.videoUrl),
          query.status ? eq(profile.videoStatus, query.status) : undefined,
        ),
      )
      .orderBy(
        sql`case ${profile.videoStatus} when 'pending' then 0 when 'rejected' then 1 else 2 end`,
        desc(profile.updatedAt),
      );

    return {
      items: rows.map((row) => ({
        profileId: row.profile.id,
        name: row.name,
        title: row.profile.title,
        videoUrl: row.profile.videoUrl,
        profileStatus: row.profile.status,
        videoStatus: row.profile.videoStatus,
        reason: row.profile.videoReviewReason,
        decidedBy: row.moderatorName,
        decidedAt: row.profile.videoReviewedAt?.toISOString() ?? null,
        submittedAt: row.profile.updatedAt.toISOString(),
      })),
    };
  },
});
