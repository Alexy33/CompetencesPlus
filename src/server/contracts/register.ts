import { z } from "zod";
import { named } from "../openapi/schemas";
import { MINIMUM_AGE, isAllowedToRegister } from "@/lib/age";
import { isValidSiren, normalizeSiren } from "@/lib/siren";
import { SectorSchema } from "./common";

const identity = {
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(255),
  password: z.string().min(8).max(200),

  birthDate: z
    .string()
    .trim()
    .refine(isAllowedToRegister, {
      message: `L'inscription est reservee aux personnes de ${MINIMUM_AGE} ans et plus.`,
    })
    .meta({ description: "Date de naissance declarative, « AAAA-MM-JJ »." }),
};

export const CompanyInputSchema = named(
  "CompanyInput",
  z.object({
    name: z
      .string()
      .trim()
      .min(1)
      .max(200)
      .meta({ description: "Raison sociale de l'entreprise." }),
    siren: z
      .string()
      .transform(normalizeSiren)
      .refine(isValidSiren, {
        message: "SIREN invalide : neuf chiffres, cle de Luhn verifiee.",
      })
      .meta({ description: "Neuf chiffres. Les espaces et tirets sont acceptes a la saisie." }),
    position: z
      .string()
      .trim()
      .min(1)
      .max(120)
      .meta({ description: "Poste occupe par la personne AU SEIN de l'entreprise." }),
    address: z.string().trim().min(1).max(200).meta({ description: "Adresse (voie)." }),
    postalCode: z
      .string()
      .trim()
      .regex(/^\d{5}$/, "Code postal invalide : cinq chiffres attendus.")
      .meta({ description: "Code postal a cinq chiffres." }),
    city: z.string().trim().min(1).max(120).meta({ description: "Commune de l'etablissement." }),
    sector: SectorSchema.meta({ description: "Secteur d'activite, meme vocabulaire que les profils." }),
    phone: z
      .string()
      .trim()
      .max(30)
      .optional()
      .meta({ description: "Telephone professionnel. Facultatif." }),
    website: z
      .string()
      .trim()
      .max(200)
      .optional()
      .meta({ description: "Site de l'entreprise. Facultatif." }),
  }),
);

export const RegisterBody = named(
  "RegisterInput",
  z.discriminatedUnion("role", [
    z.object({ role: z.literal("candidate"), ...identity }),
    z.object({ role: z.literal("recruiter"), ...identity, company: CompanyInputSchema }),
  ]),
);

export const CompanySchema = named(
  "Company",
  CompanyInputSchema.extend({
    id: z.string(),
    phone: z.string().nullable(),
    website: z.string().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
  }),
);

export const UpdateCompanyBody = named(
  "UpdateCompanyInput",
  CompanyInputSchema.partial().meta({
    description: "N'envoyez que les champs modifies. Le SIREN reste modifiable, mais unique.",
  }),
);

export const RegisteredSchema = named(
  "Registered",
  z.object({
    id: z.string(),
    email: z.string(),
    role: z.enum(["candidate", "recruiter"]),
  }),
);
