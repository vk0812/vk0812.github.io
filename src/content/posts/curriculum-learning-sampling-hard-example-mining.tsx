import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  List,
  ListItem,
  StatTiles,
  StatItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
} from "../components";
import {
  Database,
  Activity,
  SlidersHorizontal,
  Shuffle,
  Layers,
  Globe,
  Code2,
  BookOpen,
  Blend,
  AlertTriangle,
} from "lucide-react";
import { CurriculumSlideDiagram } from "../components/animations/curriculum-learning-sampling-hard-example-mining/ConceptViz";

const samplerNodes: DiagramNode[] = [
  { id: "dataset", label: "Training set", icon: Database, color: "text-slate-500", x: 6, y: 50 },
  { id: "loss", label: "Loss history", sub: "per-example, last epoch", icon: Activity, color: "text-orange-600", x: 27, y: 50 },
  { id: "weights", label: "Priority weights", sub: "high loss, high weight", icon: SlidersHorizontal, color: "text-violet-500", x: 50, y: 50 },
  { id: "sampler", label: "Sampler", icon: Shuffle, color: "text-blue-600", x: 73, y: 50 },
  { id: "batch", label: "Mini-batch", sub: "loss-aware, not uniform", icon: Layers, color: "text-teal-500", x: 94, y: 50 },
];

const samplerEdges: DiagramEdge[] = [
  { id: "dataset-loss", from: "dataset", to: "loss" },
  { id: "loss-weights", from: "loss", to: "weights" },
  { id: "weights-sampler", from: "weights", to: "sampler" },
  { id: "sampler-batch", from: "sampler", to: "batch" },
];

const mixtureNodes: DiagramNode[] = [
  { id: "web", label: "Web text", sub: "60% of tokens", icon: Globe, color: "text-blue-600", x: 15, y: 15 },
  { id: "code", label: "Code", sub: "25% of tokens", icon: Code2, color: "text-emerald-600", x: 50, y: 15 },
  { id: "books", label: "Books", sub: "15% of tokens", icon: BookOpen, color: "text-amber-600", x: 85, y: 15 },
  { id: "mixer", label: "Mixing sampler", sub: "draws by target ratio", icon: Blend, color: "text-violet-500", x: 50, y: 55 },
  { id: "batch", label: "Mini-batch", icon: Layers, color: "text-teal-500", x: 50, y: 90 },
];

const mixtureEdges: DiagramEdge[] = [
  { id: "web-mixer", from: "web", to: "mixer" },
  { id: "code-mixer", from: "code", to: "mixer" },
  { id: "books-mixer", from: "books", to: "mixer" },
  { id: "mixer-batch", from: "mixer", to: "batch" },
];

const imbalanceStats: StatItem[] = [
  { label: "Training set", value: 1000000, suffix: "parts", icon: Database, color: "text-blue-600" },
  { label: "Defective parts, 0.5% of the set", value: 5000, icon: AlertTriangle, color: "text-orange-600" },
  { label: "Positives per random batch of 256", value: 1, suffix: "on average", icon: Shuffle, color: "text-slate-500" },
  { label: "Positives per class-balanced batch", value: 32, suffix: "of 256", icon: Layers, color: "text-teal-600" },
];

export const curriculumLearningSamplingHardExampleMining: BlogPostData = {
  title: "Curriculum Learning, Sampling, and Hard-Example Mining",
  date: "August 4, 2026",
  slug: "curriculum-learning-sampling-hard-example-mining",
  content: (
    <>
      <Paragraph delay={0.10}>
        Train an image classifier the ordinary way and every epoch just shuffles the whole dataset into a new random order. A crisp, well-lit photo of a golden retriever sits in the same queue as a blurry photo of a dog half-hidden behind a fence, and the training loop treats them as interchangeable. Nothing about gradient descent's default setup asks whether one example is easy or hard, or whether the model has already learned everything it can from a given example ten times over. It just draws the next mini-batch and moves on.
      </Paragraph>

      <Paragraph delay={0.15}>
        That default, treat every example as equally worth a look and equally often, is a choice, not a law of nature. It just happens to be the choice nobody thinks about, since uniform random sampling is the easiest thing to implement. Once training starts asking which examples the model actually needs to see, and when, sampling stops being a boring implementation detail and turns into one of the bigger levers on how well and how fast training goes.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Starting easy on purpose
      </Heading>

      <Paragraph delay={0.25}>
        A curriculum, borrowed straight from the word's everyday meaning, is a deliberate order to introduce material in. <strong>Curriculum learning</strong> applies the same idea to training. Instead of a random shuffle, show the model easy examples first, and only bring in harder ones once it's had some practice. It mirrors how people actually pick up a skill. Nobody hands a beginner violin student a concerto on day one, they start with open strings and scales.
      </Paragraph>

      <Paragraph delay={0.30}>
        The obvious question is what "easy" means for a given dataset, and it depends entirely on the task. For images, easy might mean a large, centered, well-lit subject. For language, it might mean a short sentence built from common words. For a dataset labeled by hand, easy might just mean high agreement between the annotators. Whatever the specific yardstick, curriculum learning needs some scalar difficulty score per example, even a rough one, to sort the dataset by.
      </Paragraph>

      <Paragraph delay={0.35}>
        A curriculum also needs a pacing function, a rule for how much of that sorted pool becomes available to sample from as training goes on.
      </Paragraph>

      <Formula block delay={0.40}>
        {`\\lambda(t) = \\min\\!\\left(1,\\ \\lambda_0 + (1 - \\lambda_0)\\frac{t}{T}\\right)`}
      </Formula>

      <Paragraph delay={0.45}>
        At step <Formula>{`t = 0`}</Formula>, only the easiest <Formula>{`\\lambda_0`}</Formula> fraction of the sorted dataset is eligible for sampling, say the easiest 20 percent. That eligible fraction grows linearly as training proceeds, until by step <Formula>{`T`}</Formula> every example, including the very hardest one, is fair game. Nothing about the model itself changes here, only the pool it's allowed to draw from.
      </Paragraph>

      <Paragraph delay={0.50}>
        There's a second flavor worth knowing, <strong>self-paced learning</strong>. Instead of fixing the difficulty schedule in advance, the model's own current loss decides what counts as easy enough right now. An example only enters the sampling pool once the model's loss on it drops below some threshold, and that threshold itself relaxes over training. A fixed curriculum is simpler to implement and easier to reason about. A self-paced one adapts to how training is actually going, at the cost of tracking a live loss for every example.
      </Paragraph>

      <CurriculumSlideDiagram
        delay={0.08}
        caption="The sampling window starts by covering only the easiest slice of the data and sweeps toward harder examples as training progresses. The motion itself is the curriculum."
      />

      <Heading level={2} delay={0.55}>
        Letting the loss pick the batch
      </Heading>

      <Paragraph delay={0.60}>
        A curriculum decides difficulty ahead of time and moves through it on a fixed or self-paced schedule. A more reactive approach skips the schedule entirely and just asks the model, live, which examples it's currently getting most wrong, then samples those more often. That's loss-aware sampling, weighting each example's chance of being drawn by how large its loss was the last time the model saw it.
      </Paragraph>

      <Paragraph delay={0.65}>
        This needs a name for "how a mini-batch actually gets assembled" once it's no longer a plain uniform draw, and that name is <strong>importance sampling</strong>. Instead of drawing an example with the usual uniform probability of one over the dataset size, importance sampling draws example <Formula>{`i`}</Formula> with some other probability <Formula>{`P(i)`}</Formula>, deliberately skewed toward whatever's most useful right now.
      </Paragraph>

      <Formula block delay={0.70}>
        {`P(i) = \\frac{p_i^{\\alpha}}{\\sum_{j} p_j^{\\alpha}}`}
      </Formula>

      <Paragraph delay={0.75}>
        Here <Formula>{`p_i`}</Formula> is a priority score for example <Formula>{`i`}</Formula>, most often its most recent loss, and <Formula>{`\\alpha`}</Formula> controls how sharply sampling favors high-priority examples. Setting <Formula>{`\\alpha = 0`}</Formula> makes every priority look equal and recovers plain uniform sampling. Setting <Formula>{`\\alpha = 1`}</Formula> samples in direct proportion to priority, so an example with twice the loss of another gets drawn roughly twice as often.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={samplerNodes}
        edges={samplerEdges}
        height={300}
        delay={0.06}
        caption="A loss-aware sampling pipeline. Recent per-example loss sets a priority, priority sets a sampling probability, and the resulting mini-batch is skewed toward whatever the model is currently getting wrong."
      />

      <Paragraph delay={0.80}>
        There's a catch that shows up the moment sampling gets skewed this way. High-loss examples now get pulled into more batches than a low-loss example does, which means their gradient contributes to more updates overall. Left alone, that quietly changes what the optimizer is actually minimizing, which is its own problem covered further down. Importance sampling usually comes paired with a correction weight meant to cancel that skew back out.
      </Paragraph>

      <Formula block delay={0.85}>
        {`w_i = \\left(\\frac{1}{N \\cdot P(i)}\\right)^{\\beta}`}
      </Formula>

      <Paragraph delay={0.90}>
        With <Formula>{`N`}</Formula> the dataset size and <Formula>{`\\beta`}</Formula> a knob between zero and one, <Formula>{`\\beta = 0`}</Formula> applies no correction at all, and <Formula>{`\\beta = 1`}</Formula> applies the full correction needed to keep the update unbiased. In practice <Formula>{`w_i`}</Formula> gets normalized by the largest weight in the batch before it multiplies into that example's loss term, purely to keep the numbers from blowing up.
      </Paragraph>

      <Paragraph delay={0.95}>
        This exact pair, a priority-based sampling probability plus an importance weight that corrects for it, is the mechanism prioritized experience replay uses in reinforcement learning. The version here is the same idea applied to any supervised loss instead of one specific reinforcement-learning error signal.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        Sampling from the past, not just the present
      </Heading>

      <Paragraph delay={1.05}>
        Everything above assumes training moves through a fixed, already-collected dataset. Some training setups don't work that way. In reinforcement learning, an agent generates its own experience by acting in an environment one step at a time, and each transition would normally be thrown away the moment it's used. A <strong>replay buffer</strong> is a fixed-size storage pool that keeps recent transitions around, so the model can train on the same experience more than once, and in a different order than it actually happened.
      </Paragraph>

      <Paragraph delay={1.10}>
        A plain replay buffer samples uniformly at random from whatever's currently stored, which already helps a great deal compared with training strictly on the live stream (that stream has its own problem, consecutive transitions are highly correlated, which a shuffled buffer breaks up). Prioritized experience replay layers the loss-aware sampling from the previous section on top of that same buffer. Transitions the model is currently predicting badly get replayed more often than ones it's already handling well.
      </Paragraph>

      <Paragraph delay={1.15}>
        Replay buffers show up outside reinforcement learning too, anywhere training data arrives as an ongoing stream rather than a fixed set collected up front. Continual learning systems keep a small buffer of old examples specifically so a model doesn't overwrite everything it learned about earlier tasks while picking up a new one, a failure mode known as <strong>catastrophic forgetting</strong>. Replaying a handful of old examples alongside new ones is one of the cheapest available defenses against it.
      </Paragraph>

      <Heading level={2} delay={1.20}>
        Hard positives and hard negatives
      </Heading>

      <Paragraph delay={1.25}>
        Loss-aware sampling asks how wrong the model currently is on an example in general. A closely related idea asks a narrower question that matters most for retrieval and matching tasks, which negative example is closest to fooling the model, and which positive example looks the least like a match. A <strong>hard negative</strong> is a wrong answer that's confusingly similar to the right one. A <strong>hard positive</strong> is a correct match that looks superficially different from what the model expects.
      </Paragraph>

      <Paragraph delay={1.30}>
        A face-verification example makes both concrete. A hard negative is two different people who happen to look alike, maybe siblings, whose photos end up sitting close together in the model's representation even though they're not the same identity. A hard positive is two genuine photos of the same person taken years apart, under different lighting, that a rushed glance might call two different people. Both are far more informative to train on than an easy negative (two obviously unrelated faces) or an easy positive (two nearly identical photos from the same shoot), simply because the model already gets those right without needing the gradient.
      </Paragraph>

      <Paragraph delay={1.35}>
        Mining hard negatives can happen online, inside a single mini-batch. In pull-together, push-apart contrastive training, every other example in the batch already stands in as a negative for a given anchor, and the ones with the highest similarity to that anchor (the ones closest to being mistaken for a match) contribute the most useful gradient anyway, with no extra bookkeeping required. Mining can also happen offline, periodically running the current model over a large candidate pool to find its worst mistakes and feeding those back into the next round of training. Offline mining can surface harder cases than a single batch is likely to contain, at the cost of an extra pass over the data every so often.
      </Paragraph>

      <Paragraph delay={1.40}>
        One thing worth watching for, an example that's too hard can hurt more than it helps. A "negative" that's actually mislabeled, or a comparison so extreme it's ambiguous even to a human, teaches the model the wrong lesson instead of a useful one. Most hard-negative mining setups deliberately reach for <strong>semi-hard</strong> examples, ones that are difficult but still correctly separable, rather than always grabbing the single worst case available.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Class-balanced batches
      </Heading>

      <Paragraph delay={1.50}>
        A different flavor of imbalance shows up when the classes themselves aren't represented equally in the data to begin with. <strong>Class imbalance</strong> means one label is far more common than another, fraud detection, rare disease diagnosis, and manufacturing defect detection are the usual examples, where the class that actually matters might be a small fraction of the whole dataset.
      </Paragraph>

      <Paragraph delay={1.55}>
        Train on that data with plain random sampling and most mini-batches barely contain any examples of the rare class at all, so the model gets very little signal about the thing that actually matters. Class-balanced batch construction fixes the sampling side of this directly, oversample the minority class and undersample the majority class so that every batch contains a fixed, much higher share of the rare label than the raw dataset would produce on its own.
      </Paragraph>

      <StatTiles items={imbalanceStats} delay={0.08} />

      <Paragraph delay={1.60}>
        Say a manufacturing line's dataset has one million labeled parts, and only about five thousand of them, half a percent, are defective. With plain uniform sampling, a batch of 256 parts contains, on average, only about one defective part. A class-balanced sampler that targets one defective part in every eight puts thirty-two defective parts in that same batch instead, giving the model far more to actually learn from per step.
      </Paragraph>

      <Heading level={2} delay={1.65}>
        Mixing data sources
      </Heading>

      <Paragraph delay={1.70}>
        Every mechanism above assumes one dataset. Large-scale training runs, especially for language models, usually pull from several sources at once, web text, code, books, forum discussions, each with its own scale and its own texture. A <strong>data mixture</strong> is the set of sampling ratios that decides how much of each source ends up in a given mini-batch.
      </Paragraph>

      <Paragraph delay={1.75}>
        Those ratios aren't automatic. A plain one-to-one mix of everything ends up dominated by whichever source is largest and easiest to collect, usually raw web text, since it dwarfs everything else in the pool by sheer volume. Getting the mixture right usually means deliberately over-sampling smaller, higher-quality sources, curated books, well-commented code, relative to their raw share of the available data, and treating the mixture ratios themselves as something to tune, the same way a learning rate or batch size gets tuned.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={mixtureNodes}
        edges={mixtureEdges}
        height={460}
        delay={0.06}
        caption="A mini-batch assembled from a mixture of sources. Each source feeds the mixer at its own target ratio, not at its raw share of the available data."
      />

      <Paragraph delay={1.80}>
        Mixtures and curricula aren't unrelated ideas. Some training runs deliberately shift their mixture ratios partway through, leaning on broad, easy-to-fit web text early and increasing the share of harder, denser sources like code or math later on. That's curriculum learning applied at the level of whole data sources instead of individual examples.
      </Paragraph>

      <Heading level={2} delay={1.85}>
        Sampling changes what you're actually optimizing
      </Heading>

      <Paragraph delay={1.90}>
        Every sampling trick above shares a consequence worth stating plainly. Once training stops drawing examples uniformly, it stops minimizing the loss it might look like it's minimizing. The textbook training objective is an expectation of the loss over the true data distribution.
      </Paragraph>

      <Formula block delay={1.95}>
        {`\\mathcal{L}(\\theta) = \\mathbb{E}_{x \\sim P_{\\text{data}}}\\bigl[\\ell(x, \\theta)\\bigr]`}
      </Formula>

      <Paragraph delay={2.00}>
        Uniform random sampling happens to be the one case where a drawn batch is already an honest stand-in for that expectation, since every example gets an equal shot at being picked, matching how often it actually shows up in the real distribution. Sample instead from some other distribution <Formula>{`q`}</Formula>, loss-aware, class-balanced, a chosen data mixture, and the batches drawn now estimate a different quantity entirely.
      </Paragraph>

      <Formula block delay={2.05}>
        {`\\mathbb{E}_{x \\sim q}\\bigl[\\ell(x, \\theta)\\bigr]`}
      </Formula>

      <Paragraph delay={2.10}>
        To recover the original objective while still sampling from <Formula>{`q`}</Formula>, each example's loss needs to be scaled by an importance weight equal to the ratio between the two distributions.
      </Paragraph>

      <Formula block delay={2.15}>
        {`w(x) = \\frac{P_{\\text{data}}(x)}{q(x)}`}
      </Formula>

      <Paragraph delay={2.20}>
        Skip that correction and the training run isn't secretly still optimizing the original objective with extra attention paid to the interesting spots. It's optimizing a genuinely different objective, one tilted to match <Formula>{`q`}</Formula> instead of the real world. A model trained on batches that are artificially half defective parts, with no reweighting applied, doesn't just get better at spotting defects. It also learns that roughly half of all parts are defective, which isn't true.
      </Paragraph>

      <Paragraph delay={2.25}>
        That's exactly why a classifier trained on class-balanced batches usually needs some correction afterward, either scaling its predicted probabilities back down by the ratio the batches were skewed by, or picking a decision threshold that accounts for the mismatch, before its raw outputs mean anything on real, imbalanced traffic. Loss-aware sampling carries the same issue underneath, which is exactly what the correction weight from the earlier section exists to fix. The lesson generalizes past any single technique here. Whenever the sampling distribution changes on purpose, it's worth asking whether the objective changed on purpose right along with it, or just changed as a side effect nobody accounted for.
      </Paragraph>

      <Heading level={2} delay={2.30}>
        Takeaways
      </Heading>

      <List delay={2.35}>
        <ListItem>Curriculum learning orders training examples from easy to hard on a schedule, either fixed in advance or self-paced by the model's own current loss.</ListItem>
        <ListItem>Loss-aware and importance sampling skew which examples get drawn toward whatever's currently informative, using a priority-based probability and a correction weight that keeps the estimate honest.</ListItem>
        <ListItem>Replay buffers let training revisit past examples instead of only the live stream, and prioritized replay is loss-aware sampling applied to that same buffer.</ListItem>
        <ListItem>Hard positive and hard negative mining targets the specific examples closest to fooling the model, online within a batch or offline across the whole dataset, while steering clear of examples so extreme they're mislabeled or ambiguous.</ListItem>
        <ListItem>Any time the sampling distribution changes on purpose, class-balanced batches, a data mixture, a loss-aware sampler, the learned objective changes right along with it unless an importance weight corrects for the skew.</ListItem>
      </List>

      <Paragraph delay={2.40}>
        Every technique here is really the same move. A random shuffle spends the model's limited attention identically everywhere, and pointing that attention somewhere more useful, toward the examples still worth learning from, gets more out of the same number of gradient steps. The one thing worth carrying forward is that sampling is never a neutral default. It's a choice about what the model ends up believing the world looks like, whether anyone made that choice on purpose or not. Thanks for reading.
      </Paragraph>
    </>
  ),
};
