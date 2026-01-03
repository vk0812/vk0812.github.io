import { ReactNode } from "react";
import { motion } from "framer-motion";

interface QuoteProps {
  children: ReactNode;
  author?: string;
  delay?: number;
}

export const Quote = ({ children, author, delay = 0 }: QuoteProps) => (
  <motion.blockquote
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="border-l-4 border-primary/30 pl-6 my-8 italic"
  >
    <p className="font-serif text-lg text-foreground/90 leading-relaxed">
      {children}
    </p>
    {author && (
      <footer className="mt-2 text-sm text-muted-foreground font-sans">
        — {author}
      </footer>
    )}
  </motion.blockquote>
);
