import { BlogPostData } from "./types";
import { Percent, Users } from "lucide-react";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  StatTiles,
  StatItem,
  SamplingDistributionNarrowing,
} from "../components";

const abTestStats: StatItem[] = [
  { label: "Model A accuracy", value: 82, suffix: "%", icon: Percent, color: "text-muted-foreground" },
  { label: "Model B accuracy", value: 85, suffix: "%", icon: Percent, color: "text-blue-500" },
  { label: "Test examples per model", value: 500, icon: Users, color: "text-purple-500" },
];

export const statisticsEstimationUncertainty: BlogPostData = {
  title: "Statistics, Estimation, and Uncertainty",
  date: "August 1, 2026",
  slug: "statistics-estimation-uncertainty",
  content: (
    <>
      <Paragraph delay={0.10}>
        A new model scores 85% accuracy on a 500-example test set, up from 82% for the model it's replacing. Ship it? Before answering, it helps to ask a less exciting question first. Those two numbers came from one particular batch of 500 examples. Swap in a different 500 and both numbers would move a little. The real question is not "which number is bigger" but "how much of that three-point gap is signal, and how much is just which examples happened to land in the test set."
      </Paragraph>

      <Paragraph delay={0.15}>
        That's the job of statistics. Probability describes uncertainty when the underlying process is known. Statistics runs the other direction, using a limited sample of data to say something honest about a process that can't be observed directly. Every accuracy number, every reported latency average, every "our new ranking model wins" claim is really an estimate, and estimates come with error bars whether or not anyone writes them down.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        A sample is not the population
      </Heading>

      <Paragraph delay={0.25}>
        The <strong>population</strong> is every example that could ever occur, every user who could ever visit, every request the model will ever see. It's usually infinite or at least far too large to measure directly. A <strong>sample</strong> is the finite slice actually collected, a batch of labeled examples, a week of production traffic, ten thousand logged requests. A model's true accuracy on the population is a fixed but unknown number called a <strong>parameter</strong>. The accuracy computed on a sample is a <strong>statistic</strong>, a number derived from data that gets used to guess at the parameter.
      </Paragraph>

      <Paragraph delay={0.30}>
        Because a sample only ever covers part of the population, the statistic almost never exactly equals the parameter. That gap is <strong>sampling error</strong>, and it's not a mistake anyone made, it's a direct consequence of not having measured everything. Two different samples of the same size, drawn the same way, will produce two different statistics purely by chance. This is exactly why a single test-set score is a noisy read on a model's real-world performance, not a certificate of it.
      </Paragraph>

      <SamplingDistributionNarrowing
        delay={0.35}
        caption="The distribution of a sample statistic across repeated samples, shown for n = 10, 50, and 200. More data concentrates the estimate around the true parameter instead of eliminating the noise entirely."
      />

      <Paragraph delay={0.40}>
        That figure is the answer to "how much data do I need before I trust this estimate." More data doesn't remove sampling error, it shrinks it, typically at a rate proportional to <Formula>{`1/\\sqrt{n}`}</Formula>. Going from 100 to 400 examples cuts the noise in half. Going from 100 to 200 barely helps. That square root is the reason doubling a test set feels underwhelming and quadrupling it is where the real improvement shows up.
      </Paragraph>

      <Heading level={2} delay={0.45}>
        What makes an estimator good
      </Heading>

      <Paragraph delay={0.50}>
        An <strong>estimator</strong> is just a rule for turning a sample into a guess about a parameter, the sample mean estimating a population mean, the fraction of correct predictions estimating a model's true accuracy. Not every rule is equally trustworthy, and three properties separate the good ones from the bad ones.
      </Paragraph>

      <List delay={0.55}>
        <ListItem><strong>Unbiasedness.</strong> Averaged across every possible sample, the estimator lands on the true parameter. It might miss on any one sample, but it doesn't miss in a consistent direction.</ListItem>
        <ListItem><strong>Consistency.</strong> As the sample size grows, the estimator gets arbitrarily close to the true parameter with high probability. This is exactly the narrowing shown above, more data, tighter estimate.</ListItem>
        <ListItem><strong>Efficiency.</strong> Among the unbiased estimators available, an efficient one has the smallest variance. Given two ways to estimate the same thing, the one that swings around less from sample to sample is the better one to use.</ListItem>
      </List>

      <Heading level={2} delay={0.60}>
        Bias and variance, but of the estimator itself
      </Heading>

      <Paragraph delay={0.65}>
        This is a different idea from the bias-variance tradeoff in model fitting (underfitting versus overfitting), even though the words are identical. Here, bias and variance describe how an estimator behaves as a statistical procedure, not how a trained model generalizes.
      </Paragraph>

      <Paragraph delay={0.70}>
        <strong>Bias</strong> is the gap between the expected value of the estimator and the true parameter, averaged over all possible samples. An estimator that's biased will systematically over- or under-shoot no matter how much data arrives. <strong>Variance</strong> here is how much the estimator's value swings from one sample to the next. An estimator can be unbiased on average yet still be wildly noisy on any single sample, and a slightly biased estimator with much lower variance can beat an unbiased but jittery one in practice.
      </Paragraph>

      <Paragraph delay={0.75}>
        A concrete example of this shows up inside a single formula, the maximum-likelihood estimate of a variance.
      </Paragraph>

      <Heading level={2} delay={0.80}>
        Maximum-likelihood estimation, worked through
      </Heading>

      <Paragraph delay={0.85}>
        <strong>Maximum-likelihood estimation</strong> (MLE) picks the parameter value that makes the observed data most plausible. Suppose a model's predictions are checked against 200 held-out labels and 134 come back correct. Modeling each check as a Bernoulli trial with unknown success probability <Formula>{`p`}</Formula>, the likelihood of seeing exactly <Formula>{`k`}</Formula> correct out of <Formula>{`n`}</Formula> trials is
      </Paragraph>

      <Formula block delay={0.90}>
        {`L(p) = p^{k}(1-p)^{n-k}`}
      </Formula>

      <Paragraph delay={0.95}>
        Taking the log turns the product into a sum and doesn't change which <Formula>{`p`}</Formula> maximizes it, since <InlineCode>log</InlineCode> is strictly increasing.
      </Paragraph>

      <Formula block delay={1.00}>
        {`\\log L(p) = k\\log p + (n-k)\\log(1-p)`}
      </Formula>

      <Paragraph delay={1.05}>
        Setting the derivative with respect to <Formula>{`p`}</Formula> to zero and solving gives a satisfyingly simple answer, the maximum-likelihood estimate is just the observed proportion.
      </Paragraph>

      <Formula block delay={1.10}>
        {`\\frac{d}{dp}\\log L(p) = \\frac{k}{p} - \\frac{n-k}{1-p} = 0 \\implies \\hat p = \\frac{k}{n}`}
      </Formula>

      <Paragraph delay={1.15}>
        With <Formula>{`k=134`}</Formula> and <Formula>{`n=200`}</Formula>, that's <Formula>{`\\hat p = 0.67`}</Formula>. Nothing exotic happened, but the derivation is the general recipe used everywhere in machine learning. Binary cross-entropy loss is the negative log-likelihood of exactly this Bernoulli model, so training a classifier by minimizing cross-entropy is doing maximum-likelihood estimation one gradient step at a time.
      </Paragraph>

      <CodeBlock
        delay={1.20}
        language="Python"
        code={`import numpy as np

results = np.array([1] * 134 + [0] * 66)  # 134 correct out of 200
p_hat = results.mean()
print(p_hat)  # 0.67`}
      />

      <Paragraph delay={1.25}>
        The same idea works for a continuous parameter. Given five latency measurements in milliseconds, <Formula>{`10, 12, 9, 11, 13`}</Formula>, modeled as draws from a Gaussian, the maximum-likelihood estimates of the mean and variance are the sample mean and the average squared deviation from it.
      </Paragraph>

      <CodeBlock
        delay={1.30}
        language="Python"
        code={`import numpy as np

latencies = np.array([10, 12, 9, 11, 13])
mean = latencies.mean()
mle_var = ((latencies - mean) ** 2).mean()                    # divide by n
unbiased_var = ((latencies - mean) ** 2).sum() / (len(latencies) - 1)  # divide by n - 1

print(mean, mle_var, unbiased_var)  # 11.0  2.0  2.5`}
      />

      <Paragraph delay={1.35}>
        That gap between <Formula>{`2.0`}</Formula> and <Formula>{`2.5`}</Formula> is not a rounding artifact. Dividing by <Formula>{`n`}</Formula> instead of <Formula>{`n-1`}</Formula> makes the maximum-likelihood variance <strong>biased downward</strong>, it systematically underestimates spread because the sample mean it's built from was itself fit to that same data, using up one degree of freedom. Dividing by <Formula>{`n-1`}</Formula> corrects the bias, which is exactly why every standard library's variance function defaults to it. This is the estimator bias-versus-variance idea from a couple of sections up, made concrete in a single line of arithmetic.
      </Paragraph>

      <Heading level={2} delay={1.40}>
        Confidence intervals, and the interpretation people get wrong
      </Heading>

      <Paragraph delay={1.45}>
        A single number like "average inference latency is 42.3 milliseconds" hides how much that number could have wobbled. A <strong>confidence interval</strong> reports a range instead. For a sample mean with standard error <Formula>{`SE`}</Formula>, the standard 95% interval is
      </Paragraph>

      <Formula block delay={1.50}>
        {`\\hat\\theta \\pm 1.96 \\cdot SE(\\hat\\theta), \\qquad SE(\\hat\\theta) = \\frac{\\sigma}{\\sqrt{n}}`}
      </Formula>

      <Paragraph delay={1.55}>
        Suppose 100 requests are timed, giving a mean of 42.3 milliseconds and a standard deviation of 8.1 milliseconds. The standard error is <Formula>{`8.1/\\sqrt{100}=0.81`}</Formula>, so the 95% interval is
      </Paragraph>

      <Formula block delay={1.60}>
        {`42.3 \\pm 1.96(0.81) = (40.71,\\ 43.89)`}
      </Formula>

      <Paragraph delay={1.65}>
        Here's the part that gets misquoted constantly. A 95% confidence interval does not mean there's a 95% probability the true latency falls inside <Formula>{`(40.71, 43.89)`}</Formula>. Once the interval is computed from one sample, the true value either is or isn't in there, there's no probability left to talk about for that specific interval. What "95%" actually refers to is the procedure. If this same sampling-and-interval-building process were repeated many times, 95% of the resulting intervals would contain the true parameter. It's a statement about the method's long-run reliability, not a probability statement about one fixed interval.
      </Paragraph>

      <Heading level={2} delay={1.70}>
        Bootstrapping, when there's no clean formula
      </Heading>

      <Paragraph delay={1.75}>
        The confidence interval above leaned on a known formula for the standard error of a mean. Plenty of statistics used in practice, a median, a 95th-percentile latency, the difference between two correlation coefficients, don't have a tidy closed-form standard error. <strong>Bootstrapping</strong> sidesteps the formula entirely. It resamples the observed data with replacement, over and over, recomputing the statistic each time, and treats the spread of those recomputed values as a stand-in for the true sampling distribution.
      </Paragraph>

      <CodeBlock
        delay={1.80}
        language="Python"
        code={`import numpy as np

rng = np.random.default_rng(0)
latencies = np.array([10, 12, 9, 11, 13, 14, 8, 12, 11, 10])

boot_means = np.array([
    rng.choice(latencies, size=len(latencies), replace=True).mean()
    for _ in range(2000)
])

ci_low, ci_high = np.percentile(boot_means, [2.5, 97.5])
print(latencies.mean(), ci_low, ci_high)  # 11.0  roughly 9.9  roughly 12.1`}
      />

      <Paragraph delay={1.85}>
        Each resample draws ten values from the original ten, with repeats allowed, so some measurements show up twice and others get skipped entirely in any given draw. Doing that two thousand times and looking at where the middle 95% of the resulting means fall gives an interval without ever writing down a standard error formula. The same trick works for medians, ratios, or any statistic that resists a clean derivation, which is why it shows up constantly in evaluating models where the metric of interest isn't a plain average.
      </Paragraph>

      <Heading level={2} delay={1.90}>
        Hypothesis testing, and what a p-value is not
      </Heading>

      <Paragraph delay={1.95}>
        Back to the opening question. Model B scored 85% and Model A scored 82%, both on 500 examples. <strong>Hypothesis testing</strong> starts from a skeptical default, the <strong>null hypothesis</strong>, that there is no real difference and the two models have identical true accuracy. The observed three-point gap is then checked against how much gap the null hypothesis alone could produce by chance.
      </Paragraph>

      <StatTiles items={abTestStats} delay={0.06} />

      <Paragraph delay={2.00}>
        Treating each model's correctness as a proportion and pooling the two samples under the null hypothesis gives a standard error for the gap of about <Formula>{`0.023`}</Formula>, which turns the observed <Formula>{`0.03`}</Formula> difference into a z-score of roughly <Formula>{`1.28`}</Formula>. That corresponds to a <strong>p-value</strong> of about <Formula>{`0.20`}</Formula>.
      </Paragraph>

      <Paragraph delay={2.05}>
        A p-value of <Formula>{`0.20`}</Formula> means this. If the two models really were identical, a gap this large or larger would show up about 20% of the time purely from which 500 examples happened to be sampled. That's not a rare event, so this test set doesn't provide strong evidence that Model B is actually better. The three-point gap could easily be noise.
      </Paragraph>

      <Paragraph delay={2.10}>
        What a p-value is emphatically not. It is not the probability that the null hypothesis is true. It is not the probability that the result happened "by chance" in some general sense. It is not a measure of how large or practically important the effect is, a tiny, meaningless difference can still produce a small p-value if the sample is large enough. It's one specific conditional probability, how surprising the observed data would be if the null hypothesis were exactly true, nothing more.
      </Paragraph>

      <Heading level={2} delay={2.15}>
        The multiple-comparisons trap
      </Heading>

      <Paragraph delay={2.20}>
        Suppose that instead of checking one metric, twenty different metrics get checked after an experiment, click-through rate, latency, retention, revenue per user, and sixteen others, each tested at the usual 5% significance threshold. Even if the experiment changed absolutely nothing, the probability that at least one of those twenty tests comes back "significant" purely by chance is
      </Paragraph>

      <Formula block delay={2.25}>
        {`1-(1-0.05)^{20} \\approx 0.64`}
      </Formula>

      <Paragraph delay={2.30}>
        Not a small chance of a false alarm, a coin flip. Run enough tests and something will look significant, that's practically guaranteed rather than a lucky find. One common fix is the <strong>Bonferroni correction</strong>, dividing the significance threshold by the number of tests, so twenty tests each get checked against <Formula>{`0.05/20=0.0025`}</Formula> instead of <Formula>{`0.05`}</Formula>. It's a conservative fix, it makes every individual test harder to pass, but it keeps the overall false-positive rate for the whole batch back down near the intended 5%.
      </Paragraph>

      <Heading level={2} delay={2.35}>
        Takeaways
      </Heading>

      <List delay={2.40}>
        <ListItem>A sample statistic is not the population parameter, and the gap between them (sampling error) shrinks with more data at a rate of roughly <Formula>{`1/\\sqrt{n}`}</Formula>, it never disappears entirely.</ListItem>
        <ListItem>A good estimator is unbiased, consistent, and efficient, and an estimator's own bias and variance are properties of the procedure, separate from the bias-variance tradeoff of a fitted model.</ListItem>
        <ListItem>Maximum-likelihood estimation picks the parameter that makes observed data most plausible, and the log-likelihood turns that into ordinary calculus.</ListItem>
        <ListItem>A 95% confidence interval is a statement about the reliability of the procedure across repeated samples, not a 95% probability that one particular interval contains the truth.</ListItem>
        <ListItem>Checking many metrics or running many tests inflates the chance of a false positive fast, correct for it (Bonferroni or similar) instead of trusting whichever metric happened to move.</ListItem>
      </List>

      <Paragraph delay={2.45}>
        None of this replaces judgment about what actually matters to users. It just keeps a model comparison, an experiment result, or a benchmark number honest about how much of it is signal and how much is the particular sample that happened to get measured. Thanks for reading.
      </Paragraph>
    </>
  ),
};
