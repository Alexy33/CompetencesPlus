"use client";

import { Loader2, RotateCcw, SlidersHorizontal } from "lucide-react";

import type { City, Sector, Skill } from "@/lib/vocabulary";
import {
  ChipFilter,
  FilterGroup,
  SearchFilter,
  SelectFilter,
  ToggleFilter,
} from "./filters/filter-controls";
import { useUrlFilters } from "./filters/use-url-filters";

export function CatalogueFilters({
  sectors,
  cities,
  skills,
}: {
  sectors: readonly Sector[];
  cities: readonly City[];
  skills: readonly Skill[];
}) {
  const filters = useUrlFilters();

  return (
    <aside className="rounded-3xl bg-canvas p-7 shadow-raised-2xl">
      <div className="flex items-center justify-between gap-4 border-b border-ink/10 pb-5">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-brand/10 text-brand">
            <SlidersHorizontal aria-hidden="true" className="size-5 stroke-[1.7]" />
          </div>
          <h2 className="text-base font-bold uppercase tracking-tight text-ink">Filtres</h2>
        </div>

        {filters.pending ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin text-brand" />
        ) : null}
      </div>

      <FilterGroup label="Recherche" htmlFor="catalogue-search">
        <SearchFilter
          value={filters.draftQuery}
          onChange={filters.setDraftQuery}
          onSubmit={() => filters.setSingle("q", filters.draftQuery.trim())}
        />
      </FilterGroup>

      <FilterGroup label="Secteur" htmlFor="catalogue-sector">
        <SelectFilter
          id="catalogue-sector"
          value={filters.sector}
          placeholder="Tous les secteurs"
          options={sectors}
          onChange={(value) => filters.setSingle("sector", value)}
        />
      </FilterGroup>

      <FilterGroup label="Localisation" htmlFor="catalogue-city">
        <SelectFilter
          id="catalogue-city"
          value={filters.city}
          placeholder="Toute la France"
          options={cities}
          onChange={(value) => filters.setSingle("city", value)}
        />
      </FilterGroup>

      <FilterGroup label="Badge de certification">
        <ToggleFilter
          active={filters.certifiedOnly}
          offLabel="Tous"
          onLabel="Certifiés"
          onChange={(active) => filters.setSingle("certified", active ? "true" : "")}
        />
      </FilterGroup>

      <FilterGroup label="Compétences">
        <ChipFilter
          options={skills}
          selected={filters.skills}
          onToggle={(skill) => filters.toggleMulti("skills", skill)}
        />
      </FilterGroup>

      {filters.hasAny ? (
        <button
          type="button"
          onClick={filters.reset}
          className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-brand transition-colors hover:text-brand-700"
        >
          <RotateCcw aria-hidden="true" className="size-4" />
          Réinitialiser les filtres
        </button>
      ) : null}
    </aside>
  );
}
