import { getCurrentSession } from "@/lib/auth-session";
import type { UserRole } from "@/lib/vocabulary";
import { SiteSidebar } from "./site-sidebar";

export async function SiteShell({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  const user = session?.user;

  return (
    <div className="min-h-screen bg-canvas text-ink selection:bg-brand selection:text-white antialiased">
      <a href="#contenu" className="lien-evitement">
        Aller au contenu principal
      </a>
      <SiteSidebar
        session={
          user
            ? { name: user.name, role: (user.role ?? "candidate") as UserRole }
            : null
        }
      />
      <div id="contenu" tabIndex={-1} className="lg:pl-64">
        {children}
      </div>
    </div>
  );
}
