import { motion } from "framer-motion";
import { ReactNode } from "react";

interface DiagramProps {
  children: ReactNode;
  caption?: string;
  delay?: number;
}

export const Diagram = ({ children, caption, delay = 0 }: DiagramProps) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="mb-8"
  >
    <div className="bg-muted/20 border border-border rounded-lg p-6 flex items-center justify-center">
      {children}
    </div>
    {caption && (
      <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
        {caption}
      </figcaption>
    )}
  </motion.figure>
);
