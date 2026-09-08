import { describe, expect, it } from "vitest";

import { parseCatalogFilters } from "@/components/catalogue/catalogue-search-params";
import { MAX_PAGE_SIZE } from "@/lib/vocabulary";

describe("lecture des filtres du catalogue", () => {
  it("ne jette jamais, quelle que soit la taille de page reglee en base", () => {
    for (const taille of [0, -5, 99999, Number.NaN, 12]) {
      expect(() => parseCatalogFilters({}, taille)).not.toThrow();
    }
  });

  it("borne la taille de page venue des reglages", () => {
    expect(parseCatalogFilters({}, 0).pageSize).toBe(1);
    expect(parseCatalogFilters({}, 99999).pageSize).toBe(MAX_PAGE_SIZE);
  });

  it("retombe sur un catalogue servable quand l'URL est illisible", () => {
    const filtres = parseCatalogFilters(
      { page: "-99", pageSize: "99999", sector: "<script>" },
      12,
    );
    expect(filtres.page).toBeGreaterThanOrEqual(1);
    expect(filtres.pageSize).toBeLessThanOrEqual(MAX_PAGE_SIZE);
  });

  it("accepte une compétence répétée comme un tableau", () => {
    const filtres = parseCatalogFilters({ skills: ["Rigueur", "Autonomie"] }, 12);
    expect(filtres.skills).toEqual(["Rigueur", "Autonomie"]);
  });
});
