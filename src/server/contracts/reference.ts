import { z } from "zod";
import { named } from "../openapi/schemas";
import {
  CitySchema,
  ContactStatusSchema,
  ProfileStatusSchema,
  SectorSchema,
  SkillSchema,
} from "./common";

export const ReferenceSchema = named(
  "Reference",
  z.object({
    sectors: z.array(SectorSchema),
    cities: z.array(CitySchema),
    skills: z.array(SkillSchema),
    profileStatuses: z.array(ProfileStatusSchema),
    contactStatuses: z.array(ContactStatusSchema),
    certificationThreshold: z.number().int(),
    catalogPageSize: z.number().int(),
    maxPageSize: z.number().int(),
  }),
);

export const PublicStatsSchema = named(
  "PublicStats",
  z.object({
    publishedProfiles: z.number().int(),
    certificationRate: z.number().int(),
    questionCount: z.number().int(),
    recruiterContacts: z.number().int(),
  }),
);
