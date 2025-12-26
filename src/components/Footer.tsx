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
    <footer className="bg-[hsl(0_0%_10%)] text-white py-8 px-6 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        {/* Top Row */}
        <div className="flex items-center justify-between">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-sans text-white/60"
          >
            © 2025 Adith Narein. All rights reserved.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-sm font-sans text-white/60 text-right"
          >
            When it comes to art, It's important not to hide the Madness.
          </motion.p>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
