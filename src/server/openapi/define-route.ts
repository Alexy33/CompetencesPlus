import type { NextRequest } from "next/server";
import type { z } from "zod";

import { ApiError } from "../http";
import { arrayFields, parseOrThrow, readBody, readQuery, requireAccess } from "./request";
import {
  registerRoute,
  type Access,
  type HandlerContext,
  type HttpMethod,
  type RouteDefinition,
} from "./route-definition";

type NextRouteContext = { params?: Promise<Record<string, string | string[]>> };
type NextRouteHandler = (request: NextRequest, context: NextRouteContext) => Promise<Response>;

const INTERNAL_ERROR = {
  error: { code: "internal", message: "Erreur interne du serveur." },
};

function toResponse(result: unknown, successStatus: number): Response {
  if (result instanceof Response) return result;
  if (successStatus === 204) return new Response(null, { status: 204 });

  return Response.json(result, { status: successStatus });
}

export function defineRoute<
  const M extends HttpMethod,
  P extends z.ZodType | undefined = undefined,
  Q extends z.ZodType | undefined = undefined,
  B extends z.ZodType | undefined = undefined,
  A extends Access | undefined = undefined,
>(definition: RouteDefinition<P, Q, B, A> & { method: M }): { [K in M]: NextRouteHandler } {
  registerRoute(definition);

  let arrays: Set<string> | null = null;

  const handler: NextRouteHandler = async (request, context) => {
    try {
      const session = definition.access
        ? await requireAccess(request, definition.access)
        : null;

      let params: unknown;
      if (definition.params) {
        params = parseOrThrow(definition.params, (await context.params) ?? {}, "path");
      }

      let query: unknown;
      if (definition.query) {
        arrays ??= arrayFields(definition.query);
        query = parseOrThrow(definition.query, readQuery(new URL(request.url), arrays), "query");
      }

      let body: unknown;
      if (definition.body) {
        body = parseOrThrow(definition.body, await readBody(request), "body");
      }

      const result = await definition.handler({
        params,
        query,
        body,
        request,
        session,
      } as HandlerContext<P, Q, B, A>);

      return toResponse(result, definition.successStatus ?? 200);
    } catch (error) {
      if (error instanceof ApiError) {
        return Response.json(error.toJSON(), { status: error.status });
      }

      console.error(`[api] ${definition.method} ${definition.path} :`, error);
      return Response.json(INTERNAL_ERROR, { status: 500 });
    }
  };

  return { [definition.method]: handler } as { [K in M]: NextRouteHandler };
}
