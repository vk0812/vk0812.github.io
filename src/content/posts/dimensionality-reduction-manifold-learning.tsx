import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  PcaAxisDiagram,
  ManifoldFlattenDiagram,
} from "../components";

export const dimensionalityReductionManifoldLearning: BlogPostData = {
  title: "Dimensionality Reduction and Manifold Learning",
  date: "August 1, 2026",
  slug: "dimensionality-reduction-manifold-learning",
  content: (
    <>
      <Paragraph delay={0.10}>
        A dataset with a hundred features sounds like a hundred separate pieces of information. In practice it rarely is. A customer record with age, income, years employed, and credit score carries four columns that mostly move together, since income and years employed tend to rise and fall in tandem. A lot of what looks like a hundred-dimensional cloud of points is really a much lower-dimensional shape wearing a hundred-dimensional costume. Redundant, correlated columns aren't a data quality problem to clean up. They're the normal state of real data, and they're exactly what dimensionality reduction is built to exploit.
      </Paragraph>

      <Paragraph delay={0.15}>
        There's also a more practical reason to care. A scatter plot works in two dimensions and squints its way through three. Past that, there's no direct way to look at a cloud of points and see its shape at all. And the trouble compounds as dimensions pile up. Ten thousand points that comfortably cover a two-dimensional square leave a hundred-dimensional cube almost entirely empty. Distances between points start looking similar to each other, and "nearest neighbor" stops meaning much of anything. That's the informal shape of the <strong>curse of dimensionality</strong>, and it's the backdrop against which every technique below is trying to find a smaller, honest description of what the data is actually doing.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Principal Component Analysis, finding the direction that matters most
      </Heading>

      <Paragraph delay={0.25}>
        <strong>Principal Component Analysis</strong> (PCA) starts from a simple question. Given a cloud of points, which single direction, if data were projected onto it, would preserve the most spread in the data. That direction is the first principal component. Once it's found, the next question is which direction, among all directions perpendicular to the first, captures the next most spread, and that's the second principal component, and so on.
      </Paragraph>

      <Paragraph delay={0.30}>
        "Spread" here has an exact meaning, variance. The direction that maximizes the variance of the projected points turns out to be an eigenvector problem in disguise. Center the data first (subtract the mean from every feature so the cloud sits on the origin), compute the covariance matrix of the centered data, and its eigenvectors are exactly the principal component directions. The eigenvalue attached to each eigenvector is the variance of the data along that direction.
      </Paragraph>

      <Formula block delay={0.35}>
        {`\\Sigma = \\frac{1}{n-1} X_c^T X_c, \\qquad \\Sigma v_i = \\lambda_i v_i`}
      </Formula>

      <Paragraph delay={0.40}>
        Here <Formula>{`X_c`}</Formula> is the centered data matrix (rows are examples, columns are features), <Formula>{`\\Sigma`}</Formula> is the covariance matrix, and each eigenvector <Formula>{`v_i`}</Formula> with eigenvalue <Formula>{`\\lambda_i`}</Formula> is a principal component, ranked by how large <Formula>{`\\lambda_i`}</Formula> is. Sorting the eigenvectors by eigenvalue, largest first, gives an ordered list of directions from "captures the most variance" down to "captures the least."
      </Paragraph>

      <Paragraph delay={0.45}>
        That ranking is what makes dimensionality reduction possible in the first place. Keep only the top few eigenvectors, project the data onto just those, and most of the variance in the original data survives the drop from many dimensions to a handful. How much survives is measured directly, the <strong>explained variance ratio</strong> of the <Formula>{`i`}</Formula>-th component is its eigenvalue divided by the sum of all eigenvalues.
      </Paragraph>

      <Formula block delay={0.50}>
        {`\\text{explained variance ratio}_i = \\frac{\\lambda_i}{\\sum_j \\lambda_j}`}
      </Formula>

      <Paragraph delay={0.55}>
        In practice, choosing how many components to keep usually comes down to picking a target: keep enough components that their explained variance ratios add up to some threshold like 95%, or plot the ratios in order and look for the point where adding another component stops buying much (the "elbow" in that plot). Neither rule is exact science. They're both just ways of asking "how many of these directions are pulling their weight."
      </Paragraph>

      <Heading level={2} delay={0.60}>
        A worked example, ten points reduced to one dimension
      </Heading>

      <Paragraph delay={0.65}>
        Ten two-dimensional points make the whole mechanism concrete. Center them, build the covariance matrix, and pull out its eigenvectors and eigenvalues directly.
      </Paragraph>

      <CodeBlock
        delay={0.70}
        language="Python"
        code={`import numpy as np

X = np.array([
    [2.5, 2.4], [0.5, 0.7], [2.2, 2.9], [1.9, 2.2], [3.1, 3.0],
    [2.3, 2.7], [2.0, 1.6], [1.0, 1.1], [1.5, 1.6], [1.1, 0.9],
])

mean = X.mean(axis=0)
Xc = X - mean

cov = np.cov(Xc.T, bias=False)
eigvals, eigvecs = np.linalg.eigh(cov)

order = np.argsort(eigvals)[::-1]
eigvals, eigvecs = eigvals[order], eigvecs[:, order]

explained_ratio = eigvals / eigvals.sum()
pc1 = eigvecs[:, 0]
projected = Xc @ pc1

print("mean:", mean)
print("eigenvalues:", eigvals)
print("explained variance ratio:", explained_ratio)
print("PC1 direction:", pc1)
print("1D projection:", projected)

# mean: [1.81 1.91]
# eigenvalues: [1.28402771 0.0490834 ]
# explained variance ratio: [0.96318131 0.03681869]
# PC1 direction: [0.6778734  0.73517866]
# 1D projection: [ 0.828 -1.778  0.992  0.274  1.676  0.913 -0.099 -1.145 -0.438 -1.224]`}
      />

      <Paragraph delay={0.75}>
        The first eigenvalue, <Formula>{`1.284`}</Formula>, dwarfs the second, <Formula>{`0.049`}</Formula>, which is exactly what "one dominant direction" looks like numerically. The explained variance ratio makes it explicit: the first principal component alone accounts for <Formula>{`96.3\\%`}</Formula> of the total variance in the data, leaving only <Formula>{`3.7\\%`}</Formula> for the second. Dropping the second dimension entirely and keeping only the projection onto the first, ten single numbers instead of ten coordinate pairs, throws away almost none of the real structure. The reconstruction error from doing exactly that (projecting to one dimension, then mapping back to two) comes out to a mean squared error of about <Formula>{`0.022`}</Formula>, tiny relative to the spread of the original data.
      </Paragraph>

      <PcaAxisDiagram
        delay={0.06}
        caption="Figure 1: The ten points, their mean, and the two principal component directions. PC1 runs along the main diagonal of the cloud and carries 96.3% of the variance, PC2 is nearly flat and carries the rest."
      />

      <Heading level={2} delay={0.80}>
        Singular Value Decomposition, the way PCA actually gets computed
      </Heading>

      <Paragraph delay={0.85}>
        Computing PCA by explicitly forming the covariance matrix and finding its eigenvectors works fine on paper, but it's not how production PCA implementations usually do it. Forming <Formula>{`X_c^T X_c`}</Formula> squares the data's numerical range, which can amplify floating point error, and it also throws away the individual data points in favor of a single summary matrix before doing any linear algebra on them. <strong>Singular Value Decomposition</strong> (SVD) sidesteps both problems by factoring the centered data matrix directly.
      </Paragraph>

      <Formula block delay={0.90}>
        {`X_c = U S V^T`}
      </Formula>

      <Paragraph delay={0.95}>
        Here <Formula>{`V`}</Formula>'s columns turn out to be exactly the same principal component directions computed above, and the singular values in <Formula>{`S`}</Formula> relate to the eigenvalues of the covariance matrix by <Formula>{`\\lambda_i = S_i^2 / (n-1)`}</Formula>. Running the same ten points through <InlineCode>np.linalg.svd</InlineCode> instead of an eigendecomposition gives singular values <Formula>{`3.399`}</Formula> and <Formula>{`0.665`}</Formula>, and squaring and dividing those by <Formula>{`n - 1 = 9`}</Formula> reproduces the same two eigenvalues, <Formula>{`1.284`}</Formula> and <Formula>{`0.049`}</Formula>, to four decimal places. No need to derive the full mechanics of SVD to use this. The practical takeaway is just that whenever a library's <InlineCode>PCA</InlineCode> call runs under the hood, it's almost certainly computing this factorization directly on the data rather than building a covariance matrix first, because it's more numerically stable and scales better to data with far more features than examples.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        Independent Component Analysis, uncorrelated isn't the same as independent
      </Heading>

      <Paragraph delay={1.05}>
        PCA optimizes for one specific property: that the projected directions be uncorrelated and rank-ordered by variance. That's a useful property, but it's not the same thing as finding the actual underlying signals that generated the data. Two variables can have exactly zero correlation and still be tightly, deterministically related to each other in a nonlinear way. Correlation only measures the linear part of the relationship.
      </Paragraph>

      <Paragraph delay={1.10}>
        <strong>Independent Component Analysis</strong> (ICA) targets a stronger property: statistical independence. Knowing the value of one component gives no information at all about another, not just no linear information. The classic framing is the "cocktail party problem." Several microphones each pick up a different mixture of several people talking at once, and the goal is recovering each individual voice from only the mixed recordings, with no direct access to the original signals.
      </Paragraph>

      <Paragraph delay={1.12}>
        PCA on that same microphone data finds the directions of maximum variance in the mixed recordings, which generally isn't the same as separating out each speaker's voice. The mixture directions PCA prefers are shaped by how the microphones happen to be positioned, not by which combinations correspond to a single independent speaker. ICA instead searches for a set of directions along which the projected signals look as statistically independent (and as non-Gaussian) as possible. Under fairly general conditions on how the sources were mixed, that search actually recovers something close to the original individual voices.
      </Paragraph>

      <Paragraph delay={1.15}>
        The tradeoff is that ICA needs its independence assumption to actually hold, and it needs at least as many mixed recordings as there are original sources. PCA makes no such claim. It just reports the directions with the most variance, uncorrelated but not necessarily independent, which is the right tool when the goal is compression rather than recovering specific hidden signals.
      </Paragraph>

      <Heading level={2} delay={1.20}>
        Random projections, a cheap shortcut that shouldn't work as well as it does
      </Heading>

      <Paragraph delay={1.25}>
        PCA and SVD both require looking at the whole dataset to figure out which directions matter. There's a much cheaper alternative that skips that step entirely: pick a random projection matrix and multiply. That sounds like it should destroy the data's structure, and in general reducing dimensions randomly on an arbitrary matrix absolutely can. But when the thing being preserved is just the pairwise distances between points, random projections turn out to be surprisingly effective, and there's a real theoretical result behind why.
      </Paragraph>

      <Paragraph delay={1.30}>
        The <strong>Johnson-Lindenstrauss lemma</strong> says, informally, that a set of points in a very high-dimensional space can be projected down to a much lower dimension, chosen based only on how many points there are and how much distortion is tolerable, while keeping every pairwise distance approximately preserved. Crucially, the target dimension in the lemma depends on the number of points, not on the original number of features. So a million-feature dataset with a thousand points can often be projected down to a few hundred dimensions with distances still holding up close to their original values, regardless of how enormous the starting dimension was.
      </Paragraph>

      <Paragraph delay={1.35}>
        A quick empirical check confirms the intuition. Twenty random points in 500 dimensions, projected down to 50 dimensions with a random matrix scaled by <Formula>{`1/\\sqrt{k}`}</Formula>, keep every pairwise distance within roughly plus or minus 25% of its original value, averaging almost exactly 1.0 across all pairs. No attempt was made to pick a good projection, just a random one. That's the appeal of the technique: one matrix multiply, no training step, and a distance-preservation guarantee that PCA's careful variance-maximizing doesn't actually make (PCA guarantees maximum retained variance, not that any specific pair of points stays a fixed distance apart).
      </Paragraph>

      <Heading level={2} delay={1.40}>
        Nonlinear manifolds, when the data curves instead of just spreading out
      </Heading>

      <Paragraph delay={1.45}>
        Everything so far assumes the useful structure in the data is a flat, straight subspace, a well-chosen set of axes that happens to catch most of the spread. Plenty of real data doesn't cooperate with that assumption. A classic example is a set of points sitting on a curled-up sheet, like a Swiss roll. Two points that sit right next to each other on the unrolled sheet can end up on opposite sides of the roll once it's coiled — physically close in three dimensions but far apart along the sheet's actual surface. A straight line, which is all PCA has to work with, cuts straight through the coil and treats "close in space" as "close in the data's real structure." That's exactly backwards for points like that.
      </Paragraph>

      <ManifoldFlattenDiagram
        delay={0.07}
        caption="Figure 2: A straight cloud versus a curved one. PCA's straight best-fit line is an honest summary of the left cloud, but on the right it folds points that are actually far apart along the curve into nearby projected positions."
      />

      <Paragraph delay={1.50}>
        <strong>Manifold learning</strong> methods are built for exactly this case, data that lies on some curved, lower-dimensional surface embedded in a higher-dimensional space, where the goal is unrolling that surface rather than finding the straightest possible cut through it. Two methods dominate this space for visualization in particular, <strong>t-distributed Stochastic Neighbor Embedding</strong> (t-SNE) and <strong>Uniform Manifold Approximation and Projection</strong> (UMAP).
      </Paragraph>

      <Paragraph delay={1.55}>
        Both work from a similar premise. Instead of trying to preserve global variance the way PCA does, they try to preserve local neighborhood structure, which points are close to which other points. t-SNE converts distances in the original high-dimensional space into a probability distribution over which points are neighbors of which, then searches for a low-dimensional layout whose own neighbor probabilities match that distribution as closely as possible. UMAP is built on a different mathematical foundation (ideas from topology about approximating the manifold's neighborhood structure directly) but pursues a similar practical goal, and tends to run faster and preserve a bit more of the data's larger-scale organization while still prioritizing local structure over global variance.
      </Paragraph>

      <Paragraph delay={1.60}>
        The problem both methods solve is exactly the one PCA can't. A curled manifold has no single flat direction that captures its structure, but it does have a well-defined notion of "who's nearby." That's the thing both t-SNE and UMAP are explicitly optimizing to preserve, at the direct cost of no longer promising anything about which directions in the resulting plot correspond to variance, or about distances between points that started out far apart.
      </Paragraph>

      <Heading level={2} delay={1.65}>
        The visualization traps that come with that tradeoff
      </Heading>

      <Paragraph delay={1.70}>
        Giving up global structure to win local structure isn't free, and it produces a specific, well-documented set of ways a t-SNE or UMAP plot gets misread.
      </Paragraph>

      <List delay={1.75}>
        <ListItem>Cluster size in the plot doesn't mean anything about cluster size in the real data. A tight-looking blob and a sprawling one can represent clusters that were actually similar in spread before the projection, the layout algorithm doesn't preserve within-cluster scale.</ListItem>
        <ListItem>Distance between two separate clusters in the plot isn't meaningful either. Two clusters drawn far apart aren't necessarily more different from each other than two clusters drawn closer together, only the local neighbor relationships within each dense region are actually being optimized.</ListItem>
        <ListItem>A different random seed can produce a visibly different layout from the same exact data. Both algorithms involve randomness in their optimization (t-SNE's gradient descent starts from a random initialization, UMAP's does too by default), and while the local neighborhoods tend to be broadly consistent run to run, the overall rotation, spacing, and relative placement of clusters can shift noticeably.</ListItem>
      </List>

      <Paragraph delay={1.80}>
        None of this makes t-SNE or UMAP untrustworthy. It makes them tools for a narrower job than the one they're often asked to do. They're genuinely good at answering "which points tend to sit near which other points", and genuinely bad at answering "how far apart are these two groups, really" or "which cluster contains more points." Reading a t-SNE plot honestly means treating apparent global geometry, the size, shape, and distance between the blobs, as decoration rather than data.
      </Paragraph>

      <Heading level={2} delay={1.85}>
        Picking the right tool for the job
      </Heading>

      <Paragraph delay={1.90}>
        Put the whole set side by side and the choice mostly comes down to what's actually being asked. Compressing correlated features into fewer, well-understood, linear combinations, with an honest accounting of how much information survives, is PCA's job, computed in practice through SVD rather than a raw covariance eigendecomposition. Recovering distinct, statistically independent source signals from a mixture is ICA's job. Preserving pairwise distances cheaply, with no fitting step and a real theoretical guarantee, is what random projections are for. And turning a genuinely curved, high-dimensional shape into something a human can actually look at, at the cost of any claim about global distances, is what t-SNE and UMAP are for. None of these techniques replace each other. They answer different questions about the same underlying problem: that most of the interesting structure in high-dimensional data lives in far fewer dimensions than the data was originally given in.
      </Paragraph>

      <Heading level={2} delay={1.95}>
        Takeaways
      </Heading>

      <List delay={2.00}>
        <ListItem>PCA finds the directions of maximum variance by computing the eigenvectors of the covariance matrix, and the explained variance ratio quantifies exactly how much information each component is worth keeping.</ListItem>
        <ListItem>SVD is the numerically stable way PCA actually gets computed in practice, factoring the data matrix directly instead of forming and eigendecomposing a covariance matrix.</ListItem>
        <ListItem>ICA targets true statistical independence rather than PCA's uncorrelatedness, which is what lets it separate mixed signals like overlapping voice recordings that PCA cannot.</ListItem>
        <ListItem>Random projections trade any claim to optimality for a cheap, fitting-free reduction that still approximately preserves pairwise distances, backed by the Johnson-Lindenstrauss lemma.</ListItem>
        <ListItem>t-SNE and UMAP preserve local neighborhood structure on a curved manifold where PCA's straight line cannot, but their cluster sizes, inter-cluster distances, and run-to-run layout are not meaningful and shouldn't be read as data.</ListItem>
      </List>

      <Paragraph delay={2.05}>
        The common thread underneath every one of these methods is the same bet: that the true shape of the data is smaller and simpler than the number of columns in the spreadsheet suggests, and that with the right assumptions, most of what matters survives being written down in far fewer numbers. Which assumption to lean on, linear variance, statistical independence, plain distance preservation, or local neighborhood structure on a curved surface, is the real decision being made every time one of these tools gets reached for. Thanks for reading.
      </Paragraph>
    </>
  ),
};
