# Témoin de non-régression vidéo

> « Après votre migration, la fiche d'un profil créé en début de semaine doit
> encore afficher sa vidéo, se laisser modifier, et sa vidéo doit encore pouvoir
> être supprimée. Prenez-en un avant de commencer et notez son identifiant. »

## Le témoin

Relevé **avant** toute modification, dans la base de développement
(`db-data-dev`, `/data/profilsactifs.db`) :

| | |
| --- | --- |
| Profil | `efd93871-3699-41ed-ab68-bff8afca1f87` |
| Titulaire | Amina Berthier — `amina@exemple.fr` |
| État | `status = published`, `video_status = approved`, consentement en cours |
| Ancienne référence | `video_url = /api/videos/efd93871-3699-41ed-ab68-bff8afca1f87?t=1788766967912` |
| Fichier | `/data/uploads/efd93871-3699-41ed-ab68-bff8afca1f87.mp4` |
| Taille | 30 809 121 octets |
| Empreinte | `e2c53b1bb3275ec01da52d26c0f393c9` (MD5) |

C'était la **seule** vidéo réellement présente sur le disque : les 39 autres
profils portaient `video_url = NULL`.

Sauvegarde prise avant migration, conservée dans le volume :
`/data/sauvegarde-avant-video/` (base + `uploads/`).

## Après migration

| | |
| --- | --- |
| Référence issue de la migration | `video_id = b1131f63732db0ab95da67861b5156a4`, `video_provider = local` |
| Fichier | `/data/videos/b1/b1131f63732db0ab95da67861b5156a4.mp4` |
| Taille | 30 809 121 octets — **inchangée** |
| Empreinte | `e2c53b1bb3275ec01da52d26c0f393c9` — **inchangée** |

Le fichier a été **déplacé**, pas recopié : `/data/uploads` est vide.

### Référence actuelle

Le témoin a été remplacé puis retiré au cours d'une session de recette
manuelle — comportement normal du dispositif, pas une régression : un dépôt
efface les octets du précédent et repasse la modération en `pending` (R.2), un
retrait efface les octets. La vidéo d'origine a été **restaurée depuis la
sauvegarde**, par le chemin applicatif réel (`PUT /api/me/profile/video` sous
l'identité du titulaire, puis validation par la modération) — aucun SQL à la
main, aucun fichier posé directement dans le stockage.

| | |
| --- | --- |
| Référence en vigueur | `video_id = 1ec671ff04755836c9d7a5fbb53a1b47`, `video_provider = local` |
| Fichier | `/data/videos/1e/1ec671ff04755836c9d7a5fbb53a1b47.mp4` |
| Taille | 30 809 121 octets — **inchangée** |
| Empreinte | `e2c53b1bb3275ec01da52d26c0f393c9` — **inchangée** |
| Modération | `approved` |

L'identifiant change à chaque dépôt : c'est le principe même d'un identifiant
opaque. Ce qui doit rester constant, et qui l'est, ce sont les octets.

Pour restaurer de nouveau — une seule commande :

```bash
make video-temoin      # ou : npm run video:temoin
```

Elle relit la sauvegarde (toujours dans le volume, sous
`/data/sauvegarde-avant-video/`), la confie à `VideoProvider.store()` comme
n'importe quel dépôt, écrit la référence opaque et valide la vidéo — sans quoi
la fiche publique la masquerait avant même d'interroger l'hébergeur.

Idempotente : si le témoin porte déjà une vidéo lisible, elle ne fait rien.
L'identifiant opaque change à chaque restauration, les octets non
(`e2c53b1bb3275ec01da52d26c0f393c9`).

Attendez-vous à en avoir besoin : une recette manuelle dépose, remplace et
supprime des vidéos — c'est son travail — et le témoin finit régulièrement sans
vidéo. `make video-etat` le signale quand c'est arrivé.

## Vérifications

| # | Vérification | Résultat |
| --- | --- | --- |
| 1 | `GET /profils/efd93871-…` | `200`, fiche complète |
| 2 | La vidéo s'affiche | `<video src="/api/videos/…">`, lecteur de 1 min 41 s — capture `captures/video-fournisseur/01-lecture-hebergeur-local.png` |
| 3 | `GET /api/videos/<identifiant opaque>` | `200`, `content-length: 30809121`, `accept-ranges: bytes` |
| 4 | Lecture par intervalle | `206`, `content-range: bytes 0-99/30809121` |
| 5 | L'ancienne adresse ne répond plus | `GET /api/videos/efd93871-…` → `404` |
| 6 | Aucun chemin physique servi | `/videos/b1/…mp4`, `/uploads/…mp4`, `/public/videos/…` → `404` |
| 7 | Le profil se modifie | `PATCH /api/me/profile` → `200`, vidéo intacte |
| 8 | La vidéo se supprime, octets compris | voir ci-dessous |
| 9 | Mode dégradé | `VIDEO_PROVIDER=peertube` → fiche `200`, message à la place du lecteur — capture `captures/video-fournisseur/02-mode-degrade-peertube.png` |

Les points 7 et 8 ne sont **pas** joués sur le témoin lui-même : les supprimer
le détruirait à chaque exécution. Ils sont couverts, à l'identique, par
[`e2e/video-provider.spec.ts`](../e2e/video-provider.spec.ts) sur un profil que
le test fabrique — le parcours complet « la fiche s'ouvre → la vidéo se lit →
le profil se modifie → la vidéo se supprime → les octets ont disparu ».

Pour la même raison, `e2e/video.spec.ts` et `e2e/video-moderation.spec.ts` ne
travaillent plus sur les comptes du jeu de démonstration : chaque test crée son
candidat. Le témoin survit donc à `npm run test:e2e`.

## Rejouer la vérification

```bash
docker compose --profile dev up -d
curl -s localhost:3000/api/profiles/efd93871-3699-41ed-ab68-bff8afca1f87 | jq .video
# → { "state": "ready", "provider": "local",
#     "playback": { "kind": "stream", "url": "/api/videos/…" }, "message": null }
```

Si le volume de développement a été recréé (`make clean`), le témoin n'existe
plus : rejouez `make seed`, prenez le premier profil portant une vidéo, et
notez son identifiant ici.
