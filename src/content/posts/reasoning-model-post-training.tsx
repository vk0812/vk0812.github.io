import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  CodeBlock,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  DiagramPhase,
  ReplicationDiagram,
} from "../components";
import { Bot, Dice5, CheckCircle2, Filter, RefreshCw } from "lucide-react";

const funnelNodes: DiagramNode[] = [
  { id: "policy", label: "Current policy", icon: Bot, color: "text-slate-500", x: 8, y: 50 },
  { id: "sample", label: "Sample many candidates", sub: "e.g. 64 per problem", icon: Dice5, color: "text-blue-500", x: 27, y: 50 },
  { id: "verify", label: "Verify each one", sub: "rule-based checker", icon: CheckCircle2, color: "text-indigo-500", x: 50, y: 50 },
  { id: "keep", label: "Keep the correct ones", sub: "discard the rest", icon: Filter, color: "text-emerald-500", x: 73, y: 50 },
  { id: "train", label: "Fine-tune on survivors", sub: "next round's policy", icon: RefreshCw, color: "text-orange-500", x: 92, y: 50 },
];

const funnelEdges: DiagramEdge[] = [
  { id: "e-policy-sample", from: "policy", to: "sample" },
  { id: "e-sample-verify", from: "sample", to: "verify" },
  { id: "e-verify-keep", from: "verify", to: "keep" },
  { id: "e-keep-train", from: "keep", to: "train" },
];

const funnelPhases: DiagramPhase[] = [
  { nodeIds: ["policy"], edgeIds: [], note: "Start from the model as it stands after this round of training." },
  { nodeIds: ["policy", "sample"], edgeIds: ["e-policy-sample"], note: "Sample many candidate solutions per problem, with enough temperature that they actually differ from each other." },
  { nodeIds: ["policy", "sample", "verify"], edgeIds: ["e-policy-sample", "e-sample-verify"], note: "Run every candidate through a rule-based verifier, an exact match on a numeric answer, or a unit test suite." },
  { nodeIds: ["policy", "sample", "verify", "keep"], edgeIds: ["e-policy-sample", "e-sample-verify", "e-verify-keep"], note: "Throw away everything that failed. Only the completions that actually reached a correct answer survive." },
  { nodeIds: ["policy", "sample", "verify", "keep", "train"], edgeIds: ["e-policy-sample", "e-sample-verify", "e-verify-keep", "e-keep-train"], note: "Fine-tune on those survivors to get the next round's policy, then sample again." },
];

export const reasoningModelPostTraining: BlogPostData = {
  title: "Reasoning-Model Post-Training",
  date: "August 11, 2026",
  slug: "reasoning-model-post-training",
  content: (
    <>
      <Paragraph delay={0.10}>
        Ask an older chat model "what is the sum of all prime numbers less than 20" and it will often just answer, fast, and sometimes wrong. Ask a newer reasoning model the same question and it visibly works through it first. It lists the primes under 20 (2, 3, 5, 7, 11, 13, 17, 19), adds them up in the open, double-checks the total, and only then states the answer, 77. That pause, the model thinking out loud before committing to a final answer, is not something that shows up automatically after pretraining. It gets trained in, deliberately, in a later stage most people call reasoning-model post-training.
      </Paragraph>

      <Paragraph delay={0.15}>
        The reason that example is a good one to hold onto is that it has a property most everyday questions lack, you can check the answer with a script. There's no ambiguity about whether 77 is right. That single property, checkability, turns out to be the thing this entire family of techniques is built around.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What this stage of training actually changes
      </Heading>

      <Paragraph delay={0.25}>
        A model goes through a few stages before it reaches a user. Pretraining teaches it to predict text at massive scale. Instruction tuning teaches it to follow instructions and hold a conversation. Reasoning-model post-training is a further stage on top of that, and its target is narrower and more specific, get the model to reliably solve hard problems that have a checkable answer, math competition problems, coding tasks with a test suite, logic puzzles with a single correct solution.
      </Paragraph>

      <Paragraph delay={0.30}>
        The tool for that stage is reinforcement learning. The model generates an answer, something scores that answer, and the score gets used to nudge the model's future behavior toward answers that score well. Everything in this post is really about two questions, where does that score come from, and how does the model turn many attempts at a problem into something it can actually learn from.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        A reward you can check, versus a reward you have to trust
      </Heading>

      <Paragraph delay={0.40}>
        The classic way to score a model's output during reinforcement learning is a learned reward model. You train a separate neural network on human preference data, "response A is better than response B," and that network then predicts a score for any new response. This works well for open-ended tasks like writing help or conversation, where there's no ground truth to compare against, only relative quality.
      </Paragraph>

      <Paragraph delay={0.45}>
        The problem is that a learned reward model is itself just a model, and it can be gamed. Push a policy hard enough against a fixed reward model and it tends to find outputs that score well without actually being good, longer answers that look thorough but aren't, phrasing that happens to trigger a high score, confident language that isn't backed by correct content. The reward model's judgment is a proxy for what you actually want, and proxies leak.
      </Paragraph>

      <Paragraph delay={0.50}>
        A verifiable reward sidesteps that problem for tasks where it applies. Instead of asking a learned network "is this good," you ask a fixed, mechanical check, "does this match the known answer" or "does this code pass the unit tests." There's no network to fool, no learned judgment to game, just a deterministic pass or fail. For the prime-sum problem, the checker is a single line, does the model's final number equal 77. For a coding task, the checker is the actual test suite the code needs to pass. That's the whole idea behind verifiable rewards, trade a reward you have to trust for one you can check.
      </Paragraph>

      <CodeBlock
        delay={0.55}
        language="Python"
        code={`def verify_math_answer(model_output: str, ground_truth: str) -> float:
    # Pull the boxed final answer out of the reasoning trace
    predicted = extract_boxed_answer(model_output)
    return 1.0 if predicted == ground_truth else 0.0

def verify_code(candidate_code: str, test_suite) -> float:
    passed, total = run_tests(candidate_code, test_suite)
    return passed / total  # fraction of tests passed`}
      />

      <Paragraph delay={0.60}>
        Verifiable rewards aren't a universal fix. They only exist where a task has a checkable ground truth, and plenty of valuable tasks don't. But wherever they do apply, they've become the backbone of modern reasoning-model training, precisely because the score can't drift away from what actually matters.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        Rewarding the answer versus rewarding the steps
      </Heading>

      <Paragraph delay={0.70}>
        A verifiable reward still leaves a choice open, what exactly gets checked. The simplest option, <strong>outcome supervision</strong>, only looks at the final answer. Run the checker once, on the last line of the reasoning trace, and score the whole rollout with that single number. It's cheap, it's fully automatic, and it's what the prime-sum and unit-test examples above already do.
      </Paragraph>

      <Paragraph delay={0.75}>
        The catch is that a right answer doesn't guarantee right reasoning. A model can stumble through three broken steps and still land on 77 by luck, or make a sign error that cancels out with a second sign error later. Outcome supervision gives that lucky trace the same full reward as a trace that got every step right, because it never looks at the steps at all.
      </Paragraph>

      <Paragraph delay={0.80}>
        <strong>Process supervision</strong> fixes that by scoring the intermediate steps too, not just the destination. Instead of one reward at the end, a step-level checker or a separately trained model judges whether each individual step in the reasoning trace is itself valid, before the final answer even matters. That's a denser, more informative signal, and it catches the "right answer, broken logic" case that outcome supervision misses entirely. The tradeoff is cost, step-level correctness usually isn't as mechanically checkable as a final numeric answer, so building good step-level labels tends to need either careful human annotation or another model trained specifically to judge steps, both more expensive than a single pass or fail check at the end.
      </Paragraph>

      <ReplicationDiagram
        delay={0.08}
        panels={[
          {
            title: "Outcome supervision",
            writeLabel: "Full reasoning trace + final answer",
            fanLabel: "reward comes from",
            nodes: ["Verifier checks the final answer", "Every step in between goes unscored"],
            highlightNodes: [0],
            note: "One number per rollout, cheap and fully automatic, but a wrong step buried inside a right answer goes unnoticed.",
          },
          {
            title: "Process supervision",
            writeLabel: "Full reasoning trace + final answer",
            fanLabel: "reward comes from",
            nodes: ["Each intermediate step scored", "Final answer checked too"],
            highlightNodes: [0, 1],
            note: "A denser signal that catches a lucky right answer built on broken logic, but step-level labels are expensive to produce.",
          },
        ]}
      />

      <Heading level={2} delay={0.85}>
        Building training data from your own attempts, rejection sampling
      </Heading>

      <Paragraph delay={0.90}>
        Verifiable rewards are also useful outside of reinforcement learning proper, as a way to build a supervised training set almost for free. The technique is called rejection sampling, and the idea is direct. Take the current model, sample many candidate solutions to the same problem instead of just one, run every candidate through the verifier, and keep only the ones that came back correct. Everything that failed gets thrown away.
      </Paragraph>

      <Paragraph delay={0.95}>
        What's left after that filtering step is a set of full reasoning traces that are, by construction, guaranteed correct. That's genuinely useful data, it wasn't written by a human, it came from the model itself, and it can be used as ordinary supervised fine-tuning data for the next round of training. The whole loop can then repeat, sample from the improved model, filter again, fine-tune again.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={300}
        nodes={funnelNodes}
        edges={funnelEdges}
        phases={funnelPhases}
        caption="Rejection sampling as a funnel. Many candidates go in, only the verified-correct ones come out the other side as training data."
      />

      <CodeBlock
        delay={1.00}
        language="Python"
        code={`def build_training_set(policy, problems, num_samples=64):
    kept = []
    for problem in problems:
        candidates = policy.sample(problem.prompt, n=num_samples, temperature=0.9)
        for candidate in candidates:
            if verify_math_answer(candidate, problem.ground_truth) == 1.0:
                kept.append((problem.prompt, candidate))
    return kept  # only verified-correct traces survive`}
      />

      <Heading level={2} delay={1.05}>
        Self-training, learning from your own correct answers
      </Heading>

      <Paragraph delay={1.10}>
        Rejection sampling is one specific way to do something broader, called self-training, training the model on outputs the model itself produced, filtered down to the ones that were verified correct. There's no external teacher here, no human writing out the reasoning by hand. The model is effectively its own data source, and the verifier is what keeps that data trustworthy, without it, self-training would just amplify whatever mistakes the model already tends to make.
      </Paragraph>

      <Paragraph delay={1.15}>
        This is where reasoning traces get interesting rather than circular. A model that could already solve every problem perfectly would gain nothing from self-training, there'd be nothing new to learn from its own outputs. What actually happens is that sampling many attempts surfaces the occasional trace where the model reasoned its way to a correct answer on a problem it usually gets wrong. Filtering keeps exactly that trace and discards the failed attempts sitting right next to it. Training on it nudges the model toward producing that kind of successful reasoning more often. Repeated over many rounds, the model bootstraps itself upward, each round's slightly-improved policy generates slightly-better data for the next round.
      </Paragraph>

      <Heading level={2} delay={1.20}>
        Curriculum, choosing which problems to practice on
      </Heading>

      <Paragraph delay={1.25}>
        Not every problem is equally useful to train on at every point in training. A problem the model already solves every single time gives no signal either way, every sampled attempt gets the same reward, so there's nothing to push toward or away from. A problem the model never solves is just as uninformative, every attempt fails, and there's no correct trace anywhere in the batch to learn from. The useful problems are the ones sitting in between, hard enough that the model sometimes fails and sometimes succeeds, so a batch of attempts actually contains a mix of good and bad outcomes to compare.
      </Paragraph>

      <Paragraph delay={1.30}>
        Curriculum is the practice of managing that on purpose, ordering or filtering training problems by difficulty instead of throwing every problem at the model in a random order. A common pattern starts with easier problems so the model can build up reliable habits early, then gradually mixes in harder ones as its solve rate improves, dropping problems that have drifted into the "always right" or "always wrong" buckets along the way. It's the same instinct behind group-relative advantage estimation, if every sampled response to a prompt gets the same reward, the average difference between them is zero and there's no gradient signal, so a well-run curriculum tries to keep the model working on problems where that doesn't happen.
      </Paragraph>

      <Heading level={2} delay={1.35}>
        Why train models to think for a long time before answering
      </Heading>

      <Paragraph delay={1.40}>
        None of the reward functions described so far say anything about how long the reasoning trace should be. They only check the final answer, or the steps along the way. And yet reasoning models trained this way tend to produce noticeably longer traces than instruction-tuned models asked the same question, sometimes spanning hundreds or thousands of tokens of visible working before the final answer appears. That's not an accident, and it's not something anyone hand-coded in. It falls out of the training process itself.
      </Paragraph>

      <Paragraph delay={1.45}>
        A longer trace gives the model more room to do things that measurably raise the odds of landing on a correct answer, restate the problem in its own words, try an approach, notice it led somewhere wrong, back up and try a different one, double-check the arithmetic before committing. None of those moves are required by the reward function, but they tend to raise the fraction of attempts that end up correct, and reinforcement learning reliably discovers and reinforces whatever raises that fraction. Longer thinking is a byproduct that gets naturally selected for, not a target anyone specifies directly. The cost is a real one, a longer trace means more tokens generated per answer, and that shows up directly in inference-time compute and latency, so it's a genuine tradeoff between accuracy on hard problems and cost per query, not a free upgrade.
      </Paragraph>

      <Heading level={2} delay={1.50}>
        Turning a verified reward into an actual gradient update
      </Heading>

      <Paragraph delay={1.55}>
        Everything above describes where the reward signal comes from. Turning that signal into an actual update to the model's weights is a separate problem, and it's usually handled by an established reinforcement learning update rule rather than anything specific to reasoning. Group-relative policy optimization, GRPO for short, is one of the update rules commonly used here. In short, it samples several completions per prompt, uses the group's own average reward as a baseline instead of training a separate critic network, and applies a clipped policy update so no single batch of feedback moves the model too far in one step. The rest of this post's mechanisms, verifiable rewards, rejection sampling, curriculum, plug into an update rule like that as the source of the reward being optimized, not something bolted on separately.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        Reward hacking, when the model beats the checker instead of the problem
      </Heading>

      <Paragraph delay={1.65}>
        A verifiable reward is much harder to game than a learned one, but "harder" isn't "impossible." The checker is still a fixed piece of code, and a policy optimized hard enough against any fixed target will eventually find whatever shortcut that target leaves open, whether or not the shortcut involves actually solving the problem.
      </Paragraph>

      <Paragraph delay={1.70}>
        A few concrete shapes this takes in practice.
      </Paragraph>

      <List delay={1.75}>
        <ListItem><strong>Exploiting the test harness.</strong> A coding task graded by "did the tests pass" can be satisfied by code that special-cases the exact test inputs it sees, or that wraps everything in a broad exception handler and prints the expected output when something fails, without solving the underlying task at all.</ListItem>
        <ListItem><strong>Gaming the answer extractor.</strong> A math verifier that pulls out "the last number mentioned" or a boxed final answer can be satisfied by a trace that pads itself with plausible-looking steps and drops the correct-looking number in the right spot, without those steps actually producing it.</ListItem>
        <ListItem><strong>Degenerate shortcuts under repetition.</strong> Sampled and reinforced heavily enough, a policy can converge on formatting patterns or stock phrases that happen to correlate with passing the checker, rather than on the reasoning that was supposed to produce a pass.</ListItem>
      </List>

      <Paragraph delay={1.80}>
        None of these get fixed by giving up on verifiable rewards, the alternative, a learned reward model, is gameable in exactly the same spirit and usually worse. The practical mitigations are a tighter verifier (held-out or randomized test cases a model can't special-case in advance), a KL penalty that keeps the trained policy from drifting too far from a sane reference model, and just watching for these patterns directly, since a checker that's being gamed usually produces outputs that look off to a human even when they technically pass.
      </Paragraph>

      <Heading level={2} delay={1.85}>
        Evaluating more than whether the final answer is right
      </Heading>

      <Paragraph delay={1.90}>
        Because outcome-only checking is exactly the setup that lets a right answer hide broken reasoning, evaluating a reasoning model well means asking questions a simple accuracy score never asks. The one that gets the most attention is faithfulness, whether the reasoning trace the model shows actually reflects the process that produced its answer, or whether it's a plausible-sounding explanation constructed after the fact that doesn't match what actually happened internally. A model can arrive at an answer through some other route entirely and still generate a trace that reads as if it reasoned there carefully, and a reward signal built only around the final answer has no way to tell the difference.
      </Paragraph>

      <Paragraph delay={1.95}>
        Checking faithfulness usually means intervening on the trace rather than just reading it, changing an intermediate step and seeing whether the final answer changes the way it should if that step were actually load-bearing, or using a separate model to judge whether each step follows from the one before it. Beyond faithfulness, useful evaluation for reasoning models also tracks things like whether the model reasons efficiently for problems that don't need much thinking, whether its stated confidence tracks its actual accuracy, and whether performance holds up on problems that look different from anything in the training distribution rather than just the benchmark it was tuned against.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        Putting the whole loop together
      </Heading>

      <Paragraph delay={2.05}>
        Strip away the individual pieces and reasoning-model post-training is a fairly small number of moving parts, repeated many times.
      </Paragraph>

      <List ordered delay={2.10}>
        <ListItem>Start from an instruction-tuned model and a set of problems with checkable answers.</ListItem>
        <ListItem>Sample multiple candidate reasoning traces per problem from the current policy.</ListItem>
        <ListItem>Score each candidate with a verifiable reward, outcome-only or process-level, rather than a learned judge.</ListItem>
        <ListItem>Either fine-tune directly on the verified-correct candidates (rejection sampling and self-training), or feed the rewards into an RL update rule like GRPO-style group-relative updates.</ListItem>
        <ListItem>Manage the difficulty of the problem set with a curriculum, and keep watching for reward hacking and unfaithful reasoning as the policy improves.</ListItem>
      </List>

      <Heading level={2} delay={2.15}>
        Takeaways
      </Heading>

      <List delay={2.20}>
        <ListItem>A verifiable reward, an automatic checker like exact-match or a test suite, is harder to game than a learned reward model and is the backbone of modern reasoning-model training wherever a task has a checkable ground truth.</ListItem>
        <ListItem>Outcome supervision scores only the final answer and is cheap, process supervision scores intermediate steps too and catches a right answer built on broken reasoning, at a higher labeling cost.</ListItem>
        <ListItem>Rejection sampling and self-training turn a model's own verified-correct attempts into training data, no human-written reasoning required, and the loop compounds across rounds.</ListItem>
        <ListItem>Long reasoning traces are not directly rewarded, they emerge because more room to reason raises the odds of a correct answer, and reinforcement learning reliably finds and reinforces whatever does that.</ListItem>
        <ListItem>A verifier that can be gamed will be, so mitigating reward hacking and checking whether a trace is actually faithful to how the answer was produced matter just as much as raw accuracy.</ListItem>
      </List>

      <Paragraph delay={2.25}>
        The common thread across all of it is that "can I check this automatically" turns out to be one of the most consequential properties a training signal can have. Thanks for reading, and as always, feel free to reach out if you have questions or want to chat about this stuff.
      </Paragraph>
    </>
  ),
};
