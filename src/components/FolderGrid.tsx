import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { useState } from "react";
import { FileText, FolderOpen, X, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import adobeLogo from "@/assets/adobe_logo.png";
import boschDarkLogo from "@/assets/bosch_dark_logo.png";
import boschLightLogo from "@/assets/bosch_light_logo.svg";
import devcomDarkLogo from "@/assets/devcom_dark_logo.png";
import devcomLightLogo from "@/assets/devcom_light_logo.png";
import loriaLogo from "@/assets/loria_logo.png";

interface Company {
  name: string;
  logo: (theme: string | undefined) => React.ReactNode;
  role: string;
  details: string[];
}

const NEUTRAL_CHIP = "bg-foreground/10 text-foreground";

const ThemeAwareLogo = ({
  darkSrc,
  lightSrc,
  alt,
  className,
}: {
  darkSrc: string;
  lightSrc: string;
  alt: string;
  className?: string;
}) => {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  return (
    <div className="relative">
      <img
        src={darkSrc}
        alt={alt}
        className={`${className} transition-opacity duration-150 ${isDark ? "opacity-100" : "opacity-0 absolute inset-0"}`}
      />
      <img
        src={lightSrc}
        alt={alt}
        className={`${className} transition-opacity duration-150 ${!isDark ? "opacity-100" : "opacity-0 absolute inset-0"}`}
      />
    </div>
  );
};

const companies: Company[] = [
  {
    name: "Adobe",
    logo: () => (
      <img
        src={adobeLogo}
        alt="Adobe"
        className="h-16 sm:h-20 lg:h-24 w-auto object-contain transition-opacity duration-300"
      />
    ),
    role: "Member of Technical Staff - Search, Discovery and Content AI",
    details: [
      "Improving search and relevance for content search products across various Adobe products",
      "Architecting techniques for foundational vision models — boosted video search accuracy by 8%+",
      "Integrating semantic search into Adobe Firefly and Stock for millions of users globally",
    ],
  },
  {
    name: "Loria France",
    logo: () => (
      <div className="flex flex-col items-center gap-2">
        <img src={loriaLogo} alt="Loria" className="h-14 sm:h-16 lg:h-20 w-auto object-contain transition-opacity duration-300" />
      </div>
    ),
    role: "Research Intern - Awarded Charpak Scholarship (1 of 30 from India)",
    details: [
      "Evaluated stereotypical bias in LLMs under Prof. Karen Fort, identifying harmful content in 25% of responses",
      "Architected an Explainable Decision Tree framework to detect covert racist biases across 84K+ text pairs",
      "Co-authoring research and experiments targeting top NLP conferences to analyze bias in code-switched prompts",
    ],
  },
  {
    name: "AIShield - Bosch",
    logo: () => (
      <ThemeAwareLogo
        darkSrc={boschDarkLogo}
        lightSrc={boschLightLogo}
        alt="Bosch"
        className="h-9 sm:h-10 lg:h-12 w-auto object-contain"
      />
    ),
    role: "Student Trainee",
    details: [
      "Thoroughly studied existing Evasion Attacks on Tabular Data using ML Models, gaining insights for research",
      "Designed MISLEAD, a novel evasion method outperforming existing attacks across accuracy and stealth metrics",
      "Filed a patent application (WO/2025/026616) at Bosch for the innovative attack methodology",
    ],
  },
  {
    name: "DevCom - IIT Bombay",
    logo: () => (
      <div className="flex flex-col items-center gap-2">
        <ThemeAwareLogo
          darkSrc={devcomDarkLogo}
          lightSrc={devcomLightLogo}
          alt="DevCom"
          className="h-16 sm:h-20 lg:h-24 w-auto object-contain"
        />
      </div>
    ),
    role: "Overall Coordinator & Institute System Administrator",
    details: [
      "Maintained the Gymkhana servers with 50+ websites and critical services for 20,000+ residents of IIT Bombay",
      "Helped build ResoBin — a one-stop platform for course planning used by over 10,000 IIT Bombay students",
      "Developed with Django REST backend and React frontend, integrated with IITB SSO authentication",
      "Achieved 10,000+ users and catalogued 3,000+ courses, centralizing course access for the entire campus",
      "Awarded Institute Technical Award for critical contributions to IIT Bombay’s digital infrastructure",
    ],
  },
];

const FolderCard = ({
  company,
  index,
  isSelected,
  onSelect,
}: {
  company: Company;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
}) => {
  const { theme } = useTheme();

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      onClick={onSelect}
      aria-pressed={isSelected}
      aria-label={`${isSelected ? "Hide" : "Show"} details for ${company.name}`}
      className="relative cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 rounded-2xl"
    >
      <motion.div
        animate={{
          y: isSelected ? -10 : 0,
          rotateZ: isSelected ? -2 : 0,
          scale: isSelected ? 1.02 : 1,
        }}
        whileHover={{ y: isSelected ? -10 : -4 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative origin-center"
      >
        {/* Folder tab — same color as folder body */}
        <div className="absolute -top-3 right-6 sm:right-8 w-10 sm:w-12 h-5 rounded-t-lg z-10 bg-muted" />

        <div
          className={`relative bg-muted rounded-2xl min-h-[140px] sm:min-h-[160px] lg:min-h-[180px] flex flex-col shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden ${
            isSelected ? "ring-2 ring-foreground/20" : ""
          }`}
        >
          {/* Logo */}
          <div className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-3 sm:pb-4 pt-1">
            {company.logo(theme)}
          </div>
        </div>
      </motion.div>
    </motion.button>
  );
};

const FolderGrid = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedCompany = selectedIndex !== null ? companies[selectedIndex] : null;

  const handleSelect = (i: number) => {
    setSelectedIndex((curr) => (curr === i ? null : i));
  };

  return (
    <section className="py-16 sm:py-20 px-5 sm:px-6">
      <div className="container mx-auto max-w-5xl">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground font-sans mb-8 sm:mb-10 text-sm sm:text-base"
        >
          Previously at
        </motion.p>

        <LayoutGroup>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {companies.map((company, index) => (
              <FolderCard
                key={company.name}
                company={company}
                index={index}
                isSelected={selectedIndex === index}
                onSelect={() => handleSelect(index)}
              />
            ))}
          </div>

          <AnimatePresence mode="wait">
            {selectedCompany === null ? (
              <motion.div
                key="hint"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-8 sm:mt-10 p-5 sm:p-6 border border-dashed border-border/60 rounded-2xl"
              >
                <div className="flex items-center gap-3">
                  <Sparkles className="w-4 h-4 text-muted-foreground shrink-0" />
                  <p className="text-xs sm:text-sm text-muted-foreground font-sans">
                    Tap a folder to open it and see what I worked on.
                  </p>
                </div>

                <a
                  href="/Vidit_Khazanchi_Resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors whitespace-nowrap"
                >
                  <FileText className="w-4 h-4 text-red-600" />
                  Grab my Resume
                </a>
              </motion.div>
            ) : (
              <motion.div
                key={`details-${selectedCompany.name}`}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className="relative mt-8 sm:mt-10 bg-muted rounded-2xl shadow-sm overflow-hidden"
              >
                <div className="p-5 sm:p-7 lg:p-8">
                  <div className="flex items-start justify-between gap-4 mb-4 sm:mb-5">
                    <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                      <div className={`p-2 sm:p-2.5 rounded-lg ${NEUTRAL_CHIP} shrink-0`}>
                        <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-sans font-semibold text-base sm:text-lg text-foreground mb-1">
                          {selectedCompany.name}
                        </h3>
                        <p className="text-sm sm:text-base text-muted-foreground leading-snug">
                          {selectedCompany.role}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedIndex(null)}
                      className="p-1.5 sm:p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-background/60 transition shrink-0"
                      aria-label="Close folder"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <ul className="space-y-2.5 sm:space-y-3">
                    {selectedCompany.details.map((detail, i) => (
                      <motion.li
                        key={`${selectedCompany.name}-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3, delay: i * 0.06 }}
                        className="flex items-start gap-3 text-sm sm:text-base text-foreground"
                      >
                        <span className="w-1.5 h-1.5 rounded-full mt-2 shrink-0 bg-foreground/60" />
                        <span className="leading-relaxed">{detail}</span>
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </LayoutGroup>
      </div>
    </section>
  );
};

export default FolderGrid;
