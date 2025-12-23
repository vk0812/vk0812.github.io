import { motion } from "framer-motion";

const ImpactQuote = () => {
  return (
    <section className="py-24 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <p className="text-sm font-sans text-muted-foreground mb-6">
            Something that I comes across & stuck with me
          </p>

          <blockquote className="font-serif text-3xl md:text-4xl lg:text-5xl italic text-secondary leading-relaxed mb-12">
            "Design is not just what it looks like
            <br />
            & feels like. Design is how it works"
          </blockquote>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="border-t border-border pt-8 max-w-2xl mx-auto"
          >
            <p className="text-muted-foreground font-sans leading-relaxed mb-6">
              'Every aspect of my work is carefully considered, from the tiniest details to the
              overall aesthetic. It's not just about creating pretty things; it's about creating
              experiences that are thoughtful, intentional, and exceptional.'
            </p>

            <div className="flex items-center justify-between">
              <p className="text-sm font-sans text-muted-foreground">
                Let's Talk about{" "}
                <a href="#" className="text-secondary underline font-medium">
                  Joe Rogan Experience
                </a>
              </p>
              <a
                href="https://twitter.com"
                className="text-secondary hover:text-secondary/80 transition-colors"
              >
                𝕏
              </a>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default ImpactQuote;
