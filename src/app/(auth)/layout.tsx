import { AuthPopup } from "@/components/auth/auth-popup";
import { MentionDroits } from "@/components/layout/mention-droits";
import { ProductName } from "@/components/layout/product-name";
import { PublicNotice } from "@/components/layout/public-notice";

export default function AuthLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas text-ink">
      <MentionDroits className="relative z-20" />

      <main className="relative isolate flex flex-1 items-center justify-center overflow-hidden px-4 py-8 sm:px-6">
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-canvas" />
        <div
          aria-hidden="true"
          className="absolute -left-32 top-[-12rem] -z-10 size-[32rem] rounded-full bg-brand-300/35 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="absolute -bottom-64 -right-32 -z-10 size-[38rem] rounded-full bg-brand-500/20 blur-[140px]"
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(237,246,244,0.72)_72%)] backdrop-blur-sm"
        />

        <div className="absolute left-6 top-6 z-10">
          <ProductName />
        </div>

        <section className="w-full max-w-[540px]">
          <AuthPopup>{children}</AuthPopup>
        </section>
      </main>

      <PublicNotice />
    </div>
  );
}
