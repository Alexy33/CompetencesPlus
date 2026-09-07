import { expect, test, type APIRequestContext } from "@playwright/test";

const PASSWORD = "demo1234";

const ADULT_BIRTH_DATE = "1990-05-17";

async function signIn(request: APIRequestContext, email: string) {
  const response = await request.post("/api/auth/sign-in/email", {
    data: { email, password: PASSWORD },
  });
  expect(response.status(), `connexion de ${email}`).toBe(200);
}

async function contextFor(browserBaseURL: string, playwright: typeof import("@playwright/test"), email: string) {
  const context = await playwright.request.newContext({ baseURL: browserBaseURL });
  await signIn(context, email);
  return context;
}

test.describe("Catalogue public", () => {
  test("sert les profils publies, pagines", async ({ request }) => {
    const response = await request.get("/api/profiles?page=1&pageSize=5");
    expect(response.status()).toBe(200);

    const body = await response.json();
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.items.length).toBeLessThanOrEqual(5);
    expect(body.meta).toMatchObject({ page: 1, pageSize: 5 });
    expect(body.meta.total).toBeGreaterThan(0);
  });

  test("refuse une taille de page au-dela du plafond reglementaire", async ({ request }) => {

    const response = await request.get("/api/profiles?pageSize=50");
    expect(response.status()).toBe(400);
    expect((await response.json()).error.code).toBe("bad_request");
  });

  test("refuse une valeur hors vocabulaire", async ({ request }) => {
    const response = await request.get("/api/profiles?sector=Pas%20un%20secteur");
    expect(response.status()).toBe(400);
  });

  test("cumule les competences demandees", async ({ request }) => {
    const response = await request.get("/api/profiles?skills=Rigueur&skills=Autonomie");
    expect(response.status()).toBe(200);

    for (const item of (await response.json()).items) {
      expect(item.skills).toEqual(expect.arrayContaining(["Rigueur", "Autonomie"]));
    }
  });

  test("ne divulgue pas les profils non publies", async ({ request }) => {
    const response = await request.get("/api/profiles/identifiant-inexistant");
    expect(response.status()).toBe(404);
  });
});

test.describe("Controle d'acces", () => {
  test("refuse 401 sans session", async ({ request }) => {
    for (const path of ["/api/me/profile", "/api/me/favorites", "/api/admin/stats"]) {
      expect((await request.get(path)).status(), path).toBe(401);
    }
  });

  test("refuse 403 avec une session de role insuffisant", async ({ playwright, baseURL }) => {
    const candidate = await contextFor(baseURL!, playwright, "amina@exemple.fr");

    expect((await candidate.get("/api/admin/stats")).status()).toBe(403);
    expect((await candidate.get("/api/me/favorites")).status()).toBe(403);

    await candidate.dispose();
  });

  test("l'inscription publique ne peut pas fabriquer un administrateur", async ({ request }) => {

    const response = await request.post("/api/auth/sign-up/email", {
      data: {
        name: "Tentative",
        email: `escalade-${Date.now()}@test.fr`,
        password: PASSWORD,
        birthDate: ADULT_BIRTH_DATE,
        role: "admin",
      },
    });

    expect(response.status()).toBe(200);
    expect((await response.json()).user.role).toBe("candidate");
  });
});

test.describe("Espace demandeur", () => {
  test("lit et met a jour son profil", async ({ playwright, baseURL }) => {
    const candidate = await contextFor(baseURL!, playwright, "amina@exemple.fr");

    expect((await candidate.get("/api/me/profile")).status()).toBe(200);

    const updated = await candidate.patch("/api/me/profile", {
      data: { title: "Responsable relation client", skills: ["Communication", "Rigueur"] },
    });
    expect(updated.status()).toBe(200);

    const body = await updated.json();
    expect(body.title).toBe("Responsable relation client");
    expect(body.skills.sort()).toEqual(["Communication", "Rigueur"]);

    const rejected = await candidate.patch("/api/me/profile", { data: { sector: "Inexistant" } });
    expect(rejected.status()).toBe(400);

    await candidate.dispose();
  });
});

test.describe("Certification", () => {
  test("un sans-faute delivre le badge", async ({ playwright, baseURL, request }) => {
    const candidate = await contextFor(baseURL!, playwright, "amina@exemple.fr");

    await candidate.post("/api/me/certification/restart");

    const questionnaire = await (await request.get("/api/certification/questions")).json();
    expect(questionnaire.questions.length).toBeGreaterThan(0);

    expect(questionnaire.questions[0]).not.toHaveProperty("weight");

    const answers: Record<string, number> = {};
    for (const question of questionnaire.questions) {
      answers[question.id] = question.options.length - 1;
    }

    const saved = await candidate.put("/api/me/certification/answers", { data: { answers } });
    expect(saved.status()).toBe(200);
    expect((await saved.json()).answered).toBe(questionnaire.questions.length);

    const result = await candidate.post("/api/me/certification/submit");
    expect(result.status()).toBe(200);
    expect(await result.json()).toMatchObject({ score: 100, passed: true, certified: true });

    await candidate.dispose();
  });

  test("refuse une reponse qui n'existe pas", async ({ playwright, baseURL }) => {
    const candidate = await contextFor(baseURL!, playwright, "amina@exemple.fr");

    const response = await candidate.put("/api/me/certification/answers", {
      data: { answers: { "question-fantome": 1 } },
    });
    expect(response.status()).toBe(422);

    await candidate.dispose();
  });
});

test.describe("Espace recruteur", () => {
  test("favoris, contact et suivi", async ({ playwright, baseURL, request }) => {
    const recruiter = await contextFor(baseURL!, playwright, "recruteur@exemple.fr");

    const catalog = await (await request.get("/api/profiles?pageSize=20")).json();
    const target = catalog.items.find((item: { name: string }) => item.name === "Amina Berthier");
    expect(target, "profil de demonstration attendu — lancez `npm run db:seed`").toBeTruthy();

    expect((await recruiter.put(`/api/me/favorites/${target.id}`)).status()).toBe(200);
    expect((await recruiter.put(`/api/me/favorites/${target.id}`)).status()).toBe(200);

    const favorites = await (await recruiter.get("/api/me/favorites")).json();
    expect(favorites.items.filter((f: { profile: { id: string } }) => f.profile.id === target.id)).toHaveLength(1);

    const contact = await recruiter.post(`/api/profiles/${target.id}/contact`, {
      data: { message: "Bonjour, seriez-vous disponible cette semaine ?" },
    });
    expect(contact.status()).toBe(201);
    const contactId = (await contact.json()).id;

    const advanced = await recruiter.patch(`/api/me/contacts/${contactId}`, {
      data: { status: "Entretien planifié" },
    });
    expect(advanced.status()).toBe(200);

    const stats = await (await recruiter.get("/api/me/stats")).json();
    expect(stats.interviewsPlanned).toBeGreaterThanOrEqual(1);

    expect((await recruiter.patch("/api/me/contacts/inexistant", { data: { status: "Retenu" } })).status()).toBe(404);

    const candidate = await contextFor(baseURL!, playwright, "amina@exemple.fr");
    const notifications = await (await candidate.get("/api/me/notifications")).json();
    expect(notifications.items.some((n: { type: string }) => n.type === "contact")).toBe(true);

    await candidate.dispose();
    await recruiter.dispose();
  });
});

test.describe("Administration", () => {
  test("modere, gere les questions et les reglages", async ({ playwright, baseURL }) => {
    const admin = await contextFor(baseURL!, playwright, "admin@jeb.gouv.fr");

    expect((await admin.get("/api/admin/stats")).status()).toBe(200);

    const queue = await (await admin.get("/api/admin/profiles")).json();
    expect(queue.items.length).toBeGreaterThan(0);

    const created = await admin.post("/api/admin/questions", {
      data: {
        text: "Question ajoutee par le test ?",
        weight: 3,
        options: [
          { label: "Reponse faible", value: 0 },
          { label: "Reponse forte", value: 1 },
        ],
      },
    });
    expect(created.status()).toBe(201);
    const questionId = (await created.json()).id;

    expect((await admin.patch(`/api/admin/questions/${questionId}`, { data: { weight: 5 } })).status()).toBe(200);
    expect((await admin.delete(`/api/admin/questions/${questionId}`)).status()).toBe(200);
    expect((await admin.delete(`/api/admin/questions/${questionId}`)).status()).toBe(404);

    expect((await admin.patch("/api/admin/settings", { data: { certificationThreshold: 75 } })).status()).toBe(200);
    const reference = await (await admin.get("/api/reference")).json();
    expect(reference.certificationThreshold).toBe(75);

    expect((await admin.patch("/api/admin/settings", { data: { certificationThreshold: 500 } })).status()).toBe(400);

    await admin.patch("/api/admin/settings", { data: { certificationThreshold: 70 } });
    await admin.dispose();
  });
});

test.describe("Consentement video (R.3)", () => {

  test("accord horodate et versionne, retrait qui supprime le fichier", async ({ playwright, baseURL }) => {
    const email = `consent-${Date.now()}@exemple.fr`;
    const context = await playwright.request.newContext({ baseURL });

    const signUp = await context.post("/api/auth/sign-up/email", {
      data: { name: "Consentement Test", email, password: PASSWORD, birthDate: ADULT_BIRTH_DATE },
    });
    expect(signUp.status()).toBe(200);

    const profileId = (await (await context.get("/api/me/profile")).json()).id as string;

    const payload = Buffer.concat([
      Buffer.from([0, 0, 0, 0x18]),
      Buffer.from("ftypmp42"),
      Buffer.alloc(64, 0x21),
    ]);

    const refused = await context.put("/api/me/profile/video", {
      headers: { "Content-Type": "video/mp4" },
      data: payload,
    });
    expect(refused.status()).toBe(403);

    const granted = await (await context.post("/api/me/profile/video/consent")).json();
    expect(granted.granted).toBe(true);
    expect(granted.version).toBeTruthy();
    expect(Number.isNaN(Date.parse(granted.grantedAt))).toBe(false);
    expect(granted.revokedAt).toBeNull();

    const uploaded = await context.put("/api/me/profile/video", {
      headers: { "Content-Type": "video/mp4" },
      data: payload,
    });
    expect(uploaded.status()).toBe(200);

    // L'adresse de lecture vient du fournisseur : elle porte un identifiant
    // opaque, jamais l'identifiant du profil ni un chemin de fichier.
    const withVideo = await uploaded.json();
    expect(withVideo.video.state).toBe("ready");
    expect(withVideo.video.provider).toBe("local");
    const videoPath = withVideo.video.playback.url as string;
    expect(videoPath).toMatch(/^\/api\/videos\/[0-9a-f]{32}$/);
    expect(videoPath).not.toContain(profileId);

    expect((await context.get(videoPath)).status()).toBe(200);
    expect((await context.get(`/api/videos/${profileId}`)).status(), "identifiant de profil").toBe(404);

    // Le lien tiers est un troisieme fournisseur, eteint par defaut : meme
    // avec un consentement en cours, il est refuse.
    const lienRefuse = await context.patch("/api/me/profile", {
      data: { videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    });
    expect(lienRefuse.status(), "hebergement tiers desactive").toBe(403);

    const revoked = await (await context.delete("/api/me/profile/video/consent")).json();
    expect(revoked.granted).toBe(false);
    expect(Number.isNaN(Date.parse(revoked.revokedAt))).toBe(false);

    expect(revoked.grantedAt).toBe(granted.grantedAt);
    expect(revoked.version).toBe(granted.version);

    // Le retrait passe par VideoProvider.delete() : les octets ont disparu,
    // l'adresse de lecture ne rend plus rien.
    expect((await context.get(videoPath)).status(), "octets supprimes").toBe(404);

    const after = await (await context.get("/api/me/profile")).json();
    expect(after.id).toBe(profileId);
    expect(after.video.state).toBe("none");
    expect(after.video.playback).toBeNull();

    // Sans consentement, plus rien ne peut etre depose.
    expect((await context.put("/api/me/profile/video", {
      headers: { "Content-Type": "video/mp4" },
      data: payload,
    })).status()).toBe(403);

    await context.dispose();
  });
});

test.describe("Documentation", () => {
  test("la specification couvre toutes les routes du domaine", async ({ request }) => {
    const spec = await (await request.get("/api/openapi")).json();
    expect(spec.openapi).toMatch(/^3\./);

    for (const path of [
      "/api/profiles",
      "/api/profiles/{id}",
      "/api/me/profile",
      "/api/me/certification",
      "/api/me/favorites/{profileId}",
      "/api/admin/questions",
      "/api/auth/sign-in/email",
    ]) {
      expect(spec.paths[path], `${path} absent de la specification`).toBeDefined();
    }
  });

  test("Scalar est servie et lit la specification", async ({ page }) => {
    await page.goto("/api/docs");
    await expect(page).toHaveTitle(/ProfilsActifs/);
  });
});
