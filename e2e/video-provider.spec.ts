import { expect, test, type APIRequestContext } from "@playwright/test";

/**
 * Non-regression du parcours video, apres le passage a l'abstraction
 * VideoProvider.
 *
 * Le temoin reel du jeu de demonstration est note dans docs/temoin-video.md :
 * son identifiant y figure, avec l'empreinte du fichier avant et apres la
 * migration. Ce test-ci rejoue le meme parcours sur un profil qu'il fabrique,
 * pour qu'il puisse tourner autant de fois qu'on veut sans detruire le temoin.
 *
 *   la fiche s'ouvre -> la video s'affiche -> le profil se modifie
 *   -> la video se supprime -> les octets ont disparu
 */

const PASSWORD = "demo1234";
const ADULT_BIRTH_DATE = "1990-05-17";

const FAKE_MP4 = Buffer.alloc(8192, 0x21);

async function candidateWithVideo(
  playwright: typeof import("@playwright/test"),
  baseURL: string,
): Promise<{ context: APIRequestContext; profileId: string; videoPath: string }> {
  const context = await playwright.request.newContext({ baseURL });

  const signUp = await context.post("/api/auth/sign-up/email", {
    data: {
      name: "Temoin Video",
      email: `temoin-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@exemple.fr`,
      password: PASSWORD,
      birthDate: ADULT_BIRTH_DATE,
    },
  });
  expect(signUp.status()).toBe(200);

  expect((await context.post("/api/me/profile/video/consent")).status()).toBe(200);

  const upload = await context.put("/api/me/profile/video", {
    headers: { "content-type": "video/mp4" },
    data: FAKE_MP4,
  });
  expect(upload.status(), "depot de la video").toBe(200);

  const profile = await upload.json();
  expect(profile.video.state, "depot chez l'hebergeur actif").toBe("ready");

  return { context, profileId: profile.id, videoPath: profile.video.playback.url as string };
}

test.describe("Non-régression — parcours vidéo complet", () => {
  test("la fiche s'ouvre, la vidéo se lit, le profil se modifie, la vidéo se supprime", async ({
    playwright,
    baseURL,
    request,
  }) => {
    const { context, profileId, videoPath } = await candidateWithVideo(playwright, baseURL!);

    // 1. La fiche s'ouvre pour son titulaire, avec sa vidéo.
    const mine = await (await context.get("/api/me/profile")).json();
    expect(mine.id).toBe(profileId);
    expect(mine.video.playback.url).toBe(videoPath);

    // 2. La vidéo se lit, y compris par intervalle.
    expect((await context.get(videoPath)).status()).toBe(200);
    const partial = await context.get(videoPath, { headers: { Range: "bytes=0-511" } });
    expect(partial.status()).toBe(206);
    expect((await partial.body()).byteLength).toBe(512);

    // 3. Le profil se modifie toujours, et la vidéo n'en souffre pas.
    const edited = await context.patch("/api/me/profile", {
      data: { title: "Titre revu après migration", bio: "Fiche modifiée après la bascule." },
    });
    expect(edited.status(), "édition du profil").toBe(200);
    const afterEdit = await edited.json();
    expect(afterEdit.title).toBe("Titre revu après migration");
    expect(afterEdit.video.playback.url, "la vidéo survit à l'édition").toBe(videoPath);

    // 4. La suppression fait disparaître les octets, pas seulement la ligne.
    expect((await context.delete("/api/me/profile/video")).status()).toBe(200);
    expect((await context.get(videoPath)).status(), "octets supprimés").toBe(404);

    const afterDelete = await (await context.get("/api/me/profile")).json();
    expect(afterDelete.video).toMatchObject({ state: "none", provider: null, playback: null });

    // 5. Le profil, lui, est intact.
    expect(afterDelete.title).toBe("Titre revu après migration");

    await context.dispose();
    expect((await request.get(videoPath)).status(), "anonyme, après suppression").toBe(404);
  });

  test("le retrait du consentement passe par la même suppression que le retrait de la vidéo", async ({
    playwright,
    baseURL,
  }) => {
    const { context, videoPath } = await candidateWithVideo(playwright, baseURL!);

    expect((await context.get(videoPath)).status()).toBe(200);

    const revoked = await context.delete("/api/me/profile/video/consent");
    expect(revoked.status()).toBe(200);
    expect((await revoked.json()).granted).toBe(false);

    // Aucun fichier orphelin : le consentement retiré, les octets sont partis.
    expect((await context.get(videoPath)).status(), "octets supprimés").toBe(404);

    const after = await (await context.get("/api/me/profile")).json();
    expect(after.video.state).toBe("none");

    await context.dispose();
  });

  test("une vidéo non validée n'est lisible par personne d'autre, même avec son adresse", async ({
    playwright,
    baseURL,
    request,
  }) => {
    const { context, videoPath } = await candidateWithVideo(playwright, baseURL!);

    // Vidéo tout juste déposée : en attente de modération.
    expect((await request.get(videoPath)).status(), "visiteur anonyme").toBe(404);

    const recruiter = await playwright.request.newContext({ baseURL });
    await recruiter.post("/api/auth/sign-in/email", {
      data: { email: "recruteur@exemple.fr", password: PASSWORD },
    });
    expect((await recruiter.get(videoPath)).status(), "recruteur connecté").toBe(404);

    // Un autre candidat n'y a pas davantage accès.
    const other = await playwright.request.newContext({ baseURL });
    await other.post("/api/auth/sign-up/email", {
      data: {
        name: "Autre Candidat",
        email: `autre-${Date.now()}@exemple.fr`,
        password: PASSWORD,
        birthDate: ADULT_BIRTH_DATE,
      },
    });
    expect((await other.get(videoPath)).status(), "autre candidat").toBe(404);

    expect((await context.get(videoPath)).status(), "titulaire").toBe(200);

    await context.delete("/api/me/profile/video");
    await Promise.all([context.dispose(), recruiter.dispose(), other.dispose()]);
  });

  test("supprimer un profil emporte les octets de sa vidéo", async ({ playwright, baseURL, request }) => {
    const { context, profileId, videoPath } = await candidateWithVideo(playwright, baseURL!);
    expect((await context.get(videoPath)).status()).toBe(200);

    const admin = await playwright.request.newContext({ baseURL });
    await admin.post("/api/auth/sign-in/email", {
      data: { email: "admin@jeb.gouv.fr", password: PASSWORD },
    });

    expect((await admin.delete(`/api/admin/profiles/${profileId}`)).status()).toBe(200);

    // La ligne partie, le fichier ne doit pas rester derrière : la suppression
    // interroge l'hébergeur AVANT de perdre la référence.
    expect((await request.get(videoPath)).status(), "octets supprimés").toBe(404);

    await Promise.all([context.dispose(), admin.dispose()]);
  });

  test("la fiche publique d'un profil sans vidéo lisible reste servie", async ({ request }) => {
    // Aucune vidéo n'est un état, pas une panne : la fiche répond 200.
    const catalogue = await (await request.get("/api/profiles?pageSize=20")).json();
    expect(catalogue.items.length).toBeGreaterThan(0);

    for (const card of catalogue.items.slice(0, 5)) {
      const page = await request.get(`/profils/${card.id}`);
      expect(page.status(), `fiche ${card.id}`).toBe(200);

      const detail = await (await request.get(`/api/profiles/${card.id}`)).json();
      expect(["none", "processing", "ready", "unavailable"]).toContain(detail.video.state);
      // Aucun chemin physique n'est jamais exposé.
      if (detail.video.playback?.kind === "stream") {
        expect(detail.video.playback.url).toMatch(/^\/api\/videos\/[0-9a-f]{32}$/);
      }
    }
  });
});
