import type { NextRequest } from "next/server";
import { z } from "zod";

import { auth, type Session } from "@/lib/auth";
import { ApiError, type ApiErrorDetail } from "../http";
import { inlineSchema } from "./schemas";
import type { Access } from "./route-definition";

function toDetails(error: z.ZodError, scope: string): ApiErrorDetail[] {
  return error.issues.map((issue) => ({
    path: [scope, ...issue.path.map(String)].filter(Boolean).join("."),
    message: issue.message,
  }));
}

export function parseOrThrow<T extends z.ZodType>(
  schema: T,
  value: unknown,
  scope: string,
): z.output<T> {
  const result = schema.safeParse(value);
  if (result.success) return result.data;

  throw ApiError.badRequest(`Parametres invalides (${scope}).`, toDetails(result.error, scope));
}

export function arrayFields(schema: z.ZodType): Set<string> {
  const json = inlineSchema(schema, "input") as {
    properties?: Record<string, { type?: string }>;
  };

  const fields = new Set<string>();
  for (const [key, property] of Object.entries(json.properties ?? {})) {
    if (property?.type === "array") fields.add(key);
  }
  return fields;
}

export function readQuery(url: URL, arrays: Set<string>): Record<string, unknown> {
  const raw: Record<string, unknown> = {};

  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    raw[key] = arrays.has(key) ? values : values[values.length - 1];
  }

  return raw;
}

export async function readBody(request: NextRequest): Promise<unknown> {
  const text = await request.text();
  if (!text.trim()) return {};

  try {
    return JSON.parse(text);
  } catch {
    throw ApiError.badRequest("Corps de requete illisible : JSON attendu.");
  }
}

export async function requireAccess(request: NextRequest, access: Access): Promise<Session> {
  const session = (await auth.api.getSession({ headers: request.headers })) as Session | null;

  if (!session) throw ApiError.unauthorized();
  if (access === "authenticated") return session;
  if (session.user.role !== access) {
    throw ApiError.forbidden(`Cette ressource est reservee au role « ${access} ».`);
  }

  return session;
}
