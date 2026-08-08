import { BlogPostData } from "./types";
import {
  CodeBlock,
  Formula,
  Heading,
  InlineCode,
  List,
  ListItem,
  NaiveBayesWordCards,
  Paragraph,
} from "../components";

const words = [
  { word: "free", likelihoodA: 0.15, likelihoodB: 0.05 },
  { word: "money", likelihoodA: 0.15, likelihoodB: 0.05 },
  { word: "now", likelihoodA: 0.15, likelihoodB: 0.15 },
];

const posterior = {
  labelA: "Spam",
  labelB: "Not spam",
  posteriorA: 0.9,
  posteriorB: 0.1,
};

export const naiveBayesProbabilisticClassifiers: BlogPostData = {
  title: "Naive Bayes and Probabilistic Classifiers",
  date: "August 1, 2026",
  slug: "naive-bayes-probabilistic-classifiers",
  content: (
    <>
      <Paragraph delay={0.10}>
        A spam filter looks at an incoming email, sees a handful of words, and has to decide spam or not spam before the message ever reaches an inbox. It doesn't get to read the sender's mind. All it has is a pile of words and some memory of which words showed up in spam before. Naive Bayes turns that memory into a decision rule, and it does it with less machinery than almost any other classifier in common use.
      </Paragraph>

      <Heading level={2} delay={0.15}>
        Classification as a Bayes' rule question
      </Heading>

      <Paragraph delay={0.20}>
        Frame classification as a belief-updating problem. Before looking at any features, a class has some baseline rate, the <strong>prior</strong>. After seeing the features, that belief should move to a <strong>posterior</strong>, the probability of each class given what was actually observed. The mechanism that connects the two is the same one used to reverse a conditional probability anywhere else, restated for a vector of features <Formula>{`x`}</Formula> and a class label <Formula>{`y`}</Formula>.
      </Paragraph>

      <Formula block delay={0.25}>
        {`P(y \\mid x) = \\frac{P(x \\mid y) \\, P(y)}{P(x)}`}
      </Formula>

      <Paragraph delay={0.30}>
        The denominator <Formula>{`P(x)`}</Formula> is the same number no matter which class is being scored, so it never changes which class wins. A classifier only needs to compare classes against each other, which means the posterior is proportional to just the numerator.
      </Paragraph>

      <Formula block delay={0.35}>
        {`P(y \\mid x) \\propto P(x \\mid y) \\, P(y)`}
      </Formula>

      <Paragraph delay={0.40}>
        <Formula>{`P(y)`}</Formula> is easy, it's just how often each class shows up in training data. <Formula>{`P(x \\mid y)`}</Formula> is the hard part. A feature vector with even a few dozen words has more possible combinations than any training set could ever cover, so estimating the joint likelihood of the whole vector directly is hopeless. Naive Bayes gets around this with one deliberately aggressive assumption.
      </Paragraph>

      <Heading level={2} delay={0.45}>
        The "naive" part, treating every feature as independent
      </Heading>

      <Paragraph delay={0.50}>
        The assumption is that every feature is conditionally independent of every other feature, given the class. That turns one intractable joint probability into a product of small, easy-to-estimate pieces.
      </Paragraph>

      <Formula block delay={0.55}>
        {`P(x \\mid y) = \\prod_{i=1}^{n} P(x_i \\mid y)`}
      </Formula>

      <Paragraph delay={0.60}>
        This is almost never true. In a spam email, the words <InlineCode>free</InlineCode> and <InlineCode>winner</InlineCode> tend to show up together, not independently, because both come from the same template a spammer is reusing. Naive Bayes doesn't know that. It scores <InlineCode>free</InlineCode> and <InlineCode>winner</InlineCode> as if seeing one told it nothing about the other, and multiplies their individual contributions as though they were unrelated coincidences.
      </Paragraph>

      <Paragraph delay={0.65}>
        The surprising part is how often this still works. What the classifier needs to get right is not the exact probability value, it's which class scores higher. Correlated features tend to push the score for their shared class in the same direction on both sides of the comparison, so the ranking between classes often survives even when the individual probability numbers are wrong. A model built on a wrong assumption can still make the right decision, as long as the assumption is wrong in a way that doesn't flip which class comes out on top. That distinction, getting the decision right without getting the probability right, comes back later when it's time to talk about what the predicted probabilities actually mean.
      </Paragraph>

      <Heading level={2} delay={0.70}>
        Three variants, one shape of feature
      </Heading>

      <Paragraph delay={0.75}>
        The independence assumption is shared across every version of Naive Bayes. What changes between variants is the shape of <Formula>{`P(x_i \\mid y)`}</Formula>, chosen to match the kind of feature being modeled.
      </Paragraph>

      <List delay={0.80}>
        <ListItem><strong>Gaussian Naive Bayes.</strong> Used when features are continuous, sensor readings, pixel intensities, measurements. Each feature is modeled as its own per-class Gaussian, with a separate mean and variance estimated from the training examples that belong to that class.</ListItem>
        <ListItem><strong>Multinomial Naive Bayes.</strong> Used when features are counts, most commonly word counts in a document. This is the classic text-classification setup. Each class has its own distribution over which words tend to appear and how often.</ListItem>
        <ListItem><strong>Bernoulli Naive Bayes.</strong> Used when features are binary, present or absent, rather than counted. A document is represented by which words show up at least once, ignoring how many times. It rewards absence too, a word that's usually present in one class but missing from a given document counts as evidence against that class.</ListItem>
      </List>

      <Paragraph delay={0.85}>
        Multinomial and Bernoulli look similar on the surface, both eat text, but they answer different questions. Multinomial asks how many times each word occurred. Bernoulli asks only whether each word occurred at all. For short documents the two often behave close to identically, for longer documents where repetition itself carries signal, multinomial usually pulls ahead.
      </Paragraph>

      <Heading level={2} delay={0.90}>
        Log-probabilities keep the arithmetic from vanishing
      </Heading>

      <Paragraph delay={0.95}>
        A document with even a hundred words means multiplying a hundred probabilities together, most of them well under one. Floating point arithmetic runs out of precision for products like that long before it runs out of documents, and the result silently rounds down to zero. The fix is the same one used anywhere a long product of small probabilities shows up, work in log space and add instead of multiply.
      </Paragraph>

      <Formula block delay={1.00}>
        {`\\log P(y \\mid x) \\propto \\log P(y) + \\sum_{i=1}^{n} \\log P(x_i \\mid y)`}
      </Formula>

      <Paragraph delay={1.05}>
        Because the logarithm is strictly increasing, whichever class has the largest sum of log-probabilities is exactly the class that had the largest product of raw probabilities. Nothing about the decision changes, the arithmetic just stops collapsing to zero along the way.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        Laplace smoothing, so one missing word doesn't erase a class
      </Heading>

      <Paragraph delay={1.15}>
        Multiplying probabilities has a sharp failure mode of its own. If a word in a test document never appeared in the training data for some class, its estimated likelihood for that class is exactly zero. Multiply anything by zero and the whole product for that class becomes zero too, no matter how strongly every other word pointed toward it. One unseen word can override every other word combined.
      </Paragraph>

      <Paragraph delay={1.20}>
        <strong>Laplace smoothing</strong> (also called additive smoothing) fixes this by adding a small constant, usually 1, to every count before normalizing, and adding enough to the denominator to keep the probabilities valid.
      </Paragraph>

      <Formula block delay={1.25}>
        {`P(x_i \\mid y) = \\frac{\\text{count}(x_i, y) + 1}{\\text{count}(y) + V}`}
      </Formula>

      <Paragraph delay={1.30}>
        <Formula>{`V`}</Formula> is the size of the vocabulary, the number of distinct features that could ever appear. Adding 1 to every count means a word that was never seen for a class gets a small, nonzero probability instead of a hard zero. It's a modest concession, one unseen word shouldn't get to veto every other word's evidence, and it costs almost nothing when the class actually did see the word many times.
      </Paragraph>

      <Heading level={2} delay={1.35}>
        A worked example, spam or not spam
      </Heading>

      <Paragraph delay={1.40}>
        Take a tiny training set, three spam messages and three ordinary ones.
      </Paragraph>

      <CodeBlock
        delay={1.45}
        language="Python"
        code={`spam_docs = [
    "win money now".split(),
    "win free money".split(),
    "free entry now".split(),
]
ham_docs = [
    "meet me now".split(),
    "let us meet".split(),
    "project meeting now".split(),
]`}
      />

      <Paragraph delay={1.50}>
        Counting words per class gives spam totals of <InlineCode>win</InlineCode> twice, <InlineCode>money</InlineCode> twice, <InlineCode>now</InlineCode> twice, <InlineCode>free</InlineCode> twice, and <InlineCode>entry</InlineCode> once, nine words in total. The ham side counts <InlineCode>meet</InlineCode> twice, <InlineCode>now</InlineCode> twice, and one apiece for <InlineCode>me</InlineCode>, <InlineCode>let</InlineCode>, <InlineCode>us</InlineCode>, <InlineCode>project</InlineCode>, and <InlineCode>meeting</InlineCode>, also nine words. The full vocabulary across both classes has 11 distinct words, so <Formula>{`V = 11`}</Formula>, and each class denominator with smoothing is <Formula>{`9 + 11 = 20`}</Formula>. Both classes start with an equal prior, three documents each out of six, so <Formula>{`P(\\text{spam}) = P(\\text{ham}) = 0.5`}</Formula>.
      </Paragraph>

      <Paragraph delay={1.55}>
        Now score the test message "free money now" against each class. <InlineCode>free</InlineCode> appeared twice in spam and zero times in ham, <InlineCode>money</InlineCode> appeared twice in spam and zero times in ham, and <InlineCode>now</InlineCode> appeared twice in both. With Laplace smoothing, each per-class likelihood is <Formula>{`(\\text{count} + 1) / 20`}</Formula>.
      </Paragraph>

      <NaiveBayesWordCards
        delay={1.60}
        words={words}
        posterior={posterior}
        caption="Figure 1: Per-class likelihood for each word in the test message, with Laplace smoothing applied, and the resulting posterior split."
      />

      <Paragraph delay={1.65}>
        Multiplying the three spam likelihoods gives <Formula>{`0.15 \\times 0.15 \\times 0.15 = 0.003375`}</Formula>, and multiplying the three ham likelihoods gives <Formula>{`0.05 \\times 0.05 \\times 0.15 = 0.000375`}</Formula>. Multiply each by its 0.5 prior, add the two results together to get the normalizing constant, and divide.
      </Paragraph>

      <CodeBlock
        delay={1.70}
        language="Python"
        code={`from collections import Counter

spam_counts = Counter(w for d in spam_docs for w in d)
ham_counts = Counter(w for d in ham_docs for w in d)
vocab = set(spam_counts) | set(ham_counts)
V = len(vocab)
spam_total = sum(spam_counts.values())
ham_total = sum(ham_counts.values())

def likelihood(word, counts, total):
    return (counts.get(word, 0) + 1) / (total + V)

test = ["free", "money", "now"]
prior = 0.5

like_spam = 1.0
like_ham = 1.0
for w in test:
    like_spam *= likelihood(w, spam_counts, spam_total)
    like_ham *= likelihood(w, ham_counts, ham_total)

num_spam = prior * like_spam
num_ham = prior * like_ham
evidence = num_spam + num_ham

print(round(num_spam / evidence, 3))  # 0.9
print(round(num_ham / evidence, 3))   # 0.1`}
      />

      <Paragraph delay={1.75}>
        The posterior lands at 90% spam, 10% not spam. That's not a coincidence of round numbers, it falls out directly from <InlineCode>free</InlineCode> and <InlineCode>money</InlineCode> being three times more likely under spam than under ham, while <InlineCode>now</InlineCode> contributes nothing either way since it showed up equally often in both classes. The math did exactly what it looks like it should do, evidence that only points one direction dominated, and evidence that points nowhere cancelled out.
      </Paragraph>

      <Heading level={2} delay={1.80}>
        Why it's still a strong baseline
      </Heading>

      <Paragraph delay={1.85}>
        Every parameter Naive Bayes needs comes from counting. Per-class word frequencies, per-class means and variances, per-class priors, all of it is a closed-form calculation over the training set, no gradient descent, no iterative optimization, no hyperparameter search beyond the smoothing constant. Training a Naive Bayes classifier over a dataset of a few hundred thousand documents can finish in seconds on a laptop, and predicting on new documents is just as cheap, a handful of lookups and a sum.
      </Paragraph>

      <Paragraph delay={1.90}>
        That speed pairs unusually well with text. Text classification tends to have huge, sparse feature spaces, tens of thousands of possible words, most of them absent from any given document, and Naive Bayes was built for exactly that shape of problem. It doesn't need to learn interactions between words to do reasonably well, because a lot of the signal in short documents really is close to independent word evidence stacking up. That's part of why it survives as a first thing to try on a new text classification task even when more sophisticated models are available, it gives a fast, honest baseline to beat before reaching for anything heavier.
      </Paragraph>

      <Heading level={2} delay={1.95}>
        Calibration caveats
      </Heading>

      <Paragraph delay={2.00}>
        A predicted class can be correct while the predicted probability attached to it is nowhere close to reality. The independence assumption is the reason. Every feature's evidence gets multiplied in as though it were a fresh, unrelated data point, so when features are actually correlated, the same underlying signal gets counted several times over. The winning class doesn't just win, it wins by an exaggerated margin, because the model effectively double-counted evidence that was really one thing dressed up as several. In practice this shows up as posteriors that cluster near 0 and 1 far more often than a well-calibrated model's would, confident even when it shouldn't be. The predicted label is frequently still right. The number next to it should be treated as a ranking signal, not a real probability, unless it's been recalibrated against held-out data.
      </Paragraph>

      <Heading level={2} delay={2.05}>
        When it fails badly
      </Heading>

      <Paragraph delay={2.10}>
        Overconfidence is a nuisance. A real failure needs the independence assumption to be wrong in a way that actually changes the decision, not just the confidence attached to it. That happens when two or more features are strongly correlated and that correlation itself carries the information needed to separate the classes. A duplicated or near-duplicate feature is the sharpest version of this, if the same signal is encoded twice, in two different columns, Naive Bayes counts it twice, effectively giving it double the weight of every other feature. If that double-counted signal happens to be misleading for a particular example, the classifier can be pushed toward the wrong class with startling confidence, because the flawed assumption compounded in the wrong direction instead of canceling out. This is the case where a model that models feature interactions directly, rather than assuming them away, earns its extra complexity.
      </Paragraph>

      <Heading level={2} delay={2.15}>
        Takeaways
      </Heading>

      <List delay={2.20}>
        <ListItem>Naive Bayes scores a class by prior times likelihood, using Bayes' rule and dropping the shared denominator since it doesn't affect which class wins.</ListItem>
        <ListItem>The independence assumption turns one intractable joint likelihood into a simple product of per-feature terms, and it's almost always technically false, yet the resulting class ranking often survives anyway.</ListItem>
        <ListItem>Gaussian, Multinomial, and Bernoulli variants differ only in how <Formula>{`P(x_i \\mid y)`}</Formula> is modeled, continuous values, counts, or presence and absence.</ListItem>
        <ListItem>Log-probabilities prevent numeric underflow, and Laplace smoothing prevents one unseen feature from zeroing out an entire class.</ListItem>
        <ListItem>It trains from closed-form counts, making it fast and a strong text-classification baseline, but its predicted probabilities are frequently overconfident, and strongly correlated features that matter to the decision are where it breaks hardest.</ListItem>
      </List>

      <Paragraph delay={2.25}>
        Naive Bayes rarely wins a benchmark outright against models built to capture feature interactions, but it earns its keep by being fast, interpretable, and honest about the assumption it's making. Knowing exactly which assumption a model leans on, and exactly when that assumption stops being harmless, is most of what it takes to know when to reach for something bigger. Thanks for reading.
      </Paragraph>
    </>
  ),
};
