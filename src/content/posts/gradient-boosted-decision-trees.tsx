import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  ReplicationDiagram,
  ResidualBoostingDiagram,
} from "../components";

export const gradientBoostedDecisionTrees: BlogPostData = {
  title: "Gradient-Boosted Decision Trees",
  date: "August 1, 2026",
  slug: "gradient-boosted-decision-trees",
  content: (
    <>
      <Paragraph delay={0.10}>
        Hand a single decision tree a tabular dataset and it does something honest but limited. Grown deep enough to fit the training data well, it memorizes noise along with signal. Kept shallow enough to avoid that, it's too crude to capture most of the real pattern. Random forests patch this by averaging many deep, noisy trees trained on different random slices of the data, which cancels out a lot of that noise. Gradient boosting solves the same underlying problem with a completely different move, instead of averaging many independent guesses, it builds one small, weak tree, looks at exactly where that tree went wrong, and grows the next tree specifically to fix those mistakes.
      </Paragraph>

      <Paragraph delay={0.15}>
        That's the whole idea in one sentence. A gradient-boosted model is a sequence of small trees, each one trained on the current model's errors rather than on the original targets, added together with a small weight so no single tree gets to overcorrect on its own.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Building the ensemble one small tree at a time
      </Heading>

      <Paragraph delay={0.25}>
        Start with the simplest possible prediction, a single constant, usually the mean of the target across the whole training set. Call that <Formula>{`F_0(x)`}</Formula>. It's obviously wrong for almost every individual point, but it's a starting point, and the whole rest of the algorithm exists to chip away at how wrong it is.
      </Paragraph>

      <Paragraph delay={0.30}>
        Each round after that fits a new small tree, then adds it into the running total with a shrinkage factor <Formula>{`\\eta`}</Formula> that keeps its contribution modest.
      </Paragraph>

      <Formula block delay={0.35}>
        {`F_m(x) = F_{m-1}(x) + \\eta \\, h_m(x)`}
      </Formula>

      <Paragraph delay={0.40}>
        Here <Formula>{`h_m`}</Formula> is the small tree trained in round <Formula>{`m`}</Formula>, and <Formula>{`F_m`}</Formula> is the whole ensemble's prediction after that round. Repeat this a few hundred times and the sum of many small, individually weak corrections adds up to a strong model. The question that actually defines gradient boosting is what each new tree gets trained to predict, and the answer is where the "gradient" in the name comes from.
      </Paragraph>

      <Heading level={2} delay={0.45}>
        Fitting the next tree to the negative gradient
      </Heading>

      <Paragraph delay={0.50}>
        The cleanest way into this is the plain squared-error case, since it makes the mechanism completely concrete before generalizing. Take the per-example loss <Formula>{`L(y, F) = \\tfrac{1}{2}(y - F)^2`}</Formula>. Its derivative with respect to the current prediction <Formula>{`F`}</Formula> is <Formula>{`F - y`}</Formula>, so the negative gradient at each training point is <Formula>{`y - F`}</Formula>, which is exactly the residual, the gap between the true value and what the ensemble currently predicts.
      </Paragraph>

      <Paragraph delay={0.55}>
        So for squared error, "fit the next tree to correct the current mistakes" literally means fit a regression tree to the residuals. If the ensemble currently predicts <InlineCode>7</InlineCode> for a point whose true value is <InlineCode>10</InlineCode>, the residual is <InlineCode>3</InlineCode>, and the next tree is trained to output something close to <InlineCode>3</InlineCode> for that point, alongside whatever every other point's residual happens to be. Grow that tree, add a shrunk copy of it to the running prediction, and the ensemble edges a little closer to the truth everywhere at once.
      </Paragraph>

      <Paragraph delay={0.60}>
        The general version drops the assumption that the loss is squared error at all. For any differentiable loss <Formula>{`L(y, F)`}</Formula>, the next tree is fit not to the residual directly but to the negative gradient of that loss with respect to the current prediction, evaluated at every training point.
      </Paragraph>

      <Formula block delay={0.65}>
        {`r_i^{(m)} = - \\left. \\frac{\\partial L(y_i, F(x_i))}{\\partial F(x_i)} \\right|_{F = F_{m-1}}`}
      </Formula>

      <Paragraph delay={0.70}>
        Squared error is the one case where this quantity happens to equal the plain residual. Swap in log loss for classification or a quantile loss for quantile regression and the negative gradient becomes a different expression, but the recipe never changes, compute what direction would most reduce the loss at each point right now, and train a small tree to predict that direction. That's why the family is called <strong>gradient boosting</strong> rather than just "residual boosting", the residual is a special case of a much more general trick, functional gradient descent carried out one small tree at a time instead of one parameter step at a time.
      </Paragraph>

      <Heading level={2} delay={0.75}>
        Why this isn't just another flavor of bagging
      </Heading>

      <Paragraph delay={0.80}>
        It's worth being precise about how different this is from bagging in spirit, since both approaches end up with "many trees added together" and it's easy to blur the two together. Bagging trains many trees independently, usually deep and individually high-variance, each on a different bootstrap resample of the data, then averages their predictions. Averaging independent noisy estimates cancels out variance, which is exactly the failure mode deep trees have, but averaging does nothing to fix a tree that's systematically biased in some direction, since every copy shares the same bias and averaging leaves that bias untouched.
      </Paragraph>

      <Paragraph delay={0.85}>
        Boosting attacks the opposite failure mode. Each tree is shallow and individually high-bias, barely better than a coin flip on its own, and the trees are anything but independent, each one is grown specifically to explain what every earlier tree got wrong. That sequential dependency is precisely what a bagged ensemble doesn't have and doesn't want, bagging's trees need to be as uncorrelated as possible for averaging to help, while boosting's trees are deliberately built to correlate with the current errors.
      </Paragraph>

      <ReplicationDiagram
        delay={0.06}
        panels={[
          {
            title: "Bagging",
            writeLabel: "Same training data, resampled",
            fanLabel: "trained independently, then averaged",
            nodes: ["Deep tree 1", "Deep tree 2", "Deep tree 3"],
            note: "Each tree is high-variance on its own, averaging cancels the noise, bias stays roughly what a single deep tree already had.",
          },
          {
            title: "Boosting",
            writeLabel: "Same training data, same rows",
            fanLabel: "trained in sequence, each on the last one's errors",
            nodes: ["Shallow tree 1", "Shallow tree 2", "Shallow tree 3"],
            highlightNodes: [2],
            note: "Each tree is high-bias on its own, the sequence incrementally reduces bias, later trees depend entirely on earlier ones.",
          },
        ]}
      />

      <Paragraph delay={0.90}>
        That contrast also explains why the two families reach for different-shaped trees by default. Bagging wants deep, low-bias, high-variance trees because averaging is the tool doing the work. Boosting wants shallow, high-bias, low-variance trees because the sequence itself is the tool doing the work, and stacking hundreds of already-overfit deep trees on top of each other's mistakes tends to overfit far worse than stacking hundreds of shallow, humble ones.
      </Paragraph>

      <Heading level={2} delay={0.95}>
        Shrinkage, why small steps beat big ones
      </Heading>

      <Paragraph delay={1.00}>
        The <Formula>{`\\eta`}</Formula> in the update rule above is the <strong>learning rate</strong>, sometimes called shrinkage in this context, and it plays almost exactly the same role it plays in gradient descent over parameters. Set <Formula>{`\\eta = 1`}</Formula> and each tree gets to correct the full residual it was trained on, which sounds efficient but tends to overfit fast, the ensemble chases every quirk in the training residuals at full strength, round after round.
      </Paragraph>

      <Paragraph delay={1.05}>
        Set <Formula>{`\\eta`}</Formula> to something small instead, a common range is <InlineCode>0.01</InlineCode> to <InlineCode>0.1</InlineCode>, and each individual tree only nudges the ensemble a little. That means more rounds are needed to reach the same overall fit, but the path there is smoother and less prone to fitting noise a single aggressive step would have locked in permanently. In practice, many small steps with a low learning rate and a few hundred to a few thousand trees reliably beats a handful of large steps with a high one, for the same reason a cautious gradient descent schedule usually generalizes better than one huge leap toward the training optimum. The trade is compute, not accuracy, a lower learning rate needs more trees to converge, which costs more training time for a model that tends to generalize better once it gets there.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        Tree depth, the other main knob
      </Heading>

      <Paragraph delay={1.15}>
        Depth is the second lever that matters as much as the learning rate, and it works in the opposite direction from what a bagging background might suggest. Random forests lean toward deep, close-to-fully-grown trees because variance reduction is the whole strategy. Gradient boosting leans hard the other way, shallow trees, typically depth 3 to 6, sometimes even single-split stumps at depth 1, are the usual default.
      </Paragraph>

      <Paragraph delay={1.20}>
        A depth-3 tree can only express interactions between at most three features at a time, and it fits its assigned residuals crudely rather than precisely. That's a feature here, not a limitation to work around. Since hundreds of these shallow trees stack up sequentially, a small amount of expressive power per tree compounds into a very expressive overall function, while keeping any single tree from latching onto a coincidental pattern in the residuals it happened to be handed that round. Going deeper per tree usually doesn't help nearly as much as it sounds like it should, and it tends to make the ensemble converge to an overfit fit faster in terms of rounds, which then has to be compensated for with a lower learning rate or earlier stopping anyway.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        Regularizing the trees themselves
      </Heading>

      <Paragraph delay={1.30}>
        Modern gradient boosting libraries add several more direct dials on top of depth and shrinkage, and they're worth naming individually since each targets a slightly different source of overfitting.
      </Paragraph>

      <List delay={1.35}>
        <ListItem><strong>Row subsampling.</strong> Each round trains its tree on a random fraction of the training rows rather than all of them, which injects the same kind of variance-reducing randomness bagging relies on, without giving up the sequential residual-fitting boosting depends on.</ListItem>
        <ListItem><strong>Column subsampling.</strong> Each tree, or each split within a tree, only considers a random subset of the available features, which stops one dominant feature from being reused identically by every tree in the sequence and forces the ensemble to spread its explanatory power across more of the input.</ListItem>
        <ListItem><strong>L2 penalty on leaf weights.</strong> The value a tree assigns to each leaf gets pulled toward zero by a penalty term, the same ridge-style regularization idea applied to a leaf's output value instead of a linear coefficient, which keeps any single leaf from making an outsized correction based on very few training rows.</ListItem>
        <ListItem><strong>Minimum child weight.</strong> A split is only allowed if each resulting leaf accumulates enough total weight (roughly, enough training rows), which stops a tree from carving out a leaf around a handful of points purely because that happened to reduce the residual for those exact points.</ListItem>
      </List>

      <Paragraph delay={1.40}>
        None of these tools is required to make boosting work at all, a plain sequence of shallow trees with shrinkage already learns something useful. What they add is control over exactly how much any one tree, or any one training row, is allowed to influence the final ensemble, which matters a great deal once the dataset is noisy or the number of rounds climbs into the thousands.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Early stopping, letting a validation set pick the round count
      </Heading>

      <Paragraph delay={1.50}>
        Every round of boosting can only reduce training error, that's what fitting a new tree to the current residuals does by construction. Left unchecked for enough rounds, the ensemble eventually starts fitting noise the same way an unregularized deep tree would, and validation error, after falling for a while, turns around and creeps back up. <strong>Early stopping</strong> watches that validation metric round by round and halts training once it stops improving for some patience window, keeping the model from the round where it generalized best rather than the round where it memorized the training set best.
      </Paragraph>

      <Paragraph delay={1.55}>
        This is also the practical reason the learning rate and the number of rounds are almost never tuned in isolation. A lower learning rate needs more rounds to reach a comparable fit, so it's common to set the learning rate low, set the round count deliberately high, and let early stopping on a held-out validation set decide the actual number that gets used, rather than guessing a fixed round count up front.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        Categorical features and missing values
      </Heading>

      <Paragraph delay={1.65}>
        Two data-shape questions come up on almost every real tabular dataset, and boosting libraries handle both directly rather than pushing the work onto preprocessing. Older tooling required one-hot encoding every categorical column, turning one column with a hundred categories into a hundred sparse binary columns, which trees handle clumsily since a single split can only isolate one category at a time. Modern gradient boosting libraries support categorical features natively instead, grouping categories directly at split time based on how they relate to the target, without ever expanding the column into a wide one-hot block.
      </Paragraph>

      <Paragraph delay={1.70}>
        Missing values get a similarly direct treatment. Rather than requiring an imputed value beforehand, a modern implementation learns a default direction for every split, whichever branch minimizes the loss for the rows that do have a value at that feature, and sends every row with a missing value down that learned default branch at prediction time. That means the model doesn't just tolerate missing data, it treats the pattern of what's missing as a potential signal in its own right, which matters in domains where missingness itself is informative rather than random.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        A worked example, three rounds by hand
      </Heading>

      <Paragraph delay={1.80}>
        Numbers make the sequential-correction idea concrete. Take six points, <Formula>{`x = 1, 2, 3, 4, 5, 6`}</Formula> with targets <Formula>{`y = 5, 7, 6, 10, 9, 13`}</Formula>, squared-error loss, a learning rate of <Formula>{`0.5`}</Formula>, and a depth-1 stump (a single split) as the weak learner each round. The stump each round picks whichever threshold on <Formula>{`x`}</Formula> minimizes the sum of squared error of the two resulting groups' residuals.
      </Paragraph>

      <CodeBlock
        delay={1.85}
        language="Python"
        code={`import numpy as np

def fit_stump(x, r):
    order = np.argsort(x)
    xs, rs = x[order], r[order]
    best = None
    for i in range(1, len(x)):
        if xs[i] == xs[i - 1]:
            continue
        thresh = (xs[i - 1] + xs[i]) / 2
        left, right = rs[:i], rs[i:]
        sse = np.sum((left - left.mean()) ** 2) + np.sum((right - right.mean()) ** 2)
        if best is None or sse < best[0]:
            best = (sse, thresh, left.mean(), right.mean())
    _, thresh, left_mean, right_mean = best
    return thresh, np.where(x <= thresh, left_mean, right_mean)

x = np.array([1, 2, 3, 4, 5, 6], dtype=float)
y = np.array([5.0, 7.0, 6.0, 10.0, 9.0, 13.0])
lr = 0.5

F = np.full_like(y, y.mean())
print("F0 (mean):", np.round(F, 4), " SSE:", round(np.sum((y - F) ** 2), 4))

for rnd in range(1, 4):
    resid = y - F
    thresh, pred = fit_stump(x, resid)
    F = F + lr * pred
    print(f"round {rnd}: split x<={thresh}, SSE={round(np.sum((y - F) ** 2), 4)}")

# F0 (mean): [8.3333 8.3333 8.3333 8.3333 8.3333 8.3333]  SSE: 43.3333
# round 1: split x<=3.5, SSE=18.8333
# round 2: split x<=5.5, SSE=7.8083
# round 3: split x<=3.5, SSE=4.8071`}
      />

      <Paragraph delay={1.90}>
        The starting prediction is the flat mean, <Formula>{`8.3333`}</Formula> everywhere, which puts total squared error at <Formula>{`43.33`}</Formula>. The first stump splits on <Formula>{`x \\leq 3.5`}</Formula>, since the low-<Formula>{`x`}</Formula> points (targets <Formula>{`5, 7, 6`}</Formula>) sit noticeably below the mean and the high-<Formula>{`x`}</Formula> points (targets <Formula>{`10, 9, 13`}</Formula>) sit noticeably above it. Shrinking that correction by <Formula>{`0.5`}</Formula> and adding it in drops the squared error to <Formula>{`18.83`}</Formula>, already less than half of where it started. The second stump finds a finer split at <Formula>{`x \\leq 5.5`}</Formula>, isolating the point at <Formula>{`x=6`}</Formula> whose target of <Formula>{`13`}</Formula> is still the worst-fit point in the set, pulling squared error down to <Formula>{`7.81`}</Formula>. The third stump goes back to splitting near <Formula>{`x \\leq 3.5`}</Formula>, fine-tuning both groups a bit further and landing at <Formula>{`4.81`}</Formula>, under an ninth of the starting error after just three small trees.
      </Paragraph>

      <ResidualBoostingDiagram
        delay={0.07}
        caption="Six points, three rounds of a shrunk depth-1 stump each, dashed residuals shrink as the flat mean walks toward the two-and-then-three group structure the data actually has."
      />

      <Paragraph delay={1.95}>
        Two things worth noticing in that trace. First, no single stump comes close to fitting any point exactly, each one is a genuinely weak, coarse guess. Second, the total squared error still drops fast, from <Formula>{`43.33`}</Formula> to <Formula>{`4.81`}</Formula> in three rounds, because each new weak guess is aimed precisely at whatever the sum of the previous ones still got wrong. That's the entire mechanism this post has been building toward, stated in six numbers instead of a paragraph.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        Why boosting is the default baseline for tabular data
      </Heading>

      <Paragraph delay={2.05}>
        Put every piece from above together and it's clear why gradient-boosted trees, not a neural network, remain the first thing worth trying on a new tabular dataset with a mix of numeric and categorical columns. Trees split on raw feature values, so there's no need to standardize scales or worry about a wildly skewed column dominating a gradient step the way it can in a linear model. Native categorical and missing-value handling remove two of the most tedious and error-prone preprocessing steps outright. Shrinkage plus early stopping give a direct, well-understood way to trade training time for generalization. And the sequential, additive structure this whole post has walked through consistently finds sharp, non-linear interactions between a handful of features that a linear or logistic model simply can't represent, without requiring anywhere near the amount of data a deep network typically needs to learn the same interactions from scratch.
      </Paragraph>

      <Paragraph delay={2.10}>
        None of that makes boosting universally correct, a dataset dominated by raw pixels, audio, or long text still favors architectures built for that structure. But for a spreadsheet of rows and columns, which describes an enormous share of real business data, it's very hard to beat a well-tuned gradient-boosted ensemble, and it's the reason the algorithm shows up so often as the strong, boring baseline that other methods have to justify beating.
      </Paragraph>

      <Heading level={2} delay={2.15}>
        Takeaways
      </Heading>

      <List delay={2.20}>
        <ListItem>Gradient boosting builds a sequence of small trees, each one fit to the negative gradient of the loss with respect to the current ensemble's predictions, which is exactly the residual in the squared-error case.</ListItem>
        <ListItem>Bagging averages independent, high-variance trees to cancel noise, boosting chains dependent, high-bias trees together to incrementally reduce bias, and the two approaches want opposite tree shapes for exactly that reason.</ListItem>
        <ListItem>Shrinkage (the learning rate) and tree depth are the two levers that matter most, small steps over many shallow trees generalize more reliably than a few large steps over deep ones.</ListItem>
        <ListItem>Row and column subsampling, an L2 penalty on leaf weights, minimum child weight, and early stopping on a validation set all attack overfitting from different angles, and none of them are optional once a dataset gets noisy or the round count climbs into the thousands.</ListItem>
        <ListItem>Native categorical splitting and a learned default direction for missing values remove two of the most common sources of preprocessing bugs, which is a real part of why boosting remains the default first model for tabular data.</ListItem>
      </List>

      <Paragraph delay={2.25}>
        The six-number trace in the worked example is the whole idea in miniature, a flat guess, three small corrections, and an error that keeps shrinking because each correction was aimed exactly at what came before it. Everything else, shrinkage, depth limits, subsampling, early stopping, is just making sure that same simple trick doesn't get greedy about it. Thanks for reading.
      </Paragraph>
    </>
  ),
};
