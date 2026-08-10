import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  CodeBlock,
  InlineCode,
  Formula,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  DiagramPhase,
} from "../components";
import {
  PullPushDiagram,
  SimilarityMatrixDiagram,
  EmbeddingClusterDiagram,
} from "../components/animations/contrastive-learning/ConceptViz";
import { Image, Type, Cpu, Boxes, Layers, Grid3x3, Activity, RotateCcw } from "lucide-react";

const encoderNodes: DiagramNode[] = [
  { id: "image-in", label: "Image", icon: Image, color: "text-slate-500", x: 25, y: 12 },
  { id: "text-in", label: "Caption", icon: Type, color: "text-slate-500", x: 75, y: 12 },
  { id: "image-enc", label: "Image encoder", sub: "ViT or CNN", icon: Cpu, color: "text-blue-500", x: 25, y: 48 },
  { id: "text-enc", label: "Text encoder", sub: "Transformer", icon: Cpu, color: "text-indigo-500", x: 75, y: 48 },
  { id: "shared", label: "Shared embedding space", sub: "same dimensionality", icon: Boxes, color: "text-emerald-500", x: 50, y: 85 },
];

const encoderEdges: DiagramEdge[] = [
  { id: "e-image-enc", from: "image-in", to: "image-enc" },
  { id: "e-text-enc", from: "text-in", to: "text-enc" },
  { id: "e-image-shared", from: "image-enc", to: "shared" },
  { id: "e-text-shared", from: "text-enc", to: "shared" },
];

const trainingLoopNodes: DiagramNode[] = [
  { id: "batch", label: "Batch of pairs", sub: "N image-caption pairs", icon: Layers, color: "text-slate-500", x: 8, y: 50 },
  { id: "encoders", label: "Encoders", sub: "image + text", icon: Cpu, color: "text-blue-500", x: 27, y: 50 },
  { id: "sim", label: "Similarity matrix", sub: "N x N", icon: Grid3x3, color: "text-indigo-500", x: 50, y: 50 },
  { id: "loss", label: "Contrastive loss", sub: "cross-entropy", icon: Activity, color: "text-orange-500", x: 73, y: 50 },
  { id: "backprop", label: "Backprop", sub: "update both encoders", icon: RotateCcw, color: "text-emerald-500", x: 92, y: 50 },
];

const trainingLoopEdges: DiagramEdge[] = [
  { id: "e-batch-enc", from: "batch", to: "encoders" },
  { id: "e-enc-sim", from: "encoders", to: "sim" },
  { id: "e-sim-loss", from: "sim", to: "loss" },
  { id: "e-loss-backprop", from: "loss", to: "backprop" },
];

const trainingLoopPhases: DiagramPhase[] = [
  { nodeIds: ["batch"], edgeIds: [], note: "Start with a batch of N image-caption pairs." },
  { nodeIds: ["batch", "encoders"], edgeIds: ["e-batch-enc"], note: "Every image and every caption passes through its own encoder." },
  { nodeIds: ["batch", "encoders", "sim"], edgeIds: ["e-batch-enc", "e-enc-sim"], note: "The two sets of embeddings form an N x N similarity matrix." },
  { nodeIds: ["batch", "encoders", "sim", "loss"], edgeIds: ["e-batch-enc", "e-enc-sim", "e-sim-loss"], note: "Cross-entropy loss compares that matrix against the diagonal." },
  { nodeIds: ["batch", "encoders", "sim", "loss", "backprop"], edgeIds: ["e-batch-enc", "e-enc-sim", "e-sim-loss", "e-loss-backprop"], note: "Backprop updates both encoders, then the next batch starts the loop again." },
];

export const contrastiveLearning: BlogPostData = {
  title: "Contrastive Learning",
  date: "April 30, 2026",
  slug: "contrastive-learning",
  content: (
    <>
      <Paragraph delay={0.10}>
        If you've used image search on Google Photos, asked ChatGPT to describe a picture, or seen a model retrieve "a red bicycle parked on a city street" from a sea of unrelated photos, you've already seen contrastive learning at work. It's the trick behind models like CLIP, and it's quietly become one of the most useful ideas in modern ML.
      </Paragraph>

      <Paragraph delay={0.15}>
        The cool part is that the underlying idea is genuinely simple. No fancy losses. No complex architectures. Just a clean question, <em>can we teach a model that "this image" and "this caption" belong together, and everything else does not?</em> This post walks through how that works for image-text pairs, end to end.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        The core idea
      </Heading>

      <Paragraph delay={0.25}>
        Contrastive learning has exactly two moves, <strong>pull matching pairs together</strong> in a shared embedding space, and <strong>push non-matching pairs apart</strong>. That's it. If you remember nothing else from this post, remember those two arrows.
      </Paragraph>

      <PullPushDiagram
        delay={0.05}
        caption="The two operations contrastive learning ever applies, in a shared embedding space."
      />

      <Paragraph delay={0.30}>
        The reason this is powerful is that a model doesn't need labels in the traditional sense. Nobody needs to tag every image with one of 1000 ImageNet classes. All it needs is <em>pairs that go together</em>, a photo and its caption, a question and its answer, a song and its lyrics. The web is full of those, which is why this approach scaled the way it did.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        What does the data look like?
      </Heading>

      <Paragraph delay={0.40}>
        For image-text contrastive learning, the data is exactly what you'd hope, a bunch of (image, caption) pairs. To keep the running example concrete, here are four pairs used throughout the post.
      </Paragraph>

      <List delay={0.45}>
        <ListItem>A photo of a dog, paired with the caption "a dog running in a park."</ListItem>
        <ListItem>A photo of a mountain lake, paired with the caption "a lake surrounded by mountains."</ListItem>
        <ListItem>A photo of a red car, paired with the caption "a red car parked on a city street."</ListItem>
        <ListItem>A photo of a cat, paired with the caption "a cat sitting on a windowsill."</ListItem>
      </List>

      <Paragraph delay={0.50}>
        The clever bit, when a batch of <Formula>{`N`}</Formula> pairs gets fed into the model, that produces <Formula>{`N`}</Formula> matches and <Formula>{`N^2 - N`}</Formula> non-matches <em>for free</em>. With a batch of 4, that's 4 positives and 12 negatives. With a batch of 32,768 (which is what CLIP used), it's a lot more. Bigger batches lead to more negatives, and more negatives make for a more useful contrastive signal.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        Two encoders, one shared space
      </Heading>

      <Paragraph delay={0.60}>
        Images and text are very different beasts. A 224x224 RGB image is a 150,528-dimensional integer tensor, a caption is a sequence of tokens. So the setup uses two separate encoders, one for each modality, and has them both output a vector of the same size, say 512 dimensions.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={420}
        nodes={encoderNodes}
        edges={encoderEdges}
        caption="Two encoders, two very different input types, but vectors of the same shape landing in one shared space."
      />

      <Paragraph delay={0.65}>
        Typical choices are a <InlineCode>ViT</InlineCode> or <InlineCode>ResNet</InlineCode> for the image side and a <InlineCode>Transformer</InlineCode> for the text side, but really anything that produces a fixed-length vector will do. The important thing is that the two output spaces have the same dimensionality, because they're about to be compared directly.
      </Paragraph>

      <Paragraph delay={0.70}>
        One detail that matters, embeddings are usually <strong>L2-normalized</strong> before comparison. That puts every vector on the unit hypersphere, which makes cosine similarity well-behaved and stops the model from cheating by just making vectors really long.
      </Paragraph>

      <Heading level={2} delay={0.75}>
        Computing similarity
      </Heading>

      <Paragraph delay={0.80}>
        Once both modalities live in the same space, comparing them is easy, take the dot product. If the vectors are L2-normalized, this is the cosine similarity, which lives in <Formula>{`[-1, 1]`}</Formula>. This gets computed for <em>every</em> image-text pair in the batch, which gives an <Formula>{`N \\times N`}</Formula> similarity matrix.
      </Paragraph>

      <SimilarityMatrixDiagram
        delay={0.06}
        caption="The similarity matrix for the four running-example pairs. Training pushes the diagonal up and everything else down, until the diagonal is the only thing left glowing."
      />

      <Paragraph delay={0.85}>
        Look at the diagonal, <Formula>{`0.92`}</Formula>, <Formula>{`0.94`}</Formula>, <Formula>{`0.93`}</Formula>. Those are the matching pairs, the dog with the dog caption, the lake with the lake caption. The model has learned that a cat photo doesn't belong with a description of a mountain lake.
      </Paragraph>

      <Paragraph delay={0.90}>
        Reframed this way, the training problem becomes, <strong>make the diagonal of this matrix as bright as possible, and the off-diagonal as dark as possible</strong>. Which leads nicely into the loss.
      </Paragraph>

      <Heading level={2} delay={0.95}>
        The contrastive objective
      </Heading>

      <Paragraph delay={1.00}>
        Here's the elegant move that makes everything click. Read each row of the similarity matrix as <em>the logits of a classifier</em>, where the correct class is the one on the diagonal. Suddenly plain old cross-entropy applies.
      </Paragraph>

      <Paragraph delay={1.05}>
        For a single image <Formula>{`i`}</Formula>, the loss is,
      </Paragraph>

      <Formula block delay={1.10}>
        {`\\mathcal{L}_i = -\\log \\frac{\\exp\\bigl(\\operatorname{sim}(i, t_i) / \\tau\\bigr)}{\\sum_{j=1}^{N} \\exp\\bigl(\\operatorname{sim}(i, t_j) / \\tau\\bigr)}`}
      </Formula>

      <Paragraph delay={1.15}>
        The numerator rewards the model when image <Formula>{`i`}</Formula> is close to its own caption <Formula>{`t_i`}</Formula>. The denominator sums over all <Formula>{`N`}</Formula> captions in the batch and acts like a normalizer, for the loss to go down, the matching pair has to "win" the softmax against all the non-matching ones. That's the contrastive part.
      </Paragraph>

      <Paragraph delay={1.20}>
        The <Formula>{`\\tau`}</Formula> ("temperature") is a small positive number that controls how sharp the softmax is. Lower temperature means sharper, more aggressive about separating positives from hard negatives. CLIP makes <Formula>{`\\tau`}</Formula> a learnable parameter.
      </Paragraph>

      <Paragraph delay={1.25}>
        This loss gets computed in both directions, image-to-text and text-to-image, then averaged. That symmetry is what makes the embedding space coherent from both sides. In code, the whole thing is shockingly compact.
      </Paragraph>

      <CodeBlock
        delay={1.30}
        language="Python"
        code={`import torch
import torch.nn.functional as F

def contrastive_loss(image_embs, text_embs, temperature=0.07):
    # L2-normalize so dot product == cosine similarity
    image_embs = F.normalize(image_embs, dim=-1)
    text_embs  = F.normalize(text_embs,  dim=-1)

    # N x N similarity matrix, scaled by temperature
    logits = (image_embs @ text_embs.T) / temperature

    # The correct class for row i is column i — the diagonal
    labels = torch.arange(len(image_embs), device=logits.device)

    # Symmetric cross-entropy: image -> text and text -> image
    loss_i2t = F.cross_entropy(logits,    labels)
    loss_t2i = F.cross_entropy(logits.T,  labels)
    return (loss_i2t + loss_t2i) / 2`}
      />

      <Paragraph delay={1.35}>
        Six lines of real work. That's the whole CLIP loss.
      </Paragraph>

      <Heading level={2} delay={1.40}>
        What the embedding space looks like after training
      </Heading>

      <Paragraph delay={1.45}>
        After enough iterations of "pull, push, pull, push," something nice emerges, the embedding space organizes itself by <em>meaning</em>. Photos of dogs cluster near captions about dogs. Photos of mountains cluster near captions about mountains. And, this is the part that gets people excited, concepts that are semantically close end up close in space, even if nobody ever told the model so explicitly.
      </Paragraph>

      <EmbeddingClusterDiagram
        delay={0.06}
        caption="The embedding space after training. Each cluster is a concept, nearness encodes meaning."
      />

      <Paragraph delay={1.50}>
        This is what makes <strong>zero-shot classification</strong> work. To classify an image as "cat" or "dog" with a trained model, nothing needs fine-tuning. Just embed the image, embed the strings <InlineCode>"a photo of a cat"</InlineCode> and <InlineCode>"a photo of a dog"</InlineCode>, and pick whichever caption is closer. The model never saw those specific labels in training, but because it learned to align language with images in general, the comparison just works.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        Putting it all together, the training loop
      </Heading>

      <Paragraph delay={1.60}>
        Here is the entire pipeline in one picture, start to finish.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.09}
        height={300}
        nodes={trainingLoopNodes}
        edges={trainingLoopEdges}
        phases={trainingLoopPhases}
        caption="One training step. Repeat a few hundred million times and the result is CLIP."
      />

      <Paragraph delay={1.65}>
        Each step,
      </Paragraph>

      <List ordered delay={1.70}>
        <ListItem>Sample a batch of <Formula>{`N`}</Formula> image-caption pairs.</ListItem>
        <ListItem>Run images through the image encoder, captions through the text encoder.</ListItem>
        <ListItem>L2-normalize and form the <Formula>{`N \\times N`}</Formula> similarity matrix.</ListItem>
        <ListItem>Compute the symmetric contrastive loss against the diagonal.</ListItem>
        <ListItem>Backprop, update both encoders, repeat.</ListItem>
      </List>

      <Paragraph delay={1.75}>
        That's the whole algorithm. The hard parts are not in the loss, they're in scale, data quality, and tuning.
      </Paragraph>

      <Heading level={2} delay={1.80}>
        Takeaways
      </Heading>

      <List delay={1.85}>
        <ListItem>Contrastive learning aligns two modalities (or two views, or two anything) in a shared embedding space.</ListItem>
        <ListItem>The objective is just, matching pairs close, non-matching pairs far. Cross-entropy on the similarity matrix's diagonal makes that work.</ListItem>
        <ListItem>Powerful zero-shot retrieval and classification come almost for free, because the model learns <em>meaning</em>, not labels.</ListItem>
        <ListItem>The same recipe extends well beyond image-text, audio-text, video-text, code-doc, even single-modality self-supervision (SimCLR) all use this template.</ListItem>
      </List>

      <Paragraph delay={1.90}>
        Thanks for reading, and as always, feel free to reach out if you have questions or want to chat about this stuff.
      </Paragraph>
    </>
  ),
};
