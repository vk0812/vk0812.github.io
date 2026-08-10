import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  List,
  ListItem,
  StatTiles,
  IconArchitectureDiagram,
} from "../components";
import {
  FileInput,
  GraduationCap,
  Bot,
  Thermometer,
  Tag,
  Sigma,
  Layers,
  Shuffle,
  Ruler,
  TrendingDown,
  Target,
} from "lucide-react";
import { TemperatureReshapeDiagram } from "../components/animations/knowledge-distillation/ConceptViz";

export const knowledgeDistillation: BlogPostData = {
  title: "Knowledge Distillation",
  date: "August 5, 2026",
  slug: "knowledge-distillation",
  content: (
    <>
      <Paragraph delay={0.1}>
        Voice assistants that keep working with no signal, translation apps that run entirely on the phone, autocomplete that finishes a sentence before you do. All of these ship a model that had to get dramatically smaller without giving up much of the accuracy a bigger model reached first.
      </Paragraph>

      <Paragraph delay={0.15}>
        The usual way to get that small model isn't training it from scratch on the same labeled data and hoping for the best. It's training the small model to copy a bigger one that already works well. That's knowledge distillation, and the interesting part isn't the size difference. It's exactly what gets copied, and how much of the bigger model's judgment actually survives the transfer.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        Teacher and student
      </Heading>

      <Paragraph delay={0.25}>
        The bigger, already-trained model is called the <strong>teacher</strong>. Whatever new model gets trained to imitate it is called the <strong>student</strong>, and the student is almost always smaller, cheaper to run, or both. A teacher might be a large image classifier with hundreds of millions of parameters. A student built from that teacher might be a fraction of that size, small enough to run on a phone with no server round trip.
      </Paragraph>

      <Paragraph delay={0.3}>
        Training the student starts the normal way. Feed it labeled examples and use a loss function to correct its mistakes. Distillation adds one more ingredient. For every training example, the teacher also looks at it and produces its own full probability distribution across every class, not just its single best guess. That distribution is called a <strong>soft target</strong>, and it becomes part of what the student is trained to match, right alongside the real, hard label from the dataset.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.05}
        height={420}
        caption="The teacher stays frozen and only runs a forward pass, the student trains against the teacher's soft targets and the dataset's true labels at the same time."
        nodes={[
          { id: "input", label: "Training example", sub: "same input, both networks", icon: FileInput, color: "text-slate-500", x: 50, y: 10 },
          { id: "teacher", label: "Teacher network", sub: "large, frozen, already trained", icon: GraduationCap, color: "text-blue-500", x: 20, y: 35 },
          { id: "student", label: "Student network", sub: "small, being trained", icon: Bot, color: "text-purple-500", x: 80, y: 35 },
          { id: "softTargets", label: "Soft targets", sub: "softened probability distribution", icon: Thermometer, color: "text-amber-500", x: 20, y: 65 },
          { id: "trueLabels", label: "True labels", sub: "hard, one-hot", icon: Tag, color: "text-emerald-500", x: 80, y: 65 },
          { id: "loss", label: "Distillation loss", sub: "combines both signals", icon: Sigma, color: "text-rose-500", x: 50, y: 90 },
        ]}
        edges={[
          { id: "e1", from: "input", to: "teacher" },
          { id: "e2", from: "input", to: "student" },
          { id: "e3", from: "teacher", to: "softTargets" },
          { id: "e4", from: "softTargets", to: "loss" },
          { id: "e5", from: "trueLabels", to: "loss" },
          { id: "e6", from: "student", to: "loss", bidirectional: true },
        ]}
      />

      <Paragraph delay={0.35}>
        Both networks see the exact same input. The teacher's pass is pure inference, its weights are frozen and nothing about it changes during distillation. The student's pass is the one being trained, and its weights update every step based on how well it matches both targets at once.
      </Paragraph>

      <Heading level={2} delay={0.4}>
        Soft targets carry more than a label does
      </Heading>

      <Paragraph delay={0.45}>
        A hard label says exactly one thing, this image is a dog, full stop. Every other class gets a target probability of zero, so wolf counts as exactly as wrong as toaster. A well-trained teacher's soft target usually disagrees. It might put 89 percent on dog, but the remaining 11 percent won't be spread evenly across every other class. Wolf and fox, which actually resemble dogs in some photos, get noticeably more of that leftover probability than toaster does.
      </Paragraph>

      <Paragraph delay={0.5}>
        That structure hiding in the wrong-answer probabilities is sometimes called <strong>dark knowledge</strong>, the teacher's implicit sense of which mistakes are almost reasonable and which are absurd. A hard label can never express that, it only ever says right or wrong. Training a student against soft targets hands it a much richer signal to learn from, using the exact same training examples it would have used anyway.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        Temperature, turning confidence into information
      </Heading>

      <Paragraph delay={0.6}>
        There's a practical problem with soft targets straight out of a well-trained teacher. A confident model's softmax output is usually so sharp that the correct class gets a probability near 1 and everything else rounds down close to zero, which buries the useful structure right back in numbers too small to register in a loss. Temperature scaling fixes this by dividing every logit by a constant before the softmax runs.
      </Paragraph>

      <Formula block delay={0.65}>
        {`p_i(T) = \\frac{\\exp(z_i / T)}{\\sum_j \\exp(z_j / T)}`}
      </Formula>

      <Paragraph delay={0.7}>
        <Formula>{`T`}</Formula> is the temperature, a number picked before training, commonly somewhere between 1 and 20 depending on how sharp the teacher's raw predictions are, with <Formula>{`T = 1`}</Formula> giving back an ordinary softmax. A higher temperature divides every logit further toward zero before the exponential runs, so the differences between classes get compressed and the resulting distribution spreads out. The correct class still gets the most probability, but the runner-up classes stop rounding to zero and start carrying real, learnable signal.
      </Paragraph>

      <TemperatureReshapeDiagram
        delay={0.08}
        caption="Raising the temperature on the same five class scores, dog stays the top pick the whole way through, but wolf, fox, and cat pick up real probability mass that a temperature of 1 would round away."
      />

      <Paragraph delay={0.75}>
        Temperature is applied to both networks during distillation. The teacher's targets and the student's own predictions get divided by the same <Formula>{`T`}</Formula> before they're compared. Once the student finishes training and gets deployed, temperature goes back to 1, an ordinary softmax, since by then the student only needs to produce a normal, confident answer.
      </Paragraph>

      <Heading level={2} delay={0.8}>
        The distillation loss
      </Heading>

      <Paragraph delay={0.85}>
        Putting soft targets and temperature together gives the actual training objective. It's a weighted sum of two familiar pieces, a term scoring how well the student matches the teacher's soft target, and an ordinary loss against the real hard label.
      </Paragraph>

      <Formula block delay={0.9}>
        {`\\mathcal{L} = \\alpha \\, \\mathcal{L}_{CE}\\big(y, \\sigma(z_s)\\big) + (1-\\alpha)\\, T^2 \\, \\mathcal{L}_{KL}\\big(\\sigma(z_t / T), \\sigma(z_s / T)\\big)`}
      </Formula>

      <Paragraph delay={0.95}>
        <Formula>{`z_s`}</Formula> and <Formula>{`z_t`}</Formula> are the student and teacher logits, and <Formula>{`\\sigma`}</Formula> is the softmax function. KL divergence measures how far one probability distribution sits from another, it lands at zero exactly when the two distributions match, and grows the more they disagree. The cross-entropy term keeps pulling the student toward the real answer the way it always would, the KL term pulls it toward matching the teacher's full distribution, and <Formula>{`\\alpha`}</Formula> is a tuned hyperparameter that decides how much weight each one gets. The <Formula>{`T^2`}</Formula> factor isn't decorative either. Dividing logits by <Formula>{`T`}</Formula> before a softmax shrinks the gradients flowing back through it by roughly a factor of <Formula>{`T^2`}</Formula>, so without correcting for that, a high temperature would quietly shrink the KL term's contribution toward nothing. Multiplying back by <Formula>{`T^2`}</Formula> keeps the two loss terms on a comparable scale no matter what temperature gets picked.
      </Paragraph>

      <CodeBlock
        delay={1.0}
        language="Python"
        code={`import numpy as np

logits_teacher = np.array([4.6, 2.1, 1.0, 0.3, -1.0])  # dog, wolf, fox, cat, horse
classes = ["dog", "wolf", "fox", "cat", "horse"]

def softmax_t(z, T):
    z = z / T
    z = z - z.max()
    e = np.exp(z)
    return e / e.sum()

for T in [1, 4]:
    probs = softmax_t(logits_teacher, T)
    print(f"T={T}", dict(zip(classes, np.round(probs * 100, 1))))

# T=1 {'dog': 88.8, 'wolf': 7.3, 'fox': 2.4, 'cat': 1.2, 'horse': 0.3}
# T=4 {'dog': 39.5, 'wolf': 21.2, 'fox': 16.1, 'cat': 13.5, 'horse': 9.8}`}
      />

      <Paragraph delay={1.05}>
        Those numbers are the same five class scores the earlier figure animated. At <Formula>{`T = 1`}</Formula>, dog dominates so heavily that wolf, fox, cat, and horse are all rounding toward irrelevant. By <Formula>{`T = 4`}</Formula>, the runner-up classes have moved into a range a loss function can actually learn from, without dog ever losing its spot as the top pick.
      </Paragraph>

      <Heading level={2} delay={1.1}>
        Feature and relation distillation
      </Heading>

      <Paragraph delay={1.15}>
        Matching final output distributions is the classic version of distillation, but it isn't the only thing a student can copy. Feature distillation instead matches something inside the network, the activations at some intermediate hidden layer, rather than only the final prediction. The idea is that a teacher's internal representations, not just its final answer, encode something worth transferring.
      </Paragraph>

      <Paragraph delay={1.2}>
        The catch is that a teacher's hidden layer and a student's hidden layer usually aren't even the same size, since the student is smaller by design. A small learned linear projection maps the student's layer into the teacher's dimensionality first, and only then does a loss, often ordinary mean squared error, score how far apart the two representations sit.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.06}
        height={360}
        caption="The student's hidden layer gets projected into the teacher's dimensionality before the two representations are compared directly, since the two networks don't share a hidden size."
        nodes={[
          { id: "teacherLayer", label: "Teacher hidden layer", sub: "fixed dimensionality", icon: Layers, color: "text-blue-500", x: 25, y: 22 },
          { id: "studentLayer", label: "Student hidden layer", sub: "smaller dimensionality", icon: Layers, color: "text-purple-500", x: 75, y: 22 },
          { id: "projection", label: "Linear projection", sub: "matches dimensions", icon: Shuffle, color: "text-amber-500", x: 75, y: 58 },
          { id: "featureLoss", label: "Feature loss", sub: "e.g. mean squared error", icon: Ruler, color: "text-rose-500", x: 50, y: 90 },
        ]}
        edges={[
          { id: "f1", from: "teacherLayer", to: "featureLoss" },
          { id: "f2", from: "studentLayer", to: "projection" },
          { id: "f3", from: "projection", to: "featureLoss" },
        ]}
      />

      <Paragraph delay={1.25}>
        Relation distillation goes a step further and matches structure between examples rather than within one example. Instead of asking whether a single input's representation matches the teacher's, it asks whether the relationships between several inputs match, the relative distances between a batch of examples in the teacher's representation space compared to the same batch in the student's. A student that reproduces those relationships has learned something about how the teacher organizes its whole space, not just how it scores one input at a time.
      </Paragraph>

      <Heading level={2} delay={1.3}>
        Self-distillation
      </Heading>

      <Paragraph delay={1.35}>
        Distillation doesn't strictly need a smaller student at all. In self-distillation, the student shares the exact same architecture as the teacher, sometimes literally a later checkpoint of one network training against an earlier checkpoint of itself, or one branch of a network training against another branch inside the same forward pass. There's no compression happening here, so it looks like it shouldn't help.
      </Paragraph>

      <Paragraph delay={1.4}>
        It often helps anyway. Soft targets act as a smoothing signal on their own, independent of any size difference, nudging a network away from the same runaway overconfidence that ordinary cross-entropy tends to encourage. A network trained partly against its own past soft predictions, or against a sibling network's, tends to generalize a little better than one trained purely against hard labels, for much the same reason label smoothing helps without needing a second model at all.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Sequence-level distillation
      </Heading>

      <Paragraph delay={1.5}>
        Everything so far scores one prediction at a time, one class distribution per training example. Language generation, translation, and any other sequence model breaks that assumption, since the thing being predicted is a whole sequence of tokens, not a single class. Matching the teacher's soft target at every individual token position still works, and this is usually called token-level distillation, but it only ever tells the student what the teacher would have said next given the real, correct sequence so far. It never shows the student a sequence the student itself is likely to produce.
      </Paragraph>

      <Paragraph delay={1.55}>
        Sequence-level distillation takes a different approach. Instead of matching per-token distributions, it has the teacher generate whole output sequences on its own, then trains the student directly on those teacher-generated sequences as if they were an ordinary labeled dataset. The student ends up learning from full, coherent outputs the teacher actually produced, rather than from a token-by-token distribution it might never see cohere into something equally sensible.
      </Paragraph>

      <Heading level={2} delay={1.6}>
        Capacity gaps
      </Heading>

      <Paragraph delay={1.65}>
        Distillation isn't a guarantee that a smaller student will absorb everything a teacher can teach. When the teacher is far larger than the student, a mismatch known as the <strong>capacity gap</strong>, the student can end up performing worse than if it had just been trained on hard labels alone. A tiny student sometimes can't represent the teacher's sharper, more detailed soft targets at all, and spends its limited capacity chasing a target it structurally cannot reach.
      </Paragraph>

      <Paragraph delay={1.7}>
        One common fix is to distill in stages rather than in one big jump. An intermediate-sized model, sometimes called a <strong>teacher assistant</strong>, gets trained first from the original teacher, and the actual small student then learns from that intermediate model instead of straight from the original. Each individual hop across the size gap is smaller, which tends to transfer more of the original teacher's knowledge than one large hop would.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Measuring the compression-quality trade-off
      </Heading>

      <Paragraph delay={1.8}>
        None of this matters if there's no way to check whether a distilled student is actually worth deploying instead of the teacher. The numbers that matter are parameter count and inference speed on one side, and how much task performance the student actually kept on the other.
      </Paragraph>

      <StatTiles
        delay={0.07}
        items={[
          { label: "Teacher parameters (BERT-base)", value: 110, suffix: "M", icon: GraduationCap, color: "text-blue-500" },
          { label: "Student parameters (DistilBERT)", value: 66, suffix: "M", icon: Bot, color: "text-purple-500" },
          { label: "Size reduction", value: 40, suffix: "%", icon: TrendingDown, color: "text-emerald-500" },
          { label: "Language understanding kept", value: 97, suffix: "%", icon: Target, color: "text-amber-500" },
        ]}
      />

      <Paragraph delay={1.85}>
        <strong>DistilBERT</strong> is the textbook example, a compressed version of BERT trained with exactly this kind of distillation. It cuts BERT-base's parameter count by 40 percent, runs about 60 percent faster, and keeps roughly 97 percent of BERT's score on a standard language understanding benchmark. That last number is the entire point of measuring the trade-off in the first place. A compression ratio only means something once it's sitting next to how much accuracy it cost.
      </Paragraph>

      <Heading level={2} delay={1.9}>
        Takeaways
      </Heading>

      <List delay={1.95}>
        <ListItem>A teacher is a large, already-trained, frozen model, a student is the smaller model trained to imitate it, usually against both the teacher's soft targets and the dataset's real labels.</ListItem>
        <ListItem>Soft targets carry dark knowledge, structure hiding in the probabilities assigned to wrong classes, that a hard, one-hot label can never express.</ListItem>
        <ListItem>Temperature scaling divides logits before the softmax runs, spreading a sharp distribution out so the runner-up classes carry a learnable signal instead of rounding to zero.</ListItem>
        <ListItem>Distillation extends past matching output distributions. Feature distillation matches intermediate representations, relation distillation matches structure between examples, self-distillation gets a smoothing benefit with no size difference at all, and sequence-level distillation trains directly on a teacher's generated outputs.</ListItem>
        <ListItem>A student far smaller than its teacher can hit a capacity gap and underperform training on hard labels alone, and any distillation result only means something next to how much parameter count, speed, and accuracy it actually traded against each other.</ListItem>
      </List>

      <Paragraph delay={2.0}>
        Distillation is really just a bet that a bigger model's judgment is worth more than its raw label, once wrong answers get to carry a little structure of their own. Whether that bet pays off depends entirely on how the trade-off gets measured, not on how clever the transfer mechanism sounds on paper. Thanks for reading.
      </Paragraph>
    </>
  ),
};
