import { SiteShell } from "@/components/layout/site-shell";
import { RecruiterDashboard } from "@/components/recruiter/recruiter-dashboard";

export default function RecruiterPage() {
  return (
    <SiteShell>
      <RecruiterDashboard />
    </SiteShell>
  );
}
