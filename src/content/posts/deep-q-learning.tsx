import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  CodeBlock,
  Formula,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  DiagramPhase,
  ReplicationDiagram,
} from "../components";
import { Gamepad2, Database, Shuffle, Cpu, Lock, Activity, RefreshCw } from "lucide-react";

const loopNodes: DiagramNode[] = [
  { id: "env", label: "Environment", sub: "produces a transition", icon: Gamepad2, color: "text-slate-500", x: 8, y: 50 },
  { id: "buffer", label: "Replay buffer", sub: "stores past transitions", icon: Database, color: "text-blue-500", x: 25, y: 50 },
  { id: "batch", label: "Sampled batch", sub: "random mini-batch", icon: Shuffle, color: "text-indigo-500", x: 42, y: 50 },
  { id: "online", label: "Online Q-network", sub: "computes current values", icon: Cpu, color: "text-emerald-500", x: 58, y: 22 },
  { id: "target", label: "Target network", sub: "frozen copy, sets the target", icon: Lock, color: "text-orange-500", x: 58, y: 78 },
  { id: "loss", label: "TD loss", sub: "squared error", icon: Activity, color: "text-rose-500", x: 75, y: 50 },
  { id: "update", label: "Gradient step", sub: "updates the online network", icon: RefreshCw, color: "text-emerald-600", x: 92, y: 50 },
];

const loopEdges: DiagramEdge[] = [
  { id: "e-env-buffer", from: "env", to: "buffer" },
  { id: "e-buffer-batch", from: "buffer", to: "batch" },
  { id: "e-batch-online", from: "batch", to: "online" },
  { id: "e-batch-target", from: "batch", to: "target" },
  { id: "e-online-loss", from: "online", to: "loss" },
  { id: "e-target-loss", from: "target", to: "loss" },
  { id: "e-loss-update", from: "loss", to: "update" },
];

const loopPhases: DiagramPhase[] = [
  { nodeIds: ["env"], edgeIds: [], note: "The agent acts in the environment, producing one transition, a state, an action, a reward, and the next state." },
  { nodeIds: ["env", "buffer"], edgeIds: ["e-env-buffer"], note: "That transition gets stored in a large replay buffer instead of being used once and thrown away." },
  { nodeIds: ["env", "buffer", "batch"], edgeIds: ["e-env-buffer", "e-buffer-batch"], note: "A random mini-batch gets sampled from the buffer for training, not the live stream of experience." },
  { nodeIds: ["env", "buffer", "batch", "online", "target"], edgeIds: ["e-env-buffer", "e-buffer-batch", "e-batch-online", "e-batch-target"], note: "The online network scores the batch with its current weights, while a frozen target network computes what those scores should become." },
  { nodeIds: ["env", "buffer", "batch", "online", "target", "loss"], edgeIds: ["e-env-buffer", "e-buffer-batch", "e-batch-online", "e-batch-target", "e-online-loss", "e-target-loss"], note: "The gap between the two becomes the TD loss." },
  { nodeIds: ["env", "buffer", "batch", "online", "target", "loss", "update"], edgeIds: ["e-env-buffer", "e-buffer-batch", "e-batch-online", "e-batch-target", "e-online-loss", "e-target-loss", "e-loss-update"], note: "A gradient step updates the online network. Every so often, the target network's weights get synced back to match it, then the loop repeats." },
];

export const deepQLearning: BlogPostData = {
  title: "Deep Q-Learning",
  date: "August 10, 2026",
  slug: "deep-q-learning",
  content: (
    <>
      <Paragraph delay={0.10}>
        Tabular Q-learning keeps one number for every state-action pair, the estimated value <Formula>{`Q(s, a)`}</Formula> of taking action <Formula>{`a`}</Formula> in state <Formula>{`s`}</Formula>. That works fine when the number of states is small enough to fit in a table, a grid world, a handful of board positions, a toy inventory problem. It falls apart the moment the state space stops being small. A video game's screen is a grid of raw pixels, millions of possible frames. A robot's state is a vector of continuous sensor readings, infinitely many possible values. There is no table big enough, and even if there were, the agent would visit almost every entry exactly once and never see it again.
      </Paragraph>

      <Paragraph delay={0.15}>
        Deep Q-learning, usually shortened to DQN, solves this by replacing the table with a neural network. Instead of looking up <Formula>{`Q(s, a)`}</Formula> in a dictionary, the agent computes it by running the state through a network with weights <Formula>{`\\theta`}</Formula>, written <Formula>{`Q_{\\theta}(s, a)`}</Formula>. A network trained on some states generalizes to states it has never seen, because similar-looking inputs produce similar outputs. That generalization is the entire point, and it is also where most of the real difficulty in this post comes from.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Why the naive version falls apart
      </Heading>

      <Paragraph delay={0.25}>
        It is tempting to just swap in a neural network and keep the same Q-learning update, compute a target using the reward plus the discounted value of the next state, then take a gradient step to move the network's prediction closer to that target. Try this directly and training is unstable, often diverging outright. Two reasons explain why, and neither one shows up in ordinary supervised learning.
      </Paragraph>

      <Paragraph delay={0.30}>
        The first reason is the data. Supervised learning assumes training examples are drawn independently. An agent playing a game does not produce independent examples, it produces one long trajectory, and consecutive frames in that trajectory look almost identical. Training on them in order means the network sees a long run of nearly-duplicate examples, then a long run from a completely different part of the game, over and over. That correlated stream biases every gradient step toward whatever the agent happens to be doing right now.
      </Paragraph>

      <Paragraph delay={0.35}>
        The second reason is the target itself. In ordinary regression, the label for a training example is fixed, it does not change while the model trains. In Q-learning the regression target is built from the network's own current output, one state ahead. Every gradient step that changes the network's weights also changes the target the very next step is trying to hit. Chasing a target that moves every time you take a step toward it is a recipe for oscillation, and that is exactly what plain Q-learning with a neural network does.
      </Paragraph>

      <Heading level={2} delay={0.40}>
        Fix one, the replay buffer
      </Heading>

      <Paragraph delay={0.45}>
        The fix for the correlated-data problem is called an experience replay buffer. Instead of training on each transition once, right after it happens, the agent stores every transition, the state, the action taken, the reward received, and the next state, into a large buffer. Training then samples a random mini-batch from that buffer, mixing transitions from many different points in the agent's history into a single batch.
      </Paragraph>

      <Paragraph delay={0.50}>
        Random sampling breaks the correlation between consecutive frames, since a batch drawn from a buffer holding the last few hundred thousand transitions no longer looks like one continuous stream. It also has a second benefit that has nothing to do with stability. Old transitions do not get thrown away after one use, they can be sampled again and again, so the agent squeezes more training signal out of the same amount of real interaction with the environment. That reuse is a meaningful gain in sample efficiency, a term that just means how much learning an agent extracts per unit of experience it collects.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        Fix two, the target network
      </Heading>

      <Paragraph delay={0.60}>
        The moving-target problem needs a different fix. DQN keeps a second copy of the Q-network, called the target network, with its own set of weights <Formula>{`\\theta^-`}</Formula>. This copy is used only to compute the regression target, never to choose actions or receive gradients directly. Its weights stay frozen for a stretch of training and then get updated, either by copying the online network's weights over every few thousand steps, or by nudging them slowly toward the online network's weights every step.
      </Paragraph>

      <Paragraph delay={0.65}>
        The target for a transition becomes <Formula>{`r + \\gamma \\max_{a'} Q_{\\theta^-}(s', a')`}</Formula>, using the frozen weights <Formula>{`\\theta^-`}</Formula> instead of the online weights <Formula>{`\\theta`}</Formula> that are actually being trained. Because the target network only changes occasionally, the regression target stops shifting on every single gradient step. The online network gets to chase a target that sits still for a while, which is a much easier problem than chasing one that moves every time it gets closer.
      </Paragraph>

      <ReplicationDiagram
        delay={0.08}
        panels={[
          {
            title: "Plain Q-learning with a neural net",
            writeLabel: "Latest transition",
            fanLabel: "trains directly on",
            nodes: ["Single Q-network"],
            note: "Every step trains on the freshest transition, and that same network sets its own target. The target shifts every step.",
          },
          {
            title: "DQN",
            writeLabel: "Random batch",
            fanLabel: "trains on",
            nodes: ["Replay buffer", "Online network", "Target network"],
            highlightNodes: [0, 2],
            note: "Batches come from a large buffer of past transitions, and a frozen copy of the network sets a target that holds still for a while.",
          },
        ]}
      />

      <Paragraph delay={0.70}>
        Both fixes are visible in the full training loop below, and it is worth seeing them run together, since neither one alone is enough to stabilize training.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={380}
        nodes={loopNodes}
        edges={loopEdges}
        phases={loopPhases}
        caption="The DQN training loop. A random batch flows to two networks at once, an online network that gets trained and a frozen target network that sets the target it trains against."
      />

      <Heading level={2} delay={0.75}>
        Choosing actions while training, the exploration schedule
      </Heading>

      <Paragraph delay={0.80}>
        Networks and buffers solve how the agent learns from data, but there is still a question of which actions to take while collecting that data in the first place. An agent that always picks the action its current network thinks is best will lock onto whatever looks good early on and never discover that a different action was actually better. An agent that always picks randomly never uses anything it has learned.
      </Paragraph>

      <Paragraph delay={0.85}>
        DQN handles this with an epsilon-greedy schedule, the same exploration idea tabular Q-learning already uses, just applied on top of a network instead of a table. With probability <Formula>{`\\epsilon`}</Formula>, the agent takes a random action, otherwise it takes whatever action its current Q-network ranks highest. Early in training <Formula>{`\\epsilon`}</Formula> starts near 1, so the agent explores broadly and gathers experience about parts of the environment it has not seen. Over the course of training <Formula>{`\\epsilon`}</Formula> decays down to some small value, often around 0.05, so the agent shifts toward exploiting what it has actually learned rather than continuing to act at random forever.
      </Paragraph>

      <Heading level={2} delay={0.90}>
        The overestimation problem, and Double DQN
      </Heading>

      <Paragraph delay={0.95}>
        Even with a replay buffer and a target network, DQN has a subtler bias baked into its update rule. The target uses a max over next-state actions, and a max operator is not neutral, it systematically favors whichever action currently looks best according to the network's own noisy estimates. If several actions have similar true value, but the network's estimates for them are a little too high or too low just from ordinary training noise, the max operator tends to pick the one that happens to be overestimated. Averaged across many updates, that pushes Q-values up on the whole, an effect called overestimation bias.
      </Paragraph>

      <Paragraph delay={1.00}>
        Double DQN fixes this by splitting the max operator's two jobs apart. Picking which action looks best and judging how good that specific action actually is do not have to be done by the same network. Double DQN uses the online network to pick the action, then uses the target network only to evaluate the value of that already-chosen action. Decoupling selection from evaluation this way removes most of the systematic upward bias, since the network that picked the action is no longer the same one grading its own pick.
      </Paragraph>

      <Heading level={2} delay={1.05}>
        Splitting the network, Dueling DQN
      </Heading>

      <Paragraph delay={1.10}>
        A separate improvement targets the network's architecture rather than the update rule. Dueling DQN splits the network into two streams after a shared set of early layers that extract features from the state. One stream outputs a single number, <Formula>{`V(s)`}</Formula>, an estimate of how good the state itself is, regardless of which action gets taken. The other stream outputs one number per action, <Formula>{`A(s, a)`}</Formula>, the advantage of each action relative to the others in that state. The two streams get combined to produce the familiar <Formula>{`Q(s, a)`}</Formula>.
      </Paragraph>

      <Paragraph delay={1.15}>
        The benefit shows up in states where the choice of action barely matters. Picture a self-driving car cruising down an empty straight highway, steering slightly left or slightly right makes almost no difference. A plain DQN still has to learn a separate, accurate value for every action in that state. A dueling network can instead learn one good estimate of <Formula>{`V(s)`}</Formula>, that this stretch of road is safe and valuable, and let the small advantage stream handle the minor differences between actions. Separating "how good is this state" from "which action is best here" turns out to make learning noticeably more efficient, especially in states where many actions are roughly interchangeable.
      </Paragraph>

      <Heading level={2} delay={1.20}>
        Prioritized replay, learning more from the transitions that matter
      </Heading>

      <Paragraph delay={1.25}>
        The replay buffer as first described samples uniformly at random, every stored transition has an equal chance of being picked for the next batch. That treats a transition the network already predicts well the same as one it gets badly wrong, even though the second one clearly has more to teach the network.
      </Paragraph>

      <Paragraph delay={1.30}>
        Prioritized replay changes the sampling rule. Every transition gets a priority based on its TD error, the size of the gap between the network's prediction and the target it was supposed to hit. Transitions with a larger TD error get sampled more often, because a big gap means the network is currently wrong about that transition and stands to learn the most from revisiting it. Sampling is no longer uniform, which introduces a subtle problem. If the training distribution no longer matches the true distribution of experience, the gradient estimates become biased toward whatever gets oversampled. Prioritized replay corrects for this with an importance-sampling weight applied to each sampled transition, downweighting the transitions that got picked more often than a uniform sample would have picked them, so the update stays statistically honest despite the skewed sampling.
      </Paragraph>

      <CodeBlock
        delay={1.35}
        language="Python"
        code={`import torch
import torch.nn.functional as F

def dqn_loss(q_net, target_net, states, actions, rewards, next_states, dones, gamma=0.99, double=True):
    # Current network's estimate for the action actually taken
    q_values = q_net(states).gather(1, actions.unsqueeze(1)).squeeze(1)

    with torch.no_grad():
        if double:
            # Online network picks the action, target network evaluates it
            best_actions = q_net(next_states).argmax(dim=1)
            next_q = target_net(next_states).gather(1, best_actions.unsqueeze(1)).squeeze(1)
        else:
            next_q = target_net(next_states).max(dim=1).values

        target = rewards + gamma * next_q * (1 - dones)

    return F.mse_loss(q_values, target)`}
      />

      <Paragraph delay={1.40}>
        That's the entire loss, Double DQN switch included. Everything else in a real DQN implementation, the replay buffer, the epsilon schedule, the periodic target sync, is plumbing around this core computation.
      </Paragraph>

      <Paragraph delay={1.45}>
        Stack all of these pieces up and a pattern becomes clear. DQN did not add the replay buffer, the target network, Double DQN, Dueling DQN, and prioritized replay as optional extras, it needed the first two just to train at all without diverging, and it needed the rest to fix real, measurable weaknesses that remained even after training became stable. Even with every fix in place, DQN is typically far less sample-efficient than tabular Q-learning on the small problems where a table is actually an option, it needs far more experience to reach the same quality of policy. That cost is the price of trading a table that memorizes for a network that generalizes, and it is a trade worth making the moment the state space is too big for a table to exist in the first place.
      </Paragraph>

      <Heading level={2} delay={1.50}>
        Takeaways
      </Heading>

      <List delay={1.55}>
        <ListItem>Function approximation swaps the Q-table for a neural network <Formula>{`Q_{\\theta}(s, a)`}</Formula>, trading memorization for generalization across similar states.</ListItem>
        <ListItem>Naive neural-net Q-learning is unstable because training data is a correlated trajectory and the regression target depends on the same network being updated. The replay buffer fixes the first problem, the target network fixes the second.</ListItem>
        <ListItem>An epsilon-greedy schedule that decays from mostly random to mostly greedy balances exploring the environment early against exploiting what the agent has already learned.</ListItem>
        <ListItem>Double DQN reduces overestimation bias by using the online network to pick an action and the target network to evaluate it. Dueling DQN separates state value from action advantage, which helps most in states where many actions are roughly equal.</ListItem>
        <ListItem>Prioritized replay samples high-TD-error transitions more often for a stronger learning signal, with importance-sampling weights keeping the update statistically unbiased.</ListItem>
      </List>

      <Paragraph delay={1.60}>
        None of these fixes are exotic. Each one solves a specific, nameable failure that shows up the moment a table gets replaced with a function. Once they click into place, the same idea that made tabular Q-learning work, estimate the value of an action, chase a better estimate, repeat, scales up to environments no table could ever hold. Thanks for reading.
      </Paragraph>
    </>
  ),
};
