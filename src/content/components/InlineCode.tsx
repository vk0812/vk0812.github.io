import { ReactNode } from "react";

interface InlineCodeProps {
  children: ReactNode;
}

export const InlineCode = ({ children }: InlineCodeProps) => (
  <code className="bg-muted/50 px-1.5 py-0.5 rounded text-sm font-mono text-foreground border border-border">
    {children}
  </code>
);
