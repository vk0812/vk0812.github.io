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
} from "../components";
import {
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Award,
  Scale,
  Bot,
  Gauge,
  Lock,
  GitCompare,
  RefreshCw,
} from "lucide-react";

const rewardModelNodes: DiagramNode[] = [
  { id: "prompt", label: "Prompt", icon: MessageSquare, color: "text-slate-500", x: 10, y: 50 },
  { id: "chosen", label: "Chosen completion", sub: "preferred by the labeler", icon: ThumbsUp, color: "text-emerald-500", x: 35, y: 18 },
  { id: "rejected", label: "Rejected completion", sub: "the other one", icon: ThumbsDown, color: "text-rose-500", x: 35, y: 82 },
  { id: "rm", label: "Reward model", sub: "scalar score per completion", icon: Award, color: "text-blue-500", x: 63, y: 50 },
  { id: "result", label: "Bradley-Terry loss", sub: "pushes chosen score above rejected", icon: Scale, color: "text-orange-500", x: 90, y: 50 },
];

const rewardModelEdges: DiagramEdge[] = [
  { id: "e-prompt-chosen", from: "prompt", to: "chosen" },
  { id: "e-prompt-rejected", from: "prompt", to: "rejected" },
  { id: "e-chosen-rm", from: "chosen", to: "rm" },
  { id: "e-rejected-rm", from: "rejected", to: "rm" },
  { id: "e-rm-result", from: "rm", to: "result" },
];

const loopNodes: DiagramNode[] = [
  { id: "prompt", label: "Prompt batch", sub: "sampled from a prompt dataset", icon: MessageSquare, color: "text-slate-500", x: 4, y: 50 },
  { id: "policy", label: "Policy model", sub: "generates the rollout", icon: Bot, color: "text-blue-500", x: 26, y: 50 },
  { id: "rewardModel", label: "Reward model", sub: "frozen, scores the response", icon: Award, color: "text-indigo-500", x: 50, y: 16 },
  { id: "critic", label: "Value model", sub: "estimates a baseline", icon: Gauge, color: "text-emerald-500", x: 50, y: 50 },
  { id: "referenceModel", label: "Reference model", sub: "frozen copy of the SFT model", icon: Lock, color: "text-violet-500", x: 50, y: 84 },
  { id: "combine", label: "Reward minus KL", sub: "the advantage estimate", icon: GitCompare, color: "text-amber-500", x: 74, y: 50 },
  { id: "update", label: "Clipped PPO update", sub: "policy weights change", icon: RefreshCw, color: "text-rose-500", x: 94, y: 50 },
];

const loopEdges: DiagramEdge[] = [
  { id: "e-prompt-policy", from: "prompt", to: "policy" },
  { id: "e-policy-rm", from: "policy", to: "rewardModel" },
  { id: "e-policy-critic", from: "policy", to: "critic" },
  { id: "e-policy-ref", from: "policy", to: "referenceModel" },
  { id: "e-rm-combine", from: "rewardModel", to: "combine" },
  { id: "e-critic-combine", from: "critic", to: "combine" },
  { id: "e-ref-combine", from: "referenceModel", to: "combine" },
  { id: "e-combine-update", from: "combine", to: "update" },
];

export const reinforcementLearningFromHumanFeedback: BlogPostData = {
  title: "Reinforcement Learning from Human Feedback",
  date: "August 11, 2026",
  slug: "reinforcement-learning-from-human-feedback",
  content: (
    <>
      <Paragraph delay={0.10}>
        Ask a language model something ambiguous, and a good one will ask a clarifying question instead of guessing, decline a request that's genuinely harmful instead of complying, and write an answer that sounds like it's talking to a person rather than autocompleting a document. None of that comes for free out of next-token prediction. It's mostly the result of a training stage called Reinforcement Learning from Human Feedback, RLHF, which takes a model that already knows how to write and teaches it what people actually want it to write.
      </Paragraph>

      <Paragraph delay={0.15}>
        The pipeline behind that idea is not one algorithm, it's a sequence of three training jobs that hand off to each other. A model learns to imitate good answers, a second model learns to judge answers, and reinforcement learning uses that judge to push the first model toward answers it would judge highly. Each stage is straightforward on its own. What makes RLHF worth a close look is how the three fit together, and how many ways the combination can go wrong.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Where RLHF starts, the SFT model
      </Heading>

      <Paragraph delay={0.25}>
        RLHF never starts from a blank model. It starts from a model that's already been through supervised fine-tuning (SFT), trained on a dataset of prompts paired with example responses a human wrote or approved. That stage teaches the shape of a good answer, a helpful tone, the habit of addressing the question, formatting that's easy to read. Call this the SFT model, and treat it as the starting point for everything that follows.
      </Paragraph>

      <Paragraph delay={0.30}>
        It has a real limitation though. Imitation learning can only teach a model to reproduce the specific answers in its training set, with no way to compare two answers it wasn't shown and no mechanism for improving beyond whatever the demonstration data already contained. RLHF exists to get past that ceiling, by training on comparisons between whole responses instead of a fixed set of examples to copy.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        A concrete preference pair
      </Heading>

      <Paragraph delay={0.40}>
        Picture the prompt "explain why the sky is blue to a five year old." The SFT model, sampled twice, produces two different answers. Response A talks about sunlight scattering off tiny air molecules, keeps the vocabulary simple, and ends with a friendly one-liner. Response B is technically accurate but drops in phrases like "Rayleigh scattering" and "wavelength-dependent," which a five year old has no chance of following. A human labeler looks at both, side by side, and picks A.
      </Paragraph>

      <Paragraph delay={0.45}>
        That single decision, "A is better than B for this prompt," is the entire unit of data RLHF is built on. Not a score, just a comparison. People are far more consistent at saying which of two things is better than at assigning an absolute number to either on its own, and RLHF pipelines lean on that fact by collecting comparisons at scale instead of ratings.
      </Paragraph>

      <Heading level={2} delay={0.50}>
        Turning preferences into a reward model
      </Heading>

      <Paragraph delay={0.55}>
        A pile of "A beats B" comparisons isn't something a policy can train on directly, reinforcement learning needs an actual reward number to optimize. The fix is a separate model, the <strong>reward model</strong>, whose entire job is to look at a prompt and a response and output one scalar score. It usually starts from the same pretrained or SFT backbone, with the language modeling head swapped for a small head that outputs a single number instead of a distribution over the next token.
      </Paragraph>

      <Paragraph delay={0.60}>
        Training that scalar head is where the preference pairs come back in. For every comparison, the reward model scores both the chosen and the rejected response, and the loss pushes the chosen score above the rejected one. That's the Bradley-Terry loss, a standard way to turn pairwise comparisons into a numeric ranking.
      </Paragraph>

      <Formula block delay={0.65}>
        {`\\mathcal{L}(\\phi) = -\\log \\sigma\\bigl(r_\\phi(x, y_w) - r_\\phi(x, y_l)\\bigr)`}
      </Formula>

      <List delay={0.70}>
        <ListItem><strong>The prompt and pair.</strong> <Formula>{`x`}</Formula> is the prompt, <Formula>{`y_w`}</Formula> is the winning (chosen) response, <Formula>{`y_l`}</Formula> is the losing (rejected) one.</ListItem>
        <ListItem><strong>The reward model itself.</strong> <Formula>{`r_\\phi(x, y)`}</Formula> is the scalar score the reward model, with parameters <Formula>{`\\phi`}</Formula>, assigns to a given response.</ListItem>
        <ListItem><strong>The comparison.</strong> <Formula>{`r_\\phi(x, y_w) - r_\\phi(x, y_l)`}</Formula> is just the gap between the two scores. A sigmoid, <Formula>{`\\sigma`}</Formula>, turns that gap into a probability that the winner really was better, and the log loss trains the model to make that probability as close to 1 as the data allows.</ListItem>
      </List>

      <IconArchitectureDiagram
        delay={0.08}
        height={380}
        nodes={rewardModelNodes}
        edges={rewardModelEdges}
        caption="Reward model training. Both completions for the same prompt pass through the same reward model, and the loss only cares about the gap between the two scores."
      />

      <CodeBlock
        delay={0.75}
        language="Python"
        code={`import torch
import torch.nn.functional as F

def reward_model_loss(chosen_scores, rejected_scores):
    # Bradley-Terry pairwise ranking loss
    return -F.logsigmoid(chosen_scores - rejected_scores).mean()`}
      />

      <Paragraph delay={0.80}>
        Say the trained reward model gives response A a score of <Formula>{`2.1`}</Formula> and response B a score of <Formula>{`-0.4`}</Formula>, illustrative numbers. It's this trained scorer, not any live human, that the next stage optimizes against.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        Generating rollouts, text as the action
      </Heading>

      <Paragraph delay={0.90}>
        With a reward model in hand, the RL stage can start. The policy is initialized from the SFT model, and every training step begins the same way, sample a batch of prompts and let the current policy generate a full response to each one, token by token, the same autoregressive sampling a language model always does at inference time. Mapped onto reinforcement learning's usual vocabulary, the generated response is the action, the state at each step is the prompt plus whatever tokens came before it, and the policy is just the model's own next-token distribution. There's no fixed replay buffer of past conversations to draw on, the policy has to produce text before anything can be scored.
      </Paragraph>

      <Paragraph delay={0.95}>
        This is also where RLHF starts to feel slow. Generating a response means running the model forward one token at a time, and that can't be parallelized across time steps the way a single forward pass over a fixed input can. A batch of prompts generates in parallel with each other, but each sequence still has to be decoded step by step until it ends. Collecting a full batch of rollouts this way, before a single gradient update happens, is routinely the slowest part of an RLHF training step, slower than the reward scoring, the KL computation, or the update itself.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        The RLHF objective, PPO plus a KL leash
      </Heading>

      <Paragraph delay={1.05}>
        Once a rollout exists and has a reward, updating the policy from it reuses the exact clipped surrogate objective any Proximal Policy Optimization (PPO) training loop uses, a probability ratio between the current and the rollout-time policy, multiplied by an advantage, clipped into a narrow band around 1 so no single update can move the policy too far no matter how large the advantage looks. Nothing about that clipping mechanism changes for language. What's specific to RLHF is what gets fed into it as the reward.
      </Paragraph>

      <Paragraph delay={1.10}>
        The reward model's score is a useful signal, but optimizing against it with nothing else in the loop is dangerous. It's a learned approximation of human judgment, trained on responses that look roughly like what the SFT model already produces, and nothing stops an aggressive RL update from finding strange, repetitive, or borderline gibberish text that scores very highly without actually being good, a failure mode usually called <strong>reward hacking</strong>. The fix is a penalty for how different the current policy's output distribution is from a frozen reference copy of the SFT model, so the policy never drifts far from the text the reward model was actually trained to judge.
      </Paragraph>

      <Formula block delay={1.15}>
        {`\\max_{\\theta} \\ \\mathbb{E}_{x \\sim D,\\, y \\sim \\pi_\\theta(\\cdot|x)} \\Bigl[ r_\\phi(x, y) - \\beta \\, D_{\\text{KL}}\\bigl(\\pi_\\theta(\\cdot|x) \\,\\|\\, \\pi_{\\text{ref}}(\\cdot|x)\\bigr) \\Bigr]`}
      </Formula>

      <List delay={1.20}>
        <ListItem><strong>The prompt and response.</strong> <Formula>{`x`}</Formula> is drawn from the prompt dataset <Formula>{`D`}</Formula>, and <Formula>{`y`}</Formula> is the response the current policy <Formula>{`\\pi_\\theta`}</Formula> generates for it, right now, during this rollout.</ListItem>
        <ListItem><strong>The reward term.</strong> <Formula>{`r_\\phi(x, y)`}</Formula> is exactly the reward model score from the previous section. Higher is better, and this is the term the policy is trying to raise.</ListItem>
        <ListItem><strong>The reference model.</strong> <Formula>{`\\pi_{\\text{ref}}`}</Formula> is a frozen copy of the SFT model, snapshotted before RL training starts and never updated again. It never generates anything during training, it only sits there so its output distribution has something fixed to compare against.</ListItem>
        <ListItem><strong>The KL penalty.</strong> <Formula>{`D_{\\text{KL}}(\\pi_\\theta \\| \\pi_{\\text{ref}})`}</Formula> measures how far the current policy's distribution over the next token has drifted from the reference model's, and <Formula>{`\\beta`}</Formula> is a small coefficient controlling how hard that drift gets penalized, often somewhere around 0.01 to 0.1.</ListItem>
      </List>

      <Paragraph delay={1.25}>
        The KL term matters specifically here in a way it doesn't for, say, a robot learning to walk. Language has a huge space of token sequences that are fluent-sounding but empty, and an even huger space that's just broken text a reward model was never trained to score reliably. Keeping the policy leashed to the reference model keeps it inside the region of text the reward model actually understands, and stops it from wandering into strange, repetitive, or outright degenerate territory that happens to fool the score without producing anything a person would call a good answer.
      </Paragraph>

      <Paragraph delay={1.30}>
        A quick numeric pass makes the effect concrete. Say a response gets a raw reward model score of <Formula>{`2.3`}</Formula>, and its cumulative KL divergence from the reference model works out to <Formula>{`0.8`}</Formula> nats, illustrative numbers. With <Formula>{`\\beta = 0.02`}</Formula>, the effective reward the policy trains on is <Formula>{`2.3 - 0.02 \\times 0.8 \\approx 2.284`}</Formula>, a small dent here, but one that grows fast for a response drifting much further from the reference distribution.
      </Paragraph>

      <Paragraph delay={1.35}>
        Most implementations don't wait until the end of the response to apply that penalty. Instead they compute a per-token KL contribution, the difference between the policy's and the reference model's log-probability at each generated token, and subtract a scaled version of it from the reward at that same token. The reward model's score, only available once the response is finished, lands entirely on the final token instead.
      </Paragraph>

      <CodeBlock
        delay={1.40}
        language="Python"
        code={`import torch

def rlhf_token_rewards(rm_score, policy_logprobs, ref_logprobs, kl_coef=0.02):
    # per-token KL penalty: log pi_theta(token) - log pi_ref(token)
    kl_penalty = policy_logprobs - ref_logprobs
    rewards = -kl_coef * kl_penalty

    # the reward model only judges the finished response, so its
    # score lands entirely on the last generated token
    rewards[:, -1] += rm_score
    return rewards`}
      />

      <Heading level={2} delay={1.45}>
        Advantage estimation for a sentence-length action
      </Heading>

      <Paragraph delay={1.50}>
        Once every token has a reward, the rest of the update looks like ordinary PPO. A critic (also called a value model) predicts, at every token position, how much total reward is expected from here to the end of the response, and the gap between that prediction and what actually happened becomes the advantage. Turning a stream of rewards and value predictions into that advantage estimate doesn't change for language, the same blend of short-horizon and full-rollout estimates from any actor-critic setup applies token by token here too.
      </Paragraph>

      <Paragraph delay={1.55}>
        What's specific to RLHF is how sparse and back-loaded the raw reward signal is before that critic gets involved. A response might be forty tokens long, and for thirty-nine of them the only reward available is a small, near-uniform KL penalty, with the entire reward model's judgment landing as one lump sum on the fortieth. Without a value model smoothing that out, every earlier token would get almost no credit or blame for how the response turned out. The critic's job is exactly to spread that terminal judgment backward, so a good opening sentence gets some credit even though the reward model never scored it separately.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        Four models, one training step
      </Heading>

      <Paragraph delay={1.65}>
        Add up everything RLHF needs sitting in memory at the same time, and the number is genuinely unusual for a training setup. Ordinary supervised fine-tuning needs one model plus its optimizer state. An RLHF step needs four.
      </Paragraph>

      <List delay={1.70}>
        <ListItem><strong>The policy.</strong> Generates the rollout and receives gradient updates. Full weights, gradients, and optimizer state, the most expensive of the four.</ListItem>
        <ListItem><strong>The reference model.</strong> A frozen copy of the SFT model, kept purely to compute the KL penalty. No gradients or optimizer state, but its weights still have to live somewhere, with a forward pass on every rollout.</ListItem>
        <ListItem><strong>The reward model.</strong> Also frozen, also a forward pass on every rollout, producing the scalar score that anchors the whole reward signal.</ListItem>
        <ListItem><strong>The critic (value model).</strong> Trained alongside the policy, with its own gradients and optimizer state, turning the sparse, back-loaded reward into a usable per-token advantage.</ListItem>
      </List>

      <IconArchitectureDiagram
        delay={0.08}
        height={480}
        nodes={loopNodes}
        edges={loopEdges}
        caption="One RLHF training step. The policy's rollout feeds three frozen or semi-frozen models at once, all before a single gradient update happens."
      />

      <Paragraph delay={1.75}>
        Two of those four are transformer-sized language models doing nothing but inference, and depending on setup, the reward model and reference model are sometimes the same size as the policy itself. That's the concrete reason RLHF is expensive at scale. Not "reinforcement learning is slow" in the abstract, four large models occupying accelerator memory at once, plus the slow, sequential rollout generation from earlier sitting in front of every one of those forward passes.
      </Paragraph>

      <Heading level={2} delay={1.80}>
        Why RLHF training is famously fragile
      </Heading>

      <Paragraph delay={1.85}>
        Even with the KL leash in place, RLHF has a reputation for being finicky to get right, and the reasons stack rather than being one single cause. The reward model is an imperfect, learned proxy for actual human preference, not the real thing, so optimization pressure applied hard enough eventually finds gaps between what the reward model rewards and what a person would actually approve of, the same Goodhart's law problem that shows up whenever a proxy metric gets optimized directly.
      </Paragraph>

      <Paragraph delay={1.90}>
        The reward signal is also sparse and indirect, one scalar judgment about forty or so tokens of text, smoothed out by a critic that's learning at the same time as everything else. On top of that sit several interacting hyperparameters, the KL coefficient, the clip range, the learning rate, the batch size, each needing to be tuned in the context of the others, so small mistakes compound instead of canceling out. Set the KL coefficient too low and reward hacking creeps in unnoticed for a while. Set it too high, and the policy barely moves from the SFT model at all.
      </Paragraph>

      <Paragraph delay={1.95}>
        One particularly common failure mode is a kind of mode collapse, the policy discovers a narrow style of answer, often shorter or blander than ideal, that the reward model consistently scores well, and converges toward producing that style regardless of the prompt. The output still looks fluent and scores fine on the metric being optimized, it just stops being responsive to what was actually asked.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        Safety checks along the way
      </Heading>

      <Paragraph delay={2.05}>
        Because these failure modes tend to develop gradually rather than all at once, RLHF pipelines lean heavily on monitoring during training rather than trusting the objective to behave. Tracking the running KL divergence between the policy and the reference model is close to universal, a sudden jump is often the earliest visible sign that something has started drifting before the output text looks obviously wrong.
      </Paragraph>

      <Paragraph delay={2.10}>
        A held-out set of preference comparisons, never used to train the reward model itself, gets checked periodically to confirm the reward model still correlates with real human judgment. Small batches of the policy's actual generations get pulled for human review too, not because a KL number and a reward curve can't be trusted, but because a person skimming ten real responses catches things neither number shows cleanly, especially early signs of mode collapse.
      </Paragraph>

      <Heading level={2} delay={2.15}>
        Collecting preferences, online versus offline
      </Heading>

      <Paragraph delay={2.20}>
        There's a real choice in how the preference data behind the reward model gets collected, and it trades cost against how well the reward model keeps up with the policy it's judging. The simpler approach is <strong>offline collection</strong>, gather one large batch of comparisons up front, usually by sampling completions from an earlier checkpoint, train the reward model once, and reuse it for the entire RL run. It's cheaper, the labeling happens in one concentrated pass, but the reward model can go stale as the policy's outputs shift away from what it originally saw, exactly the miscalibration the checks above are watching for.
      </Paragraph>

      <Paragraph delay={2.25}>
        The alternative is <strong>online, or iterative, collection</strong>, periodically pause training, sample fresh completions from the current policy, send those out for new human comparisons, and refresh the reward model before resuming. That keeps the reward model judging text that resembles what the policy currently produces, catching reward hacking earlier. It's also considerably more expensive, a standing labeling pipeline rather than a one-time pass, and it slows iteration since training pauses for each refresh. Most production pipelines land in between, running a handful of refresh rounds rather than either extreme.
      </Paragraph>

      <Heading level={2} delay={2.30}>
        Putting the pipeline together
      </Heading>

      <Paragraph delay={2.35}>
        Strip away the failure modes and the infrastructure and the pipeline is five steps, repeated.
      </Paragraph>

      <List ordered delay={2.40}>
        <ListItem>Start from an SFT model that already imitates good answers reasonably well.</ListItem>
        <ListItem>Collect preference comparisons on pairs of its completions, and train a reward model to score chosen responses above rejected ones.</ListItem>
        <ListItem>Sample prompts, generate rollouts from the current policy, and score each finished response with the reward model.</ListItem>
        <ListItem>Combine that score with a per-token KL penalty against a frozen reference model, estimate advantages with a critic, and apply the clipped PPO update.</ListItem>
        <ListItem>Periodically check KL, reward model calibration, and a sample of real outputs, and refresh the preference data if the policy has drifted far enough to need it.</ListItem>
      </List>

      <Heading level={2} delay={2.45}>
        Takeaways
      </Heading>

      <List delay={2.50}>
        <ListItem>RLHF is a pipeline, not a single algorithm, an SFT model feeds a reward model trained on human preference pairs, which then supplies the reward for a PPO-style RL stage.</ListItem>
        <ListItem>The reward model turns pairwise comparisons into a single scalar score via the Bradley-Terry loss, and that score, not any live human, is what the policy is actually optimized against.</ListItem>
        <ListItem>A KL penalty against a frozen reference model is the mechanism that keeps the policy from exploiting the reward model's blind spots, since language has huge room for fluent-looking text that scores well but means nothing.</ListItem>
        <ListItem>Running four models at once, the policy, the reference model, the reward model, and a critic, plus slow autoregressive rollout generation, is the concrete reason RLHF is expensive and famously easy to destabilize with one miscalibrated hyperparameter.</ListItem>
        <ListItem>Preference data can be collected once offline or refreshed iteratively online, trading labeling cost against how well the reward model keeps tracking a policy that keeps changing.</ListItem>
      </List>

      <Paragraph delay={2.55}>
        None of the individual pieces here are exotic, an imitation model, a ranking loss, a clipped policy gradient, a divergence penalty. What makes RLHF a genuinely different training run is that all four have to hold together at once, on top of a reward signal that's only ever an approximation of what people actually want. Thanks for reading.
      </Paragraph>
    </>
  ),
};
