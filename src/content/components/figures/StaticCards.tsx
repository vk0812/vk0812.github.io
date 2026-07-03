import { motion } from "framer-motion";
import { Database } from "lucide-react";

/* ----------------------------------------------------------------------------
   ApiEndpointsTable and SchemaCards — lightweight static reference panels for
   posts that need to list REST endpoints or a database schema without
   falling back to plain bullet points. No animation beyond the shared
   "fade up once in view" entrance every other figure on the site uses.
---------------------------------------------------------------------------- */

const METHOD_STYLES: Record<string, string> = {
  GET: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  POST: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  DELETE: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300",
  PUT: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
};

export interface ApiEndpoint {
  method: string;
  path: string;
  description: string;
}

export const ApiEndpointsTable = ({ items, delay = 0 }: { items: ApiEndpoint[]; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 rounded-2xl border border-border bg-muted/20 overflow-hidden"
  >
    {items.map((item, i) => (
      <div
        key={item.method + item.path}
        className={`flex flex-col gap-1.5 px-4 sm:px-6 py-4 ${
          i !== items.length - 1 ? "border-b border-border/50" : ""
        }`}
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          <span
            className={`font-mono text-[11px] font-bold tracking-wide px-2 py-0.5 rounded-md ${
              METHOD_STYLES[item.method] ?? "bg-muted text-muted-foreground"
            }`}
          >
            {item.method}
          </span>
          <span className="font-mono text-sm text-foreground">{item.path}</span>
        </div>
        <p className="font-sans text-sm text-muted-foreground leading-snug">{item.description}</p>
      </div>
    ))}
  </motion.div>
);

export interface SchemaField {
  name: string;
  note?: string;
}

export interface SchemaTableSpec {
  name: string;
  fields: SchemaField[];
}

export const SchemaCards = ({ tables, delay = 0 }: { tables: SchemaTableSpec[]; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, amount: 0.2 }}
    transition={{ duration: 0.4, delay }}
    className="not-prose my-8 grid sm:grid-cols-2 gap-4"
  >
    {tables.map((table) => (
      <div key={table.name} className="rounded-2xl border border-border bg-muted/20 overflow-hidden">
        <div className="flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-border/50 bg-muted/30">
          <Database className="h-4 w-4 text-blue-500" strokeWidth={1.75} />
          <span className="font-sans text-sm font-semibold text-foreground">{table.name}</span>
        </div>
        <div>
          {table.fields.map((field, i) => (
            <div
              key={field.name}
              className={`flex items-baseline justify-between gap-3 px-4 sm:px-5 py-2.5 ${
                i !== table.fields.length - 1 ? "border-b border-border/30" : ""
              }`}
            >
              <span className="font-mono text-sm text-foreground">{field.name}</span>
              {field.note && (
                <span className="font-sans text-xs text-muted-foreground text-right">{field.note}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    ))}
  </motion.div>
);
