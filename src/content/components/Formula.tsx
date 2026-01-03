import { motion } from "framer-motion";

interface FormulaProps {
  children: string;
  block?: boolean;
  delay?: number;
}

export const Formula = ({ children, block = false, delay = 0 }: FormulaProps) => {
  if (block) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className="bg-muted/30 border border-border rounded-lg p-6 mb-6 text-center overflow-x-auto"
      >
        <span className="font-mono text-lg text-foreground">{children}</span>
      </motion.div>
    );
  }

  return (
    <span className="font-mono text-foreground bg-muted/30 px-1.5 py-0.5 rounded">
      {children}
    </span>
  );
};
