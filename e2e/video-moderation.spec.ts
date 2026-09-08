import { expect, test, type APIRequestContext } from "@playwright/test";

const PASSWORD = "demo1234";
const ADULT_BIRTH_DATE = "1990-05-17";

const ADMIN = "admin@exemple.fr";
const RECRUITER = "recruteur@exemple.fr";

const FAKE_MP4 = Buffer.alloc(4096, 0x21);

async function contextFor(
  playwright: typeof import("@playwright/test"),
  baseURL: string,
  email: string,
): Promise<APIRequestContext> {
  const context = await playwright.request.newContext({ baseURL });
  const login = await context.post("/api/auth/sign-in/email", { data: { email, password: PASSWORD } });
  expect(login.status(), `connexion ${email}`).toBe(200);
  return context;
}

/**
 * Candidat fabrique par le test, consentement compris.
 *
 * La suite depose et supprime des videos : s'appuyer sur un profil du jeu de
 * demonstration la rendrait dependante de l'etat de la base (consentement
 * deja retire, video deja supprimee par une execution precedente) et
 * detruirait au passage le temoin de non-regression.
 */
async function freshCandidate(
  playwright: typeof import("@playwright/test"),
  baseURL: string,
): Promise<APIRequestContext> {
  const context = await playwright.request.newContext({ baseURL });

  const signUp = await context.post("/api/auth/sign-up/email", {
    data: {
      name: "Moderation Test",
      email: `moderation-${Date.now()}-${Math.random().toString(16).slice(2, 8)}@exemple.fr`,
      password: PASSWORD,
      birthDate: ADULT_BIRTH_DATE,
    },
  });
  expect(signUp.status(), "creation du candidat de test").toBe(200);

  // Une fiche renseignee : les captures jointes au dossier R.2 doivent montrer
  // un profil credible, pas un formulaire vide.
  expect(
    (await context.patch("/api/me/profile", {
      data: {
        title: "Technicien de maintenance",
        bio: "Six ans en maintenance industrielle. Je cherche un poste en équipe, sur des installations que je peux suivre dans la durée.",
        sector: "Industrie",
        city: "Nantes",
        skills: ["Rigueur", "Autonomie", "Travail en équipe"],
      },
    })).status(),
  ).toBe(200);

  expect((await context.post("/api/me/profile/video/consent")).status()).toBe(200);

  return context;
}

async function uploadVideo(candidate: APIRequestContext) {
  const upload = await candidate.put("/api/me/profile/video", {
    headers: { "content-type": "video/mp4" },
    data: FAKE_MP4,
  });
  expect(upload.status(), "PUT vidéo").toBe(200);
  const profile = await upload.json();
  return { profile, videoPath: profile.video.playback.url as string };
}

test.describe("Modération des vidéos (R.2)", () => {
  test("une vidéo déposée est en attente et inaccessible, y compris par son URL directe", async ({
    playwright,
    baseURL,
    request,
    browser,
  }) => {
    const candidate = await freshCandidate(playwright, baseURL!);
    const recruiter = await contextFor(playwright, baseURL!, RECRUITER);
    const admin = await contextFor(playwright, baseURL!, ADMIN);

    const { profile, videoPath } = await uploadVideo(candidate);
    expect(profile.videoModeration.status, "statut à l'upload").toBe("pending");
    expect(profile.videoModeration.decidedAt).toBeNull();

    expect((await request.get(videoPath)).status(), "visiteur anonyme").toBe(404);
    expect((await recruiter.get(videoPath)).status(), "recruteur connecté").toBe(404);

    expect((await candidate.get(videoPath)).status(), "titulaire").toBe(200);
    expect((await admin.get(videoPath)).status(), "administration").toBe(200);

    // Profil publié, mais vidéo encore en attente : la fiche publique existe
    // et ne laisse rien filtrer de la vidéo.
    expect(
      (await admin.patch(`/api/admin/profiles/${profile.id}`, { data: { status: "published" } })).status(),
    ).toBe(200);

    const publicProfile = await (await request.get(`/api/profiles/${profile.id}`)).json();
    expect(publicProfile.video.state, "aucune video sur la fiche publique").toBe("none");
    expect(publicProfile.video.playback, "aucune adresse de lecture exposee").toBeNull();

    expect((await request.get(videoPath)).status(), "profil publié, vidéo non validée").toBe(404);

    const privateContext = await browser.newContext();
    const page = await privateContext.newPage();
    const direct = await page.goto(`${baseURL}${videoPath}`);
    expect(direct?.status(), "URL directe en navigation privée").toBe(404);
    await page.screenshot({ path: "docs/captures/r2/01-video-pending-navigation-privee.png", fullPage: true });

    await page.goto(`${baseURL}/profils/${profile.id}`);
    await page.screenshot({ path: "docs/captures/r2/02-fiche-publique-sans-video.png", fullPage: true });
    await privateContext.close();

    await candidate.delete("/api/me/profile/video");
    await Promise.all([candidate.dispose(), recruiter.dispose(), admin.dispose()]);
  });

  test("l'administration valide : la vidéo devient publique", async ({ playwright, baseURL, request }) => {
    const candidate = await freshCandidate(playwright, baseURL!);
    const admin = await contextFor(playwright, baseURL!, ADMIN);

    const { profile, videoPath } = await uploadVideo(candidate);
    expect((await request.get(videoPath)).status()).toBe(404);

    const decision = await admin.patch(`/api/admin/videos/${profile.id}`, {
      data: { decision: "approved" },
    });
    expect(decision.status()).toBe(200);
    const row = await decision.json();
    expect(row.videoStatus).toBe("approved");
    expect(row.decidedBy, "auteur de la décision").toBeTruthy();
    expect(row.decidedAt, "date de la décision").toBeTruthy();

    // Une vidéo validée sur un profil encore en attente reste privée : les
    // deux modérations sont distinctes.
    expect((await request.get(videoPath)).status(), "profil pas encore publié").toBe(404);

    expect(
      (await admin.patch(`/api/admin/profiles/${profile.id}`, { data: { status: "published" } })).status(),
    ).toBe(200);

    expect((await request.get(videoPath)).status(), "vidéo validée, visiteur anonyme").toBe(200);

    await candidate.delete("/api/me/profile/video");
    await Promise.all([candidate.dispose(), admin.dispose()]);
  });

  test("un refus exige un motif, l'enregistre et le montre au candidat", async ({ playwright, baseURL, request }) => {
    const candidate = await freshCandidate(playwright, baseURL!);
    const admin = await contextFor(playwright, baseURL!, ADMIN);

    const { profile, videoPath } = await uploadVideo(candidate);

    const withoutReason = await admin.patch(`/api/admin/videos/${profile.id}`, {
      data: { decision: "rejected" },
    });
    expect(withoutReason.status(), "refus sans motif").toBe(400);

    const reason = "Le visage n'est pas visible : reprenez la vidéo de face, en lumière suffisante.";
    const rejected = await admin.patch(`/api/admin/videos/${profile.id}`, {
      data: { decision: "rejected", reason },
    });
    expect(rejected.status()).toBe(200);
    expect((await rejected.json()).videoStatus).toBe("rejected");

    expect((await request.get(videoPath)).status(), "vidéo refusée, visiteur anonyme").toBe(404);

    const mine = await (await candidate.get("/api/me/profile")).json();
    expect(mine.videoModeration.status).toBe("rejected");
    expect(mine.videoModeration.reason, "motif communiqué au candidat").toBe(reason);
    expect(mine.videoModeration.decidedBy).toBeTruthy();

    const again = await uploadVideo(candidate);
    expect(again.profile.videoModeration.status).toBe("pending");
    expect(again.profile.videoModeration.reason).toBeNull();

    await candidate.delete("/api/me/profile/video");
    await Promise.all([candidate.dispose(), admin.dispose()]);
  });

  test("la file de modération est réservée à l'administration", async ({ playwright, baseURL, request }) => {
    expect((await request.get("/api/admin/videos")).status(), "anonyme").toBe(401);

    const candidate = await freshCandidate(playwright, baseURL!);
    expect((await candidate.get("/api/admin/videos")).status(), "candidat").toBe(403);
    await candidate.dispose();

    const admin = await contextFor(playwright, baseURL!, ADMIN);
    const queue = await admin.get("/api/admin/videos?status=pending");
    expect(queue.status()).toBe(200);
    for (const row of (await queue.json()).items) expect(row.videoStatus).toBe("pending");
    await admin.dispose();
  });
});
