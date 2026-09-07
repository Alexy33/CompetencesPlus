"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { DEMO_PASSWORD, type DemoAccount } from "@/components/landing/landing-content";

export function DemoAccountCard({ account }: { account: DemoAccount }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function connect() {
    setLoading(true);
    setError(null);

    const result = await authClient.signIn.email({
      email: account.email,
      password: DEMO_PASSWORD,
    });

    if (result.error) {
      setError("Connexion impossible. Vérifiez que la base de démonstration est initialisée.");
      setLoading(false);
      return;
    }

    router.push(account.destination);
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={connect}
      disabled={loading}
      className="group rounded-2xl border border-brand/15 bg-white p-5 text-left transition-colors hover:border-brand/45 hover:bg-panel disabled:cursor-wait disabled:opacity-70"
    >
      <span
        className={cn("inline-flex rounded-full px-3 py-1 text-xs font-bold", account.chipClassName)}
      >
        {account.role}
      </span>

      <span className="mt-5 block break-all font-mono text-sm font-semibold text-ink">
        {account.email}
      </span>

      <span className="mt-5 flex items-center gap-2 text-sm font-semibold text-brand group-hover:text-brand-700">
        {loading ? (
          <>
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
            Connexion…
          </>
        ) : (
          <>
            Ouvrir l&apos;espace {account.role.toLowerCase()}
            <ArrowRight
              aria-hidden="true"
              className="size-4 transition-transform group-hover:translate-x-1"
            />
          </>
        )}
      </span>

      {error ? <span className="mt-3 block text-xs text-danger-fg">{error}</span> : null}
    </button>
  );
}
