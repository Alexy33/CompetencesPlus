# Questionnaire de certification — version 2 (20 questions)

## Le critère de sélection

1. Une question ne compte que si elle mesure **une des huit compétences que le candidat
   peut déclarer sur son profil** (`SKILLS` dans `src/lib/vocabulary.ts`). Le badge certifie
   ce que la fiche affiche : sinon le score ne veut rien dire pour le recruteur qui la lit.
2. **Chaque compétence est couverte par au moins deux questions.** Une situation unique ne
   permet pas de distinguer une réponse réfléchie d'un coup de chance.
3. **Situations concrètes de travail uniquement** — aucune connaissance métier, aucune
   culture générale : le dispositif s'adresse aux sept secteurs sans en avantager un.
4. **Poids 3** quand une erreur engage le travail d'autrui ou l'organisation ; **poids 2**
   quand elle n'engage que sa propre production.
5. **Quatre réponses graduées de 0 à 3**, du contre-productif au professionnel, **sans
   réponse piège** : le barème doit rester explicable à un candidat qui conteste sa note.

## Couverture des huit compétences

| Compétence | Questions | Poids |
|---|---|---|
| Communication | q1, q2, q9 | 3, 3, 2 |
| Organisation | q3, **q13** | 2, 2 |
| Adaptabilité | q8, q11, **q14** | 2, 2, 2 |
| Travail en équipe | q4, q12, **q15** | 3, 2, 3 |
| Autonomie | q5, **q16** | 2, 2 |
| Rigueur | q7, **q17**, **q18** | 3, 3, 2 |
| Relation client | q6, **q19** | 2, 3 |
| Gestion de projet | q10, **q20** | 3, 3 |

En gras : les huit questions ajoutées en v2. Les douze autres sont reprises de la v1
**au caractère près** — même identifiant, même énoncé, mêmes options, même pondération.

Ce choix est délibéré. Toute modification d'un de ces champs change la signature de
scoring (`scoringSignature`) et force le candidat à répondre de nouveau à la question.
Rééquilibrer le poids de `q6` pour coller parfaitement à la règle 4 aurait obligé chaque
candidat déjà passé à refaire une question dont le sens n'a pas bougé, sans rien gagner en
mesure. La règle 4 décrit donc les poids en vigueur ; elle s'applique strictement aux
questions nouvelles.

## Ce que devient l'existant

**Décision retenue : conserver les passations, les marquer par leur version, et ouvrir un
rattrapage ciblé.** Aucun badge n'est retiré, aucun score n'est recalculé d'office.

La v2 **ne supprime aucune question**. Un score v1 est donc calculé sur douze questions qui
existent toutes encore en v2 : le cas que le cabinet veut interdire — « un candidat voit un
score calculé sur des questions qui n'existent plus » — **ne peut pas se produire ici**, par
construction et non par convention.

Reste que douze questions et vingt questions ne donnent pas des scores comparables. D'où :

- chaque tentative porte sa version (`certification_attempt.questionnaire_version`), figée à
  l'ouverture et jamais recalculée ;
- une tentative soumise sous une version antérieure est signalée `outdated` : l'espace
  candidat le dit, le badge reste visible des recruteurs en attendant ;
- le rattrapage (`openCatchUp`) ne repose **que les huit questions nouvelles** — vérifié :
  `questionsToReanswer(1, 2)` rend exactement `q13…q20`. Les douze réponses déjà données sont
  reportées. Le candidat répond à huit questions, pas à vingt.

### Pourquoi pas les deux autres options

**Recalculer les scores sur les questions retenues** est indéfendable ici. Les huit questions
nouvelles n'ont aucune réponse : `computeScore` les compte au maximum du barème et à zéro
point obtenu. Tout candidat déjà certifié verrait son score chuter mécaniquement pour des
questions qu'on ne lui a jamais posées. Un candidat à 82/100 tomberait autour de 49/100 sans
avoir rien fait. C'est le seul des trois choix qui produit un chiffre faux.

**Invalider les passations** retire un badge obtenu de bonne foi, sous un barème alors en
vigueur, pour une raison qui ne tient pas au candidat mais à une décision de l'administration.
Défendable juridiquement, mauvais pour le dispositif : c'est la sanction la plus lourde pour
la faute la moins imputable.

## Le traitement

`npm run certification:migrate` — rejouable, sans effet par défaut.

```
npm run certification:migrate            # état des lieux, n'écrit rien
npm run certification:migrate -- --apply # ouvre les rattrapages
```

Il compte les passations et les badges avant et après, par version, et donne pour chaque
candidat concerné son score v1, le score qu'il obtiendrait si on recalculait d'office sur la
v2, et l'écart. C'est ce tableau qui permet de dire au directeur de cabinet combien de
personnes sont concernées et ce qui change pour elles.

Relancer le script après application ne crée pas de second rattrapage : `openCatchUp` rend
`null` dès qu'une tentative est déjà en cours.
