import type { NextRequest } from "next/server";
import type { z } from "zod";

import type { Session } from "@/lib/auth";

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type Access = "authenticated" | "candidate" | "recruiter" | "admin";

export interface ResponseSpec {
  description: string;
  schema?: z.ZodType;
  example?: unknown;
}

type Infer<T> = T extends z.ZodType ? z.output<T> : undefined;

export interface HandlerContext<P, Q, B, A> {
  params: Infer<P>;
  query: Infer<Q>;
  body: Infer<B>;
  request: NextRequest;
  session: A extends Access ? Session : Session | null;
}

export interface RouteDefinition<
  P extends z.ZodType | undefined = undefined,
  Q extends z.ZodType | undefined = undefined,
  B extends z.ZodType | undefined = undefined,
  A extends Access | undefined = undefined,
> {
  method: HttpMethod;
  path: string;
  tags: string[];
  summary: string;
  description?: string;
  access?: A;
  params?: P;
  query?: Q;
  body?: B;
  successStatus?: number;
  responses: Record<string, ResponseSpec>;
  handler: (ctx: HandlerContext<P, Q, B, A>) => Promise<unknown> | unknown;
}

export type AnyRouteDefinition = RouteDefinition<any, any, any, any>;

const registry: AnyRouteDefinition[] = [];

export function registerRoute(definition: AnyRouteDefinition): void {
  registry.push(definition);
}

export function registeredRoutes(): readonly AnyRouteDefinition[] {
  return registry;
}
