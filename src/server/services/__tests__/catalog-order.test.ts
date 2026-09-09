import { describe, expect, it } from "vitest";
import { sql } from "drizzle-orm";
import { SQLiteSyncDialect } from "drizzle-orm/sqlite-core";

import { CATALOG_ORDERS, DEFAULT_CATALOG_ORDER } from "@/lib/catalog-order";
import { catalogOrderBy } from "@/server/services/profiles";

const dialecte = new SQLiteSyncDialect();

function sqlDe(ordre: Parameters<typeof catalogOrderBy>[0]): string {
  return dialecte.sqlToQuery(sql.join(catalogOrderBy(ordre), sql`, `)).sql;
}

describe("ordres de classement du catalogue", () => {
  it("chaque ordre comporte au moins deux colonnes", () => {
    for (const ordre of CATALOG_ORDERS) {
      expect(catalogOrderBy(ordre).length).toBeGreaterThanOrEqual(2);
    }
  });

  it("chaque ordre se termine par l'identifiant du profil", () => {
    for (const ordre of CATALOG_ORDERS) {
      expect(sqlDe(ordre)).toMatch(/"id"\s*asc\s*$/i);
    }
  });

  it("l'ordre par défaut est la mise à jour décroissante puis l'identifiant", () => {
    expect(DEFAULT_CATALOG_ORDER).toBe("recent");
    expect(sqlDe("recent")).toMatch(/"updated_at"\s*desc.*"id"\s*asc/is);
  });

  it("aucun ordre ne repose sur un critère de popularité", () => {
    for (const ordre of CATALOG_ORDERS) {
      const texte = sqlDe(ordre);
      expect(texte).not.toMatch(/\bviews\b/i);
      expect(texte).not.toMatch(/contact_count/i);
      expect(texte).not.toMatch(/\bscore\b/i);
    }
  });

  it("un ordre inconnu retombe sur l'ordre par défaut plutôt que de jeter", () => {
    expect(() => catalogOrderBy("popularite" as never)).not.toThrow();
    expect(sqlDe("popularite" as never)).toBe(sqlDe(DEFAULT_CATALOG_ORDER));
  });
});
