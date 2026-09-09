import { LoginForm } from "@/components/auth/login-form";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion",
  description: "Connectez-vous à votre compte ProfilsActifs.",
};

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-7">
      <div className="space-y-2 text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-ink">Bon retour</h1>
        <p className="text-base text-ink-muted">
          Saisissez vos identifiants pour accéder à votre compte.
        </p>
      </div>
      <LoginForm />
    </div>
  );
}
