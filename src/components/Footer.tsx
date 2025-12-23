import { motion } from "framer-motion";

const socialLinks = [
  { label: "Tweeting about design, dev & life in itself", link: "Twitter" },
  { label: "Pixel Perfect shots of my work", links: ["Dribbble", "Layers"] },
  { label: "Brainrot of Networking", link: "LinkedIn" },
  { label: "LinkedIn's Cooler Cousin", link: "Peerlist" },
  { label: "Detailed Showcase of my work", link: "Behance" },
  { label: "If you are stalking me this would help", link: "Bento" },
];

const Footer = () => {
  return (
    <footer className="bg-charcoal text-primary-foreground py-16 px-6 min-h-[500px] relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Top Row */}
        <div className="flex items-start justify-between mb-24">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-sans text-primary-foreground/60"
          >
            © 2025 Adith Narein. All rights reserved.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-sans text-primary-foreground/60 text-right"
          >
            When it comes to art, It's important not to hide the Madness.
          </motion.p>
        </div>

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row items-end justify-between gap-16">
          {/* Giant Name */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="flex-1"
          >
            <h2 className="font-serif text-8xl md:text-[10rem] lg:text-[14rem] font-bold leading-[0.8] tracking-tight text-primary-foreground">
              <span className="italic">A</span>DITH
              <br />
              <span className="italic">N</span>AREIN
            </h2>
          </motion.div>

          {/* Social Links */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-shrink-0"
          >
            <ul className="space-y-4 text-right">
              {socialLinks.map((item, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-center justify-end gap-3"
                >
                  <span className="text-sm font-sans text-primary-foreground/60">
                    {item.label}
                  </span>
                  {"link" in item && (
                    <motion.a
                      href="#"
                      whileHover={{ x: 4 }}
                      className="social-link font-serif italic text-lg text-primary-foreground hover:text-primary-foreground/80 transition-colors"
                    >
                      {item.link}
                    </motion.a>
                  )}
                  {"links" in item && (
                    <div className="flex gap-2">
                      {item.links.map((link) => (
                        <motion.a
                          key={link}
                          href="#"
                          whileHover={{ x: 4 }}
                          className="social-link font-serif italic text-lg text-primary-foreground hover:text-primary-foreground/80 transition-colors"
                        >
                          {link}
                        </motion.a>
                      ))}
                    </div>
                  )}
                </motion.li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
