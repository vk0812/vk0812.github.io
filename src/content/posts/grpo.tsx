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
  ReplicationDiagram,
} from "../components";
import { GroupAdvantageDiagram } from "../components/animations/grpo/ConceptViz";
import { Dice5, Target, Scale, RefreshCw } from "lucide-react";

const loopNodes: DiagramNode[] = [
  { id: "sample", label: "Sample a group", sub: "G completions per prompt", icon: Dice5, color: "text-blue-500", x: 15, y: 50 },
  { id: "reward", label: "Compute rewards", sub: "rule-based scoring", icon: Target, color: "text-indigo-500", x: 38, y: 50 },
  { id: "advantage", label: "Compute advantages", sub: "reward minus group mean", icon: Scale, color: "text-emerald-500", x: 62, y: 50 },
  { id: "update", label: "Update the policy", sub: "clipped objective + KL", icon: RefreshCw, color: "text-orange-500", x: 85, y: 50 },
];

const loopEdges: DiagramEdge[] = [
  { id: "e-sample-reward", from: "sample", to: "reward" },
  { id: "e-reward-advantage", from: "reward", to: "advantage" },
  { id: "e-advantage-update", from: "advantage", to: "update" },
];

const loopPhases: DiagramPhase[] = [
  { nodeIds: ["sample"], edgeIds: [], note: "Run the current policy G times on the same prompt, typically 4 to 16 completions." },
  { nodeIds: ["sample", "reward"], edgeIds: ["e-sample-reward"], note: "Score every completion with a rule-based reward function, no learned reward model needed." },
  { nodeIds: ["sample", "reward", "advantage"], edgeIds: ["e-sample-reward", "e-reward-advantage"], note: "Subtract the group's mean reward from each score, that difference is the advantage." },
  { nodeIds: ["sample", "reward", "advantage", "update"], edgeIds: ["e-sample-reward", "e-reward-advantage", "e-advantage-update"], note: "Apply the clipped policy update weighted by those advantages, then start the next prompt." },
];

export const grpoPost: BlogPostData = {
  title: "Group Relative Policy Optimization",
  date: "April 30, 2026",
  slug: "grpo",
  content: (
    <>
      <Paragraph delay={0.10}>
        If you've been following the reasoning model wave, you've seen GRPO mentioned in the same breath as DeepSeek-R1 and Qwen3. Both of those models used it to train their step-by-step reasoning capabilities, and both beat or matched much larger models on math and logic benchmarks. The technique behind that improvement is Group Relative Policy Optimization, and it's simpler than the name suggests.
      </Paragraph>

      <Paragraph delay={0.15}>
        The core idea is this: instead of asking "how good was this answer in absolute terms," GRPO asks "how good was this answer compared to the other answers the model gave to the same question?" That relative comparison is surprisingly powerful, and it lets you skip an entire network that PPO requires.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        The big idea
      </Heading>

      <Paragraph delay={0.25}>
        To understand why GRPO is interesting, you need to know the one thing it removes. In PPO (Proximal Policy Optimization), training requires two networks: the policy model (the one you're actually training) and a critic, also called a value network. The critic's job is to estimate a baseline, a prediction of how much reward you'd expect from a given state. Without a baseline, your gradient signal is too noisy to learn from. The problem is that the critic is usually the same size as the policy, which means you're paying double in memory and compute.
      </Paragraph>

      <Paragraph delay={0.30}>
        GRPO's insight is that you don't need a separate network for the baseline. If you sample <Formula>{`G`}</Formula> responses to the same prompt, the mean reward across that group <em>is</em> the baseline. Answers that beat the group average get a positive advantage, answers that fall below get a negative one. That's it. No critic, no extra parameters, no separate forward pass.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        A simple example
      </Heading>

      <Paragraph delay={0.40}>
        Ask the model "What is 7 × 6?" four times. You get back four answers: 42, 43, 40, 41. Apply a rule-based reward function (1 if correct, 0 if wrong) and you get rewards <Formula>{`[1.0,\\ 0.0,\\ 0.0,\\ 0.0]`}</Formula>. The mean reward is 0.25. Without any critic, you already know that the one correct answer (42) is well above the group average and the three wrong answers (43, 40, 41) are below it. The group itself gave you the signal.
      </Paragraph>

      <GroupAdvantageDiagram
        delay={0.08}
        caption="The 7 x 6 example end to end. Rewards [1, 0, 0, 0] produce a group mean of 0.25, and each completion's advantage is just its reward minus that mean."
      />

      <Paragraph delay={0.45}>
        The key word there is <em>relative</em>. GRPO does not care about the absolute value of any reward. It only cares about how each answer compares to the rest of the group. That makes it robust to reward scale and easy to apply wherever you can define a scoring function.
      </Paragraph>

      <Heading level={2} delay={0.50}>
        Step-by-step mechanics
      </Heading>

      <Paragraph delay={0.55}>
        Four steps happen every training iteration:
      </Paragraph>

      <List ordered delay={0.60}>
        <ListItem><strong>Sample a group.</strong> For each prompt in the batch, run the current policy <Formula>{`G`}</Formula> times to generate <Formula>{`G`}</Formula> independent completions. Typical values for <Formula>{`G`}</Formula> are 4 to 16.</ListItem>
        <ListItem><strong>Compute rewards.</strong> Score each completion with a rule-based reward function. For math tasks this is just "did you get the right answer." For code it might be "did the tests pass." No learned reward model needed.</ListItem>
        <ListItem><strong>Compute advantages.</strong> Subtract the group mean from each reward: <Formula>{`\\hat{A}_i = r_i - \\mu_r`}</Formula>, where <Formula>{`\\mu_r`}</Formula> is the mean reward across the group. This is what GRPO does in its original form. In practice many implementations also divide by the group standard deviation for scale stability.</ListItem>
        <ListItem><strong>Update the policy.</strong> Apply a clipped surrogate gradient (same clipping mechanism as PPO) weighted by the advantages. Add a KL penalty to keep the updated policy close to the reference model.</ListItem>
      </List>

      <IconArchitectureDiagram
        delay={0.08}
        height={320}
        nodes={loopNodes}
        edges={loopEdges}
        phases={loopPhases}
        caption="The four-step GRPO loop. Sampling and rewards happen during rollout, the advantage and update steps happen during the gradient update."
      />

      <Heading level={2} delay={0.65}>
        The objective
      </Heading>

      <Paragraph delay={0.70}>
        The full GRPO objective is:
      </Paragraph>

      <Formula block delay={0.75}>
        {`J_{\\text{GRPO}}(\\theta) = \\frac{1}{G} \\sum_{i=1}^{G} \\left[ \\min\\!\\left( \\frac{\\pi_\\theta(a_i|s)}{\\pi_{\\theta_{\\text{old}}}(a_i|s)} \\hat{A}_i,\\ \\operatorname{clip}\\!\\left( \\frac{\\pi_\\theta(a_i|s)}{\\pi_{\\theta_{\\text{old}}}(a_i|s)}, 1-\\varepsilon, 1+\\varepsilon \\right) \\hat{A}_i \\right) \\right] - \\beta \\cdot D_{\\text{KL}}[\\pi_\\theta \\| \\pi_{\\text{ref}}]`}
      </Formula>

      <Paragraph delay={0.80}>
        That looks dense, so let's take it apart term by term:
      </Paragraph>

      <List delay={0.85}>
        <ListItem><strong>Probability ratio.</strong> <Formula>{`\\pi_\\theta(a_i|s) / \\pi_{\\theta_{\\text{old}}}(a_i|s)`}</Formula> is how much more (or less) likely the updated policy is to produce answer <Formula>{`a_i`}</Formula> compared to the old policy. If this ratio is greater than 1, the policy moved toward that answer. Less than 1, it moved away.</ListItem>
        <ListItem><strong>Clipping.</strong> The <InlineCode>clip(..., 1-ε, 1+ε)</InlineCode> term prevents the policy from changing too aggressively in a single step. This is the same stability trick PPO uses, with <Formula>{`\\varepsilon`}</Formula> typically set to 0.2.</ListItem>
        <ListItem><strong>Advantage.</strong> <Formula>{`\\hat{A}_i`}</Formula> is the normalized reward for answer <Formula>{`i`}</Formula> within its group. Positive means it was above average, negative means below.</ListItem>
        <ListItem><strong>KL penalty.</strong> <Formula>{`\\beta \\cdot D_{\\text{KL}}[\\pi_\\theta \\| \\pi_{\\text{ref}}]`}</Formula> pulls the trained policy back toward the original reference model to prevent reward hacking or degenerate outputs. <Formula>{`\\beta`}</Formula> is a small coefficient, usually around 0.01 to 0.1.</ListItem>
      </List>

      <Heading level={2} delay={0.90}>
        Numerical walkthrough
      </Heading>

      <Paragraph delay={0.95}>
        Back to the 7 × 6 example with <Formula>{`G = 4`}</Formula>. Answers 42, 43, 40, 41 produce rewards <Formula>{`[1.0,\\ 0.0,\\ 0.0,\\ 0.0]`}</Formula>. The group mean is 0.25. GRPO subtracts that mean from each reward to get the advantages:
      </Paragraph>

      <CodeBlock
        delay={1.00}
        language="Python"
        code={`import torch

rewards = torch.tensor([1.0, 0.0, 0.0, 0.0])
advantages = rewards - rewards.mean()          # GRPO: mean-centering only
# tensor([ 0.7500, -0.2500, -0.2500, -0.2500])

# Many implementations also divide by std for scale stability:
# advantages = (rewards - rewards.mean()) / (rewards.std() + 1e-8)`}
      />

      <Paragraph delay={1.05}>
        Advantages <Formula>{`[+0.75,\\ -0.25,\\ -0.25,\\ -0.25]`}</Formula>. The optimizer now has a clear signal: increase the probability of generating "42" (the only correct answer) and decrease the probability of generating "43," "40," and "41." The asymmetry is natural here: with only one correct answer out of four, the correct response earns a larger positive shift (+0.75) than the negative pull each wrong answer receives (-0.25). The clipping makes sure neither adjustment is so large it destabilizes the model, and the KL term keeps the policy from drifting far from its reference checkpoint.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        The training step in code
      </Heading>

      <Paragraph delay={1.15}>
        Here's the full GRPO loss in PyTorch. The inputs are log-probabilities from the current policy, the old policy used to generate the rollouts, the pre-computed advantages, and log-probabilities from the frozen reference model for the KL term:
      </Paragraph>

      <CodeBlock
        delay={1.20}
        language="Python"
        code={`import torch

def grpo_loss(log_probs, old_log_probs, advantages, ref_log_probs, eps=0.2, beta=0.01):
    # Policy ratio in log space (numerically stable)
    ratio = torch.exp(log_probs - old_log_probs)

    # Clipped surrogate objective
    clipped = torch.clamp(ratio, 1 - eps, 1 + eps)
    policy_loss = -torch.min(ratio * advantages, clipped * advantages).mean()

    # KL penalty against reference policy (approximate, log-ratio form)
    kl = (old_log_probs - ref_log_probs).mean()

    return policy_loss + beta * kl`}
      />

      <Paragraph delay={1.25}>
        Ten lines of real work. Everything else in a GRPO training loop (sampling the group, running the reward function, computing advantages) is just data plumbing around this core.
      </Paragraph>

      <Heading level={2} delay={1.30}>
        GRPO vs PPO
      </Heading>

      <Paragraph delay={1.35}>
        Both algorithms use the same clipped surrogate objective. The difference is entirely in where the advantage comes from:
      </Paragraph>

      <List delay={1.40}>
        <ListItem><strong>No critic required.</strong> PPO maintains a value network (same size as the policy) to estimate per-state baselines. GRPO uses the group mean, so you only need the policy and the reference model.</ListItem>
        <ListItem><strong>More signal per prompt.</strong> Each prompt in a GRPO batch yields <Formula>{`G`}</Formula> training examples instead of 1. You extract more gradient information per forward pass.</ListItem>
        <ListItem><strong>Lower memory and compute.</strong> Dropping the critic cuts memory roughly in half during training. No critic forward pass, no critic backward pass, no critic optimizer state.</ListItem>
        <ListItem><strong>Works best with verifiable rewards.</strong> The group-relative baseline is clean when rewards are 0/1 or at least low-noise. If your reward function is a noisy learned model, the group mean becomes a noisier baseline, and the advantage estimates degrade.</ListItem>
        <ListItem><strong>The tradeoff.</strong> GRPO needs a reward function you can evaluate cheaply for every sample in the group. For tasks where evaluation itself is expensive (human feedback, long-horizon simulation), that multiplies the cost by <Formula>{`G`}</Formula>.</ListItem>
      </List>

      <ReplicationDiagram
        delay={0.08}
        panels={[
          {
            title: "PPO",
            writeLabel: "Policy network",
            fanLabel: "needs a baseline from",
            nodes: ["Critic (value network)", "Reference model"],
            highlightNodes: [0],
            note: "Same size as the policy, its own forward pass, backward pass, and optimizer state.",
          },
          {
            title: "GRPO",
            writeLabel: "Policy network",
            fanLabel: "needs a baseline from",
            nodes: ["Group mean reward", "Reference model"],
            highlightNodes: [0],
            note: "No extra network, the baseline falls out of sampling G completions per prompt.",
          },
        ]}
      />

      <Heading level={2} delay={1.45}>
        When GRPO shines
      </Heading>

      <Paragraph delay={1.50}>
        The algorithm is essentially tailor-made for tasks where correctness is binary and easy to check:
      </Paragraph>

      <List delay={1.55}>
        <ListItem><strong>Mathematical reasoning.</strong> DeepSeek-R1 and Qwen3 used GRPO here. The reward function is a symbolic math checker: did the final boxed answer match the ground truth? Simple, fast, reliable.</ListItem>
        <ListItem><strong>Code generation.</strong> Run a test suite on each sampled completion. Pass rate (or pass@1) becomes the reward. No annotation needed, the tests provide the signal.</ListItem>
        <ListItem><strong>Logical and structured reasoning.</strong> Anything with a verifiable answer, formal proofs, SQL queries, constraint satisfaction, fits this mold. Score mechanically, train relationally.</ListItem>
        <ListItem><strong>Any task with rule-based rewards.</strong> The pattern generalizes: if you can write a function that scores a completion without human input, GRPO can train on it. The simpler and faster the scoring function, the better.</ListItem>
      </List>

      <Heading level={2} delay={1.60}>
        Takeaways
      </Heading>

      <List delay={1.65}>
        <ListItem>GRPO replaces the PPO critic with a group-relative baseline, cutting memory and compute roughly in half during RL fine-tuning.</ListItem>
        <ListItem>The advantage signal is just normalized reward within the group. No learned value function, no bootstrapping.</ListItem>
        <ListItem>Clipping and the KL penalty keep training stable, the same intuitions as PPO apply directly.</ListItem>
        <ListItem>The algorithm is best suited for tasks with verifiable, rule-based rewards, math, code, and logic are natural fits.</ListItem>
      </List>
    </>
  ),
};
