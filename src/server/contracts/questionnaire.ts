import { z } from "zod";
import { named } from "../openapi/schemas";
import { QUESTION_TYPES, mutable } from "@/lib/vocabulary";

/**
 * Schema du fichier `certification/questions.vN.json`.
 *
 * Ce n'est pas un schema d'API : il decrit le questionnaire versionne, seule
 * source de verite du bareme. La validation est volontairement stricte —
 * un questionnaire invalide ne doit JAMAIS etre charge partiellement.
 */

export const QuestionTypeSchema = named("QuestionType", z.enum(mutable(QUESTION_TYPES)));

const QuestionOptionFile = z.object({
  id: z.string().trim().min(1),
  label: z.string().trim().min(1).max(300),
  value: z.number().int().min(0),
});

const QuestionFile = z.object({
  id: z.string().trim().min(1),
  text: z.string().trim().min(1).max(500),
  type: QuestionTypeSchema,
  weight: z.number().int().min(1).max(5),
  options: z.array(QuestionOptionFile).default([]),
});

/**
 * Les types a choix imposent au moins deux reponses, des identifiants
 * d'option uniques et des points distincts (deux reponses au meme bareme
 * rendraient le choix arbitraire).
 */
const CHOICE_TYPES = new Set(["single_choice"]);

const QuestionEntry = QuestionFile.superRefine((question, ctx) => {
  if (!CHOICE_TYPES.has(question.type)) return;

  if (question.options.length < 2) {
    ctx.addIssue({
      code: "custom",
      path: ["options"],
      message: `un type « ${question.type} » exige au moins deux reponses`,
    });
    return;
  }

  const ids = new Set<string>();
  const values = new Set<number>();

  for (const [index, option] of question.options.entries()) {
    if (ids.has(option.id)) {
      ctx.addIssue({
        code: "custom",
        path: ["options", index, "id"],
        message: `identifiant de reponse en double : « ${option.id} »`,
      });
    }
    ids.add(option.id);

    if (values.has(option.value)) {
      ctx.addIssue({
        code: "custom",
        path: ["options", index, "value"],
        message: `deux reponses rapportent ${option.value} point(s)`,
      });
    }
    values.add(option.value);
  }
});

export const QuestionnaireFileSchema = z
  .object({
    version: z.number().int().min(1),
    questions: z.array(QuestionEntry).min(1),
  })
  .superRefine((file, ctx) => {
    const seen = new Set<string>();

    for (const [index, question] of file.questions.entries()) {
      if (seen.has(question.id)) {
        ctx.addIssue({
          code: "custom",
          path: ["questions", index, "id"],
          message: `identifiant de question en double : « ${question.id} »`,
        });
      }
      seen.add(question.id);
    }
  });

export type QuestionnaireFile = z.infer<typeof QuestionnaireFileSchema>;
export type QuestionnaireQuestion = QuestionnaireFile["questions"][number];
