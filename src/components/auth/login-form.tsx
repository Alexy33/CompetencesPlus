"use client";

import { FormAlert } from "@/components/common/feedback";
import { AuthField, AuthSubmit, AuthSwitch } from "./auth-form-parts";
import { useLogin } from "./use-login";

export function LoginForm() {
  const { email, setEmail, password, setPassword, error, loading, handleSubmit } = useLogin();

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

      <AuthSwitch prompt="Vous n'avez pas encore de compte ?" href="/register" label="S'inscrire" />
    </div>
  );
}
