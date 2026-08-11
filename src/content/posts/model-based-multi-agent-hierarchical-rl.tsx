import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  ReplicationDiagram,
} from "../components";
import { Globe, Brain, Shuffle, Compass } from "lucide-react";

const planningNodes: DiagramNode[] = [
  { id: "real-env", label: "Real environment", sub: "the actual system", icon: Globe, color: "text-slate-500", x: 15, y: 50 },
  { id: "dynamics-model", label: "Learned dynamics model", sub: "predicts next state + reward", icon: Brain, color: "text-purple-500", x: 38, y: 20 },
  { id: "rollouts", label: "Imagined rollouts", sub: "simulated ahead, inside the model", icon: Shuffle, color: "text-indigo-500", x: 62, y: 20 },
  { id: "planner", label: "Planner", sub: "picks the best simulated plan", icon: Compass, color: "text-emerald-500", x: 85, y: 50 },
];

const planningEdges: DiagramEdge[] = [
  { id: "e-env-model", from: "real-env", to: "dynamics-model" },
  { id: "e-model-rollouts", from: "dynamics-model", to: "rollouts" },
  { id: "e-rollouts-planner", from: "rollouts", to: "planner" },
  { id: "e-planner-env", from: "planner", to: "real-env" },
];

export const modelBasedMultiAgentHierarchicalRl: BlogPostData = {
  title: "Model-Based, Multi-Agent, and Hierarchical RL",
  date: "August 10, 2026",
  slug: "model-based-multi-agent-hierarchical-rl",
  content: (
    <>
      <Paragraph delay={0.10}>
        Every reinforcement learning method covered so far shares one property, it is model-free. The agent tries an action, sees what reward comes back, and slowly gets better at picking actions that lead to more reward. It never builds an explicit picture of how the world actually works, just a policy or a value function that reacts well to it. That is a genuinely good strategy, but it leaves a few useful ideas on the table.
      </Paragraph>

      <Paragraph delay={0.15}>
        Three of those ideas show up constantly once reinforcement learning leaves toy environments and starts running warehouses, playing complex games, or controlling real robots. An agent can learn a model of its environment and think ahead inside it instead of only reacting. It can learn to operate at a higher level of abstraction instead of choosing one primitive action at a time. And it can share its environment with other learning agents, cooperating or competing with them. Each idea is a fairly self-contained extension to the basic loop, worth taking one at a time.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Learning a model of the world
      </Heading>

      <Paragraph delay={0.25}>
        Model-based reinforcement learning adds one new piece to the picture, a <strong>dynamics model</strong>. A dynamics model is a learned function that predicts what happens next, given the current state and the action taken, it outputs a prediction of the next state and the reward. Once an agent has that, it does not have to try something in the real world just to find out what happens. It can ask the model instead.
      </Paragraph>

      <Paragraph delay={0.30}>
        The general term for a learned model of the environment used this way is a <strong>world model</strong>. A world model does not choose actions on its own, it just simulates consequences. Something else, a planner or a policy, uses those simulated consequences to decide what to actually do.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Planning before acting
      </Heading>

      <Paragraph delay={0.40}>
        Having a world model unlocks planning, mentally rolling out a sequence of actions inside the model before committing to a real one. A chess player who thinks several moves ahead is doing something similar, working out how a move is likely to play out before making it on the board. An agent with a world model can simulate many of these imagined rollouts, compare how each one turns out, and only then act for real.
      </Paragraph>

      <Paragraph delay={0.45}>
        This is where the practical win comes from. A real interaction with the environment, a robot arm actually moving, a real user actually clicking, costs time and sometimes money. An imagined rollout inside a learned model costs almost nothing, it is just a forward pass through a neural network. Model-based methods can therefore be far more sample-efficient than model-free ones. They get more out of each real interaction because a lot of the learning happens inside imagined rollouts instead.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={380}
        nodes={planningNodes}
        edges={planningEdges}
        caption="The model-based planning loop. The dynamics model turns real experience into imagined rollouts, the planner picks the best one, and only then does a real action go back into the environment."
      />

      <Paragraph delay={0.50}>
        That efficiency comes with a real catch. A plan is only as good as the model it is built on, and a learned dynamics model is never perfectly accurate everywhere. If the model is wrong about some region of the state space, maybe it has never seen anything quite like the current situation, planning against it can produce a confident, well-reasoned plan that is confidently wrong. This failure mode has a name, <strong>model bias</strong>, and it is the central risk of model-based reinforcement learning. A model-free agent that is occasionally clumsy is often safer than a model-based one that is smoothly, decisively wrong.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        Options and temporal abstraction
      </Heading>

      <Paragraph delay={0.60}>
        Every method discussed before this section, model-based or not, picks one primitive action at every single timestep. A robot decides on a motor command, a game-playing agent decides on a button press, over and over, thousands of times per episode. Hierarchical reinforcement learning changes what the agent is allowed to choose. Instead of a primitive action, it chooses among <strong>options</strong>, higher-level, multi-step behaviors that run on their own for a while before control gets handed back.
      </Paragraph>

      <List delay={0.65}>
        <ListItem><strong>Primitive actions.</strong> Move one joint by two degrees, press one button, apply this much torque, chosen fresh at every timestep.</ListItem>
        <ListItem><strong>Options.</strong> Navigate to the kitchen, open the fridge, pour a drink, each one a multi-step behavior that runs for a while before the agent has to decide anything again.</ListItem>
      </List>

      <Paragraph delay={0.70}>
        Picture a household robot to see the difference. A flat, model-free policy would have to choose a motor command for every joint at every timestep, all the way from the living room to the kitchen. A hierarchical agent instead picks the option navigate to the kitchen, lets that option run its course (whatever lower-level controller handles walking and steering takes care of the details), and only steps back in to decide when to switch options, maybe once the robot arrives and needs to pick open the fridge next.
      </Paragraph>

      <Paragraph delay={0.75}>
        This buys two things. It breaks one long, hard task into a series of shorter, easier sub-problems, deciding among a handful of options every so often is a much smaller decision than deciding among every possible motor command every millisecond. And a well-learned option like navigate to the kitchen is reusable. A different task that also happens to need the robot in the kitchen can reuse that same option instead of relearning the entire skill of walking and steering from scratch.
      </Paragraph>

      <Heading level={2} delay={0.80}>
        When more than one agent is learning
      </Heading>

      <Paragraph delay={0.85}>
        Everything so far assumes one agent alone in its environment. Multi-agent reinforcement learning drops that assumption. More than one learning agent shares the same environment at the same time, and each one is trying to maximize its own reward.
      </Paragraph>

      <Paragraph delay={0.90}>
        What that looks like depends heavily on whether the agents want the same thing. In a cooperative setting, multiple agents share a common goal, a fleet of warehouse robots all trying to get packages picked and shipped as fast as possible benefits every robot equally when the whole fleet coordinates well. In a competitive or adversarial setting, agents have opposing goals, the two players in a two-player game each want the other to lose, so one agent's gain is the other's loss.
      </Paragraph>

      <Heading level={2} delay={0.95}>
        Training together, acting alone
      </Heading>

      <Paragraph delay={1.00}>
        Multi-agent settings usually lean on one particular trick, <strong>centralized training with decentralized execution</strong>. During training, every agent gets updated together with access to global information, the full state of the environment and what every other agent is doing. That extra visibility makes the learning problem far more stable and tractable, because each agent's updates can account for what everyone else is doing instead of guessing blind.
      </Paragraph>

      <ReplicationDiagram
        delay={0.08}
        panels={[
          {
            title: "Training time",
            writeLabel: "Centralized trainer",
            fanLabel: "has access to",
            nodes: ["Global state", "Every agent's observations"],
            highlightNodes: [0, 1],
            note: "Learning is stable because the trainer sees the whole environment, not just one agent's slice of it.",
          },
          {
            title: "Execution time",
            writeLabel: "Each agent, deployed",
            fanLabel: "has access to only",
            nodes: ["Its own local observation"],
            note: "In the real world an agent never gets the global view it trained with, so it acts on local information alone.",
          },
        ]}
      />

      <Paragraph delay={1.05}>
        Once deployed, that global view disappears. Each agent has to act using only its own local observations, a warehouse robot can see what its own sensors report, not a live feed of every other robot in the building. Decentralized execution just means training uses information the deployed system will not actually have, while execution respects the limits the real system will actually face.
      </Paragraph>

      <Paragraph delay={1.10}>
        Multi-agent learning also breaks an assumption single-agent methods lean on heavily, that the environment itself is a fixed thing to learn about. From any single agent's point of view here, the environment is not just the physics of the world, it also includes every other agent, and every other agent is itself learning and changing its own behavior over time. That means the environment a given agent experiences is a moving target rather than a fixed one. This is called <strong>non-stationarity</strong>, and it matters because a lot of the convergence guarantees single-agent reinforcement learning methods rely on assume a stationary environment, an assumption multi-agent training routinely breaks.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        The sim-to-real gap
      </Heading>

      <Paragraph delay={1.20}>
        Model-based and multi-agent methods share a practical problem once anyone tries to actually deploy them, especially anywhere involving physical robots or otherwise expensive real-world interaction. Training directly in the real world is slow, expensive, and sometimes dangerous, so most of this gets trained in simulation first, because a simulator is cheap to run and safe to fail in.
      </Paragraph>

      <Paragraph delay={1.25}>
        The catch is that a simulator is itself a model, an approximate one, no more perfectly accurate than the dynamics model from earlier in this post. A policy that performs beautifully in simulation can fail once it touches the real system, because of small mismatches the simulator never captured, friction the simulated physics got slightly wrong, sensor noise the simulation never modeled, latency between deciding and acting that only shows up on real hardware. This gap between simulated performance and real performance has a name, the <strong>sim-to-real gap</strong>, and it shows up constantly in robotics.
      </Paragraph>

      <Paragraph delay={1.30}>
        Two mitigations come up often. <strong>Domain randomization</strong> trains the policy across many randomized variations of the simulation, different friction values, different sensor noise, different lighting, so it never overfits to one simulator's exact quirks and generalizes better to whatever the real system throws at it. Fine-tuning on a small amount of real data lets the policy correct for whatever domain randomization did not fully cover, without needing anywhere near as much real-world interaction as training from scratch would.
      </Paragraph>

      <Heading level={2} delay={1.35}>
        Takeaways
      </Heading>

      <List delay={1.40}>
        <ListItem>Model-based RL learns a dynamics model, then plans by simulating rollouts inside it before acting for real, at the cost of model bias if the model is wrong.</ListItem>
        <ListItem>Hierarchical RL replaces primitive-action choices with options, higher-level multi-step behaviors that break a task into reusable sub-problems.</ListItem>
        <ListItem>Multi-agent RL adds cooperation or competition between agents, usually trained centrally but executed with only local information.</ListItem>
        <ListItem>Non-stationarity in multi-agent settings comes from every other agent also learning and changing, which breaks single-agent convergence guarantees.</ListItem>
        <ListItem>The sim-to-real gap means a policy trained in simulation can still fail on real hardware, domain randomization and fine-tuning on real data are the usual fixes.</ListItem>
      </List>

      <Paragraph delay={1.45}>
        None of these three ideas are mutually exclusive, either. A fleet of warehouse robots might plan multi-step routes through learned options, keep a model of how the warehouse floor changes over the day, and coordinate through centralized training, all in the same system. The core loop underneath all of it is still the same one, try something, see what reward comes back, get better. These three ideas just decide what the agent is allowed to try, how far ahead it can think, and who else is in the room while it learns. Thanks for reading.
      </Paragraph>
    </>
  ),
};
