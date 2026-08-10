import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  RankedListDiagram,
  RankedItem,
} from "../components";

const rankedItems: RankedItem[] = [
  { rank: 1, label: "Result A", relevance: 3, discount: 1.0, gain: 3.0 },
  { rank: 2, label: "Result B", relevance: 1, discount: 1.585, gain: 0.631 },
  { rank: 3, label: "Result C", relevance: 2, discount: 2.0, gain: 1.0 },
  { rank: 4, label: "Result D", relevance: 3, discount: 2.322, gain: 1.292 },
  { rank: 5, label: "Result E", relevance: 0, discount: 2.585, gain: 0.0 },
];

export const learningToRank: BlogPostData = {
  title: "Learning to Rank",
  date: "August 1, 2026",
  slug: "learning-to-rank",
  content: (
    <>
      <Paragraph delay={0.10}>
        A search engine returns ten results for a query. A feed decides which twenty posts show up first. A shopping site orders a hundred products under "best match." None of these systems are asked to say whether any single item is good. They're asked to put the right items near the top and everything else further down. That's a different problem than the classification and regression tasks most ML courses start with, and treating it like one of those two is exactly how a lot of ranking systems go wrong before they ever reach a user.
      </Paragraph>

      <Paragraph delay={0.15}>
        A regular classifier or regressor is scored example by example. Predict a house price, compare it to the true price, average the errors, done. Every prediction stands on its own. <strong>Ranking</strong> throws that independence away. A model scoring search results is judged on the order those scores induce across an entire list returned for one query, not on whether any individual score was numerically close to some ground truth value. A model can assign every item a wildly wrong absolute score and still be a perfect ranker, as long as the relative order between items comes out right. Flip that around and a model can nail every individual score almost exactly and still rank badly, if the tiny errors happen to land in a way that flips the order of two items that matter. Getting relative order right, for one query or one user at a time, is the entire job. <strong>Learning to rank</strong> is the name for the family of techniques built around that fact.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What the training data actually looks like
      </Heading>

      <Paragraph delay={0.25}>
        Before any model, there's a question of what "correct" even means for a ranked list. The clean answer is a relevance label attached to each query-item pair. A common scheme uses a graded scale, say 0 through 4, where 0 means irrelevant, 2 means somewhat relevant, and 4 means a perfect match. Binary labels (relevant or not, clicked or not) are a special case of this with only two rungs on the ladder. Graded labels carry more information, a model can learn that beating an irrelevant result by a mile matters less than beating a decent result by a little, which a binary label can't express at all.
      </Paragraph>

      <Paragraph delay={0.30}>
        Where do these labels come from in practice? There are two very different pipelines, and they fail in different ways. <strong>Explicit judgments</strong> come from human raters shown a query and a candidate result, asked to assign a relevance grade using a fixed rubric. These are expensive and slow to collect at scale, but they're clean, a rater judging "somewhat relevant" isn't confusing relevance with what happened to be at the top of the page. <strong>Implicit signals</strong>, mainly clicks, are nearly free and arrive by the billions from ordinary usage, but a click is a noisy proxy for relevance at best. A user clicks the second result because the first one's snippet looked boring, not because the second one was actually more relevant. A user doesn't click anything because none of the top few results were good enough to be worth the click, not because nothing in the whole result set was relevant. Real systems typically blend both, explicit judgments for a clean evaluation set, implicit clicks for the volume needed to train at all, with real effort spent correcting the biases the clicks bring along.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Pointwise, pairwise, and listwise, three ways to turn labels into a loss
      </Heading>

      <Paragraph delay={0.40}>
        Once labeled query-item pairs exist, there's a genuine choice in how to turn them into something a model can be trained on, and the three standard families differ in exactly how much of the list structure they're willing to look at.
      </Paragraph>

      <Paragraph delay={0.45}>
        The <strong>pointwise</strong> approach is the most tempting because it needs nothing new. Treat each query-item pair's relevance label as an independent regression or classification target, ignore that it came from a list at all, and train an ordinary model to predict that label from features of the query and the item. It's simple, it reuses every tool a regular supervised learning pipeline already has, and it's genuinely a reasonable baseline. The problem is exactly the gap described above: the model is being optimized to get individual scores close to their labels, and nothing in that objective cares whether two items end up in the right relative order. A model can have a lower average error and a worse ranking than a model with a higher average error, and a pointwise loss has no way to notice.
      </Paragraph>

      <Paragraph delay={0.50}>
        The <strong>pairwise</strong> approach moves one step closer to the actual task by training on pairs instead of single items. For every pair where one item is known to be more relevant than another for the same query, the model is pushed to score the more relevant one higher, and the loss is a direct penalty on the pairwise order being wrong, not on either item's absolute score. RankNet is the reference example here. It turns the score difference between two items into a probability that item A should rank above item B, using a logistic function, then trains with a cross-entropy-style loss on how far that predicted probability sits from the actual known preference. Get every pair's relative order right and the exact numeric scores stop mattering, which is precisely the property a ranking loss should have that a pointwise loss doesn't.
      </Paragraph>

      <Formula block delay={0.55}>
        {`P(i \\succ j) = \\sigma(s_i - s_j), \\qquad \\mathcal{L} = -\\bar{P}_{ij}\\log P(i \\succ j) - (1-\\bar{P}_{ij})\\log\\big(1 - P(i \\succ j)\\big)`}
      </Formula>

      <Paragraph delay={0.60}>
        Here <Formula>{`s_i`}</Formula> and <Formula>{`s_j`}</Formula> are the model's scores for items <Formula>{`i`}</Formula> and <Formula>{`j`}</Formula>, <Formula>{`\\sigma`}</Formula> is the logistic function, and <Formula>{`\\bar{P}_{ij}`}</Formula> is the known target probability that <Formula>{`i`}</Formula> should outrank <Formula>{`j`}</Formula>, usually just 1 or 0 when the labels give a clear preference. The number of pairs to consider grows quadratically with list length, which is the main practical cost of moving from pointwise to pairwise, and it's why real systems sample a manageable subset of pairs rather than enumerating every one.
      </Paragraph>

      <Paragraph delay={0.65}>
        The <strong>listwise</strong> approach goes one step further still, defining a loss directly over the entire ranked list produced for a query rather than over individual items or pairs. Instead of asking "is this one pair in the right order," it asks something closer to "how good is this entire permutation," often by building a loss that approximates a ranking metric like the one covered next, or by treating the whole list as a single probability distribution over possible orderings and optimizing that directly. Listwise methods tend to line up best with what a ranking system is ultimately evaluated on, at the cost of being the most complex to implement and optimize. Most production systems land somewhere between pairwise and listwise in practice, the added complexity of a fully listwise loss only pays for itself once the simpler options are clearly leaving performance on the table.
      </Paragraph>

      <Heading level={2} delay={0.70}>
        NDCG, and why position matters
      </Heading>

      <Paragraph delay={0.75}>
        None of this is worth anything without a way to measure whether a ranking is actually good, and the standard metric encodes something the pointwise loss above was missing entirely, position matters. A relevant result sitting at rank one is worth far more than the same relevant result buried at rank fifty, because almost nobody scrolls that far. <strong>Discounted Cumulative Gain</strong> (DCG) builds that intuition directly into a formula, summing each item's relevance but discounting it more heavily the further down the list it sits.
      </Paragraph>

      <Formula block delay={0.80}>
        {`\\text{DCG}@k = \\sum_{i=1}^{k} \\frac{\\text{rel}_i}{\\log_2(i+1)}`}
      </Formula>

      <Paragraph delay={0.85}>
        <Formula>{`\\text{rel}_i`}</Formula> is the graded relevance label of the item at rank <Formula>{`i`}</Formula>, and the denominator is the position discount: <Formula>{`\\log_2(2) = 1`}</Formula> at rank one, growing slowly as rank increases. So a highly relevant item near the top contributes almost its full relevance score, while the same item near the bottom of the list contributes only a fraction of it. DCG alone isn't comparable across different queries, though. A query with more relevant results available will naturally rack up a bigger DCG than a query with only one or two relevant results, no matter how good the ranking is. <strong>Normalized DCG</strong> (NDCG) fixes that by dividing the actual DCG by the best possible DCG for that same set of items, the DCG achieved by sorting them in the ideal order.
      </Paragraph>

      <Formula block delay={0.90}>
        {`\\text{NDCG}@k = \\frac{\\text{DCG}@k}{\\text{IDCG}@k}`}
      </Formula>

      <Paragraph delay={0.95}>
        NDCG always lands between 0 and 1, with 1 meaning the ranking already achieved is the best possible ordering of exactly those items, which makes it comparable across queries with completely different numbers of relevant results. A small worked example makes the mechanics concrete. Take five ranked results with relevance labels <Formula>{`3, 1, 2, 3, 0`}</Formula> in that order.
      </Paragraph>

      <RankedListDiagram
        delay={0.06}
        items={rankedItems}
        dcg={5.923}
        idcg={6.323}
        ndcg={0.937}
        caption="Figure 1: A five-item ranked list with graded relevance labels 3, 1, 2, 3, 0. Each rank's discount shrinks the further down the list it sits, and the discounted gains sum to a DCG of 5.923 against an ideal DCG of 6.323, an NDCG of 0.937."
      />

      <Paragraph delay={1.00}>
        Sorting those same five relevance labels into the best possible order gives <Formula>{`3, 3, 2, 1, 0`}</Formula>, whose DCG is the IDCG used above. The actual list only loses ground because the second 3 landed at rank four instead of rank two. Everything else about the multiset of relevance labels is identical between the two orderings. That single swap is the entire gap between an NDCG of 0.937 and a perfect 1.0, which is exactly the kind of thing a pointwise loss, scoring each item in isolation, has no mechanism to penalize directly.
      </Paragraph>

      <CodeBlock
        delay={1.05}
        language="Python"
        code={`import math

rels = [3, 1, 2, 3, 0]

def dcg(rels):
    return sum(rel / math.log2(i + 2) for i, rel in enumerate(rels))

d = dcg(rels)
idcg = dcg(sorted(rels, reverse=True))
ndcg = d / idcg

print(round(d, 3))     # 5.923
print(round(idcg, 3))  # 6.323
print(round(ndcg, 3))  # 0.937`}
      />

      <Heading level={2} delay={1.10}>
        MAP and MRR, the same idea for narrower questions
      </Heading>

      <Paragraph delay={1.15}>
        NDCG is the workhorse metric because it handles graded relevance directly, but two older metrics still show up constantly, especially when relevance is effectively binary. <strong>Mean Reciprocal Rank</strong> (MRR) cares about exactly one thing, how far down the list the first relevant result appears, averaged across queries. A query whose first relevant result sits at rank one contributes a reciprocal rank of 1, at rank three it contributes <Formula>{`1/3`}</Formula>, and so on. Three queries with first-relevant-result ranks of 1, 3, and 2 give an MRR of <Formula>{`(1/1 + 1/3 + 1/2)/3 \\approx 0.611`}</Formula>. It's the right metric when a user only ever needs one good answer, a "did you mean" suggestion or a single factual lookup. <strong>Mean Average Precision</strong> (MAP) instead averages precision at every rank where a relevant result actually appears, then averages that across queries, which rewards a ranking for surfacing several relevant results early rather than just the first one. Both are simpler than NDCG, and both leave real information on the table when relevance is genuinely graded rather than binary, which is why NDCG is usually the metric an actual ranking model gets tuned against.
      </Paragraph>

      <Heading level={2} delay={1.20}>
        Position bias, why raw clicks lie about relevance
      </Heading>

      <Paragraph delay={1.25}>
        Implicit click data comes back to cause trouble again here. Users don't scan a ranked list top to bottom with equal attention at every position. The top few results get looked at, clicked on, and trusted far more than results further down, almost regardless of how relevant those lower results actually are. This is <strong>position bias</strong>, and it's not a minor statistical footnote. It directly contaminates naive click-based training labels. Swap the same set of results into a different order and the top slot will collect more clicks than it did before, purely because it's now the top slot, not because anything about the underlying relevance changed. A model trained on raw click counts as if they were unbiased relevance labels ends up learning to reinforce whatever ordering produced those clicks in the first place, which is exactly backwards: it entrenches the current ranking rather than improving it.
      </Paragraph>

      <Paragraph delay={1.30}>
        Correcting for this usually means modeling the bias explicitly rather than ignoring it. One common approach estimates a position-dependent "propensity" of being examined at all, roughly the probability a user even looks at rank <Formula>{`i`}</Formula> before clicking anything, often from randomized experiments that shuffle results and observe how click rates change with position alone. Click labels are then reweighted by the inverse of that propensity before being used as training signal, so a click at a heavily-skipped low rank counts for more than a click at a rank that gets looked at almost automatically. None of this makes click data as clean as a human relevance judgment, but it keeps a ranking model from just learning to defend its own past decisions.
      </Paragraph>

      <Heading level={2} delay={1.35}>
        Negative sampling, because most items were never seen at all
      </Heading>

      <Paragraph delay={1.40}>
        A related practical problem shows up the moment training moves from pairwise or listwise labels back to the scale real systems operate at. For any given query, a catalog might hold millions of candidate items, and a user only ever saw and didn't click a tiny handful of them. The rest were never shown at all. Training pairwise or listwise losses in principle wants negative examples, items the model should learn to score lower than the positives, but treating every unclicked item in the entire catalog as a confirmed negative is both computationally infeasible and statistically wrong, most of those items were never given the chance to be clicked in the first place.
      </Paragraph>

      <Paragraph delay={1.45}>
        <strong>Negative sampling</strong> is the practical fix, drawing a manageable subset of negatives per positive example instead of using every possible one. The simplest version samples uniformly at random from the catalog, which is cheap but tends to produce easy negatives a model learns to reject almost immediately, offering little useful gradient signal. A more effective version samples negatives that already scored reasonably high under the current model, or that share obvious surface features with the positive, forcing the model to learn a finer distinction than "totally unrelated item versus the right one." This mirrors the same tradeoff that shows up anywhere a model is trained to distinguish a positive from a much larger space of unlabeled candidates: easy negatives are cheap and largely wasted, while hard negatives cost more to find and carry most of the actual learning signal.
      </Paragraph>

      <Heading level={2} delay={1.50}>
        Calibration, a good ranking with meaningless scores
      </Heading>

      <Paragraph delay={1.55}>
        One more gap is easy to miss once a ranking model is doing well by NDCG. A ranking loss, pairwise or listwise, only ever cares about relative order, never about what any individual score actually means in absolute terms. That leaves plenty of room for a model to produce a perfectly good ranking using scores that aren't meaningful probabilities of relevance, or of a click, or of a purchase, at all. Two items sitting three ranks apart might have scores of 4.1 and 4.0, or 4.1 and 0.3, and a pairwise loss is equally happy either way as long as the order is right. That's a real problem the moment a downstream system wants to do more than just sort. Filtering out anything below some absolute score threshold, or blending a ranking score with a separate signal like predicted revenue, both need the raw score to mean something on its own, not just to sort correctly relative to its neighbors. The fix looks like the same calibration problem that shows up anywhere a model's raw output gets treated as a probability it was never actually trained to produce. A separate calibration step is fit on top of the ranking model's scores, often a simple monotonic transform, so the order the ranker already got right is preserved while the numbers attached to it become something closer to an honest probability.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        Offline metrics and the metric the business actually cares about
      </Heading>

      <Paragraph delay={1.65}>
        A model can win decisively on offline NDCG, evaluated against a held-out set of relevance judgments, and still lose when it's actually shipped and measured against whatever number the business cares about, revenue per session, time spent, completed purchases, next-day retention. Offline metrics are computed against a fixed, historical set of labels and a fixed set of candidates. But a live ranking change alters user behavior itself, what gets clicked, what gets purchased, how a session unfolds afterward, in ways a static offline evaluation can't see coming. A ranker that nudges slightly more diverse or slightly less obviously "safe" results toward the top might score a hair lower on NDCG against old relevance judgments while genuinely improving what users do once it's live. The reverse happens just as often too, a model that overfits to the exact judgments in an offline set without actually helping real sessions. This is the entire reason ranking changes at any real scale get shipped through an online experiment before anyone trusts the offline number alone. Offline metrics are a fast, cheap proxy for iterating quickly, not a substitute for measuring the thing that actually matters.
      </Paragraph>

      <Heading level={2} delay={1.70}>
        Takeaways
      </Heading>

      <List delay={1.75}>
        <ListItem>Ranking is judged by relative order within a list for one query, not by whether each item's isolated score is numerically accurate, which is exactly what a pointwise loss fails to capture.</ListItem>
        <ListItem>Pointwise, pairwise, and listwise losses trade simplicity for how directly they optimize the thing a ranker is actually evaluated on, with pairwise (RankNet-style) landing as the common practical middle ground.</ListItem>
        <ListItem>NDCG discounts relevance by position and normalizes against the best possible ordering, making it comparable across queries with different numbers of relevant results, unlike raw DCG.</ListItem>
        <ListItem>Position bias means raw clicks overweight whatever already sits at the top, and training on them without correction just entrenches the current ranking rather than improving it.</ListItem>
        <ListItem>A model can win on offline NDCG and still lose on the business metric that actually matters, which is why ranking changes get validated online, not just against a fixed offline label set.</ListItem>
      </List>

      <Paragraph delay={1.80}>
        Everything here traces back to the same starting fact, a ranking system is judged on an ordering, not on a collection of independent predictions, and every piece downstream of that, the loss function, the metric, the label collection strategy, the bias correction, exists because that one structural difference from ordinary supervised learning refuses to go away quietly. Thanks for reading.
      </Paragraph>
    </>
  ),
};
