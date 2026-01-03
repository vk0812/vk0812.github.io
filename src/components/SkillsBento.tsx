import { motion } from "framer-motion";
import { Wrench } from "lucide-react";

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

const toolIcons = [
  {
    name: "Cursor",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    name: "PyTorch",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#EE4C2C">
        <path d="M12.005 0L4.952 7.053a9.865 9.865 0 0 0 0 13.947 9.865 9.865 0 0 0 13.947 0 9.866 9.866 0 0 0 0-13.947l-1.751 1.751a7.477 7.477 0 0 1 0 10.572 7.477 7.477 0 0 1-10.572 0 7.477 7.477 0 0 1 0-10.572l4.804-4.804 1.5-1.5.375-.375V0zm4.5 5.25a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z" />
      </svg>
    ),
  },
  {
    name: "Python",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path
          fill="#3776AB"
          d="M11.914 0C5.82 0 6.2 2.656 6.2 2.656l.007 2.752h5.814v.826H3.9S0 5.789 0 11.969c0 6.18 3.403 5.96 3.403 5.96h2.03v-2.867s-.109-3.42 3.35-3.42h5.766s3.24.052 3.24-3.148V3.202S18.28 0 11.913 0zM8.708 1.85c.578 0 1.046.47 1.046 1.052 0 .581-.468 1.051-1.046 1.051-.579 0-1.046-.47-1.046-1.051 0-.582.467-1.052 1.046-1.052z"
        />
        <path
          fill="#FFD43B"
          d="M12.087 24c6.093 0 5.713-2.656 5.713-2.656l-.007-2.752h-5.814v-.826h8.121s3.9.445 3.9-5.735c0-6.18-3.403-5.96-3.403-5.96h-2.03v2.867s.109 3.42-3.35 3.42H9.45s-3.24-.052-3.24 3.148v5.292S5.72 24 12.087 24zm3.206-1.85c-.578 0-1.046-.47-1.046-1.052 0-.581.468-1.051 1.046-1.051.579 0 1.046.47 1.046 1.051 0 .582-.467 1.052-1.046 1.052z"
        />
      </svg>
    ),
  },
  {
    name: "Weights & Biases",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#FFBE00">
        <path d="M4.5 7.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 7.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.5 7.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4.5 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.5 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM4.5 22.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM12 22.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.5 22.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
      </svg>
    ),
  },
  {
    name: "Docker",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#2496ED">
        <path d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185zm-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.186zm0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.185.185.186zm-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.185.185.186zm-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.185.186.186zm5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185zm-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185zm-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.185-.186H5.136a.186.186 0 0 0-.186.185v1.888c0 .102.084.185.186.185zm-2.92 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.082.185.185.185zM23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.376 11.376 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288z" />
      </svg>
    ),
  },
  {
    name: "Kubernetes",
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#326CE5">
        <path d="M10.204 14.35l.007.01-.999 2.413a5.171 5.171 0 0 1-2.075-2.597l2.578-.437.004.005a.44.44 0 0 1 .484.606zm-.833-2.129a.44.44 0 0 0 .173-.756l.002-.011L7.585 9.7a5.143 5.143 0 0 0-.73 3.255l2.514-.725.002-.009zm1.145-1.98a.44.44 0 0 0 .699-.337l-.007-.007V7.355a5.174 5.174 0 0 0-3.076 1.679l2.3 1.422.084.001zm1.017-.167a.44.44 0 0 0 .703.334l.01.005 2.3-1.422a5.174 5.174 0 0 0-3.076-1.679v2.553l.063.209zm.986 1.38a.44.44 0 0 0 .18.757l.012.01 2.514.725a5.143 5.143 0 0 0-.73-3.255l-1.96 1.754-.016.009zm1.112 1.878a.44.44 0 0 0 .477-.608l.01-.005 2.578.437a5.171 5.171 0 0 1-2.075 2.597l-.999-2.413.009-.008zm-3.614 3.573l.002-.006-.913 2.205a5.19 5.19 0 0 1-1.852-.938l1.715-1.652.048.391zm1.971-.116l.051-.393 1.715 1.652a5.19 5.19 0 0 1-1.852.938l-.913-2.205-.001.008zM12 9.047a2.953 2.953 0 1 0 0 5.906 2.953 2.953 0 0 0 0-5.906zm0-6.96a9.913 9.913 0 0 0-9.913 9.913 9.913 9.913 0 0 0 9.913 9.913 9.913 9.913 0 0 0 9.913-9.913A9.913 9.913 0 0 0 12 2.087z" />
      </svg>
    ),
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
