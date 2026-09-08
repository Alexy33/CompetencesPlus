import { db } from "@/db";
import { company } from "@/db/schema";

export async function seedRecruiterCompany(recruiterId: string): Promise<void> {
  await db.insert(company).values({
    id: crypto.randomUUID(),
    userId: recruiterId,
    name: "Atelier Vasseur SAS",
    siren: "552100554",
    position: "Responsable des ressources humaines",
    address: "12 rue des Tanneurs",
    postalCode: "44000",
    city: "Nantes",
    sector: "Industrie",
    phone: "02 40 12 34 56",
    website: "https://atelier-vasseur.example.fr",
  });
}
