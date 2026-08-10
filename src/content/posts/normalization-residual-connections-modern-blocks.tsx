import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  CodeBlock,
  InlineCode,
  Formula,
  List,
  ListItem,
} from "../components";
import { NormAxisDiagram } from "../components/animations/normalization-residual-connections-modern-blocks/ConceptViz";
import { BlockOrderDiagram } from "../components/figures/BlockOrderDiagram";

export const normalizationResidualConnectionsModernBlocks: BlogPostData = {
  title: "Normalization, Residual Connections, and Modern Blocks",
  date: "August 1, 2026",
  slug: "normalization-residual-connections-modern-blocks",
  content: (
    <>
      <Paragraph delay={0.1}>
        Stack ten plain feedforward layers on top of each other with no special tricks and training usually still works, if a little slowly. Stack a hundred and it typically falls apart. Loss stalls, gradients either vanish on the way back or blow up into NaNs, and adding more depth makes the model worse instead of better. That degradation is not really about the model running out of capacity. It is about the numbers flowing through the network drifting to a scale training was never designed to handle, and about gradients having no clean path back to the earliest layers. Two ideas fixed both problems at once and turned "deep" into something that actually means something: normalizing activations at each layer, and adding a shortcut that lets information skip straight past a layer's transformation.
      </Paragraph>

      <Paragraph delay={0.15}>
        Modern architectures, transformers especially, are built almost entirely out of these two ingredients repeated block after block. Understanding what each one actually does, and the handful of variants that show up in real model code, makes the rest of a transformer's architecture diagram far less mysterious.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        A toy activation matrix to work with
      </Heading>

      <Paragraph delay={0.25}>
        Everything below is easiest to see with real numbers rather than only the abstract formula, so here is one small matrix we will reuse throughout. Think of it as the activations coming out of some layer for a batch of <Formula>{`N = 4`}</Formula> examples, each with <Formula>{`C = 3`}</Formula> features.
      </Paragraph>

      <CodeBlock
        delay={0.3}
        language="Python"
        code={`import numpy as np

X = np.array([
    [1.0,  2.0,  3.0],
    [2.0,  4.0,  6.0],
    [3.0,  6.0,  9.0],
    [4.0,  8.0, 12.0],
])
# rows = examples in the batch (N=4), columns = features (C=3)`}
      />

      <Paragraph delay={0.35}>
        Every normalization scheme in this post computes a mean and a variance from some subset of this matrix and rescales with them. What changes from one scheme to the next is entirely a matter of which entries get grouped together for that computation, nothing else.
      </Paragraph>

      <Heading level={2} delay={0.4}>
        Batch normalization, statistics across the batch
      </Heading>

      <Paragraph delay={0.45}>
        <strong>Batch normalization</strong> (batch norm) picks one column at a time, meaning one feature, and computes its mean and variance across every example currently in the batch. Every example then gets that same mean subtracted and that same standard deviation divided out, before a learned scale and shift (<Formula>{`\\gamma`}</Formula> and <Formula>{`\\beta`}</Formula>) restore whatever scale the layer actually needs.
      </Paragraph>

      <Formula block delay={0.5}>
        {`\\hat{x}_{i,j} = \\frac{x_{i,j} - \\mu_j}{\\sqrt{\\sigma_j^2 + \\epsilon}}, \\qquad \\mu_j = \\frac{1}{N}\\sum_{i=1}^{N} x_{i,j}, \\qquad \\sigma_j^2 = \\frac{1}{N}\\sum_{i=1}^{N} (x_{i,j} - \\mu_j)^2`}
      </Formula>

      <Paragraph delay={0.55}>
        Running this on the toy matrix confirms it directly. Column 1 has values <Formula>{`1, 2, 3, 4`}</Formula>, mean <Formula>{`2.5`}</Formula>, variance <Formula>{`1.25`}</Formula>. Column 2 has mean <Formula>{`5.0`}</Formula>, variance <Formula>{`5.0`}</Formula>. Column 3 has mean <Formula>{`7.5`}</Formula>, variance <Formula>{`11.25`}</Formula>. Each column gets its own pair of numbers, entirely independent of the other two columns.
      </Paragraph>

      <CodeBlock
        delay={0.6}
        language="Python"
        code={`eps = 1e-5
mean_bn = X.mean(axis=0)   # over the batch axis, one value per feature
var_bn  = X.var(axis=0)
X_bn = (X - mean_bn) / np.sqrt(var_bn + eps)

print(mean_bn)  # [2.5  5.   7.5]
print(var_bn)   # [ 1.25  5.   11.25]
print(X_bn)
# [[-1.3416 -1.3416 -1.3416]
#  [-0.4472 -0.4472 -0.4472]
#  [ 0.4472  0.4472  0.4472]
#  [ 1.3416  1.3416  1.3416]]
print(X_bn.mean(axis=0))  # [0. 0. 0.]
print(X_bn.var(axis=0))   # [1. 1. 1.]`}
      />

      <Paragraph delay={0.65}>
        Why bother? Without normalization, the distribution of a layer's inputs keeps shifting as the weights below it update during training, forcing every later layer to constantly re-adapt to a moving target. Fixing each feature's mean at 0 and variance at 1 removes that moving target, which lets training use a bigger learning rate and converge faster and more reliably. Batch norm was the technique that first made this practical at scale, and for convolutional vision models it is still the default choice.
      </Paragraph>

      <Paragraph delay={0.7}>
        The catch is right there in the name. Computing a mean and variance over the batch axis means the result for a single example depends on every other example sharing its batch, which creates two real problems. A small batch (or a batch size of 1) gives a noisy estimate of the true mean and variance, and can make training unstable. And at inference time, examples usually arrive one at a time or in batches that do not match training, so batch norm has to fall back on a running average of the statistics collected during training, an extra piece of bookkeeping that has to be maintained correctly or predictions quietly drift.
      </Paragraph>

      <Heading level={2} delay={0.75}>
        Layer normalization, statistics per example
      </Heading>

      <Paragraph delay={0.8}>
        <strong>Layer normalization</strong> (layer norm) makes the opposite choice. Instead of reducing down a column across the batch, it reduces across a row, computing one mean and variance per example, using only that example's own features.
      </Paragraph>

      <Formula block delay={0.85}>
        {`\\hat{x}_{i,j} = \\frac{x_{i,j} - \\mu_i}{\\sqrt{\\sigma_i^2 + \\epsilon}}, \\qquad \\mu_i = \\frac{1}{C}\\sum_{j=1}^{C} x_{i,j}, \\qquad \\sigma_i^2 = \\frac{1}{C}\\sum_{j=1}^{C} (x_{i,j} - \\mu_i)^2`}
      </Formula>

      <NormAxisDiagram delay={0.08} />

      <Paragraph delay={0.9}>
        Running the same toy matrix through layer norm instead gives a genuinely different picture. Row 1 has values <Formula>{`1, 2, 3`}</Formula>, mean <Formula>{`2.0`}</Formula>, variance <Formula>{`0.667`}</Formula>. Row 4 has values <Formula>{`4, 8, 12`}</Formula>, mean <Formula>{`8.0`}</Formula>, variance <Formula>{`10.667`}</Formula>, a much bigger mean and variance, but every row here happens to be a scaled copy of <Formula>{`1, 2, 3`}</Formula>, so once each row is centered and rescaled by its own statistics, all four rows land on the exact same normalized vector.
      </Paragraph>

      <CodeBlock
        delay={0.95}
        language="Python"
        code={`mean_ln = X.mean(axis=1, keepdims=True)   # over the feature axis, one value per example
var_ln  = X.var(axis=1, keepdims=True)
X_ln = (X - mean_ln) / np.sqrt(var_ln + eps)

print(mean_ln.flatten())  # [2. 4. 6. 8.]
print(var_ln.flatten())   # [ 0.6667  2.6667  6.      10.6667]
print(X_ln)
# [[-1.2247  0.      1.2247]
#  [-1.2247  0.      1.2247]
#  [-1.2247  0.      1.2247]
#  [-1.2247  0.      1.2247]]
print(X_ln.mean(axis=1))  # [0. 0. 0. 0.]
print(X_ln.var(axis=1))   # [1. 1. 1. 1.]`}
      />

      <Paragraph delay={1.0}>
        That last observation is the whole point of layer norm. It only ever looks inside a single example's own features, so the absolute scale one example happens to arrive at means nothing to it, and no statistic ever needs another example in the batch to be computed. That independence is exactly why layer norm fits sequence models and transformers so naturally. A batch of sentences padded to different lengths, or a decoder generating one token at a time at inference, has no stable notion of "the batch" to average over the way a fixed batch of images does. Layer norm sidesteps the question entirely: every token normalizes against its own features regardless of batch size, sequence length, or whether it is training or generating one token at inference.
      </Paragraph>

      <Heading level={2} delay={1.05}>
        Group normalization, a middle ground for vision
      </Heading>

      <Paragraph delay={1.1}>
        <strong>Group normalization</strong> sits between the two. It also computes statistics per example rather than across the batch, so it shares layer norm's independence from batch size, but instead of using all of an example's features at once, it splits the channels into a handful of groups (say 32) and normalizes each group separately. This matters for vision models trained with small batches. Object detection and segmentation networks often can only fit one or two high-resolution images per batch due to memory, which makes batch norm's batch-axis statistics too noisy to trust. Group norm gives those models a batch-size-independent alternative without going all the way to normalizing every channel together the way plain layer norm would.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        RMSNorm, layer norm with the mean subtraction dropped
      </Heading>

      <Paragraph delay={1.2}>
        <strong>RMSNorm</strong> asks a pointed question about layer norm, does centering the mean to 0 actually earn its cost? Empirically, most of layer norm's benefit comes from controlling the scale of the activations, not from forcing the mean to exactly 0. RMSNorm keeps only the rescaling part, dividing by the root mean square of the features instead of a full standard deviation, and skips the mean subtraction step entirely.
      </Paragraph>

      <Formula block delay={1.25}>
        {`\\text{RMSNorm}(x)_j = \\frac{x_j}{\\sqrt{\\frac{1}{C}\\sum_{k=1}^{C} x_k^2 + \\epsilon}} \\cdot \\gamma_j`}
      </Formula>

      <Paragraph delay={1.3}>
        Running it on the same rows confirms the numbers actually change, root mean square is not the same statistic as standard deviation once the mean is nonzero.
      </Paragraph>

      <CodeBlock
        delay={1.35}
        language="Python"
        code={`rms = np.sqrt((X ** 2).mean(axis=1, keepdims=True) + eps)
X_rms = X / rms

print(rms.flatten())  # [2.1602  4.3205  6.4807  8.641 ]
print(X_rms)
# [[0.4629 0.9258 1.3887]
#  [0.4629 0.9258 1.3887]
#  [0.4629 0.9258 1.3887]
#  [0.4629 0.9258 1.3887]]`}
      />

      <Paragraph delay={1.4}>
        The values differ from layer norm's output, but the same core property survives: every row still lands on the same shape once each example is normalized against its own statistics. What RMSNorm actually buys is speed: no mean to compute, no second pass to re-center, and one fewer learned parameter (many implementations drop the additive <Formula>{`\\beta`}</Formula> shift entirely, keeping only <Formula>{`\\gamma`}</Formula>). That savings is small per call, but a large language model calls its normalization layer an enormous number of times, once per sublayer per token per layer, so a cheaper normalization adds up across a full training run. This is why RMSNorm shows up throughout most modern large language models rather than the original layer norm formula.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Residual connections, an identity path for gradients
      </Heading>

      <Paragraph delay={1.5}>
        Normalization keeps activations at a sane scale on the way forward, but it does not by itself fix the other half of the deep network problem, gradients on the way backward. <strong>Residual connections</strong> (also called skip connections) address that directly, and the idea is almost embarrassingly simple. Instead of a layer computing a brand new output <Formula>{`F(x)`}</Formula> from its input <Formula>{`x`}</Formula>, it adds its own input back on top of whatever it computed.
      </Paragraph>

      <Formula block delay={1.55}>
        {`y = x + F(x)`}
      </Formula>

      <Paragraph delay={1.6}>
        The reason this matters so much for gradients is a fact about derivatives, not an intuition. The gradient of <Formula>{`y`}</Formula> with respect to <Formula>{`x`}</Formula> is <Formula>{`1 + \\frac{\\partial F}{\\partial x}`}</Formula>, and that leading <Formula>{`1`}</Formula> is always there no matter how small or poorly scaled <Formula>{`F`}</Formula>'s own gradient happens to be. Stack a hundred of these blocks and the gradient flowing back to the very first layer still has that unbroken chain of <Formula>{`1`}</Formula>s running straight through every addition, on top of whatever each block's own transformation contributes. Without the shortcut, backpropagation through a hundred layers means multiplying a hundred Jacobians together, and if those Jacobians are consistently a bit below 1 in scale, the product shrinks toward zero long before it reaches the earliest layers. With the shortcut, there is always a path where nothing gets multiplied at all, just added, and addition never shrinks a gradient to nothing.
      </Paragraph>

      <Paragraph delay={1.65}>
        This single change is largely what let networks scale from a couple dozen layers to hundreds, ResNet's headline result was that a plain deep convolutional network started getting worse with added depth, while the same depth with residual connections kept improving. A transformer block, likewise, is really just <Formula>{`F`}</Formula> wrapped in a residual connection, twice per block, once around the attention sublayer and once around the feedforward sublayer.
      </Paragraph>

      <Heading level={2} delay={1.7}>
        Pre-norm versus post-norm, where the normalization sits matters
      </Heading>

      <Paragraph delay={1.75}>
        Given that a transformer block is a residual connection wrapped around a sublayer, plus a normalization layer somewhere nearby, an easy detail to overlook turns out to change training stability a great deal, exactly where that normalization layer goes relative to the addition.
      </Paragraph>

      <Paragraph delay={1.8}>
        The original transformer paper placed it after the addition, a pattern usually called <strong>post-norm</strong>.
      </Paragraph>

      <Formula block delay={1.85}>
        {`y = \\text{LayerNorm}(x + F(x))`}
      </Formula>

      <Paragraph delay={1.9}>
        Most modern large language models instead place it before the sublayer, on the branch going into <Formula>{`F`}</Formula>, a pattern called <strong>pre-norm</strong>.
      </Paragraph>

      <Formula block delay={1.95}>
        {`y = x + F(\\text{LayerNorm}(x))`}
      </Formula>

      <BlockOrderDiagram
        delay={0.08}
        panels={[
          {
            title: "Post-norm",
            steps: ["x (input)", "Sublayer F(x)", "x + F(x)", "LayerNorm(...)"],
            highlightSteps: [3],
            note: "The normalization sits after the addition, directly on the path every later block's gradient has to travel through.",
          },
          {
            title: "Pre-norm",
            steps: ["x (input)", "LayerNorm(x)", "Sublayer F(LayerNorm(x))", "x + F(LayerNorm(x))"],
            highlightSteps: [1],
            note: "The addition is the last step, so the identity path from x to the block's output is never touched by a normalization layer.",
          },
        ]}
      />

      <Paragraph delay={2.0}>
        Look closely at the post-norm version and the identity path from the previous section is gone. The last thing that happens is a normalization, which is not the identity function. So the clean "just add 1" gradient path from two sections ago no longer holds exactly, the layer norm's own Jacobian is sitting right in the middle of it. In a shallow network that is a minor wrinkle. Stack enough post-norm blocks and it compounds badly enough that training very deep post-norm transformers reliably needs a careful learning rate warmup just to avoid diverging in the first few hundred steps. Pre-norm keeps the addition as the very last operation, so the identity path really is untouched all the way through. The cost is that the sublayer's own output is no longer explicitly renormalized afterward, which some later work addresses by adding a final normalization layer at the very end of the whole stack instead of after each block.
      </Paragraph>

      <Heading level={2} delay={2.05}>
        Gated blocks, a cheap extra nonlinearity
      </Heading>

      <Paragraph delay={2.1}>
        One more small change shows up in most modern feedforward sublayers, worth a brief mention even though it is not strictly about normalization or residuals. A plain feedforward sublayer is two linear layers with a nonlinearity between them. A <strong>gated</strong> version, following the Gated Linear Unit (GLU) family, instead computes two separate linear projections of the same input and multiplies them elementwise, one projection passed through an activation function to act as a "gate" controlling how much of the other projection gets through.
      </Paragraph>

      <Formula block delay={2.15}>
        {`\\text{GLU}(x) = (xW_1) \\odot \\sigma(xW_2)`}
      </Formula>

      <Paragraph delay={2.2}>
        The intuition is a soft, learned, per-position switch. Rather than every unit passing through the same fixed nonlinearity regardless of context, the network can learn to suppress or amplify specific features depending on what the input actually looks like. Variants that swap in a different gating activation, SwiGLU and GEGLU among them, have become the default feedforward sublayer in most modern transformer implementations, usually at the cost of a slightly wider hidden dimension to keep the parameter count comparable to the ungated version.
      </Paragraph>

      <Heading level={2} delay={2.25}>
        Why this combination is what lets networks get deep
      </Heading>

      <Paragraph delay={2.3}>
        Put the four pieces together and a clear division of labor shows up. Residual connections guarantee a gradient path back to every earlier layer that nothing can multiply away to nothing. Pre-norm placement keeps that path genuinely untouched by anything that would break the "just add 1" argument. RMSNorm or layer norm keeps the input to each sublayer at a sane, predictable scale, cheaply, regardless of batch size or sequence length. And gating gives each sublayer a small extra bit of expressiveness for roughly the same compute budget. None of these four ideas individually would let a network reach a hundred or more layers, but stacked deliberately, in the exact order modern architectures use, they do.
      </Paragraph>

      <Heading level={2} delay={2.35}>
        Takeaways
      </Heading>

      <List delay={2.4}>
        <ListItem>Batch norm normalizes each feature (a column) across the examples in a batch, which stabilizes training but ties the layer's behavior to batch size and requires running statistics at inference.</ListItem>
        <ListItem>Layer norm normalizes each example (a row) across its own features instead, making it independent of batch size and a natural fit for sequence models and transformers. Group norm and RMSNorm are variations on the same per-example idea, splitting channels into groups or dropping the mean subtraction for speed.</ListItem>
        <ListItem>Residual connections add a layer's input back onto its output, guaranteeing a gradient path with a derivative of exactly 1 that survives no matter how deep the network gets.</ListItem>
        <ListItem>Where the normalization sits relative to that addition matters, pre-norm keeps the identity path completely untouched and trains far more stably at real depth than the original post-norm ordering.</ListItem>
        <ListItem>Gated feedforward blocks (GLU and its variants) add a cheap, learned, per-position filter on top of all of the above, and have become the default feedforward sublayer in most current transformer implementations.</ListItem>
      </List>

      <Paragraph delay={2.45}>
        None of these four ideas is individually complicated: a mean and a variance over a chosen axis, an addition, a reordering of two operations, an elementwise product. What is genuinely impressive is how much depth that combination unlocks once it is assembled correctly, and how consistently the same small recipe shows up whether the block in question is doing attention, a feedforward pass, or something else entirely. Thanks for reading.
      </Paragraph>
    </>
  ),
};
