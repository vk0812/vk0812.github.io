import { motion } from "framer-motion";

/* ----------------------------------------------------------------------------
   NaiveBayesWordCards — a static card row showing each candidate word's
   per-class likelihood (with Laplace smoothing already applied), feeding
   into a final posterior comparison bar. Built for the tiny worked
   spam-classification example, but generic enough for any small multinomial
   or Bernoulli Naive Bayes walkthrough. No GSAP, just the shared
   "fade up once in view" entrance every static figure on the site uses.
---------------------------------------------------------------------------- */

export interface NaiveBayesWordSpec {
  word: string;
  likelihoodA: number;
  likelihoodB: number;
}

export interface NaiveBayesPosterior {
  labelA: string;
  labelB: string;
  posteriorA: number;
  posteriorB: number;
}

export const NaiveBayesWordCards = ({
  words,
  posterior,
  caption,
  delay = 0,
}: {
  words: NaiveBayesWordSpec[];
  posterior: NaiveBayesPosterior;
  caption: string;
  delay?: number;
}) => {
  const pctA = Math.round(posterior.posteriorA * 100);
  const pctB = 100 - pctA;

  return (
    <motion.figure
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.4, delay }}
      className="not-prose my-8"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        {words.map((w, index) => (
          <motion.div
            key={w.word}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.35, delay: index * 0.08 }}
            className="rounded-2xl border border-border bg-muted/20 p-4 sm:p-5"
          >
            <p className="font-mono text-sm font-semibold text-foreground">{w.word}</p>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-sans text-xs text-muted-foreground">{posterior.labelA}</span>
                <span className="font-mono text-xs text-foreground/80">{w.likelihoodA.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between gap-2">
                <span className="font-sans text-xs text-muted-foreground">{posterior.labelB}</span>
                <span className="font-mono text-xs text-foreground/80">{w.likelihoodB.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-border bg-muted/20 p-4 sm:p-5">
        <p className="font-sans text-xs text-muted-foreground mb-2">Posterior after multiplying likelihoods and priors</p>
        <div className="flex h-6 w-full overflow-hidden rounded-full border border-border/60">
          <div className="bg-blue-500/70 dark:bg-blue-400/70 flex items-center justify-center font-mono text-[11px] text-white" style={{ width: `${pctA}%` }}>
            {pctA >= 12 ? `${pctA}%` : ""}
          </div>
          <div className="bg-muted flex items-center justify-center font-mono text-[11px] text-muted-foreground" style={{ width: `${pctB}%` }}>
            {pctB >= 12 ? `${pctB}%` : ""}
          </div>
        </div>
        <div className="mt-2 flex justify-between font-sans text-xs text-muted-foreground">
          <span>{posterior.labelA}, {pctA}%</span>
          <span>{posterior.labelB}, {pctB}%</span>
        </div>
      </div>

      <figcaption className="mt-3 text-center font-serif text-sm italic text-muted-foreground">
        {caption}
      </figcaption>
    </motion.figure>
  );
};
