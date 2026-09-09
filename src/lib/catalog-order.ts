export const CATALOG_ORDERS = [
  "recent",
  "ancien",
  "certification",
  "disponibilite",
  "secteur",
  "localisation",
] as const;

export type CatalogOrder = (typeof CATALOG_ORDERS)[number];

export const DEFAULT_CATALOG_ORDER: CatalogOrder = "recent";

export const CATALOG_ORDER_LABELS: Record<CatalogOrder, string> = {
  recent: "Mise à jour la plus récente",
  ancien: "Mise à jour la plus ancienne",
  certification: "Profils évalués d'abord",
  disponibilite: "Disponibilité la plus proche",
  secteur: "Secteur (A→Z)",
  localisation: "Localisation (A→Z)",
};

export const CATALOG_ORDER_DESCRIPTIONS: Record<CatalogOrder, string> = {
  recent: "Date de dernière mise à jour du profil, la plus récente en tête.",
  ancien: "Date de dernière mise à jour du profil, la plus ancienne en tête.",
  certification:
    "Profils dont l'évaluation est validée d'abord, puis par date de mise à jour décroissante.",
  disponibilite:
    "Disponibles immédiatement, puis sous préavis, puis non disponibles ; ensuite par date de mise à jour décroissante.",
  secteur: "Secteur par ordre alphabétique, puis par date de mise à jour décroissante.",
  localisation: "Localisation par ordre alphabétique, puis par date de mise à jour décroissante.",
};
