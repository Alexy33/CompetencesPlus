# Vidéo de présentation — hébergement, dépôt et lecture

Référence : CDC §2.1 (« publication de vidéos… lien externe **ou upload** »),
§3.2 (« upload direct… max 100 Mo », « prévisionnement… sans quitter la page »).
Décision d'architecture et perspectives : [`video-fournisseurs.md`](video-fournisseurs.md).

## 1. Un identifiant opaque et un nom d'hébergeur

`profile` ne porte plus d'URL de vidéo. Elle porte une **référence** :

| Colonne | Contenu |
| --- | --- |
| `video_id` | identifiant **opaque** rendu par l'hébergeur |
| `video_provider` | `local` \| `peertube` \| `embed` — qui sait le lire |

Aucun chemin de fichier n'est stocké, et l'identifiant ne révèle ni le profil ni
le nom du fichier. L'application ne manipule jamais que ce couple : c'est
l'hébergeur qui traduit.

```
Application
    ↓  (video_id, video_provider)
VideoProvider              src/server/video/provider.ts
    ├── LocalVideoProvider      disque, hors du répertoire web
    ├── FakePeerTubeProvider    instance ministérielle — non provisionnée
    └── ExternalEmbedProvider   YouTube / Vimeo — éteint par défaut
```

Le contrat : `store(fichier)`, `status(identifiant)`, `playbackUrl(identifiant)`,
`delete(identifiant)`. Plus une méthode facultative `openStream()` pour les
hébergeurs dont les octets passent par notre propre route.

## 2. Choix de l'hébergeur

Un seul endroit décide : [`src/server/video/registry.ts`](../src/server/video/registry.ts).
Il n'y a aucun `if (provider === "local")` ailleurs dans le code.

| Variable | Défaut | Effet |
| --- | --- | --- |
| `VIDEO_PROVIDER` | `local` | hébergeur **actif** : celui qui reçoit les nouveaux dépôts |
| `VIDEO_STORAGE_DIR` | `<dossier de la base>/videos` | racine du stockage local |
| `VIDEO_EMBED_ENABLED` | `false` | rallume le lien YouTube / Vimeo |
| `VIDEO_PEERTUBE_URL` | — | citée dans le message d'indisponibilité, jamais contactée |
| `VIDEO_LOCAL_PROCESSING_MS` | `0` | transcodage simulé, pour éprouver l'état « en traitement » |
| `VIDEO_UPLOAD_DIR` | `<dossier de la base>/uploads` | **ancien** dossier, lu par le seul script de migration |

Une vidéo dont le `video_provider` n'est **pas** en service sur le déploiement
est annoncée indisponible. C'est volontaire : c'est ce qui rend le mode dégradé
observable (§6), et c'est honnête — changer d'hébergeur demande une migration
de contenu, pas seulement une variable.

## 3. Stockage local

| Contexte | Racine |
| --- | --- |
| Hors Docker | `./videos` |
| Docker | `/data/videos` (volume `db-data-dev` / `-prod`) |

Disposition interne, **jamais** exposée : `<racine>/<2 premiers caractères de
l'identifiant>/<identifiant>.<mp4\|webm\|ogv\|mov>`. Écriture dans un `.part`
puis `rename` atomique — aucun demi-fichier n'est jamais servi. Retrouver un
fichier n'exige aucun listing de répertoire : les extensions possibles sont
connues, chaque candidat est interrogé.

`/data` est le seul point d'écriture de l'image de production (`read_only`).
Rien ne vit sous `public/`.

## 4. États de traitement

`store()` **réussi ne veut pas dire lisible**. L'hébergeur rend un état :

| État | Ce que voit l'usager |
| --- | --- |
| `processing` | « La vidéo est en cours de traitement. » |
| `ready` | le lecteur |
| `unavailable` | « La vidéo est temporairement indisponible. » |

Toute la lecture passe par `status()`. Pour l'hébergement local, une vidéo est
`ready` dès le `rename`, sauf si `VIDEO_LOCAL_PROCESSING_MS` simule un
transcodage — de quoi éprouver le chemin asynchrone sans attendre l'instance
ministérielle.

## 5. Routes

### `PUT /api/me/profile/video` — téléverser

> Un fichier déposé repart toujours en `video_status = pending` : il n'hérite
> jamais de la décision prise sur celui qu'il remplace (R.2).

- Accès : session **candidate**, consentement en cours (R.3).
- Le **corps de la requête est le fichier**. `Content-Type` obligatoire :
  `video/mp4`, `video/webm`, `video/ogg`, `video/quicktime`.
- Plafond **100 Mo**, appliqué **en streaming** : le flux est lu par blocs et
  coupé dès le dépassement.
- Réponse `200` : le profil (`MyProfile`), bloc `video` mis à jour.

```bash
curl -X PUT http://localhost:3000/api/me/profile/video \
  -b cookies.txt \
  -H 'Content-Type: video/mp4' \
  --data-binary @presentation.mp4
```

| Statut | Cause |
| --- | --- |
| `400` | corps vide |
| `401` | pas de session |
| `403` | session non `candidate`, ou aucun consentement en cours |
| `404` | aucun profil rattaché au compte |
| `422` | fichier > 100 Mo, ou `Content-Type` non pris en charge |
| `503` | l'hébergeur configuré ne répond pas |

### `DELETE /api/me/profile/video` — retirer

Accès **candidate**. Passe par `VideoProvider.delete()` : **les octets
disparaissent**, puis la référence est retirée de la base. Idempotent.

### `PATCH /api/me/profile` avec `videoUrl` — lien tiers

Confie l'URL au fournisseur `embed`. **Éteint par défaut** : sans
`VIDEO_EMBED_ENABLED=true`, la réponse est `403`. `videoUrl: null` retire la
vidéo, quel que soit l'hébergeur, par le même chemin de suppression.

### `GET /api/videos/{videoId}` — lire

- `videoId` = l'identifiant **opaque**, pas l'identifiant du profil.
- La route identifie la vidéo, remonte au profil, applique les droits de la
  fiche, **puis** seulement réclame les octets à l'hébergeur.
- **Public** si le profil est `published`, la vidéo validée (`approved`, R.2) et
  son titulaire majeur ; sinon réservé au titulaire ou à un admin. Pour tout
  autre appelant : `404`, y compris par l'URL directe.
- Gère `Range` → `206 Partial Content` avec `Content-Range`.
- `409` si la vidéo est encore en traitement, `503` si l'hébergeur est muet.

```bash
curl -H 'Range: bytes=0-1048575' http://localhost:3000/api/videos/<videoId>
# → HTTP/1.1 206 Partial Content
#   Content-Range: bytes 0-1048575/5242880
```

## 6. Mode dégradé

Quand l'hébergeur d'une vidéo n'est pas joignable — ou n'est pas en service sur
ce déploiement — la fiche profil **reste servie** et le lecteur est remplacé par
un message. Aucun 500 ne peut sortir de là : `describeVideo()` ne lève jamais.

Pour le provoquer :

```bash
make video-degraded          # équivaut à VIDEO_PROVIDER=peertube docker compose up
```

Puis ouvrir une fiche portant une vidéo. Capture :
`captures/video-fournisseur/02-mode-degrade-peertube.png`.

Ce qui marche, et ce qui ne marche pas, dans cet état :

| Action | Réponse | Pourquoi |
| --- | --- | --- |
| Consulter une fiche | `200`, message à la place du lecteur | c'est le but |
| Modifier son profil | `200` | la vidéo n'est pas le profil |
| **Déposer une vidéo** | **`503`** | l'instance ministérielle n'existe pas : il n'y a rien à téléverser |
| Lire une vidéo | `404` | aucun octet n'est servi par un hébergeur hors service |
| Retirer sa vidéo | `200`, **octets supprimés** | la suppression sollicite l'hébergeur réel, en service ou non |

La dernière ligne est volontaire : le retrait du consentement (R.3) est une
obligation, elle ne peut pas dépendre de la disponibilité d'un hébergeur. Elle
est aussi le seul piège de cet état — la fiche annonce une indisponibilité
*temporaire* alors que le fichier existe toujours. Le bouton « Retirer la
vidéo » demande donc confirmation, en disant explicitement que l'hébergeur est
seulement injoignable et que le retrait, lui, est définitif.

## 7. Migration de l'existant

Deux temps, dans cet ordre ou non — le script rattrape les deux cas :

1. **`drizzle/0007_opaque_video_reference.sql`** ajoute `video_id` /
   `video_provider`, les remplit depuis l'ancienne colonne `video_url` (un
   identifiant opaque tiré au sort pour les dépôts directs, l'URL elle-même pour
   les liens tiers), puis supprime `video_url`.
2. **`npm run video:migrate`** déplace les octets de `<uploads>/<profileId>.<ext>`
   vers le stockage du fournisseur, sous l'identifiant opaque.

```bash
make video-migrate           # ou : npm run video:migrate
npm run video:migrate -- --dry   # n'écrit rien, dit ce qui serait fait
```

Rejouable : une vidéo déjà rangée est comptée « déjà migrée », pas recopiée. Le
script affiche les compteurs avant et après, et **ne supprime jamais rien** :
une ligne dont les octets sont introuvables est signalée nommément et laissée en
l'état. Il sort en code 1 s'il reste des incohérences.

Résultat sur la base de développement : [`temoin-video.md`](temoin-video.md).

## 8. Documentation & tests

- Contrat OpenAPI (routes binaires, décrites à la main) :
  `src/server/openapi/video-paths.ts` → Scalar (`/api/docs`) et Swagger.
- **Conformité du contrat** : `src/server/video/__tests__/provider-contract.test.ts`
  — la *même* suite tourne contre `LocalVideoProvider` et
  `FakePeerTubeProvider`.
- **Sélection et mode dégradé** : `registry.test.ts`, `degraded-mode.test.ts`.
- **Bout en bout** : `e2e/video.spec.ts` (dépôt, `Range`, plafond, types
  refusés, 401/403, suppression, adresses indevinables),
  `e2e/video-provider.spec.ts` (non-régression complète, retrait du
  consentement, lecture non autorisée), `e2e/video-moderation.spec.ts` (R.2).

## 9. Ce qui n'est volontairement pas fait (démonstrateur)

Pas de contrôle des *magic bytes* (seul le `Content-Type` est vérifié), pas de
transcodage réel, pas de vignette, pas d'antivirus, pas de table de métadonnées
dédiée. Le stockage objet n'est plus un chantier : c'est une classe de plus qui
implémente `VideoProvider`.
