import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  ConvexNonConvexDiagram,
  GdMomentumDiagram,
} from "../components";

export const optimizationFundamentals: BlogPostData = {
  title: "Optimization Fundamentals",
  date: "August 1, 2026",
  slug: "optimization-fundamentals",
  content: (
    <>
      <Paragraph delay={0.10}>
        A training loss curve rarely just falls in a straight line. It drops fast, flattens out for a while like it's stuck, then suddenly drops again. Sometimes two runs with identical architectures and data converge to noticeably different final losses depending only on a learning rate or a batch size. None of that is a bug. It's what optimization actually looks like once the tidy picture of "just follow the gradient downhill" meets a real loss surface with millions of parameters.
      </Paragraph>

      <Paragraph delay={0.15}>
        Gradient descent itself is probably already familiar, compute the gradient of the loss with respect to the parameters, take a step opposite it, repeat. What's less obvious is why that simple rule sometimes converges cleanly and sometimes crawls, why a smaller batch can occasionally train a better model than a bigger one, and why saddle points and not bad local minima turn out to be the real obstacle in high dimensions. That's the gap this post fills in.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Convexity, the case where nothing can go wrong
      </Heading>

      <Paragraph delay={0.25}>
        A function is <strong>convex</strong> if the line segment connecting any two points on its graph never dips below the graph itself. Formally, for any two points <Formula>{`x_1, x_2`}</Formula> and any mixing weight <Formula>{`\\theta \\in [0,1]`}</Formula>,
      </Paragraph>

      <Formula block delay={0.30}>
        {`f(\\theta x_1 + (1-\\theta)x_2) \\leq \\theta f(x_1) + (1-\\theta) f(x_2)`}
      </Formula>

      <Paragraph delay={0.35}>
        A simple bowl shape, <Formula>{`f(x) = x^2`}</Formula>, is convex. A surface with two separate dips and a ridge between them is not, since a line drawn between a point in one dip and a point in the other passes above the ridge, not below it.
      </Paragraph>

      <Paragraph delay={0.40}>
        The reason convexity matters so much is a guarantee it hands over for free. In a convex loss, every local minimum is also the global minimum, and there's exactly one basin to fall into. Start gradient descent anywhere on a convex bowl and it slides to the same bottom. On a non-convex surface, where the network's training loss actually lives, different starting points (different weight initializations) can land in genuinely different minima, some much worse than others, and a saddle point can sit right on the path between two basins, looking flat enough to fool an optimizer into stalling there for a while.
      </Paragraph>

      <ConvexNonConvexDiagram
        delay={0.06}
        caption="Figure 1: A convex bowl has one basin reachable from any starting point, a non-convex surface has separate basins with a saddle sitting on the ridge between them."
      />

      <Paragraph delay={0.45}>
        Linear and logistic regression losses are convex, which is part of why they're so well behaved to train. A deep network's loss is almost never convex, which is exactly why the rest of this post exists.
      </Paragraph>

      <Heading level={2} delay={0.50}>
        Constrained optimization, pricing the rule you're not allowed to break
      </Heading>

      <Paragraph delay={0.55}>
        Plenty of optimization problems come with a constraint attached, maximize accuracy subject to a fixed inference budget, minimize a loss subject to weights summing to one, maximize a margin subject to points staying on the correct side of a boundary. The <strong>Lagrange multiplier</strong> trick turns a constrained problem into an unconstrained one by attaching a price to violating the constraint, then optimizing both the original variables and that price at once.
      </Paragraph>

      <Paragraph delay={0.60}>
        For a problem "maximize <Formula>{`f(x)`}</Formula> subject to <Formula>{`g(x) = c`}</Formula>", the Lagrangian folds the constraint into a single function using a new variable <Formula>{`\\lambda`}</Formula>, the multiplier.
      </Paragraph>

      <Formula block delay={0.65}>
        {`\\mathcal{L}(x, \\lambda) = f(x) - \\lambda \\big(g(x) - c\\big)`}
      </Formula>

      <Paragraph delay={0.70}>
        Setting the gradient of <Formula>{`\\mathcal{L}`}</Formula> with respect to both <Formula>{`x`}</Formula> and <Formula>{`\\lambda`}</Formula> to zero recovers exactly the constraint (from the <Formula>{`\\lambda`}</Formula> equation) plus a condition that the unconstrained gradient of <Formula>{`f`}</Formula> points in the same direction as the constraint's gradient at the optimum. That second condition is the actual insight, at the constrained optimum, there's no direction left that improves <Formula>{`f`}</Formula> without also leaving the constraint surface.
      </Paragraph>

      <Paragraph delay={0.75}>
        A concrete example. Maximize <Formula>{`xy`}</Formula> subject to <Formula>{`x + y = 10`}</Formula>. The Lagrangian is <Formula>{`\\mathcal{L}(x,y,\\lambda) = xy - \\lambda(x + y - 10)`}</Formula>. Taking partial derivatives and setting them to zero gives <Formula>{`y = \\lambda`}</Formula> and <Formula>{`x = \\lambda`}</Formula>, so <Formula>{`x = y`}</Formula>. Combined with the constraint <Formula>{`x + y = 10`}</Formula>, that pins down <Formula>{`x = y = 5`}</Formula>, giving a maximum value of <Formula>{`25`}</Formula>. The multiplier <Formula>{`\\lambda = 5`}</Formula> itself has a reading too, it's the marginal value of loosening the constraint, how much the maximum would improve if the budget of 10 crept up by one unit.
      </Paragraph>

      <Paragraph delay={0.80}>
        This exact machinery is what sits underneath support vector machine margins, entropy-regularized objectives, and any loss with a hard normalization or budget constraint bolted on. The full treatment with inequality constraints (the Karush-Kuhn-Tucker conditions) adds more moving parts, but the core idea stays the same, turn a constraint into a price, then optimize as if there were no constraint at all.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        Gradient descent, taking the steepest way down
      </Heading>

      <Paragraph delay={0.90}>
        The gradient of a loss <Formula>{`\\mathcal{L}(\\theta)`}</Formula> points in the direction that increases the loss fastest at the current point. That's a direct consequence of a first-order Taylor approximation, moving a small step <Formula>{`\\epsilon`}</Formula> in direction <Formula>{`d`}</Formula> changes the loss by roughly <Formula>{`\\epsilon \\, \\nabla \\mathcal{L}(\\theta) \\cdot d`}</Formula>, and that dot product is most negative (the loss drops fastest) exactly when <Formula>{`d`}</Formula> points opposite the gradient. So the negative gradient is, by construction, the steepest way down available at that point. <strong>Gradient descent</strong> just takes that step repeatedly.
      </Paragraph>

      <Formula block delay={0.95}>
        {`\\theta_{t+1} = \\theta_t - \\eta \\, \\nabla \\mathcal{L}(\\theta_t)`}
      </Formula>

      <Paragraph delay={1.00}>
        Here <Formula>{`\\eta`}</Formula> is the learning rate, how large a step to take. A small worked example makes the update rule concrete. Take a toy loss <Formula>{`f(x) = x^2`}</Formula>, whose gradient is <Formula>{`2x`}</Formula>, starting at <Formula>{`x_0 = 10`}</Formula> with <Formula>{`\\eta = 0.1`}</Formula>.
      </Paragraph>

      <CodeBlock
        delay={1.05}
        language="Python"
        code={`x = 10.0
lr = 0.1

for step in range(6):
    grad = 2 * x
    x = x - lr * grad
    print(step + 1, round(x, 4))

# 1 8.0
# 2 6.4
# 3 5.12
# 4 4.096
# 5 3.2768
# 6 2.62144`}
      />

      <Paragraph delay={1.10}>
        Each step multiplies the distance to the minimum by <Formula>{`1 - 2\\eta`}</Formula>, here <Formula>{`0.8`}</Formula>, so the sequence shrinks geometrically toward zero without ever quite reaching it in finitely many steps. Pick <Formula>{`\\eta`}</Formula> too large on this same problem, anything past <Formula>{`\\eta = 1`}</Formula>, and the update starts overshooting and diverging instead of converging, which is the single-variable version of the same instability that shows up when a learning rate is set too aggressively for a real network.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        Stochastic optimization, a noisy gradient for a cheap price
      </Heading>

      <Paragraph delay={1.20}>
        Computing the exact gradient of a loss defined over the entire training set means running every single example through the model before taking one step. For a dataset with millions of examples, that's an enormous amount of work per update. <strong>Stochastic gradient descent</strong> estimates the gradient from a small random mini-batch instead, trading an exact gradient for a noisy but far cheaper one, and updates the parameters right away.
      </Paragraph>

      <Paragraph delay={1.25}>
        That noise sounds like a downside, and in one sense it is, the direction of any single mini-batch's gradient can point somewhat away from the true full-dataset direction. But the noise buys something valuable in return. A full-batch gradient descent step follows the exact downhill direction of the training loss it's given, which means it can settle into any nearby dip, including a shallow, narrow one that a slightly different path would have skipped past entirely. The jitter in a mini-batch gradient acts like a small random kick at every step, and that kick is often enough to bounce a trajectory out of a shallow bad region before it settles there, while a deep, wide minimum is easy to keep sliding into regardless of the noise. This is one real piece of the folklore that a smaller batch size can generalize better, not because smaller batches see more data (they see less per step), but because the extra gradient noise biases training toward the wide, flat regions of the loss surface that tend to generalize well, rather than the sharp, narrow ones that fit the training set more precisely and the test set less reliably.
      </Paragraph>

      <Paragraph delay={1.30}>
        The trade is genuinely a trade, not a free win. Too small a batch and the gradient estimate gets so noisy that training destabilizes or needs a much smaller learning rate to compensate. Too large a batch and training starts looking a lot like expensive full-batch descent, precise but slow to explore and quick to settle wherever it happens to start.
      </Paragraph>

      <Heading level={2} delay={1.35}>
        Conditioning, when one direction is touchy and another barely moves
      </Heading>

      <Paragraph delay={1.40}>
        Not every loss surface curves the same amount in every direction. Take a simple two-variable bowl, <Formula>{`f(x, y) = x^2 + 10y^2`}</Formula>. Moving along <Formula>{`y`}</Formula> changes the loss ten times faster than moving the same distance along <Formula>{`x`}</Formula>. A surface shaped like this, steep in one direction and nearly flat in another, is called <strong>ill-conditioned</strong>, and the ratio between the steepest and flattest curvature is its condition number.
      </Paragraph>

      <Paragraph delay={1.45}>
        Gradient descent doesn't know the surface has this shape, it just follows whatever the local gradient says. On an ill-conditioned bowl, that gradient has a large component in the steep direction and a small one in the flat direction, so a single learning rate that's small enough to avoid overshooting the steep direction ends up taking tiny, overly cautious steps in the flat direction too. The visible symptom is a path that bounces back and forth across the narrow direction while barely creeping forward along the wide one, exactly the zigzag that shows up whenever a loss curve stalls out at a plateau for a long stretch before finally making progress. That plateau usually isn't the optimizer being stuck at a minimum, it's the optimizer crawling along a flat direction while wasting most of its steps correcting overshoot in a steep one.
      </Paragraph>

      <Heading level={2} delay={1.50}>
        Momentum, carrying velocity instead of just reacting
      </Heading>

      <Paragraph delay={1.55}>
        <strong>Momentum</strong> keeps a running average of past gradients, a velocity, and updates the parameters using that accumulated velocity instead of the raw instantaneous gradient.
      </Paragraph>

      <Formula block delay={1.60}>
        {`v_{t+1} = \\beta v_t + \\nabla \\mathcal{L}(\\theta_t), \\qquad \\theta_{t+1} = \\theta_t - \\eta \\, v_{t+1}`}
      </Formula>

      <Paragraph delay={1.65}>
        Here <Formula>{`\\beta`}</Formula> controls how much of the previous velocity carries over, typically something like <Formula>{`0.9`}</Formula>. On an ill-conditioned bowl, the effect is exactly what's needed. In the steep direction, the gradient keeps flipping sign step after step, so the accumulated velocity partially cancels itself out and the oscillation gets damped. In the flat direction, the gradient keeps pointing the same way step after step, so the velocity keeps building and the step size effectively grows over time. The same accumulation that quiets the noisy direction accelerates the quiet one, which is the entire intuition behind why momentum helps in a narrow ravine.
      </Paragraph>

      <GdMomentumDiagram
        delay={0.08}
        caption="Figure 2: Vanilla gradient descent and momentum from the same start on the same ill-conditioned bowl, 14 steps each, verified by hand. Vanilla zigzags across the steep direction, momentum's path is roughly half the length for the same number of steps."
      />

      <Paragraph delay={1.70}>
        Momentum is not the only trick for taming a badly conditioned loss surface, adaptive per-parameter step sizes and learning rate schedules pick up a lot of the remaining slack, and that's a big enough topic on its own to deserve its own separate post later. The point to take from this section is narrower and more durable, once a loss surface stops being a nice round bowl and starts having very different curvature in different directions, the plain gradient stops being the most useful direction to move in on its own, and something has to account for the history of recent gradients to move efficiently at all.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Saddle points, the real obstacle in high dimensions
      </Heading>

      <Paragraph delay={1.80}>
        A <strong>saddle point</strong> is a point where the gradient is zero but it isn't a minimum in every direction, the surface curves upward along some directions and downward along others, like the middle of a horse's saddle. Early intuitions about neural network training worried mostly about getting trapped in a bad local minimum. In practice, for a loss surface with millions of parameters, saddle points turn out to be the far more common and far more troublesome obstacle.
      </Paragraph>

      <Paragraph delay={1.85}>
        The reason is almost purely combinatorial. At any critical point (anywhere the gradient vanishes), whether it behaves like a minimum, a maximum, or a saddle depends on the signs of the curvature along every one of the surface's dimensions. A true local minimum needs every single direction to curve upward at that point. With millions of parameters, the odds that all of them happen to curve the same way at some random critical point are vanishingly small, while the odds that at least one direction curves the other way (making it a saddle) are overwhelming. So as dimensionality grows, critical points that are genuine bad local minima become rare and saddle points become the default. The practical symptom is a loss that flattens out for a long stretch of training, not because the model has settled into a bad basin, but because the gradient has shrunk to nearly nothing near a saddle in every direction that matters at that moment, before eventually finding one of the downward-curving directions and picking back up. That's the other common explanation, alongside conditioning, for why a loss curve plateaus and then suddenly drops.
      </Paragraph>

      <Heading level={2} delay={1.90}>
        Why deep learning optimization doesn't look convex
      </Heading>

      <Paragraph delay={1.95}>
        Put the pieces next to each other and the shape of the problem becomes clear. The clean convex picture from the start of this post, one basin, gradient descent slides right to it, describes the simplest losses well and describes a deep network's loss barely at all. Real training losses are riddled with saddle points that dominate the high-dimensional critical-point landscape, curve very differently in different directions so a single learning rate is never quite right everywhere at once, and get estimated from noisy mini-batches instead of the exact full-dataset gradient on top of all that.
      </Paragraph>

      <Paragraph delay={2.00}>
        None of the tricks that show up in modern training loops are decoration. Momentum exists specifically to cope with ill-conditioning and to carry a trajectory through the nearly flat regions around a saddle instead of stalling there. Adaptive step sizes, learning rate warmup, and decay schedules exist to cope with the fact that a fixed learning rate is a bad fit for a surface whose curvature keeps changing, both across parameters and over the course of training, which is exactly the deeper dive a future post on optimizers and learning rate schedules is for. What's here is the foundation underneath all of it, the shape of the problem those tricks are built to solve.
      </Paragraph>

      <Heading level={2} delay={2.05}>
        Takeaways
      </Heading>

      <List delay={2.10}>
        <ListItem>Convexity guarantees a single reachable global minimum, real network losses give up that guarantee, trading it for saddle points and multiple basins instead.</ListItem>
        <ListItem>Lagrange multipliers turn a constrained optimization problem into an unconstrained one by pricing the constraint, with the multiplier itself reading as the marginal value of loosening that constraint.</ListItem>
        <ListItem>Gradient descent follows the negative gradient because that's provably the steepest available way down, and stochastic mini-batch gradients trade exactness for cheaper steps and noise that can help escape shallow bad regions.</ListItem>
        <ListItem>Conditioning describes how unevenly a loss surface curves across directions, and momentum damps oscillation in the steep direction while accelerating progress in the flat one.</ListItem>
        <ListItem>In high dimensions, saddle points, not bad local minima, are the typical obstacle, which is why a plateauing loss curve is usually a sign of a saddle or ill-conditioning rather than a stuck, settled minimum.</ListItem>
      </List>

      <Paragraph delay={2.15}>
        Every one of these ideas keeps showing up under a different name later, in why a learning rate schedule warms up before decaying, in why Adam tracks a per-parameter second moment, in why a wide flat minimum tends to generalize better than a sharp narrow one. Optimization theory doesn't replace the intuition of "just follow the gradient down", it explains exactly where that intuition needs help. Thanks for reading.
      </Paragraph>
    </>
  ),
};
