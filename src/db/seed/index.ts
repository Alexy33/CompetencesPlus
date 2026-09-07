import { db } from "@/db";
import { setting } from "@/db/schema";
import { DEFAULT_CERTIFICATION_THRESHOLD, DEFAULT_PAGE_SIZE } from "@/lib/vocabulary";
import { createAccount, DEMO_PASSWORD } from "./accounts";
import { seedRecruiterCompany } from "./company";
import { seedProfiles } from "./profiles";
import { seedQuestions } from "./questions";
import { seedRecruiterActivity } from "./recruiter-activity";
import { resetDomain } from "./reset";
import { seedVideoModeration } from "./video-moderation";

const DEMO_ACCOUNTS = [
  { email: "amina@exemple.fr", role: "candidate" },
  { email: "recruteur@exemple.fr", role: "recruiter" },
  { email: "admin@jeb.gouv.fr", role: "admin" },
];

async function seedSettings() {
  await db.insert(setting).values([
    { key: "certificationThreshold", value: String(DEFAULT_CERTIFICATION_THRESHOLD) },
    { key: "catalogPageSize", value: String(DEFAULT_PAGE_SIZE) },
  ]);
}

async function seed() {
  console.log("[seed] nettoyage…");
  await resetDomain();

  console.log("[seed] questions…");
  const questionCount = await seedQuestions();

  console.log("[seed] réglages…");
  await seedSettings();

  console.log("[seed] comptes et profils…");
  const profiles = await seedProfiles();

  const recruiterId = await createAccount(
    "Hélène Vaugirard",
    "recruteur@exemple.fr",
    "recruiter",
    "1980-02-14",
  );
  await seedRecruiterCompany(recruiterId);

  const adminId = await createAccount(
    "Thomas Vignal",
    "admin@jeb.gouv.fr",
    "admin",
    "1972-06-09",
  );

  console.log("[seed] modération des vidéos…");
  await seedVideoModeration(adminId);

  console.log("[seed] suivi recruteur…");
  await seedRecruiterActivity(recruiterId);

  if (profiles.videoFailures > 0) {
    console.warn(
      `[seed] attention : ${profiles.videoFailures} vidéo(s) non générée(s) — ffmpeg est-il installé ?` +
        " Les fiches concernées afficheront « Aucune présentation vidéo ».",
    );
  }

  console.log(`[seed] terminé — ${profiles.count} profils, ${questionCount} questions.`);
  console.log(`[seed] comptes de démonstration (mot de passe « ${DEMO_PASSWORD} ») :`);
  for (const account of DEMO_ACCOUNTS) {
    console.log(`  ${account.email.padEnd(22)}${account.role}`);
  }
}

seed()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed] échec :", error);
    process.exit(1);
  });
