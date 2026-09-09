"use client";

import { Action } from "@/components/common/action";
import { Field, fieldControl } from "@/components/common/field";
import { Surface } from "@/components/common/surface";
import { MAX_PAGE_SIZE } from "@/lib/vocabulary";
import { Save } from "lucide-react";
import type { SettingsFormProps } from "./types";

export function SettingsForm({ settings, onChange, onSave }: SettingsFormProps) {
  return (
    <Surface>
      <h2 className="text-xl font-bold uppercase text-ink">Réglages</h2>

      {settings ? (
        <div className="mt-5 space-y-4">
          <Field label="Seuil de certification">
            <input
              type="number"
              min={0}
              max={100}
              value={settings.certificationThreshold}
              onChange={(event) =>
                onChange({ ...settings, certificationThreshold: Number(event.target.value) })
              }
              className={fieldControl}
            />
          </Field>

          <Field label="Profils par page">
            <input
              type="number"
              min={1}
              max={MAX_PAGE_SIZE}
              value={settings.catalogPageSize}
              onChange={(event) =>
                onChange({ ...settings, catalogPageSize: Number(event.target.value) })
              }
              className={fieldControl}
            />
          </Field>

          <Action size="sm" block onClick={onSave}>
            <Save aria-hidden="true" className="size-4" />
            Enregistrer
          </Action>
        </div>
      ) : null}
    </Surface>
  );
}
