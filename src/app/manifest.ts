import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProfilsActifs",
    short_name: "ProfilsActifs",
    description: "Profils professionnels, vidéo et évaluation des compétences.",
    start_url: "/",
    display: "standalone",
    background_color: "#ebf0f7",
    theme_color: "#1b3a6b",
    lang: "fr",
  };
}
