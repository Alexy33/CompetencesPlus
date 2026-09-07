import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="border-t border-action/10 bg-white py-8 md:py-12">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <div className="text-center md:text-left">
            <p className="font-semibold text-action">ProfilsActifs</p>
            <p className="text-sm text-ink-soft">
              Ministère du Job et Bonheur (JEB/DNI/2026-003)
            </p>
          </div>
          <nav className="flex gap-6 text-sm">
            <Link
              href="/cgu"
              className="text-ink-muted transition-colors hover:text-brand hover:underline"
            >
              Conditions d'utilisation
            </Link>
            <a
              href="/api/docs"
              className="text-ink-muted transition-colors hover:text-brand hover:underline"
            >
              Documentation API
            </a>
          </nav>
        </div>
        <div className="mt-6 border-t border-action/10 pt-6 text-center text-xs text-ink-soft">
          <p>Démonstrateur — ProfilsActifs</p>
        </div>
      </div>
    </footer>
  );
}
