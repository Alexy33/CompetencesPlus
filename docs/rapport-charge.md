# Rapport de test de charge — catalogue

9 septembre 2026.

## 1. Conditions de mesure

| | |
|---|---|
| **Outil** | k6 v0.54.0 (commit baba871c8a, go1.23.1, linux/amd64) |
| **Machine** | Intel Core i5-1335U (13ᵉ gén.), 12 cœurs, 15 Gio de RAM |
| **Noyau** | Linux 6.17.0-35-generic |
| **Runtime** | Node v20.19.5, Next.js 16.3.3, `next start` (production, pas `next dev`) |
| **Base** | SQLite via better-sqlite3, journalisation WAL, fichier local |
| **Client et serveur** | Même machine — les temps n'incluent aucune latence réseau |

Le client de charge partage les 12 cœurs avec le serveur : les chiffres sont donc
**pessimistes** par rapport à un déploiement où k6 tournerait ailleurs.

## 2. Jeu de données

`npm run seed:charge` — script versionné, relançable sur une base vide.

| | |
|---|---|
| Profils candidats | **500** |
| Profils publiés | **497** |
| Profils avec vidéo | **300** |
| Durée de génération | 67 s, 0 échec |

Les vidéos sont déposées par `storeProfileVideo()`, c'est-à-dire par l'interface
`VideoProvider` du dispositif — consentement vérifié, identifiant opaque attribué, référence
persistée, modération remise à zéro. **Aucune insertion directe en base** : un jeu de données
qui contournerait le code applicatif ne mesurerait rien.

## 3. Scénario

`scripts/charge/catalogue.js` — 100 utilisateurs virtuels, montée en charge sur 15 s, palier
de 60 s à 100 VU, décrue sur 10 s. Chaque itération simule un recruteur qui parcourt le
catalogue :

1. `GET /api/profiles?page=N&pageSize=12` — page aléatoire parmi les 10 premières
2. `GET /catalogue?page=N` — la page rendue
3. un filtre au hasard : secteur (35 %), ville + certifiés (35 %), recherche libre (30 %)
4. `GET /api/profiles/{id}` — fiche d'un profil tiré de la page

Pauses de 0,2 à 1,5 s entre les appels, pour ne pas mesurer une boucle serrée irréaliste.

## 4. Résultats

**Avant** : `preuves/charge/avant-brut.txt` · **Après** : `preuves/charge/apres-brut.txt`
(exports JSON k6 dans le même dossier).

### Les trois routes les plus sollicitées

| Route | | Médiane | p95 | Moyenne | Max |
|---|---|---|---|---|---|
| `GET /api/profiles` | avant | 54,8 ms | 202,2 ms | 75,0 ms | 559 ms |
| | **après** | **39,1 ms** | **137,8 ms** | 51,5 ms | 547 ms |
| | *gain* | *−29 %* | *−32 %* | | |
| `GET /catalogue` (page) | avant | 341,6 ms | 908,4 ms | 390,0 ms | 1 796 ms |
| | **après** | **193,2 ms** | **629,7 ms** | 236,3 ms | 1 679 ms |
| | *gain* | *−43 %* | *−31 %* | | |
| `GET /api/profiles/{id}` | avant | 48,0 ms | 193,9 ms | 67,7 ms | 564 ms |
| | **après** | **40,9 ms** | **141,4 ms** | 53,1 ms | 510 ms |
| | *gain* | *−15 %* | *−27 %* | | |

### Vue d'ensemble

| | Avant | Après |
|---|---|---|
| Requêtes | 9 504 | 10 184 |
| Débit | 108,95 req/s | **116,06 req/s** |
| Itérations complètes | 2 376 | 2 546 |
| Médiane globale | 72,0 ms | **50,9 ms** |
| p95 global | 618,6 ms | **343,9 ms** (−44 %) |
| **Erreurs** | **0** | **0** |
| Contrôles réussis | 100,00 % (9 504) | 100,00 % (10 184) |

Aucune erreur dans les deux exécutions : à 100 utilisateurs simultanés, le service ne casse
pas. Ce n'est pas la capacité maximale qui est mesurée ici, c'est la tenue à la cible.

## 5. Goulot d'étranglement identifié

**Diagnostic : absence d'index couvrant sur `profile`.** Le plan d'exécution SQLite de la
requête du catalogue était, avant correction :

```
SCAN p
SEARCH u USING INDEX sqlite_autoindex_user_1 (id=?)
USE TEMP B-TREE FOR ORDER BY
```

Deux problèmes cumulés : parcours intégral de la table `profile` pour chaque page, puis tri
complet du résultat en mémoire — refait à l'identique pour chaque page demandée, alors que
seules 12 lignes sont rendues.

**Correction** — migration `0011_flowery_celestials.sql`, quatre index :

| Index | Colonnes | Sert |
|---|---|---|
| `profile_catalogue_idx` | `status, updated_at DESC, id` | filtre statut **et** ordre par défaut |
| `profile_sector_idx` | `status, sector` | filtre secteur |
| `profile_city_idx` | `status, city` | filtre localisation |
| `profile_certified_idx` | `status, certified_at` | filtre et tri certification |

Le plan devient :

```
SEARCH p USING INDEX profile_catalogue_idx (status=?)
SEARCH u USING INDEX sqlite_autoindex_user_1 (id=?)
```

Le parcours complet et le tri en mémoire ont disparu.

La migration embarque aussi un `DROP TABLE ping` : suppression en attente depuis que la table
de démonstration a quitté le schéma, sans rapport avec les index.

## 6. Ce qui reste, et ce que je ne prétends pas

**Le gain est réel mais modéré : p95 divisé par 1,8, pas par six.** L'index a fait ce qu'on
attendait de lui côté SQL — mais SQL n'était pas le seul coût.

**Le goulot s'est déplacé vers le rendu serveur.** Après correction, la page `/catalogue` reste
**cinq fois plus lente** que l'API qui l'alimente (193 ms contre 39 ms en médiane). L'écart
n'est plus la base de données : c'est le rendu React côté serveur, la sérialisation du payload
RSC et le transfert (274 Mo reçus en 88 s). C'est là qu'il faudrait chercher ensuite.

**Trois limites que j'assume :**

1. Client et serveur sur la même machine — les 12 cœurs sont partagés, une part du temps
   mesuré est de la contention entre k6 et Next.
2. La capacité maximale n'a pas été cherchée. Je sais que le service tient 100 utilisateurs
   sans erreur ; je ne sais pas où il casse.
3. SQLite en fichier local, un seul processus. Le comportement sous plusieurs instances
   derrière un répartiteur n'est pas mesuré.

**Pistes non explorées, par ordre de gain attendu :** mise en cache de la page catalogue,
réduction du payload RSC, et pagination par curseur — qui réglerait au passage l'incohérence
de pagination documentée dans `docs/tri-catalogue.md`.

## 7. Reproduire

```bash
npm run db:seed                  # jeu de démonstration
npm run seed:charge              # 500 profils, 300 vidéos
npm run build && npm start
k6 run scripts/charge/catalogue.js
npm run catalog:determinisme -- --order=recent --pageSize=20
```
