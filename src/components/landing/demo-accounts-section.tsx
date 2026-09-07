import { DemoAccountCard } from "@/components/auth/demo-account-card";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "./landing-content";

export function DemoAccountsSection() {
  return (
    <section className="py-12 md:py-16">
      <div className="mx-auto max-w-7xl px-6 md:px-10">
        <div className="rounded-[2rem] bg-canvas p-7 shadow-raised-2xl md:p-10">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-bold uppercase tracking-tight text-ink">
                Comptes de <span className="text-brand">démonstration.</span>
              </h2>
              <p className="mt-2 text-sm text-ink-muted">
                Utilisez ces accès pour découvrir chaque espace de la plateforme.
              </p>
            </div>
            <p className="rounded-full bg-white px-4 py-2 font-mono text-xs font-semibold text-ink-muted">
              Mot de passe : {DEMO_PASSWORD}
            </p>
          </div>

          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {DEMO_ACCOUNTS.map((account) => (
              <DemoAccountCard key={account.role} account={account} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
