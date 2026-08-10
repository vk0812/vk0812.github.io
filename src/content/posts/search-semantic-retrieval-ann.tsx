import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  InlineCode,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  ReplicationDiagram,
  ReplicationPanel,
  StatTiles,
  StatItem,
} from "../components";
import { AnnNarrowingDiagram } from "../components/animations/search-semantic-retrieval-ann/ConceptViz";
import {
  Search,
  Type,
  ListTree,
  ListOrdered,
  Calculator,
  ListChecks,
  Database,
  Layers,
  GitMerge,
  SlidersHorizontal,
  Timer,
  Zap,
  Target,
  Gauge,
} from "lucide-react";

const invertedIndexNodes: DiagramNode[] = [
  { id: "query", label: "Query", icon: Search, color: "text-blue-500", x: 50, y: 5 },
  { id: "tokenizer", label: "Tokenizer", sub: "splits into terms", icon: Type, color: "text-purple-500", x: 50, y: 22 },
  { id: "index", label: "Inverted index", sub: "term to doc map", icon: ListTree, color: "text-emerald-500", x: 50, y: 39 },
  { id: "postings", label: "Postings lists", icon: ListOrdered, color: "text-amber-500", x: 50, y: 56 },
  { id: "scorer", label: "BM25 scorer", sub: "term freq x idf", icon: Calculator, color: "text-blue-600", x: 50, y: 73 },
  { id: "ranked", label: "Ranked documents", icon: ListChecks, color: "text-emerald-600", x: 50, y: 90 },
];

const invertedIndexEdges: DiagramEdge[] = [
  { id: "e-query-tok", from: "query", to: "tokenizer" },
  { id: "e-tok-index", from: "tokenizer", to: "index" },
  { id: "e-index-postings", from: "index", to: "postings" },
  { id: "e-postings-scorer", from: "postings", to: "scorer" },
  { id: "e-scorer-ranked", from: "scorer", to: "ranked" },
];

const hybridNodes: DiagramNode[] = [
  { id: "query", label: "Query", icon: Search, color: "text-blue-500", x: 50, y: 8 },
  { id: "sparse", label: "Sparse retrieval", sub: "keyword match", icon: Database, color: "text-amber-500", x: 25, y: 28 },
  { id: "dense", label: "Dense retrieval", sub: "vector similarity", icon: Layers, color: "text-purple-500", x: 75, y: 28 },
  { id: "merge", label: "Merge candidates", icon: GitMerge, color: "text-emerald-500", x: 50, y: 50 },
  { id: "rerank", label: "Cross-encoder rerank", sub: "joint scoring", icon: SlidersHorizontal, color: "text-blue-600", x: 50, y: 72 },
  { id: "results", label: "Final ranked results", icon: ListChecks, color: "text-emerald-600", x: 50, y: 92 },
];

const hybridEdges: DiagramEdge[] = [
  { id: "e-query-sparse", from: "query", to: "sparse" },
  { id: "e-query-dense", from: "query", to: "dense" },
  { id: "e-sparse-merge", from: "sparse", to: "merge" },
  { id: "e-dense-merge", from: "dense", to: "merge" },
  { id: "e-merge-rerank", from: "merge", to: "rerank" },
  { id: "e-rerank-results", from: "rerank", to: "results" },
];

const encoderPanels: [ReplicationPanel, ReplicationPanel] = [
  {
    title: "Dual encoder retrieval",
    writeLabel: "Query text",
    fanLabel: "encoded independently",
    nodes: ["Query vector", "Document vector"],
    note: "Document vectors are precomputed offline, so comparing them at query time is one fast vector operation.",
  },
  {
    title: "Cross-encoder reranking",
    writeLabel: "Query and document text",
    fanLabel: "encoded jointly, one pass",
    nodes: ["Relevance score"],
    note: "Reads the query and the document together for higher accuracy, too slow to run over an entire corpus.",
  },
];

const latencyStats: StatItem[] = [
  { label: "Exact search latency, 10 million vectors", value: 850, suffix: "ms", icon: Timer, color: "text-amber-600" },
  { label: "Approximate search latency, same index", value: 5, suffix: "ms", icon: Zap, color: "text-blue-500" },
  { label: "Recall@10 for that approximate index", value: 97, suffix: "%", icon: Target, color: "text-emerald-600" },
  { label: "Speedup from skipping most of the index", value: 170, suffix: "x", icon: Gauge, color: "text-purple-500" },
];

export const searchSemanticRetrievalAnn: BlogPostData = {
  title: "Search, Semantic Retrieval, and Approximate Nearest Neighbors",
  date: "August 10, 2026",
  slug: "search-semantic-retrieval-ann",
  content: (
    <>
      <Paragraph delay={0.10}>
        Type a question into any search bar sitting in front of a few hundred million documents. A ranked list of good candidates comes back in well under a second. That speed hides a lot of machinery. It's usually not one system doing the work, but at least two very different technologies handed off to each other in relay.
      </Paragraph>

      <Paragraph delay={0.15}>
        One of those technologies is decades old, built on matching the exact words in a query against the exact words in a document. The other is much newer, built on turning both the query and every document into a point in a vector space and asking which points land close together. Neither one wins outright on its own. Real search systems lean on both, plus a smaller, slower, more careful model near the very end that double checks the ranking before anything reaches the user.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Two different ideas about relevance
      </Heading>

      <Paragraph delay={0.25}>
        The old technology is usually called <strong>sparse retrieval</strong>, because it matches literal words and most of the space of possible words has nothing to do with any one document. The newer one is usually called <strong>dense retrieval</strong>, because it compares dense vectors instead of sparse word counts. A query for "waterproof hiking boots" matches a listing that also says "waterproof hiking boots," word for word, under sparse retrieval. Under dense retrieval, it can also match a listing that only says "trail shoes rated for wet conditions," because the two phrases land near each other in the vector space even though they share almost no words.
      </Paragraph>

      <Heading level={2} delay={0.30}>
        Turning text into a lookup table
      </Heading>

      <Paragraph delay={0.35}>
        Sparse retrieval starts with a structure called an <strong>inverted index</strong>. A normal index, the kind at the back of a textbook, maps each page to the words on it. An inverted index flips that around. It maps each word to every document that contains it. Look up the word "waterproof" and the index hands back a list of every document that uses that word, called a <strong>postings list</strong>.
      </Paragraph>

      <Paragraph delay={0.40}>
        Building that list starts with a tokenizer, a step that splits raw text into individual terms, usually lowercasing everything and stripping punctuation along the way. Once a query gets tokenized into its own set of terms, the search engine looks up the postings list for each term and now has to decide how to score every document that shows up in at least one of those lists.
      </Paragraph>

      <Paragraph delay={0.45}>
        The scoring function almost every inverted-index system reaches for is <strong>BM25</strong>, short for Best Matching 25, a formula that has stayed a strong baseline for decades. For every query term found in a document, it adds up a score built from three ingredients. How often the term shows up in that document, how rare the term is across the whole collection, and how long the document is compared to the average.
      </Paragraph>

      <Formula block delay={0.50}>
        {`\\operatorname{score}(D, Q) = \\sum_{i=1}^{n} \\operatorname{IDF}(q_i) \\cdot \\frac{f(q_i, D)\\,(k_1+1)}{f(q_i, D) + k_1\\left(1 - b + b\\,\\frac{|D|}{\\text{avgdl}}\\right)}`}
      </Formula>

      <Paragraph delay={0.55}>
        <Formula>{`\\operatorname{IDF}(q_i)`}</Formula>, inverse document frequency, is a weight that goes up the rarer a term is, since a common word like "the" says almost nothing about relevance while a rare word like "waterproof" says a lot. <Formula>{`f(q_i, D)`}</Formula> is how many times the term appears in this particular document, its term frequency. The interesting part is that this term frequency doesn't just get added straight into the score. It gets divided by an expression that grows with it, so a fifth occurrence of a word adds much less than the first occurrence did. That's deliberate. A document that repeats "waterproof" five times is probably about waterproofing, but it isn't five times as relevant as a document that mentions it once. The constant <InlineCode>k1</InlineCode> controls how quickly that saturation kicks in.
      </Paragraph>

      <Paragraph delay={0.60}>
        The other constant, <InlineCode>b</InlineCode>, controls how much the document's length gets held against it. <Formula>{`|D|`}</Formula> is the document's length in words and <InlineCode>avgdl</InlineCode> is the average document length across the whole collection. A term appearing once in a three-sentence document is a much stronger signal than the same term appearing once in a ten-page document, and this part of the formula corrects for that.
      </Paragraph>

      <Paragraph delay={0.65}>
        Put together, a query turns into a handful of terms, each term turns into a postings list, and every document that shows up in at least one list gets a BM25 score built from term frequency, rarity, and document length. The highest-scoring documents win.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={invertedIndexNodes}
        edges={invertedIndexEdges}
        height={680}
        delay={0.08}
        caption="Query terms flow through the tokenizer, the inverted index resolves each term to a postings list, and BM25 scores every document that shows up in at least one list."
      />

      <Paragraph delay={0.70}>
        This whole approach has a hard limit built into it. It can only ever find documents that share actual words with the query. A document that means the exact same thing in different words is invisible to it, no matter how relevant it actually is. That gap is exactly what dense retrieval was built to close.
      </Paragraph>

      <Heading level={2} delay={0.75}>
        Dense retrieval and dual encoders
      </Heading>

      <Paragraph delay={0.80}>
        Dense retrieval represents a query and a document the same way, as a fixed-length vector produced by a neural network, an embedding. Comparing two of them is then a matter of picking a similarity metric, usually cosine similarity or a plain dot product, and finding whichever document vector sits closest to the query vector. None of that geometry is new here. It's the same comparison problem that shows up any time meaning gets represented as position in space.
      </Paragraph>

      <Paragraph delay={0.85}>
        The architecture that makes this practical at scale is called a <strong>dual encoder</strong>, sometimes a bi-encoder. A dual encoder is really two separate encoders, often starting from the same pretrained model, one that turns a query into a vector and one that turns a document into a vector. The two towers never see each other's input. That constraint sounds limiting, but it's the entire reason dense retrieval scales. Every document in the corpus gets encoded once, offline, ahead of any query, and its vector gets stored in a vector index. At query time, only the query itself needs to run through the model. Comparing the resulting query vector against millions or billions of precomputed document vectors is then a fast, ordinary vector operation instead of a fresh forward pass through the whole document collection.
      </Paragraph>

      <Paragraph delay={0.90}>
        Training a dual encoder so its two towers actually agree on what "close" means is a contrastive learning problem, pulling a query and its true matching document together in the shared vector space and pushing every other document in the training batch apart. That training mechanism is worth knowing on its own terms, the point that matters here is just that a dual encoder is exactly two encoders trained contrastively, one per input type, and that pull-together-push-apart signal is what makes the resulting vector space organize itself by meaning.
      </Paragraph>

      <Heading level={2} delay={0.95}>
        Cross encoders, and why they don't retrieve on their own
      </Heading>

      <Paragraph delay={1.00}>
        A <strong>cross encoder</strong> solves a related but different problem. Instead of encoding the query and a document separately and comparing the two vectors afterward, it feeds the query and the document into the model together, as one combined input, and lets every layer of self-attention compare individual words across both texts directly. The output isn't two vectors that then get compared. It's a single relevance score for that exact pair.
      </Paragraph>

      <Paragraph delay={1.05}>
        That joint attention is why cross encoders tend to score relevance more accurately than dual encoders. A dual encoder has to compress everything it might ever need to compare into one fixed vector before it has even seen the other side of the comparison. A cross encoder gets to look at both sides at once and reason about their relationship directly. The cost is that nothing about a cross encoder can be precomputed. Scoring one query against one document means one full forward pass through the model, every single time, for every candidate. Run that against an entire corpus of millions of documents and the latency stops being workable. Cross encoders are accurate and slow, dual encoders are fast and slightly less accurate, and that trade shapes almost every design decision in the rest of this post.
      </Paragraph>

      <ReplicationDiagram panels={encoderPanels} delay={0.08} />

      <Paragraph delay={1.10}>
        The practical answer isn't to pick one. It's to use the fast one to narrow a huge corpus down to a short list, and the slow, accurate one to put that short list in the right order. Retrieval and reranking, in other words. Getting the fast half fast enough to be worth doing at all is the next problem.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        Vector indexes and approximate nearest neighbor search
      </Heading>

      <Paragraph delay={1.20}>
        Dense retrieval only stays fast if finding the closest document vectors stays fast, and at the scale a lot of real systems operate at, that stops being free. Comparing a query vector against every single stored vector one at a time is called exact search, sometimes brute-force search, and it's guaranteed to find the true nearest neighbors. It also scales linearly with the size of the corpus. A brute-force scan over ten million vectors takes ten times longer than the same scan over one million, no matter how fast the underlying hardware gets.
      </Paragraph>

      <Paragraph delay={1.25}>
        <strong>Approximate nearest neighbor search</strong>, usually shortened to ANN, is the standard fix. An ANN index is a data structure built ahead of time, once, over the whole set of stored vectors, specifically so a later query can skip comparing against almost all of them and still come back with neighbors that are correct or very close to correct almost all of the time. The word approximate is doing real work in that description. An ANN index gives up a small, usually tunable amount of accuracy in exchange for a search that can be orders of magnitude faster than a brute-force scan.
      </Paragraph>

      <Paragraph delay={1.30}>
        One common family of ANN indexes works by clustering. During index construction, the stored vectors get grouped into a fixed number of clusters, each represented by a centroid, a kind of average vector for everything in that cluster. A query only needs to be compared against the centroids first, a small number, to find the handful of clusters its nearest neighbors are most likely sitting in. Only the vectors inside those chosen clusters get compared directly. Every other cluster, and every vector inside it, never gets touched at all.
      </Paragraph>

      <Paragraph delay={1.35}>
        A second common family builds a graph instead of clusters, connecting each stored vector to a handful of its nearest neighbors so the whole index forms a navigable web. A search starts at an arbitrary entry point and repeatedly hops to whichever neighboring vector is closer to the query than the current one, narrowing in on the right neighborhood a few hops at a time instead of scanning anything. <strong>Hierarchical Navigable Small World</strong> graphs, usually called HNSW, are the best known version of this idea, and they show up as the default index in most vector databases used in production today.
      </Paragraph>

      <AnnNarrowingDiagram
        delay={0.08}
        caption="A query only has to compare against a handful of cluster centroids to find where its nearest neighbor is likely sitting, then it searches inside that one cluster instead of scanning every stored vector."
      />

      <Paragraph delay={1.40}>
        Whichever family a vector index uses, the shape of the trade is the same. More clusters probed, or more hops allowed through the graph, means results closer to the true, exact nearest neighbors, at the cost of touching more of the index and taking longer. Fewer clusters probed, or a graph search cut short, means faster answers that occasionally miss a true neighbor that a brute-force scan would have found. Tuning an ANN index is really just deciding where to sit on that line.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Hybrid retrieval, sparse and dense together
      </Heading>

      <Paragraph delay={1.50}>
        Sparse and dense retrieval fail in almost opposite ways, which is exactly why combining them works so well. Sparse retrieval is precise about exact terms, a product code, a rare technical name, an exact phrase someone is quoting, but blind to paraphrase. Dense retrieval is the opposite. It captures meaning across different wording, but it can blur past an exact identifier, since the model was never trained to treat one specific string as special, it just becomes another point among many in the vector space.
      </Paragraph>

      <Paragraph delay={1.55}>
        <strong>Hybrid retrieval</strong> runs both searches against the same query at the same time and merges the two candidate lists before anything gets ranked further. A document that only one of the two methods found still gets a chance to survive into the merged list, and a document both methods agree on tends to rank near the top of the merge, since two independent signals pointing at the same result is a stronger signal than either one alone. The merge step itself can be as simple as combining the two ranked lists by each document's rank position rather than trying to make BM25 scores and cosine similarities directly comparable, which they aren't.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={hybridNodes}
        edges={hybridEdges}
        height={560}
        delay={0.06}
        caption="Sparse and dense retrieval run against the same query independently. Their candidate lists get merged before a slower reranking stage puts the survivors in final order."
      />

      <Heading level={2} delay={1.60}>
        Reranking, spending the expensive model wisely
      </Heading>

      <Paragraph delay={1.65}>
        This is where the cross encoder from earlier actually earns its keep. Nobody runs a cross encoder over an entire corpus, that was the whole reason dual encoders and inverted indexes exist in the first place. Instead, the fast first stage, sparse, dense, or a hybrid merge of both, narrows millions or billions of documents down to a short list, usually somewhere between a few dozen and a few hundred candidates. Only that short list gets scored by the cross encoder, one pair at a time, and the final order shown to the user comes from those scores instead of whatever order the first stage produced. This is the standard shape of a <strong>reranking</strong> stage.
      </Paragraph>

      <Paragraph delay={1.70}>
        That two-stage shape, cheap and broad first, expensive and narrow second, is the standard answer to the fact that recall and precision want different amounts of compute. The first stage needs to be fast enough to touch a huge amount of data without missing too much of what actually matters. The second stage needs to be careful enough to get the final few positions right, since those are the ones a user actually looks at, and it can afford to be careful precisely because it only has to look at a short list instead of the whole corpus.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Recall at k and the latency budget
      </Heading>

      <Paragraph delay={1.80}>
        All of this eventually needs a number to tune against, and the standard one for a retrieval system is <strong>Recall@K</strong>. It asks a simple question. Out of everything genuinely relevant to a query, what fraction actually shows up somewhere in the top K results a system returns. A retrieval stage feeding a reranker cares about Recall@K specifically, not final ranking quality, because anything the retrieval stage fails to surface in its top K candidates is something the reranker will never even get a chance to see, no matter how good the reranker is.
      </Paragraph>

      <Paragraph delay={1.85}>
        Every knob covered so far trades against that same recall number, and against latency on the other side. A larger K passed on to the reranker raises Recall@K, since more of the genuinely relevant documents get a chance to be included, but it also means the reranker has more candidates to score, which costs time. Probing more clusters, or allowing more hops through an ANN graph, raises the odds that the true nearest neighbors get found, at the direct cost of touching more of the index per query. There's no setting that maximizes both recall and speed at once. Every real system sits at a specific, deliberate point on that curve, chosen for its own latency budget and how much a missed result actually costs.
      </Paragraph>

      <Paragraph delay={1.90}>
        The shape of that trade is easiest to see with a rough, illustrative picture rather than a citation to any specific system. Cutting a search from a brute-force scan down to an approximate index routinely buys close to two orders of magnitude in latency, at the cost of recall dropping just a few points below what an exact scan would find.
      </Paragraph>

      <StatTiles items={latencyStats} delay={0.06} />

      <Paragraph delay={1.95}>
        None of those exact numbers matter on their own, they're illustrative, not a benchmark from any particular system. What matters is the shape. A small, deliberate give on recall buys a very large win on latency, and figuring out exactly how much give a specific product can tolerate is most of the actual engineering work in a retrieval system.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        Takeaways
      </Heading>

      <List delay={2.05}>
        <ListItem>Sparse retrieval matches literal words through an inverted index and BM25, dense retrieval compares embeddings, and each one covers a gap the other has.</ListItem>
        <ListItem>Dual encoders compare precomputed vectors and scale to huge corpora, cross encoders score a query and a document jointly and are far more accurate but too slow to run over more than a short list.</ListItem>
        <ListItem>Approximate nearest neighbor search skips almost all of a vector index by clustering or by graph search, trading a small amount of accuracy for a search that scales far better than a brute-force scan.</ListItem>
        <ListItem>Hybrid retrieval merges sparse and dense candidate lists before ranking, since the two methods tend to fail on different queries.</ListItem>
        <ListItem>Recall@K and latency sit at opposite ends of the same tradeoff, and tuning K, cluster counts, or graph hops is really about picking a deliberate point on that curve rather than eliminating the tradeoff.</ListItem>
      </List>

      <Paragraph delay={2.10}>
        Zoom out and every piece here is doing the same job, cutting down an impossibly large space of candidates fast enough that a slower, smarter model can afford to look closely at what's left. Get the cheap stage wrong and the expensive stage never sees the right answer. Get the expensive stage wrong and speed doesn't matter, because the order coming back is bad. Most of the interesting engineering in a search system lives in getting that handoff right. Thanks for reading.
      </Paragraph>
    </>
  ),
};
