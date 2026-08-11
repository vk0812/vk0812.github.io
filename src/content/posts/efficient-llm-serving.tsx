import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  CapacityMathDiagram,
  CapacityGroup,
  StatTiles,
  StatItem,
  TokenLatencyRaceDiagram,
  ContinuousBatchingDiagram,
  PagedKvCacheDiagram,
} from "../components";
import {
  FileText,
  MessageSquare,
  Layers,
  Zap,
  Cpu,
  GitMerge,
  Boxes,
  Gauge,
  DollarSign,
  TrendingUp,
} from "lucide-react";

const prefixNodes: DiagramNode[] = [
  { id: "reqA", label: "Request A", sub: "long shared system prompt", icon: MessageSquare, color: "text-blue-500", x: 15, y: 18 },
  { id: "reqB", label: "Request B", sub: "same shared system prompt", icon: MessageSquare, color: "text-indigo-500", x: 85, y: 18 },
  { id: "sharedCache", label: "Cached prefix blocks", sub: "computed once, kept warm", icon: Boxes, color: "text-emerald-500", x: 50, y: 50 },
  { id: "suffixA", label: "New tokens only", sub: "A's own question", icon: Zap, color: "text-amber-500", x: 15, y: 82 },
  { id: "suffixB", label: "New tokens only", sub: "B's own question", icon: Zap, color: "text-amber-600", x: 85, y: 82 },
];

const prefixEdges: DiagramEdge[] = [
  { id: "reqA-cache", from: "reqA", to: "sharedCache" },
  { id: "reqB-cache", from: "reqB", to: "sharedCache" },
  { id: "cache-suffixA", from: "sharedCache", to: "suffixA" },
  { id: "cache-suffixB", from: "sharedCache", to: "suffixB" },
];

const parallelNodes: DiagramNode[] = [
  { id: "tpIn", label: "Token in", icon: FileText, color: "text-slate-500", x: 18, y: 12 },
  { id: "tpGpu0", label: "GPU 0", sub: "shard of every weight matrix", icon: Cpu, color: "text-blue-500", x: 8, y: 46 },
  { id: "tpGpu1", label: "GPU 1", sub: "the other shard", icon: Cpu, color: "text-blue-600", x: 28, y: 46 },
  { id: "tpCombine", label: "Combine partials", sub: "every layer, every token", icon: GitMerge, color: "text-violet-500", x: 18, y: 80 },
  { id: "ppIn", label: "Token in", icon: FileText, color: "text-slate-500", x: 75, y: 8 },
  { id: "ppStage0", label: "GPU A", sub: "layers 1 to 8", icon: Layers, color: "text-teal-500", x: 75, y: 32 },
  { id: "ppStage1", label: "GPU B", sub: "layers 9 to 16", icon: Layers, color: "text-teal-600", x: 75, y: 56 },
  { id: "ppStage2", label: "GPU C", sub: "layers 17 to 24", icon: Layers, color: "text-teal-700", x: 75, y: 80 },
];

const parallelEdges: DiagramEdge[] = [
  { id: "tpIn-gpu0", from: "tpIn", to: "tpGpu0" },
  { id: "tpIn-gpu1", from: "tpIn", to: "tpGpu1" },
  { id: "gpu0-combine", from: "tpGpu0", to: "tpCombine" },
  { id: "gpu1-combine", from: "tpGpu1", to: "tpCombine" },
  { id: "ppIn-stage0", from: "ppIn", to: "ppStage0" },
  { id: "stage0-stage1", from: "ppStage0", to: "ppStage1" },
  { id: "stage1-stage2", from: "ppStage1", to: "ppStage2" },
];

const economicsGroups: CapacityGroup[] = [
  {
    title: "Decode throughput per GPU",
    lines: [
      { expression: "40 tokens/s per sequence × 50 concurrent sequences (continuous batching, paged cache)", result: "= 2,000 tokens/s per GPU" },
    ],
    note: "50 concurrent sequences is what fits in memory on this GPU once the key-value cache is paged instead of over-reserved. That number is the real capacity limit.",
  },
  {
    title: "Tokens per dollar, batched",
    lines: [
      { expression: "2,000 tokens/s × 3,600 seconds per hour", result: "= 7.2M tokens per GPU-hour" },
      { expression: "7.2M tokens per GPU-hour ÷ $2.00 (illustrative on-demand rate)", result: "= 3.6M tokens per dollar" },
    ],
    note: "This is the number a business actually cares about. Not tokens per second, tokens per dollar.",
  },
  {
    title: "What skipping batching costs",
    lines: [
      { expression: "40 tokens/s per GPU, one sequence at a time, no batching", result: "× 3,600 seconds per hour = 144K tokens per GPU-hour" },
      { expression: "144K tokens per GPU-hour ÷ $2.00", result: "= 72K tokens per dollar" },
      { expression: "3.6M tokens per dollar (batched) ÷ 72K (unbatched)", result: "= 50x more tokens per dollar, same GPU" },
    ],
    note: "Continuous batching does not make the chip faster. It makes the same chip idle less often, and that shows up directly in the denominator of this ratio.",
  },
  {
    title: "What quantization buys on top",
    lines: [
      { expression: "Smaller weights and a smaller cache free room for 80 concurrent sequences instead of 50", result: "40 tokens/s × 80 = 3,200 tokens/s per GPU" },
      { expression: "3,200 tokens/s × 3,600 seconds per hour", result: "= 11.52M tokens per GPU-hour" },
      { expression: "11.52M tokens per GPU-hour ÷ $2.00", result: "= 5.76M tokens per dollar" },
    ],
    note: "Quantization is not primarily a speed trick at serving time. It is a memory trick that lets more sequences share the same GPU, and more concurrent sequences is what continuous batching turns into throughput.",
  },
];

const economicsStats: StatItem[] = [
  { label: "Decode throughput per GPU", value: 2000, suffix: " tok/s", icon: Gauge, color: "text-blue-500" },
  { label: "Tokens per dollar, unbatched", value: 72, suffix: "K", icon: TrendingUp, color: "text-rose-500" },
  { label: "Tokens per dollar, batched", value: 3600, suffix: "K", icon: DollarSign, color: "text-emerald-500" },
  { label: "Tokens per dollar, quantized + batched", value: 5760, suffix: "K", icon: DollarSign, color: "text-teal-600" },
];

export const efficientLlmServing: BlogPostData = {
  title: "Efficient LLM Serving",
  date: "August 11, 2026",
  slug: "efficient-llm-serving",
  content: (
    <>
      <Paragraph delay={0.10}>
        Training a large language model gets most of the attention. It is the part with the giant GPU clusters,
        the eye-watering compute bills, and the papers. But a model only gets trained once, more or less, and
        then it gets served forever after, answering millions of requests a day for months or years. Serving is
        where almost all of a model's lifetime cost actually lives, and it turns out to be a genuinely different
        engineering problem from training, with its own bottlenecks and its own tricks.
      </Paragraph>

      <Paragraph delay={0.15}>
        Every one of those tricks is chasing the same thing, more useful work out of a fixed, expensive, and
        supply-constrained pile of accelerators. Some of them make an individual request faster. Some of them
        make the whole fleet handle more requests at once without buying a single extra chip. A few do both.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Prefill and decode are two different jobs
      </Heading>

      <Paragraph delay={0.25}>
        A request to a language model does not do the same kind of work from start to finish. It splits cleanly
        into two phases that behave almost nothing alike. <strong>Prefill</strong> is what happens the instant a
        prompt arrives, the model reads every token of that prompt in one pass and computes attention across all
        of them at once. That is a big, dense block of matrix multiplication, exactly the kind of work a GPU is
        built for, so prefill is compute-bound. Feed it more tokens at once and it keeps the chip busy rather than
        waiting on anything.
      </Paragraph>

      <Paragraph delay={0.30}>
        <strong>Decode</strong> is what happens after, one new token at a time, forever, until the reply ends.
        Producing token number 400 needs the growing history of everything read and generated so far, but the
        actual arithmetic for one new token is tiny. What decode spends its time on instead is moving that
        accumulated history in and out of memory fast enough to feed a small amount of math. Decode is
        memory-bandwidth-bound, not compute-bound, and a single sequence decoding alone barely touches the GPU's
        real capability. Almost every serving optimization that exists is really a way of fixing one of these two
        phases without breaking the other.
      </Paragraph>

      <TokenLatencyRaceDiagram
        delay={0.06}
        caption="The moment the first token appears is roughly where prefill hands off to decode. Everything after that point is the slow, memory-bound trickle the rest of this post is about speeding up."
      />

      <Paragraph delay={0.35}>
        That first-token moment is also why replies stream back word by word instead of arriving as one finished
        block. A reply that takes four seconds to fully generate but starts appearing after a few hundred
        milliseconds reads as fast, because a user reacts to the first token, not the last one. Streaming does not
        make decode any quicker. It just stops the client from sitting on a closed connection for the entire
        decode phase, and it lets a user cancel a reply early, freeing that GPU slot the moment they realize they
        do not need the rest.
      </Paragraph>

      <Heading level={2} delay={0.40}>
        Keeping the GPU full between requests
      </Heading>

      <Paragraph delay={0.45}>
        Because one sequence decoding by itself wastes most of a GPU's capability, the fix is to decode a lot of
        sequences at the same time, stepping every one of them forward by one token together. The obvious version
        of that, filling a fixed set of slots and not touching the batch again until every sequence inside it
        finishes, wastes exactly the capacity it was supposed to save. A short reply's slot sits empty the moment
        it finishes, waiting for the longest reply in the batch to catch up.
      </Paragraph>

      <ContinuousBatchingDiagram
        delay={0.06}
        caption="Static batching leaves a finished slot idle until the whole batch drains. Continuous batching drops the next queued request straight into that same freed slot, no waiting required."
      />

      <Paragraph delay={0.50}>
        Continuous batching treats the batch as a living set instead. The instant a sequence finishes, whatever
        request is next in line gets dropped into that freed slot before the next decode step even runs. Nothing
        waits for the rest of the batch. This single change is usually the biggest lever a serving engine has on
        how many concurrent users a fixed number of GPUs can support, bigger than most of the other tricks in this
        post combined.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        A cache that has to grow without a plan
      </Heading>

      <Paragraph delay={0.60}>
        Decode needs the growing history of a sequence available at every step, so the model keeps a
        <strong> key-value cache</strong>, the intermediate attention vectors for every token already processed,
        and appends one new entry per step rather than recomputing everything from scratch. That cache has to live
        in GPU memory for as long as its sequence is active, and a naive allocator has to guess a sequence's
        maximum possible length up front and reserve one contiguous block sized for the worst case, because
        growing a contiguous region mid-generation is expensive.
      </Paragraph>

      <Paragraph delay={0.65}>
        Two problems follow immediately. A short reply wastes almost all of a reservation sized for a long one,
        and as sequences of different lengths finish at different times, the memory that frees up ends up
        scattered in gaps too small for a new sequence's contiguous reservation, even when the total free memory
        would technically be enough. Both problems shrink how many concurrent sequences fit on a GPU, which
        directly shrinks how much continuous batching has to work with.
      </Paragraph>

      <PagedKvCacheDiagram
        delay={0.06}
        caption="A sequence's logical cache blocks claim whatever fixed-size physical slots are free, wherever they sit in memory, instead of needing one contiguous reservation sized for the worst case."
      />

      <Paragraph delay={0.70}>
        A paged cache cuts memory into small, fixed-size blocks and tracks, per sequence, which physical block
        holds which piece of its history, the same trick an operating system uses for virtual memory. Any free
        block anywhere can serve any sequence that needs one next. Fragmentation mostly disappears, nothing is
        over-reserved for a length that rarely happens, and more sequences fit in the same physical memory at
        once. That is more raw material for continuous batching to pack a GPU with.
      </Paragraph>

      <Heading level={2} delay={0.75}>
        Skipping prefill you have already paid for
      </Heading>

      <Paragraph delay={0.80}>
        Plenty of real traffic shares a prefix. A long system prompt sent with every call, a shared set of tool
        definitions, or the first several turns of an ongoing conversation are identical, token for token, across
        many separate requests. Running prefill over that shared prefix again for every single request throws
        away work that was already done a moment earlier for a different caller sending the exact same opening
        tokens.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={prefixNodes}
        edges={prefixEdges}
        height={380}
        delay={0.06}
        caption="Two requests share the same long prefix. Its key-value cache blocks get computed once and reused, so each request only pays prefill for the small part that is actually new."
      />

      <Paragraph delay={0.85}>
        <strong>Prefix caching</strong> keeps the key-value cache blocks for a previously seen prefix warm and
        keyed by its exact content, so a later request sharing that same prefix reuses those blocks instead of
        recomputing them. Only the part of the prompt after the shared prefix, the part that is actually new, goes
        through prefill at all. The saving shows up most directly as a faster time to first token, and it
        compounds as a conversation grows, since the reusable portion of the prompt only gets longer as more turns
        pile up.
      </Paragraph>

      <Heading level={2} delay={0.90}>
        Breaking a giant prompt into pieces
      </Heading>

      <Paragraph delay={0.95}>
        Prefill for a long prompt, say a whole document being summarized, can take long enough on its own to
        become a problem. If a serving engine runs that entire prefill as one uninterrupted block, every decode
        step for every other sequence already in flight has to wait behind it, because the two workloads want the
        same GPU at the same moment. One long document lands like a rock thrown into a stream of otherwise smooth
        decode steps, and every other user's reply visibly stalls while it passes through.
      </Paragraph>

      <Paragraph delay={1.00}>
        <strong>Chunked prefill</strong> splits that long prompt into smaller pieces and interleaves them with the
        ongoing decode steps of everything else in the batch, instead of running the whole prompt through in one
        go. A decode step for ten other sequences slots in between each chunk of the big prompt's prefill, so no
        single request can starve everyone else's steady stream of tokens. The big prompt still finishes prefill
        in roughly the same total time. It just no longer holds the GPU hostage while doing it.
      </Paragraph>

      <Heading level={2} delay={1.05}>
        Fewer bits per weight, more requests per GPU
      </Heading>

      <Paragraph delay={1.10}>
        Quantization, storing each weight with fewer bits than the 32 or 16-bit floating point format a model
        trained in, matters at serving time for a reason that is a little different from why it matters during
        training or on-device deployment. A serving fleet cares about how many concurrent sequences fit in GPU
        memory at once, because that number is exactly what continuous batching turns into throughput. Smaller
        weights leave more memory free for key-value caches, which means more concurrent sequences per GPU, which
        means more tokens produced per hour of rented hardware.
      </Paragraph>

      <Paragraph delay={1.15}>
        The mechanics of how a weight actually gets converted to a lower-precision format are their own topic and
        worth reading up on separately. What matters here is simpler, a quantized model is not primarily a faster
        model at serving time, it is a model that leaves more room on the chip for other people's requests.
      </Paragraph>

      <Heading level={2} delay={1.20}>
        When the model does not fit on one chip
      </Heading>

      <Paragraph delay={1.25}>
        A large enough model will not fit in one accelerator's memory no matter how efficiently its cache is
        managed, so serving it means splitting it across chips, and there are two different ways to cut it.
      </Paragraph>

      <Paragraph delay={1.30}>
        <strong>Tensor parallelism</strong> splits the model's own math. Each layer's weight matrix gets sliced so
        every GPU holds a shard of every layer, and the chips exchange partial results after every layer of every
        token. That needs a very fast connection between the chips, since communication happens constantly, which
        is why tensor parallelism usually stays inside one machine over something like NVLink rather than
        stretching across separate machines on ordinary networking.
      </Paragraph>

      <Paragraph delay={1.35}>
        <strong>Pipeline parallelism</strong> splits the model by depth instead of by width. One chip holds the
        first several layers, the next chip holds the following several, and activations get passed down the line
        like stations on an assembly line. Communication happens far less often than with tensor parallelism, but
        keeping every stage busy needs several requests moving through the pipeline at once, or the later stages
        sit idle waiting on the earlier ones to hand off work.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={parallelNodes}
        edges={parallelEdges}
        height={560}
        delay={0.06}
        caption="Tensor parallelism splits each layer's math across chips that must talk after every layer. Pipeline parallelism splits the model by depth, so a chip only hands off to the next one occasionally."
      />

      <Paragraph delay={1.40}>
        Real deployments often combine both, splitting a model by depth across groups of chips and by width within
        each group, chosen to match however the hardware in a given cluster is actually wired together. Either way
        the point at serving time is the same as quantization's, fit a model that would not otherwise run at all,
        and do it without adding so much cross-chip communication that decode's already tight latency budget blows
        past what a user will tolerate.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Letting a smaller model guess ahead
      </Heading>

      <Paragraph delay={1.50}>
        Decode's real bottleneck is memory bandwidth, not arithmetic, and a single decode step barely uses either
        one fully. <strong>Speculative decoding</strong> exploits that gap. A small, cheap draft model proposes a
        handful of tokens ahead, say four or five, and the full model then checks all of them in a single forward
        pass instead of one token at a time. Verifying several draft tokens together is a compute-bound operation,
        similar in shape to prefill, so it makes much better use of the GPU than four or five ordinary decode
        steps would.
      </Paragraph>

      <Paragraph delay={1.55}>
        When the draft guesses right, several tokens land for the cost of roughly one memory-bound step instead of
        several. When it guesses wrong, the full model's own output is used from the point of disagreement onward,
        so the final text is identical to what plain decoding would have produced either way. The throughput win
        depends entirely on how often the draft model guesses correctly, which is really a sampling question. That
        part, how to pick a good draft model and measure its hit rate, belongs to the mechanics of decoding
        strategies rather than to serving infrastructure, so it stays out of scope here. What matters at the
        serving layer is just that verification in parallel is a cheaper way to spend a GPU's time than decoding
        one token at a time, when the draft is good enough to make it worth the extra model running alongside the
        main one.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        Deciding who gets in the door
      </Heading>

      <Paragraph delay={1.65}>
        A normal web service that gets too much traffic just gets slower, and adding more boxes fixes that within
        minutes. A GPU fleet does not have that escape hatch. New capacity takes real time to bring online, and
        pushing more requests onto an already full fleet degrades every single in-flight reply at once rather than
        just the newest arrivals. <strong>Admission control</strong> is the check that runs before a request is
        allowed to consume a GPU slot at all, precisely to avoid that collapse.
      </Paragraph>

      <List delay={1.70}>
        <ListItem>
          <strong>Room exists.</strong> The request is admitted immediately and starts prefill without delay.
        </ListItem>
        <ListItem>
          <strong>No room, but the queue has space.</strong> The request waits in a bounded queue instead of being
          accepted and left to compete for scraps of GPU time alongside everything already running.
        </ListItem>
        <ListItem>
          <strong>The queue itself is full.</strong> New requests get an honest, immediate rejection with a retry
          hint, rather than a slow, quiet decline that looks like the service is merely a bit sluggish.
        </ListItem>
      </List>

      <Paragraph delay={1.75}>
        A short, visible wait behind a known queue position beats an accepted request that silently takes ten
        times longer than it should, because the second outcome degrades every other request sharing that GPU at
        the same time, not just the one that got in.
      </Paragraph>

      <Heading level={2} delay={1.80}>
        The metric all of this actually serves
      </Heading>

      <Paragraph delay={1.85}>
        Every optimization above reduces to the same underlying question, how many output tokens can a fixed
        amount of rented or owned hardware produce per dollar spent. Raw tokens per second matters, but only
        because it feeds into that ratio. A serving setup that is twice as fast but needs four times the hardware
        to get there is a worse business than a slower one that needs half as much. Starting from one illustrative
        GPU-hour rate, the effect of batching and quantization on that ratio is straightforward to work out.
      </Paragraph>

      <CapacityMathDiagram
        groups={economicsGroups}
        delay={0.06}
        caption="Tokens per dollar under an illustrative $2.00 GPU-hour rate. Batching and quantization both raise the ratio by raising how many sequences share the same chip at once, not by making the chip itself faster."
      />

      <StatTiles items={economicsStats} delay={0.06} />

      <Paragraph delay={1.90}>
        Notice that none of these numbers came from making the GPU compute faster. Every gain came from packing
        more concurrent sequences onto the same chip, through continuous batching, a paged cache, or quantization
        freeing up the memory those first two techniques need to work with. Tokens per dollar is the metric a
        serving team actually gets judged on, and almost every technique in this post is, underneath the surface,
        a way of moving that one number.
      </Paragraph>

      <Heading level={2} delay={1.95}>
        Takeaways
      </Heading>

      <List delay={2.00}>
        <ListItem>
          <strong>Prefill and decode are different problems.</strong> Prefill is compute-bound and loves large
          batches of tokens at once, decode is memory-bandwidth-bound and barely uses the chip one sequence at a
          time. Most serving techniques exist to fix one of these without breaking the other.
        </ListItem>
        <ListItem>
          <strong>Continuous batching and a paged cache reinforce each other.</strong> One keeps the GPU busy
          between requests, the other lets more requests fit in memory at once, and each makes the other more
          effective.
        </ListItem>
        <ListItem>
          <strong>Reuse beats recomputation wherever prompts overlap.</strong> Prefix caching skips prefill on
          shared context, chunked prefill stops one huge prompt from starving everyone else's decode steps.
        </ListItem>
        <ListItem>
          <strong>Quantization and parallelism are both, at serving time, about fitting more into memory.</strong>
          Fewer bits per weight and splitting a model across chips both exist to let more concurrent work share
          the same limited pile of GPU memory.
        </ListItem>
        <ListItem>
          <strong>Tokens per dollar is the real scoreboard.</strong> Every technique here earns its place by
          raising that one ratio, not by being clever for its own sake.
        </ListItem>
      </List>

      <Paragraph delay={2.05}>
        None of this changes what a model actually says, and none of it requires retraining anything. It changes
        whether a fixed, expensive pile of accelerators can hold ten times as many conversations as it could
        before, at a cost per token low enough for the product built on top of it to make any economic sense at
        all. Thanks for reading.
      </Paragraph>
    </>
  ),
};
