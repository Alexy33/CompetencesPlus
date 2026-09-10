"use client";

import { authClient } from "@/lib/auth-client";
import { USER_ROLE_LABELS } from "@/lib/labels";
import { BadgeCheck, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { SidebarSessionCardProps } from "./types";

function SignedOutActions() {
  return (
    <div className="flex flex-col gap-3">
      <Link
        href="/login"
        className="rounded-2xl bg-canvas px-4 py-3 text-center text-sm font-semibold text-ink shadow-raised-md transition-all hover:shadow-pressed-xs active:scale-[0.97]"
      >
        Connexion
      </Link>
      <Link
        href="/register"
        className="rounded-2xl bg-action px-4 py-3 text-center text-sm font-semibold text-white shadow-raised-lg transition-all hover:bg-action-hover active:scale-[0.97]"
      >
        Créer un profil
      </Link>
    </div>
  );
}

export function SidebarSessionCard({ session }: SidebarSessionCardProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  if (!session) return <SignedOutActions />;

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <div className="rounded-2xl bg-white/70 p-4">
      <div className="flex items-center gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
          <BadgeCheck aria-hidden="true" className="size-5 stroke-[1.7]" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-ink">{session.name}</p>
          <p className="truncate font-mono text-[10px] font-semibold uppercase tracking-wider text-ink-soft">
            {USER_ROLE_LABELS[session.role]}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={signOut}
        disabled={signingOut}
        className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-canvas px-4 py-2.5 text-xs font-semibold text-ink transition-colors hover:text-brand-700 disabled:opacity-60"
      >
        <LogOut aria-hidden="true" className="size-4" />
        {signingOut ? "Déconnexion…" : "Déconnexion"}
      </button>
    </div>
  );
}
