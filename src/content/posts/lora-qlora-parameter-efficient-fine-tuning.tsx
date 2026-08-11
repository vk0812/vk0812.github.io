import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  CodeBlock,
  Formula,
  List,
  ListItem,
  StatTiles,
  CapacityMathDiagram,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
} from "../components";
import { MatrixDecompositionDiagram } from "../components/animations/lora-qlora-parameter-efficient-fine-tuning/ConceptViz";
import { HardDrive, Gauge, MessageCircle, Code2, Globe, Cpu, Puzzle } from "lucide-react";

const servingNodes: DiagramNode[] = [
  { id: "req-a", label: "Support request", icon: MessageCircle, color: "text-slate-500", x: 8, y: 15 },
  { id: "req-b", label: "Code request", icon: Code2, color: "text-slate-500", x: 8, y: 50 },
  { id: "req-c", label: "Translation request", icon: Globe, color: "text-slate-500", x: 8, y: 85 },
  { id: "base", label: "Frozen base model", sub: "one copy in memory", icon: Cpu, color: "text-blue-500", x: 38, y: 50 },
  { id: "adapter-a", label: "Support adapter", sub: "a few MB of weights", icon: Puzzle, color: "text-emerald-500", x: 68, y: 15 },
  { id: "adapter-b", label: "Code adapter", sub: "a few MB of weights", icon: Puzzle, color: "text-emerald-500", x: 68, y: 50 },
  { id: "adapter-c", label: "Translation adapter", sub: "a few MB of weights", icon: Puzzle, color: "text-emerald-500", x: 68, y: 85 },
];

const servingEdges: DiagramEdge[] = [
  { id: "e-req-a-base", from: "req-a", to: "base" },
  { id: "e-req-b-base", from: "req-b", to: "base" },
  { id: "e-req-c-base", from: "req-c", to: "base" },
  { id: "e-base-adapter-a", from: "base", to: "adapter-a" },
  { id: "e-base-adapter-b", from: "base", to: "adapter-b" },
  { id: "e-base-adapter-c", from: "base", to: "adapter-c" },
];

const memoryGroups = [
  {
    title: "Full fine-tuning, seven-billion-parameter model",
    lines: [
      { expression: "7B params × 2 bytes (bf16 weights)", result: "14 GB" },
      { expression: "7B params × 16 bytes (weights, grad, Adam moments)", result: "≈ 112 GB" },
    ],
    note: "Every one of the 7 billion weights needs a gradient and two optimizer states sitting in memory at once, not just the weight itself.",
  },
  {
    title: "LoRA adapter, rank 16, same model",
    lines: [
      { expression: "2 × 16 (rank) × 4,096 (hidden) × 32 layers × 2 modules", result: "≈ 8.4M params" },
      { expression: "8.4M adapter params × 16 bytes", result: "≈ 134 MB to train" },
    ],
    note: "That's about 0.12 percent of the base model's 7 billion parameters, and it's the only part that ever needs a gradient or an optimizer state.",
  },
];

export const loraQloraParameterEfficientFineTuning: BlogPostData = {
  title: "LoRA, QLoRA, and Parameter-Efficient Fine-Tuning",
  date: "August 11, 2026",
  slug: "lora-qlora-parameter-efficient-fine-tuning",
  content: (
    <>
      <Paragraph delay={0.10}>
        Say you've got an open-weights language model sitting on disk, seven billion parameters, and a folder of your own support tickets or code snippets or whatever your fine-tuning problem happens to be. The model itself loads onto a single consumer GPU without much trouble, in half precision it's around fourteen gigabytes. Fine-tuning it is a different story. Point a standard training loop with the Adam optimizer at that same model and it now needs well over a hundred gigabytes of memory before a single batch has even been processed. Nothing about the model changed. What changed is that training has to remember a lot more about every weight than inference ever did.
      </Paragraph>

      <Paragraph delay={0.15}>
        That gap between "a model that runs" and "a model you can actually update" is the whole reason parameter-efficient fine-tuning, PEFT for short, exists. Instead of touching every weight in the network, a PEFT method adds a small number of new, trainable parameters and leaves the original model alone. The most widely used method in this family is <strong>Low-Rank Adaptation</strong>, or LoRA, and its quantized cousin QLoRA is what actually makes fine-tuning a large model possible on a single GPU someone might already own.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        The core idea
      </Heading>

      <Paragraph delay={0.25}>
        Fine-tuning, in the plainest sense, means finding a change to every weight matrix in the network so that the model does better on new data. Call that change <Formula>{`\\Delta W`}</Formula>. Full fine-tuning computes an entirely new <Formula>{`\\Delta W`}</Formula>, the same shape and size as the original weight matrix, and that's exactly why it's expensive. <Formula>{`\\Delta W`}</Formula> has just as many numbers in it as the weight matrix does, and every one of those numbers needs a gradient and a slot in the optimizer. LoRA's bet is that the useful part of <Formula>{`\\Delta W`}</Formula> doesn't actually need to be full rank. Most of what a fine-tuning run changes about a weight matrix can be captured by a much smaller, low-rank update, and the rest is close enough to noise that skipping it barely costs any quality.
      </Paragraph>

      <Heading level={2} delay={0.30}>
        The low-rank update
      </Heading>

      <Paragraph delay={0.35}>
        A low-rank matrix is one that can be written as the product of two much smaller matrices. Instead of learning a full update directly, LoRA learns two skinny matrices, one called B and one called A, and lets their product stand in for the update.
      </Paragraph>

      <Formula block delay={0.40}>
        {`\\Delta W = BA`}
      </Formula>

      <MatrixDecompositionDiagram
        delay={0.06}
        caption="The original weight matrix stays frozen. B and A are the only new, trainable pieces, and their product forms a low-rank stand-in for the full update."
      />

      <Paragraph delay={0.45}>
        The shapes tell the whole story. The original weight matrix, written <Formula>{`W_0`}</Formula>, is a full d by d square, frozen the moment fine-tuning starts. B and A are both far skinnier, r rows or columns instead of d, where r is the rank, a small number picked before training begins. Multiply B and A together and the result is still shaped like a full d by d matrix, same as <Formula>{`W_0`}</Formula>, but it was built out of only <Formula>{`2 \\times r \\times d`}</Formula> numbers instead of <Formula>{`d^2`}</Formula>. Because r is so much smaller than d, that's a massive cut in how many numbers ever need a gradient.
      </Paragraph>

      <Paragraph delay={0.50}>
        During the actual forward pass, the adapter's contribution gets added right on top of the frozen path.
      </Paragraph>

      <Formula block delay={0.55}>
        {`h = W_0 x + \\frac{\\alpha}{r}(BA)x`}
      </Formula>

      <Paragraph delay={0.60}>
        Here x is whatever activation flows into that layer, and h is what comes out. <Formula>{`W_0 x`}</Formula> is the exact computation the pretrained model always did, completely untouched. The second term is LoRA's entire contribution, x passes through A, then through B, and the result gets scaled by <Formula>{`\\alpha / r`}</Formula> before being added on top. B is usually initialized to all zeros and A to small random values, so <Formula>{`BA`}</Formula> starts out at exactly zero and training begins from the pretrained model's original behavior, only drifting away from it as gradients update A and B. Only A and B ever receive gradients. <Formula>{`W_0`}</Formula> sits there frozen for the entire run.
      </Paragraph>

      <CodeBlock
        delay={0.65}
        language="Python"
        code={`class LoRALinear(nn.Module):
    def __init__(self, base_layer, rank=16, alpha=32, dropout=0.05):
        super().__init__()
        self.base_layer = base_layer          # frozen, pretrained
        d_in, d_out = base_layer.in_features, base_layer.out_features
        self.A = nn.Parameter(torch.randn(rank, d_in) * 0.01)
        self.B = nn.Parameter(torch.zeros(d_out, rank))
        self.scale = alpha / rank
        self.dropout = nn.Dropout(dropout)

    def forward(self, x):
        base_out = self.base_layer(x)          # no gradient needed here
        adapter_out = self.dropout(x) @ self.A.T @ self.B.T
        return base_out + self.scale * adapter_out`}
      />

      <Heading level={2} delay={0.70}>
        Picking a rank, and which layers get it
      </Heading>

      <Paragraph delay={0.75}>
        The rank r is the one knob that controls how much capacity the adapter has. A very small rank, say 4, gives the adapter very little room to represent whatever the fine-tuning task needs, which is fine for a narrow task and risky for a broad one. Common values in practice run somewhere between 4 and 64, with higher ranks reserved for tasks that need to shift the model's behavior more substantially or that have a lot of training data to justify the extra capacity. Pushing the rank up increases the adapter's parameter count linearly, so even a rank in the hundreds is still a rounding error next to the size of the frozen base model.
      </Paragraph>

      <Paragraph delay={0.80}>
        Rank alone doesn't decide where the adapter lives. A transformer layer has several different weight matrices, the query, key, value, and output projections inside attention, plus the feed-forward matrices that follow. LoRA doesn't have to touch all of them. The original LoRA paper found that adapting just the query and value projections inside attention recovers most of the benefit, and a lot of production setups still start there. Others target all four attention projections, or add the feed-forward matrices as well, trading a modest increase in trainable parameters for a bit more headroom on harder tasks. Whichever set gets picked, these are the <strong>target modules</strong>, and they're usually the first thing to change when an adapter underperforms.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        Scaling and dropout on the adapter
      </Heading>

      <Paragraph delay={0.90}>
        The <Formula>{`\\alpha / r`}</Formula> scaling factor exists so that changing the rank doesn't silently change how loud the adapter's voice is relative to the frozen base path. Without it, doubling the rank would roughly double the typical magnitude of the adapter's output too, which would mean every other hyperparameter, learning rate included, would need retuning just because the rank changed. A common convention sets alpha to twice the rank, so a rank of 16 pairs with an alpha of 32, though this is a starting point to tune from, not a law.
      </Paragraph>

      <Paragraph delay={0.95}>
        Dropout on the adapter works the same way it does everywhere else in deep learning, it randomly zeroes out a fraction of the input to A during training so the adapter can't just memorize the fine-tuning set. A typical dropout rate sits somewhere around 0.05 to 0.1. Because the adapter has so few parameters to begin with, this small amount of regularization goes a long way toward keeping it from overfitting on a small fine-tuning dataset.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        Adapters and prompt tuning, LoRA's siblings
      </Heading>

      <Paragraph delay={1.05}>
        LoRA is the most popular parameter-efficient method today, but it's one of several that all chase the same goal from different angles. The earlier <strong>adapter</strong> approach inserts a small bottleneck module, a down-projection, a nonlinearity, then an up-projection, directly into the middle of each transformer layer's forward pass. It works, but because the adapter sits inline in the computation, every request pays its extra latency at inference time, and there's no way to skip it without changing the network's structure. LoRA avoids that problem because its update runs in parallel with the frozen path rather than serially inside it, which is also what makes it possible to fold the adapter's effect back into the original weights later.
      </Paragraph>

      <Paragraph delay={1.10}>
        <strong>Prompt tuning</strong> goes even further in the other direction. It doesn't touch the network's weights at all, it just learns a small set of continuous vectors, sometimes called virtual tokens, that get prepended to the input embeddings before anything else happens. The entire pretrained model stays completely untouched, and the only thing gradients ever flow into is that short prepended sequence. It trains even fewer parameters than a typical LoRA adapter, but it also has less room to reshape how the model behaves, so it tends to work best on tasks that are more about steering the model's existing behavior than teaching it something new.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        Quantizing the base model, the Q in QLoRA
      </Heading>

      <Paragraph delay={1.20}>
        LoRA already shrinks the number of trainable parameters down to almost nothing. QLoRA attacks the other half of the memory bill, the frozen base model itself, by storing it in far fewer bits than usual. Quantizing a model just means representing each weight with fewer bits than the 16 or 32 it would normally use, trading a little numerical precision for a much smaller footprint. The base model in a QLoRA setup is typically quantized down to 4 bits per weight, an eighth the size of a 32-bit float.
      </Paragraph>

      <Paragraph delay={1.25}>
        The trick that makes this work for fine-tuning, not just inference, is that the base model's weights only need to be dequantized back to a higher precision, usually bf16, for the moment they're actually multiplied against an activation. The 4-bit values are just a compact storage format. Every forward and backward pass through the frozen path unpacks them on the fly, does the math at full working precision, and never keeps a full-precision copy sitting around afterward. Since the base weights never receive a gradient anyway, whatever tiny rounding error 4-bit storage introduces just becomes a slightly noisier frozen path, while the adapter matrices A and B keep training in full bf16 precision the entire time.
      </Paragraph>

      <Paragraph delay={1.30}>
        QLoRA adds a specific 4-bit format for this called <strong>NF4</strong>, short for 4-bit NormalFloat, designed around the fact that trained neural network weights tend to cluster in a roughly bell-shaped distribution around zero rather than spreading out evenly. NF4 places its 16 representable values so that each one covers an equal share of that bell curve, which represents a normally distributed set of weights more accurately than a plain evenly spaced 4-bit format would. On top of that, QLoRA applies <strong>double quantization</strong>, which quantizes the small scaling constants that quantization itself produces, shaving off a further sliver of memory, roughly a third of a bit per parameter, that adds up once there are billions of them.
      </Paragraph>

      <Paragraph delay={1.35}>
        The last piece is a <strong>paged optimizer</strong>. Training can hit sudden memory spikes, a long sequence in a batch, an unusually large activation, the kind of thing that would otherwise crash the run with an out-of-memory error even though average memory use is well within budget. Paged optimizers borrow a page-swapping idea from operating systems, using NVIDIA's unified memory to move optimizer state between GPU and CPU memory automatically during those rare spikes, so training survives a brief squeeze instead of failing outright.
      </Paragraph>

      <Heading level={2} delay={1.40}>
        What all of this actually saves
      </Heading>

      <Paragraph delay={1.45}>
        All of this is easier to trust with real numbers behind it. Take a seven-billion-parameter model with 32 transformer layers and a hidden dimension of 4,096, a fairly ordinary shape for a model this size, and put a rank-16 LoRA adapter on just the query and value projections.
      </Paragraph>

      <CapacityMathDiagram
        groups={memoryGroups}
        delay={0.06}
        caption="Full fine-tuning needs a gradient and two optimizer states for every one of 7 billion weights. LoRA needs that only for the adapter, about a thousandth of the model."
      />

      <Paragraph delay={1.50}>
        The frozen base model still has to sit in memory somewhere. In plain LoRA that's about 14 gigabytes at bf16 precision, and in QLoRA, with the base quantized to 4 bits, that drops to roughly 3.5 gigabytes. Add the adapter's own training memory, well under a gigabyte either way, and the totals land far below what full fine-tuning needs.
      </Paragraph>

      <StatTiles
        delay={0.06}
        items={[
          { label: "Full fine-tuning memory", value: 112, suffix: " GB", icon: HardDrive, color: "text-slate-500" },
          { label: "LoRA memory (bf16 base + adapter)", value: 14, suffix: " GB", icon: HardDrive, color: "text-blue-500" },
          { label: "QLoRA memory (4-bit base + adapter)", value: 4, suffix: " GB", icon: HardDrive, color: "text-emerald-500" },
          { label: "Memory full fine-tuning needs versus QLoRA", value: 31, suffix: "x more", icon: Gauge, color: "text-amber-500" },
        ]}
      />

      <Paragraph delay={1.55}>
        That last number is the entire point of QLoRA in one figure. A model that would need well over a hundred gigabytes to fine-tune the ordinary way fits comfortably on a single high-end consumer GPU once the base model is quantized and only a sliver of adapter parameters ever needs a gradient.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        Merging an adapter back into the base weights
      </Heading>

      <Paragraph delay={1.65}>
        Once training finishes, there's a choice to make. An adapter can stay separate from the base model, loaded alongside it and added in at every forward pass, or it can be merged, computed once as <Formula>{`W_0 + \\frac{\\alpha}{r}BA`}</Formula> and baked directly into a new copy of the weight matrix. A merged model behaves exactly like an ordinary fine-tuned model from that point on, no extra matrix multiply at inference time, no adapter-specific code path, just a single weight matrix that happens to have been produced by a cheap training run instead of an expensive one. The tradeoff is that merging is a one-way trip. Once <Formula>{`BA`}</Formula> is folded into the weights, there's no clean way to peel it back off or swap in a different adapter without starting from the original frozen base again.
      </Paragraph>

      <Heading level={2} delay={1.70}>
        Serving many adapters off one base model
      </Heading>

      <Paragraph delay={1.75}>
        That reversibility is exactly why most real deployments don't merge at all. If a support-chat adapter, a coding adapter, and a translation adapter all started from the same frozen base model, the base model only needs to be loaded into memory once. Each adapter is small enough, often a few megabytes, that dozens of them can sit in memory alongside the one shared base, with a request simply picking which adapter to add on for that particular call.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={340}
        nodes={servingNodes}
        edges={servingEdges}
        caption="One frozen base model in memory, several small adapters swapped in per request. Serving three fine-tuned personalities costs one base model's worth of memory, not three."
      />

      <Paragraph delay={1.80}>
        This is a real operational advantage over full fine-tuning, which would need a full separate copy of the entire model for every task, since a fully fine-tuned model can't be cleanly split back into "shared" and "task-specific" parts the way a LoRA adapter can.
      </Paragraph>

      <Heading level={2} delay={1.85}>
        What you give up, quality against full fine-tuning
      </Heading>

      <Paragraph delay={1.90}>
        None of this is free. Full fine-tuning can move every weight in the network, so it has the most room to adapt when a task is genuinely different from anything in the pretraining data, or when there's enough fine-tuning data to make full use of that room. LoRA, by construction, is limited to updates a low-rank matrix can express, and on tasks that need a bigger behavioral shift than that, a low enough rank can leave real quality on the table. QLoRA adds a further small tax on top, since the frozen base path runs through weights that carry a bit of quantization error the whole time.
      </Paragraph>

      <Paragraph delay={1.95}>
        In practice, the gap tends to be smaller than it sounds. Most fine-tuning tasks, adapting a model's tone, teaching it a new format, specializing it on a narrower domain, don't actually need to move every weight very far from where pretraining left it. That's the same intuition that makes the low-rank assumption reasonable in the first place. The tasks where full fine-tuning still clearly wins are the ones asking a model to learn something closer to a second pretraining run than a light touch-up, and those are exactly the cases where the extra memory and compute of full fine-tuning were always going to be needed anyway.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        Takeaways
      </Heading>

      <List delay={2.05}>
        <ListItem>LoRA represents a weight update as the product of two small matrices, <Formula>{`\\Delta W = BA`}</Formula>, instead of a full update the same size as the original weight matrix.</ListItem>
        <ListItem>Rank controls how much capacity the adapter has, target modules control which weight matrices get one, and the <Formula>{`\\alpha / r`}</Formula> scaling factor keeps the adapter's influence stable as rank changes.</ListItem>
        <ListItem>QLoRA quantizes the frozen base model to 4 bits with NF4, dequantizing on the fly for the actual matrix multiply, while double quantization and paged optimizers squeeze out further memory and handle rare spikes.</ListItem>
        <ListItem>The memory savings are real and large, a seven-billion-parameter model can go from over a hundred gigabytes for full fine-tuning down to single digits with QLoRA, mostly because gradients and optimizer states are only needed for a tiny sliver of parameters.</ListItem>
        <ListItem>Adapters stay separate and swappable unless explicitly merged, which is what makes serving many fine-tuned personalities off one shared base model practical.</ListItem>
      </List>

      <Paragraph delay={2.10}>
        None of the pieces here are exotic on their own, a low-rank matrix factorization, a well-known quantization trick, a couple of memory-management tricks borrowed from systems work. What makes LoRA and QLoRA worth knowing is how cleanly they stack, each one chipping away at a different part of the same memory bill, until fine-tuning a large model stops requiring a data center and starts requiring whatever GPU happens to be sitting under someone's desk. Thanks for reading.
      </Paragraph>
    </>
  ),
};
