import { motion } from "framer-motion";

interface CodeBlockProps {
  code: string;
  language?: string;
  delay?: number;
}

export const CodeBlock = ({ code, language, delay = 0 }: CodeBlockProps) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="mb-6"
  >
    {language && (
      <div className="bg-muted/80 text-muted-foreground text-xs px-4 py-2 rounded-t-lg font-mono border border-b-0 border-border">
        {language}
      </div>
    )}
    <pre className={`bg-muted/50 p-4 ${language ? 'rounded-b-lg' : 'rounded-lg'} overflow-x-auto border border-border`}>
      <code className="font-mono text-sm text-foreground">{code}</code>
    </pre>
  </motion.div>
);
