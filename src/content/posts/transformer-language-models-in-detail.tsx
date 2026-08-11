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
  BlockOrderDiagram,
  AttentionHeatmapGrid,
  CapacityMathDiagram,
} from "../components";
import {
  HeadSharingDiagram,
  RotaryRotationDiagram,
} from "../components/animations/transformer-language-models-in-detail/ConceptViz";
import { Type, Lock, Sparkles, Layers } from "lucide-react";

const blockNodes: DiagramNode[] = [
  { id: "input", label: "Token vector in", sub: "from embeddings or the layer below", icon: Type, color: "text-slate-500", x: 10, y: 50 },
  { id: "attn", label: "Masked self-attention", sub: "RMSNorm in, rotary applied, residual out", icon: Lock, color: "text-blue-500", x: 38, y: 50 },
  { id: "mlp", label: "Gated MLP, SwiGLU", sub: "RMSNorm in, gate applied, residual out", icon: Sparkles, color: "text-indigo-500", x: 64, y: 50 },
  { id: "output", label: "Next layer, or final norm", sub: "same shape as the input", icon: Layers, color: "text-emerald-500", x: 92, y: 50 },
];

const blockEdges: DiagramEdge[] = [
  { id: "e-input-attn", from: "input", to: "attn" },
  { id: "e-attn-mlp", from: "attn", to: "mlp" },
  { id: "e-mlp-output", from: "mlp", to: "output" },
];

export const transformerLanguageModelsInDetail: BlogPostData = {
  title: "Transformer Language Models in Detail",
  date: "August 11, 2026",
  slug: "transformer-language-models-in-detail",
  content: (
    <>
      <Paragraph delay={0.10}>
        Ask a modern chat model a question and watch it answer one word at a time. That word-by-word rhythm is not a display trick, it's the entire computation. Producing each new word means running the whole network again, once per output token, and every run asks the exact same question, what comes next given everything so far. The network that keeps answering that question, over and over, until it decides to stop, is a decoder-only transformer, and this post is about what actually happens inside one while it runs.
      </Paragraph>

      <Paragraph delay={0.15}>
        The core trick each layer leans on is attention, a token compares itself against every other token with a query and a key, and blends in the value vectors of whichever tokens matter most. Take that part as given. What turns that single mechanism into a language model that holds a long conversation without losing word order, without its numbers blowing up after fifty stacked layers, and without needing gigabytes of scratch memory to produce one more word, is a long list of engineering choices sitting on top of it, and those choices are what this post works through.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        From tokens to next-token probabilities
      </Heading>

      <Paragraph delay={0.25}>
        Start at the bottom of the stack. A prompt gets split into tokens, small chunks of text roughly a word or a piece of a word each, and every token gets looked up in an embedding table, a big matrix with one learned row per entry in the model's vocabulary. That lookup turns a sequence of token ids into a sequence of vectors, one per position, and those vectors are what the network actually operates on from here on.
      </Paragraph>

      <Paragraph delay={0.30}>
        Those vectors then pass through a stack of identical blocks, dozens of them in a real model, and every block runs the same two operations, masked self-attention, then a small feed-forward network. Each block folds a little more context from the rest of the sequence into every position's vector. After the last block, one more normalization step runs, and a single output projection maps every position's vector into a score for each entry in the vocabulary. Softmax turns those scores into a probability distribution over the next token, and the model samples from it or just takes the top choice.
      </Paragraph>

      <Paragraph delay={0.35}>
        Decoder-only just means every layer works exactly this way, there's no separate stage that reads a source sequence first and hands off a summary. It's one stack, run start to finish, whether it's reading the prompt or generating a reply. Once a token gets chosen, it gets appended to the sequence, and the whole stack runs again from the bottom, one token longer than before. A hundred-word reply means running this stack roughly a hundred times, once per output token. Reading happens once, generating happens one token at a time.
      </Paragraph>

      <Heading level={2} delay={0.40}>
        Causal masking, seeing only the past
      </Heading>

      <Paragraph delay={0.45}>
        Nothing about a raw attention score stops a token from looking ahead at words that haven't been generated yet. During training, the model sees a whole sentence at once, and if a token could freely attend to words further along, it would learn to just copy the answer instead of predicting it. A causal mask closes that loophole. Before softmax runs, every attention score where the key's position comes after the query's position gets forced to negative infinity.
      </Paragraph>

      <Formula block delay={0.50}>
        {`\\text{score}_{ij} = \\begin{cases} q_i \\cdot k_j \\,/\\, \\sqrt{d_k} & j \\le i \\\\ -\\infty & j > i \\end{cases}`}
      </Formula>

      <Paragraph delay={0.55}>
        Setting a score to negative infinity before softmax is a deliberate trick, not a special case the code has to branch on. Exponentiating negative infinity gives zero, so that position's weight vanishes from the row without touching the softmax formula or any other weight in it. Every token still ends up with a proper probability distribution, it just never gets a chance to peek forward.
      </Paragraph>

      <AttentionHeatmapGrid
        delay={0.06}
        caption="Which of five tokens can attend to which, 1 means allowed and 0 means blocked. Every row can only see itself and what came before it."
        heatmap={{
          rowLabels: ["tok 1", "tok 2", "tok 3", "tok 4", "tok 5"],
          colLabels: ["tok 1", "tok 2", "tok 3", "tok 4", "tok 5"],
          decimals: 0,
          values: [
            [1, 0, 0, 0, 0],
            [1, 1, 0, 0, 0],
            [1, 1, 1, 0, 0],
            [1, 1, 1, 1, 0],
            [1, 1, 1, 1, 1],
          ],
        }}
      />

      <Paragraph delay={0.60}>
        Look at the pattern that produces. The first token can only attend to itself, since nothing came before it. The last token can attend to everything, since everything else already happened. Every token in between sees a widening slice of the past and nothing of the future. That's the mechanical basis for why a decoder-only model trains on whole documents at once and still generates, one token at a time, like it's only ever looking backward.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        Positional information, rotary position embeddings
      </Heading>

      <Paragraph delay={0.70}>
        A plain attention score doesn't know word order on its own, shuffle two tokens and the same query-key comparison produces the same number either way. Some way of injecting position has to sit somewhere in the computation. Rotary position embeddings, RoPE for short, do it by rotating the query and key vectors themselves, by an angle that depends on where a token sits in the sequence, right before the dot product between them runs.
      </Paragraph>

      <Paragraph delay={0.75}>
        Take one pair of dimensions out of a query or key vector and treat it as a single two-dimensional vector. RoPE just spins that little vector around the origin. How far it spins depends on two things, the token's position in the sequence, and which pair of dimensions this is. Every pair rotates at its own fixed rate.
      </Paragraph>

      <Formula block delay={0.80}>
        {`\\theta_i = \\text{base}^{-2i/d}, \\quad i = 0, 1, \\dots, \\tfrac{d}{2}-1`}
      </Formula>

      <Paragraph delay={0.85}>
        Base is usually a large fixed number like 10,000, and d is the dimension of the vector being rotated. The first pair of dimensions, i equal to zero, rotates fast, its angle changes a lot from one position to the next. The last pair rotates barely at all across an entire long document. Stacking pairs that spin at very different speeds gives every position a rotation pattern nothing else shares, the same trick behind sinusoidal position encodings, just applied as a rotation instead of an added vector.
      </Paragraph>

      <Formula block delay={0.90}>
        {`q_m' = R(m\\theta_i)\\, q_m, \\qquad k_n' = R(n\\theta_i)\\, k_n`}
      </Formula>

      <Paragraph delay={0.95}>
        R here is the ordinary two-dimensional rotation matrix, cosine and sine of the angle arranged in the familiar four entries. Rotate the query at position m by m times its angle, rotate the key at position n by n times its angle, and something convenient falls out. Rotating two vectors by the same underlying angle before taking their dot product is equivalent to rotating just one of them by the difference in angle, so the score between m and n ends up depending only on how far apart they are, not on where either one sits in the sequence.
      </Paragraph>

      <RotaryRotationDiagram
        delay={0.07}
        caption="The same query vector at three token positions. The rotation angle grows with position, but the vector's length, its magnitude, never changes."
      />

      <Paragraph delay={1.00}>
        That relative-distance property is the entire payoff. A model trained mostly on short documents still has a sensible notion of what "ten tokens back" and "ten thousand tokens back" feel like, because the rotation angle for a given distance is exactly the same no matter where in a much longer sequence that distance shows up. Nothing about the mechanism has to be relearned as context length grows, which is a big part of why RoPE displaced fixed additive position encodings in most current decoder-only models.
      </Paragraph>

      <Heading level={2} delay={1.05}>
        Normalization, RMSNorm and where it sits
      </Heading>

      <Paragraph delay={1.10}>
        A normalization step's job is to keep the numbers flowing through a deep network in a stable range, so that stacking dozens of blocks doesn't make training fall apart. The classic version, layer normalization, subtracts the mean of a vector's entries and divides by their standard deviation. RMSNorm, the version most current decoder-only models use instead, drops the mean-subtraction step entirely and only rescales by the root-mean-square of the entries.
      </Paragraph>

      <Formula block delay={1.15}>
        {`\\text{RMSNorm}(x) = \\frac{x}{\\sqrt{\\frac{1}{d}\\sum_{j=1}^{d} x_j^2 + \\epsilon}} \\odot \\gamma`}
      </Formula>

      <Paragraph delay={1.20}>
        d is the vector's dimension, epsilon is a tiny constant that keeps the division from ever blowing up on a near-zero vector, and gamma is a learned per-dimension scale applied after the rescale. Skipping the mean-centering step doesn't cost much in practice, and it removes one full reduction over the vector, which matters when this computation runs on every token, in every block, for a model with dozens of layers.
      </Paragraph>

      <Paragraph delay={1.25}>
        Where that normalization step sits inside a block matters just as much as its formula. A pre-norm block runs normalization on a sublayer's input, before attention or the feed-forward network sees it, and adds that sublayer's raw output back onto the un-normalized residual stream. A post-norm block does the reverse, run the sublayer first, add the residual, then normalize the sum. Pre-norm keeps the residual path clean and unscaled all the way through the network, which matters a lot once a model is dozens of layers deep, gradients have a much easier path back to the earliest blocks.
      </Paragraph>

      <BlockOrderDiagram
        delay={0.08}
        panels={[
          {
            title: "Pre-norm, the modern default",
            steps: ["RMSNorm", "Masked self-attention", "Add residual (unnormalized)", "RMSNorm", "SwiGLU MLP", "Add residual (unnormalized)"],
            highlightSteps: [0, 3],
            note: "Normalization runs on the sublayer's input, so the residual path itself stays clean all the way through the stack.",
          },
          {
            title: "Post-norm, the original design",
            steps: ["Masked self-attention", "Add residual", "RMSNorm", "SwiGLU MLP", "Add residual", "RMSNorm"],
            highlightSteps: [2, 5],
            note: "Normalization runs after the residual add, which trains fine at moderate depth but grows less stable the more blocks get stacked.",
          },
        ]}
      />

      <Paragraph delay={1.30}>
        That's why pre-norm placement is now closer to a default than a design choice. Post-norm blocks need a longer, more careful learning-rate warmup to train stably at real depth and can still diverge even then, while pre-norm blocks are simply more forgiving.
      </Paragraph>

      <Heading level={2} delay={1.35}>
        Putting one block together
      </Heading>

      <Paragraph delay={1.40}>
        All of the pieces so far, masked attention, rotary rotations applied to queries and keys, RMSNorm placed before each sublayer, line up into one repeatable unit. A real model just stacks dozens of copies of it.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={320}
        nodes={blockNodes}
        edges={blockEdges}
        caption="One decoder block, start to finish. Attention mixes information across positions, the gated MLP then processes each position on its own, and both sit behind a residual add."
      />

      <Paragraph delay={1.45}>
        Every one of those boxes hides real computation, but the shape repeats identically from block one to block forty, which is a big part of why transformers scale so cleanly. More depth mostly means more copies of an already-understood unit, not a new kind of layer.
      </Paragraph>

      <Heading level={2} delay={1.50}>
        Gated feed-forward layers, SwiGLU
      </Heading>

      <Paragraph delay={1.55}>
        The feed-forward network inside each block used to be about as plain as a neural network gets, one linear layer up to a wider hidden size, a fixed nonlinearity, one linear layer back down. Most current decoder-only models replace that fixed nonlinearity with a gate, a second learned projection of the same input that controls how much of the first projection's signal gets through, dimension by dimension.
      </Paragraph>

      <Formula block delay={1.60}>
        {`\\text{SwiGLU}(x) = \\big(\\text{SiLU}(xW_1) \\odot xW_3\\big)W_2, \\qquad \\text{SiLU}(z) = z \\cdot \\sigma(z)`}
      </Formula>

      <Paragraph delay={1.65}>
        Read it left to right. <Formula>{`xW_1`}</Formula> and <Formula>{`xW_3`}</Formula> are two separate linear projections of the same input, up to a wider hidden dimension. SiLU, sometimes called Swish, is a smooth nonlinearity applied to the first projection, and the circle-dot multiplies that result elementwise against the second, unmodified projection. That elementwise product is the gate, the SiLU branch decides how open each hidden dimension is, and the plain branch supplies the content that flows through it. <Formula>{`W_2`}</Formula> then projects the gated result back down to the model's normal width.
      </Paragraph>

      <CodeBlock
        delay={1.70}
        language="Python"
        code={`import torch.nn.functional as F

def swiglu_mlp(x, w1, w2, w3):
    gate = F.silu(x @ w1)    # which hidden channels get through
    up   = x @ w3            # the content those channels carry
    return (gate * up) @ w2  # project back down to d_model`}
      />

      <Paragraph delay={1.75}>
        Three weight matrices instead of two is a real parameter cost, which is exactly why a gated feed-forward layer's hidden width usually gets shrunk relative to the older two-matrix design, so the two end up costing about the same overall despite the extra matrix. That tradeoff shows up again in the parameter count later in this post.
      </Paragraph>

      <Heading level={2} delay={1.80}>
        Grouped-query and multi-query attention
      </Heading>

      <Paragraph delay={1.85}>
        Ordinary multi-head attention gives every query head its own dedicated key head and value head. That's flexible, every head can look for something different, but it's expensive at generation time in a way that has nothing to do with quality. Every one of those key and value vectors, for every head in every layer, has to be kept around for as long as generation continues, and why that matters is the whole point of the next section.
      </Paragraph>

      <Paragraph delay={1.90}>
        Multi-query attention takes the most aggressive fix, keep the many separate query heads, but give them all exactly one shared key head and one shared value head. Grouped-query attention is the tunable middle ground, split the query heads into a handful of groups, and give each group its own shared key and value head instead of one shared pair for everyone. A model with, say, 32 query heads split into 8 groups (illustrative numbers, not a real model's spec) ends up with 8 key heads and 8 value heads instead of 32 of each.
      </Paragraph>

      <HeadSharingDiagram
        delay={0.07}
        panels={[
          {
            title: "Multi-head, no sharing",
            groups: [
              { queryLabels: ["Q1"], kvLabel: "KV1" },
              { queryLabels: ["Q2"], kvLabel: "KV2" },
              { queryLabels: ["Q3"], kvLabel: "KV3" },
              { queryLabels: ["Q4"], kvLabel: "KV4" },
            ],
            note: "Every query head keeps its own key and value head, 4 query heads need 4 of each.",
          },
          {
            title: "Grouped-query attention",
            groups: [
              { queryLabels: ["Q1", "Q2"], kvLabel: "KV1" },
              { queryLabels: ["Q3", "Q4"], kvLabel: "KV2" },
            ],
            note: "Query heads split into groups, each group shares one key and value head, 4 query heads need only 2 of each.",
          },
          {
            title: "Multi-query attention",
            groups: [
              { queryLabels: ["Q1", "Q2", "Q3", "Q4"], kvLabel: "KV1" },
            ],
            note: "Every query head shares the same single key and value head, 4 query heads need just 1 of each.",
          },
        ]}
      />

      <Paragraph delay={1.95}>
        Fewer distinct key and value heads means a noticeably smaller amount of state to keep around per token, without touching how many query heads exist or how expressive the attention pattern itself can be. It's a memory optimization wearing an attention-variant's clothes, and the next section is exactly where that memory goes.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        The key-value cache
      </Heading>

      <Paragraph delay={2.05}>
        Go back to how generation actually runs. After the model picks a token, that token gets appended and the entire sequence runs through the network again from scratch, one token longer. Taken completely literally, that would mean recomputing the key and value vectors for every single earlier token, at every layer, on every single step, even though those earlier tokens haven't changed and their key and value vectors haven't changed either.
      </Paragraph>

      <Paragraph delay={2.10}>
        The key-value cache is the fix. Store every layer's key and value vectors the first time each token passes through, and on every later step, only compute the new key and value for the one new token, reusing everything already stored for the rest. A decoding step then only needs one new query vector compared against the whole cached history, not a full recomputation of the sequence. That's also why the cache grows the way it does, one more entry per layer per key-value head, added at every decoding step, and it adds up fast across many layers, many heads, and a long generation.
      </Paragraph>

      <CapacityMathDiagram
        delay={0.08}
        caption="Cache size for an illustrative 32-layer model, 128-dim heads, fp16, at an 8,192-token context, across three attention variants."
        groups={[
          {
            title: "Multi-head (32 kv heads)",
            lines: [
              { expression: "2 x 32 layers x 32 kv heads x 128 dim x 2 bytes", result: "512 KB / token" },
              { expression: "512 KB x 8,192 tokens", result: "4.29 GB total" },
            ],
            note: "Standard multi-head attention gives every query head its own key and value head, so the cache scales with all 32 heads.",
          },
          {
            title: "Grouped-query (8 kv heads)",
            lines: [
              { expression: "2 x 32 layers x 8 kv heads x 128 dim x 2 bytes", result: "128 KB / token" },
              { expression: "128 KB x 8,192 tokens", result: "1.07 GB total" },
            ],
            note: "Grouping 32 query heads into 8 shared key-value heads cuts the cache by exactly the grouping factor, 4x here.",
          },
          {
            title: "Multi-query (1 kv head)",
            lines: [
              { expression: "2 x 32 layers x 1 kv head x 128 dim x 2 bytes", result: "16 KB / token" },
              { expression: "16 KB x 8,192 tokens", result: "134 MB total" },
            ],
            note: "Multi-query attention takes grouping to the extreme, one shared key-value head for every query head.",
          },
          {
            title: "What changes",
            lines: [
              { expression: "32 kv heads -> 8 kv heads", result: "4x smaller" },
              { expression: "32 kv heads -> 1 kv head", result: "32x smaller" },
            ],
            note: "Same context length, same model, wildly different cache size, purely from how many key-value heads exist.",
          },
        ]}
      />

      <Paragraph delay={2.15}>
        Multi-head attention, with a separate key and value head for every one of 32 query heads, needs about four gigabytes of cache just to hold an 8,192-token context here. Cut that down to 8 shared key-value heads with grouped-query attention and the same context costs about one gigabyte instead, purely from having fewer distinct heads worth caching. That's the actual, practical reason grouped-query and multi-query attention exist, not accuracy, memory.
      </Paragraph>

      <Heading level={2} delay={2.20}>
        Context length, and what it costs
      </Heading>

      <Paragraph delay={2.25}>
        Context length interacts with two different costs, and it's easy to conflate them. Processing a long prompt for the first time, sometimes called the prefill, still needs the full attention score matrix, every token compared against every other, so that cost grows quadratically as the prompt gets longer, doubling the prompt roughly quadruples it. Generating new tokens afterward is different, each new step only compares one new query against the cache, so the per-step cost grows linearly with how much has been cached so far, not quadratically.
      </Paragraph>

      <Paragraph delay={2.30}>
        The cache itself is what eventually becomes the bottleneck at long context, not the per-step compute. A cache that grows linearly with sequence length still grows without bound, and at some point the memory it needs, stacked across every layer and every request being served at once, is what actually limits how long a context a model can practically handle. That's exactly the pressure grouped-query and multi-query attention exist to relieve.
      </Paragraph>

      <Heading level={2} delay={2.35}>
        Counting a model's parameters
      </Heading>

      <Paragraph delay={2.40}>
        Every number quoted about a model's size, seven billion parameters, seventy billion, comes from the same handful of building blocks added up, the embedding table, and the weights inside every repeated block, multiplied by however many blocks the model stacks.
      </Paragraph>

      <Formula block delay={2.45}>
        {`P \\approx V d_{model} + N_{layers}\\big(4 d_{model}^2 + 3 d_{model} d_{ff}\\big)`}
      </Formula>

      <Paragraph delay={2.50}>
        V is the vocabulary size and <Formula>{`d_{model}`}</Formula> is the width of every token's vector, so V times <Formula>{`d_{model}`}</Formula> is the embedding table's size, one learned row per vocabulary entry. Inside every layer, the four attention projections, query, key, value, and the output projection that recombines the heads, are each roughly <Formula>{`d_{model}`}</Formula> by <Formula>{`d_{model}`}</Formula>, giving the <Formula>{`4 d_{model}^2`}</Formula> term (grouped-query or multi-query attention trims this term a little by shrinking the key and value projections, though the bigger effect is on the cache, not the parameter count). The gated feed-forward network needs three matrices of size <Formula>{`d_{model}`}</Formula> by <Formula>{`d_{ff}`}</Formula> instead of two, the <Formula>{`3 d_{model} d_{ff}`}</Formula> term. Multiply the per-layer total by the number of layers, add the embedding table once, and that's the model's parameter count.
      </Paragraph>

      <CodeBlock
        delay={2.55}
        language="Python"
        code={`d_model, d_ff, num_layers, vocab = 4096, 12288, 32, 32000

attn_per_layer = 4 * d_model * d_model
mlp_per_layer  = 3 * d_model * d_ff
per_layer      = attn_per_layer + mlp_per_layer

total_layers = per_layer * num_layers
embedding    = vocab * d_model
total_params = total_layers + embedding

# attn_per_layer  ~67.1M    mlp_per_layer ~151.0M
# per_layer       ~218.1M   total_layers  ~6.98B
# embedding       ~131.1M   total_params  ~7.11B`}
      />

      <Paragraph delay={2.60}>
        Illustrative numbers, not any specific published model's actual configuration, but they land in a familiar range on purpose. A 32-layer model at this width comes out to roughly seven billion parameters, and the feed-forward matrices, not the attention projections, make up the bigger share of every single layer. If the output projection back to vocabulary size is a separate untied matrix rather than the same embedding table reused, add roughly another hundred and thirty million on top.
      </Paragraph>

      <Heading level={2} delay={2.65}>
        Putting it end to end
      </Heading>

      <Paragraph delay={2.70}>
        One more pass through the whole pipeline, start to finish.
      </Paragraph>

      <List ordered delay={2.75}>
        <ListItem>Tokens get embedded into vectors, one per position.</ListItem>
        <ListItem>Every block normalizes with RMSNorm, runs masked self-attention with rotary rotations applied to queries and keys, and adds the result back onto the residual stream.</ListItem>
        <ListItem>The same block normalizes again and runs a gated SwiGLU feed-forward network, adding that result back onto the residual stream too.</ListItem>
        <ListItem>That block stacks dozens of times, then one final normalization and an output projection produce next-token probabilities.</ListItem>
        <ListItem>At generation time, every layer's key and value vectors get cached, so each new step only computes one new token's worth of work, not the whole sequence again.</ListItem>
      </List>

      <Heading level={2} delay={2.80}>
        Takeaways
      </Heading>

      <List delay={2.85}>
        <ListItem>A decoder-only model repeats one block, masked self-attention then a gated feed-forward network, dozens of times, and produces one token per full pass through the whole stack.</ListItem>
        <ListItem>Causal masking and rotary position embeddings both operate directly on attention scores, one blocks illegal future lookups, the other injects relative position by rotating queries and keys before their dot product runs.</ListItem>
        <ListItem>RMSNorm and pre-norm placement keep a very deep stack of blocks trainable, and SwiGLU's gate replaces a fixed nonlinearity with a learned one at the cost of a third weight matrix.</ListItem>
        <ListItem>Grouped-query and multi-query attention exist almost entirely to shrink the key-value cache, since the cache, not raw compute, is usually what limits how long a context a model can serve.</ListItem>
        <ListItem>A model's total parameter count falls out of just a few numbers, vocabulary size, model width, feed-forward width, and layer count, repeated and added up.</ListItem>
      </List>

      <Paragraph delay={2.90}>
        None of this is exotic once it's laid out piece by piece, a masked comparison, a rotation, a rescale, a gate, a cache that remembers what it already computed. What makes a specific model good or bad at its job is mostly what happens around this architecture, the data, the training recipe, the scale, rather than the architecture itself, which has settled into something close to a shared default across the field. Thanks for reading.
      </Paragraph>
    </>
  ),
};
