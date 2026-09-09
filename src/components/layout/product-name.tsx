import Link from "next/link";
import type { ProductNameProps } from "./types";

const classes = "font-heading text-xl font-bold tracking-tight text-brand no-underline";

export function ProductName({ asLink = true }: ProductNameProps) {
  if (!asLink) return <span className={classes}>ProfilsActifs</span>;

  return (
    <Link href="/" className={classes} aria-label="ProfilsActifs, accueil">
      ProfilsActifs
    </Link>
  );
}
