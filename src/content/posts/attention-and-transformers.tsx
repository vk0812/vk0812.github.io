import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  CodeBlock,
  Formula,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
} from "../components";
import { AttentionHeatmapGrid } from "../components/figures/AttentionHeatmapGrid";
import {
  Type,
  SlidersHorizontal,
  Grid3x3,
  Sigma,
  ArrowRightLeft,
} from "lucide-react";

const qkvFlowNodes: DiagramNode[] = [
  { id: "emb", label: "Token embeddings", icon: Type, color: "text-slate-500", x: 5, y: 50 },
  { id: "q", label: "Query projection", sub: "W_Q", icon: SlidersHorizontal, color: "text-blue-500", x: 26, y: 18 },
  { id: "k", label: "Key projection", sub: "W_K", icon: SlidersHorizontal, color: "text-indigo-500", x: 26, y: 50 },
  { id: "v", label: "Value projection", sub: "W_V", icon: SlidersHorizontal, color: "text-violet-500", x: 26, y: 82 },
  { id: "scores", label: "Scores", sub: "Q · K^T, / sqrt(d_k)", icon: Grid3x3, color: "text-pink-500", x: 48, y: 34 },
  { id: "weights", label: "Attention weights", sub: "softmax per row", icon: Sigma, color: "text-orange-500", x: 70, y: 34 },
  { id: "output", label: "Output", sub: "weighted sum of V", icon: ArrowRightLeft, color: "text-emerald-500", x: 92, y: 58 },
];

const qkvFlowEdges: DiagramEdge[] = [
  { id: "e-emb-q", from: "emb", to: "q" },
  { id: "e-emb-k", from: "emb", to: "k" },
  { id: "e-emb-v", from: "emb", to: "v" },
  { id: "e-q-scores", from: "q", to: "scores" },
  { id: "e-k-scores", from: "k", to: "scores" },
  { id: "e-scores-weights", from: "scores", to: "weights" },
  { id: "e-weights-output", from: "weights", to: "output" },
  { id: "e-v-output", from: "v", to: "output" },
];

export const attentionAndTransformers: BlogPostData = {
  title: "Attention and Transformers",
  date: "August 1, 2026",
  slug: "attention-and-transformers",
  content: (
    <>
      <Paragraph delay={0.1}>
        A recurrent network has to squeeze an entire sentence through a single hidden state, updated one word at a time. The further back a piece of information sits, the more steps its gradient has to survive to still matter. That bottleneck is real, not theoretical: gradients shrink or explode over long sequences, and a fixed-size context vector has to represent input of any length. Attention was built to remove exactly that bottleneck, by letting every position look directly at every other position instead of relying on a chain of hidden states to carry information forward.
      </Paragraph>

      <Paragraph delay={0.15}>
        The one-sentence version. Instead of compressing a sequence into one summary vector, attention lets each token ask every other token "how relevant are you to me right now", turn those relevance scores into weights, and build its new representation as a weighted blend of everyone's contribution. No recurrence, no step-by-step chain, every position reachable from every other position in a single hop.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        Queries, keys, and values
      </Heading>

      <Paragraph delay={0.25}>
        The mechanism borrows its vocabulary from information retrieval. Imagine searching a library. You show up with a <strong>query</strong>, a description of what you're looking for. Every book on the shelf has a <strong>key</strong>, a short tag describing what it's about. You compare your query against every key to see how well each book matches, and for the books that match well, you actually read their <strong>value</strong>, the content itself. Attention runs the same three-part comparison on vectors instead of books.
      </Paragraph>

      <Paragraph delay={0.3}>
        Every token's embedding gets projected through three separate learned weight matrices, <Formula>{`W_Q`}</Formula>, <Formula>{`W_K`}</Formula>, and <Formula>{`W_V`}</Formula>, producing a query vector, a key vector, and a value vector for that token. A token's query gets compared against every other token's key to produce a relevance score, those scores turn into weights, and the token's new representation is the weighted sum of everyone's value vectors, itself included. Nothing here is recurrent. Every token's query can be compared against every key in one matrix multiply, regardless of how far apart the two tokens sit in the sequence.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Scaled dot-product attention
      </Heading>

      <Paragraph delay={0.4}>
        Stack every token's query, key, and value vector into matrices <Formula>{`Q`}</Formula>, <Formula>{`K`}</Formula>, and <Formula>{`V`}</Formula>, one row per token, and the whole mechanism collapses into one formula.
      </Paragraph>

      <Formula block delay={0.45}>
        {`\\operatorname{Attention}(Q, K, V) = \\operatorname{softmax}\\left(\\frac{Q K^T}{\\sqrt{d_k}}\\right) V`}
      </Formula>

      <Paragraph delay={0.5}>
        <Formula>{`Q K^T`}</Formula> computes a raw relevance score for every query against every key, one dot product per pair, giving an N by N matrix for a sequence of N tokens. Softmax turns each row of that matrix into a set of weights that sum to one, so every token ends up with a proper probability distribution over which other tokens to borrow from. Multiplying by <Formula>{`V`}</Formula> then blends the value vectors according to those weights, one weighted average per token.
      </Paragraph>

      <Paragraph delay={0.55}>
        The division by <Formula>{`\\sqrt{d_k}`}</Formula> looks like a minor detail but it's load-bearing. Assume the entries of <Formula>{`Q`}</Formula> and <Formula>{`K`}</Formula> are roughly independent with mean zero and variance one. A dot product between two such vectors of dimension <Formula>{`d_k`}</Formula> is a sum of <Formula>{`d_k`}</Formula> independent products, so its variance grows linearly with <Formula>{`d_k`}</Formula>, and its standard deviation grows with <Formula>{`\\sqrt{d_k}`}</Formula>. With a large <Formula>{`d_k`}</Formula>, the raw scores can land far out on the tails, and softmax applied to inputs with a wide spread saturates: a couple of scores dominate completely, and the rest get a weight indistinguishable from zero. That flattens the gradient almost everywhere except right around the dominant entry, which makes the whole layer much harder to train. Dividing every score by <Formula>{`\\sqrt{d_k}`}</Formula> rescales the standard deviation back down to roughly one regardless of how large <Formula>{`d_k`}</Formula> is, keeping softmax in a range where its gradient is actually useful.
      </Paragraph>

      <Heading level={2} delay={0.6}>
        A worked example, by hand
      </Heading>

      <Paragraph delay={0.65}>
        Take three tokens, call them "The", "cat", "sat", each represented by a 4-dimensional query, key, and value vector chosen small enough to trace by hand. The value vectors are the 3x3 identity, purely so the output at the end is easy to read directly off the attention weights themselves.
      </Paragraph>

      <CodeBlock
        delay={0.7}
        language="Python"
        code={`import numpy as np

Q = np.array([
    [1.0, 0.0, 1.0, 0.0],   # query for "The"
    [0.0, 1.0, 0.0, 1.0],   # query for "cat"
    [1.0, 1.0, 0.0, 0.0],   # query for "sat"
])
K = np.array([
    [1.0, 0.0, 1.0, 0.0],   # key for "The"
    [0.0, 1.0, 1.0, 0.0],   # key for "cat"
    [1.0, 1.0, 1.0, 1.0],   # key for "sat"
])
V = np.array([
    [1.0, 0.0, 0.0],
    [0.0, 1.0, 0.0],
    [0.0, 0.0, 1.0],
])

d_k = Q.shape[1]
scores = Q @ K.T
scaled = scores / np.sqrt(d_k)

def softmax(x):
    e = np.exp(x - x.max(axis=-1, keepdims=True))
    return e / e.sum(axis=-1, keepdims=True)

weights = softmax(scaled)
output = weights @ V

# scores  = [[2. 1. 2.] [0. 1. 2.] [1. 1. 2.]]
# scaled  = [[1.  0.5 1. ] [0.  0.5 1. ] [0.5 0.5 1. ]]   (divided by sqrt(4) = 2)
# weights = [[0.3837 0.2327 0.3837]
#            [0.1863 0.3072 0.5065]
#            [0.2741 0.2741 0.4519]]
# output  = same three rows as weights, since V is the identity`}
      />

      <Paragraph delay={0.75}>
        "sat" ends up attending most heavily to itself, weight <Formula>{`0.4519`}</Formula>, splitting the rest almost evenly between "The" and "cat". "The" and "sat" happen to have identical keys here, which is exactly why they receive the same weight, <Formula>{`0.3837`}</Formula>, from "The"'s query, dot products only care about how aligned two vectors are, not which token produced them.
      </Paragraph>

      <AttentionHeatmapGrid
        delay={0.08}
        caption="Attention weights for the three-token toy example, each row sums to one, sat leans on itself most and The and cat get identical treatment from The's query."
        heatmap={{
          rowLabels: ["The", "cat", "sat"],
          colLabels: ["The", "cat", "sat"],
          values: [
            [0.3837, 0.2327, 0.3837],
            [0.1863, 0.3072, 0.5065],
            [0.2741, 0.2741, 0.4519],
          ],
        }}
      />

      <Paragraph delay={0.8}>
        Because <Formula>{`V`}</Formula> is the identity in this toy setup, the output rows are literally the attention weight rows, there's nothing extra to compute. In a real model <Formula>{`V`}</Formula> holds actual learned content vectors, so the output is a genuine blend rather than a copy of the weights, but the arithmetic that produces the blend is exactly what ran above.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={340}
        nodes={qkvFlowNodes}
        edges={qkvFlowEdges}
        caption="One attention head end to end. Every token's embedding is projected into a query, key, and value, the query and key produce scores, scaling and softmax turn scores into weights, and the weights blend the value vectors into the output."
      />

      <Heading level={2} delay={0.85}>
        Multi-head attention
      </Heading>

      <Paragraph delay={0.9}>
        A single attention operation learns one notion of "relevance", one way of comparing queries to keys. Real language needs several notions running at once, one head might track subject-verb agreement, another might track which pronoun refers to which noun, another might track local word order. <strong>Multi-head attention</strong> runs several attention operations in parallel, each with its own <Formula>{`W_Q`}</Formula>, <Formula>{`W_K`}</Formula>, <Formula>{`W_V`}</Formula>, each working in a smaller subspace of the full model dimension, then concatenates all the heads' outputs and passes the result through one more learned projection.
      </Paragraph>

      <Formula block delay={0.95}>
        {`\\operatorname{MultiHead}(Q, K, V) = \\operatorname{Concat}(\\operatorname{head}_1, \\dots, \\operatorname{head}_h) W_O`}
      </Formula>

      <Paragraph delay={1.0}>
        with each <Formula>{`\\operatorname{head}_i = \\operatorname{Attention}(Q W_Q^{(i)}, K W_K^{(i)}, V W_V^{(i)})`}</Formula>. If the full model dimension is <Formula>{`d_{model}`}</Formula> and there are <Formula>{`h`}</Formula> heads, each head typically works with <Formula>{`d_k = d_{model} / h`}</Formula>, so splitting into more heads doesn't add parameters, it just divides the same total capacity into narrower, more specialized slices. The output projection <Formula>{`W_O`}</Formula> gives the model one more chance to mix information across heads before it moves on.
      </Paragraph>

      <Heading level={2} delay={1.05}>
        Attention alone doesn't know word order
      </Heading>

      <Paragraph delay={1.1}>
        Look back at the formula for scaled dot-product attention and notice what it doesn't contain: any reference to position. Shuffle the rows of <Formula>{`Q`}</Formula>, <Formula>{`K`}</Formula>, and <Formula>{`V`}</Formula> in the same order and the set of outputs is exactly the same set, just permuted to match. Attention is a function over a set of tokens, not a sequence, and "the dog bit the man" would attend identically to "the man bit the dog" if nothing else told the model which word came first.
      </Paragraph>

      <Paragraph delay={1.15}>
        The fix is to inject position directly into the input, before any attention runs, rather than changing the attention formula itself. The original approach adds a <strong>sinusoidal positional encoding</strong> to each token's embedding, a fixed vector built from sine and cosine waves of different frequencies, one pair of frequencies per dimension. Low dimensions oscillate quickly and change with every single position. High dimensions oscillate slowly and only shift over many positions. Combining them gives every position in the sequence a distinct fingerprint, and nearby positions end up with fingerprints that are close to each other in a way the model can learn to exploit. Because the encoding is fixed rather than learned, it also generalizes to sequence lengths never seen during training, whatever position comes next just continues the same sine wave.
      </Paragraph>

      <Paragraph delay={1.2}>
        Later architectures moved past adding a fixed vector up front. <strong>Rotary position embeddings</strong> rotate the query and key vectors by an angle that depends on position before the dot product runs, so the score between two tokens ends up depending on their relative distance rather than their absolute positions. <strong>Relative position biases</strong> take an even more direct route, adding a learned or fixed offset straight into the attention scores based on how far apart two tokens are. Both aim at the same weakness in the original sinusoidal scheme, that a model trained mostly on shorter sequences doesn't automatically reason well about relative distance once sequences get long, and both have shown up widely in newer transformer variants.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        Masking, controlling who can look at whom
      </Heading>

      <Paragraph delay={1.3}>
        Nothing about the attention formula stops a token from attending to a position it shouldn't be allowed to see yet. Two situations call for shutting that down, and both use the same trick, adding negative infinity to a score before softmax runs, which drives that position's weight to zero without touching anything else in the row.
      </Paragraph>

      <Paragraph delay={1.35}>
        A <strong>causal mask</strong> is what makes autoregressive generation possible at all, a decoder predicting the next word can't be allowed to peek at words that come after it, or it would be cheating, effectively looking up the answer. The mask sets every score where a key's position comes after the query's position to negative infinity, so each token can only attend to itself and everything before it. A <strong>padding mask</strong> solves a more mundane problem, batches of sequences get padded to a common length so they fit in one tensor, and the mask makes sure nothing attends to those padding positions, which carry no real information and would otherwise dilute the weighted sum with garbage.
      </Paragraph>

      <Paragraph delay={1.4}>
        Applying a causal mask to the exact toy example from before shows the effect directly. Set every score where the key comes after the query to negative infinity, then run softmax as usual.
      </Paragraph>

      <CodeBlock
        delay={1.45}
        language="Python"
        code={`mask = np.triu(np.ones((3, 3)), k=1).astype(bool)  # True where key position > query position
masked_scaled = scaled.copy()
masked_scaled[mask] = -1e9

causal_weights = softmax(masked_scaled)

# masked_scaled = [[ 1.  -1e9 -1e9]
#                  [ 0.   0.5 -1e9]
#                  [ 0.5  0.5  1. ]]
# causal_weights = [[1.     0.     0.    ]
#                    [0.3775 0.6225 0.    ]
#                    [0.2741 0.2741 0.4519]]`}
      />

      <Paragraph delay={1.5}>
        "The" now attends entirely to itself, there's nothing before it to look at. "cat" splits its attention between "The" and itself, "sat" is unaffected here since it was already the last token and had every earlier position available to it anyway. Every row still sums to one, softmax over a set that includes negative infinity just silently drops those entries to zero weight rather than raising an error.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        Encoder, decoder, and encoder-decoder
      </Heading>

      <Paragraph delay={1.6}>
        Attention shows up in three broad architectural shapes. An <strong>encoder</strong> stack, used by models built for understanding a full input at once (classification, embeddings, search), runs unmasked self-attention. Every token can see every other token in both directions, since the whole input is available up front. A <strong>decoder</strong> stack, used for open-ended generation, runs causally masked self-attention instead. Each token can only see itself and earlier tokens, matching the fact that generation happens one token at a time with no future tokens to peek at yet.
      </Paragraph>

      <Paragraph delay={1.62}>
        An <strong>encoder-decoder</strong> setup pairs the two. An encoder processes the full source sequence, and a decoder generates the target sequence using causally masked self-attention over what it's generated so far. It also adds an extra cross-attention step, where the decoder's queries attend over the encoder's keys and values, the same mechanism as before, just drawing its keys and values from a different sequence than its queries.
      </Paragraph>

      <Heading level={2} delay={1.65}>
        The rest of a transformer block
      </Heading>

      <Paragraph delay={1.7}>
        Attention is the part of a transformer block that lets tokens exchange information, but it's not the only thing happening inside one. After multi-head attention produces its output, every position passes independently through the same small feedforward network, typically two linear layers with a nonlinearity in between, expanding to a wider hidden dimension and back down. Attention mixes information across positions, the feedforward block then processes each position's mixed representation on its own, and stacking the two gives the block both cross-token mixing and per-token nonlinear transformation in the same layer.
      </Paragraph>

      <Paragraph delay={1.75}>
        Both the attention sublayer and the feedforward sublayer sit behind a residual connection, the sublayer's output gets added back to its input rather than replacing it, and a normalization step keeps activations in a stable range as they flow through many stacked blocks. That combination of residual paths and normalization is what actually makes it possible to stack dozens of these blocks without training collapsing, a topic broad enough that it deserves its own dedicated treatment rather than a few sentences tacked onto this one, but the short version is that attention on its own would be strangled by unstable gradients at real depth without it.
      </Paragraph>

      <Heading level={2} delay={1.8}>
        The cost of looking at everything
      </Heading>

      <Paragraph delay={1.85}>
        Full self-attention's main advantage is that every token has a direct path to every other token. That same property is also its main structural cost. Computing <Formula>{`Q K^T`}</Formula> for a sequence of length <Formula>{`N`}</Formula> produces an <Formula>{`N \\times N`}</Formula> score matrix, so both the compute and the memory needed for one attention layer scale quadratically with sequence length. Double the sequence length and the attention computation roughly quadruples. That's a very different scaling curve from recurrence, which does a fixed amount of work per step and scales linearly with length. It's the direct tradeoff for removing the long-range bottleneck recurrence had: unlimited direct reach between any two positions, paid for with a cost that grows a lot faster as sequences get long. A large amount of transformer research since the original architecture, sparse attention patterns, chunked or linear approximations to the full score matrix, and so on, exists specifically to chip away at that quadratic cost for long sequences.
      </Paragraph>

      <Heading level={2} delay={1.9}>
        Takeaways
      </Heading>

      <List delay={1.95}>
        <ListItem>Attention replaces a recurrent network's single fixed-size summary with direct, weighted access to every position in the sequence, computed in one matrix multiply rather than a step-by-step chain.</ListItem>
        <ListItem>Scaled dot-product attention is softmax(QK^T / sqrt(d_k)) times V, the division by sqrt(d_k) keeps the pre-softmax scores from growing with dimension and saturating the softmax into a near-zero gradient regime.</ListItem>
        <ListItem>Multi-head attention runs several smaller attention operations in parallel subspaces so the model can track several different notions of relevance at once, then recombines them with one more learned projection.</ListItem>
        <ListItem>Attention itself is permutation invariant, so position has to be injected separately, sinusoidal encodings, rotary rotations, and relative position biases are three different ways of doing that.</ListItem>
        <ListItem>Causal and padding masks control who's allowed to attend to whom, and the quadratic cost in sequence length is the direct price of giving every token a hop to every other token.</ListItem>
      </List>

      <Paragraph delay={2.0}>
        Everything else that makes a modern transformer, how deep to stack blocks, how to normalize, how to schedule training, sits on top of this one mechanism, a query comparing itself against a set of keys and blending the matching values. Get comfortable with that single matrix multiply and a softmax, and most of what follows in a transformer paper reads as an engineering decision layered on top of an idea that fits in one line of math. Thanks for reading.
      </Paragraph>
    </>
  ),
};
