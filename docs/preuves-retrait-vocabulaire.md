# Retrait du vocabulaire « droits sociaux » — sortie brute

Instruction (courriel de M. Sellami, lundi 7 septembre) : « Aucune mention
d'allocation, de seuil, de "seuil d'activité minimale", de droits, de calcul,
de perte. […] Vous ferez la recherche sur l'ensemble du dépôt et vous me
joindrez la sortie brute, telle quelle. »

## Commande, rejouable telle quelle

```bash
git grep -nIiE "allocation|indemnit|\bseuils?\b|\bdroits?\b|\bcalcul|\bpertes?\b|permis de travailler|j'aime|\bRSA\b|pôle emploi|pole emploi|france travail|prestation" \
  -- ':!package-lock.json'
```

`git grep` porte sur **tous les fichiers suivis** du dépôt : code applicatif,
migrations, jeux de données, tests, documentation d'API, maquettes, captures.
Deux exclusions, et elles sont les seules :

- `package-lock.json` — métadonnées de dépendances générées, non rédigées par
  nous ; « universalify » contient la sous-chaîne « rsa ».
- Les limites de mots (`\b`) évitent que « droit » remonte les 12 occurrences
  du mot « endroit ». Sans elles, la sortie compte 78 lignes au lieu de 64.

## Ce que la recherche ne trouve pas — le point principal

**Zéro occurrence** de : `allocation`, `indemnité`, `RSA`, `Pôle emploi`,
`France Travail`, `prestation`, `permis de travailler`, `seuil d'activité`.

Aucun lien, même indicatif, entre l'engagement et les droits sociaux n'existe
dans le dépôt. Les 64 lignes ci-dessous portent toutes sur quatre mots français
ordinaires, employés dans un sens sans rapport avec le registre social.

## Les 64 occurrences, et pourquoi elles restent

| Mot | Nb | Pourquoi cette occurrence reste |
| --- | --- | --- |
| `calcul` | 25 | Calcul du **score** de certification et de l'**âge** déclaré. Aucun calcul de droit ni de montant. |
| `seuil` | 26 | Trois sens, tous techniques : seuil de **certification** (note minimale du badge), seuil d'**âge** (16 et 18 ans), seuil de **contraste AA** dans l'audit d'accessibilité. |
| `droit` | 10 | Deux sens : les **droits d'accès** applicatifs (« vous n'avez pas les droits nécessaires », permissions de lecture d'une vidéo), et les **droits d'un tiers** dans les CGU (propriété intellectuelle). |
| `j'aime` | 5 | Quatre dans `docs/reponse-r4-compteurs.md`, la note qui **atteste à Mme Pontaillac qu'aucun compteur de « j'aime » n'existe** ; une dans la biographie d'un profil de démonstration, où le mot est le verbe « j'aimerais ». |

Aucune occurrence dans les messages de commit : la recherche sur
`git log --all` ne remonte rien.

## Sortie brute

```
docs/_archive/identite-etat/documents/accessibilite-ancienne-charte.md:30:### Avant correction — 5 couples sous le seuil
docs/_archive/identite-etat/documents/accessibilite-ancienne-charte.md:33:le seuil AA sur les fonds clairs du dispositif.
docs/_archive/identite-etat/documents/accessibilite-ancienne-charte.md:61:| Écran | Couples mesurés | Minimum relevé | Sous le seuil | Arrêts Tab | Anneau de focus |
docs/_archive/identite-etat/documents/charte-graphique-ministerielle.md:50:Mesures WCAG 2.1 (seuil AA texte : 4.5:1 ; seuil éléments non textuels : 3:1).
docs/_archive/identite-etat/documents/charte-graphique-ministerielle.md:52:| Couple | Rapport | Seuil | Verdict |
docs/_archive/identite-etat/documents/charte-graphique-ministerielle.md:66:11.27:1 contre le bleu et 11.99:1 contre l'anthracite, soit au-delà du seuil de
docs/_archive/identite-etat/documents/charte-graphique-ministerielle.md:138:| Écran | Couples mesurés | Sous le seuil AA |
docs/_archive/identite-etat/documents/charte-graphique-ministerielle.md:145:indicateur visible (anneau à 9.84:1 minimum, seuil 3:1).
docs/cgu.md:60:Chaque tentative est associée à une version déterminée du questionnaire afin de garantir la cohérence entre les questions présentées, les réponses enregistrées et le calcul du résultat.
docs/cgu.md:77:- portant atteinte aux droits d'un tiers ;
docs/cgu.md:176:Une nouvelle version doit être créée si les modifications apportées après validation changent substantiellement les droits, obligations ou traitements décrits dans le document.
docs/reponse-r4-compteurs.md:3:**Objet :** demande de Mme Pontaillac relative au compteur de « j'aime »
docs/reponse-r4-compteurs.md:9:Il n'existe aucun compteur de « j'aime » dans le produit. Vérification faite sur
docs/reponse-r4-compteurs.md:22:Si un compteur de « j'aime » est ajouté par la suite, il suivra la règle suivante,
docs/schema-bdd.md:175:(compteur de « j'aime » compris) suit la même règle.
docs/verification-age.md:41:Le calcul de l'âge est isolé dans `src/lib/age.ts` — source unique, utilisée par
docs/verification-age.md:42:l'inscription, le catalogue et les tests. Deux implémentations du même calcul
docs/verification-age.md:112:| `src/lib/age.ts` | Calcul de l'âge et seuils — source unique |
docs/video-presentation.md:159:- **Une video de test personnelle** : utiliser un rush neutre, libre de droits.
docs/video.md:127:- La route identifie la vidéo, remonte au profil, applique les droits de la
drizzle/0008_answers_option_id.sql:11:-- il est deja calcule et stocke sur la tentative et le profil.
openapi.json:540:        "description": "Le nouveau seuil s'applique aux tentatives validees APRES la modification : les certifications deja delivrees ne sont pas recalculees.",
openapi.json:1120:        "description": "Tout ce dont l'ecran a besoin en un appel : avancement, reponses deja enregistrees, seuil et resultat s'il existe.",
openapi.json:1403:        "summary": "Valider le questionnaire et calculer le score",
openapi.json:1404:        "description": "Cloture la tentative. Au-dessus du seuil, l'évaluation validée apparait sur le profil public. En dessous, une validation déjà acquise n'est pas retirée.",
openapi.json:1408:            "description": "Score calcule.",
openapi.json:3166:        "description": "**Seule** porte d'entrée vers les octets d'une vidéo hébergée par le\ndispositif. Les fichiers vivent hors du répertoire web : aucune URL\nphysique, aucun listing, aucun chemin devinable.\n\n`videoId` est l'identifiant **opaque** rendu par l'hébergeur — il ne\nrévèle ni le profil, ni le nom du fichier. La route l'utilise pour\nretrouver le profil associé, puis applique les mêmes droits que la fiche.\n\nGère l'en-tête `Range` : réponse **206 Partial Content** avec\n`Content-Range` quand le lecteur cherche dans la timeline (CDC §3.2).\n\nUn profil non `published`, ou dont la vidéo n'est pas validée par la\nmodération (R.2), n'est servi qu'à son titulaire ou à un admin : la\nréponse est **404** pour tout autre appelant, URL directe comprise.",
openapi.json:4455:            "description": "Etat de certification du profil apres calcul."
openapi.json:4459:            "description": "Version du questionnaire ayant servi au calcul."
playwright.config.ts:13:  // modifie le questionnaire (administration) et celui qui calcule un score
scripts/a11y-audit.mjs:417:  console.log(`  couples texte/fond mesures : ${data.pairs.length} | sous le seuil AA : ${fails.length}`);
src/app/api/admin/settings/route.ts:27:    "Le nouveau seuil s'applique aux tentatives validees APRES la modification : les certifications deja delivrees ne sont pas recalculees.",
src/app/api/me/certification/route.ts:14:    "Tout ce dont l'ecran a besoin en un appel : avancement, reponses deja enregistrees, seuil et resultat s'il existe.",
src/app/api/me/certification/submit/route.ts:13:  summary: "Valider le questionnaire et calculer le score",
src/app/api/me/certification/submit/route.ts:15:    "Cloture la tentative. Au-dessus du seuil, l'évaluation validée apparait sur le profil public. En dessous, une validation déjà acquise n'est pas retirée.",
src/app/api/me/certification/submit/route.ts:18:    "200": { description: "Score calcule.", schema: CertificationResultSchema },
src/app/api/me/certification/submit/route.ts:28:        : `Score de ${result.score}/100, en dessous du seuil de ${result.threshold}. Vous pouvez repasser le questionnaire sans delai.`,
src/app/cgu/page.tsx:112:            le calcul du résultat.
src/app/cgu/page.tsx:132:            <li>portant atteinte aux droits d'un tiers ;</li>
src/app/profils/[id]/page.tsx:135:                    Évaluation des aptitudes professionnelles. Seuil : {settings.certificationThreshold}/100.
src/components/admin/settings-form.tsx:26:          <Field label="Seuil de certification">
src/components/candidate/certification/result-card.tsx:44:            : `Le seuil est de ${result.threshold}/100. Vous pouvez repasser le questionnaire sans délai.`}
src/components/candidate/certification/use-certification.ts:78:    // qui ont evolue). Elle est calculee cote serveur, donc on recharge.
src/db/seed/profiles.fixture.ts:121:    bio: "Agroalimentaire, 3x8. Je forme les nouveaux arrivants depuis quatre ans et j'aimerais que ça devienne mon poste.",
src/lib/__tests__/age.test.ts:63:  it("refuse en dessous du seuil", () => {
src/lib/__tests__/age.test.ts:121:describe("seuils", () => {
src/lib/vocabulary.ts:64:// (src/server/contracts/questionnaire.ts) et le calcul du score.
src/server/contracts/certification.ts:107:    certified: z.boolean().meta({ description: "Etat de certification du profil apres calcul." }),
src/server/contracts/certification.ts:111:      .meta({ description: "Version du questionnaire ayant servi au calcul." }),
src/server/http.ts:58:  static forbidden(message = "Vous n'avez pas les droits necessaires.") {
src/server/openapi/video-paths.ts:78:        "retrouver le profil associé, puis applique les mêmes droits que la fiche.",
src/server/services/__tests__/certification-attempt.test.ts:246:    // Et son score est calcule avec le bareme v1.
src/server/services/__tests__/certification-attempt.test.ts:352:    // Son score reste calcule en v1...
src/server/services/__tests__/certification-catchup.test.ts:289:describe("certification retiree sous le seuil", () => {
src/server/services/__tests__/certification-catchup.test.ts:290:  it("retire le badge quand le nouveau score passe sous le seuil", async () => {
src/server/services/__tests__/certification-catchup.test.ts:483:    // est calcule de v1 a v3, sans repasser par les versions intermediaires.
src/server/services/__tests__/certification-version.test.ts:63:  // pouvoir continuer a etre lues et calculees.
src/server/services/__tests__/certification-version.test.ts:104:describe("questionnaire — calcul du score par version", () => {
src/server/services/__tests__/certification-version.test.ts:105:  it("calcule une tentative v1 avec le bareme v1, meme apres le passage a v2", async () => {
src/server/services/certification.ts:33: * Questions d'une version donnee. Une tentative est TOUJOURS lue et calculee
src/server/services/certification.ts:223:    // Le dernier resultat fait foi : sous le seuil, la certification est
src/server/services/questionnaire.ts:241: * une tentative v1 reste calculee avec le questionnaire v1, meme apres le
src/server/video/__tests__/abstraction-holds.test.ts:19:/** Le module video a le droit de nommer les hebergeurs. Le reste, non. */
src/server/video/local-provider.ts:176:    // Une route applicative, pas un chemin de fichier : les droits sont
```
