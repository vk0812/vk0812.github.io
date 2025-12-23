import { motion } from "framer-motion";
import { useState } from "react";
import { ExternalLink } from "lucide-react";

interface Company {
  name: string;
  logo: string;
  role: string;
  color: string;
  details: string[];
}

const companies: Company[] = [
  {
    name: "Intel",
    logo: "intel.",
    role: "Software Graduate Intern",
    color: "text-secondary",
    details: [
      "Contributed to enterprise-grade software solutions",
      "Collaborated with cross-functional teams on UX improvements",
    ],
  },
  {
    name: "Kuberns",
    logo: "KUBERNS",
    role: "Product Designer",
    color: "text-emerald-600",
    details: [
      "Led end-to-end design of a cloud hosting platform, creating a scalable UX and design system",
      "Improved onboarding and resource management through iterative testing and developer collaboration.",
    ],
  },
  {
    name: "Astrik",
    logo: "✳ Astrik",
    role: "UI/UX Designer",
    color: "text-teal-600",
    details: [
      "Designed intuitive interfaces for complex workflows",
      "Created comprehensive design documentation",
    ],
  },
  {
    name: "InsideFPV",
    logo: "INSIDE FPV",
    role: "Frontend Developer",
    color: "text-red-600",
    details: [
      "Built drone configurator interfaces",
      "Implemented responsive e-commerce solutions",
    ],
  },
];

const FolderCard = ({ company, index }: { company: Company; index: number }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        animate={{
          y: isHovered ? -8 : 0,
          rotateX: isHovered ? 5 : 0,
        }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative cursor-pointer"
        style={{ perspective: "1000px" }}
      >
        {/* Folder Tab */}
        <div className="absolute -top-3 left-6 right-6 h-5 bg-muted rounded-t-lg z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-muted to-transparent rounded-t-lg" />
        </div>

        {/* Folder Body */}
        <div className="relative bg-muted rounded-2xl p-8 pt-6 shadow-soft hover:shadow-card transition-shadow duration-300 min-h-[140px] flex items-center justify-center">
          <motion.div
            animate={{ scale: isHovered ? 0.95 : 1, opacity: isHovered ? 0.3 : 1 }}
            transition={{ duration: 0.2 }}
            className={`font-sans font-bold text-xl ${company.color}`}
          >
            {company.logo}
          </motion.div>

          {/* Hover Content */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 p-6 flex flex-col justify-center pointer-events-none"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-sans font-semibold text-foreground">{company.name}</h3>
                <p className="text-sm text-muted-foreground">{company.role}</p>
              </div>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </div>
            <ul className="space-y-1.5 mt-2">
              {company.details.map((detail, i) => (
                <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                  <span className="w-1 h-1 bg-muted-foreground rounded-full mt-1.5 shrink-0" />
                  <span className="line-clamp-2">{detail}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

const FolderGrid = () => {
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
            <FolderCard key={company.name} company={company} index={index} />
          ))}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-sm text-muted-foreground font-sans mt-8"
        >
          Hover over a company to see details
        </motion.p>
      </div>
    </section>
  );
};

export default FolderGrid;
