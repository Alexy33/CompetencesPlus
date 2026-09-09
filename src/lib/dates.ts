const TIMESTAMP = new Intl.DateTimeFormat("fr-FR", {
  dateStyle: "long",
  timeStyle: "short",
  timeZone: "Europe/Paris",
});

const DAY = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris" });

export function formatTimestamp(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : TIMESTAMP.format(date);
}

export function formatDay(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : DAY.format(date);
}

export function toIsoOrNull(value: Date | null | undefined): string | null {
  if (!value) return null;
  return Number.isNaN(value.getTime()) ? null : value.toISOString();
}

const EPOQUE = new Date(0).toISOString();

export function toIso(value: Date): string {
  if (Number.isNaN(value.getTime())) {
    console.error("[dates] horodatage illisible en base, replié sur l'époque Unix");
    return EPOQUE;
  }
  return value.toISOString();
}
