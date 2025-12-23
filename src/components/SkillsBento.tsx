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
  { name: "Figma", color: "text-[#F24E1E]" },
  { name: "Notion", color: "text-foreground" },
  { name: "Framer", color: "text-foreground" },
  { name: "Webflow", color: "text-[#4353FF]" },
  { name: "PureRef", color: "text-[#9B59B6]" },
  { name: "Slack", color: "text-[#4A154B]" },
];

const SkillsBento = () => {
  return (
    <section className="py-24 px-6 bg-muted">
      <div className="container mx-auto max-w-6xl">
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
          <div className="grid grid-cols-1 lg:grid-cols-2">
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
                <div className="grid grid-cols-3 gap-3">
                  {toolIcons.map((tool, i) => (
                    <motion.div
                      key={tool.name}
                      whileHover={{ scale: 1.05 }}
                      className="aspect-square bg-muted rounded-lg flex items-center justify-center text-xs font-sans text-muted-foreground hover:shadow-soft transition-shadow"
                    >
                      {tool.name}
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
