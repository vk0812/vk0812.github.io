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
import { StrategyComparisonPanels } from "../components/animations/multi-armed-bandits/ConceptViz";
import { Dice5, Eye, RefreshCw } from "lucide-react";

const loopNodes: DiagramNode[] = [
  { id: "pull", label: "Pull an arm", sub: "show one option", icon: Dice5, color: "text-blue-500", x: 15, y: 50 },
  { id: "observe", label: "Observe the reward", sub: "click or no click", icon: Eye, color: "text-indigo-500", x: 50, y: 50 },
  { id: "update", label: "Update the estimate", sub: "for that arm only", icon: RefreshCw, color: "text-emerald-500", x: 85, y: 50 },
];

const loopEdges: DiagramEdge[] = [
  { id: "e-pull-observe", from: "pull", to: "observe" },
  { id: "e-observe-update", from: "observe", to: "update" },
];

export const multiArmedBandits: BlogPostData = {
  title: "Multi-Armed Bandits",
  date: "August 10, 2026",
  slug: "multi-armed-bandits",
  content: (
    <>
      <Paragraph delay={0.10}>
        Picture three versions of a website's checkout button. One says "Buy now," one says "Add to cart," one says "Get it today." Each version has some true click-through rate, the fraction of visitors who click it, but nobody knows what that rate is going in. The only way to learn it is to actually show a version to real visitors and see what happens, one visitor at a time. There's no way to show all three at once and see all three outcomes for the same person.
      </Paragraph>

      <Paragraph delay={0.15}>
        This is the multi-armed bandit problem, named after a row of slot machines (one-armed bandits) that each pay out at a different, unknown rate. Each button, ad, or recommendation option is an <strong>arm</strong>, and pulling an arm means showing it to a visitor and recording the outcome as a reward, a click or no click, a purchase or no purchase. Every bandit algorithm lives inside one tension, <strong>exploitation</strong>, sticking with the arm that has looked best so far, against <strong>exploration</strong>, trying other arms to make sure a better one isn't being missed. Lean too hard into exploitation and a genuinely better option might never get a fair trial. Lean too hard into exploration and plenty of visitors get shown weaker options long after the better one is obvious.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Running the experiment one pull at a time
      </Heading>

      <Paragraph delay={0.25}>
        Say a product team is testing three ad creatives, A, B, and C, and wants to send incoming traffic to whichever one converts best. Unknown to the algorithm (though known to us for the sake of walking through the example), the true click-through rates are 5% for A, 7% for B, and 4% for C. Traffic arrives one visitor at a time. For each visitor, the algorithm picks an arm, shows that creative, and observes whether the visitor clicked. That single click or non-click is the reward for that pull. Over thousands of pulls, the algorithm builds up an estimate of each arm's average reward, and that estimate is the only thing it has to go on when deciding what to show next.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={300}
        nodes={loopNodes}
        edges={loopEdges}
        caption="The basic bandit loop. Pick an arm, observe the reward, update that arm's running estimate, then repeat for the next visitor."
      />

      <Paragraph delay={0.30}>
        That loop, pick an arm, observe the outcome, update the running estimate, then pick again, is the entire mechanics of a bandit system. Everything below is really just a different answer to one question, given the estimates built up so far, which arm should get pulled next?
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Epsilon-greedy, the simplest strategy
      </Heading>

      <Paragraph delay={0.40}>
        The most direct answer is epsilon-greedy. Pick a small number <Formula>{`\\varepsilon`}</Formula> (often something like 0.1), and on each round flip a biased coin. With probability <Formula>{`\\varepsilon`}</Formula>, pull a uniformly random arm, pure exploration. Otherwise, pull whichever arm currently has the best average reward, pure exploitation. With <Formula>{`\\varepsilon`}</Formula> set to 0.1, that means 90% of visitors get routed to the current best-looking creative, and the remaining 10% get spread randomly across all three, just to keep tabs on whether the other two have gotten better or the current leader has gotten worse.
      </Paragraph>

      <Paragraph delay={0.45}>
        The catch is that plain epsilon-greedy keeps exploring at the same fixed rate forever. After a million pulls it's already very clear that creative B is best, but the algorithm still spends 10% of traffic on A and C purely out of habit. A common fix is to decay <Formula>{`\\varepsilon`}</Formula> over time, starting high while nothing is known and shrinking it as more data comes in, so exploration tapers off instead of running at a flat rate indefinitely.
      </Paragraph>

      <Heading level={2} delay={0.50}>
        Upper confidence bound, betting on the unknown
      </Heading>

      <Paragraph delay={0.55}>
        Upper confidence bound methods, UCB for short, take a more deliberate approach to exploration instead of leaving it to a coin flip. The idea is often summarized as optimism in the face of uncertainty. Instead of ranking arms by their average reward alone, UCB adds an uncertainty bonus, a number that's large when an arm has barely been tried and shrinks toward zero the more it gets pulled. The best known version of this rule, called UCB1, picks the arm that maximizes this,
      </Paragraph>

      <Formula block delay={0.60}>
        {`\\arg\\max_{a} \\left[ Q(a) + c \\sqrt{\\frac{\\ln t}{N(a)}} \\right]`}
      </Formula>

      <Paragraph delay={0.65}>
        Here <Formula>{`Q(a)`}</Formula> is the average reward observed for arm <Formula>{`a`}</Formula> so far, <Formula>{`N(a)`}</Formula> is how many times arm <Formula>{`a`}</Formula> has been pulled, <Formula>{`t`}</Formula> is the total number of pulls across every arm combined, and <Formula>{`c`}</Formula> is a constant that controls how much weight to give the uncertainty bonus versus the plain average. As <Formula>{`N(a)`}</Formula> grows, the bonus shrinks toward zero and UCB behaves more and more like plain exploitation.
      </Paragraph>

      <Paragraph delay={0.70}>
        Concretely, say arm A has been pulled 50 times with an average reward of 0.10, and arm B has only been pulled 10 times with a lower average reward of 0.06, at a point where 200 pulls have happened in total. With <Formula>{`c = 2`}</Formula>, arm A's score works out to about 0.75, but arm B's score, boosted by a much bigger uncertainty term because it has so few samples, comes out to about 1.52. UCB picks B next, not because its average looks better, but because there isn't enough data yet to rule out that B is actually the stronger arm.
      </Paragraph>

      <CodeBlock
        delay={0.75}
        language="Python"
        code={`import math

def ucb1_score(avg_reward, pulls, total_pulls, c=2.0):
    if pulls == 0:
        return float("inf")  # always try an untested arm first
    bonus = c * math.sqrt(math.log(total_pulls) / pulls)
    return avg_reward + bonus

def choose_arm(arms):
    # arms: list of {"avg_reward": float, "pulls": int}
    total_pulls = sum(a["pulls"] for a in arms) or 1
    scores = [ucb1_score(a["avg_reward"], a["pulls"], total_pulls) for a in arms]
    return scores.index(max(scores))`}
      />

      <Heading level={2} delay={0.80}>
        Thompson sampling, a Bayesian bet
      </Heading>

      <Paragraph delay={0.85}>
        Thompson sampling takes yet another philosophy. Instead of a point estimate plus a bonus, it keeps a full probability distribution over what each arm's true reward rate might be, called a posterior because it represents belief after seeing some data, and lets that distribution do the exploring. For a click or no-click reward, the natural choice is a Beta distribution, a probability distribution over values between 0 and 1 that gets narrower and more confident the more data it has seen.
      </Paragraph>

      <Paragraph delay={0.90}>
        Every time an arm is pulled, its Beta distribution updates. Say a creative has been shown 200 times and clicked on 14 times. That produces a Beta distribution with parameters 15 and 187 (one added to the click count and one added to the non-click count), which has a mean of about 7.4%, close to that creative's true rate but still spread over a range of plausible values, because 200 samples isn't a huge amount of evidence yet.
      </Paragraph>

      <Paragraph delay={0.95}>
        On every round, Thompson sampling draws one random value from each arm's current Beta distribution, then pulls whichever arm's drawn value is highest. An arm that's barely been tried has a wide, spread-out distribution, so its random draw sometimes lands unusually high, earning it another pull almost by chance. An arm that's been tried thousands of times has a narrow distribution clustered right around its true rate, so its draw is a near-sure thing, rarely surprising in either direction. Exploration and exploitation fall out of the same sampling step, instead of needing a separate rule for each.
      </Paragraph>

      <StrategyComparisonPanels
        delay={0.08}
        panels={[
          {
            title: "Epsilon-greedy",
            rule: "Random arm with probability ε, otherwise the current best average.",
            note: "Simple and reliable, but keeps exploring at a fixed rate forever unless ε decays.",
          },
          {
            title: "Upper confidence bound",
            rule: "Highest average reward plus a shrinking uncertainty bonus.",
            note: "Optimism in the face of uncertainty, untested arms get a temporary boost.",
          },
          {
            title: "Thompson sampling",
            rule: "Sample from each arm's posterior, pull whichever sample is highest.",
            note: "Uncertain arms occasionally sample high and earn a turn, confident arms rarely surprise.",
          },
        ]}
      />

      <Heading level={2} delay={1.00}>
        Contextual bandits, when the best arm depends on who's asking
      </Heading>

      <Paragraph delay={1.05}>
        Everything so far assumes one fixed best arm exists and the job is just to find it. Real traffic rarely works that way. The best ad creative for a teenager browsing on a phone might not be the best one for a retiree browsing on a laptop. A <strong>contextual bandit</strong> adds context, a set of features describing the specific visitor or situation, device type, location, past behavior, and lets the choice of arm depend on that context instead of picking one fixed winner for everyone. Under the hood this usually means fitting a small model per arm, or one shared model that also takes the arm as an input, that predicts expected reward from context, then applying the same exploration strategies, epsilon-greedy, UCB, or Thompson sampling, to those predictions instead of to a single running average.
      </Paragraph>

      <Paragraph delay={1.10}>
        This is also the natural bridge from bandits toward full reinforcement learning. A contextual bandit's context can change with every decision, but the decision itself doesn't change what context arrives next. Full reinforcement learning removes that last simplification, the action taken now can change what state the world is in for the next round, which is what makes it a meaningfully harder problem than picking an arm to match today's context.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        Regret, how these algorithms get graded
      </Heading>

      <Paragraph delay={1.20}>
        With no ground truth to check answers against in real time, bandit algorithms need some way to be judged against each other. The standard yardstick is <strong>regret</strong>, the cumulative gap between what the algorithm actually earned and what an oracle who knew the best arm from the very first round would have earned. If the best arm converts at 7% and the algorithm spends its first 500 pulls exploring weaker options that convert at 4 to 5%, the difference between 7% and whatever was actually achieved, summed over every one of those pulls, is the regret racked up during exploration.
      </Paragraph>

      <Paragraph delay={1.25}>
        Lower cumulative regret over time is literally how bandit algorithms get compared against each other, not just which arm they eventually land on. Two algorithms can end up recommending the exact same best arm and still differ hugely in regret, if one of them wasted far more traffic finding its way there.
      </Paragraph>

      <Heading level={2} delay={1.30}>
        When the world moves, non-stationarity and delayed rewards
      </Heading>

      <Paragraph delay={1.35}>
        Two extra complications show up constantly in production and rarely in a clean textbook version of the problem. The first is <strong>non-stationarity</strong>, the fact that an arm's true reward rate isn't actually fixed over time. An ad creative gets stale and its click-through rate drifts down. A recommendation that felt fresh in January feels dated by summer. A plain running average computed over an arm's entire history reacts to this very slowly, because months of old data outweigh the last few days of a real shift. The usual fixes are a decaying average that weighs recent pulls more heavily than old ones, or a sliding window that only looks at the last several hundred pulls and forgets everything before that.
      </Paragraph>

      <Paragraph delay={1.40}>
        The second is <strong>delayed rewards</strong>. A click is immediate, but a purchase, a subscription renewal, or a return visit might not happen until days after a recommendation was shown. That delay is a real problem for a system trying to learn online, because the reward for a given pull simply isn't known yet at the moment the next decision has to be made. Production systems typically handle this by leaning on an early proxy signal, a click or an add-to-cart, as a fast, noisy stand-in for reward, while the slower, truer signal, an actual purchase, arrives later and corrects the estimate.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Safe online experimentation
      </Heading>

      <Paragraph delay={1.50}>
        None of this works if a bandit is simply let loose on all live traffic from the first pull. A new arm with a bug or a genuinely bad idea behind it can do real damage before the algorithm has collected enough pulls to notice. Production bandit systems borrow heavily from ordinary A/B testing practice to guard against this. A brand new arm typically starts on a small slice of traffic, often a single-digit percentage, and only ramps up gradually as its estimate firms up and looks safe.
      </Paragraph>

      <Paragraph delay={1.55}>
        Just as important is watching guardrail metrics, numbers that aren't the thing being optimized but that would signal something has gone wrong if they moved, page load time, error rate, unsubscribe rate, complaint volume. A bandit chasing click-through rate has no built-in reason to notice it's also tanking page load time or spiking complaints, so those signals get monitored and enforced separately, sometimes as a hard circuit breaker that pulls a misbehaving arm out of rotation automatically.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        Takeaways
      </Heading>

      <List delay={1.65}>
        <ListItem>Every bandit algorithm balances exploitation of the best-known arm against exploration of the others, that's the whole problem in one sentence.</ListItem>
        <ListItem>Epsilon-greedy, UCB, and Thompson sampling are three different ways of deciding how much to explore, a fixed random rate, a shrinking uncertainty bonus, and a full posterior distribution respectively.</ListItem>
        <ListItem>Regret, the cumulative gap versus an all-knowing oracle, is how bandit algorithms actually get compared against each other.</ListItem>
        <ListItem>Contextual bandits let the best arm depend on who's asking, and are the natural bridge toward full reinforcement learning.</ListItem>
        <ListItem>Real production systems also have to handle non-stationarity, delayed rewards, and guardrails, none of which show up in the clean textbook version of the problem.</ListItem>
      </List>

      <Paragraph delay={1.70}>
        Multi-armed bandits are a small, clean model of a problem every recommendation, ad, or experimentation system runs into eventually, deciding what to show without knowing in advance what will actually work. The three strategies here look different on paper, but underneath they're all doing the same accounting, weighing what's already known against what's still worth finding out. Thanks for reading.
      </Paragraph>
    </>
  ),
};
