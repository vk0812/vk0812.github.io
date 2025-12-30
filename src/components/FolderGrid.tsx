import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { FileText } from "lucide-react";
import { useTheme } from "next-themes";
import adobeLogo from "@/assets/adobe_logo.png";
import boschDarkLogo from "@/assets/bosch_dark_logo.png";
import boschLightLogo from "@/assets/bosch_light_logo.png";
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
  className 
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
      <motion.img
        key={isDark ? "dark" : "light"}
        src={isDark ? darkSrc : lightSrc}
        alt={alt}
        className={className}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
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
        className="h-24 w-auto object-contain transition-opacity duration-300"
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
        <img 
          src={loriaLogo} 
          alt="Loria" 
          className="h-20 w-auto object-contain transition-opacity duration-300"
        />
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
        className="h-12 w-auto object-contain"
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
          className="h-24 w-auto object-contain"
        />
      </div>
    ),
    role: "Overall Coordinator & Institute System Administrator",
    details: [
      "Maintained the Gymkhana servers with 50+ websites and critical services for 20,000+ residents of IIT Bombay",
      "Helped build ResoBin — a one-stop platform for course planning used by over 10,000 IIT Bombay students",
      "Developed with Django REST backend and React frontend, integrated with IITB SSO authentication",
      "Achieved 10,000+ users and catalogued 3,000+ courses, centralizing course access for the entire campus",
      "Awarded Institute Technical Award for critical contributions to IIT Bombay’s digital infrastructure"
    ],
  },
];

const FolderCard = ({
  company,
  index,
  isSelected,
  onHover,
}: {
  company: Company;
  index: number;
  isSelected: boolean;
  onHover: (index: number | null) => void;
}) => {
  const { theme } = useTheme();
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative cursor-pointer"
      onMouseEnter={() => onHover(index)}
      onMouseLeave={() => onHover(null)}
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
        {/* Folder Tab - positioned at top right */}
        <div className="absolute -top-3 right-8 w-12 h-5 bg-muted rounded-t-lg z-10" />

        {/* Folder Body */}
        <div className="relative bg-muted rounded-2xl min-h-[160px] flex items-center justify-center shadow-sm hover:shadow-md transition-shadow duration-300">
          <div className="p-8">{company.logo(theme)}</div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const FolderGrid = () => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const selectedCompany = selectedIndex !== null ? companies[selectedIndex] : null;

  return (
    <section className="py-20 px-6">
      <div className="container mx-auto max-w-5xl">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-muted-foreground font-sans mb-10"
        >
          Previously at
        </motion.p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {companies.map((company, index) => (
            <FolderCard
              key={company.name}
              company={company}
              index={index}
              isSelected={selectedIndex === index}
              onHover={setSelectedIndex}
            />
          ))}
        </div>

        {/* Bottom section with hint text and resume button - hides on hover */}
        <AnimatePresence mode="wait">
          {selectedIndex === null ? (
            <motion.div
              key="hint"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="flex items-center justify-between mt-8"
            >
              <p className="text-sm text-muted-foreground font-sans">
                Hover over a company to see details
              </p>

              <a
                href="/Vidit_Khazanchi_Resume.pdf"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
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
              className="mt-8 bg-muted rounded-2xl p-8 shadow-sm"
            >
              <div className="mb-4">
                <h3 className="font-sans font-semibold text-lg text-foreground">
                  {selectedCompany.name}
                </h3>
                <p className="text-muted-foreground">{selectedCompany.role}</p>
              </div>
              <ul className="space-y-3">
                {selectedCompany.details.map((detail, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: i * 0.1 }}
                    className="flex items-start gap-3 text-foreground"
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
