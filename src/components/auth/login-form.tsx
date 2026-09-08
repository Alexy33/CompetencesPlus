"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import { FormAlert } from "@/components/common/feedback";
import { authClient } from "@/lib/auth-client";
import { ROLE_WORKSPACE } from "@/lib/labels";
import type { UserRole } from "@/lib/vocabulary";
import { AuthField, AuthSubmit, AuthSwitch } from "./auth-form-parts";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await authClient.signIn.email({ email, password });

      if (result.error) {
        setError(result.error.message ?? "Identifiants invalides. Réessayez.");
        setLoading(false);
        return;
      }

      const session = await authClient.getSession();
      const role = session.data?.user.role as UserRole | undefined;

      if (!role) {
        setError("Impossible de récupérer la session actuelle.");
        setLoading(false);
        return;
      }

      router.push(ROLE_WORKSPACE[role]);
      router.refresh();
    } catch {
      setError("Une erreur inattendue est survenue. Réessayez.");
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6">
      <form onSubmit={handleSubmit} className="grid gap-5">
        <FormAlert>{error}</FormAlert>

        <AuthField
          id="email"
          label="Adresse e-mail"
          type="email"
          placeholder="name@example.com"
          autoCapitalize="none"
          autoComplete="email"
          autoCorrect="off"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={loading}
          aria-invalid={Boolean(error)}
          required
        />

        <AuthField
          id="password"
          label="Mot de passe"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          disabled={loading}
          aria-invalid={Boolean(error)}
          required
        />

        <AuthSubmit loading={loading}>{loading ? "Connexion..." : "Se connecter"}</AuthSubmit>
      </form>

      <AuthSwitch
        prompt="Vous n'avez pas encore de compte ?"
        href="/register"
        label="S'inscrire"
      />
    </div>
  );
}
