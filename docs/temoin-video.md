# Témoin de non-régression vidéo

> « Après votre migration, la fiche d'un profil créé en début de semaine doit
> encore afficher sa vidéo, se laisser modifier, et sa vidéo doit encore pouvoir
> être supprimée. Prenez-en un avant de commencer et notez son identifiant. »

## Le témoin

| | |
| --- | --- |
| Profil | `4bca205f-829f-46f7-a361-7ee74ae84ed2` |
| Titulaire | Amina Berthier — `amina@exemple.fr` (mot de passe `demo1234`) |
| État | `status = published`, `video_status = approved`, consentement en cours |
| Référence vidéo | `video_id = dad517ada794684a13a0e5a582f68496`, `video_provider = local` |
| Fichier | `/data/videos/da/dad517ada794684a13a0e5a582f68496.mp4` |
| Taille | 30 809 121 octets |
| Empreinte | `e2c53b1bb3275ec01da52d26c0f393c9` (MD5) |

Sauvegarde de référence conservée dans le volume, sous
`/data/sauvegarde-avant-video/uploads/4bca205f-829f-46f7-a361-7ee74ae84ed2.mp4` — mêmes octets, même empreinte.

### Ce que le témoin a traversé

Ce sont **les mêmes octets** depuis le début, et c'est tout ce qui compte :

1. relevés avant toute modification, sous l'ancien modèle
   (`video_url = /api/videos/<profileId>`, fichier `uploads/<profileId>.mp4`) ;
2. **déplacés** — pas recopiés — par `npm run video:migrate` vers le stockage du
   fournisseur, sous un identifiant opaque ;
3. déposés, retirés et restaurés plusieurs fois pendant la recette manuelle ;
4. reposés à l'identique après la remise à zéro du volume qui a suivi la fusion
   avec le questionnaire versionné (la renumérotation de la migration rendait
   l'ancienne base de développement inutilisable — cf. `video.md`).

L'**identifiant opaque change à chaque dépôt** : c'est son principe même. Ce qui
doit rester constant, et qui l'est, c'est l'empreinte du fichier.

## Vérifications

| # | Vérification | Résultat |
| --- | --- | --- |
| 1 | `GET /profils/4bca205f-829f-46f7-a361-7ee74ae84ed2` | `200`, fiche complète |
| 2 | La vidéo s'affiche | lecteur de 1 min 41 s — capture `captures/video-fournisseur/01-lecture-hebergeur-local.png` |
| 3 | `GET /api/videos/<identifiant opaque>` | `200`, `content-length: 30809121`, `accept-ranges: bytes` |
| 4 | Lecture par intervalle | `206`, `content-range: bytes 0-99/30809121` |
| 5 | Aucun chemin physique servi | `/videos/…mp4`, `/uploads/…mp4`, `/public/videos/…` → `404` |
| 6 | Aucune URL devinable | l'identifiant du profil en URL de lecture → `404` |
| 7 | Le profil se modifie | `PATCH /api/me/profile` → `200`, vidéo intacte |
| 8 | La vidéo se supprime, octets compris | voir ci-dessous |
| 9 | Mode dégradé | `make video-degraded` → fiche `200`, message à la place du lecteur — capture `captures/video-fournisseur/02-mode-degrade-peertube.png` |

Les points 7 et 8 ne sont **pas** joués sur le témoin : les supprimer le
détruirait à chaque exécution. Ils sont couverts, à l'identique, par
[`e2e/video-provider.spec.ts`](../e2e/video-provider.spec.ts) sur un profil que
le test fabrique — parcours complet « la fiche s'ouvre → la vidéo se lit → le
profil se modifie → la vidéo se supprime → les octets ont disparu ».

Pour la même raison, `e2e/video.spec.ts` et `e2e/video-moderation.spec.ts` ne
travaillent plus sur les comptes du jeu de démonstration : chaque test crée son
candidat. Le témoin survit donc à `npm run test:e2e`.

## Le remettre d'aplomb

Une recette manuelle dépose, remplace et supprime des vidéos — c'est son
travail — et le témoin finit régulièrement sans vidéo. `make video-etat` le
signale quand c'est arrivé :

```bash
make video-temoin      # ou : npm run video:temoin
```

Relit la sauvegarde, la confie à `VideoProvider.store()` comme n'importe quel
dépôt, écrit la référence opaque et valide la vidéo — sans quoi la fiche
publique la masquerait avant même d'interroger l'hébergeur. Idempotente : si le
témoin porte déjà une vidéo lisible, elle ne fait rien.

## Si le volume est recréé

`make clean` détruit la base **et** la sauvegarde. Après `make seed`, le témoin
porte un nouvel identifiant de profil et **aucune vidéo** : le jeu de
démonstration en fabrique une par profil avec `ffmpeg`, qui n'est pas installé
dans l'image de développement (le seed le signale et continue). Il faut alors
déposer une vidéo depuis `/candidate`, la valider depuis `/admin`, reposer le
fichier dans `/data/sauvegarde-avant-video/uploads/<profileId>.mp4`, et mettre à
jour les identifiants de ce document.
