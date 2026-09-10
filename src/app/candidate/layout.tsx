import { MentionDroits } from "@/components/layout/mention-droits";
import { getCurrentSession } from "@/lib/auth-session";
import type { LayoutProps } from "@/types/pages";
import { redirect } from "next/navigation";

export default async function CandidateLayout({ children }: LayoutProps) {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "candidate") {
    redirect("/");
  }

  return (
    <>
      <MentionDroits className="relative z-50 lg:ml-64" />
      {children}
    </>
  );
}
