import { and, desc, eq, isNotNull } from "drizzle-orm";

import { db } from "@/db";
import { certificationAnswer, certificationAttempt, profile, user } from "@/db/schema";
import {
  answersOf,
  computeScore,
  openCatchUp,
  questionsOf,
} from "@/server/services/certification";
import { listVersions, questionnaireVersion } from "@/server/services/questionnaire";
import { getSettings } from "@/server/services/settings";

interface Concerne {
  email: string;
  nom: string;
  versionTentative: number;
  scoreConserve: number | null;
  scoreSiRecalcul: number;
  ecart: number;
  badge: boolean;
  badgeSiRecalcul: boolean;
}

interface EtatDesLieux {
  passationsParVersion: Map<number, { soumises: number; enCours: number }>;
  passationsTotal: number;
  badges: number;
  concernes: Concerne[];
}

async function etatDesLieux(versionCourante: number, seuil: number): Promise<EtatDesLieux> {
  const tentatives = await db
    .select({
      id: certificationAttempt.id,
      userId: certificationAttempt.userId,
      version: certificationAttempt.questionnaireVersion,
      status: certificationAttempt.status,
      score: certificationAttempt.score,
      passed: certificationAttempt.passed,
      submittedAt: certificationAttempt.submittedAt,
    })
    .from(certificationAttempt)
    .orderBy(desc(certificationAttempt.submittedAt));

  const passationsParVersion = new Map<number, { soumises: number; enCours: number }>();
  for (const version of listVersions()) {
    passationsParVersion.set(version, { soumises: 0, enCours: 0 });
  }

  for (const tentative of tentatives) {
    const ligne = passationsParVersion.get(tentative.version) ?? { soumises: 0, enCours: 0 };
    if (tentative.status === "submitted") ligne.soumises += 1;
    else ligne.enCours += 1;
    passationsParVersion.set(tentative.version, ligne);
  }

  const badges = (
    await db.select({ id: profile.id }).from(profile).where(isNotNull(profile.certifiedAt))
  ).length;

  const questionsCourantes = questionsOf(versionCourante);
  const vus = new Set<string>();
  const concernes: Concerne[] = [];

  for (const tentative of tentatives) {
    if (tentative.status !== "submitted") continue;
    if (tentative.version >= versionCourante) continue;
    if (vus.has(tentative.userId)) continue;
    vus.add(tentative.userId);

    const reponses = await answersOf(tentative.id);
    const scoreSiRecalcul = computeScore(questionsCourantes, reponses);

    const [titulaire] = await db
      .select({ email: user.email, nom: user.name })
      .from(user)
      .where(eq(user.id, tentative.userId))
      .limit(1);

    concernes.push({
      email: titulaire?.email ?? tentative.userId,
      nom: titulaire?.nom ?? "",
      versionTentative: tentative.version,
      scoreConserve: tentative.score,
      scoreSiRecalcul,
      ecart: scoreSiRecalcul - (tentative.score ?? 0),
      badge: tentative.passed === true,
      badgeSiRecalcul: scoreSiRecalcul >= seuil,
    });
  }

  return {
    passationsParVersion,
    passationsTotal: tentatives.length,
    badges,
    concernes,
  };
}

function afficherEtat(titre: string, etat: EtatDesLieux): void {
  console.log(`\n── ${titre} ──`);
  console.log(`  passations : ${etat.passationsTotal}`);
  for (const [version, ligne] of [...etat.passationsParVersion].sort((a, b) => a[0] - b[0])) {
    console.log(`    v${version} : ${ligne.soumises} soumise(s), ${ligne.enCours} en cours`);
  }
  console.log(`  badges attribués : ${etat.badges}`);
}

function afficherConcernes(concernes: Concerne[], seuil: number, versionCourante: number): void {
  console.log(`\n── Candidats dont la passation précède la v${versionCourante} ──`);

  if (concernes.length === 0) {
    console.log("  aucun");
    return;
  }

  console.log(
    `  ${"candidat".padEnd(34)}${"passé en".padEnd(10)}${"score conservé".padEnd(16)}${"si recalcul".padEnd(13)}écart`,
  );
  for (const c of concernes) {
    const identite = `${c.nom} <${c.email}>`.slice(0, 33);
    console.log(
      `  ${identite.padEnd(34)}${`v${c.versionTentative}`.padEnd(10)}` +
        `${String(c.scoreConserve ?? "—").padEnd(16)}${String(c.scoreSiRecalcul).padEnd(13)}${c.ecart}`,
    );
  }

  const perdraientLeBadge = concernes.filter((c) => c.badge && !c.badgeSiRecalcul);
  console.log(
    `\n  Si les scores étaient recalculés d'office sur la version en vigueur (seuil ${seuil}/100) :`,
  );
  console.log(`    ${perdraientLeBadge.length} candidat(s) sur ${concernes.length} perdraient leur badge.`);
  console.log("    C'est la raison pour laquelle le recalcul d'office est écarté :");
  console.log("    les questions ajoutées n'ont pas de réponse et sont comptées à zéro.");
}

async function reinitialiser(versionCourante: number): Promise<{ purgees: number; ouvertes: number }> {
  const candidats = await db
    .select({ id: user.id, email: user.email })
    .from(user)
    .where(eq(user.role, "candidate"));

  let purgees = 0;
  let ouvertes = 0;

  for (const candidat of candidats) {
    const enCours = await db
      .select({ id: certificationAttempt.id })
      .from(certificationAttempt)
      .where(
        and(
          eq(certificationAttempt.userId, candidat.id),
          eq(certificationAttempt.status, "in_progress"),
        ),
      );

    for (const tentative of enCours) {
      await db
        .delete(certificationAnswer)
        .where(eq(certificationAnswer.attemptId, tentative.id));
      await db.delete(certificationAttempt).where(eq(certificationAttempt.id, tentative.id));
      purgees += 1;
    }

    await db.insert(certificationAttempt).values({
      id: crypto.randomUUID(),
      userId: candidat.id,
      status: "in_progress",
      questionnaireVersion: versionCourante,
      catchUp: false,
    });
    ouvertes += 1;

    console.log(`  passation complète ouverte : ${candidat.email}`);
  }

  return { purgees, ouvertes };
}

async function main(): Promise<void> {
  const appliquer = process.argv.includes("--apply");
  const reset = process.argv.includes("--reset");
  const versionCourante = questionnaireVersion();
  const { certificationThreshold: seuil } = await getSettings();

  console.log("Migration du questionnaire de certification");
  console.log(`  versions publiées   : ${listVersions().map((v) => `v${v}`).join(", ")}`);
  console.log(`  version en vigueur  : v${versionCourante} (${questionsOf(versionCourante).length} questions)`);
  console.log(`  seuil de certification : ${seuil}/100`);
  const mode = reset
    ? appliquer
      ? "RÉINITIALISATION (passation complète pour tous)"
      : "réinitialisation simulée (aucune écriture)"
    : appliquer
      ? "APPLICATION (rattrapage ciblé)"
      : "état des lieux (aucune écriture)";
  console.log(`  mode : ${mode}`);

  const avant = await etatDesLieux(versionCourante, seuil);
  afficherEtat("AVANT", avant);
  afficherConcernes(avant.concernes, seuil, versionCourante);

  if (!appliquer) {
    console.log("\nAucune écriture.");
    console.log("  --apply           ouvre un rattrapage limité aux questions nouvelles");
    console.log("  --apply --reset   ouvre une passation complète des 20 questions pour tous");
    return;
  }

  if (reset) {
    console.log("\n── RÉINITIALISATION ──");
    const { purgees, ouvertes } = await reinitialiser(versionCourante);
    const apresReset = await etatDesLieux(versionCourante, seuil);
    afficherEtat("APRÈS", apresReset);

    console.log("\n── BILAN ──");
    console.log(`  tentatives en cours purgées : ${purgees}`);
    console.log(`  passations complètes ouvertes : ${ouvertes}`);
    console.log(`  questions posées à chacun    : ${questionsOf(versionCourante).length}`);
    console.log(`  passations soumises conservées : ${apresReset.passationsTotal - ouvertes}`);
    console.log(`  badges retirés               : ${avant.badges - apresReset.badges}`);
    console.log("\n  Chaque candidat repasse l'intégralité du questionnaire.");
    console.log("  Les passations déjà soumises restent en base comme historique,");
    console.log("  et le badge obtenu reste affiché jusqu'à la nouvelle soumission.");
    return;
  }

  console.log("\n── APPLICATION ──");
  let ouverts = 0;
  let ignores = 0;

  for (const concerne of avant.concernes) {
    const [titulaire] = await db
      .select({ id: user.id })
      .from(user)
      .where(eq(user.email, concerne.email))
      .limit(1);
    if (!titulaire) continue;

    const rattrapage = await openCatchUp(titulaire.id);
    if (rattrapage) {
      ouverts += 1;
      console.log(
        `  rattrapage ouvert : ${concerne.email} — ` +
          `${rattrapage.questionIds.length} question(s) à reposer, ` +
          `${rattrapage.carriedOver} réponse(s) reportée(s)`,
      );
    } else {
      ignores += 1;
      console.log(`  déjà à jour ou rattrapage en cours : ${concerne.email}`);
    }
  }

  const apres = await etatDesLieux(versionCourante, seuil);
  afficherEtat("APRÈS", apres);

  console.log("\n── BILAN ──");
  console.log(`  rattrapages ouverts        : ${ouverts}`);
  console.log(`  déjà à jour (sans effet)   : ${ignores}`);
  console.log(`  badges retirés             : ${avant.badges - apres.badges}`);
  console.log(`  scores modifiés d'office   : 0`);
  console.log("\n  Aucun badge n'est retiré et aucun score n'est recalculé sans que le");
  console.log("  candidat ait répondu aux questions ajoutées.");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[certification:migrate] échec :", error);
    process.exit(1);
  });
