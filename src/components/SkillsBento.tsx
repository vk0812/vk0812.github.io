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

const publicationsData = [
  {
    type: "Publication",
    title: "Evaluating Stereotypical Biases in Large Language Models",
    venue: "ICLR 2024",
    authors: "Vidit Khazanchi, et al.",
    link: "https://scholar.google.com/citations?user=kaMgJ24AAAAJ&hl=en",
  },
  {
    type: "Publication",
    title: "Attacks on Third-Party APIs of Large Language Models",
    venue: "ICLR 2024 Workshop",
    authors: "W. Zhao, V. Khazanchi, et al.",
    link: "https://scholar.google.com/citations?user=kaMgJ24AAAAJ&hl=en",
  },
  {
    type: "Publication",
    title: "MISLEAD: Manipulating Importance of Selected Features for Learning Epsilon in Evasion Attack Deception",
    venue: "arXiv 2024",
    authors: "Vidit Khazanchi, et al.",
    link: "https://scholar.google.com/citations?user=kaMgJ24AAAAJ&hl=en",
  },
  {
    type: "Patent",
    title: "A Method Of Assessing Vulnerability Of An AI Model And A Framework Thereof",
    venue: "WO Patent 2025",
    authors: "Vidit Khazanchi, et al.",
    link: "https://scholar.google.com/citations?user=kaMgJ24AAAAJ&hl=en",
  },
];

const languagesData = ["English", "Hindi", "French", "German"];

const toolIcons = [
  { 
    name: "VS Code", 
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#007ACC">
        <path d="M23.15 2.587L18.21.21a1.494 1.494 0 0 0-1.705.29l-9.46 8.63-4.12-3.128a.999.999 0 0 0-1.276.057L.327 7.261A1 1 0 0 0 .326 8.74L3.899 12 .326 15.26a1 1 0 0 0 .001 1.479L1.65 17.94a.999.999 0 0 0 1.276.057l4.12-3.128 9.46 8.63a1.492 1.492 0 0 0 1.704.29l4.942-2.377A1.5 1.5 0 0 0 24 20.06V3.939a1.5 1.5 0 0 0-.85-1.352zm-5.146 14.861L10.826 12l7.178-5.448v10.896z"/>
      </svg>
    )
  },
  { 
    name: "PyTorch", 
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#EE4C2C">
        <path d="M12.005 0L4.952 7.053a9.865 9.865 0 0 0 0 13.947 9.865 9.865 0 0 0 13.947 0 9.866 9.866 0 0 0 0-13.947l-1.751 1.751a7.477 7.477 0 0 1 0 10.572 7.477 7.477 0 0 1-10.572 0 7.477 7.477 0 0 1 0-10.572l4.804-4.804 1.5-1.5.375-.375V0zm4.5 5.25a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
      </svg>
    )
  },
  { 
    name: "Docker", 
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#2496ED">
        <path d="M13.983 11.078h2.119a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.119a.185.185 0 0 0-.185.185v1.888c0 .102.083.185.185.185zm-2.954-5.43h2.118a.186.186 0 0 0 .186-.186V3.574a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.186zm0 2.716h2.118a.187.187 0 0 0 .186-.186V6.29a.186.186 0 0 0-.186-.185h-2.118a.185.185 0 0 0-.185.185v1.887c0 .102.082.185.185.186zm-2.93 0h2.12a.186.186 0 0 0 .184-.186V6.29a.185.185 0 0 0-.185-.185H8.1a.185.185 0 0 0-.185.185v1.887c0 .102.083.185.185.186zm-2.964 0h2.119a.186.186 0 0 0 .185-.186V6.29a.185.185 0 0 0-.185-.185H5.136a.186.186 0 0 0-.186.185v1.887c0 .102.084.185.186.186zm5.893 2.715h2.118a.186.186 0 0 0 .186-.185V9.006a.186.186 0 0 0-.186-.186h-2.118a.185.185 0 0 0-.185.185v1.888c0 .102.082.185.185.185zm-2.93 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.083.185.185.185zm-2.964 0h2.119a.185.185 0 0 0 .185-.185V9.006a.185.185 0 0 0-.185-.186H5.136a.186.186 0 0 0-.186.185v1.888c0 .102.084.185.186.185zm-2.92 0h2.12a.185.185 0 0 0 .184-.185V9.006a.185.185 0 0 0-.184-.186h-2.12a.185.185 0 0 0-.184.185v1.888c0 .102.082.185.185.185zM23.763 9.89c-.065-.051-.672-.51-1.954-.51-.338.001-.676.03-1.01.087-.248-1.7-1.653-2.53-1.716-2.566l-.344-.199-.226.327c-.284.438-.49.922-.612 1.43-.23.97-.09 1.882.403 2.661-.595.332-1.55.413-1.744.42H.751a.751.751 0 0 0-.75.748 11.376 11.376 0 0 0 .692 4.062c.545 1.428 1.355 2.48 2.41 3.124 1.18.723 3.1 1.137 5.275 1.137.983.003 1.963-.086 2.93-.266a12.248 12.248 0 0 0 3.823-1.389c.98-.567 1.86-1.288 2.61-2.136 1.252-1.418 1.998-2.997 2.553-4.4h.221c1.372 0 2.215-.549 2.68-1.009.309-.293.55-.65.707-1.046l.098-.288z"/>
      </svg>
    )
  },
  { 
    name: "GitHub", 
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>
    )
  },
  { 
    name: "Python", 
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8">
        <path fill="#3776AB" d="M11.914 0C5.82 0 6.2 2.656 6.2 2.656l.007 2.752h5.814v.826H3.9S0 5.789 0 11.969c0 6.18 3.403 5.96 3.403 5.96h2.03v-2.867s-.109-3.42 3.35-3.42h5.766s3.24.052 3.24-3.148V3.202S18.28 0 11.913 0zM8.708 1.85c.578 0 1.046.47 1.046 1.052 0 .581-.468 1.051-1.046 1.051-.579 0-1.046-.47-1.046-1.051 0-.582.467-1.052 1.046-1.052z"/>
        <path fill="#FFD43B" d="M12.087 24c6.093 0 5.713-2.656 5.713-2.656l-.007-2.752h-5.814v-.826h8.121s3.9.445 3.9-5.735c0-6.18-3.403-5.96-3.403-5.96h-2.03v2.867s.109 3.42-3.35 3.42H9.45s-3.24-.052-3.24 3.148v5.292S5.72 24 12.087 24zm3.206-1.85c-.578 0-1.046-.47-1.046-1.052 0-.581.468-1.051 1.046-1.051.579 0 1.046.47 1.046 1.051 0 .582-.467 1.052-1.046 1.052z"/>
      </svg>
    )
  },
  { 
    name: "PostgreSQL", 
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="#4169E1">
        <path d="M23.5594 14.7228a.5269.5269 0 0 0-.0563-.1191c-.139-.2632-.4768-.3418-1.0074-.2321-1.6533.3418-2.2875.1191-2.5183-.0879-.3298-.2974-.5765-.8603-.8471-1.2021-.1032-.1311-.2144-.2441-.3297-.3571.1112-.0402.2185-.0843.3257-.1325.5765-.2632 1.0998-.6572 1.6016-1.1996.2224-.2351.4647-.5524.6711-.8577a7.8142 7.8142 0 0 0 .9951-2.3584c.1311-.5006.1112-1.0592.0362-1.4013-.0362-.1592-.0843-.2914-.1511-.3934a2.2499 2.2499 0 0 0-.1311-.1833c-.0281-.0362-.0482-.0602-.0602-.0762.0402-.3578.0322-.7596-.0241-1.1876-.0762-.5765-.2465-1.1194-.4768-1.4974-.2985-.4847-.6934-.8023-1.1917-.9535-.2224-.0682-.4567-.0923-.6711-.0762-.2985.0241-.6012.1351-.9037.3337-.2545.1632-.5086.4085-.7712.7016-.0803.0883-.1592.1888-.2545.3056a5.1848 5.1848 0 0 0-.4407-.0281c-.3056-.008-.6012.0161-.9037.0642-.2144.0362-.4166.0843-.6128.1432-.0241-.0161-.0442-.0322-.0682-.0482-.5845-.4126-1.2639-.6572-2.0592-.7254-.8511-.0762-1.7463.0401-2.6415.3457-.3257.1111-.6613.2623-1.0033.4527-.0161-.0161-.028-.0281-.044-.0441-.6613-.6292-1.4566-1.0071-2.384-1.1272-.5405-.0682-.9792-.0161-1.3652.1512-.4768.2103-.8511.5846-1.1277 1.1114-.2585.4968-.4287 1.1234-.5126 1.8889-.0441.4045-.0602.9171-.044 1.5142.0121.4567.0521 1.0793.1311 1.869.0883.8792.2104 1.6984.3617 2.4415.1591.7751.3618 1.5382.6092 2.2773.2906.8631.6173 1.5985.9751 2.194.1912.3177.4045.5765.6292.7712.3538.3056.7315.4968 1.1236.5765.4086.0843.8833.0642 1.4055-.0562.4808-.1111.9351-.2864 1.3572-.5204.3136-.1753.6012-.3859.8591-.6292.1913.2984.4207.5605.6812.7832.6613.5725 1.4967.9031 2.4841 1.0151.3618.0401.7636.0481 1.2002.0241h.0161c.5605-.028 1.0832-.1111 1.5661-.2463.4808-.1351.9431-.3217 1.3772-.5564a.2184.2184 0 0 0 .0562-.0322c.0481.1593.1072.3056.1752.4367.2385.4647.5806.8271 1.0151 1.0832.3859.2264.8031.3658 1.2443.4126.0521.008.1072.012.1632.012.2785 0 .5525-.0521.8191-.1592.2666-.1071.5085-.2704.7231-.4848.2906-.2945.5124-.6733.6613-1.1314.1351-.4166.2223-.9051.2584-1.4654.0361-.4888.0521-1.1555.044-1.9985zm-5.9657-1.8608c.0441.2142.0923.4086.1471.5845.0561.1793.1151.3418.1752.4768.0602.1351.1191.2545.1832.3618a.7453.7453 0 0 0 .1952.2263c.0762.0602.1632.1032.2585.1311.0923.028.1913.0402.2944.0362.1592-.008.3377-.0562.5326-.1432.1953-.0883.4046-.2103.6253-.3658.0481-.0361.0962-.0722.1471-.1112-.0521.2985-.1232.5806-.2144.8471-.3858 1.1274-1.0031 1.9987-1.8523 2.6095-.3858.2826-.8231.5165-1.3051.7016.0361-.5605.0802-1.1956.124-1.9023.0482-.8191.0803-1.6984.0923-2.6416.012-.8912 0-1.6905-.0361-2.406-.016-.2545-.028-.5006-.0481-.7391.0883.1032.1873.2184.2985.3457.3658.4286.6332.9872.7993 1.6704zm-11.1196 7.2146c-.1231.1673-.2744.3016-.4488.4046-.1751.1032-.3618.1673-.5565.1913-.1952.0241-.3898-.0121-.5806-.1031-.1912-.0923-.3657-.2466-.5205-.4647-.324-.4567-.5846-1.0913-.7912-1.8849-.3378-1.2962-.564-2.8863-.6773-4.7366-.0361-.5926-.0521-1.1756-.0521-1.7463 0-.5605.016-1.0792.0481-1.5501.0762-1.1314.2425-2.0507.4927-2.7241.2507-.6773.5767-1.1074.9712-1.2846.1271-.0562.2706-.0883.4287-.0923.2586-.008.5445.0521.8592.1752.2384.0923.4847.2264.7391.4006.0683.0482.1391.1031.2104.1592-.0763.0963-.1511.2065-.2224.3297-.3938.6693-.6653 1.5382-.8231 2.5983-.0803.5406-.1351 1.1716-.1631 1.8889-.028.6974-.0241 1.4695.012 2.3165.0361.8112.0962 1.5622.1792 2.2573.0803.6693.1792 1.2559.2985 1.7584.1191.5004.2545.9071.4086 1.2167.1551.3098.3216.5125.4967.6052z"/>
      </svg>
    )
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
            How you do anything is how you do everything
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
                Design is not just what it looks like
                <br />
                & feels like. Design is how it works
              </blockquote>
            </div>

            {/* Right - Skills Columns */}
            <div className="p-8 lg:p-12">
              <div className="grid grid-cols-3 gap-8">
                {Object.entries(skillsData).map(([key, data]) => (
                  <div key={key}>
                    <h3 className="text-xs font-sans font-semibold text-secondary mb-4 tracking-wider">
                      {data.title}
                    </h3>
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
          <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_1fr] border-t border-border/30">
            {/* Left - Publications & Patents */}
            <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-border/30">
              <div className="flex items-center gap-2 mb-6">
                <svg className="w-4 h-4 text-muted-foreground" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 14l9-5-9-5-9 5 9 5z"/>
                  <path d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"/>
                  <path d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222"/>
                </svg>
                <h3 className="text-sm font-sans font-medium text-foreground">Publications & Patents</h3>
              </div>
              <div className="space-y-4">
                {publicationsData.map((item, i) => (
                  <div key={i} className="group">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <span className="text-xs font-sans text-primary/80 uppercase tracking-wider">
                          {item.type} • {item.venue}
                        </span>
                        <h4 className="text-sm font-sans text-foreground mt-1 leading-snug">
                          {item.title}
                        </h4>
                        <p className="text-xs font-sans text-muted-foreground mt-1">
                          {item.authors}
                        </p>
                      </div>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-[#4285F4] transition-colors mt-1 flex-shrink-0"
                        aria-label="View on Google Scholar"
                      >
                        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 24a7 7 0 1 1 0-14 7 7 0 0 1 0 14zm0-24L0 9.5l4.838 3.94A8 8 0 0 1 12 9a8 8 0 0 1 7.162 4.44L24 9.5z"/>
                        </svg>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right - Tools & Languages */}
            <div className="p-8 lg:p-12">
              {/* Tools I Love */}
              <div className="mb-8">
                <div className="flex items-center gap-2 mb-4">
                  <Wrench className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-sans font-medium text-foreground">Tools I Love</h3>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {toolIcons.map((tool, i) => (
                    <motion.div
                      key={tool.name}
                      whileHover={{ scale: 1.1 }}
                      className="aspect-square bg-muted rounded-lg flex items-center justify-center hover:shadow-soft transition-all cursor-pointer p-2"
                      title={tool.name}
                    >
                      <div className="w-5 h-5 [&>svg]:w-full [&>svg]:h-full">
                        {tool.icon}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Languages */}
              <div>
                <h3 className="text-xs font-sans font-semibold text-secondary mb-4 tracking-wider">
                  LANGUAGES
                </h3>
                <ul className="space-y-2">
                  {languagesData.map((lang) => (
                    <li key={lang} className="text-sm font-sans text-foreground">
                      {lang}
                    </li>
                  ))}
                </ul>
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
