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
    name: "Intel",
    logo: (
      <span className="text-secondary font-bold text-2xl tracking-tight">
        intel<span className="text-secondary">.</span>
      </span>
    ),
    role: "Software Graduate Intern",
    details: [
      "Contributed to enterprise-grade software solutions",
      "Collaborated with cross-functional teams on UX improvements",
    ],
  },
  {
    name: "Kuberns",
    logo: (
      <div className="flex flex-col items-center gap-1">
        <div className="w-8 h-8 border-2 border-blue-500 rotate-45 flex items-center justify-center">
          <div className="w-4 h-4 border border-blue-400 rotate-0" />
        </div>
        <span className="text-blue-600 font-bold text-lg tracking-wider -rotate-0">KUBERNS</span>
      </div>
    ),
    role: "Product Designer",
    details: [
      "Led end-to-end design of a cloud hosting platform, creating a scalable UX and design system",
      "Improved onboarding and resource management through iterative testing and developer collaboration.",
    ],
  },
  {
    name: "Astrik",
    logo: (
      <div className="flex items-center gap-2">
        <span className="text-teal-600 text-3xl">✳</span>
        <span className="text-foreground font-semibold text-xl">Astrik</span>
      </div>
    ),
    role: "UI/UX Designer",
    details: [
      "Designed intuitive interfaces for complex workflows",
      "Created comprehensive design documentation",
    ],
  },
  {
    name: "InsideFPV",
    logo: (
      <div className="flex items-center gap-1">
        <div className="flex flex-col">
          <div className="w-5 h-1 bg-red-600 rounded-sm" />
          <div className="w-4 h-1 bg-red-600 rounded-sm mt-0.5" />
          <div className="w-3 h-1 bg-red-600 rounded-sm mt-0.5" />
        </div>
        <div className="flex flex-col text-red-600 font-bold text-sm leading-tight">
          <span>INSIDE</span>
          <span>FPV</span>
        </div>
      </div>
    ),
    role: "Frontend Developer",
    details: [
      "Built drone configurator interfaces",
      "Implemented responsive e-commerce solutions",
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
    >
      <motion.div
        animate={{
          y: isSelected ? -8 : 0,
        }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="relative"
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
        <AnimatePresence>
          {selectedIndex === null && (
            <motion.div
              initial={{ opacity: 1, y: 0 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="flex items-center justify-between mt-8"
            >
              <motion.p
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="text-sm text-muted-foreground font-sans"
              >
                Hover over a company to see details
              </motion.p>

              <motion.button
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.6 }}
                className="flex items-center gap-2 px-4 py-2 border border-border rounded-lg text-sm text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
              >
                <FileText className="w-4 h-4 text-red-600" />
                Grab my Resume
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Details Card - appears below on hover */}
        <AnimatePresence>
          {selectedCompany && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="mt-8 bg-muted rounded-2xl p-8 shadow-sm"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="font-sans font-semibold text-lg text-foreground">
                    {selectedCompany.name}
                  </h3>
                  <p className="text-muted-foreground">{selectedCompany.role}</p>
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
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
