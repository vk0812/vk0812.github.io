import Header from "@/components/Header";
import HeroSection from "@/components/HeroSection";
import FolderGrid from "@/components/FolderGrid";
import WhoAreYou from "@/components/WhoAreYou";
import SkillsBento from "@/components/SkillsBento";
import ContactCard from "@/components/ContactCard";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <FolderGrid />
        <WhoAreYou />
        <SkillsBento />
        <ContactCard />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
