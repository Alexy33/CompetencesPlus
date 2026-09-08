import { betterAuth } from "better-auth";
import { APIError } from "better-auth/api";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { db } from "@/db";
import * as schema from "@/db/schema";
import { MINIMUM_AGE, isAllowedToRegister } from "@/lib/age";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "sqlite",
    schema,
  }),

  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",

  emailAndPassword: {
    enabled: true,

    requireEmailVerification: false,
    minPasswordLength: 8,
  },

  user: {
    additionalFields: {

      role: {
        type: "string",
        required: false,
        defaultValue: "candidate",
        input: false,
      },

      birthDate: {
        type: "string",
        required: false,
        input: true,
      },
    },
  },

  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },

  databaseHooks: {
    user: {
      create: {

        before: async (data) => {
          const asked = (data as { role?: string }).role;
          const role = asked === "recruiter" ? "recruiter" : "candidate";

          const birthDate = (data as { birthDate?: unknown }).birthDate;
          const declared = typeof birthDate === "string" ? birthDate.trim() : "";

          if (!isAllowedToRegister(declared)) {
            throw new APIError("BAD_REQUEST", {
              message:
                `L'inscription est reservee aux personnes de ${MINIMUM_AGE} ans et plus. ` +
                "Indiquez une date de naissance valide.",
            });
          }

          return { data: { ...data, role, birthDate: declared } };
        },

        after: async (created) => {
          if ((created as { role?: string }).role !== "candidate") return;

          const { db } = await import("@/db");
          const { profile } = await import("@/db/schema");

          await db
            .insert(profile)
            .values({
              id: crypto.randomUUID(),
              userId: created.id,

              title: "Intitulé à compléter",
              sector: "Numérique",
              city: "Paris",
            })
            .onConflictDoNothing();
        },
      },
    },
  },

  trustedOrigins: Array.from(
    new Set([
      process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
      "http://localhost:3000",
      "http://127.0.0.1:3000",
      `http://localhost:${process.env.PORT ?? 3000}`,
      `http://127.0.0.1:${process.env.PORT ?? 3000}`,
    ]),
  ),

  advanced: {

    useSecureCookies:
      process.env.BETTER_AUTH_SECURE_COOKIES === "1" ||
      (process.env.BETTER_AUTH_URL ?? "").startsWith("https://"),
  },

  plugins: [nextCookies()],
});

export type Session = typeof auth.$Infer.Session;
export type AuthUser = Session["user"];
