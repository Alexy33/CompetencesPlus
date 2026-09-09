import { getCurrentSession } from "@/lib/auth-session";
import type { LayoutProps } from "@/types/pages";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: LayoutProps) {
  const session = await getCurrentSession();

  if (!session?.user) {
    redirect("/login");
  }

  if (session.user.role !== "admin") {
    redirect("/");
  }

  return children;
}
