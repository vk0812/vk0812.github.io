import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import { Highlight, themes } from "prism-react-renderer";

interface CodeBlockProps {
  code: string;
  language?: string;
  delay?: number;
}

const aliases: Record<string, string> = {
  TypeScript: "tsx",
  JavaScript: "jsx",
  Python: "python",
  Bash: "bash",
  Shell: "bash",
  JSON: "json",
  CSS: "css",
  HTML: "markup",
};

export const CodeBlock = ({ code, language, delay = 0 }: CodeBlockProps) => {
  const { theme } = useTheme();
  const prismLang = (language && aliases[language]) || (language?.toLowerCase() ?? "tsx");
  const prismTheme = theme === "light" ? themes.github : themes.vsDark;

  return (
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
      <Highlight code={code.trim()} language={prismLang} theme={prismTheme}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre
            className={`${className} p-4 ${language ? "rounded-b-lg" : "rounded-lg"} overflow-x-auto border border-border text-sm font-mono`}
            style={style}
          >
            {tokens.map((line, i) => (
              <div key={i} {...getLineProps({ line })}>
                {line.map((token, key) => (
                  <span key={key} {...getTokenProps({ token })} />
                ))}
              </div>
            ))}
          </pre>
        )}
      </Highlight>
    </motion.div>
  );
};
