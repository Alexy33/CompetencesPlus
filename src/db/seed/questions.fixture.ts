export interface SeedQuestion {
  text: string;
  weight: number;
  options: string[];
}

export const SEED_QUESTIONS: SeedQuestion[] = [
  {
    text: "Une consigne reçue le matin est contredite par une autre l'après-midi. Que faites-vous ?",
    weight: 3,
    options: [
      "J'applique la dernière reçue sans commentaire",
      "J'applique la première, elle était officielle",
      "Je demande un arbitrage écrit avant d'agir",
      "Je remonte la contradiction et propose une solution",
    ],
  },
  {
    text: "Vous devez expliquer un dossier technique à quelqu'un qui n'y connaît rien.",
    weight: 3,
    options: [
      "Je transmets le document tel quel",
      "Je renvoie vers un collègue plus compétent",
      "Je résume à l'oral en évitant le jargon",
      "Je pars de son besoin et j'illustre par un cas concret",
    ],
  },
  {
    text: "Comment organisez-vous une journée où tout est urgent ?",
    weight: 2,
    options: [
      "J'attends que quelqu'un tranche",
      "Dans l'ordre d'arrivée des demandes",
      "Je traite d'abord le plus rapide",
      "Je hiérarchise par impact et j'annonce les délais",
    ],
  },
  {
    text: "Un membre de l'équipe ne tient pas ses engagements depuis deux semaines.",
    weight: 3,
    options: [
      "Je compense en silence",
      "Je réorganise ma part pour ne plus en dépendre",
      "Je le signale directement à la hiérarchie",
      "Je lui en parle en direct avant d'escalader",
    ],
  },
  {
    text: "On vous confie un outil que vous n'avez jamais utilisé, sans formation.",
    weight: 2,
    options: [
      "J'attends une formation officielle",
      "Je refuse tant que le cadre n'est pas posé",
      "Je teste seul et je note mes questions",
      "Je cherche la documentation et un référent interne",
    ],
  },
  {
    text: "Face à un client mécontent dont la demande est hors périmètre :",
    weight: 2,
    options: [
      "J'accepte pour éviter le conflit",
      "Je rappelle les règles et je clos",
      "Je transfère à un supérieur",
      "Je reformule son besoin et propose une alternative",
    ],
  },
  {
    text: "Vous repérez une erreur dans un travail déjà validé par votre responsable.",
    weight: 3,
    options: [
      "J'attends que quelqu'un s'en aperçoive",
      "Je laisse, ce n'est plus mon sujet",
      "Je corrige discrètement",
      "Je signale avec la correction proposée",
    ],
  },
  {
    text: "Votre poste évolue et vos missions changent à 50 %.",
    weight: 2,
    options: [
      "Je demande un retour à l'ancien périmètre",
      "J'attends de voir si ça tient dans le temps",
      "Je m'adapte en observant les collègues",
      "Je fais le point sur mes écarts de compétences et je me forme",
    ],
  },
  {
    text: "Comment rendez-vous compte de votre activité ?",
    weight: 2,
    options: [
      "Seulement quand on me le demande",
      "Je préfère montrer le résultat final",
      "Un point oral en fin de semaine",
      "Un suivi écrit régulier et partagé",
    ],
  },
  {
    text: "Un imprévu fait tomber la moitié de votre planning.",
    weight: 3,
    options: [
      "J'applique le planning quand même",
      "Je repousse tout d'une journée",
      "Je fais des heures supplémentaires",
      "Je préviens les personnes concernées et je repriorise",
    ],
  },
  {
    text: "Que faites-vous d'un retour critique sur votre travail ?",
    weight: 2,
    options: [
      "Je le prends comme une attaque",
      "Je l'accepte sans discuter",
      "Je le compare à d'autres retours avant de conclure",
      "Je l'écoute et je demande des exemples précis",
    ],
  },
  {
    text: "Vous entrez dans une équipe déjà constituée.",
    weight: 2,
    options: [
      "J'attends qu'on vienne vers moi",
      "J'impose vite ma méthode",
      "J'observe les usages avant de proposer",
      "Je demande un référent et je me rends utile rapidement",
    ],
  },
];
