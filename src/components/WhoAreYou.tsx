import { motion } from "framer-motion";
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
  const bioText = `I'm Vidit — freshly graduated from IIT Bombay, where I majored in Metallurgical Engineering but spent most of my time wrangling AI models, scaling backend systems, and debugging things at 3AM that no one admitted to breaking. Currently I am a MTS at Adobe, where I focus on improving search and relevance for various content search products across the Adobe ecosystem. I've been architecting techniques for foundational vision models — boosting video search accuracy by over 8% — and integrating semantic search into Adobe Firefly and Stock to help millions of users discover content more intuitively.`;

  const creationCycle = ["Research it", "Build it", "Scale it", "Ship it", "Iterate"];

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
            <h2 className="font-serif text-4xl md:text-5xl font-medium text-foreground mb-8">
              <span className="italic text-5xl md:text-6xl">W</span>ho Are You?
            </h2>

            <div className="text-foreground font-sans leading-relaxed text-justify mb-8">
              <BionicText text={bioText} />
            </div>

            <div className="space-y-2 text-sm font-sans text-muted-foreground">
              <p>🏠 Kolkata, India</p>
              <p>🏛 IIT Bombay, Mumbai</p>
              <p>💼 Delhi, India (Adobe)</p>
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
              <div className="w-64 h-80 rounded-3xl shadow-card overflow-hidden">
                <img src={travelPhoto} alt="Vidit Khazanchi" className="w-full h-full object-cover" />
              </div>
              <p className="text-center text-sm text-muted-foreground font-sans mt-4">Fav shot from my last trip</p>
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
              I enjoy shipping real things that work, exploring the boundaries of ML systems, and occasionally making AI
              models question their life choices. Always up for learning, building, or geeking out over obscure bugs and
              good API design.
            </p>

            <div className="mb-8">
              <h3 className="font-sans font-medium text-foreground mb-4">Cycle of my Creation</h3>
              <div className="bg-muted rounded-lg p-4">
                <p className="font-sans text-foreground">
                  {creationCycle.map((step, index) => (
                    <span key={step}>
                      {step}
                      {index < creationCycle.length - 1 && <span className="text-muted-foreground"> → </span>}
                    </span>
                  ))}
                </p>
              </div>
              <p className="text-sm text-muted-foreground font-sans mt-3">
                It's not just about ideas; it's about building things that scale and actually work.
              </p>
            </div>

            <p className="text-foreground font-sans leading-relaxed text-justify mb-8">
              I was also the Institute System Administrator at IIT Bombay, helping maintain critical infrastructure for
              20,000+ users and coordinating a campus-wide tech committee.
            </p>

            <div className="text-right">
              <p className="text-sm text-muted-foreground font-sans mb-3">find me at</p>
              <div className="flex justify-end gap-6">
                <motion.a
                  href="https://github.com/vk0812"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="text-foreground hover:text-secondary transition-colors"
                  title="GitHub"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                </motion.a>
                <motion.a
                  href="https://www.linkedin.com/in/viditkhazanchi"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="text-[#0A66C2] hover:text-[#004182] transition-colors"
                  title="LinkedIn"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                </motion.a>
                <motion.a
                  href="https://scholar.google.com/citations?user=kaMgJ24AAAAJ&hl=en"
                  target="_blank"
                  rel="noopener noreferrer"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="text-[#4285F4] hover:text-[#1a73e8] transition-colors"
                  title="Google Scholar"
                >
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5.242 13.769L0 9.5 12 0l12 9.5-5.242 4.269C17.548 11.249 14.978 9.5 12 9.5c-2.977 0-5.548 1.748-6.758 4.269zM12 10a7 7 0 1 0 0 14 7 7 0 0 0 0-14z" />
                  </svg>
                </motion.a>
                <motion.a
                  href="mailto:viditk0812@gmail.com"
                  whileHover={{ scale: 1.1, y: -2 }}
                  className="text-[#EA4335] hover:text-[#c5221f] transition-colors"
                  title="Email"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                    />
                  </svg>
                </motion.a>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default WhoAreYou;
