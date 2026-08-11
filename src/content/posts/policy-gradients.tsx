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
import { ProbabilityPushDiagram } from "../components/animations/policy-gradients/ConceptViz";
import { Dice5, Target, Scale, RefreshCw } from "lucide-react";

const loopNodes: DiagramNode[] = [
  { id: "collect", label: "Collect a trajectory", sub: "run the policy, sample actions", icon: Dice5, color: "text-blue-500", x: 15, y: 50 },
  { id: "returns", label: "Compute returns", sub: "sum rewards from each step", icon: Target, color: "text-indigo-500", x: 38, y: 50 },
  { id: "weight", label: "Weight log-probabilities", sub: "by return or advantage", icon: Scale, color: "text-emerald-500", x: 62, y: 50 },
  { id: "update", label: "Take a gradient step", sub: "update theta, repeat", icon: RefreshCw, color: "text-orange-500", x: 85, y: 50 },
];

const loopEdges: DiagramEdge[] = [
  { id: "e-collect-returns", from: "collect", to: "returns" },
  { id: "e-returns-weight", from: "returns", to: "weight" },
  { id: "e-weight-update", from: "weight", to: "update" },
];

const loopPhases: DiagramPhase[] = [
  { nodeIds: ["collect"], edgeIds: [], note: "Run the current stochastic policy for one full episode, sampling an action from its distribution at every step." },
  { nodeIds: ["collect", "returns"], edgeIds: ["e-collect-returns"], note: "Add up the rewards to get a return for the episode, or a reward-to-go for each timestep." },
  { nodeIds: ["collect", "returns", "weight"], edgeIds: ["e-collect-returns", "e-returns-weight"], note: "Weight the log-probability of each action actually taken by that return, minus a baseline if using one." },
  { nodeIds: ["collect", "returns", "weight", "update"], edgeIds: ["e-collect-returns", "e-returns-weight", "e-weight-update"], note: "Take a gradient ascent step on theta, then run the freshly updated policy for the next episode." },
];

export const policyGradients: BlogPostData = {
  title: "Policy Gradients",
  date: "August 10, 2026",
  slug: "policy-gradients",
  content: (
    <>
      <Paragraph delay={0.10}>
        Every value-based method you've worked with, Q-learning and its deep-network successors, follows the same recipe. First learn how good each action is in a given state. Then act greedily, pick whichever action has the highest estimated value. The policy itself is never a first-class object in that setup. It's just whatever the value function implies once you take an argmax over it.
      </Paragraph>

      <Paragraph delay={0.15}>
        Policy gradient methods flip that around. Instead of learning a value function and deriving a policy from it, they parameterize the policy directly. A neural network with parameters <Formula>{`\\theta`}</Formula> takes a state and produces the policy's action choice, and training adjusts <Formula>{`\\theta`}</Formula> by gradient ascent on how much reward that policy earns. There's no argmax step, and in the simplest versions of this idea, no value function at all.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Parameterizing the policy directly
      </Heading>

      <Paragraph delay={0.25}>
        The first big shift is that the policy <Formula>{`\\pi_\\theta(a|s)`}</Formula> doesn't output one fixed action anymore. It outputs a probability distribution over actions, a <strong>stochastic policy</strong>. For a discrete action space (say, four moves in a grid world), the network's last layer is a softmax, and every action gets some probability of being picked. For continuous actions, more on that later, the network outputs the parameters of a Gaussian instead.
      </Paragraph>

      <Paragraph delay={0.30}>
        This has two consequences the rest of the post depends on. Exploration comes for free, since sampling from a distribution occasionally tries something other than the current favorite action, instead of always picking the same one. And every action's probability is a differentiable function of <Formula>{`\\theta`}</Formula>, which matters enormously once gradients need to flow through it.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        The likelihood-ratio trick
      </Heading>

      <Paragraph delay={0.40}>
        Here's the obstacle policy gradient methods have to get around. Training by gradient ascent means computing how expected reward changes as <Formula>{`\\theta`}</Formula> changes, but the reward comes from the environment, and the environment is an opaque black box. You can sample rewards by acting in it. You cannot backpropagate through it. There's no way to write out a gradient of the reward with respect to <Formula>{`\\theta`}</Formula> directly, because the environment isn't a differentiable function, it's a simulator or a robot or a game engine.
      </Paragraph>

      <Paragraph delay={0.45}>
        What you can differentiate is the policy itself. You know exactly how <Formula>{`\\pi_\\theta`}</Formula> assigned probability to the action it just took, because that number came out of your own network. The likelihood-ratio trick uses exactly that fact. Take the gradient of the log-probability of the action actually taken, and weight it by how good the outcome turned out to be. Average that over enough trajectories and the result is an unbiased estimate of the true policy gradient, without ever touching the environment's internals.
      </Paragraph>

      <Formula block delay={0.50}>
        {`\\nabla_\\theta J(\\theta) \\approx \\mathbb{E}_{\\tau \\sim \\pi_\\theta}\\left[ \\sum_{t=0}^{T} \\nabla_\\theta \\log \\pi_\\theta(a_t \\mid s_t) \\; R(\\tau) \\right]`}
      </Formula>

      <Paragraph delay={0.55}>
        Term by term, that reads as follows.
      </Paragraph>

      <List delay={0.60}>
        <ListItem><strong>J(theta).</strong> The objective, expected total return under the current policy. Gradient ascent on this is the whole point of training.</ListItem>
        <ListItem><strong>Trajectory tau.</strong> One full episode, the sequence of states, actions, and rewards from start to finish.</ListItem>
        <ListItem><strong>Sum over t.</strong> Add up this term at every timestep in the episode, since every action taken along the way contributed to the eventual return.</ListItem>
        <ListItem><strong>Gradient of the log-probability.</strong> The gradient of the log-probability the policy assigned to the action it actually sampled at step <Formula>{`t`}</Formula>. This is the piece computed directly from the network, plain backpropagation.</ListItem>
        <ListItem><strong>Return R(tau).</strong> The return of the trajectory. It's just a number, a weight, and it decides whether the gradient step above pushes toward that action (a large positive return) or away from it (a negative or low one).</ListItem>
      </List>

      <Paragraph delay={0.65}>
        In plain language, push up the log-probability of actions that led to good returns, and push down the log-probability of actions that led to bad ones.
      </Paragraph>

      <ProbabilityPushDiagram
        delay={0.06}
        caption="Two small episodes, two directions. A good return raises the log-probability of the action that produced it, a bad return lowers it."
      />

      <Paragraph delay={0.70}>
        In code, this estimator only takes a few lines.
      </Paragraph>

      <CodeBlock
        delay={0.75}
        language="Python"
        code={`import torch

def reinforce_loss(log_probs, returns):
    # log_probs: log pi_theta(a_t | s_t) for each timestep actually taken
    # returns:   the return (or reward-to-go, or advantage) at each timestep
    return -(log_probs * returns).mean()`}
      />

      <Paragraph delay={0.80}>
        That's the entire gradient estimator. Multiply, negate (optimizers minimize a loss, and this needs to maximize a return), average, and call backward. Everything else in this post is about what to plug in for <InlineCode>returns</InlineCode> to make that estimate less noisy.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        REINFORCE, the simplest algorithm
      </Heading>

      <Paragraph delay={0.90}>
        <strong>REINFORCE</strong> is what you get when you implement the estimator above in the most direct way possible. Run the current policy for one full episode, note every action taken and every reward received, then use the entire episode's return as <Formula>{`R(\\tau)`}</Formula> for every single timestep in that episode. It's a Monte Carlo method, in that it estimates the gradient the way rolling dice many times estimates an average, by sampling whole episodes and averaging, not by anything cleverer.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={320}
        nodes={loopNodes}
        edges={loopEdges}
        phases={loopPhases}
        caption="One REINFORCE iteration. Sample an episode, turn it into returns, weight the log-probabilities, update, repeat with the new policy."
      />

      <Paragraph delay={0.95}>
        Repeat that loop for enough episodes and the policy slowly shifts probability mass toward actions that historically led to good returns. It works. It's also close to the noisiest possible way to do this, which is exactly the problem the next two ideas fix.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        Reducing variance, reward-to-go and baselines
      </Heading>

      <Paragraph delay={1.05}>
        The first fix targets a simple waste in plain REINFORCE. Weighting every action in an episode by the same whole-episode return is a bit backwards. An action taken at step five could not possibly have caused the reward already collected at step one, that reward happened before the action even existed. <strong>Reward-to-go</strong> fixes this by weighting each action's log-probability only by the rewards collected from that timestep onward, not the whole episode.
      </Paragraph>

      <Paragraph delay={1.10}>
        Take a three-step episode with rewards <Formula>{`[1,\\ 2,\\ -1]`}</Formula>. The full episode return is 2. Reward-to-go looks different at every step though. From step 0 it's still 2, since all three rewards are still ahead of it. From step 1 it's 1, just the last two rewards. From step 2 it's -1, only the final reward remains. Excluding rewards that already happened before the action was taken reduces variance in the gradient estimate without changing its expected value.
      </Paragraph>

      <CodeBlock
        delay={1.15}
        language="Python"
        code={`import torch

rewards = torch.tensor([1.0, 2.0, -1.0])

# reward-to-go: sum of rewards from t onward, not the whole episode
reward_to_go = torch.tensor([rewards[i:].sum() for i in range(len(rewards))])
# tensor([2., 1., -1.])

baseline = 0.5  # e.g. a running average of past returns
advantage = reward_to_go - baseline
# tensor([1.5, 0.5, -1.5])`}
      />

      <Paragraph delay={1.20}>
        <strong>Baselines</strong> go a step further. Subtract some estimate <Formula>{`b(s)`}</Formula> of the return you'd typically expect from that state before weighting the gradient. An action that beats the local average gets a positive push, one that falls short gets a negative one. As long as the baseline depends only on the state and not on the action actually taken, subtracting it doesn't bias the gradient at all, it only reduces its variance. A running average of past returns already works as a baseline, though it's also natural to learn <Formula>{`b(s)`}</Formula> with its own small network trained to predict expected return. That's exactly the idea actor-critic methods build on, a learned baseline that gets its own gradient updates alongside the policy.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        Entropy bonuses, keeping exploration alive
      </Heading>

      <Paragraph delay={1.30}>
        There's a failure mode reward-to-go and baselines don't fix. A policy can get lucky early, grow very confident in one action, and stop exploring alternatives long before it's actually found the best one. Once a softmax collapses to putting almost all its probability mass on a single action, sampling rarely produces anything else, and the policy stops learning anything new about the other options.
      </Paragraph>

      <Paragraph delay={1.35}>
        The fix is an <strong>entropy bonus</strong>, a small extra term added to the training objective that rewards the policy for staying spread out across its actions. Entropy measures how uncertain or spread out a distribution is, high when probability is spread evenly, low when it's concentrated on one choice. Adding a small multiple of entropy to the objective (and it's a bonus, so training maximizes it) keeps some randomness alive in the policy for longer, which helps avoid the model settling into a decent-but-not-great habit too early in training.
      </Paragraph>

      <Heading level={2} delay={1.40}>
        Credit assignment and high variance, the core weakness
      </Heading>

      <Paragraph delay={1.45}>
        Even with all of that, policy gradients have a structural weakness worth naming honestly. Reward-to-go weights an action by everything that happened after it, but that's still an imprecise signal. If an episode ends well, was it because of the action taken at step three, step seven, or some mix that no single action can be credited for individually? Figuring out exactly which action deserves credit for an eventual outcome is the <strong>credit assignment problem</strong>, and policy gradients don't really solve it. They smear credit across a whole trajectory, or a whole reward-to-go window, rather than pinpointing it. That's not a flaw specific to this family of algorithms either, it's one of the genuinely hard problems in reinforcement learning generally.
      </Paragraph>

      <Paragraph delay={1.50}>
        The other weakness is more practical day to day. A single episode's outcome is often mostly luck, a slightly different random seed or a slightly different sequence of exploratory actions, and the same policy can produce a very different return. Because the gradient estimate is built directly from that return, one unlucky (or lucky) episode can swing the update wildly compared to what the surrounding episodes suggested. This <strong>high-variance gradient</strong> problem is the single biggest practical headache with pure policy gradient methods. It's exactly what reward-to-go and baselines exist to soften, and it's also what motivates actor-critic methods, which learn a proper value function alongside the policy instead of estimating everything from raw episode returns every single time.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        Continuous action spaces
      </Heading>

      <Paragraph delay={1.60}>
        Everything so far assumed a small menu of discrete actions, but plenty of real tasks don't work that way. A robotic arm's torque, a steering angle, a throttle position, these are real numbers, not a pick-one-of-four menu. Policy gradients handle this cleanly because the underlying math never assumed discreteness in the first place. It only assumed the policy has a well-defined, differentiable probability, or probability density, for the action it took.
      </Paragraph>

      <Paragraph delay={1.65}>
        For continuous actions, the network's output layer switches from a softmax to a <strong>Gaussian policy</strong>. Instead of producing one probability per action, it produces a mean for each action dimension, and often a standard deviation too, sometimes fixed, sometimes learned alongside the mean. The actual action taken is sampled from that Gaussian, and the quantity fed into the policy gradient formula becomes the log-density of that sample under the Gaussian, in place of a discrete softmax log-probability. Nothing else about the estimator changes. Reward-to-go, baselines, and entropy bonuses all carry over directly.
      </Paragraph>

      <ReplicationDiagram
        delay={0.08}
        panels={[
          {
            title: "Discrete actions",
            writeLabel: "Policy network",
            fanLabel: "outputs a",
            nodes: ["Softmax over N actions", "Sample an action index"],
            highlightNodes: [0],
            note: "A probability for each item on a fixed menu, e.g. left, right, or stay.",
          },
          {
            title: "Continuous actions",
            writeLabel: "Policy network",
            fanLabel: "outputs a",
            nodes: ["Gaussian mean and std", "Sample a real-valued action"],
            highlightNodes: [0],
            note: "A torque or steering angle sampled from a distribution instead of picked from a list.",
          },
        ]}
      />

      <Heading level={2} delay={1.70}>
        Takeaways
      </Heading>

      <List delay={1.75}>
        <ListItem>Policy gradient methods parameterize a stochastic policy directly and push its log-probabilities up or down using sampled returns, no gradient through the environment required.</ListItem>
        <ListItem>REINFORCE is the plainest version of this idea, a whole episode's return weighting every action taken during it.</ListItem>
        <ListItem>Reward-to-go and baselines cut variance without adding bias, by only counting rewards an action could plausibly have caused, and by subtracting a state-dependent average before weighting the gradient.</ListItem>
        <ListItem>An entropy bonus keeps exploration alive, while credit assignment and high gradient variance remain the two structural weaknesses pure policy gradients never fully escape.</ListItem>
        <ListItem>The same estimator handles continuous actions by swapping a softmax for a Gaussian policy and a discrete log-probability for a continuous log-density.</ListItem>
      </List>

      <Paragraph delay={1.80}>
        None of this needs a bigger idea than the one at the start, sample an episode, weight it by how well things went, push probabilities up or down accordingly. Most of what modern reinforcement learning research spends its time refining is exactly the mechanics covered here, which rewards should count, what to subtract, and how much randomness to keep around while the policy learns. Thanks for reading.
      </Paragraph>
    </>
  ),
};
