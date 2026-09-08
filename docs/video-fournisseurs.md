# Hébergement vidéo — l'interface, et ce qui changera le jour de PeerTube

> Demi-page demandée par le cabinet (courriel du vendredi 16 h 20) : pourquoi
> ces méthodes-là, et ce qu'on ferait autrement quand l'instance PeerTube
> existera. Le détail d'exploitation est dans [`video.md`](video.md).

## Pourquoi ces quatre méthodes

L'interface `VideoProvider` ([`src/server/video/provider.ts`](../src/server/video/provider.ts))
expose exactement quatre responsabilités, parce que ce sont les quatre seules
choses que l'application a jamais besoin de demander à un hébergeur :

| Méthode | Ce que l'application veut savoir |
| --- | --- |
| `store(fichier)` | « voici des octets, donne-moi de quoi les retrouver » |
| `status(identifiant)` | « est-ce lisible, maintenant ? » |
| `playbackUrl(identifiant)` | « où j'envoie le lecteur ? » |
| `delete(identifiant)` | « fais disparaître les octets » |

Trois choix méritent d'être défendus.

**`store()` rend un identifiant opaque, pas une URL.** Une URL est une décision
d'hébergeur déguisée en donnée : la stocker, c'est graver dans la base le fait
qu'on sert des fichiers, et se condamner à une migration de contenu le jour où
ce n'est plus vrai. Un identifiant opaque ne dit rien du stockage ; c'est
l'hébergeur, nommé à côté dans `profile.video_provider`, qui sait le lire. C'est
aussi ce qui rend l'adresse indevinable : `/api/videos/{32 hexa}` ne révèle ni
le profil, ni le nom du fichier.

**`status()` est séparé de `playbackUrl()`.** Le transcodage n'est pas
instantané : `store()` peut réussir sans que la vidéo soit lisible. Fusionner
les deux obligerait l'appelant à interpréter un `null` — vidéo absente ? en
cours ? hébergeur muet ? Séparés, l'état est une donnée explicite
(`processing` / `ready` / `unavailable`) et l'application sait quoi afficher.
`status()` ne lève d'ailleurs jamais d'exception : un hébergeur muet est un état
métier, pas une panne du dispositif — c'est ce qui garantit qu'aucune fiche
profil ne peut tomber en 500 à cause de la vidéo.

**`delete()` est dans l'interface, pas dans le service.** Le retrait du
consentement (R.3) et la suppression volontaire sont deux portes d'entrée sur la
même obligation : faire disparaître les octets. Les deux passent par
`deleteProfileVideo()`, qui passe par `VideoProvider.delete()`. Il n'existe
aucun autre code capable d'effacer un fichier vidéo dans le dépôt.

Une cinquième méthode, `openStream()`, est **optionnelle** : elle ne concerne
que les hébergeurs dont les octets transitent par notre propre route contrôlée.
PeerTube ne l'implémentera pas — il sert lui-même sa vidéo.

## Ce que coûte le branchement, concrètement

Deux fichiers, et rien d'autre :

| Fichier | Modification |
| --- | --- |
| `src/server/video/peertube-provider.ts` | remplacer le corps des quatre méthodes par les appels d'API |
| `src/server/video/registry.ts` | rien, si la classe garde son nom — sinon une ligne dans `createVideoProvider` |

Aucune route, aucun service, aucun composant, aucune migration. Trois
garde-fous le vérifient à chaque exécution de la suite
(`__tests__/abstraction-holds.test.ts`) :

- aucun code applicatif ne compare le nom d'un hébergeur ;
- aucun code applicatif n'instancie ni ne reconnaît une implémentation
  concrète (`new`, `instanceof`) ;
- l'application n'importe de `src/server/video/` que le contrat, le registre et
  la présentation — jamais un module d'implémentation.

Une violation fait échouer la suite en nommant le fichier fautif. La seule
exception assumée est `scripts/migrate-videos.ts`, qui déplace des fichiers d'un
ancien répertoire vers le nouveau : dépendre du stockage local y est le sujet
même du script.

## Ce qu'on ferait autrement quand l'instance existera

`FakePeerTubeProvider` devient le vrai client, et rien d'autre ne bouge :
`store()` téléverse par l'API, `status()` lit l'état de transcodage,
`playbackUrl()` rend l'URL d'embarquement, `delete()` appelle la suppression.
Le basculement est `VIDEO_PROVIDER=peertube`.

Trois points demanderont une décision qu'on ne peut pas prendre aujourd'hui :

1. **La migration des vidéos existantes.** `VIDEO_PROVIDER` désigne l'hébergeur
   *actif* ; une ligne qui pointe vers un hébergeur absent du déploiement est
   annoncée indisponible — volontairement, c'est ce qui rend le mode dégradé
   observable. En vrai basculement, il faudra republier les fichiers locaux vers
   l'instance et réécrire les références : un script frère de
   [`scripts/migrate-videos.ts`](../scripts/migrate-videos.ts), qui lit par
   l'ancien fournisseur et écrit par le nouveau. L'interface permet de l'écrire
   sans toucher au reste ; on ne l'écrit pas maintenant faute d'API à appeler.

2. **La modération.** PeerTube a la sienne. Soit on garde la nôtre en amont
   (R.2 : rien n'est publié avant validation), soit on s'aligne sur la sienne —
   c'est une décision du cabinet, pas une décision technique. En attendant, la
   modération reste dans notre base, indépendante de l'hébergeur.

3. **`openStream()` disparaîtrait du chemin PeerTube**, et avec elle le contrôle
   d'accès à la lecture : une URL d'embarquement PeerTube est publique. Si les
   fiches non publiées doivent rester privées, il faudra des vidéos non listées
   côté instance, ou continuer à proxifier. À arbitrer avant la bascule.

## Ce qui a été volontairement écarté

Le lien YouTube / Vimeo existait ; il est devenu un troisième fournisseur
(`ExternalEmbedProvider`) **éteint par défaut**, conformément à la consigne. Il
n'a pas été supprimé pour ne pas perdre les fiches qui en portaient un, mais il
ne peut plus être choisi sans `VIDEO_EMBED_ENABLED=true`, et le champ de saisie
disparaît de l'espace demandeur quand il est éteint. Aucune fonctionnalité n'y a
été ajoutée.
