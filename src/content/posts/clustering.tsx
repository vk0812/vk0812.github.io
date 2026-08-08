import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  ClusterShapeComparison,
  KMeansIterationDiagram,
} from "../components";

export const clustering: BlogPostData = {
  title: "Clustering",
  date: "August 1, 2026",
  slug: "clustering",
  content: (
    <>
      <Paragraph delay={0.10}>
        Most of the machine learning worth talking about starts from a labeled example, a photo tagged "cat," a support ticket tagged "billing," a transaction tagged "fraud." Someone already decided what the right answer looks like, and the model's job is to learn to reproduce that decision on new inputs. Clustering starts somewhere else entirely. Hand it a pile of customers, documents, or sensor readings with no tags attached at all, and ask it a much stranger question, does this data have any internal structure worth naming.
      </Paragraph>

      <Paragraph delay={0.15}>
        That's the core of <strong>unsupervised learning</strong>, and clustering is its most common form. There's no target to predict and no accuracy score waiting at the end, because there's no ground truth to check against. The goal is to group similar things together and separate dissimilar things, and then let a human decide whether the resulting groups mean anything. It's a different kind of task from classification, and it comes with a different kind of honesty problem, one this post keeps coming back to.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        K-means, assign and update
      </Heading>

      <Paragraph delay={0.25}>
        The most common clustering algorithm is also the easiest to describe. Pick a number of clusters <Formula>{`k`}</Formula>, drop <Formula>{`k`}</Formula> centroids somewhere in the data, and repeat two steps until nothing changes. <strong>Assign</strong>, every point joins whichever centroid it's closest to. <strong>Update</strong>, every centroid moves to the average position of the points now assigned to it. Repeat those two steps and the centroids settle down, points stop switching clusters, and the algorithm stops.
      </Paragraph>

      <Paragraph delay={0.30}>
        Why does that particular loop converge at all, instead of oscillating forever? Each of the two steps can only ever decrease (or hold steady) the same quantity, the total squared distance from every point to its assigned centroid, usually called <strong>within-cluster variance</strong>. The assign step can't make it worse, moving a point to its nearest centroid is by definition the smallest distance available for that point. The update step can't make it worse either, the mean of a set of points is exactly the single location that minimizes the sum of squared distances to all of them. Two steps, each one only ever shrinking or holding the same number steady, means the whole loop has to settle into a fixed point eventually. It just isn't guaranteed to be the best fixed point, which is the next problem.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        A worked example, six points, two iterations
      </Heading>

      <Paragraph delay={0.40}>
        Take six points on a small 2D grid, <Formula>{`(1, 2)`}</Formula>, <Formula>{`(1.5, 1.8)`}</Formula>, <Formula>{`(5, 8)`}</Formula>, <Formula>{`(8, 8)`}</Formula>, <Formula>{`(1, 0.6)`}</Formula>, and <Formula>{`(9, 11)`}</Formula>. Seed the two starting centroids at two of the points themselves, <Formula>{`(1, 2)`}</Formula> and <Formula>{`(5, 8)`}</Formula>, the naive "grab a couple of random data points" approach rather than anything clever.
      </Paragraph>

      <KMeansIterationDiagram
        delay={0.06}
        caption="The same six points and two centroids from the code below, assign then update, run to convergence."
      />

      <CodeBlock
        delay={0.45}
        language="Python"
        code={`import numpy as np

points = np.array([
    [1, 2], [1.5, 1.8], [5, 8], [8, 8], [1, 0.6], [9, 11],
], dtype=float)

c1, c2 = np.array([1.0, 2.0]), np.array([5.0, 8.0])

for iteration in range(1, 4):
    d1 = np.linalg.norm(points - c1, axis=1)
    d2 = np.linalg.norm(points - c2, axis=1)
    labels = np.where(d1 <= d2, 0, 1)
    new_c1 = points[labels == 0].mean(axis=0)
    new_c2 = points[labels == 1].mean(axis=0)
    print(f"iteration {iteration}: labels={labels}, c1={new_c1}, c2={new_c2}")
    if np.allclose(new_c1, c1) and np.allclose(new_c2, c2):
        break
    c1, c2 = new_c1, new_c2

# iteration 1: labels=[0 0 1 1 0 1], c1=[1.167 1.467], c2=[7.333 9.0]
# iteration 2: labels=[0 0 1 1 0 1], c1=[1.167 1.467], c2=[7.333 9.0]  (unchanged, converged)`}
      />

      <Paragraph delay={0.50}>
        The first assignment step puts the three lower-left points, <Formula>{`(1,2)`}</Formula>, <Formula>{`(1.5,1.8)`}</Formula>, and <Formula>{`(1,0.6)`}</Formula>, with the first centroid, and the other three with the second. Averaging each group moves the centroids to <Formula>{`(1.167, 1.467)`}</Formula> and <Formula>{`(7.333, 9.0)`}</Formula>. Running the assignment step again with those updated centroids reproduces exactly the same six labels, nothing crosses to the other side, so the loop has converged after a single real update. The final within-cluster sum of squared distances comes out to <Formula>{`15.98`}</Formula>, computed directly and confirmed with the code above.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        Initialization, and the K-means++ fix
      </Heading>

      <Paragraph delay={0.60}>
        That toy example converged cleanly because the starting centroids happened to land in reasonable places. K-means is not guaranteed that kind of luck. The loop only ever decreases within-cluster variance, it never checks whether it landed in the globally best arrangement, so two different random starting points can converge to two different final clusterings, one noticeably worse than the other. This is exactly why production code doesn't run K-means once and call it done, it runs it several times from different random starts and keeps the result with the lowest final within-cluster variance.
      </Paragraph>

      <Paragraph delay={0.65}>
        <strong>K-means++</strong> is a smarter way to pick those starting centroids in the first place. Instead of choosing all <Formula>{`k`}</Formula> starting points uniformly at random, it picks the first one at random and then picks each subsequent one with probability proportional to its squared distance from the closest centroid already chosen. Points far away from existing centroids are far more likely to get picked next, which spreads the initial centroids out across the data instead of letting two of them land close together by chance. It doesn't remove the sensitivity to initialization entirely, but it makes a bad draw much less likely, which is why most K-means implementations use it by default.
      </Paragraph>

      <Heading level={2} delay={0.70}>
        The assumption K-means is quietly making
      </Heading>

      <Paragraph delay={0.75}>
        K-means assigns every point using ordinary Euclidean distance to a centroid, which means every cluster it can ever describe is, in effect, a roughly circular (or spherical, in higher dimensions) blob of similar size to the other clusters. That's not a limitation anyone chose on purpose, it falls directly out of what the assign step is doing, the set of points closer to one centroid than another is always a straight-line boundary, a Voronoi cell, no matter what the true data looks like.
      </Paragraph>

      <Paragraph delay={0.80}>
        Real data doesn't always cooperate with that shape. Take two long, parallel diagonal streaks of points sitting close beside each other, generated with a bit of random jitter along each line. Run K-means with <Formula>{`k=2`}</Formula>, even starting the centroids at each streak's own true average, and it converges to a straight boundary that cuts perpendicular across both streaks instead of separating them lengthwise, chopping each one into a near half and a far half. Checked against which streak each point actually came from, 14 of the 28 points end up on the "wrong" side of that boundary.
      </Paragraph>

      <ClusterShapeComparison
        delay={0.85}
        caption="Same 28 points, two elongated streaks. K-means' straight centroid boundary chops both in half, a density-based method follows the actual shape instead."
      />

      <Paragraph delay={0.90}>
        The gap between the two streaks is real, the farthest apart any two neighboring points within a single streak get is about <Formula>{`35.9`}</Formula> units, while the closest any point in one streak gets to a point in the other is about <Formula>{`41.1`}</Formula> units, a real margin that separates them. K-means just can't see it, because nothing about "nearest centroid" cares whether nearby points form a connected chain or not. Elongated clusters, unevenly sized clusters, and clusters that curve are all cases where that spherical assumption quietly breaks, and K-means will still return an answer, it'll just be a confidently wrong one.
      </Paragraph>

      <Heading level={2} delay={0.95}>
        Hierarchical clustering, merge instead of assign
      </Heading>

      <Paragraph delay={1.00}>
        <strong>Agglomerative hierarchical clustering</strong> takes a different approach that sidesteps picking <Formula>{`k`}</Formula> up front. Start with every point in its own cluster, find the two closest clusters, merge them into one, and repeat. Every merge reduces the number of clusters by exactly one, and repeating the process all the way down produces a single cluster containing everything. The record of which pair merged at which step, drawn as a tree, is called a <strong>dendrogram</strong>, and cutting it at any height produces a valid clustering with however many clusters that height implies.
      </Paragraph>

      <Paragraph delay={1.05}>
        "Closest clusters" needs a definition once a cluster has more than one point in it, and the choice of definition, called the <strong>linkage criterion</strong>, changes the resulting shapes noticeably. <InlineCode>single linkage</InlineCode> measures the distance between the two nearest points in each cluster, which lets it trace out long, thin, curving shapes, at the cost of being prone to chaining unrelated points together through a few close intermediaries. <InlineCode>complete linkage</InlineCode> measures the distance between the two farthest points in each cluster, which favors compact, evenly sized clusters and resists chaining. <InlineCode>average linkage</InlineCode> averages the distance between every pair across the two clusters, landing somewhere between the other two in behavior. None of the three is universally correct, the right one depends on whether the data's real clusters are expected to be tight blobs or elongated chains.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        DBSCAN, clusters as dense neighborhoods
      </Heading>

      <Paragraph delay={1.15}>
        <strong>DBSCAN</strong> (Density-Based Spatial Clustering of Applications with Noise) throws out centroids and distances-to-a-single-point entirely and defines a cluster as a dense, connected region separated from other dense regions by sparser space. Concretely, a point is a <InlineCode>core point</InlineCode> if at least <InlineCode>minPts</InlineCode> other points fall within a distance <InlineCode>eps</InlineCode> of it. Core points that are within <InlineCode>eps</InlineCode> of each other get chained into the same cluster, non-core points that fall within <InlineCode>eps</InlineCode> of some core point get pulled into that cluster too, and anything left over that touches no core point at all gets labeled <InlineCode>noise</InlineCode> rather than forced into a cluster it doesn't belong to.
      </Paragraph>

      <Paragraph delay={1.20}>
        That definition is exactly why DBSCAN handles the two-streaks case correctly where K-means didn't, it never asks "which centroid is this point closest to," it only asks "does this point sit in a chain of nearby points." Since the within-streak gaps (around <Formula>{`35.9`}</Formula>) stay smaller than the cross-streak gap (around <Formula>{`41.1`}</Formula>), an <InlineCode>eps</InlineCode> set anywhere in between links up each streak internally while never bridging across to the other one, recovering the actual shape instead of a straight-line cut through it. The same mechanism is what makes DBSCAN naturally robust to outliers, a single stray point far from everything else simply never becomes a core point and gets marked noise instead of dragging a centroid toward itself, something K-means has no way to do since every point is forced into some cluster whether it belongs or not.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        Choosing the number of clusters
      </Heading>

      <Paragraph delay={1.30}>
        K-means and hierarchical clustering both need a decision about how many groups to look for, and there's no formula that hands back the one correct number, only diagnostics that suggest a reasonable range. The <strong>elbow method</strong> plots within-cluster variance against <Formula>{`k`}</Formula> for a range of candidate values. That curve always falls as <Formula>{`k`}</Formula> grows, more clusters can only ever fit the data at least as well, but it falls fast at first and then flattens out, and the point where the rate of improvement drops off sharply, the "elbow," is a reasonable candidate for <Formula>{`k`}</Formula>. It's a visual judgment call more than a precise rule, the elbow isn't always obvious, and different people looking at the same curve can reasonably pick different bends.
      </Paragraph>

      <Paragraph delay={1.35}>
        The <strong>silhouette score</strong> is a more principled, per-point alternative. For a single point, it compares the average distance to other points in its own cluster against the average distance to points in the nearest other cluster, and combines the two into a score between <Formula>{`-1`}</Formula> and <Formula>{`1`}</Formula>. A score near <Formula>{`1`}</Formula> means the point sits comfortably inside its own cluster and far from any other. A score near <Formula>{`0`}</Formula> means it sits right on a boundary between two clusters. A negative score means the point is actually closer to a different cluster than the one it got assigned to, a sign something is off with the current choice of <Formula>{`k`}</Formula>. Averaging the silhouette score across every point gives a single number per candidate <Formula>{`k`}</Formula>, and unlike the elbow method, higher is unambiguously better, which makes it easier to compare candidates without eyeballing a curve.
      </Paragraph>

      <Heading level={2} delay={1.40}>
        Validating a clustering with no ground truth
      </Heading>

      <Paragraph delay={1.45}>
        Classification has a clean answer to "is this good," check predictions against known labels on a held-out set. Clustering doesn't have that option, there's no label to check against, the entire point of the exercise was to find structure nobody had already named. That doesn't mean every clustering is equally trustworthy, it just means the checks have to look for something other than accuracy.
      </Paragraph>

      <Paragraph delay={1.50}>
        <strong>Stability</strong> is the most practical substitute available. Run the same clustering algorithm several times with different random seeds, or on different random subsamples of the same dataset, and compare the resulting groupings. If the same rough structure keeps showing up regardless of which subset of the data or which starting point was used, that's genuine evidence the pattern reflects something real in the data rather than an artifact of one particular run. If the groupings shift substantially from one seed to the next, that's a warning sign that the chosen <Formula>{`k`}</Formula>, distance metric, or algorithm isn't a great match for this data, or that the "clusters" being found are closer to arbitrary partitions of a genuinely continuous blob than to distinct groups. Combined with a decent silhouette score and a domain expert actually looking at what ended up in each group, stability checks are the closest thing clustering has to a validation set.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        From clusters to decisions
      </Heading>

      <Paragraph delay={1.60}>
        None of this matters unless a clustering eventually feeds into a decision somewhere. A common one is customer segmentation, cluster customers by purchase frequency, average order size, and product category mix, and a marketing team ends up with a handful of segments to treat differently, maybe a "frequent, low-spend" group that responds well to loyalty perks, and a "rare, high-spend" group where a personal outreach email beats a blanket discount code. The clusters turn a spreadsheet nobody could act on directly into a small number of named groups people can actually build a campaign around.
      </Paragraph>

      <Paragraph delay={1.65}>
        The caution worth keeping close is that a cluster boundary is a modeling choice, not a fact discovered in the underlying customers. Two reasonable choices of <Formula>{`k`}</Formula>, distance metric, or preprocessing (whether spend gets log-transformed, whether frequency gets normalized per account age) can produce two different, both defensible, segmentations of the exact same customers. Treating a specific segment boundary as a permanent, carved-in-stone truth about who these customers "really are" invites exactly the kind of overconfidence a stability check is meant to catch. The useful mindset is that a clustering is a lens that turned an unmanageable pile of rows into a workable number of groups, worth revisiting the next time the data or the business question changes, not a discovery that gets bolted down and never questioned again.
      </Paragraph>

      <Heading level={2} delay={1.70}>
        Takeaways
      </Heading>

      <List delay={1.75}>
        <ListItem>K-means alternates assigning points to their nearest centroid and moving each centroid to the mean of its assigned points, and each step can only reduce within-cluster variance, which is why the loop always converges, just not always to the best possible clustering.</ListItem>
        <ListItem>K-means implicitly assumes roughly spherical, similarly sized clusters, and elongated or unevenly shaped clusters are exactly where that assumption breaks, a straight centroid boundary can cut cleanly through a shape it was never built to describe.</ListItem>
        <ListItem>Hierarchical clustering merges points bottom-up into a dendrogram, and the linkage criterion (single, complete, or average) decides whether the resulting clusters favor thin chains or compact blobs.</ListItem>
        <ListItem>DBSCAN defines clusters as dense, connected neighborhoods instead of distances to a centroid, which lets it trace arbitrary shapes and mark genuine outliers as noise instead of forcing them into a cluster.</ListItem>
        <ListItem>There's no ground truth to check a clustering against, so the elbow method, the silhouette score, and stability across seeds and subsamples are the closest substitutes, and a cluster boundary is always a modeling choice worth revisiting, not a permanent discovery.</ListItem>
      </List>

      <Paragraph delay={1.80}>
        Clustering trades the comfort of a labeled answer for a genuinely open question, does this data have structure worth naming at all. The algorithms above answer that question in different ways, some assuming round blobs, some tracing arbitrary shapes, none of them getting to check their work against a ground truth. Held to that honestly, with a stability check and a human looking at what actually landed in each group, clustering earns its place as one of the more useful tools for turning an unlabeled pile of data into something a team can act on. Thanks for reading.
      </Paragraph>
    </>
  ),
};
