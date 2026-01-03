import { ReactNode } from "react";
import { motion } from "framer-motion";

interface ParagraphProps {
  children: ReactNode;
  delay?: number;
}

export const Paragraph = ({ children, delay = 0 }: ParagraphProps) => (
  <motion.p
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="font-serif text-lg text-foreground leading-relaxed mb-6"
  >
    {children}
  </motion.p>
);
