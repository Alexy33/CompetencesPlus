import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ProfilsActifs",
    short_name: "ProfilsActifs",
    description: "Profils professionnels, vidéo et évaluation des compétences.",
    start_url: "/",
    display: "standalone",
    background_color: "#edf6f4",
    theme_color: "#0f766e",
    lang: "fr",
  };
}
