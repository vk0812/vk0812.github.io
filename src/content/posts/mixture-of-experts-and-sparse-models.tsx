import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  List,
  ListItem,
  StatTiles,
  IconArchitectureDiagram,
} from "../components";
import {
  Layers,
  GitFork,
  Cpu,
  Sigma,
  ArrowUpRight,
  Boxes,
  Crosshair,
  Database,
  Zap,
} from "lucide-react";
import { TokenRoutingOverflowDiagram } from "../components/animations/mixture-of-experts-and-sparse-models/ConceptViz";

export const mixtureOfExpertsAndSparseModels: BlogPostData = {
  title: "Mixture of experts and sparse models",
  date: "August 12, 2026",
  slug: "mixture-of-experts-and-sparse-models",
  content: (
    <>
      <Paragraph delay={0.10}>
        Ask a huge language model to finish a sentence and something surprising happens under the hood. The model might have tens of billions, even hundreds of billions, of parameters sitting in memory, but only a small slice of them actually do any work to produce that one next word. Most of the network stays quiet. That's not a bug. It's the whole idea behind mixture of experts, one of the tricks that lets language models keep growing without inference cost growing at the same rate.
      </Paragraph>

      <Paragraph delay={0.15}>
        A normal transformer block runs every token through the same feed-forward network, no matter what the token is. A mixture of experts layer swaps that single network for several smaller ones, called experts, plus a small router that decides which few of them actually get to see a given token. Most experts sit idle for most tokens. That's the whole trick. Most of the model's weights exist, but only a fraction of them turn on for any one word.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Swapping one feed-forward network for several
      </Heading>

      <Paragraph delay={0.25}>
        Every transformer block already has two main pieces, a self-attention layer that lets tokens look at each other, and a feed-forward network that processes each token on its own, one at a time. Mixture of experts only touches the second piece. Instead of one feed-forward network processing every token identically, the block keeps several of them side by side, each with its own separate weights.
      </Paragraph>

      <Paragraph delay={0.30}>
        A small <strong>router</strong> sits in front of them and looks at each token as it arrives, then decides which one or two experts actually get to process it. The rest of the experts do nothing for that token at all. That's the sparse part of "sparse models", most of the parameters are there, but they don't fire for every input the way a dense layer's parameters would.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        The router, picking who goes where
      </Heading>

      <Paragraph delay={0.40}>
        The router itself is almost embarrassingly simple. It's a single linear layer that takes a token's embedding and outputs one score per expert, then a softmax turns those scores into a probability distribution over all the experts. The token goes to whichever expert or experts have the highest probability, a step called top-k selection. Most real designs use top-1 or top-2, sending each token to either its single best expert or its two best experts.
      </Paragraph>

      <Paragraph delay={0.45}>
        Here's a small worked example to keep this concrete. Take the sentence "The cat sat down" and a mixture of experts layer with 4 experts, using top-1 routing so each token goes to exactly one expert. The router computes 4 scores for every token, one per expert, then runs them through softmax.
      </Paragraph>

      <List delay={0.50}>
        <ListItem>"The" puts 69.5 percent of its probability on Expert 1, well ahead of any other expert, so it routes there.</ListItem>
        <ListItem>"cat" also lands on Expert 1, with 57.8 percent of its probability.</ListItem>
        <ListItem>"sat" splits differently and lands on Expert 2, with 70.3 percent.</ListItem>
        <ListItem>"down" lands on Expert 1 again, with 54.5 percent, its highest score even though Expert 1 already has two tokens waiting.</ListItem>
      </List>

      <Paragraph delay={0.55}>
        Three of the four tokens want the same expert. Whether that's actually allowed depends on something the router alone doesn't decide, expert capacity.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={640}
        nodes={[
          { id: "tokens", label: "Token embeddings", sub: "4 tokens in this example", icon: Layers, color: "text-slate-500", x: 50, y: 8 },
          { id: "router", label: "Router", sub: "linear layer + softmax, top-k", icon: GitFork, color: "text-blue-500", x: 50, y: 30 },
          { id: "expert1", label: "Expert 1", icon: Cpu, color: "text-purple-500", x: 14, y: 56 },
          { id: "expert2", label: "Expert 2", icon: Cpu, color: "text-purple-500", x: 38, y: 56 },
          { id: "expert3", label: "Expert 3", icon: Cpu, color: "text-purple-500", x: 62, y: 56 },
          { id: "expert4", label: "Expert 4", icon: Cpu, color: "text-purple-500", x: 86, y: 56 },
          { id: "combine", label: "Weighted combine", sub: "scaled by router", icon: Sigma, color: "text-amber-500", x: 50, y: 80 },
          { id: "output", label: "Back into the residual stream", icon: ArrowUpRight, color: "text-emerald-500", x: 50, y: 97 },
        ]}
        edges={[
          { id: "e-tok-router", from: "tokens", to: "router" },
          { id: "e-router-e1", from: "router", to: "expert1" },
          { id: "e-router-e2", from: "router", to: "expert2" },
          { id: "e-router-e3", from: "router", to: "expert3" },
          { id: "e-router-e4", from: "router", to: "expert4" },
          { id: "e-e1-combine", from: "expert1", to: "combine" },
          { id: "e-e2-combine", from: "expert2", to: "combine" },
          { id: "e-e3-combine", from: "expert3", to: "combine" },
          { id: "e-e4-combine", from: "expert4", to: "combine" },
          { id: "e-combine-out", from: "combine", to: "output" },
        ]}
        caption="One token's path through a mixture of experts layer, from the router's decision to the weighted combine that adds each chosen expert's output back into the residual stream."
      />

      <Paragraph delay={0.60}>
        Only the experts the router actually picks do any computation, everything else in that row just sits there for this token. Whatever they produce gets scaled by the router's own probability for that expert, then summed and added back into the residual stream, the same way a normal feed-forward output would be.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        Expert capacity, and what happens when it fills up
      </Heading>

      <Paragraph delay={0.70}>
        Real training runs process tokens in large batches, thousands of tokens at once, spread across many devices. If the router could send an unlimited number of tokens to one expert, that expert's device would end up doing far more work than any other device in the same forward pass, and the whole batch would have to wait for it to finish. To keep compute and memory bounded, every expert gets a fixed <strong>expert capacity</strong>, a maximum number of tokens it's allowed to accept out of the current batch.
      </Paragraph>

      <Formula block delay={0.75}>
        {`\\text{capacity} = \\text{capacity factor} \\times \\frac{T \\times k}{E}`}
      </Formula>

      <Paragraph delay={0.80}>
        <Formula>{`T`}</Formula> is the number of tokens in the batch, <Formula>{`k`}</Formula> is how many experts each token gets routed to, and <Formula>{`E`}</Formula> is the total number of experts. With 4 tokens, top-1 routing, 4 experts, and a capacity factor of 2 to leave some slack, each expert's capacity works out to 2 tokens. Perfectly balanced routing would send exactly 1 token to each expert, so a capacity of 2 leaves room for some imbalance before anything actually gets dropped.
      </Paragraph>

      <Paragraph delay={0.85}>
        That's exactly what happens in the worked example above. Expert 1 already holds "The" and "cat" by the time "down" asks to join, and its capacity of 2 is full. "down" overflows. Depending on the implementation, an overflowing token either gets dropped from that expert entirely, or it skips the feed-forward computation for this layer and passes straight through the residual connection unchanged. Either way, "down" doesn't get the benefit of an expert's feed-forward network at this layer, purely because of when it happened to arrive relative to its neighbors.
      </Paragraph>

      <TokenRoutingOverflowDiagram
        delay={0.08}
        caption="The same 4 tokens routed live. Expert 1 fills after 'The' and 'cat', so 'down' overflows and skips the layer instead."
      />

      <Paragraph delay={0.90}>
        Notice something else in that animation. Expert 3 and Expert 4 never got a single token in this batch. That's a toy example with only 4 tokens, but the same pattern shows up at real scale too, and it's the actual problem worth worrying about, not just the one dropped token.
      </Paragraph>

      <Heading level={2} delay={0.95}>
        Why naive routing collapses
      </Heading>

      <Paragraph delay={1.00}>
        Left alone, a router tends to develop favorites early in training, often for no better reason than a small random head start. An expert that gets slightly more traffic early on receives slightly more gradient updates, which makes it slightly better at whatever those tokens need, which makes the router slightly more likely to send it even more tokens next time. Repeat that loop a few thousand steps and the router ends up leaning on 2 or 3 experts out of many, while the rest barely ever get trained at all.
      </Paragraph>

      <Paragraph delay={1.05}>
        This matters for more than compute efficiency. An undertrained expert isn't just wasted capacity sitting on a GPU somewhere. It's a part of the model that never learned anything useful, and any token that does get routed there produces a weak, half-trained output. Fixing the collapse is a correctness problem as much as an efficiency one, and it needs to be fixed during training itself, not patched after the fact.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        The load balancing loss
      </Heading>

      <Paragraph delay={1.15}>
        The standard fix adds a second loss term during training, alongside whatever loss the model is actually being trained on, that explicitly rewards balanced routing. It looks at two things for every expert, how often tokens actually get routed there, and how much probability the router assigns it on average across the whole batch, whether or not those tokens end up going there.
      </Paragraph>

      <Formula block delay={1.20}>
        {`\\mathcal{L}_{aux} = \\alpha \\, E \\, \\sum_{e=1}^{E} f_e \\, P_e`}
      </Formula>

      <Paragraph delay={1.25}>
        <Formula>{`E`}</Formula> is the number of experts. <Formula>{`f_e`}</Formula> is the fraction of tokens in the batch whose top routing choice was expert <Formula>{`e`}</Formula>, a plain count divided by the batch size, purely about which expert each token actually ended up at. <Formula>{`P_e`}</Formula> is the average probability the router assigned to expert <Formula>{`e`}</Formula> across every token in the batch, whether or not that token was routed there, so it reflects what the router as a whole believes about expert <Formula>{`e`}</Formula>. Multiplying <Formula>{`f_e`}</Formula> by <Formula>{`P_e`}</Formula> and summing over every expert gives a number that grows whenever routing and router confidence both concentrate on the same few experts, and shrinks toward its lowest value when both spread evenly across every expert instead. <Formula>{`\\alpha`}</Formula> is a small tunable coefficient, often around 0.01, that decides how much weight this term gets next to the model's real task loss.
      </Paragraph>

      <CodeBlock
        delay={1.30}
        language="Python"
        code={`import numpy as np

logits = np.array([
    [2.0, 0.5, -1.0, 0.2],   # "The"
    [1.8, 0.3, 0.9, -0.5],   # "cat"
    [0.4, 2.1, 0.2, -0.3],   # "sat"
    [1.5, -0.2, 0.1, 0.6],   # "down"
])

def softmax(z):
    z = z - z.max(axis=-1, keepdims=True)
    e = np.exp(z)
    return e / e.sum(axis=-1, keepdims=True)

probs = softmax(logits)
top1 = probs.argmax(axis=1)

num_experts = 4
f = np.array([(top1 == e).mean() for e in range(num_experts)])  # fraction routed
P = probs.mean(axis=0)                                          # average router probability

alpha = 0.01
loss = alpha * num_experts * np.sum(f * P)

print("top-1 choices:", top1)                   # [0 0 1 0], 3 tokens pick Expert 1
print("f:", np.round(f, 2))                      # [0.75 0.25 0.   0.  ]
print("P:", np.round(P, 3))                       # [0.487 0.272 0.127 0.115]
print("loss / alpha:", round(loss / alpha, 2))    # 1.73, a balanced batch gives 1.0`}
      />

      <Paragraph delay={1.35}>
        Feed the four scores from the worked example through this and the imbalance shows up as a real number, about 1.73 times alpha, against exactly 1.0 times alpha for a perfectly balanced batch. That trade-off, how much weight to give a term that only cares about balance and not about getting the actual prediction right, comes up again once training moves onto real hardware.
      </Paragraph>

      <Heading level={2} delay={1.40}>
        Total parameters versus active parameters
      </Heading>

      <Paragraph delay={1.45}>
        Mixture of experts also changes how a model's size gets reported, and it's worth being precise about which number is being quoted. <strong>Total parameters</strong> counts everything stored on disk or in memory, every expert included, whether or not a given token ever visits it. <strong>Active parameters</strong> counts only what actually runs the multiplications for one specific token, the shared layers plus whichever few experts the router picked for it. For a dense model these two numbers are the same thing. For a mixture of experts model they can be wildly different.
      </Paragraph>

      <Paragraph delay={1.50}>
        Mistral AI's Mixtral 8x7B is a well known public example. It has 8 experts per mixture of experts layer and uses top-2 routing, so every token gets processed by 2 of the 8 experts at each of those layers. Add up every parameter the model stores, shared layers and all 8 experts everywhere they appear, and the total comes to roughly 47 billion. Add up only what actually runs for one token, the shared layers plus its 2 chosen experts at each layer, and that number drops to roughly 13 billion.
      </Paragraph>

      <StatTiles
        delay={0.07}
        items={[
          { label: "Experts per layer", value: 8, icon: Boxes, color: "text-blue-500" },
          { label: "Experts routed to per token", value: 2, icon: Crosshair, color: "text-purple-500" },
          { label: "Total parameters", value: 47, suffix: "B", icon: Database, color: "text-amber-500" },
          { label: "Active parameters per token", value: 13, suffix: "B", icon: Zap, color: "text-emerald-500" },
        ]}
      />

      <Paragraph delay={1.55}>
        That's the entire appeal of the design in one comparison. Mixtral runs inference roughly as cheap as a 13 billion parameter dense model, while carrying roughly as much learned capacity as a 47 billion parameter one. A dense model can't split that difference. Its total size and its per-token compute cost are always the same number.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        What changes at training time
      </Heading>

      <Paragraph delay={1.65}>
        Training a model this large usually means spreading its experts across multiple devices, called <strong>expert parallelism</strong>, since no single device needs to hold every expert if the work gets split up. The catch is that tokens still have to physically travel to wherever their chosen expert lives. Every device sends the tokens it's holding to whichever devices hold their chosen experts, waits for those experts to run, then receives the results back, an exchange usually called all-to-all communication. That round trip runs over the network, not inside one chip, so it gets slower the more devices the experts are spread across.
      </Paragraph>

      <Paragraph delay={1.70}>
        Load imbalance turns that network cost into a stall. If the router favors a couple of experts the way naive routing tends to, the devices holding those experts end up doing far more work than the rest, and every other device sits idle waiting for the busy ones to catch up before the next step can start. A batch is only as fast as its slowest device, so a training run spends real wall clock time paying for exactly the collapse the load balancing loss is trying to prevent.
      </Paragraph>

      <Paragraph delay={1.75}>
        That loss has its own balancing act too. Push alpha too high and the model starts optimizing for evenly spread routing at the expense of actually getting predictions right, since the balancing term begins to dominate the real training objective. Push it too low and it stops doing its job, and the collapse from a few sections ago creeps back in. Most training setups spend real tuning effort finding a value of alpha that's just strong enough to keep routing roughly even without measurably hurting the main loss.
      </Paragraph>

      <Heading level={2} delay={1.80}>
        What changes at serving time
      </Heading>

      <Paragraph delay={1.85}>
        Serving a trained mixture of experts model brings a different version of the same problem. An expert that rarely gets picked in production is dead weight, taking up memory and doing nothing useful with it. Getting real value out of the design needs enough live traffic, and traffic varied enough across topics or tasks, that every expert actually sees a healthy share of tokens rather than sitting cold most of the time.
      </Paragraph>

      <Paragraph delay={1.90}>
        Memory footprint at serving time is dominated by total parameters, because every expert has to be loaded somewhere and ready to be picked, even the ones a given request never touches. Compute cost per token is dominated by active parameters instead, because those are the only weights that actually do any multiplying. A dense model never gets to make this trade, its memory and compute costs move together because they're the same number. A mixture of experts model can carry a dense model's worth of memory cost while running inference closer to a much smaller model's compute cost, a trade no dense architecture can offer.
      </Paragraph>

      <Heading level={2} delay={1.95}>
        Takeaways
      </Heading>

      <List delay={2.00}>
        <ListItem>Mixture of experts swaps one dense feed-forward network per token for several parallel expert networks plus a small router that decides which few actually run.</ListItem>
        <ListItem>The router is a linear layer plus softmax, and top-k selection picks the winners. Expert capacity caps how many tokens each expert can take per batch, so overflow tokens skip that expert or the whole layer.</ListItem>
        <ListItem>Left alone, routing collapses onto a favorite handful of experts, a rich-get-richer dynamic that starves the rest. The load balancing loss and its coefficient exist to fight that, not just to squeeze out extra efficiency.</ListItem>
        <ListItem>Total parameters and active parameters are different numbers for a sparse model. Mixtral 8x7B keeps roughly 47 billion parameters resident while running only about 13 billion of them for any single token.</ListItem>
        <ListItem>The design changes training, through expert parallelism, communication cost, and load imbalance, and serving, where memory tracks total size but compute tracks active size, in ways a dense model never has to deal with.</ListItem>
      </List>

      <Paragraph delay={2.05}>
        Mixture of experts is really a bet that a model's knowledge doesn't need to live in one dense block of weights that fires uniformly for every input. Split that knowledge across many smaller specialists, let a lightweight router decide which ones actually matter for a given token, and most of the model gets to stay quiet most of the time. Getting that bet to pay off just takes real engineering, a capacity limit that doesn't quietly drop too many tokens, a balancing loss that doesn't quietly fight the actual task, and enough production traffic to make every expert worth having loaded at all. Thanks for reading.
      </Paragraph>
    </>
  ),
};
