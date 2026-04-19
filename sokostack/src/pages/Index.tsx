import { SiteHeader } from "@/components/landing/SiteHeader";
import { HeroSection } from "@/components/landing/HeroSection";
import { SuiteBanner } from "@/components/landing/SuiteBanner";
import { TrustLogos } from "@/components/landing/TrustLogos";
import { EnterpriseSection } from "@/components/landing/EnterpriseSection";
import { ValuesSection } from "@/components/landing/ValuesSection";
import { StatsBand } from "@/components/landing/StatsBand";
import { FinalCta } from "@/components/landing/FinalCta";
import { SiteFooter } from "@/components/landing/SiteFooter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main>
        <h1 className="sr-only">SokoStack — unified business software suite</h1>
        <HeroSection />
        <SuiteBanner />
        <TrustLogos />
        <EnterpriseSection />
        <ValuesSection />
        <StatsBand />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
};

export default Index;
