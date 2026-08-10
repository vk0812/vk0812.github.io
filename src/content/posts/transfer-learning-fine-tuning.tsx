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
  DiagramPhase,
  StatTiles,
  StatItem,
} from "../components";
import { Image, Lock, Sparkles, Target, Layers, Percent } from "lucide-react";
import { CatastrophicForgettingDiagram } from "../components/animations/transfer-learning-fine-tuning/ConceptViz";

const frozenTrainableNodes: DiagramNode[] = [
  { id: "input", label: "Input image", sub: "photo of a bird", icon: Image, color: "text-slate-500", x: 8, y: 50 },
  { id: "backbone", label: "Pretrained backbone", sub: "frozen, unchanged", icon: Lock, color: "text-blue-500", x: 38, y: 50 },
  { id: "head", label: "New classifier head", sub: "trainable, learns the task", icon: Sparkles, color: "text-emerald-500", x: 68, y: 50 },
  { id: "output", label: "Prediction", sub: "species label", icon: Target, color: "text-orange-500", x: 92, y: 50 },
];

const frozenTrainableEdges: DiagramEdge[] = [
  { id: "input-backbone", from: "input", to: "backbone" },
  { id: "backbone-head", from: "backbone", to: "head" },
  { id: "head-output", from: "head", to: "output" },
];

const unfreezeNodes: DiagramNode[] = [
  { id: "input", label: "Input", icon: Image, color: "text-slate-500", x: 6, y: 50 },
  { id: "l1", label: "Earliest layers", sub: "edges, textures", icon: Layers, color: "text-slate-500", x: 26, y: 50 },
  { id: "l2", label: "Middle layers", sub: "shapes, parts", icon: Layers, color: "text-indigo-500", x: 46, y: 50 },
  { id: "l3", label: "Late layers", sub: "task-specific patterns", icon: Layers, color: "text-violet-500", x: 66, y: 50 },
  { id: "head", label: "Classifier head", sub: "new, always trainable", icon: Sparkles, color: "text-emerald-500", x: 88, y: 50 },
];

const unfreezeEdges: DiagramEdge[] = [
  { id: "input-l1", from: "input", to: "l1" },
  { id: "l1-l2", from: "l1", to: "l2" },
  { id: "l2-l3", from: "l2", to: "l3" },
  { id: "l3-head", from: "l3", to: "head" },
];

const unfreezePhases: DiagramPhase[] = [
  {
    nodeIds: ["input", "l1", "l2", "l3", "head"],
    edgeIds: ["input-l1", "l1-l2", "l2-l3", "l3-head"],
    note: "Training starts with only the new head unfrozen, every backbone layer stays locked.",
    highlight: ["head"],
  },
  {
    nodeIds: ["input", "l1", "l2", "l3", "head"],
    edgeIds: ["input-l1", "l1-l2", "l2-l3", "l3-head"],
    note: "Once the head has learned something reasonable, the late layer group unfreezes and joins training.",
    highlight: ["l3"],
  },
  {
    nodeIds: ["input", "l1", "l2", "l3", "head"],
    edgeIds: ["input-l1", "l1-l2", "l2-l3", "l3-head"],
    note: "Unfreezing keeps moving backward through the network, one layer group at a time.",
    highlight: ["l2"],
  },
  {
    nodeIds: ["input", "l1", "l2", "l3", "head"],
    edgeIds: ["input-l1", "l1-l2", "l2-l3", "l3-head"],
    note: "By the final stage every layer, including the earliest one, is training together.",
    highlight: ["l1"],
  },
];

const scaleStats: StatItem[] = [
  { label: "Training images behind a typical ImageNet-pretrained backbone", value: 1200, suffix: "K images", icon: Image, color: "text-blue-500" },
  { label: "Object classes in that pretraining task", value: 1000, suffix: " classes", icon: Layers, color: "text-purple-500" },
  { label: "Learning rate kept for each earlier layer group, ULMFiT's 1 over 2.6 rule", value: 38, suffix: "%", icon: Percent, color: "text-emerald-500" },
];

export const transferLearningFineTuning: BlogPostData = {
  title: "Transfer Learning and Fine-Tuning",
  date: "August 2, 2026",
  slug: "transfer-learning-fine-tuning",
  content: (
    <>
      <Paragraph delay={0.1}>
        Train an image classifier from scratch on a thousand photos of birds, twenty species, fifty photos each, and it does poorly. That's nowhere near enough data for a network with millions of parameters to learn what actually separates a warbler from a wren, so it ends up half memorizing the training set and guessing badly on anything new. Take the exact same architecture, but start its weights from a network that's already been trained on millions of unrelated photos, what's called a <strong>pretrained</strong> network, and the same thousand bird photos are suddenly enough to get real accuracy. Nothing about the birds changed. What changed is that the network never had to learn what an edge, a texture, or a feather pattern looks like from zero, it already knew, and training only had to teach it the last, much smaller step, which pattern of edges and textures means "warbler" instead of "wren."
      </Paragraph>

      <Paragraph delay={0.15}>
        That's the whole idea behind transfer learning, reusing a model already trained on one problem as the starting point for a different, usually smaller, problem, instead of starting from randomly initialized weights every time. Fine-tuning is the general name for however that reuse actually happens, anywhere on a spectrum from barely touching the pretrained network to retraining almost all of it. Where a given problem should sit on that spectrum, and what can go wrong at either end, is the rest of this post.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        What a pretrained network is actually made of
      </Heading>

      <Paragraph delay={0.25}>
        A trained neural network is really two things stacked on top of each other, even though it usually gets described as one model. The <strong>backbone</strong> is everything before the last layer or two, the long stack of layers that takes a raw input, a grid of pixels, and gradually turns it into a compact vector of features. The <strong>head</strong> is that last layer or two, the part that takes the backbone's features and turns them into whatever the original task actually asked for, a probability over a thousand ImageNet classes, say. Almost all of the network's parameters, and almost all of the compute it took to train it, live in the backbone. The head is comparatively tiny.
      </Paragraph>

      <Paragraph delay={0.3}>
        The reason a backbone transfers to a new task at all comes down to what different layers end up learning. The earliest layers of an image backbone learn to detect edges, corners, and simple color gradients, patterns generic enough to show up in nearly every photo of anything. Layers a bit deeper combine those into textures and small parts, fur, feathers, wood grain. Only the last few layers assemble those parts into representations specific to the exact classes the network was originally trained to sort photos into. Swap the task and the earliest layers barely need to change. A network trained to spot dogs and one trained to spot birds should agree almost completely on what an edge looks like.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Feature extraction, freezing the backbone
      </Heading>

      <Paragraph delay={0.4}>
        The simplest way to reuse a backbone is called <strong>feature extraction</strong>. Take the pretrained backbone, throw away the original head, and attach a brand new head shaped for the new task, twenty bird species instead of a thousand generic classes. Then train only the new head and leave the backbone exactly as it was. A layer with <strong>frozen</strong> weights simply has its gradient updates disabled, backpropagation still computes what the gradient would be, but the optimizer never applies it, so the layer's weights stay bit for bit what they were after pretraining. The new head is the opposite, <strong>trainable</strong>, its weights update on every step like an ordinary network being trained from scratch.
      </Paragraph>

      <Paragraph delay={0.45}>
        Freezing the backbone this way is cheap in every sense that matters. There are far fewer trainable parameters, so training runs faster and needs far less data to avoid overfitting. A frozen backbone also can't memorize noise in a tiny dataset the way an unfrozen one could, so it acts a little like regularization, for free. It's often the very first thing worth trying with a new pretrained model, precisely because it's a small, fast experiment to run before committing to anything more expensive.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.06}
        height={280}
        nodes={frozenTrainableNodes}
        edges={frozenTrainableEdges}
        caption="Feature extraction. The pretrained backbone stays frozen end to end, only the new head is trainable."
      />

      <Heading level={2} delay={0.5}>
        Full fine-tuning and why layers stay frozen selectively
      </Heading>

      <Paragraph delay={0.55}>
        Feature extraction is one extreme of a spectrum, freeze the entire backbone and train only the head. The other extreme is full fine-tuning, unfreeze every layer, backbone included, and update all of it with backpropagation the same way the original network was trained. In between sits the more common real-world choice, unfreeze some of the backbone, usually the later layers closest to the head, and leave the earliest layers frozen. Later layers hold more task-specific features, so they benefit the most from adapting, while the earliest layers' generic edge and texture detectors rarely need to change no matter what the new task is.
      </Paragraph>

      <Heading level={2} delay={0.6}>
        Gradual unfreezing
      </Heading>

      <Paragraph delay={0.65}>
        Unfreezing a large backbone all at once, right from the start of fine-tuning, risks a specific failure. Gradient updates computed from a randomly initialized, still-useless head propagate straight back into the pretrained backbone, and those early, noisy updates can damage carefully learned features before the head has learned anything worth protecting them for. <strong>Gradual unfreezing</strong> avoids that by unlocking the network in stages instead of all at once.
      </Paragraph>

      <Paragraph delay={0.7}>
        Training starts with everything frozen except the new head. Once the head has learned something reasonable, the layer group closest to it unfreezes and joins training. After more training, the next group down unfreezes, and so on, working backward through the network one group at a time until every layer is trainable. The technique was introduced for fine-tuning language models in the ULMFiT paper, and the same idea now shows up across vision and language fine-tuning alike, whenever a pretrained network is large enough that unfreezing everything at once feels risky.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.07}
        height={340}
        nodes={unfreezeNodes}
        edges={unfreezeEdges}
        phases={unfreezePhases}
        caption="Gradual unfreezing. Unfreezing moves backward through the network, one layer group at a time, instead of exposing every layer to gradient updates at once."
      />

      <Heading level={2} delay={0.75}>
        Discriminative learning rates
      </Heading>

      <Paragraph delay={0.8}>
        Gradual unfreezing controls when a layer starts training. <strong>Discriminative learning rates</strong> control how fast it trains once it does, by giving different layer groups different learning rates instead of one single rate for the whole network. The intuition is the same one behind gradual unfreezing. Later layers need bigger updates to adapt to the new task, earlier layers hold general features worth changing only a little, so they get a smaller learning rate. ULMFiT's original rule picks a learning rate for the last layer group first, then divides it by a fixed ratio for every layer group further back.
      </Paragraph>

      <Formula block delay={0.85}>
        {`\\eta_{l-1} = \\frac{\\eta_l}{2.6}`}
      </Formula>

      <Paragraph delay={0.9}>
        That rule says whatever learning rate the layer closest to the head gets, the layer group just before it gets less than half of that, and the group before that gets less than half again. By the time the rule reaches the earliest layers, their effective learning rate is a small fraction of the head's, matching the intuition that those layers should barely move.
      </Paragraph>

      <StatTiles items={scaleStats} delay={0.08} />

      <Heading level={2} delay={0.95}>
        Domain shift
      </Heading>

      <Paragraph delay={1.0}>
        Everything so far assumes the new task's inputs look reasonably similar to whatever the backbone was originally trained on. That assumption can fail, and when it does, the gap has a name, <strong>domain shift</strong>, the difference between the data a model was trained on and the data it's actually being asked to work on now. A backbone pretrained on everyday photos has learned edge and texture detectors tuned to natural lighting, color, and object shapes. Point that same backbone at chest X-rays or satellite imagery, and the low-level statistics it expects, typical contrast, color distribution, what an edge even looks like, are different enough that some of what it learned stops being useful.
      </Paragraph>

      <Paragraph delay={1.05}>
        The bigger the domain shift, the less feature extraction alone tends to help, because the whole appeal of freezing the backbone rests on its early features already being useful for the new inputs. A large domain shift usually means unfreezing more of the backbone, using a smaller learning rate even on the parts that do unfreeze, and, in genuinely different domains, medical imaging, satellite data, audio spectrograms, sometimes accepting that a backbone pretrained on natural photos is a mediocre starting point no matter how it's fine-tuned.
      </Paragraph>

      <Heading level={2} delay={1.1}>
        Catastrophic forgetting
      </Heading>

      <Paragraph delay={1.15}>
        Fine-tuning on a new task changes shared weights, and those same weights are what used to make the network good at whatever it originally learned. Push the update too far, for too many steps, with too high a learning rate, and the network's performance on the original task quietly collapses while it gets better at the new one. That failure mode is called <strong>catastrophic forgetting</strong>, and it isn't a rare edge case, it's the default outcome of fine-tuning with no precautions taken against it.
      </Paragraph>

      <Paragraph delay={1.2}>
        Nothing in an ordinary fine-tuning loss protects the old task. Gradient descent only ever asks whether an update makes the current loss lower, and the current loss only measures performance on whatever data is actually in the training batch, the new task's data. There's no term anywhere in that objective that accounts for the old task at all, so if the old task isn't represented in training, forgetting isn't an edge case. It's what the optimizer is directly pushed toward.
      </Paragraph>

      <CatastrophicForgettingDiagram
        delay={0.09}
        caption="Task A's accuracy falls while task B's climbs, over the same fine-tuning steps, because nothing in the objective protects the old task while the new one improves."
      />

      <Paragraph delay={1.25}>
        The usual defenses are exactly the tools already on the table. Freezing more of the backbone leaves fewer weights free to drift. A lower learning rate slows whatever drift does happen. Gradual unfreezing exposes only a small part of the network to large updates at any one time. Occasionally mixing a slice of the original task's data back into training gives the loss some reason to protect it. None of these make forgetting impossible, they just slow it down enough that it stays a minor cost instead of erasing the reason the pretrained backbone was worth reusing in the first place.
      </Paragraph>

      <Heading level={2} delay={1.3}>
        Why small-data regimes are where transfer learning earns its keep
      </Heading>

      <Paragraph delay={1.35}>
        A model trained from scratch needs enough labeled examples to pin down every one of its parameters from nothing. A convolutional backbone with tens of millions of parameters, trained on a thousand images, doesn't have enough data to do that reliably, most of what it appears to learn ends up being memorized noise instead of a real pattern, the same overfitting problem that makes regularization necessary in the first place. Starting from pretrained weights sidesteps most of that. The backbone's early and middle layers already encode general-purpose structure, learned from a dataset that was almost certainly far bigger than whatever's available for the new task. Fine-tuning only has to adjust a comparatively small number of degrees of freedom, the head and maybe a few unfrozen layer groups, so it needs far less labeled data to reach a similar result. A small labeled dataset, on a task related closely enough to what the backbone already knows, is exactly the regime where transfer learning beats training from scratch by the widest margin.
      </Paragraph>

      <Heading level={2} delay={1.4}>
        When training from scratch actually wins
      </Heading>

      <Paragraph delay={1.45}>
        None of this makes pretraining automatically the right call. Training from scratch wins when the target dataset is large enough on its own that a model can learn every feature it needs directly from the task's own data, without borrowing from an unrelated one. At that point a pretrained backbone's built-in biases, whatever came baked in from its original training data, can cost more than they save. Training from scratch also wins when domain shift is severe enough that a pretrained backbone's early features simply don't transfer, a model built for tabular sensor data or genomic sequences usually has no equivalent natural-image backbone worth reusing. And it wins on plain architecture mismatch. If the new task needs a fundamentally different input shape or model structure than whatever backbones happen to exist pretrained, there may be nothing sensible to transfer from at all. The decision isn't always fine-tune, it's checking whether a pretrained backbone's assumptions plausibly hold for the new data before betting on it.
      </Paragraph>

      <Heading level={2} delay={1.5}>
        Takeaways
      </Heading>

      <List delay={1.55}>
        <ListItem>Feature extraction freezes the entire pretrained backbone and trains only a new head, cheap and often the right first thing to try.</ListItem>
        <ListItem>Gradual unfreezing and discriminative learning rates both protect the backbone's general features early on, unfreezing later layers first and giving earlier layers smaller learning rates, ULMFiT's rule divides by 2.6 per layer group going backward.</ListItem>
        <ListItem>Domain shift measures how different the new task's data looks from the data a backbone was pretrained on, and the bigger that gap, the less feature extraction alone can help.</ListItem>
        <ListItem>Catastrophic forgetting is the default outcome of unprotected fine-tuning, nothing in an ordinary training loss protects the original task, so the old capability erodes while the new one improves.</ListItem>
        <ListItem>Transfer learning wins by the widest margin in small-data regimes, training from scratch wins once the target dataset is big enough, the domain shift is too large, or no reasonable pretrained backbone exists for the task's input shape.</ListItem>
      </List>

      <Paragraph delay={1.6}>
        Every technique above is really one question asked in slightly different ways, how much of what a network already knows is worth keeping, and how carefully should the rest be allowed to change. Feature extraction answers "none of it," full fine-tuning answers "all of it can," and gradual unfreezing, discriminative learning rates, and forgetting-aware training all live in between, trying to get the benefit of both without paying for either extreme. Getting that balance right is usually a matter of trying the cheap option first and only reaching for the more careful, more expensive one once the data says it's needed. Thanks for reading.
      </Paragraph>
    </>
  ),
};
