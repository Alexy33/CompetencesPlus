import { db } from "@/db";
import { setting } from "@/db/schema";
import {
  DEFAULT_CERTIFICATION_THRESHOLD,
  DEFAULT_PAGE_SIZE,
  MAX_PAGE_SIZE,
} from "@/lib/vocabulary";

export interface Settings {
  certificationThreshold: number;
  catalogPageSize: number;
}

const BORNES: Record<keyof Settings, { min: number; max: number; defaut: number }> = {
  certificationThreshold: { min: 0, max: 100, defaut: DEFAULT_CERTIFICATION_THRESHOLD },
  catalogPageSize: { min: 1, max: MAX_PAGE_SIZE, defaut: DEFAULT_PAGE_SIZE },
};

export const SETTINGS_DEFAULTS: Settings = {
  certificationThreshold: BORNES.certificationThreshold.defaut,
  catalogPageSize: BORNES.catalogPageSize.defaut,
};

export function normalizeSetting(key: keyof Settings, raw: unknown): number {
  const { min, max, defaut } = BORNES[key];

  const absent =
    raw === undefined ||
    raw === null ||
    (typeof raw === "string" && raw.trim() === "") ||
    typeof raw === "object" ||
    typeof raw === "boolean";
  if (absent) return defaut;

  const parsed = typeof raw === "number" ? raw : Number(raw);
  if (!Number.isFinite(parsed)) return defaut;

  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

export async function getSettings(): Promise<Settings> {
  const rows = await db.select().from(setting);
  const stored = new Map(rows.map((row) => [row.key, row.value]));

  return {
    certificationThreshold: normalizeSetting(
      "certificationThreshold",
      stored.get("certificationThreshold"),
    ),
    catalogPageSize: normalizeSetting("catalogPageSize", stored.get("catalogPageSize")),
  };
}

export async function updateSettings(patch: Partial<Settings>): Promise<Settings> {
  for (const [key, value] of Object.entries(patch)) {
    if (value === undefined) continue;

    const borne = normalizeSetting(key as keyof Settings, value);

    await db
      .insert(setting)
      .values({ key, value: String(borne), updatedAt: new Date() })
      .onConflictDoUpdate({
        target: setting.key,
        set: { value: String(borne), updatedAt: new Date() },
      });
  }
  return getSettings();
}
