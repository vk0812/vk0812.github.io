import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  EntropyDistributionCards,
  EntropyDistributionSpec,
} from "../components";

const labelDistributions: EntropyDistributionSpec[] = [
  {
    name: "Skewed",
    probs: [0.7, 0.1, 0.1, 0.1],
    entropyBits: 1.357,
    note: "One class dominates. Some uncertainty is left, but not much.",
  },
  {
    name: "Uniform",
    probs: [0.25, 0.25, 0.25, 0.25],
    entropyBits: 2.0,
    note: "No class is favored. This is the maximum possible entropy for four outcomes.",
  },
  {
    name: "Near-deterministic",
    probs: [0.97, 0.01, 0.01, 0.01],
    entropyBits: 0.242,
    note: "Almost no surprise left. The outcome is nearly certain before it happens.",
  },
];

export const informationTheoryForMl: BlogPostData = {
  title: "Information Theory for ML",
  date: "August 1, 2026",
  slug: "information-theory-for-ml",
  content: (
    <>
      <Paragraph delay={0.10}>
        A classifier's training loss ticks down from 1.9 to 0.4 over a few epochs. Somewhere inside that graph, the phrase <InlineCode>cross-entropy loss</InlineCode> is doing the actual work. A language model release announces a perplexity of 12 on some benchmark and calls it state of the art. Neither number means much on its own. Both are dressed-up versions of the same handful of ideas from information theory, a field built to answer one question: how much uncertainty is actually in this thing, and how many bits does it take to describe it.
      </Paragraph>

      <Paragraph delay={0.15}>
        Anyone who has already spent time with probability distributions, expectation, and log-likelihood has most of the prerequisite in hand. Information theory asks a slightly different question of that same machinery. Not which parameter best fits the data, but how surprised should a model be, and how much of that surprise could have been avoided.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Entropy measures how surprised you should be
      </Heading>

      <Paragraph delay={0.25}>
        Every outcome carries a "surprise" value tied to how likely it was. An outcome with probability 1 carries zero surprise, it was certain to happen. An outcome with probability 0.5 carries exactly one bit of surprise. This per-outcome quantity is called self-information.
      </Paragraph>

      <Formula block delay={0.30}>
        {`I(x) = -\\log_2 p(x)`}
      </Formula>

      <Paragraph delay={0.35}>
        <strong>Entropy</strong> is the expected surprise, averaged over every outcome and weighted by how often it actually occurs. It's usually written <Formula>{`H(P)`}</Formula>, in bits when the log is base 2.
      </Paragraph>

      <Formula block delay={0.40}>
        {`H(P) = -\\sum_i p_i \\log_2 p_i`}
      </Formula>

      <Paragraph delay={0.45}>
        Take a biased coin that lands heads 70% of the time. Its entropy comes out to roughly <Formula>{`0.881`}</Formula> bits, a little less than a fair coin's exact <Formula>{`1`}</Formula> bit. That gap is the whole story of entropy in miniature. A fair coin gives no hint which way it will land, so guessing it takes the full bit. A biased coin already leans toward heads, so there's less left to be surprised about, and less needed to describe the outcome on average.
      </Paragraph>

      <Paragraph delay={0.50}>
        The same idea holds for a model choosing between more than two classes. Consider a four-class label distribution, skewed toward one class, spread uniformly across all four, or nearly certain on a single class.
      </Paragraph>

      <EntropyDistributionCards
        delay={0.06}
        items={labelDistributions}
        caption="Figure 1: Entropy of three four-class distributions. Uniform hits the maximum of 2 bits, and probability mass concentrating on one class drives entropy toward zero."
      />

      <Paragraph delay={0.55}>
        Entropy is maximized exactly when every outcome is equally likely, <Formula>{`\\log_2 4 = 2`}</Formula> bits for four classes, and it falls toward zero as one outcome swallows nearly all the probability mass. A classifier that outputs <Formula>{`[0.97, 0.01, 0.01, 0.01]`}</Formula> is telling you it's nearly sure of the answer. A classifier that outputs <Formula>{`[0.25, 0.25, 0.25, 0.25]`}</Formula> is telling you it has no idea, and entropy is the single number that captures exactly that difference.
      </Paragraph>

      <Heading level={2} delay={0.60}>
        Cross-entropy is the loss classifiers actually minimize
      </Heading>

      <Paragraph delay={0.65}>
        Entropy describes the uncertainty in a distribution measured against itself. <strong>Cross-entropy</strong> measures something more useful for training, the average surprise when the true distribution is <Formula>{`P`}</Formula> but a model's predictions come from a different distribution <Formula>{`Q`}</Formula>.
      </Paragraph>

      <Formula block delay={0.70}>
        {`H(P, Q) = -\\sum_i p_i \\log_2 q_i`}
      </Formula>

      <Paragraph delay={0.75}>
        In classification, the true label is usually one-hot, all probability mass on the correct class and none anywhere else. Plug that into the formula and every term except the correct class vanishes, since it's multiplied by a probability of zero. What's left is just the negative log of the probability the model assigned to the right answer. That's exactly the negative log-likelihood a maximum-likelihood argument produces when a categorical or Bernoulli model is fit to observed labels, one probability per example, summed and negated. Minimizing cross-entropy loss and maximizing the likelihood of the correct labels are the same optimization wearing different clothes.
      </Paragraph>

      <Paragraph delay={0.80}>
        This is also why two models can share the same accuracy and still report very different cross-entropy. Accuracy only checks whether the highest-probability class matches the label. Cross-entropy cares how confidently the model was right or wrong. A model that assigns 0.99 to the correct class scores far better on cross-entropy than one that assigns 0.51, even though both count as a correct prediction under plain accuracy.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        Conditional entropy, the uncertainty that survives after you look
      </Heading>

      <Paragraph delay={0.90}>
        Entropy answers "how uncertain is Y." <strong>Conditional entropy</strong> answers a narrower question, how uncertain is Y once X has already been observed.
      </Paragraph>

      <Formula block delay={0.95}>
        {`H(Y \\mid X) = \\sum_x P(x) \\, H(Y \\mid X=x)`}
      </Formula>

      <Paragraph delay={1.00}>
        Suppose <Formula>{`Y`}</Formula> is whether an email is spam and <Formula>{`X`}</Formula> is whether it contains the word <InlineCode>free</InlineCode>. Twenty percent of email is spam overall, giving <Formula>{`H(Y) \\approx 0.722`}</Formula> bits. But among emails containing the word, 75% turn out to be spam, while among emails without it, only about 6% do. Averaging the entropy of each of those two narrower groups, weighted by how often each group occurs, gives <Formula>{`H(Y \\mid X) \\approx 0.432`}</Formula> bits.
      </Paragraph>

      <Paragraph delay={1.05}>
        Conditioning on the word cut the remaining uncertainty about spam nearly in half. That's the entire point of conditional entropy, it's a direct measure of how much a feature actually helps, expressed in the same bits that entropy already uses.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        KL divergence, the gap between what's true and what a model believes
      </Heading>

      <Paragraph delay={1.15}>
        Cross-entropy already hints at a gap, the extra bits spent because a model's beliefs <Formula>{`Q`}</Formula> don't match the true distribution <Formula>{`P`}</Formula>. The <strong>Kullback-Leibler divergence</strong> isolates exactly that gap.
      </Paragraph>

      <Formula block delay={1.20}>
        {`D_{KL}(P \\parallel Q) = \\sum_i p_i \\log_2 \\frac{p_i}{q_i} = H(P, Q) - H(P)`}
      </Formula>

      <Paragraph delay={1.25}>
        Cross-entropy equals the true entropy plus this divergence. Since <Formula>{`H(P)`}</Formula> doesn't depend on the model at all, minimizing cross-entropy during training and minimizing KL divergence to the true distribution point the optimizer in the exact same direction.
      </Paragraph>

      <Paragraph delay={1.30}>
        KL divergence is not symmetric, and that asymmetry is not a technicality. It changes what the number means. Take a true label distribution <Formula>{`P = [0.6, 0.3, 0.1]`}</Formula> and a badly calibrated model prediction <Formula>{`Q = [0.3, 0.3, 0.4]`}</Formula>.
      </Paragraph>

      <CodeBlock
        delay={1.35}
        language="Python"
        code={`import numpy as np

P = np.array([0.6, 0.3, 0.1])
Q = np.array([0.3, 0.3, 0.4])

def entropy(p):
    return -np.sum(p * np.log2(p))

def cross_entropy(p, q):
    return -np.sum(p * np.log2(q))

def kl_divergence(p, q):
    return np.sum(p * np.log2(p / q))

print(entropy(P))              # 1.295
print(cross_entropy(P, Q))     # 1.695
print(kl_divergence(P, Q))     # 0.400
print(kl_divergence(Q, P))     # 0.500`}
      />

      <Paragraph delay={1.40}>
        <Formula>{`D_{KL}(P \\parallel Q) = 0.4`}</Formula> bits, but flipping the arguments gives <Formula>{`D_{KL}(Q \\parallel P) = 0.5`}</Formula> bits, a different number for a reason that matters. <Formula>{`D_{KL}(P \\parallel Q)`}</Formula> is weighted by how often outcomes actually happen under the true distribution <Formula>{`P`}</Formula>, so it punishes the model hardest for being confidently wrong on events that occur often. Swap the order and the penalty gets weighted by the model's own beliefs instead, a completely different question. Training a classifier almost always uses the first direction, because the training data defines what actually happens, not what the model currently believes.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Mutual information, how much one variable tells you about another
      </Heading>

      <Paragraph delay={1.50}>
        Conditional entropy and mutual information describe the same fact from opposite sides. <strong>Mutual information</strong> is how much observing <Formula>{`X`}</Formula> reduces the uncertainty in <Formula>{`Y`}</Formula>.
      </Paragraph>

      <Formula block delay={1.55}>
        {`I(X;Y) = H(Y) - H(Y \\mid X)`}
      </Formula>

      <Paragraph delay={1.60}>
        Reusing the spam example from earlier, <Formula>{`H(Y) \\approx 0.722`}</Formula> and <Formula>{`H(Y \\mid X) \\approx 0.432`}</Formula>, so <Formula>{`I(X;Y) \\approx 0.290`}</Formula> bits. Knowing whether the word <InlineCode>free</InlineCode> appears buys roughly 0.29 bits worth of certainty about whether the email is spam. A feature with mutual information near zero tells a model almost nothing about the label, no matter how meaningful it looks to a human. This is exactly the quantity feature selection tools reach for when ranking candidate features, and it's the same quantity representation learning leans on when an embedding is trained to preserve information about a label or a downstream task while discarding whatever else is just noise.
      </Paragraph>

      <Heading level={2} delay={1.65}>
        Perplexity is cross-entropy wearing different units
      </Heading>

      <Paragraph delay={1.70}>
        Language models rarely report a raw cross-entropy number. They report <strong>perplexity</strong>, which is nothing more than cross-entropy run back through an exponential.
      </Paragraph>

      <Formula block delay={1.75}>
        {`\\text{PPL} = 2^{H(P,Q)} \\quad \\text{(bits)}, \\qquad \\text{PPL} = e^{H(P,Q)} \\quad \\text{(nats)}`}
      </Formula>

      <Paragraph delay={1.80}>
        Most training code reports cross-entropy in nats, using the natural log rather than log base 2, so perplexity there is just <Formula>{`e`}</Formula> raised to the loss value. A model averaging <Formula>{`2.3`}</Formula> nats of cross-entropy per token has a perplexity of about <Formula>{`e^{2.3} \\approx 9.97`}</Formula>, essentially 10.
      </Paragraph>

      <Paragraph delay={1.85}>
        That number has a concrete reading. A perplexity of 10 means the model is, on average, about as uncertain over the next token as if it had to choose uniformly among 10 equally likely options, even though the real vocabulary might have fifty thousand tokens in it. A perplexity of 30 means that same effective branching factor grew to 30, more genuine uncertainty per token, a worse model or a harder piece of text. Perplexity turns an abstract loss curve into something closer to "the model is choosing among roughly this many live options at each step," which is a large part of why it stuck as the standard way to report a language model's quality.
      </Paragraph>

      <Heading level={2} delay={1.90}>
        The same handful of numbers, different clothes
      </Heading>

      <Paragraph delay={1.95}>
        Entropy is the shortest average number of bits a perfect code could use to describe outcomes drawn from a distribution, which is the founding question of data compression. Cross-entropy is what happens when the code was built assuming the wrong distribution, which is exactly the classification loss a network minimizes every training step. KL divergence isolates the waste that mismatch causes. Mutual information asks how much one variable's code could be shortened by first knowing another. Perplexity takes cross-entropy and reports it as an effective number of choices instead of a bit count, because "the model is choosing among about 10 options" reads more naturally than "the loss is 2.3 nats."
      </Paragraph>

      <Paragraph delay={2.00}>
        None of these are separate ideas competing for attention. They're the same expected-log-probability computation, read off at different points and dressed for a different audience, a compression engineer, a classifier's loss function, or a language model leaderboard.
      </Paragraph>

      <Heading level={2} delay={2.05}>
        Takeaways
      </Heading>

      <List delay={2.10}>
        <ListItem>Entropy is the expected surprise of a distribution, maximized when every outcome is equally likely and near zero when one outcome dominates.</ListItem>
        <ListItem>Cross-entropy is the negative log-likelihood of the correct class under one-hot labels, which is why minimizing it during training is the same optimization as maximum likelihood.</ListItem>
        <ListItem>Conditional entropy measures the uncertainty left in one variable after observing another, and mutual information is exactly how much that observation reduced it.</ListItem>
        <ListItem>KL divergence isolates the gap between a true distribution and a model's predictions, and it's asymmetric because the two directions weight the penalty by different distributions.</ListItem>
        <ListItem>Perplexity is cross-entropy exponentiated back into an effective branching factor, which is why it reads more intuitively than a raw loss value.</ListItem>
      </List>

      <Paragraph delay={2.15}>
        Compression, classification loss, and language model evaluation all trace back to the same expected-log-probability arithmetic. Once entropy and its handful of relatives are in hand, a loss curve stops being an abstract number going down and starts reading like a direct statement about how much uncertainty is left in a model's beliefs. Thanks for reading.
      </Paragraph>
    </>
  ),
};
