import { db } from "@/db";
import { question, questionOption } from "@/db/schema";
import { SEED_QUESTIONS } from "./questions.fixture";

export async function seedQuestions(): Promise<number> {
  for (const [position, item] of SEED_QUESTIONS.entries()) {
    const questionId = crypto.randomUUID();

    await db.insert(question).values({
      id: questionId,
      text: item.text,
      weight: item.weight,
      position,
    });

    await db.insert(questionOption).values(
      item.options.map((label, index) => ({
        id: crypto.randomUUID(),
        questionId,
        label,
        value: index,
        position: index,
      })),
    );
  }

  return SEED_QUESTIONS.length;
}
