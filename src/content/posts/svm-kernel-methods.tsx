import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  MaxMarginDiagram,
  KernelBoundaryDiagram,
} from "../components";

export const svmKernelMethods: BlogPostData = {
  title: "Support Vector Machines and Kernel Methods",
  date: "August 1, 2026",
  slug: "svm-kernel-methods",
  content: (
    <>
      <Paragraph delay={0.10}>
        Picture two clusters of dots on a page, one labeled red and one labeled blue, with a gap of empty space between them. Ask a handful of people to draw a single straight line separating the two groups and they'll all draw something slightly different, one hugging the red cluster, one hugging the blue, one splitting the difference. All of those lines technically work. Only one of them feels obviously right, the one that runs straight down the middle of the empty gap, as far as it can get from both clusters at once.
      </Paragraph>

      <Paragraph delay={0.15}>
        That's the entire idea behind a <strong>support vector machine</strong>. Among every line, or in higher dimensions every hyperplane, that separates two classes correctly, it doesn't settle for just any one that happens to work. It picks the one with the widest possible margin to the nearest point on each side.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        The widest street, not just any street
      </Heading>

      <Paragraph delay={0.25}>
        Think of the boundary as a road with the same width on both sides, and the two classes as houses lining either side of it. Plenty of roads could run between the two rows of houses without touching any of them. The support vector machine looks for the widest road that still keeps every house on its correct side. Once that widest road is found, the actual decision boundary is just the road's center line.
      </Paragraph>

      <Paragraph delay={0.30}>
        The reason width matters isn't cosmetic. A narrow boundary that just barely squeezes between the two classes is fragile, a new point that lands slightly off from its cluster can end up on the wrong side of it. A wide boundary has room to spare, so it tends to generalize better to points the model hasn't seen. Maximizing the margin turns out to be a genuinely principled way to pick a boundary, not just an aesthetic preference for a tidy-looking picture.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Support vectors, the only points that matter
      </Heading>

      <Paragraph delay={0.40}>
        Once that widest road is drawn, most of the data points turn out to be irrelevant to it. A point sitting deep inside its own cluster, far from the road, could move around quite a bit, or even be deleted from the dataset entirely. The road wouldn't shift by a millimeter. Only the points sitting right at the road's edge, the houses whose front porch touches the curb, actually pin the road in place. Move one of those and the whole boundary has to move with it.
      </Paragraph>

      <Paragraph delay={0.45}>
        Those edge points are the <strong>support vectors</strong>, and the name is literal, they're the vectors supporting (holding up) the margin. This is a genuinely different picture from a model like logistic regression, where every single training point pulls a little on the final decision boundary through the loss. A support vector machine's boundary is decided entirely by a small subset of points, often a tiny fraction of the full dataset, and the rest could vanish without consequence.
      </Paragraph>

      <Heading level={2} delay={0.50}>
        A worked example, computed and verified
      </Heading>

      <Paragraph delay={0.55}>
        Six points make this concrete. Three sit in a small cluster in the lower left, three sit in a small cluster in the upper right, with a clear gap between them.
      </Paragraph>

      <CodeBlock
        delay={0.60}
        language="Python"
        code={`import numpy as np
from sklearn.svm import SVC

X = np.array([
    [2, 3],
    [3, 3],
    [3, 4],
    [6, 5],
    [7, 6],
    [7, 4],
], dtype=float)
y = np.array([-1, -1, -1, 1, 1, 1])

clf = SVC(kernel="linear", C=1000)  # large C, close to a hard margin
clf.fit(X, y)

w, b = clf.coef_[0], clf.intercept_[0]
margin = 2 / np.linalg.norm(w)

print("w =", w, " b =", b)
print("margin width =", margin)
print("support vector indices =", clf.support_)
print("support vectors =", clf.support_vectors_)

# w = [0.6 0.2]  b = -3.6
# margin width = 3.1622776601683795   (that's exactly sqrt(10))
# support vector indices = [2 3]
# support vectors = [[3. 4.] [6. 5.]]`}
      />

      <Paragraph delay={0.65}>
        Fitting a linear support vector machine with a large penalty on margin violations (more on that penalty shortly) recovers a boundary defined by <Formula>{`w = [0.6, 0.2]`}</Formula> and <Formula>{`b = -3.6`}</Formula>. Checking every point's signed distance to that boundary shows exactly two of the six sitting precisely at distance <Formula>{`\\pm 1.5811`}</Formula>, half the margin width. Those two, <Formula>{`(3, 4)`}</Formula> from the lower-left cluster and <Formula>{`(6, 5)`}</Formula> from the upper-right one, are the support vectors. The other four sit further back, at distances up to <Formula>{`2.85`}</Formula>, comfortably clear of the road's edge.
      </Paragraph>

      <MaxMarginDiagram
        delay={0.06}
        caption="Figure 1: The six-point toy dataset with the fitted boundary, the dashed margin lines on either side, and the two support vectors circled. The other four points could move freely without changing the boundary at all."
      />

      <Heading level={2} delay={0.70}>
        Hinge loss, a different kind of wrong
      </Heading>

      <Paragraph delay={0.75}>
        Logistic regression and a support vector machine both draw a boundary between classes, but they're punished by completely different rules during training. Logistic regression uses cross-entropy, which cares about probability. A point predicted correctly with only 60 percent confidence still contributes some loss, because the model could have been more sure.
      </Paragraph>

      <Paragraph delay={0.80}>
        A support vector machine uses <strong>hinge loss</strong> instead, which cares about margin, not probability.
      </Paragraph>

      <Formula block delay={0.85}>
        {`\\mathcal{L}(x, y) = \\max\\big(0, \\, 1 - y \\, f(x)\\big)`}
      </Formula>

      <Paragraph delay={0.90}>
        Here <Formula>{`f(x) = w \\cdot x + b`}</Formula> is the raw, unsquashed distance from the boundary, and <Formula>{`y \\in \\{-1, +1\\}`}</Formula> is the true label. If a point is on the correct side and far enough past the margin that <Formula>{`y f(x) \\geq 1`}</Formula>, the loss is exactly zero, not small, zero. Being safely past the margin earns no further reward. Being on the correct side but still inside the margin still costs something, because that point is too close for comfort even though it's technically classified right. Cross-entropy never truly reaches zero for a finite prediction. It keeps asking for more confidence forever. Hinge loss stops asking once a point has cleared the margin by enough. That's exactly why only the points near the boundary end up mattering, everything else already sits at zero loss and contributes no gradient at all.
      </Paragraph>

      <Heading level={2} delay={0.95}>
        Soft margins, letting a few points misbehave
      </Heading>

      <Paragraph delay={1.00}>
        Real data is rarely as cooperative as six clean points with a gap between them. One mislabeled point, or one point that's just an unusual outlier, can sit right where a clean margin would want to be, and forcing a hard boundary to accommodate it produces a cramped, oddly shaped margin that fits that one point and nothing else well.
      </Paragraph>

      <Paragraph delay={1.05}>
        A <strong>soft margin</strong> allows some points to violate the margin, or even end up on the wrong side of the boundary entirely, at a cost. The objective adds a penalty term for every violation, controlled by a single parameter, <InlineCode>C</InlineCode>.
      </Paragraph>

      <Formula block delay={1.10}>
        {`\\min_{w, b, \\xi} \\; \\frac{1}{2}\\|w\\|^2 + C \\sum_i \\xi_i \\quad \\text{s.t.} \\quad y_i(w \\cdot x_i + b) \\geq 1 - \\xi_i, \\;\\; \\xi_i \\geq 0`}
      </Formula>

      <Paragraph delay={1.15}>
        Each <Formula>{`\\xi_i`}</Formula> measures how badly point <Formula>{`i`}</Formula> violates the margin, zero if it's cleanly outside, positive if it's inside the margin or misclassified. <InlineCode>C</InlineCode> sets the exchange rate between margin width and tolerance for those violations. A large <InlineCode>C</InlineCode> makes every violation expensive, so the optimizer shrinks the margin down to whatever it takes to keep almost every point correctly and cleanly classified. A small <InlineCode>C</InlineCode> makes violations cheap, so the optimizer happily accepts a few misclassified or inside-margin points in exchange for a much wider, more stable margin overall.
      </Paragraph>

      <Paragraph delay={1.20}>
        Adding one awkward point to the earlier six-point dataset, an outlier labeled as the upper-right class but sitting almost inside the lower-left cluster, makes the tradeoff concrete.
      </Paragraph>

      <CodeBlock
        delay={1.25}
        language="Python"
        code={`X = np.array([
    [2, 3], [3, 3], [3, 4],
    [6, 5], [7, 6], [7, 4],
    [4.5, 4.2],   # outlier, labeled +1 but sitting near the -1 cluster
])
y = np.array([-1, -1, -1, 1, 1, 1, 1])

for C in [1000, 0.1, 0.01]:
    clf = SVC(kernel="linear", C=C).fit(X, y)
    w = clf.coef_[0]
    margin = 2 / np.linalg.norm(w)
    acc = clf.score(X, y)
    print(f"C={C}: margin={margin:.2f}  support vectors={len(clf.support_)}  train acc={acc:.2f}")

# C=1000:  margin=1.51  support vectors=2  train acc=1.00
# C=0.1:   margin=3.99  support vectors=4  train acc=1.00
# C=0.01:  margin=19.95 support vectors=6  train acc=0.57`}
      />

      <Paragraph delay={1.30}>
        At <Formula>{`C = 1000`}</Formula>, violations are so expensive that the boundary contorts to keep the outlier on the correct side. The margin shrinks to <Formula>{`1.51`}</Formula>, and only two points anchor it. At <Formula>{`C = 0.1`}</Formula>, the margin widens to nearly <Formula>{`4`}</Formula> and picks up two more support vectors, still classifying every point correctly but with a much more relaxed boundary. Push <InlineCode>C</InlineCode> down to <Formula>{`0.01`}</Formula> and the optimizer stops caring about correctness at all. The margin balloons to almost <Formula>{`20`}</Formula> and training accuracy collapses to just above chance, because a huge margin was worth more to the objective than getting points right. <InlineCode>C</InlineCode> is exactly this dial, not a hyperparameter to set once and forget. Tuning it too high overfits to every quirky point; tuning it too low ignores the data almost entirely.
      </Paragraph>

      <Heading level={2} delay={1.35}>
        Why a straight line eventually gives up
      </Heading>

      <Paragraph delay={1.40}>
        A soft margin handles a few noisy points, but it doesn't help at all when the two classes simply aren't separable by any straight line, no matter how forgiving that line is allowed to be. The classic case is one class forming a tight cluster and the other class forming a ring completely around it. Any straight line divides the page into two half-planes, and a ring surrounds its center from every direction at once, so a straight line can put at most a handful of the ring's points on the correct side while the rest end up trapped on the same side as the cluster it's supposed to be kept away from.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        The kernel trick, without ever computing the mapping
      </Heading>

      <Paragraph delay={1.50}>
        The fix isn't to abandon linear boundaries, it's to change where the boundary gets drawn. Lift that same ring-and-cluster data into a higher dimension, for instance by adding a third coordinate equal to each point's squared distance from the center. The cluster (close to the center, small third coordinate) now separates cleanly from the ring (far from the center, large third coordinate), with a completely flat, linear boundary in that new space. Project that flat boundary back down into the original two dimensions and it reappears as a closed curve, exactly the shape needed to separate a ring from what it surrounds.
      </Paragraph>

      <Paragraph delay={1.55}>
        Actually computing that higher-dimensional mapping for every point would usually be expensive. Sometimes the target space is even infinite-dimensional. The <strong>kernel trick</strong> sidesteps the mapping entirely. Every place a support vector machine's math needs the dot product of two mapped points, <Formula>{`\\phi(x) \\cdot \\phi(z)`}</Formula>, a <strong>kernel function</strong> <Formula>{`K(x, z)`}</Formula> computes that exact same number directly from the original, un-mapped points, without ever constructing <Formula>{`\\phi`}</Formula> explicitly. The mapping is real and does the conceptual work, but nothing in the actual computation ever touches it, only a similarity score between pairs of original points.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        Common kernels, and what each one sees
      </Heading>

      <Paragraph delay={1.65}>
        A handful of kernel functions cover most practical cases, and each one implies a different notion of what "similar" means between two points.
      </Paragraph>

      <List delay={1.70}>
        <ListItem><strong>Linear</strong>, <Formula>{`K(x, z) = x \\cdot z`}</Formula>. No mapping at all, just the ordinary dot product, equivalent to the plain support vector machine from the earlier sections. Right when the classes are already separable, or close to it, by a straight boundary.</ListItem>
        <ListItem><strong>Polynomial</strong>, <Formula>{`K(x, z) = (x \\cdot z + c)^d`}</Formula>. Implicitly adds every feature interaction up to degree <Formula>{`d`}</Formula>, products and combinations of the original features, not just the features themselves. Useful when the true boundary bends but stays fairly smooth and low-degree.</ListItem>
        <ListItem><strong>RBF (Gaussian)</strong>, <Formula>{`K(x, z) = \\exp(-\\gamma \\|x - z\\|^2)`}</Formula>. Measures similarity as a smooth falloff with distance, two points close together are very similar, two points far apart are essentially unrelated. This is the kernel behind the ring-and-cluster example above, and it's flexible enough to carve out an arbitrarily shaped closed boundary, which is exactly why <Formula>{`\\gamma`}</Formula> needs care, too large and every point becomes its own tiny isolated region, memorizing the training set instead of generalizing.</ListItem>
      </List>

      <KernelBoundaryDiagram
        delay={0.07}
        caption="Figure 2: A cluster surrounded by a ring of the opposite class. A straight line puts most of the ring on the wrong side no matter how it's tilted, a closed curve, the kind an RBF kernel produces, separates both classes cleanly."
      />

      <Heading level={2} delay={1.75}>
        Support vector regression, the same idea flipped
      </Heading>

      <Paragraph delay={1.80}>
        The same margin idea has a regression-side analogue. Instead of maximizing a gap between two classes, <strong>support vector regression</strong> fits a tube of fixed width around the regression line and only penalizes points that fall outside that tube. A prediction that's close enough to correct, inside the tube, costs nothing at all, exactly the same "zero loss once you're safely inside a margin" behavior that hinge loss gives a classifier, just applied to a continuous target instead of a class label. Points outside the tube get penalized in proportion to how far outside they land, and the same kernel trick applies just as well, letting support vector regression fit a non-linear relationship the same way a kernelized classifier fits a non-linear boundary.
      </Paragraph>

      <Heading level={2} delay={1.85}>
        Where support vector machines stop making sense
      </Heading>

      <Paragraph delay={1.90}>
        None of this comes free at scale. A kernel support vector machine needs the similarity between every pair of training points, which means building an <Formula>{`N \\times N`}</Formula> kernel matrix for <Formula>{`N`}</Formula> training examples. Double the dataset and that matrix quadruples in size, and training time and memory grow right along with it. A dataset with a few thousand points is comfortable. A dataset with tens of millions of points makes the kernel matrix itself infeasible to even store, long before training time becomes the real bottleneck.
      </Paragraph>

      <Paragraph delay={1.95}>
        That's exactly why deep learning, not kernel methods, took over the large-scale end of machine learning. A neural network's cost scales with its parameter count and the size of a mini-batch, not with the square of the full dataset. Support vector machines haven't disappeared as a result. They're still a genuinely strong choice on small to medium tabular datasets, especially ones with more features than examples, where a kernel matrix stays a manageable size and the margin-maximizing boundary tends to generalize well without needing the volume of data a deep network wants. Kernel methods more broadly also still show up wherever a problem is naturally described by a similarity function rather than a fixed feature vector, structured or sequence data where defining a good kernel is easier than engineering explicit features.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        Takeaways
      </Heading>

      <List delay={2.05}>
        <ListItem>A support vector machine picks the widest possible margin between classes, not just any separating boundary, and that margin is decided entirely by the small handful of points sitting right at its edge, the support vectors.</ListItem>
        <ListItem>Hinge loss is margin-based, not probability-based, it reaches exactly zero once a point clears the margin, which is why points far from the boundary contribute nothing to training.</ListItem>
        <ListItem>The soft margin parameter <InlineCode>C</InlineCode> trades margin width for tolerance of violations, a large <InlineCode>C</InlineCode> chases every point correctly at the cost of a narrow, fragile margin, a small <InlineCode>C</InlineCode> accepts some errors for a wider, more stable one.</ListItem>
        <ListItem>The kernel trick separates non-linearly-separable data by computing similarity as if the data were mapped into a higher-dimensional space, without ever constructing that mapping explicitly.</ListItem>
        <ListItem>Kernel support vector machines scale poorly past a kernel matrix that grows quadratically with dataset size, which is exactly why they remain most useful on small to medium tabular problems rather than at deep-learning scale.</ListItem>
      </List>

      <Paragraph delay={2.10}>
        The margin idea is one of those pieces of machine learning that turns out to generalize past the model it was invented for, showing up again anywhere a decision needs to be not just correct but comfortably correct, with room to spare before it flips. Support vector machines are the cleanest place to see that idea worked out completely, from the geometry of the margin down to the exact mechanics of a kernel. Thanks for reading.
      </Paragraph>
    </>
  ),
};
