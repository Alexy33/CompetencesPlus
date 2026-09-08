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

Le service est nommé **ProfilsActifs** et le dispositif **badge de certification**
sur le catalogue, la fiche publique et les espaces candidat et recruteur. Le
score reste exprimé sur 100. Le compte de démonstration administrateur est
`admin@exemple.fr`, y compris dans les tests E2E.

Les rapports sous `docs/_archive/identite-etat/` conservent les libellés observés
lors des audits historiques ; ils ne décrivent pas l’interface actuelle.

## Vérification élargie du dépôt

La vérification porte sur les 318 fichiers du répertoire de travail, fichiers
cachés et ignorés compris, hors métadonnées Git : 286 fichiers texte et 32
fichiers binaires. Les sommes d’intégrité de `package-lock.json` sont des
empreintes techniques et ne sont pas des libellés à renommer.

- Les références à une instance vidéo ministérielle sont remplacées par
  « instance PeerTube » dans la configuration, le code, OpenAPI, les tests et
  la documentation. Les URL vidéo fictives utilisent `video.example.org`.
- Les 26 captures PNG ont été contrôlées par OCR et le texte du PDF a été
  extrait. Les deux anciennes captures `video-fournisseur` ont été déplacées
  dans `docs/_archive/identite-etat/captures/video-fournisseur/` ; les liens
  documentaires ont été mis à jour.
- Un échantillonnage des deux vidéos archivées, toutes les cinq secondes
  (40 images), confirme la présence de l’ancienne identité. Il ne constitue
  pas une vérification image par image ni un contrôle de la piste audio.
- Les anciennes mentions restent dans les preuves historiques archivées
  (rapports, captures, PDF et vidéos). Aucune occurrence textuelle des anciens
  sigles ou du nom de travail du ministère ne subsiste hors de cette archive.

Le projet n’implémente actuellement aucun envoi d’e-mail transactionnel ni export PDF/CSV applicatif. La phrase réglementaire est centralisée dans `PUBLIC_NOTICE` pour être réutilisée lorsqu’un modèle d’e-mail sera introduit.

## Captures après modification

Les cinq captures sont générées par `node scripts/captures-identite-neutre.mjs` dans `docs/preuves/identite-neutre/` : accueil, inscription, catalogue recruteur, fiche profil publique et dashboard recruteur. Elles restent des preuves internes et ne doivent pas être publiées sans accord écrit de Benjamin Sellami.
