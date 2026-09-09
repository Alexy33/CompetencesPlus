import { readFileSync } from "node:fs";
import { eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { profile, profileSkill, user } from "@/db/schema";
import { createAccount } from "@/db/seed/accounts";
import { CITIES, SECTORS, SKILLS, DEFAULT_CERTIFICATION_THRESHOLD } from "@/lib/vocabulary";
import { grantVideoConsent, storeProfileVideo } from "@/server/services/video";

const CIBLE_PROFILS = Number(process.env.CHARGE_PROFILS ?? 500);
const CIBLE_VIDEOS = Number(process.env.CHARGE_VIDEOS ?? 300);
const GABARIT_VIDEO = process.env.CHARGE_VIDEO_FILE ?? "";

const PRENOMS = [
  "Amina", "Karim", "Sonia", "Mathieu", "Fatou", "Tristan", "Leila", "Pierre-Yves",
  "Marion", "Yann", "Nadia", "Olivier", "Claire", "Sebastien", "Ines", "Hugo",
  "Awa", "Julien", "Meryem", "Lucas", "Chloe", "Farid", "Elodie", "Bastien",
];
const NOMS = [
  "Berthier", "Vasseur", "Delaunay", "Ozanne", "Nguyen", "Lebel", "Amrani", "Caron",
  "Esteve", "Kervella", "Chevallier", "Ranucci", "Bonnefoy", "Marchal", "Fontaine",
  "Leclercq", "Diallo", "Moreau", "Benali", "Perrin", "Roussel", "Guerin", "Faure",
];
const METIERS = [
  "Chargé de relation client", "Préparateur de commandes", "Développeuse front-end",
  "Aide-soignant", "Assistante de direction", "Électricien du bâtiment",
  "Conductrice de ligne", "Technicien support", "Éducatrice de jeunes enfants",
  "Magasinier cariste", "Vendeuse conseil", "Chef de projet junior", "Infirmière",
  "Conducteur de travaux", "Comptable", "Agent de maintenance", "Cuisinier",
];

function pseudoAleatoire(graine: number): () => number {
  let etat = graine;
  return () => {
    etat = (etat * 1664525 + 1013904223) % 4294967296;
    return etat / 4294967296;
  };
}

function clipVideo(): Buffer {
  if (GABARIT_VIDEO) return readFileSync(GABARIT_VIDEO);

  const entete = Buffer.from([
    0x00, 0x00, 0x00, 0x20, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
    0x00, 0x00, 0x02, 0x00, 0x69, 0x73, 0x6f, 0x6d, 0x69, 0x73, 0x6f, 0x32,
    0x61, 0x76, 0x63, 0x31, 0x6d, 0x70, 0x34, 0x31,
  ]);
  return Buffer.concat([entete, Buffer.alloc(96 * 1024)]);
}

function fluxDe(contenu: Buffer): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      controller.enqueue(new Uint8Array(contenu));
      controller.close();
    },
  });
}

async function main(): Promise<void> {
  const debut = Date.now();
  const alea = pseudoAleatoire(20260909);
  const clip = clipVideo();

  const [{ existants }] = await db
    .select({ existants: sql<number>`count(*)` })
    .from(profile)
    .innerJoin(user, eq(user.id, profile.userId))
    .where(eq(user.role, "candidate"));

  const aCreer = Math.max(0, CIBLE_PROFILS - existants);

  console.log("Jeu de donnees pour les tests de charge");
  console.log(`  profils candidats deja en base : ${existants}`);
  console.log(`  profils a creer                : ${aCreer}`);
  console.log(`  videos visees                  : ${CIBLE_VIDEOS}`);
  console.log(`  taille du clip                 : ${(clip.length / 1024).toFixed(0)} Ko`);
  console.log(`  depot des videos               : via storeProfileVideo() (interface fournisseur)\n`);

  const marqueur = Date.now().toString(36);

  for (let i = 0; i < aCreer; i += 1) {
    const prenom = PRENOMS[Math.floor(alea() * PRENOMS.length)];
    const nom = NOMS[Math.floor(alea() * NOMS.length)];
    const email = `charge.${marqueur}.${i}@exemple.fr`;
    const naissance = `19${60 + Math.floor(alea() * 40)}-0${1 + Math.floor(alea() * 9)}-1${Math.floor(alea() * 9)}`;

    const userId = await createAccount(`${prenom} ${nom}`, email, "candidate", naissance);

    const [cree] = await db
      .select({ id: profile.id })
      .from(profile)
      .where(eq(profile.userId, userId))
      .limit(1);
    if (!cree) continue;

    const score = alea() < 0.55 ? 50 + Math.floor(alea() * 51) : 0;
    const certifie = score >= DEFAULT_CERTIFICATION_THRESHOLD;

    await db
      .update(profile)
      .set({
        title: METIERS[Math.floor(alea() * METIERS.length)],
        sector: SECTORS[Math.floor(alea() * SECTORS.length)],
        city: CITIES[Math.floor(alea() * CITIES.length)],
        bio: `Profil genere pour les tests de charge. ${prenom} ${nom}, ${1 + Math.floor(alea() * 20)} ans d'experience.`,
        status: "published",
        availability:
          alea() < 0.5 ? "immediate" : alea() < 0.7 ? "sous_preavis" : "non_disponible",
        score: score > 0 ? score : null,
        certifiedAt: certifie ? new Date(Date.now() - Math.floor(alea() * 9e8)) : null,
        updatedAt: new Date(Date.now() - Math.floor(alea() * 9e8)),
      })
      .where(eq(profile.id, cree.id));

    const nombreCompetences = 2 + Math.floor(alea() * 4);
    const choisies = new Set<string>();
    while (choisies.size < nombreCompetences) {
      choisies.add(SKILLS[Math.floor(alea() * SKILLS.length)]);
    }
    await db
      .insert(profileSkill)
      .values([...choisies].map((skill) => ({ profileId: cree.id, skill: skill as never })))
      .onConflictDoNothing();

    if ((i + 1) % 50 === 0) {
      console.log(`  ${i + 1}/${aCreer} profils crees`);
    }
  }

  const candidats = await db
    .select({ id: profile.id, videoId: profile.videoId })
    .from(profile)
    .innerJoin(user, eq(user.id, profile.userId))
    .where(eq(user.role, "candidate"));

  const sansVideo = candidats.filter((c) => !c.videoId);
  const dejaAvecVideo = candidats.length - sansVideo.length;
  const aTelecharger = Math.max(0, Math.min(CIBLE_VIDEOS - dejaAvecVideo, sansVideo.length));

  console.log(`\n  profils avec video deja presente : ${dejaAvecVideo}`);
  console.log(`  videos a deposer                 : ${aTelecharger}`);

  let deposees = 0;
  let echecs = 0;

  for (const candidat of sansVideo.slice(0, aTelecharger)) {
    try {
      await grantVideoConsent(candidat.id);
      await storeProfileVideo(candidat.id, "video/mp4", fluxDe(clip));
      deposees += 1;
      if (deposees % 50 === 0) console.log(`  ${deposees}/${aTelecharger} videos deposees`);
    } catch (error) {
      echecs += 1;
      if (echecs <= 3) console.error(`  echec sur ${candidat.id} :`, (error as Error).message);
    }
  }

  const [{ profils }] = await db
    .select({ profils: sql<number>`count(*)` })
    .from(profile)
    .innerJoin(user, eq(user.id, profile.userId))
    .where(eq(user.role, "candidate"));
  const [{ publies }] = await db
    .select({ publies: sql<number>`count(*)` })
    .from(profile)
    .where(eq(profile.status, "published"));
  const [{ avecVideo }] = await db
    .select({ avecVideo: sql<number>`count(*)` })
    .from(profile)
    .where(sql`${profile.videoId} is not null`);

  console.log("\n── ETAT FINAL ──");
  console.log(`  profils candidats : ${profils}`);
  console.log(`  profils publies   : ${publies}`);
  console.log(`  profils avec video: ${avecVideo}`);
  console.log(`  videos deposees   : ${deposees} (echecs : ${echecs})`);
  console.log(`  duree             : ${((Date.now() - debut) / 1000).toFixed(1)} s`);

  if (profils < CIBLE_PROFILS) {
    console.warn(`\n  ATTENTION : ${profils} profils pour ${CIBLE_PROFILS} vises.`);
  }
  if (avecVideo < CIBLE_VIDEOS) {
    console.warn(`  ATTENTION : ${avecVideo} videos pour ${CIBLE_VIDEOS} visees.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("[seed:charge] echec :", error);
    process.exit(1);
  });
