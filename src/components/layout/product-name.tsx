import Link from "next/link";

const classes = "font-heading text-xl font-bold tracking-tight text-brand no-underline";

export function ProductName({ asLink = true }: { asLink?: boolean }) {
  if (!asLink) return <span className={classes}>ProfilsActifs</span>;

  return (
    <Link href="/" className={classes} aria-label="ProfilsActifs, accueil">
      ProfilsActifs
    </Link>
  );
}
