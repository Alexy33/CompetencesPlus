import Link from "next/link";

export function BlocMarque({ asLink = true }: { asLink?: boolean }) {
  const contenu = (
    <>
      <span className="flex flex-col leading-[1.15]">
        <span
          className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-brand"
          style={{ fontFamily: "Marianne, system-ui, sans-serif" }}
        >
          République
        </span>
        <span
          className="font-heading text-[11px] font-bold uppercase tracking-[0.08em] text-brand"
          style={{ fontFamily: "Marianne, system-ui, sans-serif" }}
        >
          Française
        </span>
        <span
          aria-hidden="true"
          className="mt-1 font-heading text-[8px] font-medium italic tracking-tight text-ink-muted"
          style={{ fontFamily: "Marianne, system-ui, sans-serif" }}
        >
          Liberté · Égalité · Fraternité
        </span>
      </span>

      <span aria-hidden="true" className="h-10 w-px shrink-0 bg-brand/25" />

      <span className="flex flex-col leading-tight">
        <span
          className="text-[15px] font-bold tracking-tight text-brand"
          style={{ fontFamily: "Marianne, system-ui, sans-serif" }}
        >
          ProfilsActifs
        </span>
        <span className="mt-0.5 text-[10px] font-medium uppercase tracking-[0.06em] text-ink-muted">
          Ministère du Job et Bonheur
        </span>
      </span>
    </>
  );

  const classes =
    "flex items-center gap-3 rounded-2xl bg-white p-4 no-underline";

  if (!asLink) {
    return <div className={classes}>{contenu}</div>;
  }

  return (
    <Link href="/" className={classes} aria-label="ProfilsActifs — Ministère du Job et Bonheur, accueil">
      {contenu}
    </Link>
  );
}
