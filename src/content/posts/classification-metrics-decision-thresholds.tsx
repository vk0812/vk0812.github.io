import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  ConfusionMatrixGrid,
  ThresholdSweepDiagram,
} from "../components";
const spamMatrix = {
  positiveLabel: "Spam",
  negativeLabel: "Legit",
  tp: 40,
  fp: 20,
  fn: 10,
  tn: 30,
};

export const classificationMetricsDecisionThresholds: BlogPostData = {
  title: "Classification Metrics and Decision Thresholds",
  date: "August 1, 2026",
  slug: "classification-metrics-decision-thresholds",
  content: (
    <>
      <Paragraph delay={0.10}>
        A screening test for a disease that affects 1 in 200 people can report 99.5% accuracy without learning anything at all. Predict "negative" for every single patient, and the test is right 199 times out of 200, purely because negative is what almost everyone actually is. The number looks great on a slide and says nothing about whether the test catches the one person in 200 who's actually sick, which is the entire reason the test exists.
      </Paragraph>

      <Paragraph delay={0.15}>
        That gap between "the model got a high score" and "the model does the thing it was built for" is where classification evaluation actually lives. Accuracy is one summary of a much richer object, the confusion matrix, and most of the metrics built on top of it exist to answer a more specific question than "how often is this model right."
      </Paragraph>

      <Heading level={2} delay={0.20}>
        The confusion matrix
      </Heading>

      <Paragraph delay={0.25}>
        Every binary classifier's predictions on a labeled test set can be sorted into exactly four buckets, depending on what the model predicted and what the label actually was. A <strong>true positive</strong> is a positive example correctly flagged as positive. A <strong>true negative</strong> is a negative example correctly left alone. A <strong>false positive</strong> is a negative example the model wrongly flagged, and a <strong>false negative</strong> is a positive example the model wrongly let through. Every metric in this post is arithmetic performed on those four counts.
      </Paragraph>

      <Paragraph delay={0.30}>
        Take a spam filter checked against 100 test emails, 50 of them actually spam and 50 legitimate. The filter flags 60 emails as spam, and of those, 40 really are spam and 20 are legitimate mail caught by mistake. Of the 40 legitimate emails it leaves alone, 30 are correctly left alone and 10 are spam that slipped through.
      </Paragraph>

      <ConfusionMatrixGrid
        matrix={spamMatrix}
        delay={0.06}
        caption="A worked confusion matrix for the spam filter above. Precision, recall, specificity, accuracy, and F1 are all computed directly from the four counts."
      />

      <Paragraph delay={0.35}>
        <strong>Precision</strong> asks, of everything the model flagged as positive, how much actually was. <strong>Recall</strong> (also called sensitivity or the true positive rate) asks the opposite question, of everything that actually was positive, how much did the model catch.
      </Paragraph>

      <Formula block delay={0.40}>
        {`\\text{Precision} = \\frac{TP}{TP + FP}, \\qquad \\text{Recall} = \\frac{TP}{TP + FN}`}
      </Formula>

      <Paragraph delay={0.45}>
        For the spam filter, precision is <Formula>{`40/60 \\approx 66.7\\%`}</Formula>, two out of every three flagged emails really are spam. Recall is <Formula>{`40/50 = 80\\%`}</Formula>, the filter catches 8 out of 10 actual spam emails. Those two numbers can move in opposite directions, a filter that flags every single email gets 100% recall (nothing spam slips through) and terrible precision (almost everything flagged is legitimate mail caught in the net).
      </Paragraph>

      <Paragraph delay={0.50}>
        <strong>Specificity</strong> is recall's mirror image on the negative class, of everything that actually was negative, how much did the model correctly leave alone.
      </Paragraph>

      <Formula block delay={0.55}>
        {`\\text{Specificity} = \\frac{TN}{TN + FP} = 30/50 = 60\\%`}
      </Formula>

      <Paragraph delay={0.60}>
        Accuracy, the ratio everyone reaches for first, is <Formula>{`(TP+TN)/(TP+TN+FP+FN) = 70/100 = 70\\%`}</Formula> here. It treats a false positive and a false negative as equally bad and folds both classes into one number, which is exactly why it goes misleading the moment one class dominates the data, as the disease-screening example at the top showed.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        F1 and F-beta, one number that keeps both honest
      </Heading>

      <Paragraph delay={0.70}>
        Precision and recall trade off against each other, and reporting only one invites gaming it, a model can chase perfect recall by flagging everything, or perfect precision by flagging almost nothing. The <strong>F1 score</strong> is the harmonic mean of the two, which only stays high when both stay high.
      </Paragraph>

      <Formula block delay={0.75}>
        {`F_1 = \\frac{2 \\cdot \\text{Precision} \\cdot \\text{Recall}}{\\text{Precision} + \\text{Recall}}`}
      </Formula>

      <Paragraph delay={0.80}>
        For the spam filter, <Formula>{`F_1 = 2(0.667)(0.8) / (0.667+0.8) \\approx 72.7\\%`}</Formula>. The harmonic mean is what makes this punishing, unlike a plain average, it stays close to whichever of the two numbers is smaller, so a model can't inflate its F1 by being excellent at one and mediocre at the other.
      </Paragraph>

      <Paragraph delay={0.85}>
        F1 quietly assumes precision and recall matter equally, which isn't always true. <strong>F-beta</strong> generalizes it with a weight, <Formula>{`\\beta`}</Formula>, that says how many times more recall matters than precision.
      </Paragraph>

      <Formula block delay={0.90}>
        {`F_\\beta = \\frac{(1+\\beta^2) \\cdot \\text{Precision} \\cdot \\text{Recall}}{\\beta^2 \\cdot \\text{Precision} + \\text{Recall}}`}
      </Formula>

      <Paragraph delay={0.95}>
        Setting <Formula>{`\\beta = 2`}</Formula> weights recall twice as heavily as precision, the natural choice for a disease-screening model where missing a sick patient is far worse than an unnecessary follow-up test. On the spam numbers, <Formula>{`F_2 \\approx 76.9\\%`}</Formula>, higher than F1 because recall (80%) is already the better of the two numbers here and F2 leans into it. Going the other way, <Formula>{`\\beta = 0.5`}</Formula> weights precision more heavily, the natural choice when a false positive is the expensive mistake, flagging a legitimate transaction as fraud and annoying a customer, say, rather than the false negative.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        The threshold behind every one of these numbers
      </Heading>

      <Paragraph delay={1.05}>
        None of the numbers above are properties of the model alone. A classifier that outputs a probability, logistic regression, a gradient-boosted tree, a neural net with a sigmoid or softmax head, produces a continuous score between 0 and 1. Turning that score into a "positive" or "negative" label means picking a cutoff, and every cell in the confusion matrix depends on where that cutoff sits. Raise the threshold and false positives drop but false negatives climb, since the model gets pickier about what it calls positive. Lower it and the opposite happens. Precision, recall, specificity, F1, all of them are functions of the threshold, not fixed facts about the model, and quoting one without saying which threshold it was measured at is only telling half the story.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        ROC curves and AUC
      </Heading>

      <Paragraph delay={1.15}>
        A <strong>ROC curve</strong> (receiver operating characteristic) sidesteps picking one threshold by plotting what happens across all of them. The x-axis is the false positive rate, <Formula>{`FPR = FP/(FP+TN) = 1 - \\text{Specificity}`}</Formula>, and the y-axis is the true positive rate, which is just recall. Sweep the threshold from 1 down to 0 and trace out the resulting <Formula>{`(FPR, TPR)`}</Formula> pairs, and that trace is the curve. A model that ranks purely by chance produces the diagonal line, a perfect model hugs the top-left corner, catching every positive with zero false alarms.
      </Paragraph>

      <Paragraph delay={1.20}>
        <strong>ROC-AUC</strong>, the area under that curve, has a clean interpretation that doesn't depend on any threshold at all. It's the probability that a randomly chosen positive example gets a higher score than a randomly chosen negative one. An AUC of 1.0 means the model always ranks positives above negatives, and 0.5 means it ranks them no better than a coin flip.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        Why PR curves tell a different story under imbalance
      </Heading>

      <Paragraph delay={1.30}>
        ROC-AUC has a blind spot, and it's the same one that makes plain accuracy misleading, the false positive rate is measured against the negative class, and when negatives vastly outnumber positives, a false-positive count that swamps the tiny positive class barely moves the FPR at all. A <strong>precision-recall curve</strong> plots precision against recall instead, and precision is measured against everything the model actually flagged, positive class size included directly in the denominator. That makes it far more sensitive to what a rare positive class does to real-world usability.
      </Paragraph>

      <Paragraph delay={1.35}>
        A logistic regression fit on a synthetic dataset with a 1.49% positive rate (10,000 rows, roughly the base rate of a real fraud or rare-disease problem) makes the gap concrete. Scored on a held-out set of 3,000 examples with 45 positives, the model's ROC-AUC comes out to <Formula>{`0.783`}</Formula>, a number that reads as "reasonably good" on its own. Its PR-AUC is <Formula>{`0.089`}</Formula>, barely six times the 1.49% a model that flagged everyone at random would score.
      </Paragraph>

      <CodeBlock
        delay={1.40}
        language="Python"
        code={`import numpy as np
from sklearn.datasets import make_classification
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import roc_auc_score, average_precision_score

X, y = make_classification(n_samples=10000, n_features=10, n_informative=5,
                            weights=[0.99, 0.01], flip_y=0.01, random_state=0)
print(y.mean())  # 0.0149, a ~1.5% positive rate

Xtr, Xte, ytr, yte = train_test_split(X, y, test_size=0.3, random_state=0, stratify=y)
clf = LogisticRegression(max_iter=1000).fit(Xtr, ytr)
scores = clf.predict_proba(Xte)[:, 1]

print(roc_auc_score(yte, scores))         # 0.783
print(average_precision_score(yte, scores))  # 0.089 (this is PR-AUC)`}
      />

      <Paragraph delay={1.45}>
        Sweeping the threshold makes the practical cost of that gap obvious. To catch 80% of the actual positives, the threshold has to drop low enough that precision falls to about <Formula>{`2.2\\%`}</Formula>, meaning fewer than one in forty of everything flagged at that cutoff is a real positive. The ROC curve barely registers this, at that same point the false positive rate is only around 0.50, which sounds moderate until it's translated back through a class that outnumbers the positives roughly 65 to 1.
      </Paragraph>

      <ThresholdSweepDiagram
        delay={0.08}
        caption="The same threshold sweep, plotted as a ROC curve and a PR curve side by side. The ROC curve still looks respectable at 0.78 AUC while the PR curve hugs the bottom of the plot, the effect of a 1.5% positive rate on precision as the threshold loosens."
      />

      <Paragraph delay={1.50}>
        The takeaway isn't that ROC-AUC is wrong, it's answering a real question (how well does the model rank positives above negatives), just not the question "will this be usable in production when positives are rare." PR-AUC, and the PR curve behind it, is the metric to reach for whenever the positive class is a small fraction of the data, fraud, churn, rare disease, defect detection, anything where "flag everyone" isn't a serious option but naive threshold tuning can accidentally get close to it.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        Top-k accuracy, for when there's more than one guess
      </Heading>

      <Paragraph delay={1.60}>
        Plain accuracy assumes the model gets exactly one guess, useful for a binary spam filter, less useful for a model ranking many classes or many candidates, a search engine's top results, a product recommender, an image classifier choosing among a thousand categories. <strong>Top-k accuracy</strong> counts a prediction correct if the true label is anywhere in the model's top <Formula>{`k`}</Formula> ranked guesses, not just its single best one.
      </Paragraph>

      <CodeBlock
        delay={1.65}
        language="Python"
        code={`from sklearn.metrics import top_k_accuracy_score

# 8 examples, 5 possible classes, probs is one row of class probabilities per example
top1 = top_k_accuracy_score(y_true, probs, k=1, labels=[0, 1, 2, 3, 4])
top2 = top_k_accuracy_score(y_true, probs, k=2, labels=[0, 1, 2, 3, 4])
top3 = top_k_accuracy_score(y_true, probs, k=3, labels=[0, 1, 2, 3, 4])
print(top1, top2, top3)  # 0.75  0.875  0.875`}
      />

      <Paragraph delay={1.70}>
        Top-1 accuracy on this small example is 75%, but top-2 jumps to 87.5%, meaning most of the model's misses had the right answer sitting in second place rather than nowhere near the ranking at all. That distinction matters a lot in practice, a recommender that's usually one slot away from correct is in a completely different state of health than one whose errors are actually unrelated to the right answer, even though a plain top-1 accuracy score can't tell them apart.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Micro versus macro averaging
      </Heading>

      <Paragraph delay={1.80}>
        Multi-class problems raise a question binary ones don't, once precision or recall is computed separately for each class, how should those per-class numbers combine into one overall score. <strong>Macro averaging</strong> takes the plain, unweighted mean across classes, every class counts equally regardless of how common it is. <strong>Micro averaging</strong> pools every true positive, false positive, and false negative across all classes first and computes precision and recall once on the totals, so common classes dominate the result in proportion to how much data they actually have.
      </Paragraph>

      <Paragraph delay={1.85}>
        A three-class example with 90 examples of a common class and 7 and 3 examples of two rare ones shows how far apart these can land. The model is excellent on the common class, decent on the medium one, and gets only 1 of 3 right on the rarest.
      </Paragraph>

      <CodeBlock
        delay={1.90}
        language="Python"
        code={`from sklearn.metrics import precision_score, recall_score

# 90 examples of class 0, 7 of class 1, 3 of class 2
print(precision_score(y_true, y_pred, average=None))  # [0.957, 0.714, 1.0]
print(recall_score(y_true, y_pred, average=None))     # [0.978, 0.714, 0.333]

print(precision_score(y_true, y_pred, average="macro"))  # 0.890
print(recall_score(y_true, y_pred, average="macro"))     # 0.675

print(precision_score(y_true, y_pred, average="micro"))  # 0.94
print(recall_score(y_true, y_pred, average="micro"))      # 0.94`}
      />

      <Paragraph delay={1.95}>
        Micro-averaged recall of 94% looks strong, but it's really just accuracy in disguise once every class gets pooled, and it's almost entirely driven by the 90-example class the model handles well. Macro-averaged recall of 67.5% tells the truer story about the rare class, one-third recall on the smallest class drags the unweighted average down hard, exactly the kind of failure micro averaging buries. When class counts are wildly uneven and the rare class actually matters, which it usually does since rare classes are so often the interesting ones (fraud, a rare disease subtype, a safety-critical failure mode), macro averaging is the one that won't quietly hide the problem.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        Choosing a threshold from actual costs
      </Heading>

      <Paragraph delay={2.05}>
        Every threshold trades false positives against false negatives, and 0.5 is only correct when both mistakes cost the same. When they don't, the right cutoff comes from an actual cost, not a default. Assign a cost <Formula>{`c_{FP}`}</Formula> to a false positive and <Formula>{`c_{FN}`}</Formula> to a false negative, and the threshold that minimizes expected cost on a well-calibrated model's probability output has a clean closed form.
      </Paragraph>

      <Formula block delay={2.10}>
        {`t^* = \\frac{c_{FP}}{c_{FP} + c_{FN}}`}
      </Formula>

      <Paragraph delay={2.15}>
        Predict positive whenever the model's output exceeds <Formula>{`t^*`}</Formula>. A fraud model where a missed fraud costs 500 dollars and an unnecessary manual review costs 5 dollars gets <Formula>{`t^* = 5/(5+500) \\approx 1\\%`}</Formula>, an extremely low bar for flagging a transaction, which is exactly the right call when missing fraud is a hundred times more expensive than a false alarm. A different problem where the two mistakes cost about the same lands back near 0.5. The formula makes the earlier ROC-versus-PR discussion concrete, the model's ranking of examples (what ROC-AUC and PR-AUC measure) is fixed once training is done, but the threshold applied on top of that ranking is a business decision, not a modeling one, and it should move with the actual dollar figures rather than stay parked at the default.
      </Paragraph>

      <Heading level={2} delay={2.20}>
        Takeaways
      </Heading>

      <List delay={2.25}>
        <ListItem>Accuracy folds both classes into one number and goes misleading fast under class imbalance, the confusion matrix's four raw counts are the more honest starting point.</ListItem>
        <ListItem>Precision and recall trade off against each other, F1 is their harmonic mean, and F-beta lets that trade-off lean toward whichever error is actually more expensive.</ListItem>
        <ListItem>Precision, recall, and every metric built from them are functions of a decision threshold, not fixed properties of a model, quoting one without the threshold is an incomplete claim.</ListItem>
        <ListItem>ROC-AUC and PR-AUC can disagree sharply under class imbalance, PR-AUC is the more honest read whenever the positive class is rare.</ListItem>
        <ListItem>Micro averaging is dominated by common classes and can hide a rare class in trouble, macro averaging treats every class equally and surfaces exactly that failure.</ListItem>
      </List>

      <Paragraph delay={2.30}>
        None of these metrics are competing for the title of "the one true score." Each one answers a narrower question than it looks like it does, and the job is picking the one that actually matches what the model has to do in production, then setting the threshold to match what a mistake in either direction really costs. Thanks for reading.
      </Paragraph>
    </>
  ),
};
