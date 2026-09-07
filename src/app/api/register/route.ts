import { eq } from "drizzle-orm";
import { db } from "@/db";
import { profile, user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { ApiError } from "@/server/http";
import { defineRoute } from "@/server/openapi/routes";
import { errorResponse, VALIDATION_RESPONSE } from "@/server/contracts/common";
import { RegisterBody, RegisteredSchema } from "@/server/contracts/register";
import { createCompany, isSirenTaken } from "@/server/services/companies";

export const dynamic = "force-dynamic";

const CONFLICT_RESPONSE = {
  "409": errorResponse("Adresse e-mail ou SIREN deja utilise.", {
    error: { code: "conflict", message: "Un compte existe deja avec cette adresse e-mail." },
  }),
} as const;

export const { POST } = defineRoute({
  method: "POST",
  path: "/api/register",
  tags: ["Authentification"],
  summary: "Creer un compte",
  description: [
    "Cree un compte **demandeur d'emploi** ou **recruteur**, et ouvre la session.",
    "",
    "Le corps est discrimine par `role` : un recruteur DOIT declarer son",
    "entreprise (raison sociale, SIREN, adresse, secteur, et le poste qu'il y",
    "occupe), un candidat ne le peut pas. Le SIREN est normalise puis verifie",
    "par sa cle de Luhn, et reste unique dans le dispositif.",
    "",
    "Le role `admin` n'est pas accessible : les comptes d'administration sont",
    "crees en base, jamais par l'API.",
  ].join("\n"),
  body: RegisterBody,
  successStatus: 201,
  responses: {
    "201": { description: "Compte cree, session ouverte.", schema: RegisteredSchema },
    ...VALIDATION_RESPONSE,
    ...CONFLICT_RESPONSE,
  },
  handler: async ({ body, request }) => {

    if (body.role === "recruiter" && (await isSirenTaken(body.company.siren))) {
      throw ApiError.conflict(
        "Ce SIREN est deja declare par un autre compte. Rapprochez-vous de la personne qui gere l'espace de votre entreprise.",
      );
    }

    let created: { id: string; email: string };
    try {
      const result = await auth.api.signUpEmail({
        body: {
          name: body.name,
          email: body.email,
          password: body.password,
          birthDate: body.birthDate,
        },
        headers: request.headers,

        asResponse: false,
      });
      created = { id: result.user.id, email: result.user.email };
    } catch (error) {

      const status = (error as { statusCode?: number }).statusCode;
      if (status === 400 || status === 422) {
        const message = (error as { body?: { message?: string } }).body?.message ?? "";
        if (/exist/i.test(message)) {
          throw ApiError.conflict("Un compte existe deja avec cette adresse e-mail.");
        }
        throw ApiError.badRequest(message || "Inscription refusee.");
      }
      throw error;
    }

    if (body.role === "candidate") {
      return { id: created.id, email: created.email, role: "candidate" as const };
    }

    try {
      await createCompany(created.id, body.company);
    } catch (error) {

      await db.delete(user).where(eq(user.id, created.id));
      throw error;
    }

    await db.update(user).set({ role: "recruiter", updatedAt: new Date() }).where(eq(user.id, created.id));
    await db.delete(profile).where(eq(profile.userId, created.id));

    return { id: created.id, email: created.email, role: "recruiter" as const };
  },
});
