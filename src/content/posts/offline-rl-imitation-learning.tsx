import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  List,
  ListItem,
  ReplicationDiagram,
} from "../components";
import { DistributionShiftDiagram } from "../components/animations/offline-rl-imitation-learning/ConceptViz";

export const offlineRlImitationLearning: BlogPostData = {
  title: "Offline Reinforcement Learning and Imitation Learning",
  date: "August 10, 2026",
  slug: "offline-rl-imitation-learning",
  content: (
    <>
      <Paragraph delay={0.10}>
        Every reinforcement learning setup covered so far has assumed one thing without saying it out loud. The agent can act, watch what happens, and update, over and over, for as long as training takes. That's fine inside a simulator, where a bad move just wastes an episode. It works much worse in a hospital, a trading system, a self-driving car, or a factory floor, where letting an untrained agent try things at random is unsafe, expensive, or simply not allowed.
      </Paragraph>

      <Paragraph delay={0.15}>
        Offline reinforcement learning and imitation learning are the answer to that constraint. Both learn a policy from a fixed dataset of past experience, recorded before training ever starts, with zero live interaction with the real environment along the way. The dataset is everything. Whatever behavior it contains is what a policy can learn from, and whatever it doesn't contain stays permanently out of reach.
      </Paragraph>

      <ReplicationDiagram
        delay={0.08}
        panels={[
          {
            title: "Online RL",
            writeLabel: "Policy",
            fanLabel: "interacts live with",
            nodes: ["Environment", "Fresh reward each step"],
            highlightNodes: [0],
            note: "Every update comes from an action the current policy just took.",
          },
          {
            title: "Offline RL",
            writeLabel: "Policy",
            fanLabel: "trains only against",
            nodes: ["Frozen dataset", "No environment access"],
            highlightNodes: [0],
            note: "Every update comes from a dataset collected before training ever started.",
          },
        ]}
      />

      <Heading level={2} delay={0.20}>
        Demonstrations, the raw material
      </Heading>

      <Paragraph delay={0.25}>
        Both families start from the same kind of data, a set of demonstrations. A demonstration is just a recorded trajectory, a sequence of states and the actions taken in them, gathered from some existing source. That source might be a human expert driving a car, a hand-tuned industrial controller, or an older, worse version of the policy being replaced. The dataset is a pile of these trajectories, and nothing else is available during training.
      </Paragraph>

      <Paragraph delay={0.30}>
        Concretely, a single row of that dataset for a driving policy might look like a snapshot of the car's speed, lane position, and nearby traffic, paired with the steering and braking input the human driver actually chose in that moment. Multiply that by millions of moments across thousands of drives and there's the training set. No simulator, no live car, just logs of what already happened.
      </Paragraph>

      <Paragraph delay={0.35}>
        The obvious question is what to do with a pile of recorded behavior and no reward signal required at all. The simplest possible answer is imitation learning.
      </Paragraph>

      <Heading level={2} delay={0.40}>
        Behavior cloning, imitation as supervised learning
      </Heading>

      <Paragraph delay={0.45}>
        <strong>Behavior cloning</strong> is the most direct method in this whole family, and it barely feels like reinforcement learning at all. Frame it as an ordinary supervised learning problem. Given a state, predict the action the expert took in that exact state. That's the entire training signal, matching the expert's choices as closely as possible.
      </Paragraph>

      <Paragraph delay={0.50}>
        There's no reward function anywhere in this setup. No return to maximize, no credit assignment across a trajectory, none of the usual reinforcement learning machinery. Behavior cloning trains a policy the same way an image classifier gets trained, feed in an input, compare the predicted output to a label, backpropagate the difference. The labels just happen to be the expert's actions instead of class names.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        Distribution shift and the compounding error problem
      </Heading>

      <Paragraph delay={0.60}>
        Behavior cloning works, but it has a well known failure mode. The expert's demonstrations only ever show what a competent expert does. They never show what happens after a small mistake, because the expert doesn't make that mistake. Train a policy on that data and its first real test happens outside the training distribution, the moment it does something even slightly different from what the expert would have done.
      </Paragraph>

      <Paragraph delay={0.65}>
        That's called <strong>distribution shift</strong>, the states the policy actually visits at deployment time drift away from the states its training data covered. Once it's a little off, its next prediction is a little less reliable too, because it's now guessing in territory the expert never demonstrated. That next guess pushes it further off still. Over a long enough trajectory these small errors compound, and a policy that looked fine on individual predictions can end up badly lost by the end of an episode.
      </Paragraph>

      <DistributionShiftDiagram
        delay={0.08}
        caption="The dataset covers a band of states around the expert's path. The learned policy tracks it closely at first, then a small error nudges it outside the band, and the gap keeps growing."
      />

      <Paragraph delay={0.70}>
        This exact problem motivated an interactive fix called DAgger, short for Dataset Aggregation. Instead of training once on a fixed expert dataset and hoping for the best, DAgger lets the partially trained policy run, watches which states it actually visits, and asks the expert to label the correct action in those specific states. Those corrections get added back into the training set, and the policy trains again. Repeat a few rounds and the training data starts covering the states the policy actually ends up in, not just the states the expert happened to visit.
      </Paragraph>

      <Heading level={2} delay={0.75}>
        Dataset coverage, the ceiling under every offline method
      </Heading>

      <Paragraph delay={0.80}>
        DAgger's fix depends on being able to query an expert during training, which many of the settings that motivate offline reinforcement learning in the first place don't allow. Take that option away, no interaction, no queries, just the fixed dataset, and a harder, more fundamental limit sets in. A policy can only be as good as what the data actually shows it. If the dataset never contains a given state-action pair, no algorithm, however clever, can teach the policy anything reliable about what happens there. This is <strong>dataset coverage</strong>, and it's simple to state and easy to underestimate. A self-driving dataset built entirely from cautious highway driving has nothing to say about a sharp turn on a gravel road, and no amount of extra training passes over that same data will manufacture the missing experience. Coverage is a property of the dataset, not the algorithm, and every method described below runs into it eventually.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        Conservative value learning
      </Heading>

      <Paragraph delay={0.90}>
        Behavior cloning sidesteps the reward function entirely, which is exactly why it can never do better than the expert it copies. Proper offline reinforcement learning tries to do more, it still learns a value function and uses it to find actions that beat the demonstrations, not just match them. The relevant kind of value function here is a Q-function, an estimate of how much future reward a given action is worth in a given state. A policy normally leans on that estimate to decide what to do next.
      </Paragraph>

      <Paragraph delay={0.95}>
        The problem is that a Q-function trained on a fixed, limited dataset will happily be overconfident about a state-action pair it has barely seen. Left alone, a policy optimizing against that Q-function exploits those blind spots, chasing an action the data barely covers just because the network overestimates how good it looks there. <strong>Conservative Q-Learning</strong>, usually shortened to CQL, is the standard fix. It changes the Q-function's own training objective, an action that's rare or absent in the dataset gets pushed toward a lower value instead of being left free to look artificially good. The policy that comes out of this stays close to what the data can actually support, instead of wandering into blind spots that look great on paper and would fail immediately in a real environment.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        Inverse reinforcement learning, inferring the reward instead
      </Heading>

      <Paragraph delay={1.05}>
        Behavior cloning and conservative value learning both assume something about the setup, either a policy to copy directly or a reward signal to train a value function against. Sometimes neither is available in an explicit form. There might be plenty of expert demonstrations of a specific driving style or a particular robotic assembly task, but no one ever wrote down a reward function describing what makes one version of that behavior better than another.
      </Paragraph>

      <Paragraph delay={1.10}>
        <strong>Inverse reinforcement learning</strong> approaches this from the other direction. Instead of copying the expert's actions or optimizing a hand-written reward, it works backward, infer what reward function would make the expert's demonstrated behavior look close to optimal, then train a policy against that inferred reward using ordinary RL. The output isn't just a policy, it's also a plausible reward function that explains why the expert behaved the way it did. That reward can then get reused, tweaked, or handed to a different training method entirely.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        Off-policy evaluation, testing before deploying
      </Heading>

      <Paragraph delay={1.20}>
        All of this raises an obvious worry. If training happens entirely offline, how does anyone know a new candidate policy is actually any good before it ever runs live? <strong>Off-policy evaluation</strong> answers that. It estimates how well a new policy would have performed using only logged data collected under some other, different policy, no live rollout required.
      </Paragraph>

      <Paragraph delay={1.25}>
        This is the reinforcement learning version of something familiar from any recommendation system. Before shipping a new ranking model, a team checks its predictions against historical logs and only then runs a live experiment. Off-policy evaluation applies that same instinct to sequential decision making, sanity check a policy against the past before trusting it with the future.
      </Paragraph>

      <Heading level={2} delay={1.30}>
        Takeaways
      </Heading>

      <List delay={1.35}>
        <ListItem>Offline reinforcement learning and imitation learning both learn from a fixed dataset of past experience, with no live environment access during training.</ListItem>
        <ListItem>Behavior cloning treats imitation as supervised learning, predict the expert's action, but it inherits distribution shift and compounding error the moment the policy drifts even slightly off the expert's recorded path.</ListItem>
        <ListItem>Every offline method is bounded by dataset coverage, no algorithm can teach a policy about a state-action pair the data never showed it.</ListItem>
        <ListItem>Conservative value learning keeps a learned Q-function honest by penalizing confidence in actions the data barely supports, while inverse reinforcement learning infers a reward function from demonstrations when no explicit reward exists.</ListItem>
        <ListItem>Off-policy evaluation lets a team sanity check a new policy against logged data before ever running it live, which matters most exactly when deployment-time exploration is not something anyone can afford.</ListItem>
      </List>

      <Paragraph delay={1.40}>
        Every method in this post exists because of one practical fact, a lot of the most important places to apply reinforcement learning are places where trial and error is not actually available at deployment time. A hospital cannot let a policy experiment on real patients, a self-driving system cannot learn from real collisions, and a trading system cannot learn from blowing up real capital. Offline reinforcement learning and imitation learning exist to keep the best parts of the reinforcement learning framework, learning from experience and improving a policy over time, while removing the trial from trial and error. Thanks for reading.
      </Paragraph>
    </>
  ),
};
