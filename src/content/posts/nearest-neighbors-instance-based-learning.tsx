import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  KnnVoteDiagram,
} from "../components";

export const nearestNeighborsInstanceBasedLearning: BlogPostData = {
  title: "Nearest Neighbors and Instance-Based Learning",
  date: "August 1, 2026",
  slug: "nearest-neighbors-instance-based-learning",
  content: (
    <>
      <Paragraph delay={0.10}>
        Most models spend a training run trying to compress a dataset down into a small set of weights. A neural network turns millions of examples into a few million parameters. A linear regression turns a whole table into a handful of coefficients. Once training finishes, the original data can be thrown away, the weights are the whole story from then on. Nearest neighbor methods refuse that deal entirely. They keep every training example around forever and only start working the moment a new point shows up asking to be classified.
      </Paragraph>

      <Heading level={2} delay={0.15}>
        No training, just a lookup at prediction time
      </Heading>

      <Paragraph delay={0.20}>
        A <strong>k-nearest neighbors</strong> model has no weights to fit and no loss to minimize. "Training" is copying the labeled data into memory, that's it. All of the actual work happens later, when a new, unlabeled point arrives. The model measures the distance from that new point to every point it has stored, picks the <InlineCode>k</InlineCode> closest ones, and predicts based on their labels, majority vote for classification, average value for regression. This is why the family gets called <strong>instance-based learning</strong>, the model's entire memory of the problem is a stored collection of instances, not a compressed summary of them.
      </Paragraph>

      <Paragraph delay={0.25}>
        That shifts the whole cost structure of the algorithm relative to almost everything else in this field. Fitting the model is nearly free, there's no gradient descent, no iterative optimization, nothing to converge. Every bit of the expense that would normally happen once during training instead happens over and over, once per prediction, for the rest of the model's life. Whether that trade is a good one depends entirely on what a use case actually needs, and the rest of this post is mostly about working out when it is.
      </Paragraph>

      <Heading level={2} delay={0.30}>
        What "closest" means, and it isn't one thing
      </Heading>

      <Paragraph delay={0.35}>
        Everything in this method hinges on a distance function, and there isn't a single canonical choice. <strong>Euclidean distance</strong>, straight-line distance through the feature space, is the default most people reach for first, and it fits data where the features are continuous, roughly comparable in scale, and where diagonal shortcuts between points make physical sense (two houses that differ a bit in square footage and a bit in price really are "close" along both axes at once).
      </Paragraph>

      <Formula block delay={0.40}>
        {`d_{\\text{euclidean}}(x, y) = \\sqrt{\\sum_{i=1}^{n} (x_i - y_i)^2}`}
      </Formula>

      <Paragraph delay={0.45}>
        <strong>Manhattan distance</strong> sums up the absolute difference along each feature axis separately instead of taking a diagonal shortcut between them, the distance a taxi would drive on a city grid rather than the distance a bird would fly. It tends to suit data where features represent genuinely separate, not-quite-interchangeable dimensions of difference, counts of different categories, or high-dimensional sparse data where a diagonal path doesn't mean anything sensible.
      </Paragraph>

      <Formula block delay={0.50}>
        {`d_{\\text{manhattan}}(x, y) = \\sum_{i=1}^{n} |x_i - y_i|`}
      </Formula>

      <Paragraph delay={0.55}>
        <strong>Cosine distance</strong> ignores magnitude entirely and only looks at the angle between two vectors, computed as one minus the cosine of that angle. It fits data where direction carries the meaning and length is mostly noise, a document represented as word counts, a user's rating vector across a catalog, text or image embeddings from a neural network. Two documents that use the same vocabulary in the same proportions point in nearly the same direction, whether one of them is a paragraph and the other is a full page. Cosine distance treats them as close, where Euclidean distance would be thrown off by the length difference alone.
      </Paragraph>

      <Formula block delay={0.60}>
        {`d_{\\text{cosine}}(x, y) = 1 - \\frac{x \\cdot y}{\\|x\\| \\|y\\|}`}
      </Formula>

      <Paragraph delay={0.65}>
        None of these is universally correct. The right one is whichever one matches the geometry the features actually have, and getting it wrong doesn't throw an error, it just quietly returns neighbors that aren't actually similar in any way that matters.
      </Paragraph>

      <Heading level={2} delay={0.70}>
        Why feature scaling matters enormously here
      </Heading>

      <Paragraph delay={0.75}>
        Distance-based methods are far more sensitive to feature scale than almost anything else in machine learning, because the distance formula has no idea that one feature happens to be measured in a unit with a much bigger numeric range than another. It just squares differences and adds them up. Whichever feature has the largest raw numbers wins the distance calculation by default, regardless of which feature actually carries the more meaningful signal.
      </Paragraph>

      <Paragraph delay={0.80}>
        Take a tiny example with two features, age in years and income in dollars. A new person is 30 years old, earning 50,000 dollars, and the question is which of two people in the dataset looks more similar. Person A is also 30, but earns 80,000 dollars. Person B is 60, thirty years apart in age, but earns just 50,100 dollars.
      </Paragraph>

      <CodeBlock
        delay={0.85}
        language="Python"
        code={`import numpy as np

query = np.array([30, 50000])
person_a = np.array([30, 80000])   # same age, income far off
person_b = np.array([60, 50100])   # age far off, income almost identical

dist_a_unscaled = np.linalg.norm(person_a - query)
dist_b_unscaled = np.linalg.norm(person_b - query)
print(dist_a_unscaled, dist_b_unscaled)
# 30000.0  104.4`}
      />

      <Paragraph delay={0.90}>
        Unscaled, person B looks almost 300 times closer than person A, purely because a 100 dollar income gap is numerically tiny next to a 30,000 dollar one, even though a 30 year age gap is enormous on its own terms. The age feature has essentially no say in the outcome, its whole range of maybe 20 to 80 gets steamrolled by an income range in the tens of thousands.
      </Paragraph>

      <Paragraph delay={0.95}>
        Standardizing both features first, subtracting the mean and dividing by the standard deviation so each feature contributes on a comparable scale, tells a more honest story.
      </Paragraph>

      <CodeBlock
        delay={1.00}
        language="Python"
        code={`ages = np.array([25, 30, 35, 45, 55, 60, 65])
incomes = np.array([40000, 50000, 52000, 60000, 70000, 50100, 80000])

age_mean, age_std = ages.mean(), ages.std()
inc_mean, inc_std = incomes.mean(), incomes.std()

def scale(age, income):
    return (age - age_mean) / age_std, (income - inc_mean) / inc_std

q = scale(30, 50000)
a = scale(30, 80000)
b = scale(60, 50100)

dist_a_scaled = np.hypot(a[0] - q[0], a[1] - q[1])
dist_b_scaled = np.hypot(b[0] - q[0], b[1] - q[1])
print(dist_a_scaled, dist_b_scaled)
# 2.376  2.084`}
      />

      <Paragraph delay={1.05}>
        Scaled, the gap nearly disappears, 2.376 against 2.084, instead of 30000 against 104.4. Person B is still marginally closer, but the two are now genuinely comparable rather than one looking like an outlier by three orders of magnitude. That's the general pattern, unscaled distance doesn't just favor the larger-range feature a little, it can make the smaller-range feature almost irrelevant to the prediction, silently. Standardizing (or min-max scaling to a common range) before computing any distance is close to mandatory for this family of methods, in a way it usually isn't for a model that learns per-feature weights on its own.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        A worked classification, two metrics, one dataset
      </Heading>

      <Paragraph delay={1.15}>
        A small labeled dataset makes the mechanism concrete. Six points, three labeled Blue and three labeled Red, and a new query point that needs a label.
      </Paragraph>

      <CodeBlock
        delay={1.20}
        language="Python"
        code={`import numpy as np

points = {
    "A": (5, 3, "Red"),
    "B": (8, 8, "Red"),
    "C": (4, 0, "Red"),
    "D": (6, 7, "Blue"),
    "E": (1, 0, "Blue"),
    "F": (2, 5, "Blue"),
}
q = np.array([4, 4])

def euclidean(p):
    return np.hypot(p[0] - q[0], p[1] - q[1])

def manhattan(p):
    return abs(p[0] - q[0]) + abs(p[1] - q[1])

def vote(nearest):
    labels = [label for _, _, label in nearest]
    return max(set(labels), key=labels.count)

by_euclidean = sorted(points.items(), key=lambda kv: euclidean(kv[1]))
by_manhattan = sorted(points.items(), key=lambda kv: manhattan(kv[1]))

top_euclidean = [v for _, v in by_euclidean[:3]]
top_manhattan = [v for _, v in by_manhattan[:3]]

print(vote(top_euclidean))  # Blue
print(vote(top_manhattan))  # Red`}
      />

      <KnnVoteDiagram
        delay={0.06}
        caption="The query point Q and its three Euclidean-nearest neighbors (A, F, D), ringed and joined by distance lines. Two Blue against one Red gives Q the Blue label under this metric."
      />

      <Paragraph delay={1.25}>
        Under Euclidean distance, the three nearest points to the query are A at 1.41, F at 2.24, and D at 3.61, which is two Blue and one Red, so the query gets labeled Blue. Under Manhattan distance, the ranking shuffles, A is still closest at a taxicab distance of 2, F is still second at 3, but the third spot goes to C at 4 instead of D, which was 5 away on the grid. That swaps in a Red point for a Blue one, flipping the vote to two Red against one Blue, and the query gets labeled Red instead. Same six points, same query, same k, different answer, purely because the two distance functions weigh a diagonal step differently. That's not a contrived edge case, it's the entire reason picking a distance metric is a real modeling decision rather than a formality.
      </Paragraph>

      <Heading level={2} delay={1.30}>
        The curse of dimensionality
      </Heading>

      <Paragraph delay={1.35}>
        Distance stops being a very meaningful signal once the number of features grows large, a phenomenon usually called the <strong>curse of dimensionality</strong>. The intuition is that in a low-dimensional space, points cluster unevenly, some genuinely close, some genuinely far. Add enough independent dimensions and, loosely speaking, every random pair of points ends up roughly the same distance apart. There are simply so many directions for coordinates to differ in that the differences average out into a similar total, regardless of which two points are picked.
      </Paragraph>

      <CodeBlock
        delay={1.40}
        language="Python"
        code={`import numpy as np
rng = np.random.default_rng(0)

for d in [2, 10, 100, 1000]:
    pts = rng.uniform(0, 1, size=(1000, d))
    q = rng.uniform(0, 1, size=(d,))
    dists = np.linalg.norm(pts - q, axis=1)
    spread = (dists.max() - dists.min()) / dists.min()
    print(d, spread)

# 2      134.618
# 10       3.484
# 100      0.389
# 1000     0.114`}
      />

      <Paragraph delay={1.45}>
        With two features, the farthest of a thousand random points is over 130 times farther from the query than the nearest one. At that scale, distance is a genuinely useful signal for telling points apart. Push that same experiment out to a thousand features and the farthest point is only about 11 percent farther away than the nearest one. Everyone is nearly equidistant. A nearest-neighbor search still technically returns "the closest" points at that scale, but closest and farthest have become nearly the same number, and a ranking built on nearly identical distances isn't telling the model much. In practice this is exactly why nearest neighbor methods tend to need dimensionality reduction or careful feature selection before they're pointed at anything with hundreds of raw features, and why they thrive instead on a compact, well-chosen embedding rather than a wide, raw feature vector.
      </Paragraph>

      <Heading level={2} delay={1.50}>
        Choosing k
      </Heading>

      <Paragraph delay={1.55}>
        The single knob in this whole method is <InlineCode>k</InlineCode>, how many neighbors get a vote, and it controls the exact same bias-variance tension that shows up everywhere else a model's flexibility gets tuned. A small <InlineCode>k</InlineCode>, one or three, lets the prediction swing on the label of a single nearby point, which makes the decision boundary jagged and lets an individual mislabeled or noisy point drag a whole region of the input space with it. That's low bias: the model can trace an arbitrarily wiggly true boundary. But it's high variance: swap the training set for a slightly different sample and the boundary near any given point can look completely different.
      </Paragraph>

      <Paragraph delay={1.60}>
        A large <InlineCode>k</InlineCode> averages over many more neighbors, which smooths the decision boundary out and makes any one noisy point far less influential. That's the opposite tradeoff: lower variance, since one weird training point barely moves a vote taken over fifty neighbors, but higher bias, because the boundary gets smoothed even in places where the true boundary genuinely was jagged. Pushing <InlineCode>k</InlineCode> all the way up toward the size of the whole training set eventually washes out the local structure entirely and just predicts whichever class is most common overall. Somewhere in between sits a <InlineCode>k</InlineCode> that fits the actual noise level and local structure of the data, usually found the same way any other hyperparameter is, by checking a range of values against a held-out validation set rather than picking one on faith.
      </Paragraph>

      <Heading level={2} delay={1.65}>
        Weighting neighbors instead of a flat vote
      </Heading>

      <Paragraph delay={1.70}>
        A plain majority vote treats the nearest of the k neighbors and the farthest of them as equally informative, which throws away information the distances themselves already computed. <strong>Distance-weighted voting</strong> fixes that by giving each neighbor a say proportional to how close it actually is, commonly the inverse of its distance, so a neighbor at distance 1 counts far more than one at distance 9 even though both technically made it into the top <InlineCode>k</InlineCode>.
      </Paragraph>

      <Formula block delay={1.75}>
        {`w_i = \\frac{1}{d(x, x_i) + \\epsilon}`}
      </Formula>

      <Paragraph delay={1.80}>
        The small constant in the denominator just avoids a division by zero on the rare occasion the query lands exactly on top of a training point. Weighting like this softens one of plain k-NN's rougher edges, it makes the exact choice of <InlineCode>k</InlineCode> matter less, since a neighbor that's much farther away than the rest naturally contributes much less to the outcome instead of getting exactly one full vote, the same as the closest neighbor in the set.
      </Paragraph>

      <Heading level={2} delay={1.85}>
        Exact search versus approximate search, briefly
      </Heading>

      <Paragraph delay={1.90}>
        The examples above all use <strong>brute-force search</strong>, computing the distance from the query to every single stored point and sorting. That's exact, it's guaranteed to find the true k nearest neighbors, and it's also linear in the size of the dataset, doubling the training set doubles the work every single prediction has to do. Past a few hundred thousand points that stops being practical for anything latency-sensitive.
      </Paragraph>

      <Paragraph delay={1.95}>
        <strong>Approximate nearest neighbor search</strong> trades a small, usually tunable amount of accuracy for a large speedup, using index structures built ahead of time that can rule out most of the dataset without measuring every distance directly. That's a large enough topic on its own, worth a dedicated post rather than a paragraph, the point to take here is just that it exists and is the standard answer once brute force stops scaling.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        Latency and memory, the mirror image of most models
      </Heading>

      <Paragraph delay={2.05}>
        Most parametric models spend a large, one-time cost during training and a small, cheap cost at prediction time, a forward pass through a fixed set of weights takes roughly the same amount of work no matter how large the original training set was. Nearest neighbor methods invert that completely. Training cost is nearly zero, copying data into memory. Every ounce of cost instead shows up at inference time, and it shows up twice over. In <strong>memory</strong>, the entire training set has to be kept around indefinitely rather than discarded after a weight update. In <strong>latency</strong>, every prediction means a brute-force search over that whole stored set.
      </Paragraph>

      <Paragraph delay={2.10}>
        That's a real design constraint, not just a footnote. A model that will serve millions of predictions a day off a dataset of a hundred million points needs either an approximate search index, a way to prune or subsample the stored set, or a genuinely different modeling approach, because the cost that a parametric model paid once, upfront, during training, this family defers and pays over and over, one prediction at a time, for as long as the model stays in service.
      </Paragraph>

      <Heading level={2} delay={2.15}>
        Takeaways
      </Heading>

      <List delay={2.20}>
        <ListItem>Nearest neighbor methods store the training data directly and defer all the real work to prediction time, there's no learned weight vector to inspect.</ListItem>
        <ListItem>Euclidean, Manhattan, and cosine distance encode different assumptions about the feature space, and picking the wrong one quietly returns neighbors that aren't actually similar.</ListItem>
        <ListItem>Feature scaling is close to mandatory, an unscaled large-range feature can make a smaller-range feature almost irrelevant to every distance computed.</ListItem>
        <ListItem>Distance becomes a weaker signal as the number of features grows, the curse of dimensionality, which is why these methods favor a compact feature set or embedding over a wide raw one.</ListItem>
        <ListItem>Choosing k is the same bias-variance tradeoff seen everywhere else in modeling, small k is jagged and noisy, large k is smooth and washed out, and distance-weighted voting softens the boundary between them.</ListItem>
      </List>

      <Paragraph delay={2.25}>
        The appeal of this family is how little machinery stands between the data and the prediction, there's no loss surface to worry about converging on, just a distance function and a vote. The cost of that simplicity shows up later than usual, at serving time rather than training time, which is exactly why it's worth knowing upfront rather than discovering the hard way once a stored dataset has grown too large to scan on every request. Thanks for reading.
      </Paragraph>
    </>
  ),
};
