import { motion } from "framer-motion";
import { Heart } from "lucide-react";
import travelPhoto from "@/assets/travel-photo.jpg";

const BionicText = ({ text }: { text: string }) => {
  const words = text.split(" ");
  
  return (
    <span className="bionic-text">
      {words.map((word, index) => {
        const boldLength = Math.ceil(word.length * 0.4);
        const boldPart = word.slice(0, boldLength);
        const normalPart = word.slice(boldLength);

        return (
          <span key={index}>
            <b>{boldPart}</b>
            {normalPart}
            {index < words.length - 1 ? " " : ""}
          </span>
        );
      })}
    </span>
  );
};

const WhoAreYou = () => {
  const bioText = `I'm a Computer Science & Engineering graduate, currently working as a Software Graduate Intern at Intel. Over the years, I've had the chance to lead teams and work on real-world projects that taught me how to build digital experiences that matter. I focus on designing and developing user-centered products that scale well. Through hands-on work, trial and error, and a lot of learning along the way, I've come to see what separates good design from truly great design.`;

  const creationCycle = ["Research it", "Engineer it", "Systemize it", "Build it", "Perfect it"];

  return (
    <section id="about" className="py-24 px-6 bg-card">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">
          {/* Left Column - Bio */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-1"
          >
            <p className="text-xs font-sans text-muted-foreground uppercase tracking-wider mb-4">
              Wait a minute
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground mb-8">
              <span className="italic text-5xl md:text-6xl">W</span>ho Are You?
            </h2>

            <div className="text-foreground font-sans leading-relaxed text-justify mb-8">
              <BionicText text={bioText} />
            </div>

            <div className="bg-muted rounded-lg p-4 mb-8">
              <p className="text-sm text-muted-foreground font-sans">
                What you just experienced is called{" "}
                <span className="font-semibold text-foreground">BIONIC READING</span>. Learn more
                about it{" "}
                <a href="https://bionic-reading.com" className="text-secondary underline">
                  here
                </a>
                .
              </p>
            </div>

            <div className="space-y-2 text-sm font-sans text-muted-foreground">
              <p>🏠 Pondicherry, In</p>
              <p>🏛 Vellore Institute of Technology, Vellore, In</p>
              <p>💼 Bangalore, In</p>
            </div>
          </motion.div>

          {/* Center Column - Photo */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-1 flex flex-col items-center justify-center"
          >
            <div className="relative">
              <div className="w-64 h-80 rounded-3xl shadow-card overflow-hidden relative">
                <img 
                  src={travelPhoto} 
                  alt="Gothic cathedral at night in Mumbai" 
                  className="w-full h-full object-cover"
                />
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="absolute top-4 right-4 w-10 h-10 bg-card/90 rounded-full flex items-center justify-center shadow-soft"
                >
                  <Heart className="w-5 h-5 text-muted-foreground" />
                </motion.button>
              </div>
              <p className="text-center text-sm text-muted-foreground font-sans mt-4">
                Fav shot from my last trip
              </p>
              <p className="text-center text-sm text-secondary font-sans">Mumbai</p>
            </div>
          </motion.div>

          {/* Right Column - Creation Cycle & More */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-1"
          >
            <p className="text-foreground font-sans leading-relaxed text-justify mb-8">
              My strength lies in bridging design and development. A skill I've sharpened through
              hands-on freelancing as both a UI/UX designer and front-end developer.
            </p>

            <div className="mb-8">
              <h3 className="font-sans font-medium text-foreground mb-4">Cycle of my Creation</h3>
              <div className="bg-muted rounded-lg p-4">
                <p className="font-sans text-foreground">
                  {creationCycle.map((step, index) => (
                    <span key={step}>
                      {step}
                      {index < creationCycle.length - 1 && (
                        <span className="text-muted-foreground"> → </span>
                      )}
                    </span>
                  ))}
                </p>
              </div>
              <p className="text-sm text-muted-foreground font-sans mt-3">
                It's not just about ideas; it's about shaping them with discipline and bringing
                them to life with creativity.
              </p>
            </div>

            <p className="text-foreground font-sans leading-relaxed text-justify mb-8">
              Also, I was the Head of Design at IEEECS Student Chapter for the term 23-24. I was
              also part of the Design Team at Riviera 23, the annual fest of VIT.
            </p>

            <div className="text-right">
              <p className="text-sm text-muted-foreground font-sans mb-2">find me at</p>
              <div className="flex justify-end gap-4">
                {["𝕏", "🎨", "💼", "in", "🅿️", "Be", "◇"].map((icon, i) => (
                  <motion.a
                    key={i}
                    href="#"
                    whileHover={{ scale: 1.1, y: -2 }}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {icon}
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhoAreYou;
