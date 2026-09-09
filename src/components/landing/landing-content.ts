import { BadgeCheck, FileVideo, Search } from "lucide-react";
import { LuUserRound } from "react-icons/lu";
import type { DemoAccount, LandingItem, LandingStep } from "./types";

export const STEPS: LandingStep[] = [
  {
    icon: FileVideo,
    number: "01",
    title: "Présentez-vous autrement",
    description:
      "Ajoutez une courte présentation vidéo pour montrer votre personnalité et votre manière de communiquer.",
  },
  {
    icon: BadgeCheck,
    number: "02",
    title: "Certifiez vos compétences",
    description:
      "Complétez le parcours de certification et obtenez un badge de certification visible par les recruteurs.",
  },
  {
    icon: Search,
    number: "03",
    title: "Soyez découvert",
    description:
      "Votre profil peut être consulté par des recruteurs à la recherche de compétences correspondant à leurs besoins.",
  },
];

export const PROFILE_MODULES: LandingItem[] = [
  {
    icon: LuUserRound,
    title: "Identité professionnelle",
    description: "Parcours, métier et savoir-faire",
  },
  {
    icon: FileVideo,
    title: "Présentation vidéo",
    description: "Une introduction courte et personnelle",
  },
  {
    icon: BadgeCheck,
    title: "Compétences certifiées",
    description: "Des aptitudes vérifiées et visibles",
  },
  {
    icon: Search,
    title: "Visibilité recruteurs",
    description: "Un profil consultable selon leurs besoins",
  },
];

export const DEMO_PASSWORD = "demo1234";

export const DEMO_ACCOUNTS: DemoAccount[] = [
  {
    role: "Demandeur",
    email: "amina@exemple.fr",
    chipClassName: "bg-brand-200 text-brand-800",
    destination: "/candidate",
  },
  {
    role: "Recruteur",
    email: "recruteur@exemple.fr",
    chipClassName: "bg-success text-success-fg",
    destination: "/recruiter",
  },
  {
    role: "Administration",
    email: "admin@exemple.fr",
    chipClassName: "bg-info text-info-fg",
    destination: "/admin",
  },
];

export const NAV_LINKS = [
  { href: "#concept", label: "Le concept" },
  { href: "#fonctionnement", label: "Fonctionnement" },
  { href: "#recruteurs", label: "Recruteurs" },
];
