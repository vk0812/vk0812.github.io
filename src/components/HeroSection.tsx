import { motion } from "framer-motion";
import { Handshake, FileText } from "lucide-react";
import ScrambleText from "./ScrambleText";

const HeroSection = () => {
  return (
    <section
      id="home"
      className="hero-fullscreen relative overflow-hidden flex flex-col items-center justify-center pt-24 sm:pt-28 pb-10 sm:pb-12 px-5 sm:px-6"
    >
      <div className="ml-hero-watermark absolute inset-0 pointer-events-none" aria-hidden />
      <div className="container mx-auto text-center max-w-4xl relative">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-muted-foreground font-sans text-sm sm:text-base mb-3 sm:mb-4"
        >
          <ScrambleText text="I'm Vidit Khazanchi" delay={300} speed={100} scrambleSpeed={60} />*
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-medium text-foreground leading-[1.1] mb-5 sm:mb-6"
        >
          <span className="italic">M</span>L Engineer
          <br />
          <span className="sm:whitespace-nowrap">
            <span className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl italic">&</span> Backend Developer
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-base sm:text-lg md:text-xl font-sans font-medium text-foreground mb-3 sm:mb-4"
        >
          who builds AI-powered products at scale.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-sm sm:text-base text-muted-foreground font-sans max-w-2xl mx-auto mb-7 sm:mb-8 leading-relaxed px-2 sm:px-0"
        >
          Currently at <span className="text-red-500 font-medium">Adobe</span>, improving search and relevance across the
          ecosystem. Previously built <span className="text-purple-400 font-medium">ResoBin</span> for 10K+ IIT Bombay
          students, published at <span className="text-amber-500 font-medium">ICLR 2024</span>, and filed a patent at{" "}
          <span className="text-red-500 font-medium">Bosch</span> for ML security research.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center max-w-md sm:max-w-none mx-auto"
        >
          <motion.a
            href="#contact"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-secondary text-secondary-foreground font-sans font-medium rounded-xl shadow-card hover:shadow-hover transition-all duration-300 text-sm sm:text-base"
          >
            <Handshake className="w-5 h-5" />
            Let's Work together
          </motion.a>

          <motion.a
            href="/Vidit_Khazanchi_Resume.pdf"
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 py-3.5 sm:py-4 bg-card text-foreground font-sans font-medium rounded-xl shadow-soft border border-border hover:shadow-card transition-all duration-300 text-sm sm:text-base"
          >
            <FileText className="w-5 h-5" />
            Resume
          </motion.a>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
