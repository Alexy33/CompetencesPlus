import http from "k6/http";
import { check, sleep } from "k6";
import { Trend } from "k6/metrics";

const BASE = __ENV.BASE_URL || "http://localhost:3000";
const PALIER = Number(__ENV.VUS || 100);
const DUREE = __ENV.DUREE || "60s";

const catalogueApi = new Trend("route_api_profiles", true);
const cataloguePage = new Trend("route_page_catalogue", true);
const ficheApi = new Trend("route_api_profil_fiche", true);

export const options = {
  scenarios: {
    recruteurs: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "15s", target: PALIER },
        { duration: DUREE, target: PALIER },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    "route_api_profiles": ["p(95)<1500"],
    "route_page_catalogue": ["p(95)<3000"],
  },
};

const SECTEURS = ["Numérique", "Santé", "Logistique", "Éducation", "Bâtiment", "Commerce", "Industrie"];
const VILLES = ["Paris", "Lyon", "Marseille", "Lille", "Nantes", "Bordeaux", "Strasbourg", "Toulouse"];
const RECHERCHES = ["client", "technicien", "gestion", "rigueur", "commerce"];

function alea(liste) {
  return liste[Math.floor(Math.random() * liste.length)];
}

export default function () {
  const page = 1 + Math.floor(Math.random() * 10);

  let r = http.get(`${BASE}/api/profiles?page=${page}&pageSize=12`, {
    tags: { route: "api_profiles" },
  });
  catalogueApi.add(r.timings.duration);
  check(r, { "catalogue API 200": (x) => x.status === 200 });

  let ids = [];
  try {
    ids = (r.json("items") || []).map((i) => i.id);
  } catch (e) {
    ids = [];
  }

  sleep(0.3 + Math.random() * 0.5);

  r = http.get(`${BASE}/catalogue?page=${page}`, { tags: { route: "page_catalogue" } });
  cataloguePage.add(r.timings.duration);
  check(r, { "catalogue page 200": (x) => x.status === 200 });

  sleep(0.3 + Math.random() * 0.5);

  const filtre = Math.random();
  if (filtre < 0.35) {
    r = http.get(`${BASE}/api/profiles?sector=${encodeURIComponent(alea(SECTEURS))}&pageSize=12`, {
      tags: { route: "api_profiles" },
    });
    catalogueApi.add(r.timings.duration);
    check(r, { "filtre secteur 200": (x) => x.status === 200 });
  } else if (filtre < 0.7) {
    r = http.get(`${BASE}/api/profiles?city=${encodeURIComponent(alea(VILLES))}&certified=true&pageSize=12`, {
      tags: { route: "api_profiles" },
    });
    catalogueApi.add(r.timings.duration);
    check(r, { "filtre ville 200": (x) => x.status === 200 });
  } else {
    r = http.get(`${BASE}/api/profiles?q=${encodeURIComponent(alea(RECHERCHES))}&pageSize=12`, {
      tags: { route: "api_profiles" },
    });
    catalogueApi.add(r.timings.duration);
    check(r, { "recherche libre 200": (x) => x.status === 200 });
  }

  sleep(0.2 + Math.random() * 0.4);

  if (ids.length > 0) {
    const id = alea(ids);
    r = http.get(`${BASE}/api/profiles/${id}`, { tags: { route: "api_profil_fiche" } });
    ficheApi.add(r.timings.duration);
    check(r, { "fiche profil 200": (x) => x.status === 200 });
  }

  sleep(0.5 + Math.random());
}
