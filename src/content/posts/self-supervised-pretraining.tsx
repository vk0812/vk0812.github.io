import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  StatTiles,
  StatItem,
} from "../components";
import { RepresentationCollapseDiagram } from "../components/animations/self-supervised-pretraining/ConceptViz";
import {
  Type,
  EyeOff,
  Cpu,
  Sigma,
  CheckCircle2,
  FileText,
  Crop,
  ArrowRightLeft,
  GitCompare,
} from "lucide-react";

const maskedPipelineNodes: DiagramNode[] = [
  { id: "input", label: "Input sequence", icon: Type, color: "text-slate-500", x: 6, y: 50 },
  { id: "masked", label: "Mask a subset", sub: "15% of tokens, BERT's ratio", icon: EyeOff, color: "text-amber-500", x: 30, y: 50 },
  { id: "encoder", label: "Encoder", sub: "bidirectional self-attention", icon: Cpu, color: "text-blue-500", x: 54, y: 50 },
  { id: "head", label: "Prediction head", sub: "softmax per masked slot", icon: Sigma, color: "text-pink-500", x: 78, y: 50 },
  { id: "output", label: "Recovered tokens", icon: CheckCircle2, color: "text-emerald-500", x: 96, y: 50 },
];

const maskedPipelineEdges: DiagramEdge[] = [
  { id: "e-input-masked", from: "input", to: "masked" },
  { id: "e-masked-encoder", from: "masked", to: "encoder" },
  { id: "e-encoder-head", from: "encoder", to: "head" },
  { id: "e-head-output", from: "head", to: "output" },
];

const jepaNodes: DiagramNode[] = [
  { id: "input", label: "Raw input", icon: FileText, color: "text-slate-500", x: 6, y: 50 },
  { id: "context", label: "Context view", sub: "visible region", icon: Crop, color: "text-blue-500", x: 28, y: 22 },
  { id: "targetview", label: "Target view", sub: "held-out region", icon: Crop, color: "text-violet-500", x: 28, y: 78 },
  { id: "ctxenc", label: "Context encoder", icon: Cpu, color: "text-indigo-500", x: 52, y: 22 },
  { id: "targetenc", label: "Target encoder", sub: "EMA of context encoder, no gradient", icon: Cpu, color: "text-slate-400", x: 52, y: 78 },
  { id: "predictor", label: "Predictor", icon: ArrowRightLeft, color: "text-pink-500", x: 76, y: 22 },
  { id: "compare", label: "Compare embeddings", sub: "cosine or L2 distance", icon: GitCompare, color: "text-emerald-500", x: 94, y: 50 },
];

const jepaEdges: DiagramEdge[] = [
  { id: "e-input-context", from: "input", to: "context" },
  { id: "e-input-targetview", from: "input", to: "targetview" },
  { id: "e-context-ctxenc", from: "context", to: "ctxenc" },
  { id: "e-targetview-targetenc", from: "targetview", to: "targetenc" },
  { id: "e-ctxenc-predictor", from: "ctxenc", to: "predictor" },
  { id: "e-predictor-compare", from: "predictor", to: "compare" },
  { id: "e-targetenc-compare", from: "targetenc", to: "compare" },
];

const headlineStats: StatItem[] = [
  { label: "Text masking ratio, BERT", value: 15, suffix: "%", icon: Type, color: "text-amber-500" },
  { label: "Image patch masking ratio, MAE", value: 75, suffix: "%", icon: Crop, color: "text-blue-500" },
  { label: "Negative pairs needed, joint-embedding objectives", value: 0, icon: GitCompare, color: "text-emerald-500" },
];

export const selfSupervisedPretraining: BlogPostData = {
  title: "Self-Supervised Pretraining",
  date: "August 3, 2026",
  slug: "self-supervised-pretraining",
  content: (
    <>
      <Paragraph delay={0.10}>
        Cover half a sentence with your thumb and most people can still guess the missing word from what surrounds it. A model that gets good at the same guessing game, repeated across billions of sentences, ends up learning a huge amount about grammar, facts, and the relationships between words. Nobody ever told it the "right answer" to any task anyone actually cares about.
      </Paragraph>

      <Paragraph delay={0.15}>
        That guessing game is the whole idea behind self-supervised pretraining, training a model on a task built entirely out of unlabeled data, where the correct answer already lives inside the data itself. No human sits down and labels a training set for it. The data hides part of itself, the model has to recover the missing part, and getting good at that recovery forces the model to learn real structure along the way.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        The core idea
      </Heading>

      <Paragraph delay={0.25}>
        The task a model actually trains on here is called a <strong>pretext task</strong>, a made-up problem built purely from raw data, separate from whatever real task someone eventually wants the model for (classifying images, answering questions, writing code). A pretext task earns its keep on one condition. Solving it well has to require roughly the same kind of understanding the real task needs.
      </Paragraph>

      <Paragraph delay={0.30}>
        Hide part of an input, predict the hidden part from what's left, repeat across an enormous pile of unlabeled data. Every objective in this post is a variation on that same shape. They differ mainly in what gets hidden and how the prediction gets scored, not in the basic recipe.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Masked prediction
      </Heading>

      <Paragraph delay={0.40}>
        The clearest example is masked language modeling, the objective behind BERT, a widely used encoder-only language model. Take a sentence, replace a chunk of its tokens with a placeholder, and train the model to predict what word used to sit in each hidden position using only the surrounding, unhidden words as evidence.
      </Paragraph>

      <Paragraph delay={0.45}>
        The fraction of tokens hidden on any given example is called the <strong>masking ratio</strong>. BERT settled on 15 percent. Low enough that plenty of real context survives around every hidden position, high enough that nearly every sentence gives the model a real prediction to make. BERT also doesn't literally swap in a placeholder every single time a token gets selected, some selected positions get replaced with a random word instead, and some get left completely unchanged, so the model can't just learn a shortcut of only paying attention wherever the placeholder is visibly present.
      </Paragraph>

      <Formula block delay={0.50}>
        {`\\mathcal{L}_{\\text{mask}} = -\\frac{1}{|M|} \\sum_{i \\in M} \\log P(x_i \\mid x_{\\setminus M})`}
      </Formula>

      <Paragraph delay={0.55}>
        <Formula>{`M`}</Formula> is the set of masked positions in one example, and the loss averages the negative log probability of the true token at each of those positions, given <Formula>{`x_{\\setminus M}`}</Formula>, everything that wasn't masked. Getting this loss down means the model has to actually infer a hidden word from context, not just copy something it already saw.
      </Paragraph>

      <Paragraph delay={0.60}>
        Because a masked position can pull in evidence from tokens on both sides of it, this only works with an architecture that lets every token see the whole sequence at once, an encoder running unmasked, bidirectional self-attention over the full input.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={300}
        nodes={maskedPipelineNodes}
        edges={maskedPipelineEdges}
        caption="A masked prediction pipeline. A subset of tokens gets hidden, an encoder processes the full sequence with access to both directions, and a prediction head guesses each hidden token from its surrounding context."
      />

      <Heading level={2} delay={0.65}>
        Autoregressive prediction
      </Heading>

      <Paragraph delay={0.70}>
        Autoregressive prediction flips the direction. Instead of hiding a scattered subset of tokens, it only ever hides what comes next, and gives the model unrestricted access to everything before it.
      </Paragraph>

      <Formula block delay={0.75}>
        {`P(x_1, \\dots, x_T) = \\prod_{t=1}^{T} P(x_t \\mid x_1, \\dots, x_{t-1})`}
      </Formula>

      <Paragraph delay={0.80}>
        Predict the next token given every token seen so far, move one position forward, repeat. A whole sequence's probability factors into a chain of one next-token guess after another, which is exactly what GPT-style models train on. Making this work needs one architectural constraint, a token is only allowed to attend to itself and earlier positions, never anything after it, or the model could just look up the answer instead of predicting it. That constraint lives in how attention gets computed rather than in the objective itself, and it's the reason a decoder can generate text one token at a time and still be trained on a whole sequence at once.
      </Paragraph>

      <Paragraph delay={0.85}>
        Masked and autoregressive prediction end up suited to different jobs precisely because of this direction difference. Bidirectional context is great for understanding an entire input at once, and strictly-forward context is what open-ended generation actually needs, since there's nothing after the current position to look at yet when generating for real.
      </Paragraph>

      <Heading level={2} delay={0.90}>
        Denoising as the general case
      </Heading>

      <Paragraph delay={0.95}>
        Masking is really one instance of a bigger idea, denoising. Corrupt an input somehow, then train a model to recover the clean original from the corrupted version. Text corruption can mean masking tokens, deleting them outright, shuffling word or sentence order, or swapping in random substitutes. The model's job stays the same regardless of which corruption gets used, undo the damage using whatever structure survived it.
      </Paragraph>

      <Paragraph delay={1.00}>
        Vision has its own version of the same recipe. Split an image into patches, remove a large fraction of them, and train an encoder to reconstruct the missing pixels using only the visible patches. This is a masked autoencoder, structurally the same idea as masked language modeling, just applied to patches of pixels instead of tokens of text. Its masking ratio looks nothing like BERT's though, work on masked autoencoders for images found that hiding around 75 percent of the patches still leaves a solvable task.
      </Paragraph>

      <Paragraph delay={1.05}>
        That gap makes sense once the underlying redundancy is considered. Neighboring pixels in a photo are usually highly correlated, so a missing patch can often be guessed fairly well just from the patches around it, which means a much larger fraction can be hidden before the task turns impossible. Text carries far less of that redundancy. Hide too many words in a row and there's nothing left implying what belongs in the gap.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        Designing a pretext task that can't be gamed
      </Heading>

      <Paragraph delay={1.15}>
        Not every made-up prediction task is a good one. A pretext task fails the moment a model can solve it using some shortcut that has nothing to do with the understanding it was supposed to build. Early self-supervised work on images ran straight into this. Tasks like predicting the relative position of two image patches, or figuring out how a shuffled jigsaw of patches was originally arranged, sounded like they should force a model to learn real object structure. In practice, models sometimes solved them by exploiting low-level artifacts instead, tiny color fringing at patch boundaries or leftover edge continuity from how the patches were cut, shortcuts that had nothing to do with recognizing what was actually in the image.
      </Paragraph>

      <Paragraph delay={1.20}>
        The fix in each case was tightening the pretext task itself, removing the exact signal the shortcut depended on, so the only way left to solve the task was the intended one. This is the general lesson worth carrying forward. A masking ratio, a corruption scheme, and every other pretext-task choice is a design decision that has to be checked against exactly this failure mode, not just tuned for whichever setting makes the loss go down fastest.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        Predictive and joint-embedding objectives
      </Heading>

      <Paragraph delay={1.30}>
        Everything so far reconstructs the actual input, real tokens or real pixels. That has a cost. Forcing a model to reproduce exact pixel values spends a lot of its capacity on low-level texture and noise that has little to do with what the image actually shows. An alternative line of objectives sidesteps this by predicting a representation instead of the raw input.
      </Paragraph>

      <Paragraph delay={1.35}>
        The general setup takes two related views of the same underlying input, a visible region and a held-out region of the same image, say, or two differently augmented copies of the same photo. Each view gets its own embedding from its own encoder, and the whole objective is about the relationship between those two embeddings, not about reconstructing anything pixel by pixel. This family is called <strong>joint-embedding</strong> because both views end up mapped into the same shared representation space, and everything the objective cares about happens inside that space.
      </Paragraph>

      <Paragraph delay={1.40}>
        One branch, the context encoder, processes the visible view and feeds its output through a small predictor network that tries to guess what the other branch produced. The other branch, the target encoder, processes the held-out view directly. Its weights usually aren't learned by gradient descent at all, they get updated as a slow-moving average of the context encoder's weights instead, a <strong>momentum target encoder</strong>, so the target drifts gradually rather than reacting to every single training step. The comparison between the predictor's guess and the target encoder's actual output only sends a gradient back through the context branch and the predictor. The target branch gets a <strong>stop-gradient</strong>, treated as a fixed constant for that step, contributing nothing to its own update.
      </Paragraph>

      <Formula block delay={1.45}>
        {`\\mathcal{L} = -\\operatorname{sim}\\bigl(p(z_c),\\, \\operatorname{sg}(z_t)\\bigr)`}
      </Formula>

      <Paragraph delay={1.50}>
        <Formula>{`z_c`}</Formula> is the context encoder's embedding of the visible view, <Formula>{`z_t`}</Formula> is the target encoder's embedding of the held-out view, and <Formula>{`p`}</Formula> is the predictor mapping the context embedding toward the target's space. <Formula>{`\\operatorname{sg}`}</Formula> marks the stop-gradient, and <Formula>{`\\operatorname{sim}`}</Formula> is typically cosine similarity or negative squared distance. Some self-supervised setups solve this same cross-view alignment problem by explicitly contrasting a true pair against a pile of negative pairs pulled from elsewhere in the batch, pulling matches together and pushing everything else apart. That contrastive family deserves its own treatment and won't be re-derived here. What's notable about the setup above is that it needs no negatives at all to work.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={440}
        nodes={jepaNodes}
        edges={jepaEdges}
        caption="A joint-embedding predictive setup. A context encoder and a slow-moving target encoder embed two related views of the same input, and a predictor tries to guess the target's embedding from the context's, with gradients flowing only through the context side."
      />

      <StatTiles delay={0.06} items={headlineStats} />

      <Heading level={2} delay={1.55}>
        Avoiding representation collapse
      </Heading>

      <Paragraph delay={1.60}>
        <strong>Representation collapse</strong> is what happens when a model stops distinguishing between different inputs and maps a large chunk of them to nearly the same output vector. It's a real risk for the joint-embedding setup above in particular. Nothing in that loss stops the model from cheating outright. If both encoders always output the exact same constant vector regardless of what goes in, the similarity between predictor output and target output hits its maximum immediately. Loss minimized, nothing learned.
      </Paragraph>

      <Paragraph delay={1.65}>
        A contrastive objective mostly avoids this for free, since pushing negative pairs apart directly penalizes every representation looking alike. A joint-embedding setup with no negatives has to prevent collapse some other way, and several tricks compound to do it. The stop-gradient breaks the symmetric solution where both branches could drift toward the same constant together, since only one side ever gets to react to the comparison. The momentum target moving slowly stops the target from just chasing whatever shortcut the context encoder finds this step, which would otherwise let the two sides collapse together quickly. The predictor network adds a further asymmetry between the two branches, one more obstacle in the way of the trivial constant solution. Some setups add an explicit variance term on top of all this, a direct penalty that keeps each embedding dimension spread out across a batch instead of trusting architecture alone to prevent collapse.
      </Paragraph>

      <RepresentationCollapseDiagram
        delay={0.08}
        caption="Six inputs, two outcomes. Left, nothing stops every embedding from sliding toward the same point as training goes on. Right, stop-gradient and a momentum target encoder keep the six embeddings distinguishable."
      />

      <Heading level={2} delay={1.70}>
        Measuring whether pretraining actually worked
      </Heading>

      <Paragraph delay={1.75}>
        None of this matters unless there's a way to check whether the resulting representation is actually useful for something. That check is called transfer evaluation, and it usually takes one of a few standard forms.
      </Paragraph>

      <List delay={1.80}>
        <ListItem><strong>Linear probing.</strong> Freeze the pretrained encoder completely and train only a small linear classifier on top of it, using labeled data. A good representation should already separate the classes well enough that a single linear layer can find the boundary, without the encoder itself needing to change at all.</ListItem>
        <ListItem><strong>Fine-tuning.</strong> Unfreeze most or all of the pretrained model and keep training it on the downstream task with labeled data. This usually reaches a given accuracy with far fewer labeled examples than training the same architecture from scratch would need, which is most of the practical payoff of pretraining in the first place.</ListItem>
        <ListItem><strong>Few-shot evaluation.</strong> Measure accuracy using only a handful of labeled examples per class. A strong pretrained representation should need very little labeled data before it starts performing well, since most of the real learning already happened during pretraining.</ListItem>
      </List>

      <Paragraph delay={1.85}>
        These three checks aren't redundant with each other. Linear probing asks whether the representation is already well organized on its own. Fine-tuning asks how much labeled data the whole system actually needs to reach a target accuracy. Few-shot evaluation pushes that same question to its extreme, checking how little labeled data still works at all.
      </Paragraph>

      <Heading level={2} delay={1.90}>
        Takeaways
      </Heading>

      <List delay={1.95}>
        <ListItem>Every self-supervised objective in this post is the same basic recipe wearing a different outfit, hide part of an input, predict it from what's left, and let the difficulty of that prediction force real structure into the model.</ListItem>
        <ListItem>Masked prediction hides a scattered subset of tokens and needs bidirectional context, autoregressive prediction only ever hides what comes next and needs strictly forward context, both are denoising with a different corruption pattern.</ListItem>
        <ListItem>Masking ratio and corruption scheme are design decisions, not defaults, a good pretext task has to resist shortcut solutions that dodge the understanding it was meant to build.</ListItem>
        <ListItem>Joint-embedding predictive objectives compare representations instead of reconstructing raw input, and need stop-gradient, a momentum target encoder, and often an explicit variance term to avoid collapsing every input to the same point.</ListItem>
        <ListItem>Transfer evaluation, linear probing, fine-tuning, and few-shot performance, is how a pretrained representation earns its keep, since the whole point of pretraining is needing less labeled data later.</ListItem>
      </List>

      <Paragraph delay={2.00}>
        Strip away the specifics of any one objective and the same wager sits underneath all of them, that there's enough structure in raw, unlabeled data to teach a model something real, if the prediction task is hard enough to force it. Nearly every large model in use today spent most of its training budget on exactly that wager before it ever saw a single labeled example. Thanks for reading.
      </Paragraph>
    </>
  ),
};
