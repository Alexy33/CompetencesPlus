# Classement et filtrage du catalogue

Note d'une page — 9 septembre 2026.

## L'ordre par défaut

**Date de dernière mise à jour du profil, décroissante, départagée par l'identifiant du profil.**

```sql
ORDER BY profile.updated_at DESC, profile.id ASC
```

Deux colonnes, toujours. La seconde n'a aucune valeur métier : elle sert uniquement à rendre
l'ordre total. Sans elle, deux profils mis à jour dans la même seconde peuvent permuter d'une
requête à l'autre, et la pagination perd des profils ou en montre deux fois.

L'ordre précédent (`certifiedAt DESC, score DESC, createdAt DESC`) n'avait pas de clé de
départage : il n'était pas déterministe.

## Les ordres proposés au recruteur

Paramètre `order` de `GET /api/profiles`. Tous se terminent par l'identifiant du profil.

| Valeur | Critère | Colonnes |
|---|---|---|
| `recent` *(défaut)* | Mise à jour la plus récente | `updated_at DESC, id ASC` |
| `ancien` | Mise à jour la plus ancienne | `updated_at ASC, id ASC` |
| `certification` | Profils évalués d'abord | `certified_at IS NULL, updated_at DESC, id ASC` |
| `disponibilite` | Disponibilité la plus proche | `CASE availability…, updated_at DESC, id ASC` |
| `secteur` | Secteur alphabétique | `sector ASC, updated_at DESC, id ASC` |
| `localisation` | Localisation alphabétique | `city ASC, updated_at DESC, id ASC` |

**Aucun critère de popularité.** Ni le nombre de vues, ni le nombre de sollicitations reçues,
ni le score d'évaluation n'entrent dans le classement — ni directement, ni comme clé de
départage. Les colonnes `views` et `contact_count` existent en base, elles sont lues par le
titulaire depuis son espace, et ne sont jamais servies au catalogue public.

Le tri `certification` porte sur le **statut** (évalué ou non), pas sur la note : deux profils
évalués ne sont pas départagés par leur score.

## La disponibilité

Vocabulaire fermé de trois valeurs, déclaré par le candidat depuis son espace :

| Valeur | Sens | Rang au tri |
|---|---|---|
| `immediate` | Peut prendre un poste tout de suite | 0 |
| `sous_preavis` | Disponible après un préavis | 1 |
| `non_disponible` | Pas en recherche active | 2 |

Valeur par défaut à la création d'un profil : `immediate` — un demandeur d'emploi est présumé
disponible tant qu'il n'a pas déclaré le contraire. La disponibilité est affichée sur la carte
du catalogue et filtrable ; elle n'entre dans aucun autre ordre que `disponibilite`.

Une valeur inconnue est refusée avec un 400, elle n'est pas silencieusement ignorée.

## Les filtres disponibles

| Paramètre | Effet |
|---|---|
| `q` | Recherche libre : intitulé, secteur, ville, compétences |
| `sector` | Secteur, parmi les sept du référentiel |
| `city` | Localisation, parmi les huit du référentiel |
| `availability` | `immediate`, `sous_preavis` ou `non_disponible` |
| `certified` | `true` : uniquement les profils dont l'évaluation est validée |
| `skills` | Répétable. Cumulatif : le profil doit posséder **toutes** les compétences demandées |
| `page`, `pageSize` | Pagination. `pageSize` plafonné à 20 (CDC 3.4) |

Le catalogue ne sert que les profils au statut `published`. Sans session recruteur, les profils
de personnes mineures en sont exclus.

## Ce qui est garanti, et ce qui ne l'est pas

**Garanti** — à jeu de données constant, deux parcours complets du catalogue rendent la même
liste, dans le même ordre, sans doublon ni manquant. C'est vérifiable par
`npm run catalog:determinisme` et prouvé ci-dessous.

**Non garanti** — la cohérence d'une pagination pendant qu'un profil est modifié. Chaque page
est une requête indépendante : si un profil est mis à jour entre la page 3 et la page 4, il
remonte en tête et décale tout ce qui suit. Le recruteur peut alors voir deux fois un profil,
ou en manquer un. Nous ne prétendons pas l'empêcher : le corriger demanderait une pagination
par curseur figé sur un instantané, ce qui n'est pas au périmètre. **La garantie porte sur le
déterminisme de l'ordre, pas sur l'isolation de la session de navigation.**

## La démonstration

`npm run catalog:determinisme -- --order=recent --pageSize=20`

Le script parcourt le catalogue page par page, deux fois, enregistre les identifiants dans
l'ordre obtenu et compare. Sortie dans `preuves/tri-catalogue/`.

Exécuté le 9 septembre 2026 sur 496 profils, 25 pages, pour les **six ordres**.

Le total de référence est celui que le catalogue **doit** servir, pas le nombre de lignes de
la table : 500 profils candidats en base, dont 497 au statut `published`, dont 496 ne relèvent
pas de la protection des mineurs. Les 4 écartés le sont par une règle métier explicite, pas par
un défaut de pagination — le script recompte cette cible à chaque exécution.

| Ordre | Identifiants | Listes identiques | Doublons | Manquants | Conforme à la base |
|---|---|---|---|---|---|
| `recent` | 496 | OUI | aucun | aucun | OUI |
| `ancien` | 496 | OUI | aucun | aucun | OUI |
| `certification` | 496 | OUI | aucun | aucun | OUI |
| `disponibilite` | 496 | OUI | aucun | aucun | OUI |
| `secteur` | 496 | OUI | aucun | aucun | OUI |
| `localisation` | 496 | OUI | aucun | aucun | OUI |

Fichiers joints : `execution-1-<ordre>.txt`, `execution-2-<ordre>.txt`, `comparaison-<ordre>.txt`.

## Coût technique

L'ordre par défaut est adossé à l'index `profile_catalogue_idx (status, updated_at DESC, id)`,
qui couvre à la fois le filtre sur le statut et le tri. Le plan SQLite passe de
`SCAN profile` + `USE TEMP B-TREE FOR ORDER BY` à `SEARCH profile USING INDEX`.
Mesures dans `docs/rapport-charge.md`.
