import { motion } from "framer-motion";
import { Handshake, FileText } from "lucide-react";
import ScrambleText from "./ScrambleText";

const HeroSection = () => {
  return (
    <section id="home" className="min-h-[90vh] flex flex-col items-center justify-center pt-24 pb-12 px-6">
      <div className="container mx-auto text-center max-w-4xl">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-muted-foreground font-sans mb-4"
        >
          <ScrambleText text="I'm Adith Narein" delay={300} speed={100} scrambleSpeed={60} />*
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="font-serif text-5xl md:text-7xl lg:text-8xl font-medium text-foreground leading-tight mb-6"
        >
          <span className="italic">P</span>roduct Designer
          <br />
          <span className="text-4xl md:text-5xl lg:text-6xl">&</span> Web Developer
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg md:text-xl font-sans font-medium text-foreground mb-4"
        >
          who builds stunning, purposeful & scalable products.
        </motion.p>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-muted-foreground font-sans max-w-2xl mx-auto mb-8 leading-relaxed"
        >
          Over the past few years, I've helped launch cloud platforms, airport systems, restaurant brands, and even
          drone configurators — blending user insight, technical thinking, and a stubborn love of craft.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <motion.a
            href="#contact"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-secondary text-secondary-foreground font-sans font-medium rounded-xl shadow-card hover:shadow-hover transition-all duration-300"
          >
            <Handshake className="w-5 h-5" />
            Let's Work together
          </motion.a>

          <motion.a
            href="#resume"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-card text-foreground font-sans font-medium rounded-xl shadow-soft border border-border hover:shadow-card transition-all duration-300"
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
