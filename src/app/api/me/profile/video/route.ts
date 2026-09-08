import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { ApiError } from "@/server/http";
import { findProfileByUserId } from "@/server/services/profiles";
import {
  deleteProfileVideo,
  extensionForMime,
  MissingVideoConsentError,
  resetVideoModeration,
  storeProfileVideo,
} from "@/server/services/video";
import {
  EmptyVideoError,
  UnsupportedVideoTypeError,
  VideoProviderUnavailableError,
  VideoTooLargeError,
} from "@/server/video/provider";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Depot et retrait de la video du candidat connecte.
 *
 * La route ne sait rien du stockage : elle valide la requete, puis confie le
 * flux a l'hebergeur actif (`VIDEO_PROVIDER`) via le service video.
 */

function fail(error: unknown): Response {
  const api = error instanceof ApiError ? error : new ApiError("internal", "Erreur interne.");
  return Response.json(api.toJSON(), { status: api.status });
}

async function candidateContext(): Promise<{ userId: string; profileId: string }> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) throw ApiError.unauthorized();
  if (session.user.role !== "candidate") {
    throw ApiError.forbidden("Cette ressource est réservée au rôle « candidate ».");
  }
  const owned = await findProfileByUserId(session.user.id);
  if (!owned) throw ApiError.notFound("Aucun profil rattaché à ce compte.");
  return { userId: session.user.id, profileId: owned.id };
}

export async function PUT(request: Request): Promise<Response> {
  let ctx: { userId: string; profileId: string };
  try {
    ctx = await candidateContext();
  } catch (error) {
    return fail(error);
  }

  const mimeType = request.headers.get("content-type");
  if (!mimeType || !extensionForMime(mimeType)) {
    return fail(
      ApiError.unprocessable(
        "Type de fichier non pris en charge. Formats acceptés : MP4, WebM, OGG, MOV — via l'en-tête Content-Type.",
      ),
    );
  }
  if (!request.body) {
    return fail(ApiError.badRequest("Corps de requête vide : envoyez le fichier vidéo en corps de requête."));
  }

  try {
    // L'etat rendu peut etre « processing » : un depot reussi ne garantit pas
    // que la video soit deja lisible. La fiche s'appuie sur `status()`.
    await storeProfileVideo(ctx.profileId, mimeType, request.body);
  } catch (error) {
    if (error instanceof VideoTooLargeError) return fail(ApiError.unprocessable(error.message));
    if (error instanceof UnsupportedVideoTypeError) return fail(ApiError.unprocessable(error.message));
    if (error instanceof EmptyVideoError) return fail(ApiError.badRequest(error.message));
    if (error instanceof MissingVideoConsentError) return fail(ApiError.forbidden(error.message));
    if (error instanceof VideoProviderUnavailableError) return fail(ApiError.unavailable(error.message));
    return fail(new ApiError("internal", `Enregistrement impossible : ${(error as Error).message}`));
  }

  return Response.json(await findProfileByUserId(ctx.userId));
}

export async function DELETE(): Promise<Response> {
  let ctx: { userId: string; profileId: string };
  try {
    ctx = await candidateContext();
  } catch (error) {
    return fail(error);
  }

  // Chemin de suppression unique : le service delegue a VideoProvider.delete(),
  // qui efface les octets avant que la reference ne soit retiree de la base.
  await deleteProfileVideo(ctx.profileId);
  await resetVideoModeration(ctx.profileId);

  return Response.json(await findProfileByUserId(ctx.userId));
}
