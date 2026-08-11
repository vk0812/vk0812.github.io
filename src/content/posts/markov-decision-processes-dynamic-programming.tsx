import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  List,
  ListItem,
  Diagram,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  DiagramPhase,
} from "../components";
import { Bot, Zap, Globe, Target } from "lucide-react";

const loopNodes: DiagramNode[] = [
  { id: "agent", label: "Agent", sub: "observes state s", icon: Bot, color: "text-blue-500", x: 10, y: 50 },
  { id: "action", label: "Chooses action a", sub: "policy pi(a|s)", icon: Zap, color: "text-indigo-500", x: 36, y: 50 },
  { id: "env", label: "Environment", sub: "applies P(s'|s,a)", icon: Globe, color: "text-emerald-500", x: 62, y: 50 },
  { id: "outcome", label: "New state and reward", sub: "s', R(s,a,s')", icon: Target, color: "text-orange-500", x: 88, y: 50 },
];

const loopEdges: DiagramEdge[] = [
  { id: "e-agent-action", from: "agent", to: "action" },
  { id: "e-action-env", from: "action", to: "env" },
  { id: "e-env-outcome", from: "env", to: "outcome" },
];

const loopPhases: DiagramPhase[] = [
  { nodeIds: ["agent"], edgeIds: [], note: "Every step starts with the agent looking at whatever state it's currently in." },
  { nodeIds: ["agent", "action"], edgeIds: ["e-agent-action"], note: "Its policy picks an action, either a fixed choice or a sample from a distribution." },
  { nodeIds: ["agent", "action", "env"], edgeIds: ["e-agent-action", "e-action-env"], note: "The environment applies its transition rule to figure out what happens next." },
  { nodeIds: ["agent", "action", "env", "outcome"], edgeIds: ["e-agent-action", "e-action-env", "e-env-outcome"], note: "It hands back a new state and a reward, and the loop starts over from there." },
];

export const markovDecisionProcessesDynamicProgramming: BlogPostData = {
  title: "Markov Decision Processes and Dynamic Programming",
  date: "August 10, 2026",
  slug: "markov-decision-processes-dynamic-programming",
  content: (
    <>
      <Paragraph delay={0.1}>
        Every reinforcement learning problem, no matter how flashy the final system looks, boils down to the same loop. Something (call it the agent) looks at where it is, picks an action, and the world around it (the environment) responds with a new situation and a reward. Repeat that enough times and the agent starts figuring out which actions pay off. A Markov Decision Process, usually shortened to <strong>MDP</strong>, is the mathematical formalization of that loop, precise enough that you can write algorithms against it.
      </Paragraph>

      <Paragraph delay={0.15}>
        To keep things concrete, this post leans on one running example throughout, a robot dropped onto a 3 by 3 grid. One cell is the goal and gives a nice reward for reaching it. Another cell is a hazard that costs the robot something if it wanders in. Small enough to reason about by hand, but rich enough that every idea below actually shows up in it.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={320}
        nodes={loopNodes}
        edges={loopEdges}
        phases={loopPhases}
        caption="The agent-environment loop every MDP formalizes. Observe, act, transition, repeat."
      />

      <Heading level={2} delay={0.2}>
        States, actions, and the rules of the world
      </Heading>

      <Paragraph delay={0.25}>
        An MDP is built from four ingredients, states, actions, transitions, and rewards. A <strong>state</strong> is a snapshot of the situation the agent is in, everything it needs to know to make a decision right now. An <strong>action</strong> is a choice the agent is allowed to make from that state. Together, states and actions describe what the agent can see and do. The other two pieces describe how the world reacts.
      </Paragraph>

      <Paragraph delay={0.3}>
        In the grid world, a state is just the robot's current cell. Label the cells by row and column, running from (1,1) in the top left to (3,3) in the bottom right. The goal sits at (3,3) and pays a reward of +10 the moment the robot steps onto it, then the episode ends there. The hazard sits dead center, at (2,2), and costs -5 the moment the robot steps into it, though the robot can still walk back out afterward. Every other move costs -1, a small penalty that rewards getting to the goal quickly instead of wandering forever.
      </Paragraph>

      <Paragraph delay={0.35}>
        The available actions are the obvious four, up, down, left, and right. If an action would push the robot off the grid, it just stays put, still paying the -1 step cost. This is a deterministic world, meaning a given action from a given state always leads to exactly one next state. That's a simplification for the sake of a clean example. Real environments are often stochastic instead, a self-driving car's steering command doesn't always produce the exact same motion, and a gust of wind can push a drone off its intended path.
      </Paragraph>

      <Paragraph delay={0.4}>
        The formal object that captures this is the <strong>transition function</strong>, written <Formula>{`P(s' | s, a)`}</Formula>. It's the probability of landing in state <Formula>{`s'`}</Formula> given that the agent was in state <Formula>{`s`}</Formula> and took action <Formula>{`a`}</Formula>. In a stochastic environment this can spread probability across several possible next states. In the deterministic grid world, it just puts all the probability, 100 percent of it, on a single outcome cell.
      </Paragraph>

      <Paragraph delay={0.45}>
        The last ingredient is the <strong>reward function</strong>, <Formula>{`R(s, a, s')`}</Formula>, the number of points the agent collects for that specific transition. It can depend on the starting state, the action, and the destination. In the grid world it mostly depends on the destination cell, -1 for an ordinary move, -5 for the hazard, +10 for the goal.
      </Paragraph>

      <Heading level={2} delay={0.5}>
        Why the Markov assumption is worth the trade
      </Heading>

      <Paragraph delay={0.55}>
        There's a hidden assumption baked into that transition function, and it's the one that gives Markov Decision Processes their name. <Formula>{`P(s' | s, a)`}</Formula> only takes the current state and action as input. It never looks at how the agent got to state <Formula>{`s`}</Formula> in the first place. That's the <strong>Markov assumption</strong>, the future depends only on the present, not on the full history that led there.
      </Paragraph>

      <Paragraph delay={0.6}>
        In the grid world this is easy to buy. Knowing the robot is at (2,1) tells you everything relevant about what happens if it moves right, regardless of whether it got there by going down twice or by some longer scenic route. But the assumption is a genuine simplification. A real customer support agent's next best action often depends on the whole conversation so far, not just the last message, and a trading agent's outlook can depend on months of trend, not just today's price. The usual fix is to fold that history into the state itself, so "state" becomes "the last five messages" rather than a single snapshot, which keeps the assumption technically true while staying useful. Without some version of this trick, an agent would have to consider every possible history separately, and the math would stop being tractable at any real scale.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        Policies and returns
      </Heading>

      <Paragraph delay={0.7}>
        A <strong>policy</strong>, written <Formula>{`\\pi`}</Formula>, is the agent's rule for behaving. Formally it's <Formula>{`\\pi(a | s)`}</Formula>, the probability of taking action <Formula>{`a`}</Formula> given state <Formula>{`s`}</Formula>. A policy can be deterministic (always move toward the goal) or stochastic (mostly move toward the goal, but occasionally explore a different direction). Either way, a policy is what turns the abstract MDP into an actual sequence of decisions.
      </Paragraph>

      <Paragraph delay={0.75}>
        Once the agent starts following a policy, it collects a stream of rewards over time, one per step. The <strong>return</strong> is just the total of those rewards over a full trajectory. But summing rewards plainly runs into a problem, if the agent could live forever, the return could grow without bound, and there'd be no way to compare one policy against another. The fix is a <strong>discount factor</strong>, <Formula>{`\\gamma`}</Formula>, a number between 0 and 1 that shrinks the value of rewards the further out they are.
      </Paragraph>

      <Formula block delay={0.8}>
        {`G_t = R_{t+1} + \\gamma R_{t+2} + \\gamma^2 R_{t+3} + \\dots = \\sum_{k=0}^{\\infty} \\gamma^k R_{t+k+1}`}
      </Formula>

      <Paragraph delay={0.85}>
        A reward one step away counts at full strength. Two steps away it counts at <Formula>{`\\gamma`}</Formula> times its face value, three steps away at <Formula>{`\\gamma^2`}</Formula>, and so on. Discounting exists for two reasons at once. The practical one is uncertainty, the agent is less sure what the world will look like far out, so it trusts nearby rewards more. The mathematical one is convergence, as long as <Formula>{`\\gamma`}</Formula> is strictly less than 1, that infinite sum adds up to a finite number instead of blowing up, which is what makes a well-behaved value for a state possible in the first place.
      </Paragraph>

      <Heading level={2} delay={0.9}>
        How good is a state, or a state-action pair
      </Heading>

      <Paragraph delay={0.95}>
        Given a policy, every state has a natural number attached to it, how much return the agent should expect from here on if it keeps following that policy. That's the <strong>value function</strong>, <Formula>{`V^\\pi(s)`}</Formula>, the expected return starting from state <Formula>{`s`}</Formula> and following <Formula>{`\\pi`}</Formula> from then on.
      </Paragraph>

      <Paragraph delay={1.0}>
        A close cousin is the <strong>action-value function</strong>, <Formula>{`Q^\\pi(s, a)`}</Formula>, the expected return if the agent starts in state <Formula>{`s`}</Formula>, is forced to take action <Formula>{`a`}</Formula> right now, and only then goes back to following <Formula>{`\\pi`}</Formula>. <Formula>{`V`}</Formula> tells you how good a place to be in is. <Formula>{`Q`}</Formula> tells you how good a specific move from that place is, exactly what you need when it's time to actually decide what to do next.
      </Paragraph>

      <Heading level={2} delay={1.05}>
        The Bellman equations
      </Heading>

      <Paragraph delay={1.1}>
        The value function has a wonderfully simple recursive structure, and it comes from a plain observation. The value of being in a state right now equals the immediate reward the agent would get, plus the discounted value of wherever it ends up next. That's the whole idea behind the <strong>Bellman expectation equation</strong>.
      </Paragraph>

      <Formula block delay={1.15}>
        {`V^\\pi(s) = \\sum_{a} \\pi(a|s) \\sum_{s'} P(s'|s,a) \\Big[ R(s,a,s') + \\gamma V^\\pi(s') \\Big]`}
      </Formula>

      <Paragraph delay={1.2}>
        Read from the outside in, the policy decides how likely each action is, the transition function decides where that action tends to lead, and once you land somewhere, the reward you just earned plus the discounted value of that new state is what you were really after. Sum all of that up, weighted by how likely each path is, and you get the value of the state you started in.
      </Paragraph>

      <Paragraph delay={1.25}>
        There's a second version for when the agent isn't following some arbitrary policy, but is playing as well as it possibly can. The <strong>Bellman optimality equation</strong> swaps the average over the policy's actions for a maximum over all of them.
      </Paragraph>

      <Formula block delay={1.3}>
        {`V^*(s) = \\max_{a} \\sum_{s'} P(s'|s,a) \\Big[ R(s,a,s') + \\gamma V^*(s') \\Big]`}
      </Formula>

      <Paragraph delay={1.35}>
        <Formula>{`V^*(s)`}</Formula> is the value of state <Formula>{`s`}</Formula> under the best policy there is, whatever that policy turns out to be. Instead of asking "what's the average outcome given how I currently pick actions," it asks "what's the best possible outcome if I always pick the action that leads to the highest value next state." Once you have <Formula>{`V^*`}</Formula> for every state, the optimal policy falls straight out of it, just always take whichever action achieves that maximum.
      </Paragraph>

      <Heading level={2} delay={1.4}>
        Policy evaluation and policy iteration
      </Heading>

      <Paragraph delay={1.45}>
        The Bellman expectation equation isn't just a nice identity, it's also an update rule. Start with a guess for <Formula>{`V(s)`}</Formula> at every state, plug the current guesses into the right-hand side of the equation, and get a slightly better guess back out. Do that over and over for every state, and the values gradually settle down. That process is called <strong>policy evaluation</strong>, repeatedly applying the Bellman expectation equation for a fixed policy until <Formula>{`V(s)`}</Formula> converges.
      </Paragraph>

      <Paragraph delay={1.5}>
        Notice what this requires. Computing that update needs the exact transition probabilities and the exact reward function for every state and action, the full model of the world. Methods that assume a complete, known model and use it to compute exact updates are called <strong>dynamic programming</strong>, a slightly odd name for what's really organized, repeated arithmetic. It's exactly what value iteration and policy iteration both are.
      </Paragraph>

      <Paragraph delay={1.55}>
        Policy evaluation only tells you how good the current policy is, it doesn't improve anything on its own. <strong>Policy iteration</strong> closes that loop by alternating two steps. First, run policy evaluation to compute <Formula>{`V(s)`}</Formula> for the current policy. Second, look at every state and greedily switch to whichever action looks best according to those freshly computed values, a step called policy improvement. Repeat both steps, evaluate the new policy, improve it again, until the policy itself stops changing between rounds. At that point it's provably optimal.
      </Paragraph>

      <Heading level={2} delay={1.6}>
        Value iteration in the grid world
      </Heading>

      <Paragraph delay={1.65}>
        Policy iteration works, but fully evaluating a policy before every single improvement step is wasteful, most of that work gets thrown away the moment the policy changes. <strong>Value iteration</strong> skips that step entirely and applies the Bellman optimality equation directly as the update rule, every sweep, for every state. It converges to the exact same optimal value function policy iteration would eventually find, and in practice it usually gets there faster.
      </Paragraph>

      <Paragraph delay={1.7}>
        Watching this run on the grid world makes it concrete. Start every state's value at zero. On the first sweep, only the two cells next to the goal, (2,3) and (3,2), see any change. Moving from either one straight into the goal earns the +10, so their values jump to 10.00 immediately. Every other state, including the far corner (1,1), only earns the ordinary -1 step cost this round, since none of their neighbors have a nonzero value yet to borrow from.
      </Paragraph>

      <Paragraph delay={1.75}>
        On the second sweep, that positive value spreads out by one more ring of cells, and something worth noticing happens. The hazard cell at (2,2) updates to 8.00, not some deeply negative number. Its own value is fine, because once the robot is standing there, its best move is to step onto one of its now-valuable neighbors. The -5 penalty only applies to the transition of stepping into the hazard, not to standing in it. That's exactly why a neighboring cell like (1,2) ends up avoiding the hazard on purpose, moving into it means paying -5 and landing on an 8.00-value cell for a net of 2.2, worse than the 6.2 net of moving sideways instead.
      </Paragraph>

      <Diagram
        delay={0.08}
        caption="Value estimates before and after value iteration. All zero at the start, then a full gradient converging on the goal after four sweeps. The goal cell shows 0.00 because it's terminal, once the robot arrives there's nothing left to add. The hazard cell (highlighted) ends up worth 8.00, not negative, because its own value only reflects moves out of it."
      >
        <div className="w-full grid sm:grid-cols-2 gap-6">
          <div className="flex flex-col items-center gap-2">
            <p className="font-sans text-sm font-semibold text-foreground">Initial estimates (sweep 0)</p>
            <div className="grid grid-cols-3 gap-1.5">
              {["0.00", "0.00", "0.00", "0.00", "0.00", "0.00", "0.00", "0.00", "0.00"].map((v, i) => (
                <div
                  key={i}
                  className="w-16 h-16 flex items-center justify-center rounded-md border border-border bg-background text-foreground font-mono text-sm"
                >
                  {v}
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="font-sans text-sm font-semibold text-foreground">Converged (sweep 4)</p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { v: "4.58", kind: "normal" },
                { v: "6.20", kind: "normal" },
                { v: "8.00", kind: "normal" },
                { v: "6.20", kind: "normal" },
                { v: "8.00", kind: "hazard" },
                { v: "10.00", kind: "normal" },
                { v: "8.00", kind: "normal" },
                { v: "10.00", kind: "normal" },
                { v: "0.00", kind: "goal" },
              ].map((cell, i) => (
                <div
                  key={i}
                  className={`w-16 h-16 flex items-center justify-center rounded-md border font-mono text-sm ${
                    cell.kind === "goal"
                      ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-500/60 dark:bg-emerald-950/40 dark:text-emerald-300"
                      : cell.kind === "hazard"
                      ? "border-rose-400 bg-rose-50 text-rose-700 dark:border-rose-500/60 dark:bg-rose-950/40 dark:text-rose-300"
                      : "border-border bg-background text-foreground"
                  }`}
                >
                  {cell.v}
                </div>
              ))}
            </div>
          </div>
        </div>
      </Diagram>

      <Paragraph delay={1.8}>
        The far corner, (1,1), is the slowest to update, and that's not a coincidence. It's four moves from the goal, and value iteration only lets information travel one cell per sweep, so it takes four sweeps before the goal's pull reaches it. Its value crawls from 0 to -1.00 to -1.90 to -2.71, still negative each time, then jumps to its final 4.58 once a real path to the goal is visible from there. After that fourth sweep, every value on the grid stops moving. That's convergence, and it's the same number policy iteration would have found eventually, just by a more roundabout path.
      </Paragraph>

      <Heading level={2} delay={1.85}>
        Takeaways
      </Heading>

      <List delay={1.9}>
        <ListItem>An MDP is states, actions, transitions, and rewards, with the Markov assumption saying the future only depends on the current state, not the history behind it.</ListItem>
        <ListItem>Returns sum up rewards over time, and a discount factor keeps that sum finite while also favoring nearer-term rewards over uncertain distant ones.</ListItem>
        <ListItem>Value functions and action-value functions turn "how good is this" into a number, and the Bellman equations show how that number for one state depends on the values of the states that follow it.</ListItem>
        <ListItem>Policy evaluation, policy iteration, and value iteration are all dynamic programming, they all assume a fully known model of the world and use it to compute exact values, they just differ in how directly they chase the optimal policy.</ListItem>
        <ListItem>Value iteration skips fully evaluating a policy at every round and applies the Bellman optimality update directly, usually reaching the same answer faster.</ListItem>
      </List>

      <Paragraph delay={1.95}>
        None of this works yet for anything realistic, because it assumes the agent already knows the transition probabilities and reward function ahead of time, which is rarely true outside of a toy grid. Closing that gap, learning from experience instead of a known model, is what the next layer of reinforcement learning is built for. But the vocabulary stays the same, states, returns, value functions, the Bellman equations are the language every algorithm built on top of them still speaks. Thanks for reading.
      </Paragraph>
    </>
  ),
};
