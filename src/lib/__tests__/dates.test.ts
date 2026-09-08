import { describe, expect, it, vi } from "vitest";

import { formatDay, formatTimestamp, toIso, toIsoOrNull } from "@/lib/dates";

const INVALIDE = new Date(Number.NaN);

describe("sérialisation défensive des horodatages", () => {
  it("toIsoOrNull rend null pour une date absente ou illisible", () => {
    expect(toIsoOrNull(null)).toBeNull();
    expect(toIsoOrNull(undefined)).toBeNull();
    expect(toIsoOrNull(INVALIDE)).toBeNull();
  });

  it("toIsoOrNull rend l'ISO d'une date valide", () => {
    expect(toIsoOrNull(new Date("2026-01-15T10:00:00.000Z"))).toBe("2026-01-15T10:00:00.000Z");
  });

  it("toIso ne jette jamais et signale l'horodatage illisible", () => {
    const journal = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => toIso(INVALIDE)).not.toThrow();
    expect(toIso(INVALIDE)).toBe(new Date(0).toISOString());
    expect(journal).toHaveBeenCalled();
    journal.mockRestore();
  });

  it("toIso laisse passer une date valide", () => {
    expect(toIso(new Date("2026-01-15T10:00:00.000Z"))).toBe("2026-01-15T10:00:00.000Z");
  });

  it("les formateurs d'affichage rendent un tiret plutôt que de jeter", () => {
    expect(formatTimestamp("pas-une-date")).toBe("—");
    expect(formatDay("pas-une-date")).toBe("—");
    expect(formatTimestamp(null)).toBe("—");
  });
});
