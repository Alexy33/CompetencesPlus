# Preuves de neutralisation de l’identité

## Emplacements où le bloc-marque apparaissait

Le composant supprimé `src/components/layout/bloc-marque.tsx` contenait « République Française », la devise, « ProfilsActifs » et le nom du ministère. Il était rendu aux emplacements suivants :

1. `src/components/landing/landing-header.tsx` : accueil public ;
2. `src/app/(auth)/layout.tsx` : connexion et inscription ;
3. `src/components/layout/sidebar/sidebar-panel.tsx` : navigation latérale sur le catalogue, les profils publics et tous les espaces connectés ;
4. `src/components/layout/site-sidebar.tsx` : header mobile sur ces mêmes pages.

Les reproductions historiques du bloc-marque se trouvaient également dans `docs/captures/r10/`, le rapport `docs/rapports/a11y-charte.json` et `ProfilsActifs-etat-conformite.pdf`. Ces éléments ont été déplacés sous `docs/_archive/identite-etat/`.

## Autres références retirées

- Footer public et page CGU : nom de l’ancienne organisation ;
- titre d’onglet, description globale, métadonnées de partage et documentation OpenAPI ;
- README, documentation technique et données de démonstration ;
- police institutionnelle et ses préchargements ;
- libellés, badges et adresses utilisant les anciens sigles ou domaines.

Le projet n’implémente actuellement aucun envoi d’e-mail transactionnel ni export PDF/CSV applicatif. La phrase réglementaire est centralisée dans `PUBLIC_NOTICE` pour être réutilisée lorsqu’un modèle d’e-mail sera introduit.

## Captures après modification

Les cinq captures sont générées par `node scripts/captures-identite-neutre.mjs` dans `docs/preuves/identite-neutre/` : accueil, inscription, catalogue recruteur, fiche profil publique et dashboard recruteur. Elles restent des preuves internes et ne doivent pas être publiées sans accord écrit de Benjamin Sellami.
