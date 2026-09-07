import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";

import { VIDEO_UNAVAILABLE_MESSAGE } from "@/lib/vocabulary";

import { describeVideo } from "../presentation";
import { activeVideoProvider, resetVideoRegistry } from "../registry";

/**
 * Mode degrade, provoque par la configuration.
 *
 * La question n'est pas « le fournisseur factice repond-il correctement » mais
 * « l'application sait-elle rester debout quand l'hebergeur ne repond pas ».
 * On bascule donc VIDEO_PROVIDER pour de vrai, comme en exploitation.
 */

const SAMPLE = new Uint8Array(2048).fill(0x21);

function streamOf(bytes: Uint8Array): ReadableStream<Uint8Array> {
  return new ReadableStream<Uint8Array>({
    start(controller) {
      controller.enqueue(bytes);
      controller.close();
    },
  });
}

let storage = "";
let localVideoId = "";
const initialEnv = { ...process.env };

function configure(env: Record<string, string | undefined>): void {
  for (const [key, value] of Object.entries(env)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
  resetVideoRegistry();
}

beforeAll(async () => {
  storage = await mkdtemp(join(tmpdir(), "video-degraded-"));

  configure({ VIDEO_PROVIDER: "local", VIDEO_STORAGE_DIR: storage, VIDEO_EMBED_ENABLED: undefined });
  const stored = await activeVideoProvider().store({
    body: streamOf(SAMPLE),
    mimeType: "video/mp4",
    maxBytes: 1024 * 1024,
  });
  localVideoId = stored.videoId;
});

afterEach(() => {
  process.env = { ...initialEnv };
  resetVideoRegistry();
});

afterAll(async () => {
  await rm(storage, { recursive: true, force: true });
});

describe("etat de la video presente a l'application", () => {
  it("sans reference, il n'y a rien a afficher — et ce n'est pas une panne", async () => {
    configure({ VIDEO_PROVIDER: "local", VIDEO_STORAGE_DIR: storage });

    const view = await describeVideo({ videoId: null, videoProvider: null });
    expect(view.state).toBe("none");
    expect(view.message).toBeNull();
  });

  it("hebergeur en service : la video est lisible par une route applicative", async () => {
    configure({ VIDEO_PROVIDER: "local", VIDEO_STORAGE_DIR: storage });

    const view = await describeVideo({ videoId: localVideoId, videoProvider: "local" });
    expect(view.state).toBe("ready");
    expect(view.playback).toEqual({ kind: "stream", url: `/api/videos/${localVideoId}` });
    expect(view.message).toBeNull();
  });

  it("identifiant sans octets : indisponible, message explicite, pas d'exception", async () => {
    configure({ VIDEO_PROVIDER: "local", VIDEO_STORAGE_DIR: storage });

    const view = await describeVideo({
      videoId: "00000000000000000000000000000000",
      videoProvider: "local",
    });
    expect(view.state).toBe("unavailable");
    expect(view.message).toBe(VIDEO_UNAVAILABLE_MESSAGE);
    expect(view.playback).toBeNull();
  });
});

describe("VIDEO_PROVIDER=peertube — instance ministerielle non provisionnee", () => {
  it("une video hebergee ailleurs n'est plus servie, mais la fiche tient", async () => {
    configure({ VIDEO_PROVIDER: "peertube", VIDEO_STORAGE_DIR: storage });

    const view = await describeVideo({ videoId: localVideoId, videoProvider: "local" });
    expect(view.state).toBe("unavailable");
    expect(view.message).toBe(VIDEO_UNAVAILABLE_MESSAGE);
    expect(view.provider).toBe("local");
  });

  it("une video confiee a l'instance ministerielle est annoncee indisponible", async () => {
    configure({ VIDEO_PROVIDER: "peertube", VIDEO_PEERTUBE_URL: "https://video.exemple.gouv.fr" });

    const view = await describeVideo({ videoId: "quelconque", videoProvider: "peertube" });
    expect(view.state).toBe("unavailable");
    expect(view.message).toBe(VIDEO_UNAVAILABLE_MESSAGE);
  });

  it("interroger l'hebergeur ne jette jamais : aucun 500 ne peut en sortir", async () => {
    configure({ VIDEO_PROVIDER: "peertube" });

    await expect(
      describeVideo({ videoId: "quelconque", videoProvider: "peertube" }),
    ).resolves.toMatchObject({ state: "unavailable" });
  });
});

describe("lien tiers (YouTube, Vimeo)", () => {
  const embedRef = { videoId: "https://www.youtube.com/embed/abc123", videoProvider: "embed" } as const;

  it("eteint par defaut : la fiche affiche le message, pas un lecteur tiers", async () => {
    configure({ VIDEO_PROVIDER: "local", VIDEO_STORAGE_DIR: storage });

    const view = await describeVideo(embedRef);
    expect(view.state).toBe("unavailable");
    expect(view.message).toBe(VIDEO_UNAVAILABLE_MESSAGE);
  });

  it("allume explicitement : il coexiste avec l'hebergeur actif", async () => {
    configure({
      VIDEO_PROVIDER: "local",
      VIDEO_STORAGE_DIR: storage,
      VIDEO_EMBED_ENABLED: "true",
    });

    expect(await describeVideo(embedRef)).toMatchObject({
      state: "ready",
      playback: { kind: "embed", url: embedRef.videoId },
    });
    // L'hebergeur actif continue de servir ses propres videos.
    expect(await describeVideo({ videoId: localVideoId, videoProvider: "local" })).toMatchObject({
      state: "ready",
    });
  });
});
