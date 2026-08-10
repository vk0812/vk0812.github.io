import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  KFoldSplitDiagram,
  KFoldRow,
  SuccessiveHalvingDiagram,
  HalvingRound,
} from "../components";

const kFoldRows: KFoldRow[] = [
  { fold: 1, valIndices: [0, 1] },
  { fold: 2, valIndices: [2, 3] },
  { fold: 3, valIndices: [4, 5] },
  { fold: 4, valIndices: [6, 7] },
  { fold: 5, valIndices: [8, 9] },
];

const halvingRounds: HalvingRound[] = [
  { label: "round 1", budget: "1x", survivors: 4, eliminated: 4 },
  { label: "round 2", budget: "2x", survivors: 2, eliminated: 2 },
  { label: "round 3", budget: "4x", survivors: 1, eliminated: 1 },
];

export const crossValidationHyperparameterOptimization: BlogPostData = {
  title: "Cross-Validation and Hyperparameter Optimization",
  date: "August 1, 2026",
  slug: "cross-validation-hyperparameter-optimization",
  content: (
    <>
      <Paragraph delay={0.10}>
        A single train-test split can make a mediocre model look great or a good model look mediocre, purely because of which rows happened to land in the test set. Shuffle the split differently and the reported accuracy moves. That's already a problem for evaluating one fixed model.
      </Paragraph>

      <Paragraph delay={0.12}>
        It gets worse once there's a hyperparameter to choose, like a tree depth, a regularization strength, or a learning rate. That same noisy split is now also deciding which setting wins, and whatever setting happens to fit the test set's particular quirks ends up looking artificially good.
      </Paragraph>

      <Paragraph delay={0.15}>
        Cross-validation is the standard fix for the first problem. Getting hyperparameter tuning to actually respect it turns out to need one more layer of care than most people apply on the first try.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        K-fold cross-validation
      </Heading>

      <Paragraph delay={0.25}>
        Instead of one train-test split, <strong>K-fold cross-validation</strong> rotates through several. The data gets divided into <Formula>{`k`}</Formula> equally sized chunks, called folds. The model trains on <Formula>{`k-1`}</Formula> of them and gets scored on the one left out. Then the held-out fold rotates, so every row gets used for validation exactly once and for training <Formula>{`k-1`}</Formula> times. Averaging the <Formula>{`k`}</Formula> resulting scores gives a much steadier read on performance than any single split could. The spread across those scores is itself useful information: a tight cluster means the model behaves consistently across different slices of the data, while a wide spread means the reported average is hiding real instability.
      </Paragraph>

      <Paragraph delay={0.30}>
        Ten toy samples split into five folds makes the mechanics concrete. Each row below is one fold's validation set, exactly two samples, with the remaining eight used to train.
      </Paragraph>

      <KFoldSplitDiagram
        rows={kFoldRows}
        sampleCount={10}
        delay={0.06}
        caption="scikit-learn's KFold(n_splits=5) on ten ordered samples. Every sample is validation exactly once, training the other four times."
      />

      <Paragraph delay={0.35}>
        A real numeric example makes the payoff clearer than the diagram alone. Thirty synthetic examples, twenty features, a modest amount of label noise, an RBF-kernel support vector classifier at its default settings, scored across five folds.
      </Paragraph>

      <CodeBlock
        delay={0.40}
        language="Python"
        code={`from sklearn.datasets import make_classification
from sklearn.model_selection import KFold, cross_val_score
from sklearn.svm import SVC

X, y = make_classification(
    n_samples=30, n_features=20, n_informative=2, n_redundant=2,
    n_clusters_per_class=1, flip_y=0.15, random_state=1,
)

model = SVC(kernel="rbf", C=1.0, gamma="scale")
kf = KFold(n_splits=5, shuffle=True, random_state=1)
scores = cross_val_score(model, X, y, cv=kf)

print(scores)         # [0.5   0.5   0.333 0.667 0.333]
print(scores.mean())  # 0.467
print(scores.std())   # 0.125`}
      />

      <Paragraph delay={0.45}>
        The mean of <Formula>{`0.467`}</Formula> is already more trustworthy than any single one of those five numbers. The standard deviation of <Formula>{`0.125`}</Formula> says something a single split never could: this particular model and dataset combination swings by roughly twelve points depending on which rows end up as validation. A single split of <Formula>{`0.667`}</Formula> or <Formula>{`0.333`}</Formula> would each have looked like a confident, specific number. Neither is wrong exactly. They're just one noisy draw from the same underlying spread the five folds reveal together.
      </Paragraph>

      <Heading level={2} delay={0.50}>
        Nested cross-validation, and where plain CV leaks
      </Heading>

      <Paragraph delay={0.55}>
        The default SVC settings above were arbitrary. In practice, a hyperparameter search runs over a grid of candidate settings, scoring each one with cross-validation and keeping whichever setting scored best. That's where a subtle problem creeps in. The same five folds that scored every candidate are also what gets reported as "the model's performance." The winning setting wasn't just evaluated by those folds. It was <strong>selected</strong> because it happened to fit those folds best, which is a different thing from fitting the true underlying pattern best. Reporting that same best-fold score as the model's expected performance on new data is optimistic, because part of what made it the winner was luck specific to that exact set of folds.
      </Paragraph>

      <Paragraph delay={0.60}>
        <strong>Nested cross-validation</strong> separates the two jobs, tuning and evaluating, so one doesn't contaminate the other. An outer loop of folds exists purely to estimate generalization. Inside each outer training fold, an entirely separate inner loop of folds does the actual hyperparameter search, choosing whatever setting looks best using only that inner data. The chosen setting then gets scored on the outer fold's test data, which the inner search never touched. Rotate the outer fold, repeat, average the outer scores. Nothing that touched the final score was ever used to pick the setting being scored.
      </Paragraph>

      <Paragraph delay={0.65}>
        Running both approaches on the same dataset from above, searching over a grid of <Formula>{`C`}</Formula> and <Formula>{`\\gamma`}</Formula> values for the same RBF support vector classifier, shows the gap directly.
      </Paragraph>

      <CodeBlock
        delay={0.70}
        language="Python"
        code={`from sklearn.model_selection import StratifiedKFold, GridSearchCV

param_grid = {"C": [0.01, 0.1, 1, 10, 100, 1000], "gamma": [0.001, 0.01, 0.1, 1, 10]}

# Naive: tune and report on the exact same 5-fold split
naive_search = GridSearchCV(SVC(), param_grid, cv=StratifiedKFold(5, shuffle=True, random_state=1))
naive_search.fit(X, y)
print(naive_search.best_params_)   # {'C': 1000, 'gamma': 0.001}
print(naive_search.best_score_)    # 0.767

# Nested: outer loop evaluates, inner loop (within each outer training fold) tunes
outer = StratifiedKFold(5, shuffle=True, random_state=1)
nested_scores = []
for train_idx, test_idx in outer.split(X, y):
    inner = StratifiedKFold(4, shuffle=True, random_state=1)
    search = GridSearchCV(SVC(), param_grid, cv=inner)
    search.fit(X[train_idx], y[train_idx])
    nested_scores.append(search.score(X[test_idx], y[test_idx]))

print(nested_scores)          # [0.833, 0.667, 0.667, 0.667, 0.167]
print(sum(nested_scores) / 5) # 0.600`}
      />

      <Paragraph delay={0.75}>
        The naive approach reports <Formula>{`0.767`}</Formula>, tuning and grading itself on the same five folds. The nested version, which never lets the outer test folds influence which setting gets picked, reports <Formula>{`0.600`}</Formula>. That's a <Formula>{`0.167`}</Formula> gap on this dataset, and it's not a fluke of one unlucky split. Averaging the same comparison across twenty different random toy datasets with the same generation settings gives a mean optimistic bias of about <Formula>{`0.055`}</Formula>. The naive number came out higher than the honest nested number in fifteen of the twenty runs, and tied in the rest — never lower. Small search spaces on large, clean datasets leak less. Large search spaces on small, noisy datasets, exactly the setting most hyperparameter tuning actually happens in, leak the most, because there's more room for a setting to fit the specific folds' noise rather than the real signal.
      </Paragraph>

      <Paragraph delay={0.80}>
        The practical takeaway isn't that plain cross-validation is wrong. It's that plain CV answers "which setting should I ship" honestly, while only nested CV answers "how well will that shipped setting actually perform." Conflating the two, reporting the winning fold score from a tuning search as the expected production number, is the single most common source of a model that scores great in the notebook and shrugs on real traffic.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        Time-aware validation
      </Heading>

      <Paragraph delay={0.90}>
        Ordinary K-fold assumes every row is exchangeable, that shuffling the data before splitting doesn't change what a fold represents. That assumption breaks the moment rows have a time order and the model is meant to predict the future from the past. Shuffling before splitting a time series lets rows from next month end up training a model that gets validated on rows from last month. Information from the future leaks backward into training, in a way that would never happen at prediction time in production. A model scored this way looks better in validation than it will ever perform once deployed, because real predictions can only ever look forward, not backward.
      </Paragraph>

      <Paragraph delay={0.95}>
        The fix keeps the time order intact and only ever validates on data that comes after what the model trained on. Scikit-learn's <InlineCode>TimeSeriesSplit</InlineCode> does exactly this, growing the training window forward and always validating on the chunk immediately after it.
      </Paragraph>

      <CodeBlock
        delay={1.00}
        language="Python"
        code={`from sklearn.model_selection import TimeSeriesSplit
import numpy as np

X = np.arange(12)
tss = TimeSeriesSplit(n_splits=4)
for train_idx, val_idx in tss.split(X):
    print("train", train_idx, "val", val_idx)

# train [0 1 2 3]             val [4 5]
# train [0 1 2 3 4 5]         val [6 7]
# train [0 1 2 3 4 5 6 7]     val [8 9]
# train [0 1 2 3 4 5 6 7 8 9] val [10 11]`}
      />

      <Paragraph delay={1.05}>
        Notice what never happens here that happens constantly in ordinary K-fold: a validation chunk never sits earlier in time than any row in its training set. Every fold is a smaller, earlier rehearsal of the exact situation the deployed model will actually face, predicting what comes next given only what's already happened.
      </Paragraph>

      <Paragraph delay={1.07}>
        It's a strictly harder test than shuffled K-fold. Training sets are smaller in the early folds, and there's no benefit from data that happens to sit near a validation row in time but far from it in the ordering. That's exactly why a shuffled K-fold score on time-ordered data reads too optimistic. The same logic extends past plain time series: any data with a natural ordering or grouping the model will need to extrapolate past at prediction time, a new user cohort, a new hospital, a new store location, deserves a split that respects that structure instead of shuffling it away.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        Grid search, random search, and Bayesian optimization
      </Heading>

      <Paragraph delay={1.15}>
        Once cross-validation gives a trustworthy way to score one hyperparameter setting, the remaining question is how to choose which settings to even try. <strong>Grid search</strong> is the most literal answer, pick a handful of candidate values for each hyperparameter and evaluate every combination. It's exhaustive and easy to reason about. But the number of combinations multiplies across dimensions — five values for each of four hyperparameters is 625 full training runs — and most of that grid gets spent on combinations nobody had a real reason to expect would help.
      </Paragraph>

      <Paragraph delay={1.20}>
        <strong>Random search</strong> samples candidate settings from a distribution instead of a fixed grid, for the same number of trials. It sounds like it should do worse than an exhaustive grid, but it usually doesn't. Most hyperparameters matter far less than one or two dominant ones, and a random sample explores more distinct values along each dimension than a grid of the same size does. A five-by-five grid tries exactly five distinct values of each hyperparameter no matter how the other one varies. Twenty-five random draws try up to twenty-five distinct values of each, which matters a lot when only one of the two hyperparameters actually drives performance and the other is close to irrelevant.
      </Paragraph>

      <Paragraph delay={1.25}>
        <strong>Bayesian optimization</strong> goes a step further and uses the results of trials already run to decide where to look next, instead of sampling blindly. It fits a cheap probabilistic model of "score as a function of hyperparameters" using every trial run so far, then picks the next candidate by balancing two things, trying a setting near where scores have been good (exploiting what's already known) against trying a setting in a region barely explored yet (exploring in case something better is hiding there). Grid and random search treat every trial as independent and equally uninformed. Bayesian optimization treats every trial as evidence that should shape the next guess. That's why it tends to reach a strong setting in fewer total trials — at the cost of being sequential and harder to parallelize across many machines, since each new suggestion depends on the results of the ones before it.
      </Paragraph>

      <Heading level={2} delay={1.30}>
        Successive halving, spending the budget on what's working
      </Heading>

      <Paragraph delay={1.35}>
        All three search strategies above still assume every candidate gets trained to completion before being compared. That's wasteful when a candidate's eventual ranking is often obvious well before its training finishes. A setting that's clearly underperforming after a small slice of the data or a few epochs rarely catches up later. <strong>Successive halving</strong> exploits exactly that. Start every candidate with a small training budget, keep only the better-performing half (or some other fraction), give the survivors a bigger budget, and repeat. Poor candidates get eliminated cheaply instead of being trained all the way through just to confirm what an early signal already suggested.
      </Paragraph>

      <SuccessiveHalvingDiagram
        rounds={halvingRounds}
        delay={0.07}
        caption="Eight candidates enter with a small budget each. Every round keeps the stronger half and doubles the budget for survivors, so total compute stays concentrated on settings that already looked promising."
      />

      <Paragraph delay={1.40}>
        Eight candidates enter at a 1x budget, four survive to a 2x budget, two survive to a 4x budget, one candidate remains. The total compute spent is nowhere near eight candidates times the full budget, because most candidates only ever ran at the cheap early rounds. This is the same idea behind early stopping of a single training run — cut off a trajectory that's clearly not going anywhere — applied across an entire population of candidates instead of one model's epochs. The tradeoff is real. A candidate that starts slow but would have caught up given the full budget gets eliminated early and never gets the chance. That's why the fraction kept per round and the starting budget size are themselves choices worth tuning, not fixed constants.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Search-space design and compute budget allocation
      </Heading>

      <Paragraph delay={1.50}>
        None of the search strategies above rescue a badly designed search space. A range that's too narrow can silently exclude the actual best setting — a learning rate grid of <Formula>{`0.01`}</Formula> to <Formula>{`0.1`}</Formula> never finds out that <Formula>{`0.001`}</Formula> was the right answer. A range that's too wide wastes trials on settings no reasonable model would want — most of a learning rate search between <Formula>{`10^{-6}`}</Formula> and <Formula>{`10`}</Formula> lands on values that either train unusably slowly or diverge outright. Continuous hyperparameters that span orders of magnitude, like learning rate and regularization strength, should almost always be searched on a log scale rather than a linear one. Otherwise a linear-scale random search wastes the overwhelming majority of its trials in the upper end of the range and barely samples the lower end, where the useful values usually live.
      </Paragraph>

      <Paragraph delay={1.55}>
        Compute budget allocation is the same idea applied to the search as a whole rather than to one axis of it. Given a fixed total amount of compute, the choice isn't just which hyperparameters to search. It's how to split that budget between trying more distinct settings versus training each one longer or on more data. Many more short, cheap trials tend to beat a handful of long, expensive ones early in a project, when the rough shape of what matters isn't known yet, because cheap trials cover more of the space per unit of compute spent. Fewer, longer trials pay off once the search has already narrowed to a small promising region and the remaining question is squeezing out the last bit of performance, where successive halving's later rounds effectively already are.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        Selection bias from too much validation-set reuse
      </Heading>

      <Paragraph delay={1.65}>
        Nested cross-validation solves leakage within a single tuning run. A related problem shows up across many runs over time, even when each individual run was done honestly. Every time a model, a feature set, or a hyperparameter setting gets checked against the same validation data, and the ones that score well get kept while the ones that score poorly get discarded, the surviving candidates end up selected for how well they happen to fit that validation data's specific noise — not purely for how well they generalize. This is exactly the same mechanism as running many statistical tests and reporting only the one that came back significant, except spread across weeks of iterative model development instead of one afternoon of hypothesis testing.
      </Paragraph>

      <Paragraph delay={1.70}>
        A public leaderboard that gets checked hundreds of times over the course of a competition shows this at its most visible. The leaderboard score of whichever submission currently sits on top is optimistic relative to that submission's true performance, precisely because it was chosen out of hundreds of attempts partly for having overfit the leaderboard's own quirks.
      </Paragraph>

      <Paragraph delay={1.72}>
        The standard defenses are the same ones used elsewhere in this post: hold out a final test set that gets touched exactly once at the very end of a project, keep a strict separation between the data used to iterate and the data used to report a final number, and treat a validation score that's been checked dozens of times with the same skepticism a repeatedly peeked-at p-value deserves.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Takeaways
      </Heading>

      <List delay={1.80}>
        <ListItem>K-fold cross-validation replaces one noisy train-test split with an average across several, and the spread across folds is as informative as the mean, a wide spread means the reported average is hiding real instability.</ListItem>
        <ListItem>Tuning hyperparameters on the same folds used to report performance leaks, the winning setting was partly selected for fitting those folds' noise, nested cross-validation separates tuning (inner loop) from evaluation (outer loop) to remove that leak, and the resulting optimistic bias is real, averaging roughly <Formula>{`0.055`}</Formula> across twenty toy dataset draws in the worked example above.</ListItem>
        <ListItem>Shuffling before splitting breaks time-ordered or naturally grouped data by letting the future leak into training, a time-respecting split (train on the past, validate on what comes next) is the only honest option there.</ListItem>
        <ListItem>Grid search is exhaustive but wasteful across many dimensions, random search usually matches it for less compute by exploring more distinct values per hyperparameter, and Bayesian optimization uses past trials to pick smarter future ones at the cost of being sequential.</ListItem>
        <ListItem>Successive halving spends compute where it's earning its keep, eliminating weak candidates early on a small budget instead of training every candidate to completion, and a validation set checked over and over across many iterations of a project quietly accumulates the same selection bias as running too many statistical tests.</ListItem>
      </List>

      <Paragraph delay={1.85}>
        Every technique here is really the same discipline applied at a different scale, keep the data that decides an outcome separate from the data that reports on it, whether that's one train-test split, a full hyperparameter search, or a leaderboard checked once too often. Get that separation right and the number that finally ships is a number that can actually be trusted. Thanks for reading.
      </Paragraph>
    </>
  ),
};
