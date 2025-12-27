import { motion } from "framer-motion";
import { Wrench } from "lucide-react";

const skillsData = {
  know: {
    title: "I KNOW THIS",
    items: ["TypeScript", "JavaScript", "HTML & CSS", "C/C++", "Java", "Python", "SQL"],
  },
  use: {
    title: "I USE THIS",
    items: ["React", "Next JS", "Angular", "Tailwind", "Express", "SanityJS"],
  },
  tools: {
    title: "WITH THIS",
    items: ["VS Code", "Git & Github", "Framer Motion", "Docker", "MySQL", "MongoDB", "Firebase"],
  },
};

const favoritesList = [
  { icon: "🎬", text: "The Inglorious B*stards" },
  { icon: "📚", text: "Crime & Punishment" },
  { icon: "🥊", text: "Dimitri Bivol" },
  { icon: "✏️", text: "Abel Tesfaye" },
];

const toolIcons = [
  { 
    name: "Figma", 
    icon: (
      <svg viewBox="0 0 38 57" className="w-8 h-8" fill="none">
        <path d="M19 28.5C19 23.2533 23.2533 19 28.5 19C33.7467 19 38 23.2533 38 28.5C38 33.7467 33.7467 38 28.5 38C23.2533 38 19 33.7467 19 28.5Z" fill="#1ABCFE"/>
        <path d="M0 47.5C0 42.2533 4.25329 38 9.5 38H19V47.5C19 52.7467 14.7467 57 9.5 57C4.25329 57 0 52.7467 0 47.5Z" fill="#0ACF83"/>
        <path d="M19 0V19H28.5C33.7467 19 38 14.7467 38 9.5C38 4.25329 33.7467 0 28.5 0H19Z" fill="#FF7262"/>
        <path d="M0 9.5C0 14.7467 4.25329 19 9.5 19H19V0H9.5C4.25329 0 0 4.25329 0 9.5Z" fill="#F24E1E"/>
        <path d="M0 28.5C0 33.7467 4.25329 38 9.5 38H19V19H9.5C4.25329 19 0 23.2533 0 28.5Z" fill="#A259FF"/>
      </svg>
    )
  },
  { 
    name: "Notion", 
    icon: (
      <svg viewBox="0 0 100 100" className="w-8 h-8" fill="currentColor">
        <path d="M6.017 4.313l55.333 -4.087c6.797 -0.583 8.543 -0.19 12.817 2.917l17.663 12.443c2.913 2.14 3.883 2.723 3.883 5.053v68.243c0 4.277 -1.553 6.807 -6.99 7.193L24.467 99.967c-4.08 0.193 -6.023 -0.39 -8.16 -3.113L3.3 79.94c-2.333 -3.113 -3.3 -5.443 -3.3 -8.167V11.113c0 -3.497 1.553 -6.413 6.017 -6.8z" fill="#fff"/>
        <path fillRule="evenodd" clipRule="evenodd" d="M61.35 0.227l-55.333 4.087C1.553 4.7 0 7.617 0 11.113v60.66c0 2.723 0.967 5.053 3.3 8.167l13.007 16.913c2.137 2.723 4.08 3.307 8.16 3.113l64.257 -3.89c5.433 -0.387 6.99 -2.917 6.99 -7.193V20.64c0 -2.21 -0.873 -2.847 -3.443 -4.733L74.167 3.143c-4.273 -3.107 -6.02 -3.5 -12.817 -2.917zM25.92 19.523c-5.247 0.353 -6.437 0.433 -9.417 -1.99L8.927 11.507c-0.77 -0.78 -0.383 -1.753 1.557 -1.947l53.193 -3.887c4.467 -0.39 6.793 1.167 8.54 2.527l9.123 6.61c0.39 0.197 1.36 1.36 0.193 1.36l-54.933 3.307 -0.68 0.047zM19.803 88.3V30.367c0 -2.53 0.777 -3.697 3.103 -3.893L86 22.78c2.14 -0.193 3.107 1.167 3.107 3.693v57.547c0 2.53 -0.39 4.67 -3.883 4.863l-60.377 3.5c-3.493 0.193 -5.043 -0.97 -5.043 -4.083zm59.6 -54.827c0.387 1.75 0 3.5 -1.75 3.7l-2.917 0.577v42.773c-2.527 1.36 -4.853 2.137 -6.797 2.137 -3.107 0 -3.883 -0.973 -6.21 -3.887l-19.03 -29.94v28.967l6.02 1.363s0 3.5 -4.857 3.5l-13.39 0.777c-0.39 -0.78 0 -2.723 1.357 -3.11l3.497 -0.97v-38.3L30.48 40.667c-0.39 -1.75 0.58 -4.277 3.3 -4.473l14.367 -0.967 19.8 30.327v-26.83l-5.047 -0.58c-0.39 -2.143 1.163 -3.7 3.103 -3.89l13.4 -0.78z" fill="currentColor"/>
      </svg>
    )
  },
  { 
    name: "Framer", 
    icon: (
      <svg viewBox="0 0 14 21" className="w-7 h-7" fill="currentColor">
        <path d="M0 14V7h7l7 7H0zM0 21v-7h7l-7 7zM0 7V0h14L7 7H0z"/>
      </svg>
    )
  },
  { 
    name: "Webflow", 
    icon: (
      <svg viewBox="0 0 400 400" className="w-8 h-8" fill="none">
        <path d="M289.4 120.3c-13.3 0-25.3 5.6-33.3 15.5-8-9.9-20-15.5-33.3-15.5-26.7 0-48 23.6-48 48s21.3 48 48 48c13.3 0 25.3-5.6 33.3-15.5 8 9.9 20 15.5 33.3 15.5 26.7 0 48-23.6 48-48s-21.3-48-48-48z" fill="#4353FF"/>
        <path d="M163 168.3c-26.7 0-48 23.6-48 48v64h48c26.7 0 48-23.6 48-48v-16c0-26.4-21.3-48-48-48z" fill="#4353FF"/>
        <path d="M115 168.3H67v112h48v-112z" fill="#4353FF"/>
      </svg>
    )
  },
  { 
    name: "PureRef", 
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <rect x="2" y="2" width="20" height="20" rx="3" fill="#9B59B6"/>
        <path d="M7 7h4v4H7V7zm6 0h4v4h-4V7zm-6 6h4v4H7v-4zm6 0h4v4h-4v-4z" fill="white"/>
      </svg>
    )
  },
  { 
    name: "Slack", 
    icon: (
      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none">
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313zM8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312zM18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312zM15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#E01E5A"/>
        <path d="M5.042 15.165a2.528 2.528 0 0 1-2.52 2.523A2.528 2.528 0 0 1 0 15.165a2.527 2.527 0 0 1 2.522-2.52h2.52v2.52zM6.313 15.165a2.527 2.527 0 0 1 2.521-2.52 2.527 2.527 0 0 1 2.521 2.52v6.313A2.528 2.528 0 0 1 8.834 24a2.528 2.528 0 0 1-2.521-2.522v-6.313z" fill="#E01E5A"/>
        <path d="M8.834 5.042a2.528 2.528 0 0 1-2.521-2.52A2.528 2.528 0 0 1 8.834 0a2.528 2.528 0 0 1 2.521 2.522v2.52H8.834zM8.834 6.313a2.528 2.528 0 0 1 2.521 2.521 2.528 2.528 0 0 1-2.521 2.521H2.522A2.528 2.528 0 0 1 0 8.834a2.528 2.528 0 0 1 2.522-2.521h6.312z" fill="#36C5F0"/>
        <path d="M18.956 8.834a2.528 2.528 0 0 1 2.522-2.521A2.528 2.528 0 0 1 24 8.834a2.528 2.528 0 0 1-2.522 2.521h-2.522V8.834zM17.688 8.834a2.528 2.528 0 0 1-2.523 2.521 2.527 2.527 0 0 1-2.52-2.521V2.522A2.527 2.527 0 0 1 15.165 0a2.528 2.528 0 0 1 2.523 2.522v6.312z" fill="#2EB67D"/>
        <path d="M15.165 18.956a2.528 2.528 0 0 1 2.523 2.522A2.528 2.528 0 0 1 15.165 24a2.527 2.527 0 0 1-2.52-2.522v-2.522h2.52zM15.165 17.688a2.527 2.527 0 0 1-2.52-2.523 2.526 2.526 0 0 1 2.52-2.52h6.313A2.527 2.527 0 0 1 24 15.165a2.528 2.528 0 0 1-2.522 2.523h-6.313z" fill="#ECB22E"/>
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
                Something that I comes across & stuck with me
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
          <div className="grid grid-cols-1 lg:grid-cols-2 border-t border-border/30">
            {/* Left - Personal Statement */}
            <div className="p-8 lg:p-12 border-b lg:border-b-0 lg:border-r border-border/30">
              <p className="font-sans text-muted-foreground leading-relaxed mb-8">
                'Every aspect of my work is carefully considered, from the tiniest details to
                the overall aesthetic. It's not just about creating pretty things; it's about
                creating experiences that are thoughtful, intentional, and exceptional.'
              </p>
              <div className="flex items-center justify-between">
                <p className="font-sans text-sm text-muted-foreground">
                  Let's Talk about{" "}
                  <span className="text-secondary font-medium">Rocky Graziano</span>
                </p>
                <a
                  href="#"
                  className="text-secondary hover:text-secondary/80 transition-colors"
                  aria-label="Twitter"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                  </svg>
                </a>
              </div>
            </div>

            {/* Right - Favorites & Tools */}
            <div className="grid grid-cols-2">
              {/* My Greatest List */}
              <div className="p-8 border-r border-border/30">
                <h3 className="text-sm font-sans font-medium text-foreground underline underline-offset-4 mb-6">
                  My Greatest List
                </h3>
                <ul className="space-y-3">
                  {favoritesList.map((item, i) => (
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
