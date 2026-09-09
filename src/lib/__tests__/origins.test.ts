import { describe, expect, it } from "vitest";

import { isTrustedOrigin, trustedOrigins } from "@/lib/origins";

describe("origines autorisées pour les écritures", () => {
  it("accepte l'absence d'origine, qui n'est pas un vecteur CSRF", () => {
    expect(isTrustedOrigin(null)).toBe(true);
    expect(isTrustedOrigin("")).toBe(true);
  });

  it("accepte les origines du dispositif", () => {
    for (const origine of trustedOrigins()) {
      expect(isTrustedOrigin(origine)).toBe(true);
    }
    expect(isTrustedOrigin("http://localhost:3000")).toBe(true);
    expect(isTrustedOrigin("http://127.0.0.1:3000")).toBe(true);
  });

  it("refuse une origine étrangère", () => {
    expect(isTrustedOrigin("https://site-malveillant.example")).toBe(false);
    expect(isTrustedOrigin("http://localhost:3000.attaquant.fr")).toBe(false);
    expect(isTrustedOrigin("https://localhost:3000")).toBe(false);
    expect(isTrustedOrigin("null")).toBe(false);
  });
});
