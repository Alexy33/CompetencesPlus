"use client";

import { Loader2, Save, Trash2, Upload } from "lucide-react";
import type { ReactNode } from "react";

import { Action } from "@/components/common/action";
import { Field, fieldControl } from "@/components/common/field";
import { Surface, SurfaceHeading } from "@/components/common/surface";
import { ProfileVideo } from "@/components/catalogue/profile-video";
import type { VideoView } from "@/server/video/presentation";

const MAX_UPLOAD_LABEL = "Importer une vidéo (100 Mo max.)";
const ACCEPTED_TYPES = "video/mp4,video/webm,video/ogg,video/quicktime";

/**
 * Le retrait détruit les octets, sans corbeille ni annulation possible.
 *
 * Le cas piégeux est l'hébergeur injoignable : la fiche annonce une
 * indisponibilité *temporaire*, alors que le fichier, lui, existe toujours.
 * Retirer la vidéo pour « débloquer » l'affichage la supprimerait pour de bon.
 * On le dit avant, pas après.
 */
function removalWarning(state: VideoView["state"]): string {
  const irreversible =
    "Le fichier vidéo sera supprimé définitivement du stockage. Cette action est irréversible.";

  return state === "unavailable"
    ? "L'hébergeur vidéo ne répond pas pour le moment, mais votre vidéo n'est pas perdue : " +
        "elle réapparaîtra dès qu'il sera de nouveau joignable.\n\n" +
        irreversible +
        "\n\nVoulez-vous vraiment la retirer ?"
    : `${irreversible}\n\nVoulez-vous vraiment la retirer ?`;
}

export function VideoManager({
  name,
  video,
  draftUrl,
  embedEnabled,
  uploading,
  removing,
  disabled,
  onDraftUrlChange,
  onUpload,
  onRemove,
  onSave,
  children,
}: {
  name: string;
  video: VideoView;
  draftUrl: string;
  /** Hébergement par lien tiers (YouTube, Vimeo) : éteint par défaut. */
  embedEnabled: boolean;
  uploading: boolean;
  removing: boolean;
  disabled: boolean;
  onDraftUrlChange: (value: string) => void;
  onUpload: (file: File) => void;
  onRemove: () => void;
  onSave: () => void;
  children?: ReactNode;
}) {
  return (
    <Surface padding="responsive">
      <SurfaceHeading
        title="Vidéo de présentation"
        description={
          embedEnabled
            ? "Ajoutez un lien ou importez directement votre vidéo."
            : "Importez votre vidéo : elle est hébergée par le dispositif, jamais par une plateforme tierce."
        }
      />

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)]">
        <ProfileVideo video={video} name={name} />

        <div>
          {embedEnabled ? (
            <>
              <Field label="URL YouTube ou Vimeo">
                <input
                  className={fieldControl}
                  placeholder="https://…"
                  value={draftUrl}
                  onChange={(event) => onDraftUrlChange(event.target.value)}
                />
              </Field>

              <p className="my-3 text-center text-xs text-ink-soft">ou</p>
            </>
          ) : null}

          <label className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-brand/40 bg-white px-4 text-center text-sm font-semibold text-brand-700 hover:bg-brand-100">
            {uploading ? (
              <Loader2 aria-hidden="true" className="mb-2 size-5 animate-spin" />
            ) : (
              <Upload aria-hidden="true" className="mb-2 size-5" />
            )}
            {MAX_UPLOAD_LABEL}
            <input
              type="file"
              accept={ACCEPTED_TYPES}
              className="sr-only"
              disabled={disabled}
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) onUpload(file);
              }}
            />
          </label>

          {embedEnabled && draftUrl.trim() ? (
            <Action size="sm" block className="mt-3" onClick={onSave} disabled={disabled}>
              <Save aria-hidden="true" className="size-4" />
              Enregistrer le lien
            </Action>
          ) : null}

          {video.state !== "none" ? (
            <Action
              size="sm"
              block
              tone="outline"
              className="mt-3"
              onClick={() => {
                if (window.confirm(removalWarning(video.state))) onRemove();
              }}
              disabled={disabled}
            >
              {removing ? (
                <Loader2 aria-hidden="true" className="size-4 animate-spin" />
              ) : (
                <Trash2 aria-hidden="true" className="size-4" />
              )}
              Retirer la vidéo
            </Action>
          ) : null}
        </div>
      </div>

      {children}
    </Surface>
  );
}
