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
} from "../components";
import { MessageSquare, ThumbsUp, ThumbsDown, TrendingUp, TrendingDown, Scale } from "lucide-react";

const rewardNodes: DiagramNode[] = [
  { id: "prompt", label: "Prompt", icon: MessageSquare, color: "text-slate-500", x: 50, y: 12 },
  { id: "chosen", label: "Chosen response", sub: "preferred by the rater", icon: ThumbsUp, color: "text-emerald-500", x: 25, y: 40 },
  { id: "rejected", label: "Rejected response", sub: "dispreferred by the rater", icon: ThumbsDown, color: "text-rose-500", x: 75, y: 40 },
  { id: "reward-chosen", label: "Implicit reward", sub: "beta log(policy / reference)", icon: TrendingUp, color: "text-emerald-500", x: 25, y: 64 },
  { id: "reward-rejected", label: "Implicit reward", sub: "beta log(policy / reference)", icon: TrendingDown, color: "text-rose-500", x: 75, y: 64 },
  { id: "loss", label: "DPO loss", sub: "push the gap wider", icon: Scale, color: "text-orange-500", x: 50, y: 88 },
];

const rewardEdges: DiagramEdge[] = [
  { id: "e-prompt-chosen", from: "prompt", to: "chosen" },
  { id: "e-prompt-rejected", from: "prompt", to: "rejected" },
  { id: "e-chosen-reward", from: "chosen", to: "reward-chosen" },
  { id: "e-rejected-reward", from: "rejected", to: "reward-rejected" },
  { id: "e-reward-chosen-loss", from: "reward-chosen", to: "loss" },
  { id: "e-reward-rejected-loss", from: "reward-rejected", to: "loss" },
];

export const directPreferenceOptimization: BlogPostData = {
  title: "Direct Preference Optimization and Related Objectives",
  date: "August 11, 2026",
  slug: "direct-preference-optimization",
  content: (
    <>
      <Paragraph delay={0.10}>
        Every time a chatbot picks the careful, specific answer over the vague one, some training process taught it that specific beats vague. People usually describe this as "aligning the model with human preferences," which sounds abstract until you see the actual data behind it. Two people ask the same question, get two different draft answers out of the same model, and a rater, or another model standing in for one, just picks which answer they'd rather have gotten. No score, no explanation, just a pick. That's the entire raw material behind Direct Preference Optimization, DPO for short, a way of turning a pile of those side by side picks directly into a better model.
      </Paragraph>

      <Paragraph delay={0.15}>
        The part that made DPO worth naming is what it skips. A full reinforcement-learning pipeline needs a reward model trained first, then a policy that samples fresh responses, gets them scored by that reward model, and updates from there, round after round. DPO skips all of that. It takes the preference data and turns it into a loss function that looks almost like an ordinary supervised loss, something that slots into a training loop about as easily as a classifier would.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Preference pairs, the only data DPO needs
      </Heading>

      <Paragraph delay={0.25}>
        The data DPO trains on is called a preference pair, and it's simpler than it sounds. For a single prompt, someone, or something, generates two candidate responses, and a rater picks the one they like better. Call the picked one <strong>chosen</strong> and the other <strong>rejected</strong>. That's the entire label, an ordering between two responses, nothing more.
      </Paragraph>

      <List delay={0.30}>
        <ListItem><strong>Prompt.</strong> "My unit tests keep failing after I updated a dependency. What should I check first?"</ListItem>
        <ListItem><strong>Chosen response.</strong> Walks through checking the dependency's changelog for breaking changes, pinning the old version to confirm that's actually the cause, then reading the specific test failure message for a clue.</ListItem>
        <ListItem><strong>Rejected response.</strong> "Try reinstalling everything and see if that fixes it," with no specifics at all.</ListItem>
      </List>

      <Paragraph delay={0.35}>
        A full preference dataset is just a big pile of these triples, prompt, chosen, rejected. Nobody writes down why the chosen response is better, and nobody attaches a numeric score to either one. The comparison alone carries the training signal.
      </Paragraph>

      <Heading level={2} delay={0.40}>
        The reference policy, an anchor that never moves
      </Heading>

      <Paragraph delay={0.45}>
        Before training starts, DPO makes a copy of the model exactly as it is and freezes it. That frozen copy is the <strong>reference policy</strong>, usually written as pi-ref. It never gets updated during training, it just sits there as a fixed point of comparison. The model that actually learns, the policy being trained, starts as an identical copy of the reference, but its weights move with every step.
      </Paragraph>

      <Paragraph delay={0.50}>
        The reference matters because DPO isn't trying to make the chosen response absolutely probable and the rejected response absolutely improbable in some vacuum. It's trying to shift probability relative to what the model already did before training started. Without an anchor, nothing would stop training from wandering arbitrarily far from a model that could still write coherent sentences and follow instructions, things pretraining and earlier fine-tuning already taught it. The reference is what keeps the comparison honest.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        DPO's core intuition
      </Heading>

      <Paragraph delay={0.60}>
        Picture the model as producing a probability for every possible response to a prompt, spread thin across every string of tokens it could ever write. Training doesn't need to touch that entire distribution. It only needs to nudge two specific points on it, raise the probability assigned to the chosen response, lower the probability assigned to the rejected one, and do both relative to what the frozen reference would have assigned those same two responses.
      </Paragraph>

      <Paragraph delay={0.65}>
        Do that consistently across a whole preference dataset, and the model picks up the general pattern that separates preferred responses from rejected ones, rather than just memorizing the specific pairs it happened to train on. That's the whole intuition. Everything else in this post is just making that idea precise enough to write as a loss function.
      </Paragraph>

      <Heading level={2} delay={0.70}>
        Implicit rewards, the key insight
      </Heading>

      <Paragraph delay={0.75}>
        In a full reinforcement-learning setup, a reward model has to be trained separately. It looks at a prompt and a response and outputs a scalar score, standing in for human preference. DPO's key insight is that once a reference policy is fixed, a reward function is already implicit in the policy itself. Nobody has to train a separate one.
      </Paragraph>

      <Formula block delay={0.80}>
        {`r(x, y) = \\beta \\log \\frac{\\pi_{\\theta}(y \\mid x)}{\\pi_{\\text{ref}}(y \\mid x)}`}
      </Formula>

      <Paragraph delay={0.85}>
        Read this in plain language. <Formula>{`r(x, y)`}</Formula> is the implicit reward that response <Formula>{`y`}</Formula> gets for prompt <Formula>{`x`}</Formula>. The ratio inside the log compares how likely the trained policy <Formula>{`\\pi_\\theta`}</Formula> is to produce <Formula>{`y`}</Formula> against how likely the frozen reference <Formula>{`\\pi_{\\text{ref}}`}</Formula> was to produce that exact same <Formula>{`y`}</Formula>. If training has made <Formula>{`y`}</Formula> more likely than the reference thought it was, the ratio is greater than one, the log is positive, and the implicit reward is positive. If training moved probability away from <Formula>{`y`}</Formula> compared to the reference, the reward is negative. Beta scales how large that reward reads out, more on that shortly. Nothing here needed a separately trained scoring model, the policy, compared against its own frozen starting point, already tells the whole story.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={460}
        nodes={rewardNodes}
        edges={rewardEdges}
        caption="Each response gets its own implicit reward straight from the policy's probability relative to the reference, then the loss pulls the chosen response's reward up and the rejected response's reward down."
      />

      <Heading level={2} delay={0.90}>
        The DPO loss, term by term
      </Heading>

      <Paragraph delay={0.95}>
        The loss puts that implicit reward to work directly. Instead of maximizing the chosen response's reward and minimizing the rejected one's separately, DPO looks at the gap between the two rewards and turns that gap into a probability that the chosen response really was the better one.
      </Paragraph>

      <Formula block delay={1.00}>
        {`\\mathcal{L}_{\\text{DPO}}(\\theta) = -\\mathbb{E}_{(x, y_w, y_l)} \\left[ \\log \\sigma\\!\\left( \\beta \\log \\frac{\\pi_{\\theta}(y_w \\mid x)}{\\pi_{\\text{ref}}(y_w \\mid x)} - \\beta \\log \\frac{\\pi_{\\theta}(y_l \\mid x)}{\\pi_{\\text{ref}}(y_l \\mid x)} \\right) \\right]`}
      </Formula>

      <List delay={1.05}>
        <ListItem><strong>x, y_w, y_l.</strong> A single training triple, the prompt, the chosen ("winning") response, and the rejected ("losing") response.</ListItem>
        <ListItem><strong>The two log-ratio terms.</strong> Each one is exactly the implicit reward from above, one computed for the chosen response, one for the rejected response.</ListItem>
        <ListItem><strong>The subtraction.</strong> Chosen response's implicit reward minus rejected response's implicit reward. This margin is the only thing the loss actually cares about.</ListItem>
        <ListItem><strong>Sigma.</strong> The logistic sigmoid function. It turns that margin into a number between 0 and 1, read as how confident the model currently is that the chosen response deserved to win.</ListItem>
        <ListItem><strong>Log, negation, expectation.</strong> Ordinary binary cross-entropy sitting on top of that confidence score, the same shape of loss used to train any binary classifier. Minimizing it widens the margin, which raises the chosen response's implicit reward and lowers the rejected one's at the same time.</ListItem>
      </List>

      <Paragraph delay={1.10}>
        Restated plainly, DPO is logistic regression, except the two things being compared are computed straight from the policy's own probabilities, never from a separately trained scoring model.
      </Paragraph>

      <CodeBlock
        delay={1.15}
        language="Python"
        code={`import torch.nn.functional as F

def dpo_loss(logp_chosen, logp_rejected, logp_chosen_ref, logp_rejected_ref, beta=0.1):
    # implicit reward for each response: beta * log(policy / reference)
    reward_chosen = beta * (logp_chosen - logp_chosen_ref)
    reward_rejected = beta * (logp_rejected - logp_rejected_ref)

    # margin between the two implicit rewards
    margin = reward_chosen - reward_rejected
    return -F.logsigmoid(margin).mean()`}
      />

      <Paragraph delay={1.20}>
        Eight lines, and notably, no reward model, no sampling from the policy during training, no rollouts. <InlineCode>logp_chosen</InlineCode> and its counterpart are just log-probabilities the policy already assigns to two responses that already exist in the dataset, the same kind of number any language model produces when it scores a sequence it didn't generate itself.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        The beta hyperparameter, how far the leash extends
      </Heading>

      <Paragraph delay={1.30}>
        Beta is the one number in the whole loss a person actually has to pick, and it plays the role of a KL divergence penalty from a full RL setup (KL divergence is just a measure of how far one probability distribution has drifted from another), even with no explicit penalty term written anywhere in the DPO loss itself. A large beta keeps the trained policy tethered close to the reference, since the same probability shift produces a much bigger swing in the implicit reward, so the loss is satisfied with a smaller, more conservative move. A small beta loosens the leash, the loss now needs a much larger probability shift before the implicit reward gap looks convincing, which lets training wander further from the reference to get there.
      </Paragraph>

      <Paragraph delay={1.35}>
        Push beta very high and the loss barely tolerates any change at all. Push it toward zero and training will happily drift the policy far from the reference to keep widening the reward gap, with very little pulling it back. In practice, a beta somewhere around 0.1 to 0.5 tends to work well as a starting point, tight enough to keep the model coherent, loose enough to actually learn the preference.
      </Paragraph>

      <Heading level={2} delay={1.40}>
        Preference overfitting, a real failure mode
      </Heading>

      <Paragraph delay={1.45}>
        A small beta compounds with another problem, the training data itself. Preference datasets are usually a fraction of the size of the pretraining or instruction-tuning data that came before them, often thousands to a few hundred thousand pairs rather than billions of tokens. Nothing in the DPO loss stops training from continuing to widen the gap between chosen and rejected long after it already learned the useful, generalizable version of the pattern. Keep training on the same fixed set of pairs past that point, and the model starts memorizing the specific pairs instead of the general preference behind them.
      </Paragraph>

      <Paragraph delay={1.50}>
        One well documented version of this shows up as a length bias. If the chosen responses in a dataset happen to run a little longer than the rejected ones, even slightly and even without anyone intending it, DPO can end up learning "longer is better" as its shortcut, rather than whatever actually made those responses better. The model starts padding its answers, not because a longer answer serves the question better, but because it discovered that length correlates with a higher implicit reward under the pairs it trained on.
      </Paragraph>

      <Paragraph delay={1.55}>
        A subtler version is even stranger. On some datasets, continuing to train past the point of diminishing returns can push the probability of both the chosen and the rejected response down at the same time, just at different rates, instead of pushing the chosen one up the way you'd hope. The loss only cares about the relative gap between the two, not which direction either one moves individually, so nothing in the objective distinguishes a model that widened the gap by raising the chosen response's probability from one that mostly just lowered the rejected one's. Watching the loss curve alone doesn't tell the whole story, which is a good reason to check actual model outputs during training too.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        A family of related objectives
      </Heading>

      <Paragraph delay={1.65}>
        DPO's core move, turning a preference comparison into something shaped like ordinary cross-entropy, opened up a small family of variants. Each one changes a different piece of the recipe.
      </Paragraph>

      <List delay={1.70}>
        <ListItem><strong>KTO.</strong> Kahneman-Tversky Optimization drops the requirement that data come in matched pairs at all. Instead of "given these two responses, which is better," each training example is just one response labeled desirable or undesirable on its own, an easier signal to collect since a lot of real feedback, a thumbs up, a thumbs down, a user regenerating a response, never naturally comes as a pair. It borrows the shape of its loss from prospect theory, treating a drop in quality as more costly than an equivalent gain is beneficial, rather than treating gains and losses symmetrically the way DPO's plain log-ratio does.</ListItem>
        <ListItem><strong>ORPO.</strong> Odds Ratio Preference Optimization removes the reference policy from the picture entirely. It folds a preference penalty, based on the odds ratio between the chosen and rejected response's probabilities, directly into ordinary supervised fine-tuning, so there's no separate frozen copy of the model to keep around and no earlier fine-tuning stage to run before preference training starts. One stage, not two.</ListItem>
        <ListItem><strong>RLOO-style objectives.</strong> REINFORCE Leave-One-Out moves in the opposite direction from ORPO, back toward an actual reinforcement-learning loop, sampling several fresh responses per prompt from the live policy and scoring them with a reward model, rather than training entirely offline on a fixed set of pairs the way DPO does. What it drops is the separate learned critic network a full RL pipeline otherwise needs. Each sampled response uses the average reward of the other samples for that same prompt as its baseline, which turns out to be enough to stabilize training without fitting a whole second value network.</ListItem>
      </List>

      <Heading level={2} delay={1.75}>
        When this is simpler than a full RL pipeline, and when it isn't
      </Heading>

      <Paragraph delay={1.80}>
        DPO earns its popularity honestly for a specific case, an offline setting where a decent pile of preference pairs already exists or is cheap to collect, and where training entirely from a frozen reference is acceptable. No reward model to train and validate separately, no live sampling loop, no critic network, and a loss function that slots into a completely ordinary training script. That's a real reduction in moving parts, and a real reduction in the number of ways a training run can silently misbehave.
      </Paragraph>

      <Paragraph delay={1.85}>
        It gives some of that back in situations a purely offline method can't handle as well. If the model needs to keep improving against a moving target, ranking its own newest outputs rather than a fixed batch of pairs collected once and never revisited, an approach that actually samples from the live policy during training has an advantage DPO doesn't, it sees exactly what today's model produces, not what some earlier snapshot of it happened to produce when the preference data was collected. The overfitting behavior above is also a real cost worth weighing, alongside how large and how carefully curated the available preference dataset actually is, before assuming an offline method is automatically the easier and safer path.
      </Paragraph>

      <Heading level={2} delay={1.90}>
        Takeaways
      </Heading>

      <List delay={1.95}>
        <ListItem>Preference data for DPO is just triples, prompt, chosen response, rejected response, no numeric score and no separately trained reward model.</ListItem>
        <ListItem>A frozen reference policy is the anchor every comparison gets measured against. Without it, nothing stops the trained policy from drifting arbitrarily far from a model that still writes coherent text.</ListItem>
        <ListItem>The key insight is that a reward function is already implicit in the trained policy once it's compared against the reference, beta times the log-ratio of policy to reference is a reward model that never needed its own training run.</ListItem>
        <ListItem>Beta sets how tightly the trained policy is tethered to the reference, and too small a beta paired with a small or overused preference dataset is exactly when preference overfitting, length bias, or both responses' probabilities dropping together, tends to show up.</ListItem>
        <ListItem>KTO, ORPO, and RLOO-style objectives each relax a different assumption DPO makes, paired data, a frozen reference, or training fully offline, and choosing among them comes down to which of those assumptions is hardest to satisfy for a given project.</ListItem>
      </List>

      <Paragraph delay={2.00}>
        None of this needed a heavier machine than logistic regression bolted onto a frozen copy of the same model. That's most of why DPO caught on as fast as it did, not because the idea behind alignment changed, but because the mechanics of getting there got dramatically smaller. Thanks for reading.
      </Paragraph>
    </>
  ),
};
