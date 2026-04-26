import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
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

const useHoverCapable = () => {
  const [hoverable, setHoverable] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia("(hover: hover) and (pointer: fine)");
    const update = () => setHoverable(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);
  return hoverable;
};

const FolderCard = ({
  company,
  index,
  isSelected,
  onSelect,
  onHover,
  hoverable,
}: {
  company: Company;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  onHover: (i: number | null) => void;
  hoverable: boolean;
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
      onMouseEnter={hoverable ? () => onHover(index) : undefined}
      onMouseLeave={hoverable ? () => onHover(null) : undefined}
      aria-pressed={isSelected}
      aria-label={`Show details for ${company.name}`}
      className="relative cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 rounded-2xl"
      style={{ zIndex: isSelected ? 10 : 1 }}
    >
      <motion.div
        animate={{
          y: isSelected ? -10 : 0,
          rotateZ: isSelected ? -2 : 0,
          scale: isSelected ? 1.02 : 1,
        }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative origin-center"
      >
        <div className="absolute -top-3 right-6 sm:right-8 w-10 sm:w-12 h-5 bg-muted rounded-t-lg z-10" />

        <div className="relative bg-muted rounded-2xl min-h-[120px] sm:min-h-[140px] lg:min-h-[160px] flex items-center justify-center shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="p-6 sm:p-7 lg:p-8">{company.logo(theme)}</div>
        </div>
      </motion.div>
    </motion.button>
  );
};

const FolderGrid = () => {
  const hoverable = useHoverCapable();
  // On touch, default to first company so the detail panel isn't empty.
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!hoverable && selectedIndex === null) {
      setSelectedIndex(0);
    }
  }, [hoverable, selectedIndex]);

  const selectedCompany = selectedIndex !== null ? companies[selectedIndex] : null;

  const handleSelect = (i: number) => {
    setSelectedIndex((curr) => (curr === i ? (hoverable ? null : 0) : i));
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

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
          {companies.map((company, index) => (
            <FolderCard
              key={company.name}
              company={company}
              index={index}
              isSelected={selectedIndex === index}
              onSelect={() => handleSelect(index)}
              onHover={setSelectedIndex}
              hoverable={hoverable}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selectedIndex === null ? (
            <motion.div
              key="hint"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mt-7 sm:mt-8"
            >
              <p className="text-xs sm:text-sm text-muted-foreground font-sans">
                {hoverable ? "Hover over a company to see details" : "Tap a company to see details"}
              </p>

              <a
                href="/Vidit_Khazanchi_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <FileText className="w-4 h-4 text-red-600" />
                Grab my Resume
              </a>
            </motion.div>
          ) : (
            <motion.div
              key="details"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 15 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="mt-7 sm:mt-8 bg-muted rounded-2xl p-6 sm:p-7 lg:p-8 shadow-sm"
            >
              <div className="mb-4">
                <h3 className="font-sans font-semibold text-base sm:text-lg text-foreground">{selectedCompany.name}</h3>
                <p className="text-sm sm:text-base text-muted-foreground">{selectedCompany.role}</p>
              </div>
              <ul className="space-y-2 sm:space-y-3">
                {selectedCompany.details.map((detail, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.08 }}
                    className="flex items-start gap-3 text-sm sm:text-base text-foreground"
                  >
                    <span className="w-1.5 h-1.5 bg-foreground rounded-full mt-2 shrink-0" />
                    <span>{detail}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
};

export default FolderGrid;
