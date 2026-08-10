import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  InlineCode,
  List,
  ListItem,
  StatTiles,
  IconArchitectureDiagram,
} from "../components";
import { Binary, Cpu, Gauge, Zap, Layers, Sigma, RefreshCw } from "lucide-react";
import {
  ActivationRecomputeDiagram,
  MemoryBreakdownBars,
} from "../components/animations/mixed-precision-gradient-accumulation-activation-checkpointing/ConceptViz";

export const mixedPrecisionGradientAccumulationActivationCheckpointing: BlogPostData = {
  title: "Mixed Precision, Gradient Accumulation, and Activation Checkpointing",
  date: "August 7, 2026",
  slug: "mixed-precision-gradient-accumulation-activation-checkpointing",
  content: (
    <>
      <Paragraph delay={0.1}>
        Every model trainer eventually meets the same wall. A model trains fine at batch size 8, and the exact same code with batch size 16 crashes with a wall of red text ending in "CUDA out of memory." Nothing about the model changed. The GPU simply ran out of room to hold everything training needs at once, and the number it ran out of is not obvious from the crash message alone.
      </Paragraph>

      <Paragraph delay={0.15}>
        Three techniques show up constantly in real training code for exactly this reason, and they solve the memory problem from three different angles. Mixed precision shrinks the size of every single number in memory. Gradient accumulation reaches a large effective batch size without ever holding a large batch in memory at once. Activation checkpointing throws away data on purpose and recomputes it later instead of storing it. None of them are exotic. All three are close to standard practice on any training run big enough to feel real memory pressure.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        Where the memory actually goes
      </Heading>

      <Paragraph delay={0.25}>
        Before any of the three techniques makes sense, it helps to know what is actually competing for space on the GPU. Training holds four different kinds of numbers at once. The model's <strong>weights</strong>, the <strong>gradients</strong> computed for those weights, the <strong>optimizer state</strong> (extra numbers an optimizer like Adam keeps around per weight to smooth out its updates), and the <strong>activations</strong>, the intermediate outputs of every layer, saved during the forward pass because backpropagation needs them later.
      </Paragraph>

      <MemoryBreakdownBars delay={0.08} />

      <Paragraph delay={0.3}>
        The first three buckets scale with how many parameters the model has, and nothing else. A model with a billion parameters costs the same amount of weight, gradient, and optimizer memory no matter what batch size it trains at. Activations are the odd one out. They scale with batch size, sequence length, and how deep the model is, which means they can grow far larger than the fixed cost of the model itself the moment a batch gets big or a sequence gets long. That difference is the reason activation checkpointing exists at all. It specifically targets the one bucket that is not fixed.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Floating point formats, and why bit width matters
      </Heading>

      <Paragraph delay={0.4}>
        Every number stored during training is a floating point number, made of three parts, a sign bit, an exponent, and a mantissa (also called a fraction). The sign says positive or negative. The exponent sets the overall scale, how big or small the number can get. The mantissa sets the precision, how many meaningful digits the number carries once the scale is fixed. More bits spent on the exponent means a wider range of representable magnitudes. More bits spent on the mantissa means finer distinctions between nearby values.
      </Paragraph>

      <Paragraph delay={0.45}>
        Training by default happens in <strong>FP32</strong>, 32-bit floating point, which is 1 sign bit, 8 exponent bits, and 23 mantissa bits. It is the safe, precise default, and it is also four times bigger than it needs to be for most of what a neural network actually computes. Cutting bit width in half cuts memory for every weight, gradient, and activation in half too, and it lets GPU hardware move and multiply those numbers faster, since there is simply less data to shuffle around per value.
      </Paragraph>

      <StatTiles
        delay={0.06}
        items={[
          { label: "FP32, the default training format (1 sign + 8 exponent + 23 mantissa bits)", value: 4, suffix: "bytes/value", icon: Binary, color: "text-blue-500" },
          { label: "FP16, half precision (1 sign + 5 exponent + 10 mantissa bits)", value: 2, suffix: "bytes/value", icon: Cpu, color: "text-purple-500" },
          { label: "BF16, bfloat16 (1 sign + 8 exponent + 7 mantissa bits)", value: 2, suffix: "bytes/value", icon: Gauge, color: "text-emerald-500" },
          { label: "INT8, a lower-precision option mostly used for inference", value: 1, suffix: "byte/value", icon: Zap, color: "text-amber-500" },
        ]}
      />

      <Heading level={2} delay={0.5}>
        FP16 and BF16, same width, different tradeoff
      </Heading>

      <Paragraph delay={0.55}>
        <strong>FP16</strong> and <strong>BF16</strong> both pack a number into 16 bits total, but they split those bits differently, and that split matters a lot more than it looks like it should. FP16 keeps 10 mantissa bits and only 5 exponent bits, so it is more precise per value than BF16 but can only represent a much narrower range of magnitudes before it overflows to infinity or underflows to zero.
      </Paragraph>

      <Paragraph delay={0.6}>
        <strong>BF16</strong> makes the opposite choice. It keeps the same 8 exponent bits as FP32, giving it the exact same dynamic range as full precision, and gives up mantissa bits instead, down to 7. Neural network training turns out to care more about not losing small numbers entirely than about carrying an extra decimal digit of precision on each one, so BF16's wider range makes it noticeably more numerically stable during training than FP16, even though both formats take up the same 2 bytes per value.
      </Paragraph>

      <Paragraph delay={0.65}>
        This is why FP16 training needs a safety net that BF16 training usually does not. Gradient values during backpropagation are often tiny, and FP16's narrow exponent range can push a lot of them straight down to zero before they ever reach the optimizer. BF16 rarely has that problem, since its exponent range matches FP32's. Formats narrower than 16 bits exist too, FP8 and INT8 among them, and they show up increasingly for inference and for parts of training on newer hardware, but they push the range and precision tradeoffs even further and need even more care to use safely.
      </Paragraph>

      <Heading level={2} delay={0.7}>
        Loss scaling, buying back the range FP16 lost
      </Heading>

      <Paragraph delay={0.75}>
        Picture a gradient value that would sit somewhere reasonable in FP32 but is small enough that FP16's narrow exponent range can't represent it at all. It gets rounded down to zero. That weight quietly stops learning, not because it should, but because the number carrying its update signal underflowed on the way there.
      </Paragraph>

      <Paragraph delay={0.8}>
        <strong>Loss scaling</strong> works around this without changing anything about the math being learned. Before the backward pass, the loss gets multiplied by a large scale factor, something like 1024 or higher. Every gradient computed from that scaled loss ends up scaled by the same factor, which pushes gradients that would have underflowed to zero up into a range FP16 can actually represent. Right before the optimizer applies the update, the gradients get divided back down by the same scale factor, undoing the multiplication so the actual update matches what full precision would have produced.
      </Paragraph>

      <Formula block delay={0.85}>
        {`\\text{loss}_{\\text{scaled}} = \\text{loss} \\times S, \\qquad \\text{grad} = \\frac{\\text{grad}_{\\text{scaled}}}{S}`}
      </Formula>

      <Paragraph delay={0.9}>
        Picking <Formula>{`S`}</Formula> by hand is fragile. Pick it too small and small gradients still underflow, pick it too large and gradients overflow to infinity instead. <strong>Dynamic loss scaling</strong> handles this automatically. It keeps raising the scale factor as long as training goes a while without seeing an overflow, and the moment it detects one (an <InlineCode>inf</InlineCode> or <InlineCode>NaN</InlineCode> gradient), it throws that step's update away, halves the scale factor, and tries again. Training self-tunes to the largest safe scale factor without anyone hand-picking a number.
      </Paragraph>

      <Heading level={2} delay={0.95}>
        Mixed precision training end to end
      </Heading>

      <Paragraph delay={1.0}>
        "Mixed" is the operative word. A mixed precision training loop does not run everything in FP16 or BF16, it keeps a master copy of every weight in FP32 and only casts down to the lower-precision format for the forward and backward computation itself. The optimizer's update gets applied to the FP32 master copy, which then gets cast back down to FP16 or BF16 for the next forward pass. Frameworks handle the casting automatically (commonly through something like an <InlineCode>autocast</InlineCode> context), choosing per operation whether lower precision is safe or whether that particular operation needs to stay in FP32.
      </Paragraph>

      <Paragraph delay={1.05}>
        The speed gain is not just about using less memory. Modern GPUs have dedicated hardware for half-precision matrix multiplication that runs meaningfully faster than the equivalent FP32 operation, and moving half as many bytes per value also means less time spent waiting on memory bandwidth, which is often the actual bottleneck in a training step, not raw compute. Lower precision helps twice, once by fitting more in memory, and once by making the hardware itself faster per value.
      </Paragraph>

      <Paragraph delay={1.1}>
        Put the pieces together and the practical guidance is simple. BF16 is the safer default wherever the hardware supports it, since its wide exponent range mostly avoids the underflow problem outright. FP16 still gets used, especially on older hardware without native BF16 support, but it needs loss scaling to be numerically reliable. Either way, keeping an FP32 master copy of the weights is what keeps the small, gradual updates an optimizer makes from disappearing into rounding error over the course of a long training run.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        Gradient accumulation, simulating a bigger batch
      </Heading>

      <Paragraph delay={1.2}>
        Sometimes the model and the batch size both fit comfortably, just not together. A training recipe might call for a batch size of 128 for stable convergence, but the GPU only has room for 16 examples at a time once weights, gradients, optimizer state, and activations are all accounted for. <strong>Gradient accumulation</strong> solves this without needing a bigger GPU.
      </Paragraph>

      <Paragraph delay={1.25}>
        Instead of running one big batch through the model and taking one optimizer step, the training loop runs several smaller <strong>micro-batches</strong> through forward and backward, one at a time, and adds each micro-batch's gradients on top of the last instead of clearing them out. Only after enough micro-batches have accumulated does the optimizer actually take a step, using the sum of all of them. The model never has more than one micro-batch's worth of activations in memory at any moment, but the update it eventually takes reflects the full, larger batch.
      </Paragraph>

      <Formula block delay={1.3}>
        {`\\text{effective batch size} = m \\times k`}
      </Formula>

      <Paragraph delay={1.35}>
        <Formula>{`m`}</Formula> is the micro-batch size that actually fits in memory, and <Formula>{`k`}</Formula> is the number of micro-batches accumulated before stepping. A micro-batch of 16 accumulated over 8 steps reaches an effective batch size of 128, exactly the target, without ever holding more than 16 examples' worth of activations at once.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={420}
        caption="Three micro-batches each run a full forward and backward pass and add their gradients together, one optimizer step runs once the accumulation is done."
        nodes={[
          { id: "mb1", label: "Micro-batch 1", sub: "forward + backward", icon: Layers, color: "text-blue-500", x: 25, y: 15 },
          { id: "mb2", label: "Micro-batch 2", sub: "forward + backward", icon: Layers, color: "text-blue-500", x: 50, y: 15 },
          { id: "mb3", label: "Micro-batch 3", sub: "forward + backward", icon: Layers, color: "text-blue-500", x: 75, y: 15 },
          { id: "accum", label: "Accumulated gradient", sub: "summed in place", icon: Sigma, color: "text-purple-500", x: 50, y: 55 },
          { id: "step", label: "Optimizer step", sub: "runs once", icon: RefreshCw, color: "text-emerald-500", x: 50, y: 90 },
        ]}
        edges={[
          { id: "e1", from: "mb1", to: "accum" },
          { id: "e2", from: "mb2", to: "accum" },
          { id: "e3", from: "mb3", to: "accum" },
          { id: "e4", from: "accum", to: "step" },
        ]}
      />

      <Paragraph delay={1.4}>
        The catch is that gradient accumulation buys memory with wall-clock time, not compute. Every micro-batch still runs a full forward and backward pass, so the total amount of computation for a given effective batch size does not change. What changes is that the work happens sequentially, one micro-batch after another, instead of all at once, so a training step that used to take one forward and backward pass now takes <Formula>{`k`}</Formula> of them before the model actually updates.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Activation checkpointing, trading compute for memory
      </Heading>

      <Paragraph delay={1.5}>
        Recall that activations are the one memory bucket that grows with batch size, sequence length, and depth rather than staying fixed. <strong>Activation checkpointing</strong> (also called <strong>recomputation</strong>) shrinks that bucket directly, by simply not keeping every activation around.
      </Paragraph>

      <Paragraph delay={1.55}>
        Instead of storing the output of every layer for use during the backward pass, the forward pass only keeps a handful of marked <strong>checkpoints</strong>, and lets everything in between get discarded once it is no longer immediately needed. When the backward pass later reaches a layer whose activation was thrown away, it does not fail. It replays a short stretch of the forward pass starting from the nearest saved checkpoint, regenerating exactly the activation it needs right before using it.
      </Paragraph>

      <ActivationRecomputeDiagram
        delay={0.06}
        caption="Layer 1 and layer 3's activations stay in memory. Layer 2's is dropped after use, then rebuilt by replaying the forward step from layer 1 the moment backward needs it."
      />

      <Paragraph delay={1.6}>
        The trade being made is explicit. Memory drops because far fewer activations are held at once, and in exchange, part of the forward pass runs a second time during backward, once when it was first computed and once again when it gets recomputed. That extra work is real. It is not free, but it is bounded and predictable, exactly the segment between one checkpoint and the next, never more.
      </Paragraph>

      <Heading level={2} delay={1.65}>
        What these tricks cost, and how they combine
      </Heading>

      <Paragraph delay={1.7}>
        None of the three techniques is free. They just spend something other than memory. Mixed precision is the rare case that is close to a pure win. It usually speeds training up rather than slowing it down, since lower-precision math runs faster on modern hardware and moves less data per value. Gradient accumulation spends wall-clock time, more sequential forward and backward passes before every optimizer step. Activation checkpointing spends compute directly, recomputing a stretch of the forward pass a second time during backward.
      </Paragraph>

      <Paragraph delay={1.75}>
        In practice these three stack rather than compete. A common pattern for fitting a large model on limited hardware is mixed precision plus activation checkpointing to fit the model and a reasonable micro-batch at all, then gradient accumulation on top of that to reach whatever effective batch size the training recipe actually calls for.
      </Paragraph>

      <Heading level={2} delay={1.8}>
        Reading an out-of-memory error
      </Heading>

      <Paragraph delay={1.85}>
        A CUDA out-of-memory error is not a mystery once the four memory buckets are separated in your head. It is a clue about which one grew past what the GPU had left. Where in the training step the crash happens usually points at which bucket is the problem.
      </Paragraph>

      <List delay={1.9}>
        <ListItem><strong>Crashes during the optimizer step.</strong> That points at optimizer state, not activations. Adam's extra per-parameter buffers are often the largest fixed cost in the whole system, larger than the weights themselves.</ListItem>
        <ListItem><strong>Crashes partway through a forward pass, worse at longer sequences or bigger batches.</strong> That is activation memory. Activation checkpointing or a smaller micro-batch size are the direct fixes, not a smaller model.</ListItem>
        <ListItem><strong>Confirm mixed precision is actually turned on before assuming a model needs to be smaller.</strong> Halving the size of weights, gradients, and activations at once is often the single biggest lever available, and it is easy to leave off by accident.</ListItem>
        <ListItem><strong>Shrinking the micro-batch size is the cheapest first move.</strong> It has an immediate, predictable effect on activation memory, whereas rewriting a model to checkpoint more aggressively takes real engineering time.</ListItem>
        <ListItem><strong>A crash that only appears after many steps, not the first one, usually is not about batch size at all.</strong> That pattern points at memory fragmentation or a buffer that keeps growing, like an accidentally retained computation graph, rather than any of the three techniques in this post.</ListItem>
      </List>

      <Heading level={2} delay={1.95}>
        Takeaways
      </Heading>

      <List delay={2.0}>
        <ListItem>Training memory splits into weights, gradients, optimizer state, and activations. The first three scale with parameter count alone, activations scale with batch size, sequence length, and depth, which is why they need their own dedicated fix.</ListItem>
        <ListItem>FP16 and BF16 both use 16 bits, but BF16 keeps FP32's wide exponent range and gives up mantissa precision instead, making it far less prone to the underflow that pushes FP16 training toward needing loss scaling.</ListItem>
        <ListItem>Loss scaling multiplies the loss up before backward and divides the gradients back down before the optimizer step, keeping small gradient values inside FP16's representable range instead of losing them to zero.</ListItem>
        <ListItem>Gradient accumulation reaches a large effective batch size by summing gradients across several smaller micro-batches before stepping, trading wall-clock time for memory rather than spending less total compute.</ListItem>
        <ListItem>Activation checkpointing keeps only a few checkpointed activations and recomputes the rest on demand during backward, trading a bounded amount of extra compute for a large cut in activation memory.</ListItem>
      </List>

      <Paragraph delay={2.05}>
        None of these three ideas make a model smarter. They exist purely to get a training run that would not fit onto the hardware you actually have to fit anyway, without changing what the model learns or how it learns it. That is a less glamorous kind of engineering than designing a new architecture, but it is very often the difference between a training run that ships and one that never gets past its first out-of-memory crash. Thanks for reading.
      </Paragraph>
    </>
  ),
};
