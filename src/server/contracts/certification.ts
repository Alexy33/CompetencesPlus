import { z } from "zod";
import { named } from "../openapi/schemas";
import { QuestionTypeSchema } from "./questionnaire";

export const QuestionSchema = named(
  "Question",
  z.object({
    id: z.string(),
    text: z.string(),
    type: QuestionTypeSchema,
    position: z.number().int(),
    options: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
      }),
    ),
  }),
);

export const AdminQuestionSchema = named(
  "AdminQuestion",
  QuestionSchema.extend({
    weight: z.number().int().min(1).max(5),
    options: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        value: z.number().int().meta({ description: "Points rapportes par cette reponse." }),
      }),
    ),
  }),
);

export const QuestionnaireSchema = named(
  "Questionnaire",
  z.object({
    version: z
      .number()
      .int()
      .meta({ description: "Version du questionnaire, declaree dans le fichier versionne." }),
    questions: z.array(QuestionSchema),
    threshold: z
      .number()
      .int()
      .meta({ description: "Score minimal, sur 100, pour obtenir le badge JEB." }),
  }),
);

export const CertificationStateSchema = named(
  "CertificationState",
  z.object({
    status: z
      .enum(["not_started", "in_progress", "submitted"])
      .meta({ description: "Etat de la tentative courante." }),
    answers: z
      .record(z.string(), z.number().int())
      .meta({ description: "Reponses enregistrees, indexees par identifiant de question." }),
    answered: z.number().int(),
    questionCount: z.number().int(),
    questionnaireVersion: z.number().int().meta({
      description:
        "Version du questionnaire de la tentative. Figee a son ouverture : une tentative n'est jamais rejouee sous une version ulterieure.",
    }),
    threshold: z.number().int(),
    score: z.number().int().nullable(),
    passed: z.boolean().nullable(),
    submittedAt: z.iso.datetime().nullable(),
  }),
);

export const SaveAnswersBody = named(
  "SaveAnswersInput",
  z.object({
    answers: z
      .record(z.string(), z.number().int().min(0))
      .meta({ description: "Reponses a fusionner avec celles deja enregistrees." }),
  }),
);

export const CertificationResultSchema = named(
  "CertificationResult",
  z.object({
    score: z.number().int().meta({ description: "Score obtenu, sur 100." }),
    threshold: z.number().int(),
    passed: z.boolean(),
    certified: z.boolean().meta({ description: "Etat de certification du profil apres calcul." }),
    questionnaireVersion: z
      .number()
      .int()
      .meta({ description: "Version du questionnaire ayant servi au calcul." }),
  }),
);
