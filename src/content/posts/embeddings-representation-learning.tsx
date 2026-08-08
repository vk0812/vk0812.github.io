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
import { EmbeddingSimilarityScatter } from "../components/animations/embeddings-representation-learning/ConceptViz";

export const embeddingsRepresentationLearning: BlogPostData = {
  title: "Embeddings and Representation Learning",
  date: "August 1, 2026",
  slug: "embeddings-representation-learning",
  content: (
    <>
      <Paragraph delay={0.10}>
        Type "sneakers for flat feet" into a shopping search bar and the results include listings that never use the word "sneakers" at all, just "trainers" or "running shoes." Nobody wrote a rule connecting those words. The system learned, from a huge pile of text and clicks, that they tend to mean the same thing in the same contexts, and it represents that closeness as literal closeness in space. That representation is an embedding, and figuring out how to build one well, and how to compare two of them fairly, turns out to be a surprisingly deep rabbit hole.
      </Paragraph>

      <Paragraph delay={0.15}>
        Almost everything downstream, search, recommendation, classification, retrieval, depends on this one move, turning a word, a sentence, an image, or a user into a vector of numbers that a model can do arithmetic on. Get the representation wrong and no amount of clever modeling on top of it saves the day.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Sparse counts versus dense vectors
      </Heading>

      <Paragraph delay={0.25}>
        The oldest way to turn a word into numbers is a <strong>one-hot vector</strong>. Build a vocabulary of every distinct word, say fifty thousand of them, and represent each word as a vector of fifty thousand zeros with a single one at that word's position. A whole document becomes a <strong>bag-of-words</strong> vector, one slot per vocabulary word, holding a count of how many times it showed up. Both are simple, exact, and easy to build with nothing more than a counter.
      </Paragraph>

      <Paragraph delay={0.30}>
        They're also almost entirely empty. A fifty-thousand-dimensional vector with one nonzero entry is mostly wasted space, and every pair of distinct words is exactly, maximally far apart under this scheme, since their one-hot vectors share no nonzero position at all. "Sneakers" and "trainers" look every bit as unrelated as "sneakers" and "spreadsheet." There's no notion of similarity built in, only identity.
      </Paragraph>

      <Paragraph delay={0.35}>
        A <strong>dense embedding</strong> fixes that by learning, from data, a much shorter vector for each word (a few hundred numbers instead of fifty thousand) such that words used in similar contexts end up with similar vectors. Nothing hand-codes what those numbers mean. Training just nudges vectors together when the words that own them show up in similar company, and apart otherwise, so the geometry that falls out at the end reflects real semantic structure, without anyone specifying an axis for "sentiment" or "animal-ness" in advance.
      </Paragraph>

      <Heading level={2} delay={0.40}>
        Static embeddings versus contextual embeddings
      </Heading>

      <Paragraph delay={0.45}>
        The first generation of dense word embeddings, word2vec and GloVe among the best known, learn exactly one vector per word in the vocabulary and reuse it everywhere. The vector for "bank" is fixed the moment training finishes, whether the sentence is about a river bank or a savings account. That's a <strong>static embedding</strong>, one lookup table, one row per word, done.
      </Paragraph>

      <Paragraph delay={0.50}>
        A transformer language model does something noticeably different. Feed it "I sat on the river bank" and then "I deposited a check at the bank," and the vector it produces for the token "bank" is not the same in both sentences. Every layer of self-attention lets each token's representation absorb information from the rest of the sentence, so the output vector for "bank" ends up shaped by whichever neighboring words are actually present. That's a <strong>contextual embedding</strong>, a different vector per token depending on what surrounds it, computed on the fly rather than looked up from a fixed table. Static embeddings are cheaper and simpler, contextual embeddings capture the fact that a single word genuinely means different things in different sentences, and most modern systems that can afford the extra compute use the contextual kind.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        Embeddings as points in a metric space
      </Heading>

      <Paragraph delay={0.60}>
        Whichever way an embedding gets built, the end result is the same shape of object, a point in an ordinary vector space where distance and angle are meaningful. That's the whole payoff of moving away from one-hot vectors. Once "similar meaning" is represented as "nearby point," every question about meaning turns into a question about geometry, which is close to which, which direction separates one group of points from another, and geometry is something a computer can already do arithmetic on.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        Why nobody trains on a full softmax
      </Heading>

      <Paragraph delay={0.70}>
        Word2vec's actual training signal is a prediction task, given a word, predict which other words tend to appear near it. The textbook way to score that prediction is a softmax over the entire vocabulary.
      </Paragraph>

      <Formula block delay={0.75}>
        {`P(w_O \\mid w_I) = \\frac{\\exp\\bigl(v'_{w_O} \\cdot v_{w_I}\\bigr)}{\\sum_{w=1}^{V} \\exp\\bigl(v'_{w} \\cdot v_{w_I}\\bigr)}`}
      </Formula>

      <Paragraph delay={0.80}>
        The numerator only needs the score for the one correct word, but the denominator sums over every single word in the vocabulary, all <Formula>{`V`}</Formula> of them, on every single training step. With a vocabulary in the tens or hundreds of thousands, and a training set with billions of word pairs, recomputing that whole sum every step is not a minor slowdown, it's the dominant cost of training.
      </Paragraph>

      <Paragraph delay={0.85}>
        <strong>Negative sampling</strong> replaces that expensive sum with a much cheaper approximation. Instead of scoring the correct word against every other word in the vocabulary, it scores the correct word against a small handful of randomly sampled wrong words, maybe five or twenty, and turns the whole thing into a set of simple binary classification problems, "is this pair a real neighbor or not."
      </Paragraph>

      <Formula block delay={0.90}>
        {`\\mathcal{L} = -\\log \\sigma\\bigl(v'_{w_O} \\cdot v_{w_I}\\bigr) - \\sum_{i=1}^{k} \\log \\sigma\\bigl(-v'_{w_i} \\cdot v_{w_I}\\bigr)`}
      </Formula>

      <Paragraph delay={0.95}>
        The first term pushes the true neighboring word's score up, the sum pushes each of the <Formula>{`k`}</Formula> randomly sampled negative words' scores down. This is the same pull-together-push-apart training signal that contrastive objectives use more generally, whether the negatives come from a random sample out of a vocabulary or from the rest of a training batch, and it turns a sum over the whole vocabulary into a sum over a small, fixed number of negatives, which is exactly what makes training embeddings on billions of examples practical at all.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        Comparing vectors, three different answers
      </Heading>

      <Paragraph delay={1.05}>
        Once two things are represented as vectors, "how similar are they" needs an actual metric, and there isn't just one obvious choice. The three that show up constantly are <strong>cosine similarity</strong>, plain <strong>dot product</strong>, and <strong>Euclidean distance</strong>.
      </Paragraph>

      <Formula block delay={1.10}>
        {`\\operatorname{cos}(a, b) = \\frac{a \\cdot b}{\\lVert a \\rVert \\, \\lVert b \\rVert}, \\qquad a \\cdot b = \\sum_i a_i b_i, \\qquad \\lVert a - b \\rVert = \\sqrt{\\sum_i (a_i - b_i)^2}`}
      </Formula>

      <Paragraph delay={1.15}>
        Cosine similarity divides out the length of both vectors and looks only at the angle between them, so it lives in a fixed range from negative one to one no matter how big either vector happens to be. Dot product skips that division, so it rewards both a small angle and a large magnitude at once, two vectors pointing in nearly the same direction score even higher on dot product if both of them are long. Euclidean distance measures a completely different thing again, the straight-line gap between the two points, which mixes direction and magnitude together in yet another way.
      </Paragraph>

      <Paragraph delay={1.20}>
        This matters in practice because trained embeddings do not all end up the same length. A word that shows up constantly during training tends to pick up a bigger vector norm than a rare word, purely as a side effect of how often its vector gets updated, with no guarantee that "more frequent" means "more semantically central." Dot product and Euclidean distance both let that norm difference leak into the comparison, cosine similarity is specifically designed not to.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        A worked example, when the three metrics disagree
      </Heading>

      <Paragraph delay={1.30}>
        Three toy embeddings, deliberately built so their norms differ, make the disagreement concrete. Treat one vector as the query, and compare it against two candidates, one that points in almost the exact same direction but has a small norm, and one that points in a noticeably different direction but has a much larger norm.
      </Paragraph>

      <CodeBlock
        delay={1.35}
        language="Python"
        code={`import numpy as np

query = np.array([4.0, 0.5])
close = np.array([1.0, 0.15])   # same direction as query, much smaller norm
far   = np.array([3.6, 3.4])    # different direction, larger norm

def cosine(a, b):
    return np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b))

for name, v in [("close", close), ("far", far)]:
    print(name, "norm=", round(np.linalg.norm(v), 3),
          "cosine=", round(cosine(query, v), 4),
          "dot=", round(np.dot(query, v), 4),
          "euclidean=", round(np.linalg.norm(query - v), 4))

# close norm= 1.011 cosine= 0.9997 dot= 4.075  euclidean= 3.0203
# far   norm= 4.952 cosine= 0.8066 dot= 16.1   euclidean= 2.9275`}
      />

      <Paragraph delay={1.40}>
        The three metrics don't just disagree by degree, they disagree about which candidate wins. Cosine similarity says <InlineCode>close</InlineCode> is by far the better match, <Formula>{`0.9997`}</Formula> against <Formula>{`0.8066`}</Formula>, because it's almost perfectly aligned with the query's direction. Dot product flips that ranking entirely, <Formula>{`16.1`}</Formula> against <Formula>{`4.075`}</Formula>, because <InlineCode>far</InlineCode>'s bigger norm outweighs its worse angle. Euclidean distance agrees with dot product here, ranking <InlineCode>far</InlineCode> as closer, <Formula>{`2.93`}</Formula> against <Formula>{`3.02`}</Formula>, for the same underlying reason, a vector with a much smaller norm than the query can't get physically close to it in raw coordinate space no matter how well its direction matches.
      </Paragraph>

      <EmbeddingSimilarityScatter
        delay={0.06}
        caption="One query point and two candidates. Cosine picks the small, well-aligned candidate as the better match, dot product and raw Euclidean distance both pick the larger, worse-aligned one instead, purely on the strength of its bigger norm."
      />

      <Paragraph delay={1.45}>
        Normalizing both vectors before comparing them, dividing each one by its own norm so every vector has length one, resolves the disagreement. Once <InlineCode>query</InlineCode>, <InlineCode>close</InlineCode>, and <InlineCode>far</InlineCode> are all rescaled to unit length, the dot product between any two of them becomes exactly their cosine similarity, and Euclidean distance between the normalized vectors turns out to rank them in the same order cosine does too, <Formula>{`0.0245`}</Formula> for <InlineCode>close</InlineCode> against <Formula>{`0.622`}</Formula> for <InlineCode>far</InlineCode>. This is the entire reason embeddings usually get <strong>L2-normalized</strong> before any similarity search or nearest-neighbor lookup, it removes norm from the comparison and leaves only the direction, which is the part that was supposed to carry meaning in the first place.
      </Paragraph>

      <Heading level={2} delay={1.50}>
        Choosing a dimensionality
      </Heading>

      <Paragraph delay={1.55}>
        How many numbers should each vector hold. Too few and there simply isn't room to encode the distinctions that matter, dozens of unrelated concepts get forced to share the same handful of directions and start interfering with each other. Too many and training gets slower, storage and retrieval both get more expensive (a billion vectors at 1536 dimensions is a very different storage bill than a billion vectors at 128), and past a certain point the extra dimensions mostly just fit noise in the training data rather than capturing anything real. Static word embeddings historically settled around a few hundred dimensions, GloVe and word2vec are commonly trained at 100 to 300. Transformer hidden states run larger, 768 or 1024 are typical middle-of-the-road choices, since they're carrying a lot more than one word's worth of information through each layer. There's no formula that hands back the right number, in practice it gets chosen empirically, train at a few candidate sizes and check which one actually improves the downstream task, rather than picking a size that just sounds appropriately large.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        When embeddings collapse
      </Heading>

      <Paragraph delay={1.65}>
        A failure mode worth knowing about by name is <strong>embedding collapse</strong>, where the model gives up on spreading representations out and maps a large chunk of distinct inputs to nearly the same point in space. A collapsed embedding table can still drive the loss down, if every vector points in roughly the same direction, every dot product looks similarly high, and a training objective that's too easy to satisfy this way stops pushing the model to actually separate things that are genuinely different. This tends to show up when negative examples are too easy (every negative is obviously unrelated, so there's no pressure to place things precisely) or when there aren't enough distinct negatives being contrasted against each positive. It's the practical reason contrastive training setups care so much about having plenty of hard negatives, a handful of well-chosen negatives per step does more to keep an embedding space honest than the same number of trivially easy ones.
      </Paragraph>

      <Heading level={2} delay={1.70}>
        Looking at embeddings without lying to yourself
      </Heading>

      <Paragraph delay={1.75}>
        A trained embedding space usually has a few hundred dimensions, which is not something a human can look at directly, so it's tempting to project it down to two dimensions for a scatter plot and eyeball the clusters. That projection is genuinely useful for spotting rough groupings, but it comes with real traps. A projection method built to preserve local neighborhood structure, rather than the honest global geometry, can make two clusters that are actually close together in the real embedding space look far apart in the picture, or make a tight, cohesive group of points look artificially sprawling. Cluster size and inter-cluster distance in a two-dimensional plot like that generally aren't measuring anything real, only which points ended up near which other points locally, and a different random seed can shuffle the whole layout around without changing anything about the underlying embeddings. Treat a two-dimensional projection as a way to spot rough groupings, not as a substitute for actually measuring similarity in the real, full-dimensional space.
      </Paragraph>

      <Heading level={2} delay={1.80}>
        How to tell if an embedding is actually good
      </Heading>

      <Paragraph delay={1.85}>
        None of this matters if there's no way to check whether the resulting embeddings are actually useful, and a few standard checks cover most of what people rely on in practice.
      </Paragraph>

      <List delay={1.90}>
        <ListItem><strong>Analogy tasks.</strong> The classic word2vec-era check takes the vector for "king," subtracts "man," adds "woman," and checks whether the nearest vector to the result is "queen." It's a fun demonstration that the space encodes relationships as consistent directions, not just isolated points, though it's a narrow test and modern contextual embeddings are usually judged by other means instead.</ListItem>
        <ListItem><strong>Downstream task performance.</strong> Plug the embeddings into a real classifier, a sentiment model, an intent detector, a search ranker, and measure the accuracy or ranking quality that actually results. This is the check that matters most in production, since it measures whether the representation helps solve the actual problem rather than whether it looks reasonable in isolation.</ListItem>
        <ListItem><strong>Retrieval metrics.</strong> For a search or recommendation system, the real measure is whether the right item shows up near the top when its embedding is compared against a query embedding. Recall at k (did the correct result land somewhere in the top k) and mean reciprocal rank (how high, on average, the first correct result appears) are the two numbers most retrieval systems are tuned against.</ListItem>
      </List>

      <Paragraph delay={1.95}>
        Put together, these three checks pull in slightly different directions on purpose, one asks whether the geometry encodes relationships cleanly, one asks whether a downstream model can actually use it, and one asks whether it retrieves the right thing when it matters. A representation that only passes one of the three is usually not done yet.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        Takeaways
      </Heading>

      <List delay={2.05}>
        <ListItem>Dense embeddings replace huge, empty one-hot vectors with short vectors positioned so that similar meaning becomes actual spatial closeness.</ListItem>
        <ListItem>Static embeddings assign one fixed vector per word, contextual embeddings compute a different vector per token depending on the surrounding sentence.</ListItem>
        <ListItem>Negative sampling swaps an expensive sum over the whole vocabulary for a cheap comparison against a handful of sampled negatives, the same contrastive trick that shows up throughout modern representation learning.</ListItem>
        <ListItem>Cosine similarity, dot product, and Euclidean distance can rank the same pair of vectors differently, because dot product and raw Euclidean distance both let vector norm leak into the comparison. Normalizing before comparing removes that leak.</ListItem>
        <ListItem>A low-dimensional scatter plot of an embedding space is good for spotting rough groupings and bad for judging cluster size or inter-cluster distance, real evaluation needs analogy checks, downstream task performance, and retrieval metrics instead.</ListItem>
      </List>

      <Paragraph delay={2.10}>
        Everything above is really one idea wearing several outfits, meaning gets represented as position, and every choice along the way, how many dimensions, whether to normalize, which metric to compare with, is really a choice about what "close" is allowed to mean. Get that choice right and the rest of the system, search, recommendation, classification, mostly falls out for free. Thanks for reading.
      </Paragraph>
    </>
  ),
};
