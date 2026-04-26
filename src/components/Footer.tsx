import { motion } from "framer-motion";

const quote = "You can achieve anything in life it just depends on how desperate you are to achieve it.";

const Footer = () => {
  const words = quote.split(" ");

  return (
    <footer className="bg-[hsl(0_0%_10%)] text-white py-6 sm:py-8 px-5 sm:px-6 relative overflow-hidden">
      <div className="container mx-auto max-w-7xl relative z-10">
        <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs sm:text-sm font-sans text-white/60"
          >
            © 2025 Vidit Khazanchi. All rights reserved.
          </motion.p>

          <motion.p
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.4 }}
            variants={{
              visible: { transition: { staggerChildren: 0.045, delayChildren: 0.05 } },
              hidden: {},
            }}
            className="text-xs sm:text-sm font-sans text-white/60 sm:text-right max-w-md sm:max-w-none flex flex-wrap justify-center sm:justify-end gap-x-1"
          >
            {words.map((word, i) => (
              <motion.span
                key={i}
                variants={{
                  hidden: { opacity: 0, y: 6, filter: "blur(4px)" },
                  visible: {
                    opacity: 1,
                    y: 0,
                    filter: "blur(0px)",
                    transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
                className="inline-block"
              >
                {word}
              </motion.span>
            ))}
          </motion.p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
