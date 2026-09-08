import { readdirSync, readFileSync, statSync } from "node:fs";
import { extname, join, relative } from "node:path";
import { describe, expect, it } from "vitest";

import { VIDEO_PROVIDERS, type VideoProvider, type VideoProviderName } from "../provider";
import { createVideoProvider, readVideoConfig } from "../registry";

/**
 * Garde-fous d'architecture.
 *
 * Ces tests ne verifient pas un comportement : ils verifient que l'abstraction
 * n'a pas ete contournee. Le jour ou quelqu'un ecrit
 * `if (provider === "local")` dans une route, ou instancie un hebergeur en
 * dehors de la fabrique, la suite le dit — avant la revue, pas apres.
 */

const ROOT = process.cwd();

/** Le module video a le droit de nommer les hebergeurs. Le reste, non. */
const VIDEO_MODULE = "src/server/video";
/** Les listes fermees du dispositif y vivent, hebergeurs compris. */
const VOCABULARY = "src/lib/vocabulary.ts";
/**
 * Scripts d'exploitation dont le stockage local EST le sujet : ils lisent des
 * fichiers poses sur le disque, la ou tout le reste du dispositif ignore
 * jusqu'a l'existence d'un disque.
 *
 * Liste volontairement explicite, et courte. Y ajouter une entree doit se
 * justifier de la meme facon : « ce fichier ne peut pas faire son travail sans
 * connaitre le stockage local ». Si la reponse est « ce serait plus pratique »,
 * la reponse est non.
 */
const LOCAL_STORAGE_SCRIPTS = [
  // Deplace les videos de l'ancien repertoire d'upload vers le stockage du
  // fournisseur.
  "scripts/migrate-videos.ts",
  // Relit la sauvegarde prise avant migration pour remettre le temoin d'aplomb.
  "scripts/restore-witness.ts",
];

function sourceFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(join(ROOT, dir))) {
    const relativePath = join(dir, entry);
    const full = join(ROOT, relativePath);
    if (statSync(full).isDirectory()) {
      if (entry === "node_modules" || entry === ".next") continue;
      out.push(...sourceFiles(relativePath));
    } else if ([".ts", ".tsx"].includes(extname(entry))) {
      out.push(relativePath);
    }
  }
  return out;
}

function applicationFiles(): string[] {
  return [...sourceFiles("src"), ...sourceFiles("scripts")].filter(
    (file) =>
      !file.startsWith(VIDEO_MODULE) &&
      file !== VOCABULARY &&
      !LOCAL_STORAGE_SCRIPTS.includes(file),
  );
}

describe("le choix de l'hebergeur est centralise", () => {
  it("aucun code applicatif ne teste le nom d'un hebergeur", () => {
    // `"embed"` apparait aussi comme forme de lecture (`playback.kind`) : on ne
    // retient que les comparaisons a un nom d'hebergeur.
    const comparison = new RegExp(
      `(===|!==|case\\s+)\\s*["'\`](${VIDEO_PROVIDERS.join("|")})["'\`]`,
    );

    const offenders = applicationFiles().filter((file) => {
      const source = readFileSync(join(ROOT, file), "utf8");
      return source
        .split("\n")
        .some((line) => comparison.test(line) && !line.includes("playback"));
    });

    expect(
      offenders,
      "un nom d'hebergeur est teste hors de src/server/video — la resolution doit passer par le registre",
    ).toEqual([]);
  });

  it("aucun code applicatif n'instancie ni ne reconnait une implementation concrete", () => {
    const offenders = applicationFiles().filter((file) => {
      const source = readFileSync(join(ROOT, file), "utf8");
      return /\b(new |instanceof )\s*(LocalVideoProvider|FakePeerTubeProvider|ExternalEmbedProvider)\b/.test(
        source,
      );
    });

    expect(
      offenders,
      "une implementation concrete est nommee hors de src/server/video — passer par la fabrique",
    ).toEqual([]);
  });

  it("l'application ne connait de l'hebergement que le contrat et le registre", () => {
    const allowed = new Set(["provider", "presentation", "registry", "mime"]);

    const offenders: string[] = [];
    for (const file of applicationFiles()) {
      const source = readFileSync(join(ROOT, file), "utf8");
      for (const [, module] of source.matchAll(/from "@\/server\/video\/([\w-]+)"/g)) {
        if (!allowed.has(module)) offenders.push(`${file} → ${module}`);
      }
    }

    expect(offenders, "import d'un module d'implementation depuis le code applicatif").toEqual([]);
  });
});

describe("brancher un hebergeur de plus", () => {
  it("la fabrique couvre tous les hebergeurs declares", () => {
    // Le `switch` de createVideoProvider est exhaustif : declarer un nom dans
    // le vocabulaire sans l'y brancher casse la compilation. Ce test le
    // constate a l'execution, pour les lecteurs pressés.
    const config = readVideoConfig({ DATABASE_URL: "file:./local.db" });

    for (const name of VIDEO_PROVIDERS) {
      const provider = createVideoProvider(name, config);
      expect(provider.name, `${name} mal branche dans la fabrique`).toBe(name);
    }
  });

  it("le contrat suffit : un hebergeur inconnu du dispositif s'y conforme sans rien changer d'autre", async () => {
    // Ce que couterait un vrai client PeerTube : cette classe, et une ligne
    // dans la fabrique. Rien d'autre — ni route, ni service, ni composant.
    class ProviderDemonstration implements VideoProvider {
      readonly name = "peertube" as VideoProviderName;

      async store() {
        return { videoId: "distant-42", provider: this.name, state: "processing" as const, bytes: null };
      }
      async status(videoId: string) {
        return videoId === "distant-42"
          ? { state: "ready" as const, reason: null }
          : { state: "unavailable" as const, reason: "inconnu" };
      }
      async playbackUrl(videoId: string) {
        return videoId === "distant-42"
          ? { kind: "embed" as const, url: "https://video.example.org/w/distant-42" }
          : null;
      }
      async delete() {
        return true;
      }
    }

    const provider: VideoProvider = new ProviderDemonstration();

    const stored = await provider.store({
      body: new ReadableStream(),
      mimeType: "video/mp4",
      maxBytes: 1,
    });
    expect(stored.state, "un depot distant n'est pas lisible d'emblee").toBe("processing");

    expect((await provider.status(stored.videoId)).state).toBe("ready");
    expect(await provider.playbackUrl(stored.videoId)).toEqual({
      kind: "embed",
      url: "https://video.example.org/w/distant-42",
    });
    expect(await provider.delete(stored.videoId)).toBe(true);

    // Aucune methode facultative : ni octets a servir, ni lien a adopter.
    expect(provider.openStream).toBeUndefined();
    expect(provider.storeLink).toBeUndefined();
  });
});
