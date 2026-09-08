import { sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@/db";
import { named } from "@/server/openapi/schemas";
import { defineRoute } from "@/server/openapi/routes";
import { errorResponse } from "@/server/contracts/common";

export const dynamic = "force-dynamic";

const HealthSchema = named(
  "Health",
  z.object({
    status: z.literal("ok"),
    version: z.string().meta({ description: "Version deployee (depuis package.json)." }),
    db: z.literal("up"),
    ts: z.iso.datetime(),
  }),
);

export const { GET } = defineRoute({
  method: "GET",
  path: "/api/health",
  tags: ["Systeme"],
  summary: "Etat de l'application et de la base",
  description: "Sonde utilisee par le HEALTHCHECK Docker.",
  responses: {
    "200": { description: "Application et base operationnelles.", schema: HealthSchema },
    "503": errorResponse("Base injoignable."),
  },
  handler: () => {
    try {

      db.get(sql`SELECT 1`);
    } catch (error) {

      return Response.json(
        {
          error: {
            code: "internal",
            message: `Base injoignable : ${(error as Error).message}`,
          },
        },
        { status: 503 },
      );
    }
    const version = process.env.npm_package_version || "unknown";
    return {
      status: "ok" as const,
      version,
      db: "up" as const,
      ts: new Date().toISOString(),
    };
  },
});
