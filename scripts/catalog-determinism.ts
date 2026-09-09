import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import { db } from "@/db";
import { profile, user } from "@/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { MAJORITY_AGE } from "@/lib/age";
import { CATALOG_ORDERS, DEFAULT_CATALOG_ORDER, type CatalogOrder } from "@/lib/catalog-order";
import { MAX_PAGE_SIZE } from "@/lib/vocabulary";

const BASE = process.env.CATALOG_BASE_URL ?? "http://localhost:3000";
const SORTIE = process.env.CATALOG_OUT_DIR ?? "preuves/tri-catalogue";

interface Parcours {
  ids: string[];
  pages: number;
}

async function parcourir(order: CatalogOrder, pageSize: number): Promise<Parcours> {
  const ids: string[] = [];
  let page = 1;
  let totalPages = 1;

  do {
    const url = `${BASE}/api/profiles?order=${order}&page=${page}&pageSize=${pageSize}`;
    const reponse = await fetch(url, { headers: { Origin: BASE } });
    if (!reponse.ok) {
      throw new Error(`${url} a repondu ${reponse.status}`);
    }

    const corps = (await reponse.json()) as {
      items: { id: string }[];
      meta: { totalPages: number };
    };

    for (const item of corps.items) ids.push(item.id);
    totalPages = corps.meta.totalPages;
    page += 1;
  } while (page <= totalPages);

  return { ids, pages: totalPages };
}

async function nombreEnBase(): Promise<number> {
  const [{ total }] = await db
    .select({ total: sql<number>`count(*)` })
    .from(profile)
    .innerJoin(user, eq(user.id, profile.userId))
    .where(
      and(
        eq(profile.status, "published"),
        sql`(${user.birthDate} IS NULL OR ${user.birthDate} <= date('now', '-${sql.raw(String(MAJORITY_AGE))} years'))`,
      ),
    );
  return total;
}

function doublons(ids: string[]): string[] {
  const vus = new Set<string>();
  const doubles = new Set<string>();
  for (const id of ids) {
    if (vus.has(id)) doubles.add(id);
    vus.add(id);
  }
  return [...doubles];
}

async function main(): Promise<void> {
  const order = (process.argv.find((a) => a.startsWith("--order="))?.split("=")[1] ??
    DEFAULT_CATALOG_ORDER) as CatalogOrder;
  const pageSize = Number(process.argv.find((a) => a.startsWith("--pageSize="))?.split("=")[1] ?? 5);

  if (!CATALOG_ORDERS.includes(order)) {
    throw new Error(`Ordre inconnu : ${order}. Attendu : ${CATALOG_ORDERS.join(", ")}`);
  }
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > MAX_PAGE_SIZE) {
    throw new Error(`pageSize doit etre un entier entre 1 et ${MAX_PAGE_SIZE}`);
  }

  mkdirSync(SORTIE, { recursive: true });

  console.log(`Determinisme du catalogue — ordre « ${order} », ${pageSize} profils par page`);
  console.log(`  cible : ${BASE}`);

  const attendu = await nombreEnBase();
  console.log(`  profils publies et visibles du public en base : ${attendu}`);

  const un = await parcourir(order, pageSize);
  const deux = await parcourir(order, pageSize);

  const fichierUn = path.join(SORTIE, `execution-1-${order}.txt`);
  const fichierDeux = path.join(SORTIE, `execution-2-${order}.txt`);
  writeFileSync(fichierUn, `${un.ids.join("\n")}\n`);
  writeFileSync(fichierDeux, `${deux.ids.join("\n")}\n`);

  const identiques = un.ids.length === deux.ids.length && un.ids.every((id, i) => id === deux.ids[i]);
  const doublesUn = doublons(un.ids);
  const manquants = attendu - new Set(un.ids).size;

  const premiereDivergence = un.ids.findIndex((id, i) => id !== deux.ids[i]);

  const rapport = [
    `Determinisme de la pagination du catalogue`,
    `Date            : ${new Date().toISOString()}`,
    `Cible           : ${BASE}`,
    `Ordre           : ${order}`,
    `Taille de page  : ${pageSize}`,
    `Pages parcourues: ${un.pages}`,
    ``,
    `Profils attendus (en base)   : ${attendu}`,
    `Identifiants execution 1     : ${un.ids.length}`,
    `Identifiants execution 2     : ${deux.ids.length}`,
    `Identifiants distincts       : ${new Set(un.ids).size}`,
    ``,
    `Listes identiques            : ${identiques ? "OUI" : "NON"}`,
    `Doublons                     : ${doublesUn.length === 0 ? "aucun" : doublesUn.join(", ")}`,
    `Manquants                    : ${manquants === 0 ? "aucun" : manquants}`,
    `Compte conforme a la base    : ${un.ids.length === attendu ? "OUI" : "NON"}`,
    ...(identiques ? [] : [`Premiere divergence a l'index: ${premiereDivergence}`]),
    ``,
    `Fichiers : ${fichierUn} / ${fichierDeux}`,
  ].join("\n");

  const fichierRapport = path.join(SORTIE, `comparaison-${order}.txt`);
  writeFileSync(fichierRapport, `${rapport}\n`);
  console.log(`\n${rapport}`);

  const succes =
    identiques && doublesUn.length === 0 && manquants === 0 && un.ids.length === attendu;

  console.log(`\n${succes ? "SUCCES" : "ECHEC"} — rapport ecrit dans ${fichierRapport}`);
  if (!succes) process.exitCode = 1;
}

main().catch((error) => {
  console.error("[catalog:determinisme] echec :", error);
  process.exit(1);
});
