"use client";

import { authClient } from "@/lib/auth-client";
import { ROLE_WORKSPACE } from "@/lib/labels";
import type { UserRole } from "@/lib/vocabulary";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function useLogin() {
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

  return { email, setEmail, password, setPassword, error, loading, handleSubmit };
}
