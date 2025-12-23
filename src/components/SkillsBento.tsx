import { motion } from "framer-motion";
import { Wrench, Film, BookOpen, Music } from "lucide-react";

const skillsData = {
  know: {
    title: "I KNOW THIS",
    color: "text-secondary",
    items: ["TypeScript", "JavaScript", "HTML & CSS", "C/C++", "Java", "Python", "SQL"],
  },
  use: {
    title: "I USE THIS",
    color: "text-secondary",
    items: ["React", "Next JS", "Angular", "Tailwind", "Express", "SanityJS"],
  },
  tools: {
    title: "WITH THIS",
    color: "text-secondary",
    items: ["VS Code", "Git & Github", "Framer Motion", "Docker", "MySQL", "MongoDB", "Firebase"],
  },
};

const favoritesList = [
  { icon: "🎬", text: "The Inglorious B*stards" },
  { icon: "📚", text: "Crime & Punishment" },
  { icon: "🥊", text: "Dimitri Bivol" },
  { icon: "✏️", text: "Abel Tesfaye" },
];

const toolIcons = ["Figma", "Notion", "Framer", "Webflow", "PureRef", "Slack"];

const SkillsBento = () => {
  return (
    <section className="py-24 px-6 bg-muted">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-12">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-muted-foreground font-sans"
          >
            And a bit more about me
          </motion.p>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-muted-foreground font-sans"
          >
            How you do anything is how you do everything
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column - Quote */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="lg:col-span-5 bg-card rounded-2xl p-8 shadow-soft"
          >
            <ImpactQuoteSmall />
          </motion.div>

          {/* Right Column - Skills Grid */}
          <div className="lg:col-span-7 grid grid-cols-3 gap-6">
            {Object.entries(skillsData).map(([key, data], index) => (
              <motion.div
                key={key}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="bg-card rounded-2xl p-6 shadow-soft"
              >
                <h3 className={`text-xs font-sans font-semibold ${data.color} mb-4 tracking-wider`}>
                  {data.title}
                </h3>
                <ul className="space-y-2">
                  {data.items.map((item) => (
                    <li key={item} className="text-sm font-sans text-foreground">
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Favorites List */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-card rounded-2xl p-6 shadow-soft"
          >
            <h3 className="text-sm font-sans font-medium text-foreground underline mb-4">
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
          </motion.div>

          {/* Tools I Love */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="bg-card rounded-2xl p-6 shadow-soft"
          >
            <div className="flex items-center gap-2 mb-6">
              <Wrench className="w-4 h-4 text-muted-foreground" />
              <h3 className="text-sm font-sans font-medium text-foreground">Tools I Love</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              {toolIcons.map((tool, i) => (
                <motion.div
                  key={tool}
                  whileHover={{ scale: 1.05, y: -2 }}
                  className="aspect-square bg-muted rounded-xl flex items-center justify-center shadow-soft hover:shadow-card transition-shadow"
                >
                  <span className="text-sm font-sans text-muted-foreground">{tool}</span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-muted-foreground font-sans mt-12"
        >
          Not to be flawless but to exceed Expectations
        </motion.p>
      </div>
    </section>
  );
};

const ImpactQuoteSmall = () => (
  <>
    <p className="text-xs font-sans text-muted-foreground mb-4">
      Something that I comes across & stuck with me
    </p>
    <blockquote className="font-serif text-2xl md:text-3xl italic text-secondary leading-relaxed">
      "Design is not just what it looks like
      <br />
      & feels like. Design is how it works"
    </blockquote>
  </>
);

export default SkillsBento;
