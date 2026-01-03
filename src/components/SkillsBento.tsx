import { motion } from "framer-motion";
import { Wrench } from "lucide-react";
import { useTheme } from "next-themes";

import CursorLightLogo from "../assets/tools/cursor.svg";
import CursorDarkLogo from "../assets/tools/cursor-dark.png";
import PyTorchLogo from "../assets/tools/pytorch-svgrepo-com.svg";
import AWSLightLogo from "../assets/tools/aws-svgrepo-com.svg";
import AWSDarkLogo from "../assets/tools/aws-svgrepo-com-dark.svg";
import WandbLogo from "../assets/tools/wandb-dots-logo.svg";
import DockerLogo from "../assets/tools/docker-svgrepo-com.svg";
import KubernetesLogo from "../assets/tools/kubernetes-svgrepo-com.svg";

const skillsData = {
  know: {
    title: "I KNOW THIS",
    items: ["C++", "Python", "TypeScript", "Linux", "Git", "SQL"],
  },
  use: {
    title: "I USE THIS",
    items: ["React", "Django", "Flask", "Docker", "Selenium", "FastAPI"],
  },
  aiml: {
    title: "AI/ML",
    items: ["PyTorch", "LangChain", "Transformers", "RAG Pipelines", "OpenAI", "Scikit-learn"],
  },
};

const languagesList = [
  { icon: "🇬🇧", text: "English" },
  { icon: "🇮🇳", text: "Hindi" },
  { icon: "🇩🇪", text: "German" },
  { icon: "🇫🇷", text: "French" },
];

const publications = [
  {
    title: "Attacks on Third-Party APIs of Large Language Models",
    authors: "Vidit Khazanchi, et al.",
    venue: "ICLR 2024 Workshop",
    type: "publication",
  },
  {
    title: "MISLEAD: Manipulating Importance of Selected Features for Learning Epsilon in Evasion Attack Deception",
    authors: "Vidit Khazanchi, et al.",
    venue: "arXiv 2024",
    type: "publication",
  },
  {
    title: "A Method Of Assessing Vulnerability Of An AI Model And A Framework Thereof",
    authors: "Vidit Khazanchi, et al.",
    venue: "WO Patent 2025",
    type: "patent",
  },
];

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
      <img
        src={darkSrc}
        alt={alt}
        className={`${className} transition-opacity duration-150 ${isDark ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
      />
      <img
        src={lightSrc}
        alt={alt}
        className={`${className} transition-opacity duration-150 ${!isDark ? 'opacity-100' : 'opacity-0 absolute inset-0'}`}
      />
    </div>
  );
};

const toolIcons = [
  {
    name: "Cursor",
    icon: <ThemeAwareLogo darkSrc={CursorDarkLogo} lightSrc={CursorLightLogo} alt="Cursor" className="w-8 h-8" />,
  },
  {
    name: "PyTorch",
    icon: <img src={PyTorchLogo} alt="PyTorch" className="w-8 h-8" />,
  },
  {
    name: "AWS",
    icon: <ThemeAwareLogo darkSrc={AWSDarkLogo} lightSrc={AWSLightLogo} alt="AWS" className="w-8 h-8" />,
  },
  {
    name: "Weights & Biases",
    icon: <img src={WandbLogo} alt="Weights & Biases" className="w-8 h-8" />,
  },
  {
    name: "Docker",
    icon: <img src={DockerLogo} alt="Docker" className="w-8 h-8" />,
  },
  {
    name: "Kubernetes",
    icon: <img src={KubernetesLogo} alt="Kubernetes" className="w-8 h-8" />,
  },
];

const SkillsBento = () => {
  return (
    <section className="py-24 px-6 bg-muted">
      <div className="container mx-auto max-w-7xl">
        {/* Header row */}
        <div className="flex items-center justify-between mb-8">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-muted-foreground font-sans text-sm"
          >
            And a bit more about me
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-muted-foreground font-sans text-sm"
          >
            The best way to learn is by doing it
          </motion.p>
        </div>

        {/* Main unified card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-card rounded-2xl border border-border/50 shadow-soft overflow-hidden"
        >
          {/* Top Section */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr]">
            {/* Left - Quote Section */}
            <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-border/30">
              <p className="text-xs font-sans text-muted-foreground mb-6">
                Something that I came across & stuck with me
              </p>
              <blockquote className="font-serif text-2xl md:text-3xl lg:text-4xl italic text-secondary leading-relaxed">
                Work until you no longer have to introduce yourself
              </blockquote>
            </div>

            {/* Right - Skills Columns */}
            <div className="p-8 lg:p-12">
              <div className="grid grid-cols-3 gap-8">
                {Object.entries(skillsData).map(([key, data]) => (
                  <div key={key}>
                    <h3 className="text-xs font-sans font-semibold text-secondary mb-4 tracking-wider">{data.title}</h3>
                    <ul className="space-y-2">
                      {data.items.map((item) => (
                        <li key={item} className="text-sm font-sans text-foreground">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Section */}
          <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_1fr] border-t border-border/30">
            {/* Left - Publications & Patents */}
            <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-border/30">
              <h3 className="text-sm font-sans font-medium text-foreground underline underline-offset-4 mb-5">
                Publications & Patents
              </h3>
              <div className="space-y-4">
                {publications.map((pub, i) => (
                  <div key={i} className="group">
                    <div className="flex items-start gap-2">
                      <span className="text-xs text-muted-foreground mt-1">{pub.type === "patent" ? "📜" : "📄"}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-sans text-foreground leading-tight line-clamp-2">{pub.title}</p>
                        <p className="text-xs font-sans text-muted-foreground mt-1">
                          {pub.authors} · {pub.venue}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Favorites & Tools */}
            <div className="grid grid-cols-2">
              {/* Languages I Know */}
              <div className="p-8 border-r border-border/30">
                <h3 className="text-sm font-sans font-medium text-foreground underline underline-offset-4 mb-6">
                  Languages I Know
                </h3>
                <ul className="space-y-3">
                  {languagesList.map((item, i) => (
                    <li key={i} className="flex items-center gap-3 text-sm font-sans text-muted-foreground">
                      <span>{item.icon}</span>
                      <span>{item.text}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Tools I Love */}
              <div className="p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-sans font-medium text-foreground">Tools I Love</h3>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  {toolIcons.map((tool, i) => (
                    <motion.div
                      key={tool.name}
                      whileHover={{ scale: 1.1 }}
                      className="aspect-square bg-muted rounded-xl flex items-center justify-center hover:shadow-soft transition-all cursor-pointer"
                      title={tool.name}
                    >
                      {tool.icon}
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="text-center text-muted-foreground font-sans mt-12"
        >
          Not to be flawless but to exceed Expectations
        </motion.p>
      </div>
    </section>
  );
};

export default SkillsBento;
