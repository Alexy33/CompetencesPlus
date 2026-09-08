import { describe, expect, it } from "vitest";

import { ExternalEmbedProvider } from "../embed-provider";
import { LocalVideoProvider } from "../local-provider";
import { FakePeerTubeProvider } from "../peertube-provider";
import { buildVideoRegistry, readVideoConfig } from "../registry";

/**
 * Selection de l'hebergeur par la configuration.
 *
 * C'est le seul endroit du code qui decide « lequel » : le jour ou l'instance
 * PeerTube existe, le basculement est cette variable d'environnement, pas
 * une reecriture.
 */

const BASE = { DATABASE_URL: "file:/data/profilsactifs.db" };

describe("configuration video", () => {
  it("prend l'hebergement local par defaut", () => {
    const config = readVideoConfig(BASE);
    expect(config.provider).toBe("local");
    expect(config.storageDir).toBe("/data/videos");
    expect(config.embedEnabled, "lien tiers eteint par defaut").toBe(false);
  });

  it("range le stockage hors du repertoire web, a cote de la base", () => {
    const config = readVideoConfig(BASE);
    expect(config.storageDir.includes("public")).toBe(false);
    expect(config.storageDir).not.toContain("/app/public");
  });

  it("accepte un repertoire de stockage impose", () => {
    expect(readVideoConfig({ ...BASE, VIDEO_STORAGE_DIR: "/mnt/videos" }).storageDir).toBe(
      "/mnt/videos",
    );
  });

  it("bascule sur l'instance PeerTube par VIDEO_PROVIDER", () => {
    expect(readVideoConfig({ ...BASE, VIDEO_PROVIDER: "peertube" }).provider).toBe("peertube");
  });

  it("refuse de demarrer sur un hebergeur inconnu, en le nommant", () => {
    expect(() => readVideoConfig({ ...BASE, VIDEO_PROVIDER: "s3" })).toThrow(/s3/);
  });
});

describe("resolution des hebergeurs", () => {
  it("local est en service, l'instance PeerTube ne l'est pas", () => {
    const registry = buildVideoRegistry(readVideoConfig(BASE));

    expect(registry.active).toBeInstanceOf(LocalVideoProvider);
    expect(registry.enabled.get("local")).toBeInstanceOf(LocalVideoProvider);
    expect(registry.enabled.has("peertube")).toBe(false);
    expect(registry.enabled.has("embed"), "lien tiers eteint par defaut").toBe(false);
  });

  it("sur VIDEO_PROVIDER=peertube, les videos locales ne sont plus servies", () => {
    const registry = buildVideoRegistry(readVideoConfig({ ...BASE, VIDEO_PROVIDER: "peertube" }));

    expect(registry.active).toBeInstanceOf(FakePeerTubeProvider);
    // C'est exactement ce qui declenche le mode degrade : une fiche dont la
    // video est rangee ailleurs reste consultable, sans lecteur.
    expect(registry.enabled.has("local")).toBe(false);
  });

  it("le lien tiers ne s'allume que sur demande explicite", () => {
    const registry = buildVideoRegistry(
      readVideoConfig({ ...BASE, VIDEO_EMBED_ENABLED: "true" }),
    );

    expect(registry.active).toBeInstanceOf(LocalVideoProvider);
    expect(registry.enabled.get("embed")).toBeInstanceOf(ExternalEmbedProvider);
  });
});
