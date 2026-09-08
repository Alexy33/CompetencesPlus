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
      .meta({ description: "Score minimal, sur 100, pour valider l'évaluation." }),
  }),
);

export const CertificationStateSchema = named(
  "CertificationState",
  z.object({
    status: z
      .enum(["not_started", "in_progress", "submitted"])
      .meta({ description: "Etat de la tentative courante." }),
    answers: z.record(z.string(), z.string()).meta({
      description:
        "Reponses enregistrees : identifiant de question -> identifiant de l'option choisie. " +
        "Les points ne sont pas exposes.",
    }),
    answered: z.number().int(),
    questionCount: z.number().int(),
    questionnaireVersion: z.number().int().meta({
      description:
        "Version du questionnaire de la tentative. Figee a son ouverture : une tentative n'est jamais rejouee sous une version ulterieure.",
    }),
    currentQuestionnaireVersion: z
      .number()
      .int()
      .meta({ description: "Version du questionnaire actuellement en vigueur." }),
    outdated: z.boolean().meta({
      description:
        "Vrai si la certification obtenue porte sur une version anterieure : le candidat doit repasser le questionnaire. Le badge deja acquis reste visible des recruteurs.",
    }),
    catchUp: z
      .boolean()
      .meta({ description: "Vrai si la tentative en cours est un rattrapage de certification." }),
    pendingQuestionIds: z.array(z.string()).meta({
      description:
        "Rattrapage : questions restant a repondre. Les autres reponses ont ete reportees depuis la tentative precedente. Vide pour une passation ordinaire.",
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
    answers: z.record(z.string(), z.string()).meta({
      description:
        "Reponses a fusionner avec celles deja enregistrees : identifiant de question -> " +
        "identifiant de l'option choisie. Les points rapportes ne transitent jamais par le " +
        "client, ils sont resolus par le serveur depuis le questionnaire de la tentative.",
    }),
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
    currentQuestionnaireVersion: z
      .number()
      .int()
      .meta({ description: "Version du questionnaire actuellement en vigueur." }),
    outdated: z.boolean().meta({
      description: "Vrai si une version plus recente est parue : le questionnaire est a repasser.",
    }),
  }),
);
