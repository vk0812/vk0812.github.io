import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  List,
  ListItem,
  InlineCode,
  ReplicationDiagram,
  ReplicationPanel,
} from "../components";

const mcTdPanels: [ReplicationPanel, ReplicationPanel] = [
  {
    title: "Monte Carlo",
    writeLabel: "V(s) update",
    fanLabel: "waits for",
    nodes: ["Full episode to end", "Real return G"],
    highlightNodes: [1],
    note: "One update per episode, computed from the actual total reward observed after the episode finishes.",
  },
  {
    title: "Temporal difference (TD(0))",
    writeLabel: "V(s) update",
    fanLabel: "bootstraps off",
    nodes: ["One real step (r)", "Current estimate V(s')"],
    highlightNodes: [1],
    note: "One update after every single step, using a one-step-ahead guess instead of waiting for the true outcome.",
  },
];

const sarsaQlearningPanels: [ReplicationPanel, ReplicationPanel] = [
  {
    title: "SARSA (on-policy)",
    writeLabel: "Q(s,a) update",
    fanLabel: "bootstraps off",
    nodes: ["Q(s', a')", "a' actually taken next"],
    highlightNodes: [0],
    note: "Learns about the exact policy currently choosing actions, exploration included.",
  },
  {
    title: "Q-learning (off-policy)",
    writeLabel: "Q(s,a) update",
    fanLabel: "bootstraps off",
    nodes: ["max over a' of Q(s', a')", "the greedy action"],
    highlightNodes: [0],
    note: "Learns about the greedy, optimal policy no matter what action the agent actually takes next.",
  },
];

export const monteCarloTemporalDifferenceLearning: BlogPostData = {
  title: "Monte Carlo and Temporal-Difference Learning",
  date: "August 10, 2026",
  slug: "monte-carlo-temporal-difference-learning",
  content: (
    <>
      <Paragraph delay={0.1}>
        Suppose an agent can only watch what happens. It doesn't get handed the environment's transition probabilities in a neat table, it only gets to act, wait, and observe a reward and a next state. That's the situation almost every real problem puts an agent in, whether it's playing blackjack, navigating a maze, or trading a stock. There's no clean model of the world to compute against, only raw experience.
      </Paragraph>

      <Paragraph delay={0.15}>
        Monte Carlo methods and temporal-difference learning are the two classic answers to that problem. Both learn a value function purely from episodes of interaction, no known transition probabilities required. They just disagree, sharply, about when to actually use what they've seen to update that value function.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        Learning without a model
      </Heading>

      <Paragraph delay={0.25}>
        The shared trick behind both methods is to replace "compute the exact expected return" with "estimate it from samples." Live through the process enough times, or simulate it enough times, and the average of what actually happened converges toward the true value. Every algorithm in this post is a different way of turning a raw stream of states, actions, and rewards into an updated value estimate, without ever needing to know the odds behind any of it.
      </Paragraph>

      <Heading level={2} delay={0.3}>
        Monte Carlo, learn from full episodes
      </Heading>

      <Paragraph delay={0.35}>
        Start with the more literal of the two. An episode is one full run through the environment, a sequence of states, actions, and rewards that starts somewhere and ends when the environment reaches a terminal state. A hand of blackjack ending in a win or a loss is an episode. A robot's attempt at reaching a goal, however it ends, is an episode.
      </Paragraph>

      <Paragraph delay={0.4}>
        Monte Carlo learning needs that ending. To update a state's value, it needs the actual return, the real total discounted reward that followed from that state until the episode was over. There's no way to compute that number until the episode has actually finished, so Monte Carlo waits. It plays the whole episode out, works out the real return for every state visited along the way, and only then updates.
      </Paragraph>

      <Paragraph delay={0.45}>
        Say an episode visits state <InlineCode>s</InlineCode>, and the three rewards that follow are 2, 3, and -1, with a discount rate of 0.9. The return from <InlineCode>s</InlineCode> is <Formula>{`2 + 0.9 \\times 3 + 0.81 \\times (-1)`}</Formula>, which works out to 3.89. Monte Carlo nudges <InlineCode>V(s)</InlineCode> toward that number with the update rule below, where <InlineCode>alpha</InlineCode> is the learning rate and <InlineCode>G</InlineCode> is that observed return.
      </Paragraph>

      <Formula block delay={0.5}>
        {`V(s) \\leftarrow V(s) + \\alpha \\bigl(G - V(s)\\bigr)`}
      </Formula>

      <Paragraph delay={0.55}>
        Nothing here is an estimate feeding another estimate. 3.89 is the number that actually happened, so this update carries zero systematic error, a fact that matters a lot once bias enters the picture later on.
      </Paragraph>

      <Heading level={2} delay={0.6}>
        Temporal-difference learning, updating one step at a time
      </Heading>

      <Paragraph delay={0.65}>
        Monte Carlo's honesty comes at a cost, it has to wait until the episode ends before learning anything. Temporal-difference learning, TD for short, doesn't wait. It updates a value estimate using another value estimate, a trick called bootstrapping. This isn't the statistical kind of bootstrapping (resampling a dataset), it's a different, RL-specific meaning, updating a guess using another guess rather than a real, final outcome.
      </Paragraph>

      <Paragraph delay={0.7}>
        The simplest version, called TD(0), looks exactly one step ahead. After taking an action from state <InlineCode>s</InlineCode>, landing in state <InlineCode>s'</InlineCode>, and getting reward <InlineCode>r</InlineCode>, TD(0) compares two things, what it currently believes <InlineCode>s</InlineCode> is worth, and a slightly better-informed guess, the reward just received plus the discounted value of the new state. That difference is the TD error.
      </Paragraph>

      <Formula block delay={0.75}>
        {`\\delta = r + \\gamma V(s') - V(s)`}
      </Formula>

      <Paragraph delay={0.8}>
        In plain language, <InlineCode>delta</InlineCode> is the surprise, the gap between what a state seemed worth a moment ago and what it seems worth now that one more real step of information has arrived. <InlineCode>r</InlineCode> is the reward just observed, <InlineCode>gamma</InlineCode> is the discount rate, <InlineCode>V(s')</InlineCode> is the current estimated value of the new state, and <InlineCode>V(s)</InlineCode> is the current estimated value of the old state. The TD(0) update just folds a fraction of that surprise back into <InlineCode>V(s)</InlineCode>.
      </Paragraph>

      <Formula block delay={0.85}>
        {`V(s) \\leftarrow V(s) + \\alpha \\delta`}
      </Formula>

      <Paragraph delay={0.9}>
        Take a concrete case. <InlineCode>V(s)</InlineCode> is currently 4, the agent moves to a state with <InlineCode>V(s')</InlineCode> of 6, receives a reward of 1, and <InlineCode>gamma</InlineCode> is 0.9. The TD error is <Formula>{`1 + 0.9 \\times 6 - 4`}</Formula>, which comes out to 2.4. With a learning rate of 0.5, <InlineCode>V(s)</InlineCode> updates to <Formula>{`4 + 0.5 \\times 2.4`}</Formula>, or 5.2. That update happened after a single step, with no episode ending required.
      </Paragraph>

      <ReplicationDiagram delay={0.08} panels={mcTdPanels} />

      <Heading level={2} delay={0.95}>
        n-step returns and TD(lambda)
      </Heading>

      <Paragraph delay={1}>
        TD(0) and Monte Carlo are really two ends of the same dial. TD(0) bootstraps after one real step. Monte Carlo never bootstraps at all, it waits for every real step the episode has left. An n-step return sits wherever you like in between, look ahead n real steps, collect those n real rewards, and only then bootstrap off the value estimate at that point instead of guessing after just one step.
      </Paragraph>

      <Paragraph delay={1.05}>
        A 3-step return, for example, sums three real discounted rewards and then adds the discounted estimated value of whatever state the agent landed in after those three steps. Push n all the way out to the end of the episode and there's no state left to bootstrap from, which is exactly Monte Carlo. Set n to 1 and there's no waiting at all, which is exactly TD(0).
      </Paragraph>

      <Paragraph delay={1.1}>
        Eligibility traces, and the method built on them called TD(lambda), take this one step further. Instead of picking a single n and committing to it, TD(lambda) blends every n-step return at once, each one weighted by a factor that decays exponentially the further out it looks. That decay is controlled by a single parameter, lambda, between 0 and 1. Set lambda to 0 and only the 1-step return survives, TD(0) again. Set lambda to 1 and the weights never decay, which recovers Monte Carlo. Everything in between is a genuine blend, a little bit of the 1-step return, a little less of the 2-step return, and so on, all folded into one running update rather than one fixed lookahead. The bookkeeping needed to make that blend efficient is a mechanical detail, the concept worth keeping is the dial itself, one parameter sliding smoothly between the two extremes this whole post has been comparing.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        On-policy versus off-policy learning
      </Heading>

      <Paragraph delay={1.2}>
        Every one of these methods needs to pick actions while it learns, and that raises a question that hasn't come up yet, whose policy is actually being evaluated? The policy generating the data, called the behavior policy, and the policy being learned about, called the target policy, don't have to be the same policy.
      </Paragraph>

      <Paragraph delay={1.25}>
        On-policy methods keep them identical, they learn about the exact policy currently choosing actions, exploration and all. Off-policy methods let them differ, an agent can behave one way, often exploring on purpose, while learning about a different, usually better, target policy.
      </Paragraph>

      <Paragraph delay={1.3}>
        A common way to keep exploring while mostly acting on what's already been learned is an epsilon-greedy policy, pick the best-known action most of the time, but with small probability epsilon, pick a random action instead. That habit of occasional randomness is exactly what makes the on-policy versus off-policy distinction matter in practice.
      </Paragraph>

      <Heading level={2} delay={1.35}>
        SARSA and Q-learning
      </Heading>

      <Paragraph delay={1.4}>
        SARSA, short for state-action-reward-state-action, is the on-policy answer for control, learning not just a state's value but which action is best to take in it. Its name comes from the exact five things its update touches, in order, state, action, reward, next state, next action. After taking action <InlineCode>a</InlineCode> from state <InlineCode>s</InlineCode>, observing reward <InlineCode>r</InlineCode>, and landing in state <InlineCode>s'</InlineCode>, SARSA doesn't stop there, it also samples the next action <InlineCode>a'</InlineCode> from its own current, exploring policy before updating.
      </Paragraph>

      <Formula block delay={1.45}>
        {`Q(s,a) \\leftarrow Q(s,a) + \\alpha \\bigl(r + \\gamma Q(s', a') - Q(s,a)\\bigr)`}
      </Formula>

      <Paragraph delay={1.5}>
        Because <InlineCode>a'</InlineCode> is the action the agent is actually about to take, including whatever randomness its epsilon-greedy policy injects, SARSA is learning about the very policy generating its own behavior. That's what makes it on-policy.
      </Paragraph>

      <Paragraph delay={1.55}>
        Q-learning changes one thing, but it's the thing that matters. Instead of bootstrapping off the value of whatever action comes next, it bootstraps off the best possible action, the highest Q-value available from <InlineCode>s'</InlineCode>, regardless of what the agent is actually about to do.
      </Paragraph>

      <Formula block delay={1.6}>
        {`Q(s,a) \\leftarrow Q(s,a) + \\alpha \\Bigl(r + \\gamma \\max_{a'} Q(s', a') - Q(s,a)\\Bigr)`}
      </Formula>

      <Paragraph delay={1.65}>
        That single change makes Q-learning off-policy. The agent might behave with epsilon-greedy exploration, occasionally taking a clumsy random action, but its updates always chase the value of the greedy, optimal policy. It learns about the policy it wishes it were following, not the one actually producing its data.
      </Paragraph>

      <ReplicationDiagram delay={0.08} panels={sarsaQlearningPanels} />

      <Heading level={2} delay={1.7}>
        Bias and variance, the real trade-off
      </Heading>

      <Paragraph delay={1.75}>
        Both families work, but they fail differently, and the reason comes down to bias and variance. Monte Carlo's update uses a real, fully observed return, so it's unbiased, averaged across enough episodes, it points at the true value with no systematic error. The cost is variance, a single episode's return is the product of every random action, every random transition, and every random reward along the entire trajectory, so two episodes starting from the same state can produce wildly different returns.
      </Paragraph>

      <Paragraph delay={1.8}>
        TD flips both properties. Its update bootstraps off <InlineCode>V(s')</InlineCode>, a current estimate that might itself still be wrong early in training, so TD is biased. But that bias comes with much lower variance, a TD update only depends on one step's worth of randomness, one reward and one transition, not an entire trajectory's.
      </Paragraph>

      <Paragraph delay={1.85}>
        In practice, the lower variance often wins. A biased but low-variance signal, applied over and over, tends to settle into a good estimate faster than an unbiased but noisy one, especially in problems with long episodes where a Monte Carlo return has a lot of randomness to average out. That's the main reason TD methods, and the SARSA and Q-learning algorithms built on them, are the usual starting point for practical reinforcement learning rather than plain Monte Carlo control.
      </Paragraph>

      <Heading level={2} delay={1.9}>
        Takeaways
      </Heading>

      <List delay={1.95}>
        <ListItem>Monte Carlo learns from complete, real episode returns. Unbiased, but high variance, because a whole trajectory's randomness feeds every update.</ListItem>
        <ListItem>Temporal-difference learning bootstraps off its own current estimate one step at a time. Biased, but low variance, and usually faster to learn in practice.</ListItem>
        <ListItem>n-step returns and TD(lambda) aren't separate ideas, they're a single dial between TD(0) at one end and Monte Carlo at the other.</ListItem>
        <ListItem>SARSA is on-policy, it learns about the policy actually generating its actions, exploration included. Q-learning is off-policy, it always bootstraps off the best possible next action, regardless of what the agent does next.</ListItem>
        <ListItem>The bias-variance trade-off between these two families shows up again and again in reinforcement learning, it's worth remembering by name.</ListItem>
      </List>

      <Paragraph delay={2}>
        None of this needed a known model of the environment, which is exactly the point. Both families turn raw, messy experience into a value function that gets a little better every episode, or even every single step. Thanks for reading.
      </Paragraph>
    </>
  ),
};
