import HeroSection from '../../features/landing/HeroSection.jsx';
import ProblemSection from '../../features/landing/ProblemSection.jsx';
import StatsSection from '../../features/landing/StatsSection.jsx';
import SolutionSection from '../../features/landing/SolutionSection.jsx';
import HowItWorksSection from '../../features/landing/HowItWorksSection.jsx';
import PricingSection from '../../features/landing/PricingSection.jsx';
import LeadFormSection from '../../features/landing/LeadFormSection.jsx';
import FaqSection from '../../features/landing/FaqSection.jsx';

export default function LandingPage() {
  return (
    <div className="pt-16">
      <HeroSection />
      <ProblemSection />
      <StatsSection />
      <SolutionSection />
      <HowItWorksSection />
      <PricingSection />
      <LeadFormSection />
      <FaqSection />
    </div>
  );
}
