import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
} from "../components";
import {
  CrossEntropyFocalCurveDiagram,
  RobustLossCurveDiagram,
} from "../components/animations/loss-functions-objective-design/ConceptViz";

export const lossFunctionsObjectiveDesign: BlogPostData = {
  title: "Loss Functions and Objective Design",
  date: "August 1, 2026",
  slug: "loss-functions-objective-design",
  content: (
    <>
      <Paragraph delay={0.10}>
        Two teams can take the exact same architecture, the exact same training data, and the exact same number of epochs, and still ship models that behave completely differently in production. The usual reason isn't the model at all. It's the loss function. A network doesn't know what "good" means, it only knows what number it's being pushed to shrink, and every choice buried in that number, which errors get punished harder, how imbalance gets handled, how several goals get combined into one, shows up later as an actual behavior someone notices in production.
      </Paragraph>

      <Paragraph delay={0.15}>
        None of this is exotic math. Most loss functions worth knowing are a page of algebra each. The skill is knowing which one actually matches the problem, and being able to see, before training even starts, which failure mode a given choice is quietly inviting in.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Classification, cross-entropy
      </Heading>

      <Paragraph delay={0.25}>
        For a binary label, a model outputs a single probability <Formula>{`\\hat y`}</Formula> that the true label is 1. Binary cross-entropy scores that prediction against the actual label.
      </Paragraph>

      <Formula block delay={0.30}>
        {`\\mathcal{L} = -\\big[ y \\log \\hat y + (1-y)\\log(1-\\hat y) \\big]`}
      </Formula>

      <Paragraph delay={0.35}>
        Only one of the two terms survives for any given example, whichever one matches the true label, and that surviving term is <Formula>{`-\\log`}</Formula> of whatever probability the model assigned to the correct answer. That's the entire mechanism. Confident and correct means a probability near 1, so <Formula>{`-\\log`}</Formula> of it is nearly zero, almost no penalty. Confident and wrong means a probability near 0, and <Formula>{`-\\log`}</Formula> of a number near zero blows up toward infinity, a severe penalty. This is a negative log-likelihood under a coin-flip (Bernoulli) model of the label, the same information-theoretic quantity that measures the average cost of describing outcomes drawn from one distribution using a code built for another.
      </Paragraph>

      <Paragraph delay={0.40}>
        More than two classes extends the same idea. A model outputs a full probability vector over <Formula>{`K`}</Formula> classes (via softmax), the true label is one-hot, and categorical cross-entropy again collapses to <Formula>{`-\\log`}</Formula> of the probability assigned to the one correct class, every other term multiplied away by a zero in the one-hot vector.
      </Paragraph>

      <Formula block delay={0.45}>
        {`\\mathcal{L} = -\\sum_{k=1}^{K} y_k \\log \\hat y_k`}
      </Formula>

      <Paragraph delay={0.50}>
        Cross-entropy rewards exactly one thing, put as much probability mass as possible on the right answer, and it does not care at all whether the wrong answers are ranked sensibly among themselves. A model that assigns 90% to the correct class and splits the remaining 10% arbitrarily among three wrong classes gets the same loss on that example no matter how that 10% is split. That's usually fine. It stops being fine the moment the actual evaluation metric cares about something cross-entropy is blind to, which is a theme worth keeping in mind for the rest of this post.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        Regression, three ways to score an error
      </Heading>

      <Paragraph delay={0.60}>
        Regression doesn't have a label to match, it has a numeric target, so the loss has to score the gap between prediction and truth directly. Three losses dominate here, and they differ entirely in how that gap gets punished as it grows.
      </Paragraph>

      <Paragraph delay={0.65}>
        <strong>Mean squared error</strong> (MSE) squares the residual, prediction minus actual, before averaging.
      </Paragraph>

      <Formula block delay={0.70}>
        {`\\mathcal{L}_{\\text{MSE}} = \\frac{1}{n}\\sum_{i=1}^{n} (\\hat y_i - y_i)^2`}
      </Formula>

      <Paragraph delay={0.75}>
        Squaring means a residual twice as large costs four times as much, not twice as much. That's convenient for optimization (the loss surface is smooth everywhere, and the gradient shrinks nicely as the error shrinks), but it also means one wildly wrong prediction can dominate the entire loss and drag the fitted model toward accommodating that single point at the expense of everything else.
      </Paragraph>

      <Paragraph delay={0.80}>
        <strong>Mean absolute error</strong> (MAE) doesn't square anything, it just averages the raw distance.
      </Paragraph>

      <Formula block delay={0.85}>
        {`\\mathcal{L}_{\\text{MAE}} = \\frac{1}{n}\\sum_{i=1}^{n} |\\hat y_i - y_i|`}
      </Formula>

      <Paragraph delay={0.90}>
        A residual twice as large costs exactly twice as much here, so one outlier can't dominate the way it does under MSE. The tradeoff is a rougher optimization surface, the gradient has a constant magnitude no matter how close the prediction already is, which makes training a little less stable near convergence.
      </Paragraph>

      <Paragraph delay={0.95}>
        <strong>Huber loss</strong> is the hybrid that takes the useful half of each. It behaves like MSE for small residuals and switches to MAE's linear growth past a threshold <Formula>{`\\delta`}</Formula>.
      </Paragraph>

      <Formula block delay={1.00}>
        {`\\mathcal{L}_{\\delta}(e) = \\begin{cases} \\frac{1}{2}e^2 & |e| \\le \\delta \\\\ \\delta\\big(|e| - \\frac{1}{2}\\delta\\big) & |e| > \\delta \\end{cases}`}
      </Formula>

      <Paragraph delay={1.05}>
        Small errors get the smooth, well-behaved quadratic treatment. Large errors, the kind a genuine outlier produces, get downgraded to linear growth instead of quadratic, so one bad data point stops being able to hijack the whole fit. <Formula>{`\\delta`}</Formula> is the one knob, set it too small and Huber behaves almost entirely like MAE, set it too large and it behaves almost entirely like MSE.
      </Paragraph>

      <RobustLossCurveDiagram
        delay={0.08}
        caption="MSE curves upward quadratically and keeps growing without bound for a large residual, MAE grows in a straight line everywhere, and Huber matches MSE near zero before switching to MAE's linear growth past the delta threshold."
      />

      <Heading level={2} delay={1.10}>
        A worked example, one outlier among five points
      </Heading>

      <Paragraph delay={1.15}>
        Five predictions against five actual values make the difference concrete. Four of them are close, one is badly off, a model predicting 1.0 for a point whose true value is 7.0.
      </Paragraph>

      <CodeBlock
        delay={1.20}
        language="Python"
        code={`import numpy as np

actual = np.array([3.0, -1.0, 2.0, 7.0, 1.0])
pred   = np.array([2.5, -0.5, 2.2, 1.0, 0.8])
resid  = pred - actual
print(resid)
# [-0.5  0.5  0.2 -6.   -0.2]

mse = resid ** 2
mae = np.abs(resid)
delta = 1.0
huber = np.where(np.abs(resid) <= delta,
                  0.5 * resid ** 2,
                  delta * (np.abs(resid) - 0.5 * delta))

print(mse.mean(), mae.mean(), huber.mean())
# 7.316 1.48 1.158

print(mse[3] / mse.sum(), mae[3] / mae.sum(), huber[3] / huber.sum())
# 0.9841 0.8108 0.9499`}
      />

      <Paragraph delay={1.25}>
        The outlier's residual is 6, twelve times bigger than the next-largest residual of 0.5. Under MSE, that single point accounts for 98% of the total loss, the other four points might as well not exist as far as the gradient is concerned. Under MAE, the same point accounts for 81%, still dominant but far less absolute. Huber lands in between at 95%, closer to MSE than MAE, which makes sense given <Formula>{`\\delta = 1`}</Formula> is small relative to this residual, past the threshold the outlier's contribution grows only linearly instead of quadratically, so it stops swallowing the loss entirely even though it's still the largest single term. Push <Formula>{`\\delta`}</Formula> up toward the outlier's own residual size and Huber drifts back toward MSE's behavior, the threshold is doing real work here, not just cosmetic tuning.
      </Paragraph>

      <Heading level={2} delay={1.30}>
        Margin and metric losses
      </Heading>

      <Paragraph delay={1.35}>
        Some problems don't need a calibrated probability at all, they just need the right answer ranked ahead of the wrong ones by a comfortable margin. <strong>Hinge loss</strong>, the loss behind support vector machines, encodes exactly that. For a label <Formula>{`y \\in \\{-1, +1\\}`}</Formula> and a raw model score <Formula>{`f(x)`}</Formula> (no sigmoid, no probability),
      </Paragraph>

      <Formula block delay={1.40}>
        {`\\mathcal{L} = \\max(0,\\, 1 - y \\cdot f(x))`}
      </Formula>

      <Paragraph delay={1.45}>
        A correct prediction with score at least 1 past the boundary costs nothing at all, the loss is exactly zero. Getting it right but only barely, or getting it wrong, costs something proportional to how far the score sits on the wrong side of that margin. This is a genuinely different shape from cross-entropy, cross-entropy keeps pushing a correct, confident prediction to get even more confident forever (the gradient never fully reaches zero), while hinge loss is perfectly happy once a prediction clears its margin and stops contributing any gradient at all past that point.
      </Paragraph>

      <Paragraph delay={1.50}>
        A related family, contrastive and triplet losses, extends the same margin idea to embeddings instead of a single score, pulling a matching pair's vectors closer together and pushing a non-matching pair's vectors at least some margin apart, which is the mechanism behind most modern retrieval and image-text matching systems. The full derivation of that objective (a softmax over a batch of similarities, temperature-scaled) is its own topic and not worth re-deriving here, the short version is that it's still fundamentally a margin argument, just applied to a whole batch of pairs at once instead of one score.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        Focal loss, for when most examples are easy
      </Heading>

      <Paragraph delay={1.60}>
        Ordinary cross-entropy has a problem on heavily imbalanced data. Picture a defect-detection model where 99% of parts are fine and 1% are defective. Once training gets underway, the overwhelming majority of examples are the easy, already-well-classified negatives, and each one still contributes a small but nonzero gradient. Summed across a huge batch of easy examples, those small contributions add up to more total gradient than the rare, hard, actually-informative positives get to contribute. <strong>Focal loss</strong> fixes this by adding a term that down-weights examples the model is already getting right.
      </Paragraph>

      <Formula block delay={1.65}>
        {`\\mathcal{L}_{\\text{focal}} = -(1 - p_t)^{\\gamma} \\log(p_t)`}
      </Formula>

      <Paragraph delay={1.70}>
        <Formula>{`p_t`}</Formula> is the probability the model assigned to the true class, same quantity cross-entropy already uses, and <Formula>{`\\gamma`}</Formula> (commonly 2) controls how aggressively easy examples get discounted. When <Formula>{`p_t`}</Formula> is already close to 1, <Formula>{`(1-p_t)^\\gamma`}</Formula> is tiny, so that example's contribution to the loss all but disappears. When <Formula>{`p_t`}</Formula> is small, the model is still wrong or unsure, and <Formula>{`(1-p_t)^\\gamma`}</Formula> stays close to 1, leaving the loss almost exactly equal to ordinary cross-entropy. Set <Formula>{`\\gamma = 0`}</Formula> and focal loss reduces algebraically back to plain cross-entropy, it isn't a separate mechanism, it's cross-entropy with an extra dial for how much attention easy examples get to keep.
      </Paragraph>

      <CrossEntropyFocalCurveDiagram
        delay={0.08}
        caption="Cross-entropy stays steep across the whole confidence range, focal loss with gamma=2 collapses toward zero once the model is already assigning high probability to the true class."
      />

      <Paragraph delay={1.75}>
        Running the numbers across a few confidence levels shows exactly how much gradient budget shifts away from the easy end.
      </Paragraph>

      <CodeBlock
        delay={1.80}
        language="Python"
        code={`import numpy as np

p = np.array([0.05, 0.30, 0.60, 0.90, 0.99])
ce    = -np.log(p)
focal = -(1 - p) ** 2 * np.log(p)

for pi, c, f in zip(p, ce, focal):
    print(pi, round(c, 4), round(f, 4), round(f / c, 4))
# 0.05  2.9957  2.7036  0.9025
# 0.30  1.2040  0.5899  0.4900
# 0.60  0.5108  0.0817  0.1600
# 0.90  0.1054  0.0011  0.0100
# 0.99  0.0101  0.0000  0.0001`}
      />

      <Paragraph delay={1.85}>
        At <Formula>{`p = 0.05`}</Formula>, a model that's still badly wrong, focal loss is 90% the size of cross-entropy, barely discounted, because this is exactly the example that should keep contributing gradient. By <Formula>{`p = 0.60`}</Formula>, already reasonably confident, focal loss has fallen to 16% of cross-entropy's value. At <Formula>{`p = 0.99`}</Formula>, focal loss is down to a hundredth of a percent of cross-entropy. That's the entire design goal made numeric, the easy majority class barely moves the loss anymore, and whatever gradient budget remains gets spent almost entirely on the examples the model hasn't solved yet.
      </Paragraph>

      <Heading level={2} delay={1.90}>
        Label smoothing
      </Heading>

      <Paragraph delay={1.95}>
        Ordinary cross-entropy trains against a hard one-hot label, all probability mass on the correct class, none anywhere else. Pushed hard enough, that objective is technically satisfied only when the model outputs a probability of exactly 1 on the correct class, which the softmax function can only ever approach and never fully reach, driving the pre-softmax logits toward larger and larger magnitude the longer training continues. That tendency toward extreme overconfidence turns out to hurt calibration and generalization even when it doesn't hurt training accuracy. <strong>Label smoothing</strong> softens the target itself so the objective is achievable and stops encouraging that runaway confidence.
      </Paragraph>

      <Formula block delay={2.00}>
        {`y_k^{\\text{smooth}} = y_k (1 - \\epsilon) + \\frac{\\epsilon}{K}`}
      </Formula>

      <Paragraph delay={2.05}>
        With <Formula>{`\\epsilon = 0.1`}</Formula> and 10 classes, the correct class's target drops from 1.0 to 0.91, and each of the nine wrong classes gets a target of about 0.01 instead of exactly 0. The model is no longer being asked to output an impossible certainty, just a high but bounded probability, and the small remaining mass on the wrong classes acts as a mild regularizer against the network memorizing training labels too literally. It costs a small amount of peak training accuracy in exchange for a model that tends to generalize a little better and reports probabilities that are less wildly overconfident.
      </Paragraph>

      <Heading level={2} delay={2.10}>
        Multi-task objectives
      </Heading>

      <Paragraph delay={2.15}>
        A model trained on more than one task at once, say a shared vision backbone doing both object classification and bounding-box regression, needs its per-task losses combined into a single number gradient descent can actually optimize. The default approach is a weighted sum.
      </Paragraph>

      <Formula block delay={2.20}>
        {`\\mathcal{L}_{\\text{total}} = \\sum_{t=1}^{T} w_t \\, \\mathcal{L}_t`}
      </Formula>

      <Paragraph delay={2.25}>
        The weights <Formula>{`w_t`}</Formula> look like a minor implementation detail and are actually one of the most consequential choices in the whole setup. Different losses live on completely different natural scales, a classification cross-entropy might sit around 0.5 while a regression MSE on unnormalized pixel coordinates might sit in the thousands, and gradient descent has no idea that's an artifact of units rather than a signal about which task matters more. Left unweighted, the task with the numerically larger loss dominates the combined gradient and the network quietly stops improving on the other task at all, sometimes without any obvious warning sign in the aggregate training loss, which keeps going down the whole time because the dominant task is still improving.
      </Paragraph>

      <Paragraph delay={2.30}>
        Fixing this takes actually watching each task's loss and metric separately during training, not just the combined number, and either rescaling each loss to a comparable range before summing or tuning the weights explicitly against validation performance on every task rather than picking them once and assuming they'll hold. A model that reports a beautifully decreasing total loss while one of its two tasks has been flat for the last several epochs is the textbook symptom of a multi-task objective that was never actually balanced.
      </Paragraph>

      <Heading level={2} delay={2.35}>
        Matching the loss to the metric
      </Heading>

      <Paragraph delay={2.40}>
        Every loss function so far is a proxy. None of them is usually the actual number a business cares about, and the gap between the two is where a lot of quietly broken systems come from. Cross-entropy is a smooth, differentiable stand-in for accuracy, but it's entirely possible for one model to have lower cross-entropy than another while scoring worse on accuracy, since cross-entropy rewards confidence on top of correctness and accuracy doesn't care about confidence at all. A recommendation model trained purely to minimize MSE on predicted ratings can end up with excellent average error and a genuinely bad top-of-list ranking, because MSE spreads its attention evenly across every prediction, while the actual product metric only cares about whichever handful of items get shown first.
      </Paragraph>

      <Paragraph delay={2.45}>
        The fix isn't always a fancier loss. Sometimes it's checking, on real held-out data, whether the proxy loss and the real evaluation metric actually move together as training progresses, and treating any point where they diverge as a signal that the objective is training the model to do something slightly different from what it's actually being judged on. A falling loss curve is only good news if it keeps agreeing with the metric that will eventually decide whether the model shipped.
      </Paragraph>

      <Heading level={2} delay={2.50}>
        Takeaways
      </Heading>

      <List delay={2.55}>
        <ListItem>Cross-entropy rewards confident correctness and is blind to how badly ranked the wrong answers are, which is fine until the evaluation metric cares about that ranking.</ListItem>
        <ListItem>MSE lets one outlier dominate a regression fit, MAE treats every residual proportionally, and Huber blends the two, quadratic near zero, linear past a chosen threshold.</ListItem>
        <ListItem>Focal loss is cross-entropy with an extra dial, down-weighting examples the model already gets right so a rare, hard class isn't drowned out by an easy majority.</ListItem>
        <ListItem>Label smoothing softens a one-hot target so the objective stops rewarding runaway overconfidence, trading a little peak accuracy for better calibration.</ListItem>
        <ListItem>A multi-task loss is a weighted sum, and an unmonitored weight lets whichever task has the numerically larger scale quietly starve every other task of gradient.</ListItem>
      </List>

      <Heading level={2} delay={2.60}>
        Practical tips
      </Heading>

      <List delay={2.65}>
        <ListItem><strong>Plot the loss shape before picking one.</strong> Sketching how a loss responds to a growing residual or a shrinking confidence takes five minutes and reveals exactly which failure mode it invites, worth doing before committing to a training run.</ListItem>
        <ListItem><strong>Track per-task losses separately in a multi-task setup.</strong> A falling combined loss can hide one task that stalled epochs ago, only a per-task view catches it in time to fix.</ListItem>
        <ListItem><strong>Start focal loss's gamma small.</strong> A value of 1 or 2 is usually enough, pushing it much higher can start starving even moderately-hard examples of gradient along with the easy ones.</ListItem>
        <ListItem><strong>Check the loss and the metric against each other on held-out data, not just training data.</strong> Divergence between the two is the earliest warning that the objective is optimizing something adjacent to, rather than identical to, what the model will actually be judged on.</ListItem>
      </List>

      <Paragraph delay={2.70}>
        None of these losses are difficult once written out. The actual craft is noticing, before a training run burns a day of compute, which one of them quietly encodes an assumption the data or the evaluation doesn't share, an outlier that shouldn't dominate a fit, an easy majority that shouldn't drown out a rare class, a second task that shouldn't get starved by the first. That's the whole job of objective design, picking the number the optimizer chases so that chasing it actually produces the thing anyone wanted in the first place. Thanks for reading.
      </Paragraph>
    </>
  ),
};
