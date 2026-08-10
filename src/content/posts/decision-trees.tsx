import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  DecisionTreeDiagram,
} from "../components";

export const decisionTrees: BlogPostData = {
  title: "Decision Trees",
  date: "August 1, 2026",
  slug: "decision-trees",
  content: (
    <>
      <Paragraph delay={0.10}>
        A support ticket comes in and gets routed by a chain of yes-or-no questions. Is the customer on a paid plan? Did they mention "refund"? Is the account older than thirty days? Follow enough of these branches and the ticket lands in exactly one bucket, escalate, auto-reply, or hand to billing. Nobody wrote that flowchart by hand. A model learned which questions to ask, in which order, directly from a pile of past tickets and how each one was actually resolved. That model is a <strong>decision tree</strong>, and the flowchart is a fair mental picture of what it looks like inside.
      </Paragraph>

      <Paragraph delay={0.15}>
        Every prediction a tree makes comes from walking down one of these question chains until there's nowhere left to go. What makes the whole thing interesting is not the walking. It's how the tree decides which question to ask at each fork, and that turns out to rest on a small, checkable piece of arithmetic repeated over and over.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Carving up the feature space
      </Heading>

      <Paragraph delay={0.25}>
        Picture the training data as points scattered across a plane, one axis per feature. A <strong>decision tree</strong> builds its predictions by repeatedly slicing that plane with a straight cut. Each cut is always parallel to one of the axes, and always answers a single question, like "is hours studied greater than 3.5." Each cut splits whatever region it's applied to into two smaller rectangular regions. Do this recursively, cutting each new region again and again, and the whole feature space ends up carved into a patchwork of non-overlapping rectangles. Every point that lands inside the same rectangle gets the same prediction: the majority class for classification, or the average target value for regression.
      </Paragraph>

      <Paragraph delay={0.30}>
        That's the entire structure. A tree isn't fitting a curve or a weighted sum of features the way a linear model does. It's answering a sequence of threshold questions and reporting whatever the training examples in the resulting region mostly looked like. The mechanism that decides which question to ask, and where to put the threshold, is what the rest of this post is about.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        A tiny dataset to split
      </Heading>

      <Paragraph delay={0.40}>
        Take eight students, each with one feature (hours studied) and one label (pass or fail on a quiz).
      </Paragraph>

      <CodeBlock
        delay={0.45}
        language="Python"
        code={`hours =  [1, 2, 3, 4, 5, 6, 7, 8]
result = ["fail", "fail", "fail", "pass", "fail", "pass", "pass", "pass"]`}
      />

      <Paragraph delay={0.50}>
        Four passed, four failed. Before any split happens, a node needs a number that captures how mixed its labels currently are, so the tree has something to improve on. That number is called <strong>impurity</strong>, and there are two common ways to compute it.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        Entropy and Gini impurity
      </Heading>

      <Paragraph delay={0.60}>
        <strong>Entropy</strong>, borrowed straight from information theory, measures how unpredictable a label is at a node. For a node with class proportions <Formula>{`p_1, \\dots, p_k`}</Formula>, entropy is
      </Paragraph>

      <Formula block delay={0.65}>
        {`H = -\\sum_{i=1}^{k} p_i \\log_2 p_i`}
      </Formula>

      <Paragraph delay={0.70}>
        It's zero when every example at a node shares the same label (nothing left to be uncertain about), and it reaches its maximum when classes are perfectly balanced. <strong>Gini impurity</strong> asks a closely related question in a slightly different way: roughly, "if a random example were labeled according to the node's class proportions instead of its true label, how often would that guess be wrong."
      </Paragraph>

      <Formula block delay={0.75}>
        {`G = 1 - \\sum_{i=1}^{k} p_i^2`}
      </Formula>

      <Paragraph delay={0.80}>
        Both hit their floor at a pure node and their ceiling at a perfectly balanced one, and in practice they pick nearly identical splits almost all the time. Gini is a hair cheaper to compute since it skips the logarithm, which is the main reason many libraries default to it, but neither is "more correct" than the other.
      </Paragraph>

      <Paragraph delay={0.85}>
        For the eight students, the root node has four pass and four fail, so both proportions are exactly a half.
      </Paragraph>

      <CodeBlock
        delay={0.90}
        language="Python"
        code={`import math

def entropy(counts):
    n = sum(counts)
    e = 0.0
    for c in counts:
        if c == 0:
            continue
        p = c / n
        e -= p * math.log2(p)
    return e

def gini(counts):
    n = sum(counts)
    g = 1.0
    for c in counts:
        p = c / n
        g -= p * p
    return g

parent = [4, 4]  # pass, fail
print(entropy(parent), gini(parent))
# 1.0  0.5`}
      />

      <Paragraph delay={0.95}>
        Entropy comes out to exactly <Formula>{`1.0`}</Formula> bit, and Gini to exactly <Formula>{`0.5`}</Formula>, both sitting at their ceiling. That makes sense: a node split evenly between two classes is as uncertain as it can possibly be. Now try the candidate split "hours studied greater than 3.5." Three students land on the low side, all three failed. Five land on the high side, four passed and one failed.
      </Paragraph>

      <CodeBlock
        delay={1.00}
        language="Python"
        code={`left  = [0, 3]  # pass, fail, hours <= 3.5
right = [4, 1]  # pass, fail, hours > 3.5

print(entropy(left), gini(left))    # 0.0  0.0
print(entropy(right), gini(right))  # 0.7219280948873623  0.32

n, n_left, n_right = 8, 3, 5
weighted_entropy = (n_left/n) * entropy(left) + (n_right/n) * entropy(right)
weighted_gini    = (n_left/n) * gini(left)    + (n_right/n) * gini(right)

print(weighted_entropy, 1.0 - weighted_entropy)  # 0.4512...  0.5488... (information gain)
print(weighted_gini, 0.5 - weighted_gini)          # 0.2        0.3        (gini gain)`}
      />

      <Paragraph delay={1.05}>
        The low-hours side comes out perfectly pure, entropy and Gini both zero, since every one of those three students failed. The high-hours side is still a little mixed: entropy of <Formula>{`0.722`}</Formula>, Gini of <Formula>{`0.32`}</Formula>. Weighting each side by how many examples it holds and subtracting from the parent's impurity gives the improvement this split buys. That's an <strong>information gain</strong> of <Formula>{`0.549`}</Formula> bits using entropy, or a Gini reduction of <Formula>{`0.3`}</Formula> using Gini. Either criterion agrees this candidate split is a real improvement, not just noise.
      </Paragraph>

      <DecisionTreeDiagram
        delay={0.08}
        caption="A root node split on hours studied greater than 3.5. The left leaf is pure and stops there, the right leaf is still mixed and could be split further."
      />

      <Heading level={2} delay={1.10}>
        Regression trees, variance instead of impurity
      </Heading>

      <Paragraph delay={1.15}>
        Impurity only makes sense for a categorical label. When the target is a number instead, a tree swaps entropy or Gini for <strong>variance</strong>, the average squared distance from the mean, and picks whichever split shrinks the weighted variance of the two resulting sides the most. The logic is identical: a node's variance measures how spread out its target values currently are, and a good split is one that leaves both children more tightly clustered around their own means than the parent was.
      </Paragraph>

      <CodeBlock
        delay={1.20}
        language="Python"
        code={`import numpy as np

x = np.array([1, 2, 3, 4, 5, 6])
y = np.array([2, 3, 3, 8, 9, 10])

parent_var = y.var()
left, right = y[x <= 3], y[x > 3]
weighted_var = (len(left)/len(y)) * left.var() + (len(right)/len(y)) * right.var()

print(parent_var, left.var(), right.var(), weighted_var)
# 10.4722  0.2222  0.6667  0.4444
print(parent_var - weighted_var)  # 10.0278, the variance reduction`}
      />

      <Paragraph delay={1.25}>
        The six targets start out spread from 2 to 10 with a variance over ten. Splitting at <Formula>{`x \\le 3`}</Formula> separates the tightly clustered low values (2, 3, 3) from the tightly clustered high values (8, 9, 10), and each side's variance collapses to well under one. That's the same story as the classification example in different units. A split is good exactly when it leaves each side more homogeneous than it found it.
      </Paragraph>

      <Heading level={2} delay={1.30}>
        How the tree actually finds a split
      </Heading>

      <Paragraph delay={1.35}>
        Nothing above explains how "greater than 3.5" got chosen over "greater than 2.5" or "greater than 4.5" in the first place. The answer is a plain, exhaustive search, not an insight. For every feature, sort the training examples by that feature's value and consider every midpoint between two adjacent, differently-labeled values as a candidate threshold. For every candidate, compute the weighted impurity (or variance) of the resulting split, exactly as above. Keep whichever feature and threshold produced the biggest improvement, and use that as the node's question.
      </Paragraph>

      <Paragraph delay={1.40}>
        This is a <strong>greedy</strong> search. At every node it takes whichever split looks best right now, with no lookahead into how that choice will constrain later splits further down the tree. Running the search over every threshold in the eight-student example confirms the split used above really was the best available one, not a split that only looked reasonable in isolation.
      </Paragraph>

      <CodeBlock
        delay={1.45}
        language="Python"
        code={`hours = [1, 2, 3, 4, 5, 6, 7, 8]
label = [0, 0, 0, 1, 0, 1, 1, 1]  # 1 = pass, 0 = fail

best_gain, best_thresh = -1, None
for t in [h + 0.5 for h in hours[:-1]]:
    left  = [label[i] for i, h in enumerate(hours) if h <= t]
    right = [label[i] for i, h in enumerate(hours) if h > t]
    lc = [left.count(0), left.count(1)]
    rc = [right.count(0), right.count(1)]
    n, nl, nr = len(hours), len(left), len(right)
    weighted = (nl/n) * entropy(lc) + (nr/n) * entropy(rc)
    gain = entropy([4, 4]) - weighted
    if gain > best_gain:
        best_gain, best_thresh = gain, t

print(best_thresh, best_gain)  # 3.5, 0.5488 (tied with 5.5)`}
      />

      <Paragraph delay={1.50}>
        Extending this same loop across every feature at every node, then recursing into each resulting child, is the whole training algorithm. No gradient descent, no global objective jointly optimized end to end, just a local, greedy question asked over and over until some stopping rule says to quit growing.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        Left unchecked, a tree memorizes
      </Heading>

      <Paragraph delay={1.60}>
        That stopping rule matters more than it sounds. Left alone, a tree keeps splitting until every leaf is pure or has a single example in it, which means training accuracy can reach 100 percent by construction. A leaf with exactly one training example predicts that example perfectly and tells you nothing about any other example that happens to land nearby. This is the same underfitting-versus-overfitting tension that shows up whenever a model's flexibility isn't matched to how much real signal the data can support. A tree with unlimited depth has essentially unlimited capacity, and it will use every bit of it to fit the specific noise in whatever data it was handed, at the direct expense of doing well on anything new.
      </Paragraph>

      <Paragraph delay={1.65}>
        A fully grown tree trained on the eight-student example would eventually carve out a rectangle around every single student, which is a perfect description of exactly those eight students and a poor description of the general relationship between hours studied and passing. The fix isn't a different algorithm, it's stopping the tree from growing that far in the first place.
      </Paragraph>

      <Heading level={2} delay={1.70}>
        Pruning, pre and post
      </Heading>

      <Paragraph delay={1.75}>
        <strong>Pre-pruning</strong> stops the tree from growing past a limit decided up front. A <InlineCode>max_depth</InlineCode> caps how many questions deep any path is allowed to go. A <InlineCode>min_samples_split</InlineCode> or <InlineCode>min_samples_leaf</InlineCode> refuses to split a node, or refuses to create a leaf, once too few examples remain to make the split trustworthy. These are cheap and fast, since training simply halts early. But picking the right limit usually means trying a few values and checking each against a validation set, since too shallow a limit underfits just as badly as no limit overfits.
      </Paragraph>

      <Paragraph delay={1.80}>
        <strong>Post-pruning</strong> takes the opposite approach, grow the full tree first, then cut it back. <strong>Cost-complexity pruning</strong> is the standard version, it scores every possible subtree by a combination of how well it fits the training data and how many leaves it has.
      </Paragraph>

      <Formula block delay={1.85}>
        {`R_\\alpha(T) = R(T) + \\alpha \\cdot |T|`}
      </Formula>

      <Paragraph delay={1.90}>
        Here <Formula>{`R(T)`}</Formula> is the tree's error on training data, <Formula>{`|T|`}</Formula> is its number of leaves, and <Formula>{`\\alpha`}</Formula> is a penalty knob. At <Formula>{`\\alpha = 0`}</Formula> the fully grown tree wins outright, since more leaves can only help training error. Raise <Formula>{`\\alpha`}</Formula> and every extra leaf has to earn its keep. Branches that barely improve training fit get pruned back into their parent, because the leaf-count penalty outweighs the tiny accuracy gain they were buying.
      </Paragraph>

      <Paragraph delay={1.92}>
        Sweeping <Formula>{`\\alpha`}</Formula> across a range and picking whichever value scores best on a validation set is the same idea as tuning <InlineCode>max_depth</InlineCode>, just applied after the fact instead of during growth. It tends to find a better trade-off than a depth limit chosen blind, since it can prune unevenly, keeping a deep, useful branch on one side of the tree while trimming a shallow, useless one on the other.
      </Paragraph>

      <Heading level={2} delay={1.95}>
        Missing values, briefly
      </Heading>

      <Paragraph delay={2.00}>
        Real data has gaps, a student with no recorded hours studied, a sensor reading that failed to log. A tree can't route an example through a threshold question if the value the question depends on isn't there. One common answer is a <strong>surrogate split</strong>, a backup question, correlated with the primary one, learned from whichever examples do have both values available. If the primary feature is missing for a given example, the tree falls back to the surrogate question instead of refusing to make a prediction. It's not the only strategy in use (some libraries just route missing values down whichever branch had more training examples), but the surrogate idea is the one that tries to actually preserve the information a missing feature would have carried, by leaning on whatever other feature tends to agree with it.
      </Paragraph>

      <Heading level={2} delay={2.05}>
        Feature importance, and its blind spot
      </Heading>

      <Paragraph delay={2.10}>
        Once a tree is trained, it's natural to ask which features actually mattered. The standard answer sums up, for each feature, how much impurity decrease its splits were responsible for across the whole tree, weighted by how many training examples passed through each of those splits. A feature used high up in the tree, on a large fraction of the data, with a big impurity drop, scores as more important than one used once, deep down, on a handful of examples.
      </Paragraph>

      <Paragraph delay={2.15}>
        That measure has a real blind spot worth knowing about. A feature with many distinct values (a raw user ID, a fine-grained timestamp, anything close to unique per row) has far more candidate thresholds to try during the greedy search than a feature with only a couple of possible values, purely by having more places to cut. That extra freedom lets the search find a split that looks like a bigger impurity improvement on the training set, even when the feature carries no real signal. That inflates its reported importance relative to a coarser but more genuinely useful feature. Reading a tree's feature importances at face value, without accounting for how many distinct values each candidate feature had to search over, is a common way to walk away with the wrong takeaway about what actually drives the model's predictions.
      </Paragraph>

      <Heading level={2} delay={2.20}>
        The instability problem
      </Heading>

      <Paragraph delay={2.25}>
        One more property is worth sitting with before reaching for a tree in practice. Because every split is chosen greedily from whatever training examples happen to be present, a small change in the data — dropping a handful of rows, adding a few new ones — can flip which feature and threshold win at the very first split. And because every split downstream depends on which examples ended up in that node, one different root question can cascade into an entirely different-looking tree from the same underlying relationship. Two trees trained on two slightly different samples from the same population can end up making genuinely different predictions on the same new example, even though neither one is unreasonable given the data it saw.
      </Paragraph>

      <Paragraph delay={2.30}>
        That instability isn't a bug to be patched inside a single tree. It's close to structural, a direct consequence of how a greedy, hard-threshold search commits fully to one split before ever seeing the next one. It's exactly the reason so much practical modeling built on top of trees doesn't stop at training one. Training many trees on different random slices of the data and averaging their predictions turns that same instability into a source of strength instead of a weakness, since the individual trees' idiosyncrasies tend to cancel out rather than compound. A single tree's fragility is the whole motivation for that direction.
      </Paragraph>

      <Heading level={2} delay={2.35}>
        Takeaways
      </Heading>

      <List delay={2.40}>
        <ListItem>A decision tree predicts by recursively cutting the feature space into axis-aligned rectangles, each rectangle carrying one prediction, the majority class or the average target of whatever training points landed inside it.</ListItem>
        <ListItem>Entropy and Gini impurity both measure how mixed a node's labels are, and both agree, on the eight-student example, that splitting at hours studied greater than 3.5 is a real improvement over the unsplit parent.</ListItem>
        <ListItem>Regression trees swap impurity for variance reduction, same greedy logic, a different measure of how spread out a node's targets are.</ListItem>
        <ListItem>An unpruned tree can memorize its training data outright, pre-pruning (depth and sample-count limits) and post-pruning (cost-complexity pruning) are both direct ways to trade a bit of training fit for a model that generalizes.</ListItem>
        <ListItem>Impurity-based feature importance is biased toward high-cardinality features, and a single tree is inherently unstable to small changes in the training data, which is exactly why averaging many trees together is worth reaching for.</ListItem>
      </List>

      <Paragraph delay={2.45}>
        None of this makes a decision tree a weak model. A well-pruned tree on the right problem is fast, genuinely interpretable (the flowchart really is the model), and handles mixed numeric and categorical features without much preprocessing. The honest picture is just that a single tree is a high-variance building block, easy to overfit and sensitive to exactly which rows it happened to be trained on. Knowing that is what makes the next step, combining many of them, feel less like a trick and more like the obvious fix. Thanks for reading.
      </Paragraph>
    </>
  ),
};
