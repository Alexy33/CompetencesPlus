import { describe, expect, it } from "vitest";

import { MENTION_DROITS_ALLOCATIONS } from "@/lib/mentions";

const PHRASE_DE_REFERENCE =
  "Aucune donnée de ce service n'est utilisée pour déterminer vos droits ni le montant de vos allocations.";

describe("mention sur l'usage des données", () => {
  it("reprend la phrase de reference au caractere pres", () => {
    expect(MENTION_DROITS_ALLOCATIONS).toBe(PHRASE_DE_REFERENCE);
  });

  it("n'est ni abregee ni tronquee", () => {
    expect(MENTION_DROITS_ALLOCATIONS).toContain("déterminer vos droits");
    expect(MENTION_DROITS_ALLOCATIONS).toContain("le montant de vos allocations");
    expect(MENTION_DROITS_ALLOCATIONS.endsWith(".")).toBe(true);
  });

  it("ne contient ni ellipse ni abreviation", () => {
    expect(MENTION_DROITS_ALLOCATIONS).not.toMatch(/…|\.\.\.|\betc\b/i);
  });
});
