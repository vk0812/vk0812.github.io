import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  List,
  ListItem,
  BaggingVarianceDiagram,
} from "../components";

export const baggingRandomForests: BlogPostData = {
  title: "Bagging and Random Forests",
  date: "August 1, 2026",
  slug: "bagging-random-forests",
  content: (
    <>
      <Paragraph delay={0.10}>
        A single unpruned decision tree is almost embarrassingly good at fitting the data it's shown. Let it grow until every leaf is pure, or nearly pure, and training error drops close to zero. Hand it a slightly different training set, ten rows swapped for ten others drawn from the same population, and the tree that comes out can look nothing like the first one. Different splits near the root, different leaves, sometimes a wildly different prediction for the exact same new input. A tree is a low-bias, high-variance model almost by construction, flexible enough to represent the true pattern but also flexible enough to memorize whatever noise happened to be in this particular sample.
      </Paragraph>

      <Paragraph delay={0.15}>
        <strong>Bagging</strong> takes that instability and turns it into an advantage instead of fighting it. Train many trees, each on a slightly different version of the training set, then average their predictions. Any one tree is still unreliable on its own. The average of many of them turns out to be far steadier than any single tree, without becoming any less flexible. Random Forests are what happens when that idea gets one more twist, restricting what each tree is even allowed to look at when it splits, and that twist is worth understanding on its own once bagging itself is clear.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Bootstrap sampling, the mechanism underneath the word "bag"
      </Heading>

      <Paragraph delay={0.25}>
        The "bag" in bagging is short for <strong>bootstrap aggregating</strong>, and the bootstrap part refers to a simple resampling trick, drawing a new dataset from an existing one by sampling with replacement. Given a training set of <Formula>{`n`}</Formula> rows, a bootstrap resample also has <Formula>{`n`}</Formula> rows, but each row is picked independently and at random from the original set, so some original rows show up two or three times in the resample and others don't show up at all. Repeat that draw many times and each resulting resample is a slightly different, slightly noisier version of the same underlying data.
      </Paragraph>

      <Paragraph delay={0.30}>
        This is the exact same resampling mechanism used more generally in statistics to estimate how much a computed statistic would wobble across repeated samples, when there isn't a clean formula available for its standard error. Here the goal is narrower and more mechanical. It isn't being used to build a confidence interval around some summary number. It's being used purely to manufacture many alternate training sets out of one, so that many different models can be trained on inputs that are related but not identical.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Bagging, step by step
      </Heading>

      <Paragraph delay={0.40}>
        Bagging is three steps repeated many times over. Draw a bootstrap resample of the training data. Fit a model on that resample, typically a fully grown, unpruned decision tree with no depth limit. Predict on new data with that tree, and separately track what every other tree in the collection predicts for the same input. The final prediction for a numeric target averages every tree's output, and the final prediction for a classification target takes a majority vote across trees, or averages the class probabilities each tree reports.
      </Paragraph>

      <Paragraph delay={0.45}>
        Nothing here requires the base model to be a tree specifically. Bagging works as a wrapper around any model, but trees are the model it gets paired with almost every time in practice, precisely because an unpruned tree is such a textbook example of a low-bias, high-variance predictor. A model that's already stable to begin with, like a plain linear regression, has much less to gain from being bagged: there's not much variance left to average away.
      </Paragraph>

      <Heading level={2} delay={0.50}>
        Why averaging reduces variance without adding much bias
      </Heading>

      <Paragraph delay={0.55}>
        This is the part of bagging that's worth sitting with, because it looks almost too convenient. Averaging a collection of unbiased-but-noisy predictors gives a new predictor whose expected value is the same as any one of them, so bias barely moves, while its variance can drop substantially, because independent noise partially cancels when it's averaged rather than compounding. That's the general bias-variance tradeoff idea in miniature: ordinarily, reducing variance means giving up some flexibility and accepting a bit more bias in exchange. Averaging many high-variance, low-bias trees is one of the few tricks that dodges that exchange, buying a variance reduction that doesn't cost nearly the bias it should.
      </Paragraph>

      <Paragraph delay={0.60}>
        The catch is that the trees can't be fully independent. They're all trained on resamples of the exact same underlying data, so their errors are correlated to some degree. For <Formula>{`N`}</Formula> predictors each with variance <Formula>{`\\sigma^2`}</Formula> and average pairwise correlation <Formula>{`\\rho`}</Formula>, the variance of their average works out to
      </Paragraph>

      <Formula block delay={0.65}>
        {`\\text{Var}\\left(\\frac{1}{N}\\sum_{i=1}^{N} f_i(x)\\right) = \\rho \\sigma^2 + \\frac{1-\\rho}{N}\\sigma^2`}
      </Formula>

      <Paragraph delay={0.70}>
        If the trees were completely independent, <Formula>{`\\rho = 0`}</Formula>, and the variance would shrink all the way toward zero as <Formula>{`N`}</Formula> grows. Because they share the same training data, <Formula>{`\\rho`}</Formula> stays above zero, so the variance flattens out at <Formula>{`\\rho \\sigma^2`}</Formula> instead of vanishing. Adding more trees still helps, it just runs into diminishing returns set by how correlated the trees are with each other. That single fact is the entire motivation for the extra trick Random Forests add on top of plain bagging, described further down.
      </Paragraph>

      <Heading level={2} delay={0.75}>
        A worked example, verified with real trees
      </Heading>

      <Paragraph delay={0.80}>
        To see the shrinking-variance formula actually happen rather than just trusting the algebra, take a noisy training set of 60 points drawn from <Formula>{`y = \\sin(2\\pi x)`}</Formula> with Gaussian noise of standard deviation <Formula>{`0.4`}</Formula>. Fix a single test point at <Formula>{`x = 0.3`}</Formula>. Run 400 independent trials, and in each trial train up to 100 unpruned decision trees, each on its own bootstrap resample of the same 60 training points, and record what the average of the first <Formula>{`N`}</Formula> trees predicts at that test point for <Formula>{`N = 1, 2, 5, 10, 25, 50, 100`}</Formula>. Across the 400 trials, that gives an empirical variance and squared bias for each value of <Formula>{`N`}</Formula>.
      </Paragraph>

      <CodeBlock
        delay={0.85}
        language="Python"
        code={`import numpy as np
from sklearn.tree import DecisionTreeRegressor

rng = np.random.default_rng(0)

def true_fn(x):
    return np.sin(2 * np.pi * x)

n_train = 60
noise_std = 0.4
x_train_full = rng.uniform(0, 1, n_train)
y_train_full = true_fn(x_train_full) + rng.normal(0, noise_std, n_train)

x_test = np.array([0.3])
y_true = true_fn(x_test)[0]

n_trials = 400
max_trees = 100
all_running_means = np.zeros((n_trials, max_trees))

for t in range(n_trials):
    tree_preds = np.zeros(max_trees)
    for b in range(max_trees):
        idx = rng.integers(0, n_train, n_train)  # bootstrap resample
        xb, yb = x_train_full[idx], y_train_full[idx]
        tree = DecisionTreeRegressor(random_state=rng.integers(0, 1_000_000))
        tree.fit(xb.reshape(-1, 1), yb)
        tree_preds[b] = tree.predict(x_test.reshape(-1, 1))[0]
    all_running_means[t] = np.cumsum(tree_preds) / np.arange(1, max_trees + 1)

variance_by_n = all_running_means.var(axis=0)
bias_by_n = (all_running_means.mean(axis=0) - y_true) ** 2

for n in [1, 2, 5, 10, 25, 50, 100]:
    print(f"N={n:>4}: variance={variance_by_n[n-1]:.5f}  bias^2={bias_by_n[n-1]:.5f}")

# N=   1: variance=0.04060  bias^2=0.01074
# N=   2: variance=0.01889  bias^2=0.01127
# N=   5: variance=0.00778  bias^2=0.01347
# N=  10: variance=0.00380  bias^2=0.01372
# N=  25: variance=0.00152  bias^2=0.01439
# N=  50: variance=0.00077  bias^2=0.01447
# N= 100: variance=0.00039  bias^2=0.01460`}
      />

      <Paragraph delay={0.90}>
        A single tree's prediction at that point has a variance of <Formula>{`0.0406`}</Formula> across the 400 trials. Averaging just 10 trees already cuts that to <Formula>{`0.0038`}</Formula>, about a tenth of the original, and averaging 100 trees brings it down to <Formula>{`0.00039`}</Formula>, roughly a hundredth of where it started. Squared bias, meanwhile, barely moves at all across that whole range, drifting from <Formula>{`0.0107`}</Formula> to <Formula>{`0.0146`}</Formula>, an increase small enough to be noise in the simulation itself. That's the tradeoff described above showing up in real numbers, a two-order-of-magnitude drop in variance bought for almost nothing in bias.
      </Paragraph>

      <BaggingVarianceDiagram
        delay={0.08}
        caption="Variance of the N-tree average at a single test point, measured across 400 trials. Both axes are log-scaled, so the roughly straight decline is variance falling close to 1/N as more trees get averaged in."
      />

      <Heading level={2} delay={0.95}>
        Out-of-bag evaluation, a validation set for free
      </Heading>

      <Paragraph delay={1.00}>
        Sampling with replacement has a side effect worth naming on its own. Each bootstrap resample of <Formula>{`n`}</Formula> rows leaves some fraction of the original rows out entirely, and that fraction isn't small. As <Formula>{`n`}</Formula> grows, the probability that any one specific row is never picked across <Formula>{`n`}</Formula> draws approaches <Formula>{`(1 - 1/n)^n \\approx 1/e \\approx 0.368`}</Formula>, so roughly a third of the data goes unused by any given tree. Those <strong>out-of-bag</strong> rows are exactly the ones that tree never trained on, which means its prediction on them is honest held-out validation, without setting aside a separate validation split at all.
      </Paragraph>

      <Paragraph delay={1.05}>
        Averaged across the whole forest, every row ends up out-of-bag for roughly a third of the trees, since each tree leaves out a different random third. Collecting each row's predictions only from the trees that never saw it during training, and comparing those predictions against the true labels, produces an out-of-bag error estimate that behaves almost identically to a proper cross-validation score, at essentially no extra computational cost beyond the training that was already happening. It's one of the more understated conveniences of the whole bagging setup, a decent proxy for generalization error that falls out of the training procedure rather than requiring a separate step.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        Random feature subsets, the extra randomness that defines a Random Forest
      </Heading>

      <Paragraph delay={1.15}>
        Bagging alone still has that correlation problem from a couple of sections up. Every tree sees a bootstrap resample of the same data, so if one feature is a genuinely strong predictor, most of those trees will discover it and split on it near the root. That produces trees that look more alike than they'd need to for averaging to work its best. A <strong>Random Forest</strong> adds one more source of randomness on top of bagging to break that up. At every single split, instead of considering every available feature, the tree considers only a random subset of them, typically around the square root of the total feature count for classification, or about a third of it for regression, and picks the best split within that random subset.
      </Paragraph>

      <Paragraph delay={1.20}>
        This forces different trees to discover different structure even when they'd otherwise agree. A strong feature that got excluded from the random subset at some split has to be passed over in favor of a weaker one, and a different tree with a different random subset makes a different call at the same node. The trees end up meaningfully less correlated with each other, which is exactly the lever the variance formula above cares about: a lower <Formula>{`\\rho`}</Formula> pushes the variance floor <Formula>{`\\rho\\sigma^2`}</Formula> down, so averaging keeps paying off for longer as more trees are added. That's the single sentence version of what separates a Random Forest from plain bagged trees, decorrelating the trees on purpose so the averaging step has more independent noise to cancel out.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        Probabilities and feature importance, two things a forest gets almost for free
      </Heading>

      <Paragraph delay={1.30}>
        A Random Forest's class probability estimate for a new input is simply the fraction of trees in the forest that voted for each class. If 340 out of 500 trees predict the positive class for a given input, the forest reports a probability of <Formula>{`340/500 = 0.68`}</Formula> for that class. It's a rough estimate, not a calibrated one in the strict statistical sense, but it's cheap to compute and it carries real information, a 51 percent vote and a 98 percent vote both count as the same predicted class, yet they mean very different things about how confident the forest actually is.
      </Paragraph>

      <Paragraph delay={1.35}>
        <strong>Feature importance</strong> comes out of the same training process almost as a byproduct. Every time any tree in the forest splits on a given feature, that split reduces impurity by some amount, and averaging that impurity reduction across every split on that feature, across every tree in the forest, produces a single importance score per feature. Features that get chosen for splits often, and that produce large impurity drops when they're chosen, end up with high importance. It's a genuinely useful diagnostic, but it comes with a real caveat worth remembering: this style of importance is biased toward high-cardinality features. A feature with many distinct values, a raw user ID or a fine-grained zip code, offers more possible split points to try. That mechanically gives it more chances to look useful even when it isn't, so a high importance score is a hint worth investigating rather than a settled conclusion on its own.
      </Paragraph>

      <Heading level={2} delay={1.40}>
        Extra Trees, one more turn of the randomness dial
      </Heading>

      <Paragraph delay={1.45}>
        <strong>Extremely Randomized Trees</strong>, usually shortened to Extra Trees, push the same idea one step further. A Random Forest still searches for the single best threshold to split on within its randomly chosen subset of features, it just restricts which features are eligible. Extra Trees randomizes the threshold too, picking a random cut point for each candidate feature rather than searching for the optimal one, and choosing the best of those random splits instead of the best of all possible splits. Each individual tree becomes a little worse on its own, since it's no longer finding the actual best split, but the trees end up even less correlated with each other than a standard Random Forest's trees are, which can translate into a lower overall variance once everything gets averaged. Extra Trees also tends to train noticeably faster, since it skips the exhaustive search for the optimal threshold at every split. Whether it beats a plain Random Forest on a given dataset is genuinely data-dependent, worth trying as a fast alternative rather than assuming either one wins by default.
      </Paragraph>

      <Heading level={2} delay={1.50}>
        When a Random Forest is the right default, and when it isn't
      </Heading>

      <Paragraph delay={1.55}>
        Random Forests earn their reputation as a strong default for tabular data with a mix of numeric and categorical features, moderate size, and no strong prior about which specific handful of features actually matter. They need almost no feature scaling, handle nonlinear relationships and interactions without being told about them explicitly, and are hard to badly misconfigure. A forest with too many trees just costs more compute; it doesn't overfit the way a single deep tree can.
      </Paragraph>

      <List delay={1.60}>
        <ListItem><strong>Very high-dimensional, sparse data</strong> is a weaker fit. When most features are mostly zero, like a bag-of-words representation with a huge vocabulary, the random feature subsets at each split can end up mostly uninformative, and a linear model or a method built for sparsity often does better with far less computation.</ListItem>
        <ListItem><strong>When a single small, transparent model matters more than raw accuracy</strong>, a Random Forest is also the wrong tool, even with feature importance scores available. A forest of hundreds of trees can't be read off as a short set of rules the way a shallow single tree or a linear model with a handful of coefficients can, and in settings where a decision needs to be explained in plain terms to a person, that transparency is often worth more than a percentage point or two of accuracy.</ListItem>
      </List>

      <Paragraph delay={1.65}>
        Outside those two situations, a Random Forest is close to a free first thing to try on a new tabular problem, it takes very little tuning to get a solid baseline, and that baseline is often close enough to whatever a more carefully tuned model eventually produces that the extra effort has to earn its keep.
      </Paragraph>

      <Heading level={2} delay={1.70}>
        Takeaways
      </Heading>

      <List delay={1.75}>
        <ListItem>Bagging trains many models, typically unpruned decision trees, each on an independent bootstrap resample of the training data, then averages their predictions.</ListItem>
        <ListItem>Averaging many low-bias, high-variance models reduces variance substantially while barely touching bias, though correlation between the models (they share the same underlying data) sets a floor below which more trees stop helping.</ListItem>
        <ListItem>Out-of-bag evaluation uses each tree's roughly one-third of held-out rows to get a validation estimate without setting aside a separate validation set.</ListItem>
        <ListItem>Random Forests add random feature subsets at every split, decorrelating the trees further and pushing that variance floor lower, Extra Trees randomizes split thresholds too for even less correlated, faster-to-train trees.</ListItem>
        <ListItem>Random Forests are a strong tabular default with little tuning required, but a weaker fit for very high-dimensional sparse data or settings where a single transparent model matters more than a small accuracy edge.</ListItem>
      </List>

      <Paragraph delay={1.80}>
        None of this needed a new model family, just a willingness to train the same unstable model many times over instead of once, and a couple of deliberate ways to make those many copies disagree with each other more usefully. The averaging step does the rest. Thanks for reading.
      </Paragraph>
    </>
  ),
};
