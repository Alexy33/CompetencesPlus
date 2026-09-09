import { CatalogQuery } from "@/server/contracts/profile";
import { normalizeSetting } from "@/server/services/settings";

export type SearchParams = Record<string, string | string[] | undefined>;
export type CatalogFilters = ReturnType<typeof CatalogQuery.parse>;

export function parseCatalogFilters(raw: SearchParams, defaultPageSize: number): CatalogFilters {
  const pageSize = normalizeSetting("catalogPageSize", defaultPageSize);
  const skills = raw.skills === undefined ? undefined : [raw.skills].flat();

  const parsed = CatalogQuery.safeParse({ ...raw, skills, pageSize: raw.pageSize ?? pageSize });
  if (parsed.success) return parsed.data;

  const repli = CatalogQuery.safeParse({ pageSize });
  return repli.success ? repli.data : CatalogQuery.parse({});
}

export function toCarriedParams(filters: CatalogFilters): URLSearchParams {
  const carried = new URLSearchParams();

  if (filters.q) carried.set("q", filters.q);
  if (filters.sector) carried.set("sector", filters.sector);
  if (filters.city) carried.set("city", filters.city);
  if (filters.certified) carried.set("certified", "true");
  if (filters.availability) carried.set("availability", filters.availability);
  for (const skill of filters.skills ?? []) carried.append("skills", skill);

  return carried;
}
