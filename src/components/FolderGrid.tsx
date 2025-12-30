import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { ExternalLink, FileText } from "lucide-react";

interface Company {
  name: string;
  logo: React.ReactNode;
  role: string;
  details: string[];
}

const companies: Company[] = [
  {
    name: "Adobe",
    logo: (
      <span className="text-red-600 font-bold text-2xl tracking-tight">
        Adobe<span className="text-red-500">.</span>
      </span>
    ),
    role: "Member of Technical Staff",
    details: [
      "Improving search and relevance for content search products across Adobe ecosystem",
      "Architecting techniques for foundational vision models — boosted video search accuracy by 8%+",
      "Integrating semantic search into Adobe Firefly and Stock for millions of users",
    ],
  },
  {
    name: "Loria France",
    logo: (
      <div className="flex flex-col items-center gap-1">
        <span className="text-blue-600 font-bold text-xl tracking-wide">LORIA</span>
        <span className="text-xs text-muted-foreground">Charpak Scholar</span>
      </div>
    ),
    role: "Research Intern",
    details: [
      "Investigated stereotypical biases in Large Language Models under Prof. Karen Fort",
      "Published findings at ICLR 2024 workshop on LLM evaluation and bias",
      "Developed evaluation frameworks for bias detection in generative models",
    ],
  },
  {
    name: "Bosch AIShield",
    logo: (
      <div className="flex items-center gap-2">
        <span className="text-red-700 font-bold text-xl">BOSCH</span>
      </div>
    ),
    role: "Student Trainee",
    details: [
      "Studied existing Evasion Attacks on Tabular Data using ML Models",
      "Devised a novel evasion technique surpassing current methods with superior scores",
      "Filed a patent application at Bosch for the innovative attack methodology",
    ],
  },
  {
    name: "DevCom IIT Bombay",
    logo: (
      <div className="flex flex-col items-center gap-1">
        <span className="text-foreground font-bold text-lg">DevCom</span>
        <span className="text-xs text-muted-foreground">IIT Bombay</span>
      </div>
    ),
    role: "Institute System Administrator",
    details: [
      "Maintained critical infrastructure for 20,000+ users across campus",
      "Built ResoBin — a platform used by 10,000+ IIT Bombay students for course planning",
      "Added AI features including RAG pipelines and natural language interfaces to ResoBin",
      "Led server upgrades and coordinated campus-wide tech committee",
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
          <div className="p-8">{company.logo}</div>
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
