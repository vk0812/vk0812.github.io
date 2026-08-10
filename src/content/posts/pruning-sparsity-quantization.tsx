import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  List,
  ListItem,
  StatTiles,
  IconArchitectureDiagram,
} from "../components";
import {
  PruningPatternGrid,
  MagnitudeThresholdSweep,
} from "../components/animations/pruning-sparsity-quantization/ConceptViz";
import {
  Brain,
  SlidersHorizontal,
  RefreshCw,
  PackageCheck,
  Database,
  Calculator,
  HardDrive,
  Gauge,
} from "lucide-react";

export const pruningSparsityQuantization: BlogPostData = {
  title: "Pruning, Sparsity, and Quantization",
  date: "August 6, 2026",
  slug: "pruning-sparsity-quantization",
  content: (
    <>
      <Paragraph delay={0.10}>
        Open a photo app and tap the button that blurs the background behind a face. That segmentation model runs in a fraction of a second, on a battery-powered chip that is nowhere near as fast as the GPU it was trained on, and it never touches the network to get help. Getting a large trained model to fit that budget almost never means training a smaller model from scratch. It usually means taking the big model that already works and making it smaller and cheaper after the fact.
      </Paragraph>

      <Paragraph delay={0.15}>
        Two techniques do most of that work, and they attack the problem from different angles. <strong>Pruning</strong> removes weights from a trained network outright, setting some of them to exactly zero and never touching them again. <strong>Quantization</strong> keeps every weight but represents each one with fewer bits, trading numerical precision for a smaller, faster model. One shrinks how many numbers the model has. The other shrinks how expensive each number is to store and compute with. Real deployments usually end up using both.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What pruning actually removes
      </Heading>

      <Paragraph delay={0.25}>
        A trained network's weights are not all equally important. Some connections barely move the output no matter what the input is. They were useful scaffolding during training but end up doing very little in the finished model. Pruning finds those connections and deletes them, literally setting their value to zero. The result is described by its <strong>sparsity</strong>, the fraction of weights that are zero. A network pruned to 80 percent sparsity has 4 out of every 5 weights sitting at zero, contributing nothing to any computation that touches them.
      </Paragraph>

      <Heading level={2} delay={0.30}>
        Structured versus unstructured pruning
      </Heading>

      <Paragraph delay={0.35}>
        The simplest version of pruning looks at every individual weight, scores each one for importance, and zeros out the least important ones wherever they happen to sit in the weight matrix. This is <strong>unstructured pruning</strong>. It leaves scattered, individual zeros with no larger pattern to them. Two weights sitting right next to each other in the same row can land on opposite sides of the cut, one kept and one zeroed, with nothing about their position deciding it.
      </Paragraph>

      <Paragraph delay={0.40}>
        <strong>Structured pruning</strong> takes a coarser approach. Instead of scoring individual weights, it scores entire rows, columns, or channels of a weight matrix as a single unit, and removes the whole group at once. Zero out one column and every weight that used to read from a particular input goes away together. Zero out a whole channel in a convolutional network and an entire filter disappears, not just a few of its weights.
      </Paragraph>

      <PruningPatternGrid
        delay={0.08}
        caption="Two weight matrices at exactly the same 25 percent sparsity. Structured pruning zeros whole columns, unstructured pruning scatters individual zeros across the matrix."
      />

      <Paragraph delay={0.45}>
        The two look similar on paper. Both reduce the total count of nonzero weights by the same amount. They behave very differently on real hardware, though, and that difference comes down to <strong>kernels</strong>, the low-level routines that actually carry out matrix multiplication on a chip. Unstructured pruning can reach a higher sparsity for the same accuracy drop, since it is free to remove exactly the weights that matter least, wherever they sit. But a matrix with scattered zeros still has the same overall shape as before. An ordinary matrix multiply routine has no way to skip an individual zero buried in the middle of an otherwise dense row without extra bookkeeping, so unstructured sparsity usually needs a specialized sparse kernel built to skip the zeroed entries before the saved parameter count turns into an actual speedup. Structured pruning is coarser and often needs a bigger sparsity budget to reach the same accuracy, but removing a whole row or channel makes the matrix physically smaller. Any ordinary dense matrix multiply routine runs faster automatically, no special kernel required.
      </Paragraph>

      <Heading level={2} delay={0.50}>
        Deciding which weights to remove, magnitude versus movement
      </Heading>

      <Paragraph delay={0.55}>
        Once a pruning shape is picked, the network still needs a rule for deciding which weights are the least important ones. The simplest and most common answer is <strong>magnitude pruning</strong>, score each weight by its absolute value and prune the smallest ones first. A weight sitting at 0.003 is assumed to matter less than one sitting at 1.4, and that assumption holds up well enough in practice to be the default choice most pruning pipelines reach for.
      </Paragraph>

      <MagnitudeThresholdSweep
        delay={0.08}
        caption="A magnitude threshold sweeping up from zero. Weights are struck out the moment their magnitude falls below the current threshold, and the sparsity readout only ever reflects weights actually crossed."
      />

      <Paragraph delay={0.60}>
        Magnitude pruning has one blind spot. It only looks at where a weight sits right now, not at how it got there or whether it is still helping the loss go down. A weight that started small but is being actively pushed larger by every training step is probably doing something useful, and magnitude pruning would delete it anyway just because it has not grown yet. <strong>Movement pruning</strong> fixes that by scoring weights on how much they change during fine-tuning instead of how big they already are. Weights drifting toward zero get pruned, weights drifting away from zero survive even if their current value is still small. It needs an actual fine-tuning pass to gather that movement signal, so it costs more to run than magnitude pruning, but it holds onto weights that a magnitude-only rule would have thrown away too early.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        Quantization, keeping every weight but making each one cheaper
      </Heading>

      <Paragraph delay={0.70}>
        A typical trained network stores its weights as 32-bit floating point numbers, <strong>FP32</strong>, a format with plenty of precision but a real storage cost of 4 bytes per weight. Quantization maps those same weights onto a much smaller set of representable values, most commonly signed 8-bit integers, <strong>INT8</strong>, using only 1 byte per weight. Every weight survives the conversion. What changes is how finely each one can be represented.
      </Paragraph>

      <StatTiles
        delay={0.06}
        items={[
          { label: "FP32 weight size", value: 32, suffix: " bits", icon: HardDrive, color: "text-slate-500" },
          { label: "INT8 weight size", value: 8, suffix: " bits", icon: HardDrive, color: "text-blue-500" },
          { label: "Smaller in memory, FP32 to INT8", value: 4, suffix: "x", icon: Gauge, color: "text-emerald-500" },
          { label: "Smaller in memory, FP32 to INT4", value: 8, suffix: "x", icon: Gauge, color: "text-amber-500" },
        ]}
      />

      <Paragraph delay={0.75}>
        Turning a float into an integer is not just rounding it. Every weight in a layer gets mapped through a shared scale factor, a single number that stretches that layer's real range of float values onto the full range an 8-bit integer can represent, roughly negative 128 to 127. Multiply an integer weight by its scale factor and the result approximates the original float value, close enough that the network's output barely changes, and precise enough that the multiplication itself can now run on cheap integer arithmetic instead of floating point. Lower-bit formats push the same idea further. <strong>INT4</strong> packs each weight into 4 bits, halving the storage again, at the cost of a coarser set of representable values and a bigger risk of accuracy loss on any layer that is sensitive to exact weight values.
      </Paragraph>

      <Heading level={2} delay={0.80}>
        Two ways to get there, quantization-aware training versus post-training quantization
      </Heading>

      <Paragraph delay={0.85}>
        There are two different points in a model's life where quantization can happen, and they trade accuracy for convenience in opposite directions.
      </Paragraph>

      <Paragraph delay={0.90}>
        <strong>Post-training quantization</strong> (PTQ) takes a model that is already fully trained in floating point and converts it afterward, with no further training involved. It needs a small batch of representative inputs, called <strong>calibration data</strong>, run through the model once so the scale factor for each layer can be computed from the actual range of values that layer produces. No gradients, no backward pass. PTQ is fast and cheap to apply, which is why it is usually the first thing tried.
      </Paragraph>

      <Paragraph delay={0.95}>
        <strong>Quantization-aware training</strong> (QAT) starts earlier. It simulates the effect of quantization, rounding weights and activations to low-bit values, during training or fine-tuning itself, while keeping a full-precision copy of the weights underneath for the actual gradient updates. That gives the network a chance to adjust around the rounding error before it is ever deployed, rather than having that error sprung on it after training has already finished. QAT usually holds accuracy better than PTQ, especially at very low bit widths, but it costs a real training run to get there, which PTQ never needs.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={380}
        caption="Two pipelines to the same destination. QAT (top) folds rounding into a real training loop before export. PTQ (bottom) calibrates a frozen model and converts it directly, no retraining."
        nodes={[
          { id: "qat-start", label: "Trained model", icon: Brain, color: "text-slate-500", x: 12, y: 26 },
          { id: "qat-fakequant", label: "Insert fake-quant", icon: SlidersHorizontal, color: "text-blue-500", x: 38, y: 26 },
          { id: "qat-finetune", label: "Fine-tune (quant sim)", icon: RefreshCw, color: "text-blue-500", x: 64, y: 26 },
          { id: "qat-export", label: "Export INT8 model", icon: PackageCheck, color: "text-emerald-500", x: 90, y: 26 },
          { id: "ptq-start", label: "Trained model", icon: Brain, color: "text-slate-500", x: 12, y: 74 },
          { id: "ptq-calibrate", label: "Calibration data", icon: Database, color: "text-amber-500", x: 38, y: 74 },
          { id: "ptq-convert", label: "Compute scale, convert", icon: Calculator, color: "text-amber-500", x: 64, y: 74 },
          { id: "ptq-export", label: "Export INT8 model", icon: PackageCheck, color: "text-emerald-500", x: 90, y: 74 },
        ]}
        edges={[
          { id: "qe1", from: "qat-start", to: "qat-fakequant", dashed: false },
          { id: "qe2", from: "qat-fakequant", to: "qat-finetune", dashed: false },
          { id: "qe3", from: "qat-finetune", to: "qat-export", dashed: false },
          { id: "pe1", from: "ptq-start", to: "ptq-calibrate", dashed: false },
          { id: "pe2", from: "ptq-calibrate", to: "ptq-convert", dashed: false },
          { id: "pe3", from: "ptq-convert", to: "ptq-export", dashed: false },
        ]}
      />

      <Paragraph delay={1.00}>
        Which one is worth the extra cost mostly comes down to how far the bit width gets pushed. Dropping to INT8 is usually mild enough that PTQ alone holds up fine. Dropping further, to INT4 or below, tends to lose enough accuracy that QAT's extra training pass earns its cost back.
      </Paragraph>

      <Heading level={2} delay={1.05}>
        Why the numbers still have to run somewhere, kernels and accuracy loss
      </Heading>

      <Paragraph delay={1.10}>
        None of this saves any time unless the hardware underneath has a fast way to run reduced-precision arithmetic. Modern CPUs and GPUs ship dedicated integer kernels, low-level routines built specifically to multiply and accumulate INT8 or INT4 values quickly, since integer arithmetic is both cheaper in silicon and faster to execute than the same operation in floating point. A quantized model without a matching kernel to run on does not get faster at all, it just gets smaller. The speedup comes from pairing reduced-precision numbers with hardware and software that actually knows how to compute on them efficiently, which is why quantization support usually shows up as a specific named feature of a chip or an inference library rather than something free that comes along with the format change.
      </Paragraph>

      <Paragraph delay={1.15}>
        All of this is a trade, and the thing traded away is accuracy. A model pruned or quantized aggressively enough will eventually produce worse predictions than the original. The only real questions are how much worse, and at what compression level that starts to show up. Small amounts of pruning or a drop to INT8 are usually close to free, the accuracy difference is small enough to disappear into ordinary run-to-run noise. Push sparsity past a certain point, or drop below INT8 without quantization-aware training to compensate, and the accuracy loss becomes real and measurable. There is no universal number for where that line sits. It depends on the model, the task, and how much of a drop is actually tolerable for whatever the model is doing, which is exactly why calibration data, movement scores, and a fine-tuning pass all exist as tools for pushing that line further out rather than just accepting wherever it happens to fall by default.
      </Paragraph>

      <Heading level={2} delay={1.20}>
        Takeaways
      </Heading>

      <List delay={1.25}>
        <ListItem>Pruning removes weights outright and is measured by sparsity, quantization keeps every weight but stores each one with fewer bits.</ListItem>
        <ListItem>Unstructured pruning zeros individual weights and reaches higher sparsity, but usually needs a specialized sparse kernel to turn that into speed. Structured pruning zeros whole rows, columns, or channels and speeds up on ordinary dense kernels with no special support required.</ListItem>
        <ListItem>Magnitude pruning scores weights by their current size, movement pruning scores them by how much they change during fine-tuning, which catches small but actively useful weights that magnitude pruning would delete too early.</ListItem>
        <ListItem>Post-training quantization converts an already-trained model using a small batch of calibration data and no further training. Quantization-aware training simulates rounding during training itself and usually holds accuracy better at very low bit widths.</ListItem>
        <ListItem>Going from FP32 to INT8 is an exact 4x reduction in weight storage, 32 bits down to 8, but none of it turns into real speed without hardware and kernels that actually know how to compute in that lower precision.</ListItem>
      </List>

      <Paragraph delay={1.30}>
        Pruning and quantization both start from the same observation, a model that trained well is usually carrying more precision and more parameters than it strictly needs to run well. The two techniques just disagree about which excess to cut. Most production systems reach for a bit of both, prune what genuinely is not contributing, quantize what is left, and let the hardware's integer kernels do the rest. Thanks for reading.
      </Paragraph>
    </>
  ),
};
