"use client";

import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";
import { LayoutGrid, LogOut } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { LandingSessionActionsProps } from "./types";

export function LandingSessionActions({ connected }: LandingSessionActionsProps) {
  const router = useRouter();
  const [signingOut, setSigningOut] = useState(false);

  async function signOut() {
    setSigningOut(true);
    await authClient.signOut();
    router.refresh();
    setSigningOut(false);
  }

  if (connected) {
    return (
      <div className="flex items-center gap-3">
        <Button
          asChild
          className="rounded-2xl bg-action px-5 font-semibold text-white shadow-raised-lg hover:bg-action-hover active:scale-[0.97]"
        >
          <Link href="/catalogue">
            <LayoutGrid aria-hidden="true" className="size-4" />
            Catalogue
          </Link>
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={signOut}
          disabled={signingOut}
          className="rounded-2xl bg-canvas px-5 font-semibold text-ink shadow-raised-md hover:bg-canvas hover:shadow-pressed-xs disabled:opacity-60"
        >
          <LogOut aria-hidden="true" className="size-4" />
          {signingOut ? "Déconnexion…" : "Déconnexion"}
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <Button
        asChild
        className="rounded-2xl bg-action px-5 font-semibold text-white shadow-raised-lg hover:bg-action-hover active:scale-[0.97]"
      >
        <Link href="/catalogue">
          <LayoutGrid aria-hidden="true" className="size-4" />
          Catalogue
        </Link>
      </Button>
      <Button
        asChild
        variant="ghost"
        className="rounded-2xl bg-canvas px-5 font-semibold text-ink shadow-raised-md hover:bg-canvas hover:shadow-pressed-xs active:scale-[0.97]"
      >
        <Link href="/login">Connexion</Link>
      </Button>
      <Button
        asChild
        className="rounded-2xl bg-action px-6 font-semibold text-white shadow-raised-lg hover:bg-action-hover active:scale-[0.97]"
      >
        <Link href="/register">Créer un profil</Link>
      </Button>
    </div>
  );
}
