import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StorySection from "@/components/StorySection";
import HowItWorksSection from "@/components/HowItWorksSection";
import PropertiesSection from "@/components/PropertiesSection";
import ContactSection from "@/components/ContactSection";
import Footer from "@/components/Footer";
import PurvaChatbot from "@/components/PurvaChatbot";
import ScrollProgress from "@/components/ScrollProgress";

const Index = () => {
  return (
    <main className="min-h-screen bg-background relative">
      <ScrollProgress />
      <Navbar />
      <HeroSection />
      <StorySection />
      <HowItWorksSection />
      <PropertiesSection />
      <ContactSection />
      <Footer />
      <PurvaChatbot />
    </main>
  );
};

export default Index;
