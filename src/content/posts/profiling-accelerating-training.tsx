import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  StatTiles,
  StatItem,
} from "../components";
import { PipelineStallTimelineDiagram } from "../components/animations/profiling-accelerating-training/ConceptViz";
import { HardDrive, Cpu, Layers, MemoryStick, Zap, Hourglass, Network } from "lucide-react";

const pipelineNodes: DiagramNode[] = [
  { id: "disk", label: "Dataset on disk", icon: HardDrive, color: "text-slate-500", x: 8, y: 50 },
  { id: "cpu", label: "CPU workers", sub: "decode, augment", icon: Cpu, color: "text-violet-500", x: 29, y: 50 },
  { id: "queue", label: "Prefetch queue", sub: "batches staged ahead", icon: Layers, color: "text-orange-600", x: 50, y: 50 },
  { id: "pinned", label: "Pinned memory", sub: "page-locked buffer", icon: MemoryStick, color: "text-blue-600", x: 71, y: 50 },
  { id: "gpu", label: "GPU", sub: "training step", icon: Zap, color: "text-emerald-600", x: 92, y: 50 },
];

const pipelineEdges: DiagramEdge[] = [
  { id: "disk-cpu", from: "disk", to: "cpu" },
  { id: "cpu-queue", from: "cpu", to: "queue" },
  { id: "queue-pinned", from: "queue", to: "pinned" },
  { id: "pinned-gpu", from: "pinned", to: "gpu" },
];

const utilizationStats: StatItem[] = [
  { label: "GPU busy, stalling pipeline (illustrative)", value: 45, suffix: "%", icon: Hourglass, color: "text-amber-600" },
  { label: "GPU busy, well-prefetched pipeline (illustrative)", value: 90, suffix: "%", icon: Zap, color: "text-emerald-600" },
  { label: "Scaling efficiency, illustrative 8-GPU run", value: 85, suffix: "%", icon: Network, color: "text-blue-600" },
];

export const profilingAcceleratingTraining: BlogPostData = {
  title: "Profiling and Accelerating Training",
  date: "August 9, 2026",
  slug: "profiling-accelerating-training",
  content: (
    <>
      <Paragraph delay={0.10}>
        Open a GPU utilization graph for a training job and it rarely sits at a clean 100 percent. It saws up and down, sometimes dropping to single digits for a few seconds at a time, even though nothing about the job looks broken. The model isn't stuck, no error gets thrown, the loss keeps dropping. The GPU is just waiting.
      </Paragraph>

      <Paragraph delay={0.15}>
        Waiting on what, usually, is the interesting question. The actual arithmetic a GPU does inside a training step is often the fastest part of the whole loop. Everything around that arithmetic, moving data into place, launching a long sequence of small operations, coordinating several GPUs at once, can quietly eat more wall clock time than the computation it's feeding. Profiling a training job means finding exactly where that time goes. Accelerating it means removing the waiting, not making the arithmetic itself faster.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Compute-bound versus memory-bound
      </Heading>

      <Paragraph delay={0.25}>
        Every operation a GPU runs does two different kinds of work. It moves data, reading its inputs from memory and writing its result back, and it does arithmetic, the actual multiplications and additions. Which of those two dominates the time an operation takes depends on the operation itself, and that distinction gets a name. An operation is <strong>compute-bound</strong> when the arithmetic is the bottleneck, the GPU's arithmetic units stay busy the whole time and moving data in and out is comparatively cheap. A large matrix multiplication is the classic example, it reuses the same numbers for a lot of arithmetic before it needs new ones.
      </Paragraph>

      <Paragraph delay={0.30}>
        An operation is <strong>memory-bound</strong> when it's the opposite. There isn't much arithmetic to do per number moved, so the GPU spends most of its time waiting on data to arrive and leave rather than computing on it. A simple elementwise operation, adding two tensors together or applying an activation function, does exactly one operation per number and then immediately needs the next one, so its arithmetic units mostly sit idle. That single distinction, how much arithmetic an operation gets to do per byte it moves, explains a surprising number of the tricks the rest of this post covers.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        What one training step actually does
      </Heading>

      <Paragraph delay={0.40}>
        A single training step is really a short pipeline of its own, even before any of this post's specific tricks get involved. Raw examples are read off disk, decoded, and turned into tensors. Those tensors need to move from ordinary CPU memory into the GPU's own memory. The model runs a forward pass on the GPU, computes a loss, runs backward to get gradients, and an optimizer step updates the weights. Every one of those stages takes real time, and they don't all have to happen on the same piece of hardware.
      </Paragraph>

      <Paragraph delay={0.45}>
        The first stages, reading and preparing the raw data, are ordinary CPU work. Everything from the forward pass onward runs on the GPU. That split matters because CPU work and GPU work can, in principle, happen at the same time on different pieces of hardware. Whether they actually do is what determines whether the GPU spends the whole run doing useful work, or spends part of it waiting for the CPU to catch up.
      </Paragraph>

      <Heading level={2} delay={0.50}>
        The input pipeline, and where it stalls
      </Heading>

      <Paragraph delay={0.55}>
        That CPU-side chain, reading files, decoding images or tokenizing text, applying augmentations, and stitching examples into a batch, is usually called the input pipeline. It's easy to write it the simple way, one loop that only fetches a batch once the GPU asks for it. That's also the version most likely to stall.
      </Paragraph>

      <Paragraph delay={0.60}>
        An <strong>input pipeline stall</strong> is exactly what it sounds like. The GPU finishes its current step, asks for the next batch, and has to sit idle while the CPU goes and builds one from scratch. The GPU didn't run out of arithmetic to do, it ran out of data to do arithmetic on. On a utilization graph, a stall shows up as a small dip that repeats once per step, and over a long run those small dips add up to a lot of expensive hardware doing nothing.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={pipelineNodes}
        edges={pipelineEdges}
        height={300}
        delay={0.06}
        caption="A batch's path from disk to GPU. A prefetch queue and a pinned memory buffer sit between CPU preprocessing and the GPU so the next batch can be staged ahead of time instead of built on demand."
      />

      <Paragraph delay={0.65}>
        Fixing a stall means making sure the next batch is already sitting there, ready, by the time the GPU asks for it.
      </Paragraph>

      <Heading level={2} delay={0.70}>
        Prefetching and pinned memory
      </Heading>

      <Paragraph delay={0.75}>
        <strong>Prefetching</strong> is the fix. Instead of preparing a batch only when it's requested, a small pool of worker processes runs ahead of the GPU, preparing batch two while the GPU is still busy on batch one, and batch three while it works on batch two. By the time the GPU finishes a step, the next batch is already sitting in a queue, so it never has to wait.
      </Paragraph>

      <CodeBlock
        delay={0.80}
        language="Python"
        code={`loader = DataLoader(
    dataset,
    batch_size=256,
    num_workers=8,       # separate processes prepare batches in parallel
    pin_memory=True,     # stage finished batches in pinned host memory
    prefetch_factor=4,   # each worker keeps a few batches ready ahead of demand
)`}
      />

      <Paragraph delay={0.85}>
        Getting a batch onto the GPU still needs one more detail. Ordinary CPU memory is pageable, the operating system is free to move it around at any time, and a GPU can't safely read directly out of memory that might shift mid-copy. A transfer out of pageable memory has to go through an extra staging copy first. <strong>Pinned memory</strong>, also called page-locked memory, is a region the operating system promises not to move, which lets the GPU copy directly out of it, and lets that copy run in the background alongside other work instead of blocking everything else. Setting <InlineCode>pin_memory=True</InlineCode> on a data loader tells it to stage finished batches in that pinned region specifically so the transfer to the GPU can overlap with computation, rather than stalling it.
      </Paragraph>

      <PipelineStallTimelineDiagram
        delay={0.08}
        caption="Same three steps, two training loops. Without prefetching, the CPU lane finishes and the GPU lane sits idle before it can start (the warm-colored blocks). With prefetching, the CPU lane works on the next batch while the GPU stays busy on the current one, so the idle blocks never appear."
      />

      <Heading level={2} delay={0.90}>
        Batching, and why bigger isn't automatically better
      </Heading>

      <Paragraph delay={0.95}>
        Batch size interacts with all of this too. Every step has some fixed overhead that doesn't grow with the size of the batch, launching kernels, moving a batch onto the GPU, synchronizing between CPU and GPU. A bigger batch spreads that fixed overhead over more examples, so up to a point, doubling the batch size doesn't double the time a step takes, it just makes each example cheaper on average. That effect matters most for memory-bound operations, since the fixed cost of moving data around is a bigger fraction of their total time than the arithmetic is.
      </Paragraph>

      <Paragraph delay={1.00}>
        That effect runs out eventually. Past some size, a bigger batch is limited by GPU memory rather than by overhead, and simply stops fitting. Even before it stops fitting, throughput gains taper off once a step becomes decisively compute-bound, since there's no idle capacity left in the arithmetic units to fill. Picking a batch size in practice is usually an empirical search for the point where the GPU stays saturated without running out of memory, not a fixed number that works everywhere.
      </Paragraph>

      <Heading level={2} delay={1.05}>
        Kernel fusion and compilation
      </Heading>

      <Paragraph delay={1.10}>
        Every operation that runs on a GPU compiles down to a kernel, a small program launched across thousands of parallel threads that does one specific job, one elementwise add, one matrix multiplication. A model's forward pass is really a long sequence of kernel launches, one after another. Each launch has a small fixed cost of its own, and between two separate kernels, the first one's output has to be written all the way out to the GPU's main memory before the second one can read it back in.
      </Paragraph>

      <Paragraph delay={1.15}>
        <strong>Kernel fusion</strong> combines a sequence of these operations into a single kernel, so an intermediate result never leaves the GPU's fast on-chip memory to make a round trip through its slower main memory. Three elementwise operations run back to back, an activation function, a scale, and a bias add, are a common candidate. Fusing them into one kernel launch cuts both the launch overhead and the memory traffic between them, which matters most for exactly the memory-bound operations the earlier section described.
      </Paragraph>

      <Paragraph delay={1.20}>
        Writing a hand-fused kernel for every possible sequence of operations doesn't scale, so modern frameworks compile a model's computation graph instead. A compiler traces the operations a model actually runs, finds sequences it can fuse automatically, and reorders or eliminates work where it's safe to, then hands back optimized kernels without anyone writing them by hand.
      </Paragraph>

      <CodeBlock
        delay={1.25}
        language="Python"
        code={`model = torch.compile(model)  # traces the graph, fuses eligible ops, compiles kernels
# training loop is unchanged from here`}
      />

      <Heading level={2} delay={1.30}>
        Efficient attention
      </Heading>

      <Paragraph delay={1.35}>
        Self-attention is a good case study in why all of this matters, because a naive implementation is unexpectedly memory-bound. For a sequence of length <Formula>{`N`}</Formula>, attention computes an <Formula>{`N \\times N`}</Formula> matrix of scores between every pair of positions, applies a softmax across each row, and uses the result to weight the values. Written the straightforward way, that full matrix gets written out to the GPU's main memory after the scores are computed, read back in for the softmax, and read again for the weighted sum. For long sequences that's a lot of memory traffic for an operation whose arithmetic isn't even the bottleneck.
      </Paragraph>

      <Paragraph delay={1.40}>
        Efficient attention implementations avoid ever writing that full matrix out. They process the sequence in small tiles, computing scores, a running softmax, and the weighted output for one tile at a time, entirely within the GPU's fast on-chip memory, and only write the final result back out. The trade is a bit of recomputation in exchange for far less memory traffic, and since the operation was memory-bound to begin with, that trade is a clear win. It's the same fusion idea from the previous section, applied to one specific, very common operation.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        GPU utilization and scaling efficiency
      </Heading>

      <Paragraph delay={1.50}>
        <strong>GPU utilization</strong> is the simplest number that summarizes all of this, the fraction of wall clock time a GPU spends actually doing work rather than sitting idle. It's a coarse measurement, a GPU running an inefficient memory-bound kernel can still show high utilization, but a utilization number that's chronically low is a reliable sign that something upstream, usually the input pipeline, isn't keeping up.
      </Paragraph>

      <Paragraph delay={1.55}>
        A stalling pipeline and a well-prefetched one can look like entirely different jobs on the same hardware. The numbers below are an illustrative example, not a claim about any specific model or dataset.
      </Paragraph>

      <StatTiles items={utilizationStats} delay={0.08} />

      <Paragraph delay={1.60}>
        Utilization describes one GPU. <strong>Scaling efficiency</strong> asks the same question across many of them at once, when a job moves from one GPU to <Formula>{`N`}</Formula> of them, does it actually get <Formula>{`N`}</Formula> times the throughput. Communication between GPUs, synchronizing gradients after every step, isn't free, and it takes a growing share of each step as more GPUs get added.
      </Paragraph>

      <Formula block delay={1.65}>
        {`\\text{scaling efficiency} = \\frac{\\text{throughput}(N)}{N \\times \\text{throughput}(1)}`}
      </Formula>

      <Paragraph delay={1.70}>
        A scaling efficiency of one means the job scaled perfectly, <Formula>{`N`}</Formula> GPUs really did produce <Formula>{`N`}</Formula> times the throughput of one. In practice it's always somewhat below one, and it tends to drop further as <Formula>{`N`}</Formula> grows, since communication overhead grows with the number of participants while the useful arithmetic per GPU stays fixed. Real distributed training setups spend a lot of effort keeping that number close to one, overlapping communication with computation the same way prefetching overlaps CPU work with GPU work.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Cost per useful experiment
      </Heading>

      <Paragraph delay={1.80}>
        All of this eventually reduces to money. Training hardware is rented or bought by the hour, and every idle GPU-hour, whether from an input pipeline stall or from a badly scaled multi-GPU job, is a real cost with nothing to show for it. Utilization and scaling efficiency aren't abstract engineering metrics, they're the difference between a training budget buying ten finished experiments or four.
      </Paragraph>

      <Paragraph delay={1.85}>
        A useful experiment is one that actually finishes and produces a real signal, not one that gets killed early for running out of memory or crawls so slowly that nobody waits for the result. Optimizing for cost per useful experiment, rather than raw throughput, is what pushes teams to profile a job before scaling it up. Doubling the GPU count on a pipeline that stalls half the time doubles the waste right along with the compute.
      </Paragraph>

      <Heading level={2} delay={1.90}>
        Takeaways
      </Heading>

      <List delay={1.95}>
        <ListItem>Compute-bound operations are limited by arithmetic, memory-bound operations are limited by how fast data moves, and most of the tricks in this post exist to fix the memory-bound half.</ListItem>
        <ListItem>An input pipeline stall means the GPU ran out of data, not arithmetic, prefetching hides it by preparing future batches while the GPU works on the current one.</ListItem>
        <ListItem>Pinned memory lets a batch move onto the GPU without an extra staging copy, which is what makes the overlap between CPU work and GPU work possible in the first place.</ListItem>
        <ListItem>Kernel fusion and compilation cut down on how many times an intermediate result has to round trip through GPU memory, and efficient attention applies exactly that idea to the one operation that needs it most.</ListItem>
        <ListItem>GPU utilization and scaling efficiency turn all of this into numbers worth tracking, since idle hardware and badly scaled jobs both quietly shrink how many real experiments a training budget can afford.</ListItem>
      </List>

      <Paragraph delay={2.00}>
        None of these tricks change what a model learns, they only change how much waiting happens around the arithmetic that makes it learn. A training job that's slow for the wrong reasons, an under-utilized GPU nobody looked at, still gets to the same loss curve eventually. It just costs more to get there. Thanks for reading.
      </Paragraph>
    </>
  ),
};
