import { SearchX } from "lucide-react";

export function NoResults() {
  return (
    <div className="flex flex-col items-center justify-center border border-brand/20 bg-white px-8 py-24 text-center">
      <div className="flex size-16 items-center justify-center border border-brand/25 bg-brand-100 text-brand">
        <SearchX aria-hidden="true" className="size-7 stroke-[1.6]" />
      </div>
      <h2 className="mt-8 text-xl font-bold uppercase tracking-tight text-ink">
        Aucun profil ne correspond
      </h2>
      <p className="mt-3 max-w-md text-sm leading-relaxed text-ink-muted">
        Élargissez la recherche en retirant une compétence, un secteur ou le filtre de
        certification.
      </p>
    </div>
  );
}
