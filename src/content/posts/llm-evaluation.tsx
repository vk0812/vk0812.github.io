import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  ReplicationDiagram,
  ReplicationPanel,
  CapacityMathDiagram,
  CapacityGroup,
} from "../components";
import { MessageSquare, Cpu, FileText, CheckSquare, Waypoints, Gavel, BarChart3 } from "lucide-react";

const pipelineNodes: DiagramNode[] = [
  { id: "prompt", label: "Prompt", icon: MessageSquare, color: "text-slate-500", x: 50, y: 10 },
  { id: "model", label: "Model", sub: "generates a response", icon: Cpu, color: "text-blue-500", x: 50, y: 30 },
  { id: "response", label: "Response", icon: FileText, color: "text-slate-500", x: 50, y: 50 },
  { id: "det", label: "Deterministic grader", sub: "exact match, rules", icon: CheckSquare, color: "text-emerald-500", x: 18, y: 72 },
  { id: "sem", label: "Semantic grader", sub: "embedding similarity", icon: Waypoints, color: "text-indigo-500", x: 50, y: 72 },
  { id: "judge", label: "Model judge", sub: "another LLM scores it", icon: Gavel, color: "text-orange-500", x: 82, y: 72 },
  { id: "score", label: "Score", icon: BarChart3, color: "text-slate-500", x: 50, y: 92 },
];

const pipelineEdges: DiagramEdge[] = [
  { id: "e-prompt-model", from: "prompt", to: "model" },
  { id: "e-model-response", from: "model", to: "response" },
  { id: "e-response-det", from: "response", to: "det" },
  { id: "e-response-sem", from: "response", to: "sem" },
  { id: "e-response-judge", from: "response", to: "judge" },
  { id: "e-det-score", from: "det", to: "score" },
  { id: "e-sem-score", from: "sem", to: "score" },
  { id: "e-judge-score", from: "judge", to: "score" },
];

const positionBiasPanels: [ReplicationPanel, ReplicationPanel] = [
  {
    title: "Order 1, Response A shown first",
    writeLabel: "Judge sees",
    fanLabel: "in this order",
    nodes: ["Response A", "Response B"],
    highlightNodes: [0],
    note: "The judge picks whichever response sits in the first slot.",
  },
  {
    title: "Order 2, same two responses swapped",
    writeLabel: "Judge sees",
    fanLabel: "in this order",
    nodes: ["Response B", "Response A"],
    highlightNodes: [0],
    note: "Nothing about the responses changed, only the order, and the winner flips.",
  },
];

const ciGroups: CapacityGroup[] = [
  {
    title: "Sample",
    lines: [
      { expression: "Test set size (n)", result: "200 questions" },
      { expression: "Correct answers", result: "164" },
      { expression: "Observed accuracy (p = 164/200)", result: "82%" },
    ],
    note: "Every benchmark score is an estimate from a sample, not the model's true accuracy on every possible question of that kind.",
  },
  {
    title: "Uncertainty",
    lines: [
      { expression: "Standard error, sqrt(p(1-p)/n)", result: "≈ 2.7%" },
      { expression: "95% margin, 1.96 x SE", result: "≈ 5.3%" },
      { expression: "95% confidence interval", result: "76.7% to 87.3%" },
    ],
    note: "The true accuracy could plausibly sit anywhere in that band, not just at the single 82% that ends up in the report.",
  },
  {
    title: "Comparing two models",
    lines: [
      { expression: "Model A", result: "82% (76.7 to 87.3%)" },
      { expression: "Model B", result: "85% (80.1 to 89.9%)" },
      { expression: "Overlap", result: "80.1% to 87.3%" },
    ],
    note: "The two intervals overlap by a wide margin, so a three-point gap on 200 questions doesn't clearly prove Model B is the better model.",
  },
];

export const llmEvaluation: BlogPostData = {
  title: "LLM Evaluation",
  date: "August 11, 2026",
  slug: "llm-evaluation",
  content: (
    <>
      <Paragraph delay={0.1}>
        Ask a language model "what's 17 times 24" and it might answer "408." Ask it again in a slightly different mood and it might answer "17 times 24 is 408." Both responses are correct. Only one of them matches the string "408" exactly. If a grading script is checking for an exact match against the reference answer, the second response fails, not because the model got the math wrong, but because it phrased the right answer differently.
      </Paragraph>

      <Paragraph delay={0.15}>
        That small mismatch is the whole problem with evaluating language models in miniature. A classifier's output is one label out of a fixed set, which is why the confusion-matrix toolkit of precision, recall, and the rest works so cleanly, there's a small number of exact outcomes to count. A language model's output is a sentence, a paragraph, or a block of code, and the "right answer" usually has many correct phrasings, several valid implementations, or no single correct answer at all. Figuring out whether a language model is actually good means building an entirely different measuring stick, and most of the ways people try to do it have a specific, well-known way of going wrong.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        Task and capability benchmarks
      </Heading>

      <Paragraph delay={0.25}>
        The most basic tool in the kit is a benchmark, a fixed, curated set of questions or tasks with known correct answers. A math benchmark might be a few thousand word problems with a numeric answer key. A coding benchmark might be a set of function signatures plus unit tests that check whether the generated code actually runs and passes. A knowledge benchmark might be multiple-choice questions across a wide range of subjects. Run any model against the same fixed set and everyone gets a comparable, reproducible number, which is exactly why benchmarks became the default way papers and leaderboards report progress.
      </Paragraph>

      <Paragraph delay={0.3}>
        The catch is that a benchmark only measures the narrow slice of behavior it was built to test. A model that's excellent at held-out math word problems can still be a bad conversational assistant, a poor summarizer, or unreliable at following multi-step instructions, none of which the math benchmark ever touched. Benchmarks also age. Once a model saturates a benchmark, meaning it's answering almost everything correctly, the benchmark stops distinguishing a good model from a great one, and once a benchmark is popular and well known, there's pressure, intentional or not, to tune a model until it does well specifically on that benchmark rather than on the broader skill the benchmark was supposed to stand in for.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        When the answers leak into training
      </Heading>

      <Paragraph delay={0.4}>
        There's a sharper version of that last problem, called <strong>benchmark contamination</strong>. Modern language models train on enormous scrapes of the public internet, and a lot of popular benchmarks, along with discussion of their answers, blog posts working through the problems, and forum threads quoting the correct solution, are sitting right there on the web too. If a benchmark's actual questions and answers end up inside a model's training data, the model isn't reasoning its way to the answer during evaluation. It's recalling something close to what it already saw, and the resulting score is inflated in a way that has nothing to do with the capability the benchmark was meant to measure.
      </Paragraph>

      <Paragraph delay={0.45}>
        Contamination is quiet by nature, nothing about a single suspiciously high score proves it happened. Catching it usually means comparing the benchmark's exact text against the training data for verbatim or near-verbatim overlap, checking whether a model's accuracy drops sharply on a freshly written benchmark released after its training cutoff, or testing performance on lightly rephrased versions of the same questions, changed enough that memorized text doesn't help but the underlying skill still would. Some benchmark releases also plant a canary string, a unique marker phrase with no other purpose than signaling to anyone scraping the web later that this text is benchmark data and should be excluded from training.
      </Paragraph>

      <Heading level={2} delay={0.5}>
        How a graded run actually works
      </Heading>

      <Paragraph delay={0.55}>
        Once a benchmark's questions are trustworthy, something still has to turn a model's raw text response into a number. That grading step splits into three broad families, each trading off speed, cost, and how well it handles open-ended text.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={560}
        nodes={pipelineNodes}
        edges={pipelineEdges}
        caption="The three broad ways a generated response becomes a score. Deterministic and semantic graders check the response against a reference answer, a model judge grades it without one."
      />

      <Paragraph delay={0.6}>
        Deterministic and semantic graders both compare the model's response against a known-correct reference answer. A model judge doesn't need one, it reads the response (and often a second response for comparison) and forms its own opinion. Each of the three shows up constantly in practice, and each fails in a different way.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        Deterministic graders, fast but brittle
      </Heading>

      <Paragraph delay={0.7}>
        A deterministic grader checks a response with a fixed rule, no judgment involved. Pull the final number out of a math solution and compare it against the answer key. Run generated code against a suite of unit tests and check whether every test passes. Check whether a specific keyword or citation appears in the output. These graders are fast, essentially free to run at scale, and perfectly reproducible, the same input always produces the same verdict, which is a property none of the other approaches in this post can fully promise.
      </Paragraph>

      <Paragraph delay={0.75}>
        The cost shows up the moment the desired output stops being a single closed-form value. The "17 times 24" example from the opening is exactly this failure, exact-match string comparison has no way to know that "408" and "17 times 24 is 408" mean the same thing. Deterministic grading works well when a response can be normalized down to something narrow, a final number, a pass or fail on a test suite, a value pulled out with a regular expression. It stops working the moment the correct answer is a paragraph of free text with many valid phrasings.
      </Paragraph>

      <Heading level={2} delay={0.8}>
        Semantic metrics, comparing meaning instead of text
      </Heading>

      <Paragraph delay={0.85}>
        Semantic metrics soften that brittleness by comparing meaning instead of exact characters. The common approach embeds both the reference answer and the model's response into vectors using a text embedding model, then measures how close those vectors are, usually with cosine similarity. Two sentences that say the same thing in different words land close together in that embedding space even though their raw text barely overlaps, which is exactly the property exact match is missing.
      </Paragraph>

      <Paragraph delay={0.9}>
        Semantic similarity buys tolerance for paraphrasing, but it isn't a factuality check. Two sentences can be semantically close while one of them is confidently wrong, a fluent, on-topic answer that states the wrong number will often still score a high similarity against the correct one, since the surrounding sentence structure is doing most of the work in the comparison. Semantic metrics are a real improvement over exact match for anything with legitimate phrasing variety, but they answer "does this sound like the reference" rather than "is this actually correct," and those two questions can disagree.
      </Paragraph>

      <Heading level={2} delay={0.95}>
        Pairwise preference evaluation
      </Heading>

      <Paragraph delay={1}>
        Both graders above need a reference answer to check against, which plenty of real prompts don't have. There's often no single correct way to write a product description, summarize an article, or draft an email, so instead of asking "how good is this response on some absolute scale," a lot of real-world evaluation asks a narrower, easier question, given two responses to the same prompt, which one is better.
      </Paragraph>

      <Paragraph delay={1.05}>
        That's <strong>pairwise preference evaluation</strong>, show a grader (human or otherwise) response A and response B side by side and have it pick a winner, or call it a tie. Relative judgments like this turn out to be far more consistent than absolute ones. Asking someone to rate a single response "7 out of 10" invites a different personal scale every time, while asking "which of these two is better" is a much smaller, more stable question to answer. Running enough of these head-to-head comparisons across many prompts and many model pairs produces a ranking, closer to a chess rating system than a single test score, and it's the backbone of how a lot of modern preference data and public model leaderboards get built.
      </Paragraph>

      <Heading level={2} delay={1.1}>
        Human evaluation, the gold standard that doesn't scale
      </Heading>

      <Paragraph delay={1.15}>
        Somebody has to actually make those pairwise calls, or rate a response for helpfulness, tone, or safety, and the most trustworthy option is still a real person reading the output. Human evaluation catches things no automated grader reliably does. Whether an answer is actually useful in context, whether a joke lands, whether a tone is condescending, whether a piece of advice is subtly bad even though it reads fluently. For a lot of open-ended tasks, careful human judgment is still the closest thing to ground truth available.
      </Paragraph>

      <Paragraph delay={1.2}>
        The problem is exactly what you'd expect, it's slow and it's expensive. Paying skilled annotators to read and judge thousands of model outputs, on every model update, for every new capability, doesn't scale to the pace modern model development actually moves at. Human judgment is also noisier than it looks. Different annotators disagree with each other more often than teams like to admit, and the same annotator can rate similar responses differently depending on fatigue, mood, or the order they happened to see them in. Human evaluation stays the gold standard precisely because everything else in this post is trying, imperfectly, to approximate it at a fraction of the cost.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        Model judges, and the biases they bring
      </Heading>

      <Paragraph delay={1.3}>
        The obvious way to get something close to human judgment without paying for thousands of human hours is to use another language model as the judge, sometimes called <strong>LLM-as-judge</strong>. Feed the judge model the prompt, the response (or two responses, for a pairwise comparison), and a rubric describing what "good" means, and let it produce a score or a verdict. This is fast, cheap relative to hiring annotators, and correlates reasonably well with human judgment on a lot of tasks, which is why it's become one of the most common ways to evaluate a model at scale.
      </Paragraph>

      <Paragraph delay={1.35}>
        It's not a free substitute for a human, though. A model judge inherits its own systematic blind spots, and three of them show up constantly enough to have names.
      </Paragraph>

      <List delay={1.4}>
        <ListItem>
          <strong>Position bias.</strong> In a pairwise comparison, a judge can favor whichever response happens to appear first (or, for some judges, second), independent of which response is actually better.
        </ListItem>
        <ListItem>
          <strong>Verbosity bias.</strong> A longer, more detailed-looking response tends to score higher even when the extra length adds no real substance, since a judge often reads thoroughness as quality.
        </ListItem>
        <ListItem>
          <strong>Self-preference bias.</strong> A model used as a judge tends to rate outputs that resemble its own writing style, including its own outputs, more favorably than a neutral judge would.
        </ListItem>
      </List>

      <Paragraph delay={1.45}>
        Position bias is the easiest of the three to see directly, since it's purely about which slot a response sits in, not what it says. Show a judge the exact same pair of responses twice, once in each order, and a biased judge can pick a different winner each time.
      </Paragraph>

      <ReplicationDiagram delay={0.08} panels={positionBiasPanels} />

      <Paragraph delay={1.5}>
        The usual fix for position bias is to run every pairwise comparison in both orders and only count a result as a real win if the same response wins both times, discarding or flagging the rest as a tie. Verbosity and self-preference bias are harder to fully cancel out this way, they don't flip with a simple swap, so a serious model-judge setup usually needs a rubric that explicitly warns the judge against rewarding length for its own sake, and ideally a judge model that's different from any of the models actually being evaluated.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        Safety evals
      </Heading>

      <Paragraph delay={1.6}>
        None of the grading approaches above were built with safety in mind, and safety needs its own dedicated evaluation for a simple reason, a capability benchmark rewards a model for answering well, while a safety eval often needs to reward a model for refusing to answer at all. A math benchmark and a safety benchmark are checking for opposite things on purpose.
      </Paragraph>

      <Paragraph delay={1.65}>
        Safety evals typically run a fixed set of adversarial or sensitive prompts, requests for harmful instructions, attempts to extract private information, prompts designed to jailbreak a model past its own guidelines, and check whether the model appropriately refuses, deflects, or handles the request safely. Some of this testing is automated against known attack patterns, and some of it is deliberate red-teaming, people whose job is specifically to try to break the model in creative ways a fixed test set wouldn't think to include. A model can top every capability leaderboard and still fail badly here, which is exactly why safety evaluation runs as its own separate track rather than one more row on the same benchmark table.
      </Paragraph>

      <Heading level={2} delay={1.7}>
        Regression suites
      </Heading>

      <Paragraph delay={1.75}>
        Every one of these evaluation methods answers "how good is this model right now." A separate, easy-to-overlook question is whether a model just got worse at something it used to handle fine. Fine-tuning on new data, changing a system prompt, swapping in a new checkpoint, or adjusting a safety filter can all quietly break a capability that nobody was specifically testing for in that change, an effect usually called regression.
      </Paragraph>

      <Paragraph delay={1.8}>
        A regression suite is a standing set of prompts, drawn from past failures, edge cases, and everyday use, that gets rerun after every meaningful change and compared against the model's previous outputs. It's the same instinct behind a software test suite, run it constantly, not just when someone remembers to, and treat any prompt that used to succeed and suddenly doesn't as a real bug worth investigating before shipping. Without one, a team can ship an update that clearly improves the target benchmark while silently breaking something a real user relied on, and not find out until users notice first.
      </Paragraph>

      <Heading level={2} delay={1.85}>
        Confidence intervals, why one number isn't enough
      </Heading>

      <Paragraph delay={1.9}>
        Every method in this post eventually produces a single headline number, an accuracy, a win rate, a pass rate. That single number quietly hides how much it could have come out differently by chance alone, especially once the test set is small. A benchmark score is a measurement taken on a sample of questions, not the model's true performance on every possible question of that kind, and treating it as an exact fact rather than an estimate with a margin of error is one of the easiest ways to draw the wrong conclusion from a benchmark.
      </Paragraph>

      <CapacityMathDiagram
        delay={0.09}
        groups={ciGroups}
        caption="A 200-question benchmark's accuracy is really a range, not a point, and two close scores can sit well inside each other's range."
      />

      <Paragraph delay={1.95}>
        The math behind that range is a standard confidence interval for a proportion. For a benchmark of size <Formula>{`n`}</Formula> where the model gets a fraction <Formula>{`p`}</Formula> correct, the standard error and the resulting 95% interval are,
      </Paragraph>

      <Formula block delay={2}>
        {`\\text{SE} = \\sqrt{\\frac{p(1-p)}{n}}, \\qquad \\text{CI}_{95} = p \\pm 1.96 \\times \\text{SE}`}
      </Formula>

      <CodeBlock
        delay={2.05}
        language="Python"
        code={`import math

n = 200
correct = 164
p = correct / n
se = math.sqrt(p * (1 - p) / n)
margin = 1.96 * se

print(round(p, 3), round(se, 4), round(margin, 4))
# 0.82 0.0272 0.0532
print(round(p - margin, 3), round(p + margin, 3))
# 0.767 0.873`}
      />

      <Paragraph delay={2.1}>
        Notice how much that range shrinks as the test set grows, the same formula on a benchmark of 20,000 questions instead of 200 would produce a margin ten times smaller. A three or four point improvement on a 200-question benchmark is easy to headline and often means nothing statistically, while the same gap on a much larger, well-run benchmark can be a real, defensible result. Reporting a benchmark score without also reporting how big the test set was, and ideally the interval around it, leaves out exactly the information needed to tell those two situations apart.
      </Paragraph>

      <Heading level={2} delay={2.15}>
        Putting it together
      </Heading>

      <Paragraph delay={2.2}>
        No single method in this post is "the" way to evaluate a language model, and a serious evaluation process leans on several of them at once, each covering a gap the others leave open.
      </Paragraph>

      <List ordered delay={2.25}>
        <ListItem>Run fixed benchmarks for a reproducible read on specific capabilities, and actively check them for contamination rather than assuming a high score is earned.</ListItem>
        <ListItem>Grade closed-form answers deterministically, and reach for semantic or model-judge grading once the correct answer stops being a single fixed string.</ListItem>
        <ListItem>Use pairwise comparisons, backed by human judgment where it's affordable, for anything open-ended enough that there's no clean reference answer to grade against.</ListItem>
        <ListItem>Run a dedicated safety suite and a standing regression suite on every real change, since neither a capability benchmark nor a preference score is built to catch what either of those is looking for.</ListItem>
        <ListItem>Report every number with its confidence interval and its test set size, not as a bare percentage that looks more precise than it actually is.</ListItem>
      </List>

      <Heading level={2} delay={2.3}>
        Takeaways
      </Heading>

      <List delay={2.35}>
        <ListItem>Benchmarks measure a narrow, fixed slice of behavior, and that slice can be quietly poisoned by contamination, the benchmark's own answers leaking into training data.</ListItem>
        <ListItem>Deterministic grading is fast and perfectly reproducible but brittle the moment a correct answer has more than one valid phrasing, semantic metrics trade some of that precision for tolerance to paraphrasing.</ListItem>
        <ListItem>Relative judgments (pairwise preference) are more consistent than absolute scores, which is why so much real evaluation, human and model-judge alike, is built around asking "which is better" instead of "how good is this."</ListItem>
        <ListItem>A model judge is fast and cheap but carries its own biases, position, verbosity, and self-preference chief among them, and needs its own countermeasures, not blind trust.</ListItem>
        <ListItem>A single benchmark number without a confidence interval and a test set size is an incomplete claim, small test sets in particular can make a real difference look like noise, or noise look like a real difference.</ListItem>
      </List>

      <Paragraph delay={2.4}>
        None of this makes benchmarks or automated grading useless, it just means a single headline score was never the whole story to begin with. Knowing whether a model is actually good takes layering several of these methods, being honest about what each one can't see, and treating the resulting number as an estimate with real uncertainty rather than a fact carved in stone. Thanks for reading.
      </Paragraph>
    </>
  ),
};
