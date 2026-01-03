import { ReactNode } from "react";
import { motion } from "framer-motion";

interface ListProps {
  ordered?: boolean;
  children: ReactNode;
  delay?: number;
}

interface ListItemProps {
  children: ReactNode;
}

export const List = ({ ordered = false, children, delay = 0 }: ListProps) => {
  const Tag = ordered ? "ol" : "ul";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
    >
      <Tag className={`mb-6 pl-6 ${ordered ? "list-decimal" : "list-disc"} font-serif text-lg text-foreground leading-relaxed space-y-2`}>
        {children}
      </Tag>
    </motion.div>
  );
};

export const ListItem = ({ children }: ListItemProps) => (
  <li>{children}</li>
);
