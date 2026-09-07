"use client";

import { Loader2, Save, Upload } from "lucide-react";
import type { ReactNode } from "react";

import { Action } from "@/components/common/action";
import { Field, fieldControl } from "@/components/common/field";
import { Surface, SurfaceHeading } from "@/components/common/surface";
import { ProfileVideo } from "@/components/catalogue/profile-video";

const MAX_UPLOAD_LABEL = "Importer une vidéo (100 Mo max.)";
const ACCEPTED_TYPES = "video/mp4,video/webm,video/ogg,video/quicktime";

export function VideoManager({
  name,
  videoUrl,
  draftUrl,
  uploading,
  disabled,
  onDraftUrlChange,
  onUpload,
  onSave,
  children,
}: {
  name: string;
  videoUrl: string | null;
  draftUrl: string;
  uploading: boolean;
  disabled: boolean;
  onDraftUrlChange: (value: string) => void;
  onUpload: (file: File) => void;
  onSave: () => void;
  children?: ReactNode;
}) {
  return (
    <Surface padding="responsive">
      <SurfaceHeading
        title="Vidéo de présentation"
        description="Ajoutez un lien ou importez directement votre vidéo."
      />

      <div className="mt-5 grid items-start gap-6 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.75fr)]">
        <ProfileVideo videoUrl={videoUrl} name={name} />

        <div>
          <Field label="URL YouTube ou Vimeo">
            <input
              className={fieldControl}
              placeholder="https://…"
              value={draftUrl}
              onChange={(event) => onDraftUrlChange(event.target.value)}
            />
          </Field>

          <p className="my-3 text-center text-xs text-ink-soft">ou</p>

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

          {draftUrl.trim() ? (
            <Action size="sm" block className="mt-3" onClick={onSave} disabled={disabled}>
              <Save aria-hidden="true" className="size-4" />
              Enregistrer le lien
            </Action>
          ) : null}
        </div>
      </div>

      {children}
    </Surface>
  );
}
