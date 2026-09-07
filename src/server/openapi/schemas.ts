import { z } from "zod";

export const apiRegistry = z.registry<{ id: string }>();

export function named<T extends z.ZodType>(id: string, schema: T): T {
  apiRegistry.add(schema, { id });
  return schema;
}

type JsonSchema = Record<string, unknown>;

const SAFE_INT_MIN = -9007199254740991;
const SAFE_INT_MAX = 9007199254740991;

function clean(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(clean);
  if (value === null || typeof value !== "object") return value;

  const source = value as JsonSchema;
  const out: JsonSchema = {};
  for (const [key, entry] of Object.entries(source)) {
    if (key === "$schema" || key === "$id") continue;
    if (key === "minimum" && entry === SAFE_INT_MIN && source.type === "integer") continue;
    if (key === "maximum" && entry === SAFE_INT_MAX && source.type === "integer") continue;

    if (key === "pattern" && typeof source.format === "string") continue;
    out[key] = clean(entry);
  }
  return out;
}

const REF_PREFIX = "#/components/schemas/";

export function buildComponentSchemas(): Record<string, JsonSchema> {
  const generated = z.toJSONSchema(apiRegistry, {
    target: "draft-2020-12",
    uri: (id) => `${REF_PREFIX}${id}`,
    io: "output",
    unrepresentable: "any",
  });

  const out: Record<string, JsonSchema> = {};
  for (const [id, schema] of Object.entries(generated.schemas)) {
    out[id] = clean(schema) as JsonSchema;
  }
  return out;
}

export function refIdOf(schema: z.ZodType): string | undefined {
  return apiRegistry.get(schema)?.id;
}

export function schemaObject(schema: z.ZodType, io: "input" | "output" = "output"): JsonSchema {
  const id = refIdOf(schema);
  if (id) return { $ref: `${REF_PREFIX}${id}` };
  return inlineSchema(schema, io);
}

export function inlineSchema(schema: z.ZodType, io: "input" | "output" = "output"): JsonSchema {
  return clean(
    z.toJSONSchema(schema, {
      target: "draft-2020-12",
      io,
      unrepresentable: "any",
    }),
  ) as JsonSchema;
}
