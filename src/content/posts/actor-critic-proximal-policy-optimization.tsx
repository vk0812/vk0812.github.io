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
  ReplicationDiagram,
} from "../components";
import { CircleDot, Compass, Gauge, Scale, RefreshCw } from "lucide-react";

const actorCriticNodes: DiagramNode[] = [
  { id: "state", label: "State s_t", icon: CircleDot, color: "text-slate-500", x: 50, y: 10 },
  { id: "actor", label: "Actor network", sub: "policy pi_theta(a|s)", icon: Compass, color: "text-blue-500", x: 25, y: 38 },
  { id: "critic", label: "Critic network", sub: "value V(s)", icon: Gauge, color: "text-indigo-500", x: 75, y: 38 },
  { id: "advantage", label: "Advantage estimate", sub: "reward plus TD error", icon: Scale, color: "text-emerald-500", x: 50, y: 64 },
  { id: "update", label: "Clipped policy update", sub: "ratio times advantage, clipped", icon: RefreshCw, color: "text-orange-500", x: 50, y: 87 },
];

const actorCriticEdges: DiagramEdge[] = [
  { id: "e-state-actor", from: "state", to: "actor" },
  { id: "e-state-critic", from: "state", to: "critic" },
  { id: "e-actor-advantage", from: "actor", to: "advantage" },
  { id: "e-critic-advantage", from: "critic", to: "advantage" },
  { id: "e-advantage-update", from: "advantage", to: "update" },
];

export const actorCriticProximalPolicyOptimization: BlogPostData = {
  title: "Actor-Critic Methods and Proximal Policy Optimization",
  date: "August 10, 2026",
  slug: "actor-critic-proximal-policy-optimization",
  content: (
    <>
      <Paragraph delay={0.10}>
        Training a policy from reward alone works, but every gradient step is only as trustworthy as the return it came from. One lucky rollout can convince the policy that an action was brilliant. One unlucky rollout, same action, same state, can convince it the opposite. Subtracting a baseline softens that noise, but a plain running average of past returns is a blunt instrument. It treats every state the same, whether that state was a promising one or a doomed one to begin with.
      </Paragraph>

      <Paragraph delay={0.15}>
        Actor-critic methods replace that blunt average with something that actually looks at the state in front of it, a second neural network trained to predict how much reward is coming. Proximal Policy Optimization, PPO for short, builds on that idea and adds one more piece, a way to stop a single update from overcorrecting no matter how convincing the signal looks. That combination, a learned baseline plus a capped update, made PPO a default choice for training policies for years, from robotic control to the reinforcement learning stage of language model fine-tuning.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        The actor and the critic
      </Heading>

      <Paragraph delay={0.25}>
        The name gives the mechanism away. The <strong>actor</strong> is the policy itself, the network that looks at a state and outputs a distribution over actions, exactly the network any policy gradient method trains. The <strong>critic</strong> is new, a separate network that looks at the same state and outputs a single number, its estimate of how much total future reward that state is worth. That number is the value function, usually written <Formula>{`V(s)`}</Formula>. A close cousin, <Formula>{`Q(s, a)`}</Formula>, estimates the value of taking one specific action from that state rather than the state on its own, and some actor-critic variants use that instead.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={500}
        nodes={actorCriticNodes}
        edges={actorCriticEdges}
        caption="The actor and the critic read the same state and feed one shared advantage computation, which drives the clipped update."
      />

      <Paragraph delay={0.30}>
        The critic trains the ordinary way a regression model trains. Every state it saw during a rollout eventually produces a real return, or at least a bootstrapped estimate of one, and the critic's loss is just the squared difference between its prediction and that number. That training happens alongside the actor's policy gradient step, not instead of it. Two networks, two losses, one shared rollout of experience.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        From value estimate to advantage
      </Heading>

      <Paragraph delay={0.40}>
        Once a critic exists, it can answer a much sharper question than "was this trajectory good." It can answer "was this particular action better or worse than what I already expected from this state." That quantity is the <strong>advantage</strong>, defined as <Formula>{`A(s, a) = Q(s, a) - V(s)`}</Formula>. A positive advantage means the action beat the critic's expectation for that state. A negative advantage means it fell short.
      </Paragraph>

      <Paragraph delay={0.45}>
        In practice, nobody has a clean estimate of <Formula>{`Q(s, a)`}</Formula> sitting around, so the advantage gets approximated with something computable from a single step of real experience, the <strong>TD error</strong> (temporal difference error).
      </Paragraph>

      <Formula block delay={0.50}>
        {`\\delta_t = r_t + \\gamma V(s_{t+1}) - V(s_t)`}
      </Formula>

      <Paragraph delay={0.55}>
        Read it left to right. <Formula>{`r_t`}</Formula> is the real reward the action just produced. <Formula>{`\\gamma V(s_{t+1})`}</Formula> is the critic's discounted estimate of everything still to come from the next state. Adding those two gives a one-step estimate of the total value of taking that action. Subtracting <Formula>{`V(s_t)`}</Formula>, the critic's prediction before the action happened, turns that estimate into a comparison against expectation rather than a raw number.
      </Paragraph>

      <Paragraph delay={0.60}>
        A quick pass through the numbers helps. Say the critic estimates a state is worth <Formula>{`V(s_t) = 2.0`}</Formula>. The actor takes an action, gets a reward of <Formula>{`3`}</Formula>, and lands in a state the critic values at <Formula>{`V(s_{t+1}) = 1.5`}</Formula>, with a discount factor <Formula>{`\\gamma = 0.99`}</Formula>. The TD error works out to <Formula>{`3 + 0.99 \\times 1.5 - 2.0 \\approx 2.485`}</Formula>. The critic expected around 2.0 of value from that state. The action delivered something worth about 4.485, beating expectations by roughly 2.485. That signed, action-specific number is a cleaner training signal than the raw, unshifted return, which mixes "how good was this whole trajectory" with "how good was this one action relative to what was already expected here."
      </Paragraph>

      <Heading level={2} delay={0.65}>
        Generalized advantage estimation
      </Heading>

      <Paragraph delay={0.70}>
        The single-step TD error is only one way to estimate the advantage. It leans entirely on the critic's own predictions, which makes it low variance but only as accurate as the critic currently is, meaning it can be biased whenever the critic is still wrong about a state. The other extreme is to wait and use the full real rollout, summing every actual reward from here to the end of the episode, minus the critic's estimate at the start. That's low bias, because it uses real outcomes rather than the critic's guesses, but high variance, because a long rollout accumulates a lot of randomness along the way.
      </Paragraph>

      <Paragraph delay={0.75}>
        Generalized advantage estimation (GAE) doesn't pick one extreme, it blends every point in between using an exponentially decaying weight, <Formula>{`\\lambda`}</Formula>.
      </Paragraph>

      <Formula block delay={0.80}>
        {`A_t^{GAE} = \\sum_{l=0}^{\\infty} (\\gamma \\lambda)^l\\, \\delta_{t+l}`}
      </Formula>

      <Paragraph delay={0.85}>
        Each term in that sum is a TD error further into the future, discounted twice over, once by <Formula>{`\\gamma`}</Formula> for how far away in time it is, and once by <Formula>{`\\lambda`}</Formula> for how far it is from the immediate one-step estimate. Setting <Formula>{`\\lambda = 0`}</Formula> collapses the whole sum down to the single TD error from before, entirely trusting the critic. Setting <Formula>{`\\lambda = 1`}</Formula> lets every future TD error contribute at full weight, which telescopes into the full real rollout again, entirely trusting the actual trajectory. It's the same bias-variance dial that shows up anywhere a short lookahead gets blended with a longer one, just applied here to advantages instead of value updates directly. Most implementations settle somewhere around <Formula>{`\\lambda = 0.95`}</Formula>, close to the low-variance end but not all the way there.
      </Paragraph>

      <Heading level={2} delay={0.90}>
        The clipped objective
      </Heading>

      <Paragraph delay={0.95}>
        With an advantage in hand, the natural next move is a policy gradient step that pushes up the probability of actions with positive advantage and pushes down the probability of actions with negative advantage. PPO does this a little differently from a plain policy gradient. Rather than computing a fresh gradient the moment a rollout finishes, it wants to reuse that rollout for a few update steps (more on why below), so its objective is written in terms of a probability ratio between the policy being updated and the policy that actually generated the data, called <Formula>{`\\pi_{\\theta_{\\text{old}}}`}</Formula>.
      </Paragraph>

      <Paragraph delay={1.00}>
        That ratio is the risky part. If it drifts far from 1, either because the update has been large or because a handful of very noisy advantage estimates happened to point the same direction, a single gradient step can swing the policy hard, sometimes badly enough that it never recovers. PPO's fix is to cap the ratio, clipping it into a narrow band around 1, so no single step can move the policy too far no matter how large the advantage looks.
      </Paragraph>

      <Formula block delay={1.05}>
        {`L(\\theta) = \\mathbb{E}_t\\Bigl[\\min\\bigl(r_t(\\theta)\\, A_t,\\ \\operatorname{clip}(r_t(\\theta),\\, 1-\\varepsilon,\\, 1+\\varepsilon)\\, A_t\\bigr)\\Bigr]`}
      </Formula>

      <Paragraph delay={1.10}>
        with the ratio itself defined as
      </Paragraph>

      <Formula block delay={1.15}>
        {`r_t(\\theta) = \\frac{\\pi_\\theta(a_t | s_t)}{\\pi_{\\theta_{\\text{old}}}(a_t | s_t)}`}
      </Formula>

      <List delay={1.20}>
        <ListItem><strong>Probability ratio.</strong> <Formula>{`r_t(\\theta)`}</Formula> compares how likely the action is under the policy currently being trained against how likely it was under the policy that generated the rollout. Above 1 means the update has already made this action more likely, below 1 means less likely.</ListItem>
        <ListItem><strong>Advantage.</strong> <Formula>{`A_t`}</Formula> is whatever advantage estimate fed into this step, plain TD error or the GAE blend above. Its sign decides which direction the ratio should move.</ListItem>
        <ListItem><strong>Clip range.</strong> <InlineCode>clip(ratio, 1-ε, 1+ε)</InlineCode> caps the ratio between <Formula>{`1-\\varepsilon`}</Formula> and <Formula>{`1+\\varepsilon`}</Formula>, commonly 0.8 to 1.2 with <Formula>{`\\varepsilon = 0.2`}</Formula>. Past that band, the clipped term stops changing no matter how the ratio moves.</ListItem>
        <ListItem><strong>The min.</strong> Taking the minimum of the unclipped and clipped terms always picks whichever one is worse for the objective. That's deliberately pessimistic, and it's what actually enforces the cap. Once the clipped term is the smaller of the two, it's a constant with respect to the policy parameters in that region, so its gradient is zero and the update simply stops pushing further in that direction.</ListItem>
      </List>

      <Paragraph delay={1.25}>
        A quick pass through actual numbers makes the pessimism concrete. Take the advantage from earlier, <Formula>{`A_t \\approx 2.485`}</Formula>, and suppose the update has pushed the ratio up to <Formula>{`1.4`}</Formula>, past the <Formula>{`1.2`}</Formula> ceiling. The unclipped term is <Formula>{`1.4 \\times 2.485 \\approx 3.48`}</Formula>, but the clipped term is capped at <Formula>{`1.2 \\times 2.485 \\approx 2.98`}</Formula>. The objective takes the minimum, <Formula>{`2.98`}</Formula>, so the update gets no extra credit for having pushed the ratio past 1.2. Now flip to a negative advantage, <Formula>{`A_t = -2`}</Formula>, with a ratio that's dropped to <Formula>{`0.5`}</Formula>, past the <Formula>{`0.8`}</Formula> floor. The unclipped term is <Formula>{`0.5 \\times -2 = -1.0`}</Formula>, but the clipped term is <Formula>{`0.8 \\times -2 = -1.6`}</Formula>, and the minimum of those two picks the more negative one, <Formula>{`-1.6`}</Formula>. Either direction, the clip caps how much reward the objective gives for having moved the ratio too far.
      </Paragraph>

      <CodeBlock
        delay={1.30}
        language="Python"
        code={`import torch

def ppo_clipped_loss(log_probs, old_log_probs, advantages, eps=0.2):
    # Ratio in log space, exponentiated back out (numerically stable)
    ratio = torch.exp(log_probs - old_log_probs)

    unclipped = ratio * advantages
    clipped = torch.clamp(ratio, 1 - eps, 1 + eps) * advantages

    # Minimum of the two, then negate because optimizers minimize
    return -torch.min(unclipped, clipped).mean()`}
      />

      <ReplicationDiagram
        delay={0.08}
        panels={[
          {
            title: "Unclipped update",
            writeLabel: "Advantage-weighted ratio",
            fanLabel: "a large or noisy advantage can",
            nodes: ["Push the ratio arbitrarily far", "Overcorrect in a single step"],
            highlightNodes: [1],
            note: "Nothing stops one noisy estimate from swinging the policy hard.",
          },
          {
            title: "Clipped update",
            writeLabel: "Advantage-weighted ratio",
            fanLabel: "the min() picks whichever is more pessimistic between",
            nodes: ["The unclipped term", "The clipped term (ratio capped at 1 ± ε)"],
            highlightNodes: [1],
            note: "Once the clipped term wins, its gradient is zero, so the step can't move the policy further.",
          },
        ]}
      />

      <Heading level={2} delay={1.35}>
        Collecting rollouts and reusing them
      </Heading>

      <Paragraph delay={1.40}>
        PPO does not update its parameters after every single environment step. It first collects a whole batch of trajectories under the current policy, often running many parallel copies of the environment at once to gather that batch quickly, and only then starts computing gradients. That batch of rollouts, states, actions, rewards, and the log-probabilities the policy assigned at the time, is the raw material every update in the next stage draws from.
      </Paragraph>

      <Paragraph delay={1.45}>
        Here is where the clipping pays for itself beyond just stability. Because each individual update is capped, PPO can run several gradient steps, called <strong>update epochs</strong>, over that same batch of rollouts before going back to collect fresh data. A plain on-policy policy gradient method generally cannot do this safely. Its gradient assumes the data came from the policy currently being updated, and that assumption starts to break down after even one gradient step, so fresh rollouts are needed for essentially every step. Reusing a batch for multiple epochs is a real efficiency win, far fewer expensive rounds of environment interaction for the same number of gradient steps, and it's only safe because the clip keeps every reused step from drifting too far from the policy that generated the data.
      </Paragraph>

      <Heading level={2} delay={1.50}>
        Entropy bonuses and KL control
      </Heading>

      <Paragraph delay={1.55}>
        Clipping controls how far a single update can move the policy, but it does nothing to stop the policy from becoming too confident too early, picking one action with near certainty and never trying anything else. An <strong>entropy bonus</strong>, a small reward added for keeping the action distribution spread out rather than collapsed onto one choice, addresses that directly. It's the same exploration incentive that shows up in plain policy gradient methods, added here as one more term alongside the clipped objective.
      </Paragraph>

      <Paragraph delay={1.60}>
        Reusing a batch for several update epochs raises a second, more specific risk. Over those epochs the policy can drift meaningfully away from the one that generated the rollout, even with clipping in place, especially if the clip range is loose or the advantage estimates are large. Some PPO implementations add an explicit check for this, computing an approximate <strong>KL divergence</strong> (a measure of how different two probability distributions are) between the current and rollout-time policy after each epoch, and stopping early if it exceeds a threshold. That's a cheap, approximate <strong>trust region</strong>, a boundary around the current policy inside which the update is still considered safe, without the expensive second-order optimization earlier trust-region methods relied on to enforce it exactly.
      </Paragraph>

      <Heading level={2} delay={1.65}>
        Practical tips
      </Heading>

      <List delay={1.70}>
        <ListItem><strong>Normalize advantages across the batch.</strong> Subtract the batch mean and divide by the batch standard deviation before plugging advantages into the clipped objective. Raw advantage scale drifts as training progresses, and an unnormalized advantage can quietly dominate or vanish from the loss.</ListItem>
        <ListItem><strong>Clip the value loss too.</strong> Not just the policy ratio. Capping how much the critic's prediction is allowed to move in one update, the same way the ratio is capped, keeps the critic from making a wild jump that then feeds a bad advantage estimate into the very next update.</ListItem>
        <ListItem><strong>Clip the gradient norm.</strong> A global cap on the overall gradient norm before the optimizer step catches the rare batch where, despite every other safeguard, the combined actor and critic gradients still spike.</ListItem>
        <ListItem><strong>Initialize carefully.</strong> A policy head initialized to output something close to a uniform action distribution, rather than an accidentally confident one, avoids wasting early training on unlearning a bad starting habit. Actor and critic often share early layers and only split at the final head, which makes this initialization choice matter for both networks at once.</ListItem>
      </List>

      <Paragraph delay={1.75}>
        None of these four is exotic on its own, but skipping any one of them is a common reason a from-scratch PPO implementation trains unstably or not at all, even when the core clipped objective is coded correctly.
      </Paragraph>

      <Heading level={2} delay={1.80}>
        Takeaways
      </Heading>

      <List delay={1.85}>
        <ListItem>A critic network turns the baseline from a running average into a learned, state-aware prediction, which cuts variance far more than a plain average return could.</ListItem>
        <ListItem>The advantage, real outcome minus the critic's expectation, is a signed, per-action signal that's cleaner to train on than a raw return. GAE blends short and long lookahead estimates of it with a single decay parameter, lambda.</ListItem>
        <ListItem>PPO's clipped objective caps the probability ratio so a single update, run on data from a slightly older policy, cannot move the policy too far even when the advantage estimate is noisy.</ListItem>
        <ListItem>Collecting a batch of rollouts up front and reusing it for several clipped update epochs is a real efficiency win over methods that need fresh data for every gradient step.</ListItem>
        <ListItem>An entropy bonus keeps exploration alive, and an approximate KL check gives PPO a cheap trust region during those reused epochs, without the cost of exact second-order optimization.</ListItem>
      </List>

      <Paragraph delay={1.90}>
        None of these pieces, the critic, the advantage, the clip, are complicated in isolation. What makes PPO durable is how cleanly they compose, a lower-variance signal feeding a deliberately conservative update, reused efficiently across several epochs of the same data. Thanks for reading.
      </Paragraph>
    </>
  ),
};
