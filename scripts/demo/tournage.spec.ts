import { expect, test, type Page } from "@playwright/test";

const PASSWORD = "demo1234";
const CANDIDATE = "amina@exemple.fr";
const RECRUITER = "recruteur@exemple.fr";
const ADMIN = "admin@exemple.fr";

type Cue = { start: number; end: number; text: string };
const cues: Cue[] = [];
let t0 = 0;

const now = () => Date.now() - t0;

async function say(page: Page, text: string, hold: number) {
  const start = now();
  await page.waitForTimeout(hold);
  cues.push({ start, end: now(), text });
}

async function signIn(page: Page, email: string) {
  await page.context().clearCookies();
  const response = await page.request.post("/api/auth/sign-in/email", {
    data: { email, password: PASSWORD },
  });
  expect(response.status(), `connexion ${email}`).toBe(200);
}

async function scrollTo(page: Page, y: number, steps = 24) {
  const from = await page.evaluate(() => window.scrollY);
  for (let i = 1; i <= steps; i++) {
    await page.evaluate((to) => window.scrollTo(0, to), from + ((y - from) * i) / steps);
    await page.waitForTimeout(40);
  }
}

function srtTime(ms: number): string {
  const h = String(Math.floor(ms / 3_600_000)).padStart(2, "0");
  const m = String(Math.floor(ms / 60_000) % 60).padStart(2, "0");
  const s = String(Math.floor(ms / 1000) % 60).padStart(2, "0");
  return `${h}:${m}:${s},${String(ms % 1000).padStart(3, "0")}`;
}

test("tournage de la video de presentation", async ({ page }) => {
  test.setTimeout(240_000);
  t0 = Date.now();

  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  await say(page, "Un CV dit ce qu'on a fait. Il ne montre pas comment on le fait.", 4500);
  await scrollTo(page, 700);
  await say(page,
    "ProfilsActifs ajoute au dossier ce que le papier ne porte pas :\nune vidéo de présentation, et une certification des compétences.", 6000);

  await page.goto("/catalogue");
  await page.waitForLoadState("networkidle");
  await say(page, "Le catalogue est public.", 2500);

  const search = page.getByPlaceholder("Nom, métier, compétence");
  if (await search.count()) {
    await search.click();
    await search.pressSequentially("développeur", { delay: 110 });
    await page.waitForTimeout(1200);
  }
  await say(page, "On filtre par métier, secteur, ville, compétence.", 3500);

  const firstCard = page.locator('a[href^="/profils/"]').first();
  if (await firstCard.count()) {
    await firstCard.click();
    await page.waitForLoadState("networkidle");
  }
  await say(page,
    "Et on tombe sur un profil qui se présente lui-même, en vidéo,\navec son badge de certification.", 5500);

  await signIn(page, CANDIDATE);
  await page.goto("/candidate");
  await page.waitForLoadState("networkidle");
  await say(page,
    "Côté demandeur, tout tient sur un écran :\nle profil, la vidéo, les vues, les contacts reçus.", 5500);
  await scrollTo(page, 600);
  await say(page, "La vidéo part en modération avant d'être diffusable.", 3500);

  await page.goto("/candidate/consentement");
  await page.waitForLoadState("networkidle");
  await say(page, "Aucune vidéo n'est hébergée sans accord explicite.", 3500);
  await scrollTo(page, 500);
  await say(page,
    "L'accord se retire d'un clic. Le retrait supprime le fichier —\nla page le dit avant de le faire.", 5500);
  await scrollTo(page, 900);
  await say(page, "Et garde la trace de ce qui avait été consenti, pour trente-six mois.", 4000);

  await page.goto("/candidate/certification");
  await page.waitForLoadState("networkidle");
  await say(page, "Un questionnaire, un barème pondéré, un badge.", 3000);

  const options = page.locator('input[type="radio"], button[role="radio"]');
  for (let i = 0; i < 2 && (await options.count()) > i * 4; i++) {
    await options.nth(i * 4).click({ timeout: 5000 }).catch(() => {});
    await page.waitForTimeout(900);
  }
  await say(page,
    "La certification n'est pas déclarative : elle est passée sur la plateforme,\net le score s'affiche sur le profil public.", 5500);

  await signIn(page, RECRUITER);
  await page.goto("/recruiter");
  await page.waitForLoadState("networkidle");
  await say(page, "Le recruteur met de côté, contacte, et suit chaque échange.", 4000);
  await scrollTo(page, 600);
  await say(page,
    "Le demandeur reçoit la notification dans son espace :\nla mise en relation est tracée des deux côtés.", 5000);

  await signIn(page, ADMIN);
  await page.goto("/admin");
  await page.waitForLoadState("networkidle");
  await say(page, "L'administration modère les vidéos avant diffusion.", 3500);

  const videosTab = page.getByRole("button", { name: /vidéos/i }).first();
  if (await videosTab.count()) {
    await videosTab.click();
    await page.waitForTimeout(1800);
  }
  await say(page, "Elle gère le questionnaire et pilote la plateforme.", 3500);

  await page.goto("/api/docs");
  await page.waitForTimeout(2500);
  await say(page,
    "Et toute l'API est documentée et essayable,\ngénérée depuis les routes elles-mêmes.", 5000);

  await page.goto("/");
  await say(page, "ProfilsActifs. La compétence se voit, et se certifie.", 4000);

  const srt = cues
    .map((cue, i) => `${i + 1}\n${srtTime(cue.start)} --> ${srtTime(cue.end)}\n${cue.text}\n`)
    .join("\n");

  const { writeFileSync, mkdirSync } = await import("node:fs");
  mkdirSync("docs/captures/video", { recursive: true });
  writeFileSync("docs/captures/video/sous-titres.srt", srt, "utf-8");

  console.log(`\nDurée du tournage : ${srtTime(now())} — ${cues.length} sous-titres.`);
});
