import { expect, test, type APIRequestContext } from "@playwright/test";

const PASSWORD = "demo1234";
const ADULT_BIRTH_DATE = "1990-05-17";

const FAKE_MP4 = Buffer.alloc(4096, 0x21);

/**
 * Chaque test travaille sur un candidat qu'il cree lui-meme.
 *
 * La suite depose et supprime des videos : la faire tourner sur un profil du
 * jeu de demonstration reviendrait a detruire le temoin de non-regression
 * (cf. docs/temoin-video.md) a chaque execution.
 */
async function candidateContext(playwright: typeof import("@playwright/test"), baseURL: string): Promise<APIRequestContext> {
  const context = await playwright.request.newContext({ baseURL });

  const signUp = await context.post("/api/auth/sign-up/email", {
    data: {
      name: "Video Test",
      email: `video-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@exemple.fr`,
      password: PASSWORD,
      birthDate: ADULT_BIRTH_DATE,
    },
  });
  expect(signUp.status(), "creation du candidat de test").toBe(200);

  // Sans consentement en cours, aucun depot n'est possible (R.3).
  expect((await context.post("/api/me/profile/video/consent")).status()).toBe(200);

  return context;
}

test.describe("Vidéo de présentation", () => {
  test("téléverse, lit, lit par intervalle, puis supprime", async ({ playwright, baseURL }) => {
    const candidate = await candidateContext(playwright, baseURL!);

    const upload = await candidate.put("/api/me/profile/video", {
      headers: { "content-type": "video/mp4" },
      data: FAKE_MP4,
    });
    expect(upload.status(), "PUT vidéo").toBe(200);
    const profile = await upload.json();

    // L'identifiant est opaque : ni chemin de fichier, ni identifiant de profil.
    expect(profile.video.state).toBe("ready");
    expect(profile.video.provider).toBe("local");
    const videoPath = profile.video.playback.url as string;
    expect(videoPath).toMatch(/^\/api\/videos\/[0-9a-f]{32}$/);
    expect(videoPath).not.toContain(profile.id);

    const full = await candidate.get(videoPath);
    expect(full.status()).toBe(200);
    expect(full.headers()["content-type"]).toContain("video/mp4");
    expect(full.headers()["accept-ranges"]).toBe("bytes");
    expect((await full.body()).byteLength).toBe(FAKE_MP4.byteLength);

    const partial = await candidate.get(videoPath, { headers: { Range: "bytes=0-99" } });
    expect(partial.status(), "réponse Range").toBe(206);
    expect(partial.headers()["content-range"]).toBe(`bytes 0-99/${FAKE_MP4.byteLength}`);
    expect((await partial.body()).byteLength).toBe(100);

    const removed = await candidate.delete("/api/me/profile/video");
    expect(removed.status()).toBe(200);
    expect((await removed.json()).video.state).toBe("none");

    // La suppression passe par le fournisseur : les octets ne sont plus la.
    expect((await candidate.get(videoPath)).status(), "vidéo supprimée").toBe(404);

    await candidate.dispose();
  });

  test("refuse un fichier de plus de 100 Mo", async ({ playwright, baseURL }) => {
    const candidate = await candidateContext(playwright, baseURL!);

    const tooBig = Buffer.alloc(100 * 1024 * 1024 + 1);
    const response = await candidate.put("/api/me/profile/video", {
      headers: { "content-type": "video/mp4" },
      data: tooBig,
    });

    expect(response.status()).toBe(422);
    expect((await response.json()).error.code).toBe("unprocessable");

    await candidate.dispose();
  });

  test("refuse un type de fichier non pris en charge", async ({ playwright, baseURL }) => {
    const candidate = await candidateContext(playwright, baseURL!);

    const response = await candidate.put("/api/me/profile/video", {
      headers: { "content-type": "application/pdf" },
      data: Buffer.from("%PDF-1.4"),
    });

    expect(response.status()).toBe(422);

    await candidate.dispose();
  });

  test("exige une session candidate", async ({ request }) => {
    const anonymous = await request.put("/api/me/profile/video", {
      headers: { "content-type": "video/mp4" },
      data: FAKE_MP4,
    });
    expect(anonymous.status()).toBe(401);
  });

  test("un recruteur ne peut pas téléverser de vidéo", async ({ playwright, baseURL }) => {
    const recruiter = await playwright.request.newContext({ baseURL: baseURL! });
    await recruiter.post("/api/auth/sign-in/email", { data: { email: "recruteur@exemple.fr", password: PASSWORD } });

    const response = await recruiter.put("/api/me/profile/video", {
      headers: { "content-type": "video/mp4" },
      data: FAKE_MP4,
    });
    expect(response.status()).toBe(403);

    await recruiter.dispose();
  });

  test("un identifiant inconnu ou devinable ne rend aucune vidéo", async ({ request }) => {
    for (const guess of [
      "/api/videos/00000000000000000000000000000000",
      "/api/videos/..%2F..%2Fetc%2Fpasswd",
      "/api/videos/presentation.mp4",
    ]) {
      expect((await request.get(guess)).status(), guess).toBe(404);
    }
  });

  test("aucun fichier vidéo n'est servi depuis le répertoire public", async ({ request }) => {
    // Le stockage vit hors du répertoire web : ces chemins n'existent pas, et
    // aucun listing n'est possible.
    for (const path of ["/videos/", "/uploads/", "/public/videos/"]) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect([308, 404], `${path} → ${response.status()}`).toContain(response.status());
    }
  });

  test("la spécification OpenAPI décrit les routes vidéo", async ({ request }) => {
    const spec = await (await request.get("/api/openapi")).json();
    expect(spec.paths["/api/me/profile/video"]).toBeDefined();
    expect(spec.paths["/api/me/profile/video"].put).toBeDefined();
    expect(spec.paths["/api/me/profile/video"].delete).toBeDefined();
    expect(spec.paths["/api/videos/{videoId}"].get).toBeDefined();
    expect(spec.components.schemas.VideoView, "état de la vidéo décrit").toBeDefined();
    expect(spec.components.schemas.VideoProvider, "hébergeurs décrits").toBeDefined();
  });
});
