import type { ContactStatus } from "@/lib/vocabulary";

export interface SeedContact {
  email: string;
  message: string;
  status: ContactStatus;
}

export const RECRUITER_PIPELINE: SeedContact[] = [
  {
    email: "sonia.delaunay@exemple.fr",
    message:
      "Bonjour Sonia, votre reconversion et votre attention à l'accessibilité correspondent exactement au poste front-end que nous ouvrons à Nantes. Seriez-vous disponible pour un échange cette semaine ?",
    status: "Entretien planifié",
  },
  {
    email: "claire.bonnefoy@exemple.fr",
    message:
      "Bonjour Claire, nous recherchons une infirmière pour un service de médecine polyvalente à Lille. Votre profil retient toute notre attention.",
    status: "Retenu",
  },
  {
    email: "amina@exemple.fr",
    message:
      "Bonjour Amina, votre expérience en relation client nous intéresse pour un poste de conseillère grands comptes à Lyon. Pouvons-nous en discuter ?",
    status: "À qualifier",
  },
  {
    email: "karim.vasseur@exemple.fr",
    message:
      "Bonjour Karim, nous avons un poste de préparateur de commandes à pourvoir à Lille, avec les CACES que vous détenez.",
    status: "À qualifier",
  },
  {
    email: "pierre-yves.caron@exemple.fr",
    message:
      "Bonjour Pierre-Yves, merci pour votre candidature au poste de technicien support. Nous avons retenu un profil plus proche de Toulouse pour cette mission.",
    status: "Écarté",
  },
];

export const RECRUITER_FAVORITES = [
  "sonia.delaunay@exemple.fr",
  "claire.bonnefoy@exemple.fr",
  "fatou.nguyen@exemple.fr",
  "marion.esteve@exemple.fr",
];
