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
  TemperatureReshapeDiagram,
  TopKToppCutoffDiagram,
  BeamSearchTreeDiagram,
  SpeculativeDecodeDiagram,
} from "../components/animations/generation-decoding-strategies/ConceptViz";
import { BarChart2, Thermometer, Filter, RefreshCw, Dice5 } from "lucide-react";

const pipelineNodes: DiagramNode[] = [
  { id: "logits", label: "Raw logits", sub: "one score per token", icon: BarChart2, color: "text-slate-500", x: 9, y: 50 },
  { id: "temp", label: "Temperature scaling", sub: "divide by T", icon: Thermometer, color: "text-orange-500", x: 29, y: 50 },
  { id: "filter", label: "Top-k / top-p filter", sub: "drop the tail", icon: Filter, color: "text-blue-500", x: 50, y: 50 },
  { id: "renorm", label: "Renormalize", sub: "rescale to sum to 1", icon: RefreshCw, color: "text-indigo-500", x: 71, y: 50 },
  { id: "sample", label: "Sample", sub: "draw one token", icon: Dice5, color: "text-emerald-500", x: 91, y: 50 },
];

const pipelineEdges: DiagramEdge[] = [
  { id: "e-logits-temp", from: "logits", to: "temp" },
  { id: "e-temp-filter", from: "temp", to: "filter" },
  { id: "e-filter-renorm", from: "filter", to: "renorm" },
  { id: "e-renorm-sample", from: "renorm", to: "sample" },
];

export const generationDecodingStrategies: BlogPostData = {
  title: "Generation and Decoding Strategies",
  date: "August 11, 2026",
  slug: "generation-decoding-strategies",
  content: (
    <>
      <Paragraph delay={0.1}>
        Say a language model has just produced the words "The weather today is" and needs to pick what comes next. Under the hood, it isn't reaching for one answer. It computes a score for every single token in its vocabulary, tens of thousands of them, and turns those scores into a probability distribution. Most of that distribution is basically zero, nobody's expecting "The weather today is giraffe." But a handful of tokens are genuinely plausible, "nice," "sunny," "cold," "terrible," each with a real, nonzero share of the probability mass.
      </Paragraph>

      <Paragraph delay={0.15}>
        That's the situation at every step of generation, not just the first one. The model hands back a distribution over the next token, and something has to turn that into an actual choice, over and over, until the response is done. That something is the decoding strategy, and the exact same model, given the exact same distribution, can produce wildly different text depending on which strategy is doing the choosing.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        Greedy decoding, always take the top token
      </Heading>

      <Paragraph delay={0.25}>
        The simplest possible rule is <strong>greedy decoding</strong>, at every step, just take the single highest-probability token. No randomness, no lookahead, nothing clever. Run the same prompt through the same model twice with greedy decoding and it produces the exact same output both times, which is a genuinely useful property when reproducibility matters more than variety.
      </Paragraph>

      <Paragraph delay={0.3}>
        The problem shows up once a response runs long enough. Suppose the model has already written "The weather today is nice." A continuation like "The weather today is nice as well" can score slightly higher, token by token, since the phrase was already reinforced by its own recent context. Greedy decoding can't notice it's stuck, so it can spiral into "The weather today is nice. The weather today is nice. The weather today is nice." forever. This confident, repetitive looping is why greedy decoding rarely gets used alone for open-ended tasks like chat or story writing. It's still fine for short tasks with one real right answer, where creativity isn't the point.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Temperature, reshaping the distribution before choosing
      </Heading>

      <Paragraph delay={0.4}>
        Every other strategy in this post starts from a different premise, instead of always taking the top token, sample from the distribution, rolling a weighted die where each token's chance of winning matches its probability. That fixes the repetition problem, since the model isn't forced into the same "obviously best" choice every time. But sampling straight from the raw distribution has its own issue, it usually has a long tail of tokens with small but nonzero probability, and every so often sampling lands on one of those and the output goes visibly off the rails.
      </Paragraph>

      <Paragraph delay={0.45}>
        <strong>Temperature</strong> is the first tool for controlling that. Before a model's raw scores, called logits, get turned into probabilities, they can be divided by a temperature value <Formula>{`T`}</Formula>. The softmax step still runs the same way after that, exponentiate and normalize, it's just working with rescaled numbers going in.
      </Paragraph>

      <Formula block delay={0.5}>
        {`p_i = \\frac{\\exp(z_i / T)}{\\sum_j \\exp(z_j / T)}`}
      </Formula>

      <Paragraph delay={0.55}>
        At <Formula>{`T = 1`}</Formula>, this changes nothing. Push <Formula>{`T`}</Formula> below 1 and the distribution sharpens, the already-likely tokens pull further ahead, and as <Formula>{`T`}</Formula> approaches 0 sampling converges on plain greedy decoding. Push <Formula>{`T`}</Formula> above 1 and it flattens, weaker candidates get a real shot, buying diversity at the cost of occasionally landing on something strange. Concretely, say the logits for four candidate words are 2.0 for "mat," 1.0 for "floor," 0.7 for "roof," and 0.3 for "moon." At <Formula>{`T = 1`}</Formula>, those work out to roughly 55%, 20%, 15%, and 10%. Drop the temperature to 0.5 and the same logits produce roughly 80%, 11%, 6%, and 3%.
      </Paragraph>

      <TemperatureReshapeDiagram
        delay={0.05}
        caption="The same four logits, reshaped by temperature. Lower temperature pulls probability mass toward the token that was already winning."
      />

      <Paragraph delay={0.6}>
        In practice, most chat-style systems default to something in the 0.7 to 1.0 range, a small nudge away from the raw distribution without inviting too much chaos. Creative writing tools often push higher for more variety, and anything that needs to look deterministic, code generation, extracting a specific fact, tends to run near 0.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        Top-k and nucleus sampling, trimming the tail
      </Heading>

      <Paragraph delay={0.7}>
        Temperature alone doesn't remove any tokens from the running, it only reweights them. Even at a low temperature, that long tail of unlikely tokens is still technically available to be sampled, just with tiny odds. Top-k and top-p sampling (also called nucleus sampling) take a more direct approach, cut the tail off entirely before sampling even happens.
      </Paragraph>

      <Paragraph delay={0.75}>
        Top-k sampling sorts tokens by probability, keeps only the <Formula>{`k`}</Formula> highest, discards the rest, renormalizes what's left to sum to 1, and samples from that shortened list. It's simple, but <Formula>{`k`}</Formula> is a fixed count that doesn't know how confident the model actually is. When one token dominates, say it holds 95% of the probability, keeping the next 49 at <Formula>{`k = 50`}</Formula> still leaves room for near-irrelevant options. When the model is genuinely torn between many plausible continuations, that same <Formula>{`k = 50`}</Formula> might cut off reasonable ones.
      </Paragraph>

      <Paragraph delay={0.8}>
        <strong>Top-p sampling</strong> fixes that by making the cutoff adaptive. Instead of a fixed count, sort tokens by probability, then keep adding them, highest first, until their cumulative probability crosses a threshold <Formula>{`p`}</Formula> (0.9 is a common choice). Renormalize whatever made it in, then sample. The size of the surviving set now shrinks automatically when the model is confident and grows automatically when it's spread thin, which is exactly the adaptiveness top-k is missing.
      </Paragraph>

      <TopKToppCutoffDiagram
        delay={0.06}
        caption="The same six sorted candidates kept under two different rules. Top-k with k=3 always survives with exactly three tokens, top-p with p=0.9 keeps however many tokens are needed to cross 90% cumulative probability, four here."
      />

      <Paragraph delay={0.85}>
        Values of <Formula>{`p`}</Formula> around 0.9 to 0.95 are typical, and it's common to combine top-k and top-p together as a coarse-then-fine filter, with temperature applied on top of both. Put in the order a real system actually applies them, the flow looks like this.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={280}
        nodes={pipelineNodes}
        edges={pipelineEdges}
        caption="The usual order of operations before a token gets picked. Temperature reshapes the distribution first, then the tail gets trimmed, then what's left gets sampled."
      />

      <Paragraph delay={0.9}>
        Here's roughly what that looks like in code, temperature first, then a nucleus cutoff, then a weighted sample from whatever survives.
      </Paragraph>

      <CodeBlock
        delay={0.95}
        language="Python"
        code={`import numpy as np

def sample_next_token(logits, temperature=0.7, top_p=0.9):
    # Reshape the distribution first, lower temperature sharpens it
    scaled = logits / temperature
    probs = np.exp(scaled) / np.sum(np.exp(scaled))

    # Sort descending, keep tokens until cumulative probability crosses top_p
    order = np.argsort(-probs)
    sorted_probs = probs[order]
    cumulative = np.cumsum(sorted_probs)
    cutoff = np.searchsorted(cumulative, top_p) + 1
    keep = order[:cutoff]

    # Renormalize the survivors, then sample one token from what's left
    kept_probs = probs[keep]
    kept_probs = kept_probs / kept_probs.sum()
    return np.random.choice(keep, p=kept_probs)`}
      />

      <Heading level={2} delay={1.0}>
        Beam search, tracking multiple sequences at once
      </Heading>

      <Paragraph delay={1.05}>
        Every strategy so far commits to one token per step and moves on. <strong>Beam search</strong> takes a different approach, keep several candidate sequences, called beams, alive in parallel, and only decide on a winner at the end. With beam width <Formula>{`B`}</Formula>, at every step the algorithm extends every current beam by every candidate next token, scores each resulting sequence by summing the log-probability of every token in it so far (a bigger, less negative sum means a more likely sequence), and keeps only the top <Formula>{`B`}</Formula> scoring sequences. Everything else gets dropped.
      </Paragraph>

      <Paragraph delay={1.1}>
        Say beam width is 2, prompt so far "The weather." Expanding gives three candidates, "is" at -0.2, "was" at -0.5, "will" at -1.2. Keeping the top 2 drops "will," carrying "is" and "was" forward. Expanding each into three children gives six sequences, "is sunny" at -0.5, "is cold" at -1.1, "is great" at -1.7, "was nice" at -0.9, "was terrible" at -1.5, "was cloudy" at -1.1. The top 2 again are "is sunny" at -0.5, the leading beam, and "was nice" at -0.9, the runner-up, everything else pruned.
      </Paragraph>

      <BeamSearchTreeDiagram
        delay={0.05}
        caption="Beam width 2, branch every surviving beam into every candidate token, keep the top 2 cumulative scores, repeat."
      />

      <Paragraph delay={1.15}>
        For tasks with something close to one correct answer, like machine translation, this works well, and beam search still shows up there. Open-ended generation is different. The single highest-probability reply from a chatbot is often short, generic, and safe, "I don't know" scores well because it's a common continuation, not because it's a good answer. Beam search optimizes for the wrong thing here, and it doesn't mix well with the randomness that gives text real variety, since its whole premise is picking one best-scoring path rather than sampling among several reasonable ones. That's why conversational systems mostly reach for temperature and top-p instead, saving beam search for tasks graded on getting close to one right answer.
      </Paragraph>

      <Heading level={2} delay={1.2}>
        Repetition controls, penalties and n-gram blocking
      </Heading>

      <Paragraph delay={1.25}>
        Repetition is common enough that most systems patch for it on top of whatever sampling strategy is in use. A repetition penalty tracks which tokens have already appeared and lowers their score before the next pick, either a flat penalty for having shown up at all, or one that grows with how many times a token has already repeated. Either version nudges the model away from the same kind of loop greedy decoding is prone to, without touching how the other tokens get scored.
      </Paragraph>

      <Paragraph delay={1.3}>
        N-gram blocking is a blunter rule. Instead of nudging probabilities down, it forbids a token outright if choosing it would recreate an n-gram (a run of <Formula>{`n`}</Formula> consecutive tokens) already seen earlier in the response. If the last three words were already used together once, the token that would recreate that exact run gets masked out, no matter how probable it looks. This matters a lot in summarization, where repeating the same phrase verbatim reads as an obvious flaw.
      </Paragraph>

      <Heading level={2} delay={1.35}>
        Constrained decoding, forcing a valid format
      </Heading>

      <Paragraph delay={1.4}>
        Sometimes plausible-sounding text isn't good enough, the output has to be valid JSON matching a specific schema, a function call with the right argument names, or a string that obeys some fixed grammar. Constrained decoding handles this by working directly on the same probability distribution every other strategy in this post is choosing from, but with one extra step, before sampling or taking an argmax, mask out every token that would make the output invalid given everything generated so far, and choose only among what's left.
      </Paragraph>

      <Paragraph delay={1.45}>
        Concretely, if the output has just closed a quoted string right after an opening curly brace, the only legal next characters might be a comma, a closing brace, or whitespace, so every other token gets its probability forced to zero for that step. This requires tracking state as generation goes, a small parser or grammar walking alongside the model, updating what currently counts as legal after each new token. It's the mechanism behind structured-output features and grammar-constrained decoding generally, a hard constraint on top of the model's own preferences, not a suggestion.
      </Paragraph>

      <Heading level={2} delay={1.5}>
        Stopping conditions, knowing when to stop
      </Heading>

      <Paragraph delay={1.55}>
        Generation has to end somewhere, and production systems rely on three mechanisms for that. An end-of-sequence token is a special token the model was trained to produce once it considers its response complete, handling the ordinary case. A maximum token limit is a hard ceiling set by the caller, a safety net against a response that never emits that token and just keeps going. Stop sequences are caller-defined strings that end generation the moment they appear, useful for cutting a response off right at a formatting boundary, like where the model would start writing a new speaker's turn.
      </Paragraph>

      <Heading level={2} delay={1.6}>
        Log probabilities, scoring what came out
      </Heading>

      <Paragraph delay={1.65}>
        Every token a model actually produces came from some probability distribution at that step, and the model can report the log of the probability it assigned to whichever token got chosen. That single number, the <strong>log probability</strong>, is a direct measure of how confident the model was in that specific choice at that specific moment.
      </Paragraph>

      <Formula block delay={1.7}>
        {`\\log P(\\text{sequence}) = \\sum_i \\log P(\\text{token}_i \\mid \\text{context})`}
      </Formula>

      <Paragraph delay={1.75}>
        Chaining probabilities the naive way means multiplying dozens or hundreds of numbers each less than 1, which quickly underflows to a number too small to represent accurately. Working in log space turns that product into a sum instead, adding up the log-probability of every token, which stays numerically stable no matter how long the sequence gets. This is the same trick beam search leaned on earlier without naming it, the "cumulative score" there was just this sum.
      </Paragraph>

      <Paragraph delay={1.8}>
        Log probabilities are the standard way to score generated text after the fact. A higher, less negative, total or average log probability across a candidate's tokens generally means the model found that output more natural, which makes log probability a natural way to rank candidate outputs against each other. It's also the basis for <em>perplexity</em>, a standard measure of how well a model predicts held-out text, and for spotting where a model was unsure, since a token with an unusually low log probability is one the model was effectively guessing at.
      </Paragraph>

      <Heading level={2} delay={1.85}>
        Best-of-N sampling
      </Heading>

      <Paragraph delay={1.9}>
        Best-of-N turns the log-probability idea into a strategy of its own. Generate <Formula>{`N`}</Formula> completions independently, usually with temperature or top-p sampling so they genuinely differ, then pick a winner by some scoring rule, total log probability, a separate reward or verifier model, or simple majority vote when candidates converge on the same answer, a technique often called self-consistency, common for math and reasoning tasks. Quality tends to improve with <Formula>{`N`}</Formula>, but cost and latency scale right along with it, since each completion needs its own full generation.
      </Paragraph>

      <Heading level={2} delay={1.95}>
        Speculative decoding, guessing ahead and verifying in bulk
      </Heading>

      <Paragraph delay={2.0}>
        Every strategy covered so far still generates one token at a time, and that's the fundamental source of latency. Each token needs a full forward pass through the entire model, and each of those passes has to wait for the one before it to finish. <strong>Speculative decoding</strong> is aimed squarely at that latency, without changing what actually gets output.
      </Paragraph>

      <Paragraph delay={2.05}>
        The trick is to split the work across two models. A small, fast draft model proposes a handful of tokens in a row, cheaply and quickly, guessing ahead of where the real model has gotten to. The large model, the one whose output actually matters, then checks all of those tokens in a single forward pass instead of one at a time, since scoring several positions at once costs barely more than scoring one, the expensive part is loading and running the big model, not how many positions it evaluates.
      </Paragraph>

      <Paragraph delay={2.1}>
        Whether a proposed token survives comes down to an acceptance rule. If the draft assigned it probability <Formula>{`q(x)`}</Formula> and the target assigns the same token probability <Formula>{`p(x)`}</Formula> in the same position, it's accepted with probability <Formula>{`\\min(1, p(x)/q(x))`}</Formula>, always accepted if the target agrees at least as strongly, accepted only some of the time otherwise. The moment a token is rejected, a fresh one gets resampled from a corrected distribution built from what's left over, and everything the draft proposed after that point is thrown away. The rule is built so what comes out has exactly the same distribution as if the slow model had generated every token itself, just faster whenever the draft's guesses are good.
      </Paragraph>

      <SpeculativeDecodeDiagram
        delay={0.07}
        caption="A draft model guesses four tokens ahead, the target model verifies all four in one pass, the first mismatch gets rejected and resampled, and the rest gets thrown away."
      />

      <CodeBlock
        delay={2.15}
        language="Python"
        code={`import random
import numpy as np

def verify_token(draft_prob, target_prob):
    # Accept the draft's guess with probability min(1, target / draft)
    if target_prob >= draft_prob:
        return True  # target agrees at least as strongly, always accept
    return random.random() < (target_prob / draft_prob)

def resample_on_reject(draft_probs, target_probs):
    # Rejected, so sample from what's left after subtracting the draft's mass
    residual = np.maximum(target_probs - draft_probs, 0)
    residual = residual / residual.sum()
    return np.random.choice(len(residual), p=residual)`}
      />

      <Paragraph delay={2.2}>
        It's worth being precise about what kind of speedup this is. Speculative decoding is a decoding-time trick that trades a bit of extra compute, running that small draft model, for lower latency, while leaving output quality exactly where it already was. How a large model actually gets deployed and served at scale, batching many requests together, managing memory for attention caches, and so on, is a separate question with its own set of tools.
      </Paragraph>

      <Heading level={2} delay={2.25}>
        The quality-diversity-latency trade-off
      </Heading>

      <Paragraph delay={2.3}>
        Step back and every knob here is really turning one of three dials, quality (does it satisfy the request), diversity (does the same prompt produce different answers, or the same safe one every time), and latency (how much time and compute it costs). Greedy decoding is fast and consistent but has zero diversity and a real tendency to loop. Raising temperature or opening up top-p buys diversity at some risk to quality. Beam search chases quality defined as raw likelihood, at a real cost to diversity, which is why it reads as bland on open-ended tasks. Best-of-N buys quality by spending roughly <Formula>{`N`}</Formula> times the compute. Speculative decoding is the rare knob that's close to free, targeting latency while leaving quality and diversity right where they were.
      </Paragraph>

      <List delay={2.35}>
        <ListItem>Greedy decoding is fastest and fully consistent, but prone to repetition loops.</ListItem>
        <ListItem>Temperature reshapes the whole distribution, the main diversity dial.</ListItem>
        <ListItem>Top-k and top-p trim the unlikely tail before sampling, at almost no extra cost.</ListItem>
        <ListItem>Beam search chases the single most likely sequence, strong for translation, weak on open-ended tasks.</ListItem>
        <ListItem>Repetition penalties and n-gram blocking patch the looping failure mode, cheaply.</ListItem>
        <ListItem>Constrained decoding guarantees valid structure, a hard requirement rather than a preference.</ListItem>
        <ListItem>Best-of-N spends roughly <Formula>{`N`}</Formula> times the compute for a better shot at a good answer.</ListItem>
        <ListItem>Speculative decoding buys latency for close to free, without touching quality or diversity.</ListItem>
      </List>

      <Heading level={2} delay={2.4}>
        Takeaways
      </Heading>

      <List delay={2.45}>
        <ListItem>Every decoding strategy starts from the same thing, a probability distribution over the next token, they differ only in how they turn that distribution into an actual choice.</ListItem>
        <ListItem>Greedy decoding is deterministic and fast but loops, sampling with temperature and top-p trades some of that safety for real variety.</ListItem>
        <ListItem>Beam search optimizes for the wrong thing on open-ended tasks, chasing the single most likely sequence tends to produce short, bland answers.</ListItem>
        <ListItem>Log probabilities are the common currency behind scoring, comparing, and choosing among multiple candidate outputs, including inside best-of-N sampling.</ListItem>
        <ListItem>Speculative decoding is one of the few genuinely free lunches here, it speeds up generation without changing what actually comes out.</ListItem>
      </List>

      <Paragraph delay={2.5}>
        None of these strategies is universally correct, they're knobs a system designer turns based on what a specific product actually needs, a coding assistant wants near-deterministic output, a brainstorming tool wants real variety, and a translation service wants the single best answer it can find. Understanding what each knob is actually doing to the distribution underneath is what makes it possible to pick the right one on purpose instead of by accident. Thanks for reading.
      </Paragraph>
    </>
  ),
};
