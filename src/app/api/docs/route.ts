import { ApiReference } from "@scalar/nextjs-api-reference";

export const GET = ApiReference({
  url: "/api/openapi",
  pageTitle: "ProfilsActifs — Documentation API",
  theme: "bluePlanet",

  agent: { disabled: true },
});
