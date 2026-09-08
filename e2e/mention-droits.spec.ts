import { expect, test, type Page } from "@playwright/test";

const PHRASE =
  "Aucune donnée de ce service n'est utilisée pour déterminer vos droits ni le montant de vos allocations.";

const PASSWORD = "demo1234";
const CANDIDATE = "amina@exemple.fr";

const PAGES_CANDIDAT = [
  { url: "/candidate", nom: "tableau de bord" },
  { url: "/candidate/certification", nom: "certification" },
  { url: "/candidate/consentement", nom: "consentement" },
];

const PAGES_AUTH = [
  { url: "/login", nom: "connexion" },
  { url: "/register", nom: "inscription" },
];

async function attendreLaMention(page: Page) {
  const bandeau = page.getByTestId("mention-droits");
  await expect(bandeau).toBeVisible();
  await expect(bandeau).toHaveText(PHRASE);
}

async function seConnecter(page: Page) {
  await page.goto("/login");
  await page.getByLabel("Adresse e-mail").fill(CANDIDATE);
  await page.getByLabel("Mot de passe").fill(PASSWORD);
  await page.getByRole("button", { name: "Se connecter" }).click();
  await page.waitForURL("**/candidate");
}

test.describe("bandeau permanent sur l'usage des donnees", () => {
  for (const { url, nom } of PAGES_AUTH) {
    test(`la page ${nom} porte la mention`, async ({ page }) => {
      await page.goto(url);
      await attendreLaMention(page);
    });
  }

  test("les trois pages de l'espace candidat portent la mention", async ({ page }) => {
    await seConnecter(page);

    for (const { url } of PAGES_CANDIDAT) {
      await page.goto(url);
      await attendreLaMention(page);
    }
  });

  test("la page 404 porte la mention", async ({ page }) => {
    const response = await page.goto("/adresse-qui-n-existe-pas");
    expect(response?.status()).toBe(404);
    await attendreLaMention(page);
  });

  test("la mention est servie entiere, sans troncature", async ({ page }) => {
    await page.goto("/login");

    const texte = await page.getByTestId("mention-droits").innerText();
    expect(texte.trim()).toBe(PHRASE);
    expect(texte).not.toContain("…");
  });
});
