import { BlogPostData } from "./types";
import {
  BayesUpdateDiagram,
  CodeBlock,
  Formula,
  Heading,
  InlineCode,
  List,
  ListItem,
  Paragraph,
  ProbabilityDistributionCards,
} from "../components";

const distributions = [
  {
    kind: "bernoulli" as const,
    name: "Bernoulli",
    description: "A single trial with two outcomes, spam or not spam, click or no click.",
    example: "Y ∈ {0, 1}",
  },
  {
    kind: "categorical" as const,
    name: "Categorical",
    description: "One outcome chosen from several classes, such as cat, dog, or bird.",
    example: "Σ pₖ = 1",
  },
  {
    kind: "gaussian" as const,
    name: "Gaussian",
    description: "A continuous value concentrated around a mean with symmetric noise on either side.",
    example: "X ~ N(μ, σ²)",
  },
  {
    kind: "poisson" as const,
    name: "Poisson",
    description: "A count of events in a fixed interval, such as requests hitting a server per second.",
    example: "X ~ Poisson(λ)",
  },
];

export const probabilityForMachineLearning: BlogPostData = {
  title: "Probability for Machine Learning",
  date: "August 2, 2026",
  slug: "probability-for-machine-learning",
  content: (
    <>
      <Paragraph delay={0.10}>
        A spam filter doesn't say "this email is spam." It says something closer to "there's a 91% chance this is spam," and somewhere downstream a threshold turns that number into an actual decision, quarantine or inbox. A vision model doesn't say "this is a cat." It hands back a probability for cat, a smaller one for dog, a smaller one still for fifty other classes, and the loudest number wins. Every one of these systems is built on top of a small, reusable set of ideas for describing what isn't known yet, and updating that description once evidence shows up.
      </Paragraph>

      <Paragraph delay={0.15}>
        That set of ideas is probability. It's less about memorizing formulas and more about learning to ask a precise question ("what exactly is the event, and what am I conditioning on") before touching any algebra. Most of what shows up in machine learning traces back to a handful of moves, worth walking through slowly once so they stop feeling like separate topics.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Random variables and the shapes their uncertainty takes
      </Heading>

      <Paragraph delay={0.25}>
        A random variable is just a number attached to an outcome that isn't known yet. For a spam filter, <Formula>{`Y = 1`}</Formula> might stand for spam and <Formula>{`Y = 0`}</Formula> for not spam. For a weather model, <Formula>{`X`}</Formula> might be tomorrow's rainfall in millimeters. The variable doesn't have to be mysterious, it just has to be something whose value isn't pinned down at the moment a model needs to reason about it.
      </Paragraph>

      <Paragraph delay={0.30}>
        A <strong>probability distribution</strong> is the rule that says how likely each value is. Discrete variables get a probability mass function, one number per possible value, all summing to 1. Continuous variables get a density instead, where a single exact value technically has zero probability and only an interval, area under the curve between two points, has a real probability attached to it.
      </Paragraph>

      <ProbabilityDistributionCards
        delay={0.05}
        items={distributions}
        caption="Four distributions that keep reappearing across machine learning models and the data fed into them."
      />

      <Paragraph delay={0.35}>
        The Bernoulli distribution is the simplest of the four and arguably the most load-bearing, because binary classification is built directly on top of it. One parameter, <Formula>{`p`}</Formula>, the probability of the positive outcome, and one compact expression that covers both labels at once.
      </Paragraph>

      <Formula block delay={0.40}>
        {`P(Y = y) = p^{y}(1 - p)^{1 - y}, \\qquad y \\in \\{0, 1\\}`}
      </Formula>

      <Paragraph delay={0.45}>
        Plug in <Formula>{`y = 1`}</Formula> and everything but <Formula>{`p`}</Formula> disappears. Plug in <Formula>{`y = 0`}</Formula> and it collapses to <Formula>{`1 - p`}</Formula>. One formula, no branching, which is exactly why it survives all the way into the loss function of a trained classifier, more on that shortly.
      </Paragraph>

      <Heading level={2} delay={0.50}>
        Joint, conditional, and independent events
      </Heading>

      <Paragraph delay={0.55}>
        Let <Formula>{`S`}</Formula> mean an email is spam and <Formula>{`F`}</Formula> mean it contains the word <InlineCode>free</InlineCode>. The <strong>joint probability</strong> <Formula>{`P(S, F)`}</Formula> asks how often both things are true at once, across every email that exists. The <strong>conditional probability</strong> <Formula>{`P(F \\mid S)`}</Formula> asks a narrower question, restrict attention to spam only, and ask how often the word shows up inside that smaller group.
      </Paragraph>

      <Formula block delay={0.60}>
        {`P(S, F) = P(F \\mid S)\\,P(S), \\qquad P(F \\mid S) = \\frac{P(S, F)}{P(S)}`}
      </Formula>

      <Paragraph delay={0.65}>
        That vertical bar reads "given." Conditioning changes the population under consideration, which is the entire difference between asking how common a word is across all email and asking how common it is only among the emails already known to be spam. Mixing those two populations up is where a surprising number of probability bugs actually live.
      </Paragraph>

      <Paragraph delay={0.70}>
        Two events are <strong>independent</strong> when learning about one tells you nothing about the other. In that specific case, and only in that case, the joint probability factors cleanly, <Formula>{`P(A, B) = P(A)\\,P(B)`}</Formula>. Real features are rarely this polite. Message length and attachment count move together, so does device type and time of day. Treating dependent features as independent (Naive Bayes does this on purpose, as a simplifying assumption) can still work well in practice, but it's worth knowing exactly which convenience is being bought and at what price.
      </Paragraph>

      <Heading level={2} delay={0.75}>
        Bayes' rule, updating a belief once evidence shows up
      </Heading>

      <Paragraph delay={0.80}>
        Conditional probability leads directly to <strong>Bayes' rule</strong>, which does something genuinely useful, it reverses the direction of a condition. Instead of "how likely is the word <InlineCode>free</InlineCode> given that a message is spam" (easy to estimate from labeled data), it answers "how likely is spam given that the word just showed up" (the thing actually worth knowing at inference time).
      </Paragraph>

      <Formula block delay={0.85}>
        {`P(S \\mid F) = \\frac{P(F \\mid S)\\,P(S)}{P(F)}`}
      </Formula>

      <Paragraph delay={0.90}>
        Suppose 20% of all email is spam, so <Formula>{`P(S) = 0.20`}</Formula>. Among spam, the word <InlineCode>free</InlineCode> shows up 75% of the time, <Formula>{`P(F \\mid S) = 0.75`}</Formula>. Among everything else, it shows up only 10% of the time, <Formula>{`P(F \\mid \\neg S) = 0.10`}</Formula>. The word can arrive through either route, spam or not spam, so its overall probability is the weighted sum of both.
      </Paragraph>

      <Formula block delay={0.95}>
        {`P(F) = (0.75)(0.20) + (0.10)(0.80) = 0.23`}
      </Formula>

      <Paragraph delay={1.00}>
        The spam route alone contributes <Formula>{`0.75 \\times 0.20 = 0.15`}</Formula> of that total. Dividing the spam route by everything that could have produced the word gives the actual answer.
      </Paragraph>

      <Formula block delay={1.05}>
        {`P(S \\mid F) = \\frac{0.15}{0.23} \\approx 0.652`}
      </Formula>

      <BayesUpdateDiagram
        delay={0.06}
        caption="Evidence shifts the spam belief from a 20% prior to a 65.2% posterior once the word free is observed."
      />

      <Paragraph delay={1.10}>
        Every term in that computation has a name worth keeping straight. The <strong>prior</strong>, <Formula>{`P(S)`}</Formula>, is the belief before any evidence arrives. The <strong>likelihood</strong>, <Formula>{`P(F \\mid S)`}</Formula>, describes how compatible the evidence is with each hypothesis. The <strong>posterior</strong>, <Formula>{`P(S \\mid F)`}</Formula>, is the updated belief afterward. Bayes' rule doesn't claim the word proves anything, it moves the belief from 20% to about 65%, given these specific assumptions, and a different prior or a different word would move it somewhere else entirely.
      </Paragraph>

      <CodeBlock
        delay={1.15}
        language="Python"
        code={`def bayes_update(prior, p_evidence_if_true, p_evidence_if_false):
    true_path = prior * p_evidence_if_true
    false_path = (1 - prior) * p_evidence_if_false
    evidence = true_path + false_path
    return true_path / evidence

posterior = bayes_update(
    prior=0.20,
    p_evidence_if_true=0.75,
    p_evidence_if_false=0.10,
)

print(round(posterior, 3))  # 0.652`}
      />

      <Heading level={2} delay={1.20}>
        Expectation, variance, and covariance
      </Heading>

      <Paragraph delay={1.25}>
        The <strong>expectation</strong> of a random variable is its probability-weighted average, every possible value multiplied by how likely it is, added up.
      </Paragraph>

      <Formula block delay={1.30}>
        {`\\mathbb{E}[X] = \\sum_x x\\,P(X = x)`}
      </Formula>

      <Paragraph delay={1.35}>
        Training almost never minimizes the error on one lucky example, it minimizes an <strong>expected loss</strong> averaged across the whole data distribution. Expectation is also what turns a raw probability into an actual business decision. Take a fraud model that flags a transaction with probability 0.3. Missing real fraud (a false negative) might cost 500 dollars in losses and disputes. Flagging a legitimate transaction for review (a false positive) costs maybe 5 dollars in support time. The expected cost of approving the transaction outright is <Formula>{`0.3 \\times 500 = 150`}</Formula> dollars, while the expected cost of flagging it is <Formula>{`0.7 \\times 5 = 3.50`}</Formula> dollars. Flagging wins by a wide margin, not because 0.3 sounds high, but because expectation multiplied that probability by how much a miss actually costs.
      </Paragraph>

      <Paragraph delay={1.40}>
        Variance measures how far values tend to spread around that expectation. A model whose predictions cluster tightly is behaving consistently. One whose predictions swing wildly from input to input is carrying real uncertainty that a single point estimate hides.
      </Paragraph>

      <Formula block delay={1.45}>
        {`\\operatorname{Var}(X) = \\mathbb{E}\\left[(X - \\mathbb{E}[X])^2\\right]`}
      </Formula>

      <Paragraph delay={1.50}>
        Covariance extends the same idea to a pair of variables, asking whether they tend to move together. Take five emails with a message length in characters and a number of attachments, <Formula>{`[120, 340, 80, 500, 60]`}</Formula> and <Formula>{`[0, 2, 0, 3, 0]`}</Formula>. Longer messages here also tend to carry more attachments, and the covariance comes out positive, confirming that link numerically rather than just by eyeballing the two lists.
      </Paragraph>

      <Formula block delay={1.55}>
        {`\\operatorname{Cov}(X, Y) = \\mathbb{E}\\left[(X - \\mathbb{E}[X])(Y - \\mathbb{E}[Y])\\right]`}
      </Formula>

      <Paragraph delay={1.60}>
        A positive covariance means the variables tend to rise together, a negative one means one tends to fall as the other rises, and zero means no linear relationship was detected in the data. Zero covariance is not the same guarantee as independence though, a variable and its own square have zero covariance despite being as dependent as two numbers can be, so a nonlinear relationship can still be hiding in a covariance of zero.
      </Paragraph>

      <Heading level={2} delay={1.65}>
        Likelihood, and why training a model is a probability question turned backward
      </Heading>

      <Paragraph delay={1.70}>
        Probability and likelihood share the same formula but ask opposite questions. Probability fixes the model's parameters and asks how likely different data outcomes are. <strong>Likelihood</strong> fixes the data that was actually observed and asks which parameter values make that specific data most plausible. Training a model is almost always the second question, hunting through parameter space for the values that make the training labels look as expected as possible.
      </Paragraph>

      <Paragraph delay={1.75}>
        Say a coin is flipped ten times and lands on seven heads, three tails. Modeling it as Bernoulli with unknown head probability <Formula>{`p`}</Formula>, the likelihood of that exact sequence of outcomes is
      </Paragraph>

      <Formula block delay={1.80}>
        {`L(p) = p^{7}(1 - p)^{3}`}
      </Formula>

      <Paragraph delay={1.85}>
        Multiplying many small probabilities together underflows toward zero fast on real hardware, so almost nobody works with <Formula>{`L(p)`}</Formula> directly. The <strong>log-likelihood</strong> turns that product into a sum, and because the logarithm only ever increases, whichever <Formula>{`p`}</Formula> maximizes the likelihood also maximizes the log-likelihood.
      </Paragraph>

      <Formula block delay={1.90}>
        {`\\log L(p) = 7 \\log p + 3 \\log(1 - p)`}
      </Formula>

      <Paragraph delay={1.95}>
        Setting the derivative to zero and solving lands on the obvious answer, <Formula>{`p = 0.7`}</Formula>, the observed proportion of heads. That's not a coincidence specific to coins, it's the general shape of maximum likelihood estimation, and the same mechanism scales up to a classifier with millions of parameters instead of one.
      </Paragraph>

      <Paragraph delay={2.00}>
        Because optimizers are usually written to minimize rather than maximize, training flips the sign and works with the <strong>negative</strong> log-likelihood instead. For a binary classifier, that negative log-likelihood has a more familiar name, <strong>binary cross-entropy</strong>. Take four labeled emails and the probabilities a model assigned to "spam."
      </Paragraph>

      <Formula block delay={2.05}>
        {`\\text{labels} = [1, 0, 1, 1], \\qquad \\hat p = [0.90,\\ 0.20,\\ 0.65,\\ 0.80]`}
      </Formula>

      <Paragraph delay={2.10}>
        The model was confident and right on the first email, confident and right on the second (0.20 is a good score for a true negative), reasonably right but less confident on the third, and solidly right on the fourth. Running each prediction through the negative log-likelihood and averaging gives a single number summarizing all four at once.
      </Paragraph>

      <CodeBlock
        delay={2.15}
        language="Python"
        code={`import numpy as np

def bernoulli_negative_log_likelihood(labels, probabilities):
    probabilities = np.clip(probabilities, 1e-7, 1 - 1e-7)
    per_example = (
        labels * np.log(probabilities)
        + (1 - labels) * np.log1p(-probabilities)
    )
    return -per_example.mean()

labels = np.array([1, 0, 1, 1])
predictions = np.array([0.90, 0.20, 0.65, 0.80])
print(bernoulli_negative_log_likelihood(labels, predictions))  # 0.2456`}
      />

      <Paragraph delay={2.20}>
        That 0.2456 is the cross-entropy loss, the exact quantity a binary classifier's training loop is minimizing every step. Each per-example term in the code above is one instance of the Bernoulli formula from the very first section, plugged into a logarithm. The whole chain, distribution to likelihood to negative log-likelihood to loss function, is one continuous idea wearing four different names depending on which stage of the pipeline it's showing up in.
      </Paragraph>

      <Heading level={2} delay={2.25}>
        Takeaways
      </Heading>

      <List delay={2.30}>
        <ListItem>Random variables turn uncertain outcomes into numbers, and distributions describe exactly how probability gets assigned across them.</ListItem>
        <ListItem>Joint and conditional probability connect features, labels, and evidence, and independence is a strong, checkable assumption rather than a free default.</ListItem>
        <ListItem>Bayes' rule reverses a condition, turning a prior belief into a posterior once evidence is observed, without ever claiming certainty.</ListItem>
        <ListItem>Expectation drives cost-sensitive decisions, and variance plus covariance describe how much to trust a single prediction and whether two variables move together.</ListItem>
        <ListItem>Maximum likelihood picks parameters that make observed data most plausible, and its negative log-likelihood is exactly the cross-entropy loss most classifiers train against.</ListItem>
      </List>

      <Paragraph delay={2.35}>
        None of this requires memorizing a shelf of named distributions. Most of it comes back to naming the event carefully, tracking what's being conditioned on, and remembering that a training loss is a likelihood question wearing a minimization sign. Thanks for reading.
      </Paragraph>
    </>
  ),
};
