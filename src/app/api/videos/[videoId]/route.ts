import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { db } from "@/db";
import { user } from "@/db/schema";
import { auth } from "@/lib/auth";
import { isMinor } from "@/lib/age";
import { VIDEO_PROCESSING_MESSAGE, VIDEO_UNAVAILABLE_MESSAGE } from "@/lib/vocabulary";
import { findProfileByVideoId, parseRangeHeader } from "@/server/services/video";
import { VideoProviderUnavailableError } from "@/server/video/provider";
import { enabledVideoProvider } from "@/server/video/registry";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Seule porte d'entree vers les octets d'une video hebergee par le dispositif.
 *
 * `id` est l'identifiant OPAQUE rendu par l'hebergeur — ni un chemin, ni
 * l'identifiant du profil. Le fichier n'est atteignable par aucune autre URL :
 * il vit hors du repertoire web, et aucun listing n'existe.
 */

function notFound(): Response {
  // Volontairement indistinguable d'un identifiant inconnu : savoir qu'une
  // video existe est deja une information.
  return Response.json(
    { error: { code: "not_found", message: "Vidéo introuvable." } },
    { status: 404 },
  );
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ videoId: string }> },
): Promise<Response> {
  const { videoId } = await params;

  // 1. Identifier la video, et donc le profil auquel elle se rattache.
  const owner = await findProfileByVideoId(videoId);
  if (!owner?.videoId || !owner.videoProvider) return notFound();

  const [holder] = await db
    .select({ birthDate: user.birthDate })
    .from(user)
    .where(eq(user.id, owner.userId))
    .limit(1);

  // 2. Appliquer les regles d'acces deja en vigueur sur la fiche : profil
  // publie, video validee par la moderation, titulaire majeur. Sinon, la
  // session existante doit etre celle du titulaire ou d'un administrateur.
  const restricted =
    owner.profileStatus !== "published" ||
    owner.videoStatus !== "approved" ||
    isMinor(holder?.birthDate ?? null);

  if (restricted) {
    const session = await auth.api.getSession({ headers: await headers() });
    const allowed = !!session && (session.user.id === owner.userId || session.user.role === "admin");
    if (!allowed) return notFound();
  }

  // 3. Seulement maintenant, reclamer les octets a l'hebergeur.
  const provider = enabledVideoProvider(owner.videoProvider);
  if (!provider?.openStream) return notFound();

  const status = await provider.status(owner.videoId).catch((error: unknown) => {
    if (error instanceof VideoProviderUnavailableError) {
      return { state: "unavailable" as const, reason: error.message };
    }
    throw error;
  });

  if (status.state === "processing") {
    return Response.json(
      { error: { code: "conflict", message: VIDEO_PROCESSING_MESSAGE } },
      { status: 409 },
    );
  }
  if (status.state === "unavailable") {
    return Response.json(
      { error: { code: "unavailable", message: VIDEO_UNAVAILABLE_MESSAGE } },
      { status: 503 },
    );
  }

  // La taille totale vient de l'hebergeur : elle est necessaire pour
  // interpreter `Range`, y compris un suffixe (`bytes=-500`).
  const range =
    status.totalBytes != null
      ? parseRangeHeader(request.headers.get("range"), status.totalBytes)
      : null;

  const slice = await provider.openStream(owner.videoId, range);
  if (!slice) return notFound();

  return new Response(slice.stream, {
    status: slice.status,
    headers: {
      "Content-Type": slice.mimeType,
      "Cache-Control": "private, max-age=0, must-revalidate",
      ...slice.headers,
    },
  });
}
