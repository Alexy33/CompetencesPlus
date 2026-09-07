import { buildOpenApiDocument } from "@/server/openapi/document";

export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(buildOpenApiDocument());
}
