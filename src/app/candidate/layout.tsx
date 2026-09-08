import { redirect } from "next/navigation";

import { MentionDroits } from "@/components/layout/mention-droits";
import { getCurrentSession } from "@/lib/auth-session";

export default async function CandidateLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "candidate") {
    redirect("/");
  }

  return (
    <>
      <MentionDroits className="relative z-50 lg:pl-64" />
      {children}
    </>
  );
}
