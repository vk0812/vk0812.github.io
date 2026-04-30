import { useMemo } from "react";
import { motion } from "framer-motion";
import katex from "katex";

interface FormulaProps {
  children: string;
  block?: boolean;
  delay?: number;
}

export const Formula = ({ children, block = false, delay = 0 }: FormulaProps) => {
  const html = useMemo(
    () =>
      katex.renderToString(children, {
        displayMode: block,
        throwOnError: false,
        output: "html",
        strict: "ignore",
      }),
    [children, block]
  );

  if (block) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay }}
        className="bg-muted/30 border border-border rounded-lg px-6 py-5 mb-6 text-center overflow-x-auto"
      >
        <span className="text-foreground" dangerouslySetInnerHTML={{ __html: html }} />
      </motion.div>
    );
  }

  return (
    <span
      className="text-foreground"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
};
