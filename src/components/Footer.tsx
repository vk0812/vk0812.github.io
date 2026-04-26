import { motion } from "framer-motion";

const Footer = () => {
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
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="text-xs sm:text-sm font-sans text-white/60 sm:text-right max-w-md sm:max-w-none"
          >
            You can achieve anything in life it just depends on how desperate you are to achieve it.
          </motion.p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
