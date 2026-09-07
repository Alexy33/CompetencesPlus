import type { z } from "zod";

import { inlineSchema, schemaObject } from "./schemas";
import type { AnyRouteDefinition } from "./route-definition";

interface OpenApiParameter {
  name: string;
  in: "path" | "query";
  required: boolean;
  description?: string;
  schema: Record<string, unknown>;
  style?: string;
  explode?: boolean;
}

function parametersFrom(schema: z.ZodType, location: "path" | "query"): OpenApiParameter[] {
  const json = inlineSchema(schema, "input") as {
    properties?: Record<string, Record<string, unknown>>;
    required?: string[];
  };
  const required = new Set(json.required ?? []);

  return Object.entries(json.properties ?? {}).map(([name, propertySchema]) => {
    const { description, ...rest } = propertySchema;

    const parameter: OpenApiParameter = {
      name,
      in: location,
      required: location === "path" ? true : required.has(name),
      schema: rest,
    };

    if (typeof description === "string") parameter.description = description;
    if (rest.type === "array") {
      parameter.style = "form";
      parameter.explode = true;
    }

    return parameter;
  });
}

function capitalize(value: string): string {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function operationIdOf(route: AnyRouteDefinition): string {
  const segments = route.path
    .replace(/^\/api\//, "")
    .split("/")
    .filter(Boolean)
    .map((segment) =>
      segment.startsWith("{") ? `By${capitalize(segment.slice(1, -1))}` : capitalize(segment),
    );

  return route.method.toLowerCase() + segments.join("");
}

function responsesOf(route: AnyRouteDefinition): Record<string, unknown> {
  const responses: Record<string, unknown> = {};

  for (const [status, spec] of Object.entries(route.responses)) {
    const media = spec.schema
      ? {
          schema: schemaObject(spec.schema, "output"),
          ...(spec.example !== undefined ? { example: spec.example } : {}),
        }
      : undefined;

    responses[status] = {
      description: spec.description,
      ...(media ? { content: { "application/json": media } } : {}),
    };
  }

  return responses;
}

export function operationOf(route: AnyRouteDefinition) {
  const parameters = [
    ...(route.params ? parametersFrom(route.params, "path") : []),
    ...(route.query ? parametersFrom(route.query, "query") : []),
  ];

  return {
    tags: route.tags,
    summary: route.summary,
    ...(route.description ? { description: route.description } : {}),
    operationId: operationIdOf(route),
    ...(parameters.length ? { parameters } : {}),
    ...(route.body
      ? {
          requestBody: {
            required: true,
            content: { "application/json": { schema: schemaObject(route.body, "input") } },
          },
        }
      : {}),
    responses: responsesOf(route),
    ...(route.access ? { security: [{ sessionCookie: [] }] } : {}),
  };
}
