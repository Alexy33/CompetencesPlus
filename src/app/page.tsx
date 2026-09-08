import { CtaSection } from "@/components/landing/cta-section";
import { DemoAccountsSection } from "@/components/landing/demo-accounts-section";
import { HeroSection } from "@/components/landing/hero-section";
import { LandingHeader } from "@/components/landing/landing-header";
import { RecruiterSection } from "@/components/landing/recruiter-section";
import { SiteFooter } from "@/components/landing/site-footer";
import { StepsSection } from "@/components/landing/steps-section";
import { getCurrentSession } from "@/lib/auth-session";

export default async function HomePage() {
  const session = await getCurrentSession();

  return (
    <main className="min-h-screen bg-canvas text-ink antialiased selection:bg-brand selection:text-white">
      <LandingHeader connected={Boolean(session?.user)} />
      <HeroSection />
      <StepsSection />
      <RecruiterSection />
      <DemoAccountsSection />
      <CtaSection />
      <SiteFooter />
    </main>
  );
}
