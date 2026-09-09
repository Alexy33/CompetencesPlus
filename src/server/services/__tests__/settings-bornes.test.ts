import { describe, expect, it } from "vitest";

import { normalizeSetting, SETTINGS_DEFAULTS } from "@/server/services/settings";
import { MAX_PAGE_SIZE } from "@/lib/vocabulary";

describe("bornage des reglages lus en base", () => {
  it("ramene catalogPageSize dans les bornes du contrat", () => {
    expect(normalizeSetting("catalogPageSize", 0)).toBe(1);
    expect(normalizeSetting("catalogPageSize", -5)).toBe(1);
    expect(normalizeSetting("catalogPageSize", 99999)).toBe(MAX_PAGE_SIZE);
    expect(normalizeSetting("catalogPageSize", 12)).toBe(12);
  });

  it("ramene le seuil de certification entre 0 et 100", () => {
    expect(normalizeSetting("certificationThreshold", -100)).toBe(0);
    expect(normalizeSetting("certificationThreshold", 99999)).toBe(100);
    expect(normalizeSetting("certificationThreshold", 70)).toBe(70);
  });

  it("retombe sur la valeur par defaut quand la base ne contient pas un nombre", () => {
    for (const brut of ["texte", "", undefined, null, NaN, Infinity, {}]) {
      expect(normalizeSetting("catalogPageSize", brut)).toBe(SETTINGS_DEFAULTS.catalogPageSize);
    }
  });

  it("tronque les valeurs decimales plutot que de les propager", () => {
    expect(normalizeSetting("catalogPageSize", 7.9)).toBe(7);
    expect(normalizeSetting("certificationThreshold", 70.4)).toBe(70);
  });
});
