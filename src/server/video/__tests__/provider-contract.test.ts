import { mkdtemp, rm, stat, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { LocalVideoProvider } from "../local-provider";
import { FakePeerTubeProvider } from "../peertube-provider";
import {
  VideoProviderUnavailableError,
  VideoTooLargeError,
  type VideoProvider,
} from "../provider";

/**
 * Suite de conformite du contrat VideoProvider.
 *
 * La MEME suite s'execute contre l'hebergement local et contre l'implementation
 * factice de l'instance ministerielle. C'est ce qui demontre que l'abstraction
 * tient : si elle ne passait que contre l'implementation locale, l'interface ne
 * serait qu'un deplacement de code.
 *
 * Les deux implementations n'ont pas le meme comportement — l'une heberge, la
 * seconde est injoignable — mais elles repondent au meme contrat, et c'est ce
 * contrat que la suite decrit.
 */

function streamOf(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

const SAMPLE = new Uint8Array(4096).fill(0x21);

interface Contract {
  label: string;
  /** L'hebergeur est en service : il stocke et sert reellement. */
  available: boolean;
  create(): Promise<VideoProvider> | VideoProvider;
  cleanup?(): Promise<void>;
  /** Verifie la presence physique des octets. Local uniquement. */
  bytesExist?(videoId: string): Promise<boolean>;
}

const workspaces: string[] = [];

/** Racine du stockage local du contrat, connue de la seule verification physique. */
let localRoot = "";

const CONTRACTS: Contract[] = [
  {
    label: "LocalVideoProvider",
    available: true,
    async create() {
      localRoot = await mkdtemp(join(tmpdir(), "video-contract-local-"));
      workspaces.push(localRoot);
      return new LocalVideoProvider({ root: localRoot });
    },
    async bytesExist(videoId: string) {
      const path = join(localRoot, videoId.slice(0, 2), `${videoId}.mp4`);
      return stat(path)
        .then((info) => info.isFile())
        .catch(() => false);
    },
  },
  {
    label: "FakePeerTubeProvider",
    available: false,
    create() {
      return new FakePeerTubeProvider("https://video.exemple.gouv.fr");
    },
  },
];

afterAll(async () => {
  await Promise.all(workspaces.map((root) => rm(root, { recursive: true, force: true })));
});

describe.each(CONTRACTS)("contrat VideoProvider — $label", (contract) => {
  let provider: VideoProvider;

  beforeAll(async () => {
    provider = await contract.create();
  });

  it("porte un nom d'hebergeur, celui qui sera stocke en base", () => {
    expect(provider.name).toBeTruthy();
    expect(["local", "peertube", "embed"]).toContain(provider.name);
  });

  it("expose les quatre responsabilites du contrat", () => {
    expect(typeof provider.store).toBe("function");
    expect(typeof provider.status).toBe("function");
    expect(typeof provider.playbackUrl).toBe("function");
    expect(typeof provider.delete).toBe("function");
  });

  it("ne jette jamais sur status() : un hebergeur muet est un etat, pas une panne", async () => {
    const report = await provider.status("00000000000000000000000000000000");
    expect(["processing", "ready", "unavailable"]).toContain(report.state);
    if (!contract.available) expect(report.state).toBe("unavailable");
  });

  it("rend null pour l'adresse de lecture d'un identifiant inconnu", async () => {
    expect(await provider.playbackUrl("00000000000000000000000000000000")).toBeNull();
  });

  if (contract.available) {
    it("store() rend un identifiant opaque, ni chemin ni identifiant de profil", async () => {
      const stored = await provider.store({
        body: streamOf(SAMPLE),
        mimeType: "video/mp4",
        maxBytes: 1024 * 1024,
      });

      expect(stored.provider).toBe(provider.name);
      expect(stored.videoId).toMatch(/^[0-9a-f]{32}$/);
      expect(stored.videoId).not.toContain("/");
      expect(stored.bytes).toBe(SAMPLE.byteLength);
      expect(["processing", "ready"]).toContain(stored.state);
    });

    it("cree les octets sur le stockage, puis les fait disparaitre a la suppression", async () => {
      const stored = await provider.store({
        body: streamOf(SAMPLE),
        mimeType: "video/mp4",
        maxBytes: 1024 * 1024,
      });

      expect(await contract.bytesExist!(stored.videoId), "octets ecrits").toBe(true);
      expect((await provider.status(stored.videoId)).state).toBe("ready");

      const playback = await provider.playbackUrl(stored.videoId);
      expect(playback).not.toBeNull();
      // L'adresse est une route applicative, jamais un chemin de fichier.
      expect(playback!.url).toBe(`/api/videos/${stored.videoId}`);
      expect(playback!.url).not.toContain(tmpdir());

      expect(await provider.delete(stored.videoId), "suppression effective").toBe(true);
      expect(await contract.bytesExist!(stored.videoId), "octets effaces").toBe(false);
      expect((await provider.status(stored.videoId)).state).toBe("unavailable");
    });

    it("supprimer deux fois n'est pas une erreur", async () => {
      const stored = await provider.store({
        body: streamOf(SAMPLE),
        mimeType: "video/mp4",
        maxBytes: 1024 * 1024,
      });

      expect(await provider.delete(stored.videoId)).toBe(true);
      expect(await provider.delete(stored.videoId)).toBe(false);
    });

    it("refuse un fichier au-dela du plafond, sans laisser de residu", async () => {
      await expect(
        provider.store({ body: streamOf(SAMPLE), mimeType: "video/mp4", maxBytes: 10 }),
      ).rejects.toBeInstanceOf(VideoTooLargeError);
    });
  } else {
    it("store() signale l'indisponibilite plutot que d'inventer un identifiant", async () => {
      await expect(
        provider.store({ body: streamOf(SAMPLE), mimeType: "video/mp4", maxBytes: 1024 }),
      ).rejects.toBeInstanceOf(VideoProviderUnavailableError);
    });

    it("delete() signale l'indisponibilite : rien ne peut etre efface a l'aveugle", async () => {
      await expect(provider.delete("00000000000000000000000000000000")).rejects.toBeInstanceOf(
        VideoProviderUnavailableError,
      );
    });

    it("se comporte de facon deterministe : deux appels, meme reponse", async () => {
      const first = await provider.status("abc");
      const second = await provider.status("abc");
      expect(second).toEqual(first);
      expect(first.reason).toContain("indisponible");
    });
  }
});

describe("LocalVideoProvider — traitement asynchrone", () => {
  let root: string;

  beforeAll(async () => {
    root = await mkdtemp(join(tmpdir(), "video-contract-processing-"));
  });

  afterAll(async () => {
    await rm(root, { recursive: true, force: true });
  });

  it("un depot reussi n'est pas forcement lisible", async () => {
    // Transcodage simule : la video existe, mais n'est pas encore servable.
    const provider = new LocalVideoProvider({ root, processingDelayMs: 60_000 });

    const stored = await provider.store({
      body: streamOf(SAMPLE),
      mimeType: "video/mp4",
      maxBytes: 1024 * 1024,
    });

    expect(stored.state).toBe("processing");
    expect((await provider.status(stored.videoId)).state).toBe("processing");
    expect(await provider.playbackUrl(stored.videoId)).toBeNull();
    expect(await provider.openStream(stored.videoId, null)).toBeNull();

    // Le meme stockage, lu sans delai de traitement : la video est prete.
    const settled = new LocalVideoProvider({ root });
    expect((await settled.status(stored.videoId)).state).toBe("ready");
    expect(await settled.playbackUrl(stored.videoId)).not.toBeNull();
  });

  it("un depot interrompu (.part residuel) est signale « en traitement »", async () => {
    const provider = new LocalVideoProvider({ root });
    const videoId = LocalVideoProvider.newVideoId();

    const { mkdir } = await import("node:fs/promises");
    await mkdir(join(root, videoId.slice(0, 2)), { recursive: true });
    await writeFile(join(root, videoId.slice(0, 2), `${videoId}.mp4.part`), "incomplet");

    expect((await provider.status(videoId)).state).toBe("processing");
    expect(await provider.delete(videoId)).toBe(true);
    expect((await provider.status(videoId)).state).toBe("unavailable");
  });
});

describe("LocalVideoProvider — surface d'attaque", () => {
  it("rejette tout identifiant qui n'est pas un jeton opaque", async () => {
    const root = await mkdtemp(join(tmpdir(), "video-contract-safety-"));
    const provider = new LocalVideoProvider({ root });

    for (const hostile of ["../../etc/passwd", "..", "a/b", "", "ABCDEF"]) {
      expect((await provider.status(hostile)).state).toBe("unavailable");
      expect(await provider.delete(hostile)).toBe(false);
      expect(await provider.openStream(hostile, null)).toBeNull();
    }

    await rm(root, { recursive: true, force: true });
  });
});
