# Décisions techniques

Le code source est volontairement dépourvu de commentaires. Les raisons qui ne se
lisent pas dans le code sont consignées ici.

## Design system (`src/app/globals.css`)

Tailwind v4 n'a plus de `tailwind.config.js` : tout est déclaré dans le bloc `@theme`,
et chaque entrée génère l'utilitaire correspondant.

- **Une seule échelle de bleus.** `--color-brand` … `--color-brand-900`. Le `#1B3A6B`
  de la charte est le primaire ; les degrés autour de lui servent à bâtir l'interface
  en nuances de bleu plutôt qu'en « un bleu + des gris ». Contrastes mesurés sur le
  fond de page `#ebf0f7` : `brand` 9,84:1, `brand-700` 9,82:1, `brand-500` 4,88:1 —
  tous utilisables pour du texte ; `brand-400` 3,03:1 est réservé au décor.
- **Textes bleutés plutôt que gris neutres** : `--color-ink` (#22334D),
  `--color-ink-muted` (#41556E), `--color-ink-soft` (#566274). Le secondaire monte
  ainsi de 5,4:1 à 6,67:1 sur le fond de page.
- **Couleur d'action distincte (R.10).** La charte interdit le bleu institutionnel en
  fond de bouton : `--color-action` (#2d3748, anthracite) porte l'action sans
  concurrencer l'échelle de bleus. Blanc sur anthracite 11,99:1 ; sur le survol
  `--color-action-hover` 14,63:1. Sur un aplat bleu, anthracite et bleu ne diffèrent
  que de 1,06:1 : la classe `.bouton-action-sur-bleu` ajoute alors
  `--color-action-contour` (blanc) pour redonner sa forme au bouton — 11,27:1 contre
  le bleu, au-delà des 3:1 exigés pour un élément non textuel.
- **Ombres « neumorphiques » nommées** : `shadow-raised-2xs` … `shadow-raised-3xl` et
  `shadow-pressed-xs` / `-sm` / `-brand`. Aucun composant ne doit réintroduire de
  valeur hexadécimale ni de chaîne d'ombre en dur.
- **`@theme inline` écrase `--color-accent`** avec le gris de shadcn : c'est pourquoi
  la marque vit sous le préfixe `brand-` et non `accent-`.

## Charte graphique (R.10)

- **Marianne et Spectral auto-hébergées.** Marianne est le caractère propre de l'État,
  distribué avec le DSFR (Licence Ouverte 2.0) et absent de Google Fonts. Les fichiers
  sont dans `public/fonts` : pas de requête vers un domaine tiers sur les pages
  publiques. `font-display: swap` garde le texte lisible pendant le chargement.
- **Bloc-marque** (`src/components/layout/bloc-marque.tsx`) : un seul composant, réutilisé
  partout, qui porte lui-même sa zone de protection (`p-4`) et son fond opaque. Il n'a
  pas de variante transparente — la faute « bloc-marque sur une photo » est rendue
  impossible plutôt que déconseillée.

## Accessibilité (RGAA AA, R.7)

- **Le bloc `:focus-visible` est hors `@layer`.** Les utilitaires Tailwind vivent dans la
  couche `utilities`, et plusieurs composants y posent `outline-none`. Une règle non
  couchée l'emporte sur toute règle couchée : l'indicateur de focus ne peut donc pas
  être supprimé par mégarde. L'anneau `#1b3a6b` donne 9,84:1 sur `#ebf0f7`, là où
  l'ancien `--ring` à 50 % plafonnait à 1,54:1.
- **`:has(> iframe):focus-within`** : un iframe reçoit le focus clavier sans jamais
  matcher `:focus` — c'est le cadre qui porte l'anneau pour le compte de la vidéo.
- **Lien d'évitement** (`.lien-evitement`, RGAA 12.7) : premier arrêt de la tabulation,
  il saute la navigation latérale que chaque page répète à l'identique.
- **`prefers-reduced-motion`** : aucune animation imposée.

## Base de données (`src/db/index.ts`)

- **Connexion paresseuse derrière un `Proxy`.** Ouvrir SQLite à l'import casse
  `next build` : plusieurs workers de compilation chargent les routes en parallèle et se
  disputent le même fichier (`SQLITE_BUSY`).
- **Ordre des `pragma`.** `busy_timeout` est posé avant toute pragma susceptible de
  prendre un verrou, sinon deux connexions initialisant WAL en même temps échouent.
- **`journal_mode = WAL`** : lectures concurrentes pendant une écriture. Crée `.db-wal`
  et `.db-shm`, qui doivent être sur le même volume que la base — d'où un répertoire
  `/data` dédié et non un fichier monté seul.
- **`foreign_keys = ON`** : SQLite ne vérifie pas les clés étrangères par défaut, et le
  réglage est propre à chaque connexion.

## Authentification (`src/lib/auth.ts`)

- **Le rôle est ramené côté serveur.** `role` est un champ d'inscription, donc choisi par
  le client. Sans le garde-fou du hook `user.create.before`, un `sign-up/email` avec
  `{"role":"admin"}` créerait un administrateur. L'inscription publique ne produit qu'un
  `candidate` ou un `recruiter` ; les comptes d'administration sont promus en base par
  le seed, jamais par l'API.
- **Un compte candidat possède toujours un profil**, créé en `pending` par
  `user.create.after` : l'espace demandeur n'a donc aucun cas « profil manquant ».
- **`trustedOrigins` explicite.** better-auth ≥ 1.7 refuse toute requête dont l'`Origin`
  ne correspond pas à `baseURL`. `localhost` et `127.0.0.1` sont deux origines distinctes,
  et le port n'est pas toujours 3000 : l'artefact de build se lance sur le `PORT` fourni.
- **`useSecureCookies` suit le schéma réel de `baseURL`, pas `NODE_ENV`.** Le serveur
  standalone force `NODE_ENV=production` ; un cookie `Secure` est silencieusement ignoré
  en `http://`, ce qui produisait une connexion répondant 200 sans jamais ouvrir de
  session. `BETTER_AUTH_SECURE_COOKIES=1` force le comportement derrière un proxy HTTPS.
- **`nextCookies()` reste le dernier plugin** : il pose les cookies une fois les autres
  plugins passés.

## Démarrage du serveur (`src/instrumentation.ts`)

Next.js exécute `register()` une fois avant la première requête. C'est le seul endroit
permettant de jouer les migrations dans un conteneur : le code fait partie du bundle
tracé et survit au build standalone, contrairement à `drizzle-kit`, `devDependency`
absente de l'image finale. Un échec de migration fait volontairement tomber le
conteneur — Docker le redémarre plutôt que de servir une application branchée sur un
schéma incohérent.

## API

- **Un seul modèle d'erreur** (`src/server/http.ts`). Toute réponse non-2xx passe par
  `ApiError` : le front n'a qu'un cas à coder, la spécification qu'un schéma à documenter.
- **Contrat et implémentation au même endroit** (`src/server/openapi/`). Une route se
  déclare une fois via `defineRoute` ; la spécification OpenAPI et le code exécuté sont
  produits à partir du même objet, ce qui rend impossible une documentation qui mentirait
  sur le comportement réel.
  - `route-definition.ts` : types et registre.
  - `request.ts` : lecture et validation de la requête, contrôle d'accès.
  - `define-route.ts` : fabrique du handler Next.js.
  - `operation.ts` : projection vers OpenAPI.
  - `routes.ts` : façade réexportant les quatre.
- **Champs répétables.** `?skills=A&skills=B` doit produire un tableau même avec une seule
  valeur. La liste des champs tableau est lue dans le JSON Schema plutôt que dans les
  internes de Zod (`arrayFields`).
- **`/api/health` est `force-dynamic`** : une route mise en cache répondrait 200 même base
  morte. Elle répond 503 et non 500, pour que la politique de redémarrage de Docker
  s'applique.
- **`/api/me/contacts/{id}`** : le filtre sur `recruiterId` fait office de contrôle
  d'accès — le suivi d'un autre recruteur est introuvable, pas « interdit ».
- **Files d'administration** : profils et vidéos en attente d'abord, avec un ordre
  explicite et non alphabétique (« pending » ne se trouve ni en tête ni en queue d'un tri
  sur la chaîne).

## Catalogue

- **L'état des filtres vit dans l'URL** (`use-url-filters.ts`) : un filtrage est
  partageable, revient au bouton « précédent » et se recharge tel quel. Le serveur relit
  les mêmes paramètres via le contrat Zod `CatalogQuery`, si bien qu'une URL bricolée à la
  main ne peut pas dépasser le plafond réglementaire de 20 profils par page (CDC 3.4).
- **Filtres invalides = catalogue par défaut** : une URL malformée reste une visite à
  servir.
- **Recherche libre par `EXISTS`** : les compétences vivent dans une table séparée et ne
  peuvent pas être filtrées par `LIKE` sur la ligne de profil.
- **« Possède TOUTES les compétences demandées »** : on compte les compétences distinctes
  trouvées et on exige qu'elles soient aussi nombreuses que celles demandées ; un `IN`
  simple donnerait « au moins une ».
- **Ordre du catalogue** : certifiés d'abord, puis les mieux notés. L'audience ne départage
  pas — on ne classe pas des personnes par nombre de vues.
- **Consultation publique** (CDC 2.3) : seuls les profils `published` sont servis ; un
  profil en modération ou retiré répond 404, y compris à un recruteur connecté.
- **Le compteur de vues n'apparaît pas sur les cartes** : il ne se lit que depuis l'espace
  du titulaire (CDC 2.1).

## Vidéo

- **Le consentement porte sur la diffusion, pas sur l'hébergement** (R.3). Un lien YouTube
  ou Vimeo expose l'image et la voix exactement comme un fichier déposé chez nous. Les deux
  chemins passent donc par `assertVideoConsent`, exportée plutôt que recopiée par route.
  Le consentement vit dans `services/video.ts` avec le fichier : son retrait doit supprimer
  ce fichier, et les tenir à distance laisserait exister le cas « accord retiré en base,
  vidéo encore sur le disque ».
- **La version acceptée est prise de `VIDEO_CONSENT_VERSION`, pas du client** : c'est le
  serveur qui sait quel texte il a affiché.
- **Une vidéo neuve n'hérite pas de la décision prise sur celle qu'elle remplace** : elle
  repart en attente de modération (R.2).
- **La modération est un écran à part** et non une colonne de plus dans la file des
  profils : elle porte sur un autre objet, se décide sur un autre critère, et refuser une
  vidéo ne dépublie pas le profil.

## Inscription (R.1)

- **L'âge déclaré est recalculé à chaque frappe** côté client pour bloquer l'envoi et
  afficher la mention 16-18 ans avant validation. Le serveur refait le même contrôle : le
  contrôle client n'est qu'un confort de saisie.
- **Le SIREN n'est signalé qu'une fois les neuf chiffres saisis** : signaler une erreur dès
  le premier caractère reprocherait à la personne de ne pas avoir fini d'écrire.
- **Une seule requête crée le compte ET l'entreprise** (`POST /api/register`). Passer par
  `signUp.email` puis un second appel laisserait exister un recruteur sans entreprise dès
  que le second échoue.
- **La session est relue, pas rouverte** : le cookie est déjà posé par la route, une
  seconde authentification ouvrirait une seconde session pour le même navigateur.

## Vocabulaires (`src/lib/vocabulary.ts`)

Source de vérité unique : le schéma Drizzle contraint ses colonnes avec ces listes, les
contrats Zod les rejouent en `enum`, et `/api/reference` les sert au front. Il ne doit
exister aucune autre copie de ces listes dans le dépôt. Les libellés affichés vivent dans
`src/lib/labels.ts`.

## Jeu de démonstration (`src/db/seed/`)

- Destructif et rejouable : `resetDomain()` vide le domaine avant d'écrire.
- Les comptes sont créés via better-auth (`accounts.ts`) et non par `INSERT` : c'est la
  seule façon d'obtenir un mot de passe haché comme le fera la vraie inscription. La date
  de naissance traverse la vraie inscription, donc le même blocage des moins de 16 ans.
- `demo-video.ts` génère un clip local avec ffmpeg, explicitement marqué comme une
  démonstration : les liens YouTube/Vimeo du jeu d'essai sont fictifs et afficheraient
  « cette vidéo n'existe pas ». Sans ffmpeg, aucune référence n'est écrite et la fiche affiche
  « Aucune présentation vidéo ».
- `video-moderation.ts` couvre les trois états (en attente, refusée avec motif, validées) :
  sans cela l'écran d'administration est vide et la restriction d'accès indémontrable.
- `recruiter-activity.ts` remplit l'espace recruteur (contacts sur les quatre statuts,
  favoris, notifications), seul écran qui s'ouvrirait autrement entièrement vide.
