import { ReactNode } from "react";
import { motion } from "framer-motion";

interface HeadingProps {
  level: 2 | 3 | 4;
  children: ReactNode;
  delay?: number;
}

export const Heading = ({ level, children, delay = 0 }: HeadingProps) => {
  const styles = {
    2: "font-serif text-2xl md:text-3xl text-foreground mt-10 mb-4",
    3: "font-serif text-xl md:text-2xl text-foreground mt-8 mb-3",
    4: "font-serif text-lg md:text-xl text-foreground mt-6 mb-2",
  };

  const Tag = `h${level}` as keyof JSX.IntrinsicElements;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Tag className={styles[level]}>{children}</Tag>
    </motion.div>
  );
};
