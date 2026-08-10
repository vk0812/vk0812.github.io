import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
} from "../components";
import {
  OptimizerTrajectoryDiagram,
  LrScheduleDiagram,
} from "../components/animations/optimizers-learning-rate-schedules/ConceptViz";

export const optimizersLearningRateSchedules: BlogPostData = {
  title: "Optimizers and Learning-Rate Schedules",
  date: "August 1, 2026",
  slug: "optimizers-learning-rate-schedules",
  content: (
    <>
      <Paragraph delay={0.10}>
        Plain gradient descent, take a step opposite the gradient, repeat, works fine on a tidy round bowl. Real training losses are not tidy round bowls. They curve steeply in some directions and barely at all in others. That's exactly the ill-conditioning problem that makes a single learning rate a bad fit everywhere at once, and it's the reason momentum exists: it carries a running velocity instead of reacting to just the current gradient, so a narrow ravine stops turning into a zigzag. That part of the story is already covered ground. What's still open is everything that happens once momentum alone isn't enough: when different parameters need genuinely different step sizes, and when the learning rate itself needs to change shape over the course of training rather than sit fixed.
      </Paragraph>

      <Paragraph delay={0.15}>
        The update rule for plain stochastic gradient descent is short enough to restate in one line, subtract the learning rate times the gradient from the parameters.
      </Paragraph>

      <Formula block delay={0.20}>
        {`\\theta_{t+1} = \\theta_t - \\eta \\, g_t, \\qquad g_t = \\nabla \\mathcal{L}(\\theta_t)`}
      </Formula>

      <Paragraph delay={0.25}>
        Momentum's whole contribution is a running average of past gradients standing in for the raw one, damping the direction that keeps flipping sign and accelerating the direction that keeps pointing the same way. Everything below builds on top of that single idea: per-parameter step sizes that adapt to how noisy or how large each parameter's own gradient history has been, and a learning rate that's deliberately not constant across training.
      </Paragraph>

      <Heading level={2} delay={0.30}>
        RMSProp, giving every parameter its own step size
      </Heading>

      <Paragraph delay={0.35}>
        Momentum smooths the direction of the step. It doesn't touch the size. On an ill-conditioned surface, that's still a problem: one learning rate has to be small enough not to blow up the steep direction, which makes it too small to make real progress in the flat one. <strong>RMSProp</strong> attacks the size instead of the direction. It keeps a running average of the squared gradient for every parameter and divides the step by the square root of that average.
      </Paragraph>

      <Formula block delay={0.40}>
        {`v_t = \\beta v_{t-1} + (1-\\beta) g_t^2, \\qquad \\theta_{t+1} = \\theta_t - \\frac{\\eta}{\\sqrt{v_t} + \\epsilon} \\, g_t`}
      </Formula>

      <Paragraph delay={0.45}>
        Here <Formula>{`v_t`}</Formula> is a per-parameter estimate of how large that parameter's gradient has typically been, squared so sign doesn't matter, and <Formula>{`\\epsilon`}</Formula> is a tiny constant that just keeps the division from blowing up when <Formula>{`v_t`}</Formula> is near zero. A parameter whose gradient has consistently been large gets its effective step size shrunk. A parameter whose gradient has consistently been small gets its effective step size boosted. On the two-variable bowl from before, <Formula>{`f(x, y) = x^2 + 10y^2`}</Formula>, the steep <Formula>{`y`}</Formula> direction accumulates a bigger <Formula>{`v_t`}</Formula> and gets divided down, while the flat <Formula>{`x`}</Formula> direction accumulates a smaller <Formula>{`v_t`}</Formula> and keeps a relatively larger step. That's the entire mechanism: no separate learning rate has to be hand-picked per direction, the running squared gradient does that job automatically.
      </Paragraph>

      <Heading level={2} delay={0.50}>
        Adam, momentum and adaptive scaling in one optimizer
      </Heading>

      <Paragraph delay={0.55}>
        <strong>Adam</strong> is what you get from wiring momentum's running gradient average together with RMSProp's running squared-gradient average and letting each one solve the piece it's good at: momentum smooths the direction, the second moment adapts the step size per parameter.
      </Paragraph>

      <Formula block delay={0.60}>
        {`m_t = \\beta_1 m_{t-1} + (1-\\beta_1) g_t, \\qquad v_t = \\beta_2 v_{t-1} + (1-\\beta_2) g_t^2`}
      </Formula>

      <Paragraph delay={0.65}>
        Both running averages start at zero, which is a problem for the first handful of steps. With <Formula>{`\\beta_1 = 0.9`}</Formula>, the very first update sets <Formula>{`m_1 = 0.1 \\, g_1`}</Formula>. Ninety percent of the true gradient's information is missing because there was no history yet to average over. Left uncorrected, the earliest updates would be far smaller than they should be, purely as an artifact of starting from zero rather than any property of the loss surface. Adam corrects for this directly with a <strong>bias-correction</strong> term that rescales each moment by how much of it is still "missing" at step <Formula>{`t`}</Formula>.
      </Paragraph>

      <Formula block delay={0.70}>
        {`\\hat{m}_t = \\frac{m_t}{1 - \\beta_1^t}, \\qquad \\hat{v}_t = \\frac{v_t}{1 - \\beta_2^t}`}
      </Formula>

      <Paragraph delay={0.75}>
        At <Formula>{`t=1`}</Formula> with <Formula>{`\\beta_1=0.9`}</Formula>, the denominator <Formula>{`1 - 0.9^1 = 0.1`}</Formula> exactly cancels the factor that shrank <Formula>{`m_1`}</Formula> in the first place, so <Formula>{`\\hat{m}_1`}</Formula> comes back out equal to the raw gradient. As <Formula>{`t`}</Formula> grows, <Formula>{`\\beta_1^t`}</Formula> shrinks toward zero, the correction factor drifts toward one, and it stops mattering. That's exactly the behavior you want: correct hard when there's barely any history, and back off once there's plenty. The final update divides the bias-corrected momentum by the square root of the bias-corrected second moment.
      </Paragraph>

      <Formula block delay={0.80}>
        {`\\theta_{t+1} = \\theta_t - \\eta \\, \\frac{\\hat{m}_t}{\\sqrt{\\hat{v}_t} + \\epsilon}`}
      </Formula>

      <Paragraph delay={0.85}>
        A worked example makes the difference between these three optimizers concrete rather than notational. Take the same ill-conditioned bowl as before, <Formula>{`f(x, y) = x^2 + 10y^2`}</Formula>, starting at <Formula>{`(4, 4)`}</Formula>, and run fifteen real steps of plain SGD, SGD with momentum, and Adam, each with its own tuned learning rate.
      </Paragraph>

      <CodeBlock
        delay={0.90}
        language="Python"
        code={`import numpy as np

def grad(p):
    x, y = p
    return np.array([2 * x, 20 * y])

def sgd(lr, steps, p):
    pts = [p.copy()]
    for _ in range(steps):
        p = p - lr * grad(p)
        pts.append(p.copy())
    return pts

def sgd_momentum(lr, beta, steps, p):
    v = np.zeros(2)
    pts = [p.copy()]
    for _ in range(steps):
        g = grad(p)
        v = beta * v + g
        p = p - lr * v
        pts.append(p.copy())
    return pts

def adam(lr, steps, p, b1=0.9, b2=0.999, eps=1e-8):
    m, v = np.zeros(2), np.zeros(2)
    pts = [p.copy()]
    for t in range(1, steps + 1):
        g = grad(p)
        m = b1 * m + (1 - b1) * g
        v = b2 * v + (1 - b2) * g ** 2
        m_hat = m / (1 - b1 ** t)
        v_hat = v / (1 - b2 ** t)
        p = p - lr * m_hat / (np.sqrt(v_hat) + eps)
        pts.append(p.copy())
    return pts

start = np.array([4.0, 4.0])
sgd_pts = sgd(0.08, 15, start)
mom_pts = sgd_momentum(0.06, 0.3, 15, start)
adam_pts = adam(0.3, 15, start)

# final positions and loss f(x, y) = x^2 + 10y^2
# SGD       (0.2926, -0.0019)   loss ~= 0.0856
# Momentum  (0.1944, -0.0004)   loss ~= 0.0378
# Adam      (0.0237,  0.0237)   loss ~= 0.0062`}
      />

      <Paragraph delay={0.95}>
        Fifteen identical steps, three very different outcomes. Plain SGD spends most of its steps overshooting back and forth in the steep <Formula>{`y`}</Formula> direction and only creeps along the flat <Formula>{`x`}</Formula> direction, landing at a final loss around <Formula>{`0.086`}</Formula>. Momentum damps that oscillation and lands closer to the minimum, around <Formula>{`0.038`}</Formula>. Adam does best of all, around <Formula>{`0.006`}</Formula>. Its path is visibly different too, almost a straight diagonal line rather than a zigzag, because dividing by the per-parameter second moment rescales the steep and flat directions to look equally steep to the optimizer. The ill-conditioning that plain gradient descent has to fight the whole way down simply isn't visible to Adam anymore.
      </Paragraph>

      <OptimizerTrajectoryDiagram
        delay={0.06}
        caption="Figure 1: Real 15-step trajectories on f(x, y) = x^2 + 10y^2 from (4, 4). SGD zigzags across the steep axis, momentum damps it, Adam's per-parameter scaling turns the same ill-conditioned bowl into a near straight line."
      />

      <Heading level={2} delay={1.00}>
        Weight decay and L2 regularization stop being the same thing
      </Heading>

      <Paragraph delay={1.05}>
        For plain SGD, adding an L2 penalty to the loss and directly shrinking the weights by a fixed fraction every step are mathematically the same operation. An L2 penalty <Formula>{`\\frac{\\lambda}{2}\\|\\theta\\|^2`}</Formula> added to the loss contributes exactly <Formula>{`\\lambda \\theta`}</Formula> to the gradient, so folding it into <Formula>{`g_t`}</Formula> before an SGD step and subtracting <Formula>{`\\eta \\lambda \\theta`}</Formula> as a separate decay step produce identical arithmetic. That equivalence is where the habit of calling both "weight decay" comes from, and it quietly breaks the moment the optimizer is Adam.
      </Paragraph>

      <Paragraph delay={1.10}>
        The reason is the division by <Formula>{`\\sqrt{\\hat{v}_t} + \\epsilon`}</Formula>. Fold the L2 penalty into the gradient the usual way and that penalty term gets divided by the same per-parameter second moment as everything else before it reaches the weights. A weight with a large, noisy gradient history gets its decay shrunk along with its actual gradient signal, and a weight with a small gradient history gets its decay amplified, even though the intended decay rate was supposed to be the same fixed fraction for every weight. <strong>AdamW</strong> fixes this by decoupling the two: apply Adam's usual update from the gradient alone, then subtract the fixed decay directly from the weights afterward, untouched by the adaptive scaling.
      </Paragraph>

      <Formula block delay={1.15}>
        {`\\theta_{t+1} = \\theta_t - \\eta \\left( \\frac{\\hat{m}_t}{\\sqrt{\\hat{v}_t} + \\epsilon} + \\lambda \\theta_t \\right)`}
      </Formula>

      <Paragraph delay={1.20}>
        That single change, moving the decay term outside the adaptive division rather than inside the gradient, is the entire difference between Adam with an L2 penalty and AdamW. It sounds like a minor rearrangement of algebra. In practice it's usually the difference between weight decay actually behaving like weight decay and weight decay silently doing something else to every parameter depending on how noisy that parameter's gradients happen to be.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        Warmup, why starting fast can start unstable
      </Heading>

      <Paragraph delay={1.30}>
        Adam's second moment estimate is built from an average, and an average built from one or two observations is a bad estimate no matter what the bias correction does to rescale it. In the first few steps of training, weights are freshly initialized, the loss surface at that exact point is largely unexplored, and the handful of gradients seen so far can be an unusually poor guide to how big a safe step actually is. A learning rate tuned to be right for step five hundred can be wildly too aggressive for step five. It can push the weights somewhere the model has no way to recover from gracefully: an early spike in the loss curve that sometimes never fully resolves.
      </Paragraph>

      <Paragraph delay={1.35}>
        <strong>Learning-rate warmup</strong> sidesteps this by starting the learning rate near zero and ramping it up linearly over some fixed number of steps before switching to whatever schedule handles the rest of training. Nothing about the optimizer's math changes, only the multiplier in front of it does. So the first handful of updates are deliberately timid while the running gradient statistics are still unreliable, and the learning rate only reaches its intended peak once those statistics have had a chance to settle.
      </Paragraph>

      <Heading level={2} delay={1.40}>
        Step decay and cosine decay, two shapes for the same idea
      </Heading>

      <Paragraph delay={1.45}>
        Once training is past its early unstable steps, the learning rate still shouldn't stay fixed for the whole run. Early on, big steps make sense: the model is far from anywhere good and coarse progress matters more than precision. Late in training, big steps are actively harmful: they overshoot the narrow region near a good minimum and keep the loss bouncing around instead of settling. <strong>Step decay</strong> handles this with a staircase: multiply the learning rate by some fixed factor (often a half or a tenth) every fixed number of steps.
      </Paragraph>

      <Formula block delay={1.50}>
        {`\\eta_t = \\eta_0 \\cdot \\gamma^{\\lfloor t / s \\rfloor}`}
      </Formula>

      <Paragraph delay={1.55}>
        Here <Formula>{`s`}</Formula> is the step interval and <Formula>{`\\gamma`}</Formula> the decay factor. It's simple and effective, but the drops are abrupt: the loss curve often visibly jumps down right at each decay point since the model was previously overshooting slightly and suddenly gets a smaller, more careful step. <strong>Cosine decay</strong> traces the same overall shape, high early, low late, but as a smooth curve instead of a staircase.
      </Paragraph>

      <Formula block delay={1.60}>
        {`\\eta_t = \\frac{\\eta_0}{2}\\left(1 + \\cos\\!\\left(\\frac{\\pi t}{T}\\right)\\right)`}
      </Formula>

      <Paragraph delay={1.65}>
        With <Formula>{`T`}</Formula> the total number of training steps, this starts at <Formula>{`\\eta_0`}</Formula> when <Formula>{`t=0`}</Formula> and glides down to zero exactly at <Formula>{`t=T`}</Formula>, spending most of its time near the peak or near zero and moving through the middle relatively quickly, since a cosine curve is flattest at its endpoints. That shape happens to match what training actually wants reasonably well: a longer stretch of assertive steps early, a longer stretch of fine, careful steps late, and a comparatively brief transition between them. <strong>Cosine restarts</strong> take this one step further, running the cosine curve down to a low point, then jumping the learning rate back up and running the same decay again, repeated several times over training. Each restart gives the optimizer one more chance to take a bigger step out of whatever region it had settled into, sometimes finding a better minimum nearby that a single monotonic decay would have missed entirely.
      </Paragraph>

      <LrScheduleDiagram
        delay={0.06}
        caption="Figure 2: Step decay drops in sharp jumps every 25 steps, cosine decay glides smoothly to zero, warmup and cosine combine a short linear ramp with the same smooth decay after it."
      />

      <Heading level={2} delay={1.70}>
        Batch size and learning rate move together
      </Heading>

      <Paragraph delay={1.75}>
        A mini-batch gradient is a noisy estimate of the true gradient, and averaging over more examples in a batch reduces that noise. Doubling the batch size roughly halves the variance of the gradient estimate, which means the resulting step direction is more reliable and, on average, closer to what a much larger batch or even the full dataset would have produced. That extra reliability is exactly what makes a bigger learning rate safe: there's less risk that a single step is chasing noise rather than signal. The rough rule of thumb, often called the <strong>linear scaling rule</strong>, ties the two together directly: when the batch size scales by some factor, scale the learning rate by that same factor to keep the expected step roughly the same size relative to the reduced noise.
      </Paragraph>

      <Formula block delay={1.80}>
        {`\\eta_{\\text{new}} = \\eta_{\\text{old}} \\cdot \\frac{B_{\\text{new}}}{B_{\\text{old}}}`}
      </Formula>

      <Paragraph delay={1.85}>
        It's a rule of thumb rather than a law. It tends to break down at very large batch sizes where the noise reduction stops being the bottleneck and something else in training becomes the limiting factor instead. Warmup pairs naturally with this rule too, a bigger batch usually means a bigger target learning rate, and a bigger target learning rate is exactly the situation where jumping straight to it from an untrained model is riskiest, so a warmup phase becomes more important, not less, as batch size grows.
      </Paragraph>

      <Heading level={2} delay={1.90}>
        Gradient clipping, capping the worst-case step
      </Heading>

      <Paragraph delay={1.95}>
        Every schedule and every adaptive optimizer so far assumes the gradient itself is a reasonable quantity to build a step out of. Every so often it isn't. A batch that happens to contain a few unusually extreme examples, an unstable region of the loss surface, or a numerically fragile operation deep in a network can produce a gradient that's enormous compared to everything around it, and no learning rate schedule alone protects against a single freak spike like that. <strong>Gradient clipping</strong> puts a hard ceiling on how large a gradient's norm is allowed to be before it's used, rescaling it down if it exceeds a threshold and leaving it untouched otherwise.
      </Paragraph>

      <Formula block delay={2.00}>
        {`g_t \\leftarrow g_t \\cdot \\min\\!\\left(1, \\frac{c}{\\|g_t\\|}\\right)`}
      </Formula>

      <Paragraph delay={2.05}>
        With <Formula>{`c`}</Formula> the clip threshold, this leaves the gradient's direction untouched and only shrinks its magnitude when it crosses the ceiling. It's cheap insurance against the single worst step in an otherwise well-behaved run, and it's standard practice in most training setups that involve recurrent connections or very deep stacks, where a rare large gradient is more of a when than an if.
      </Paragraph>

      <Heading level={2} delay={2.10}>
        Reading an unstable loss curve
      </Heading>

      <Paragraph delay={2.15}>
        Most of what goes wrong in training leaves a visible signature on the loss curve, and knowing what each signature usually points back to saves a lot of guessing.
      </Paragraph>

      <List delay={2.20}>
        <ListItem><strong>A single sharp spike</strong> that recovers on its own afterward usually points to one bad batch or a momentary large gradient, gradient clipping is the direct fix.</ListItem>
        <ListItem><strong>Repeated spikes at regular intervals</strong> often line up with a learning rate schedule's decay points, especially step decay's abrupt jumps, or with a data loader boundary if the spikes line up with epoch edges instead.</ListItem>
        <ListItem><strong>A loss that goes to NaN</strong> almost always means some intermediate value overflowed, frequently traceable to a learning rate that was too high for the current stage of training, a missing gradient clip, or a numerically unstable operation like an unguarded division or an exponential of a large number.</ListItem>
        <ListItem><strong>Sustained oscillation without ever settling</strong> is the classic sign of a learning rate that's simply too high for the current region of the loss surface, the same overshoot-and-bounce pattern an ill-conditioned bowl produces under plain gradient descent, just showing up later in training instead of at the very start.</ListItem>
        <ListItem><strong>A loss that plateaus for a long stretch then drops again</strong> is often completely healthy, the same saddle-point or ill-conditioning behavior any non-convex loss surface produces, and not automatically a sign anything is broken.</ListItem>
      </List>

      <Paragraph delay={2.25}>
        None of these are perfectly diagnostic on their own. A spike can come from clipping being absent or from a corrupted batch just as easily. But the loss curve's shape is almost always the first and cheapest signal available, well before digging into gradient norms or activation statistics is worth the effort.
      </Paragraph>

      <Heading level={2} delay={2.30}>
        Takeaways
      </Heading>

      <List delay={2.35}>
        <ListItem>RMSProp and Adam adapt the step size per parameter using a running average of squared gradients, which is what lets a single optimizer handle directions with very different curvature without a hand-tuned learning rate for each.</ListItem>
        <ListItem>Adam's bias correction exists purely to fix the fact that its running averages start at zero, without it the earliest updates would be artificially small for reasons that have nothing to do with the actual loss surface.</ListItem>
        <ListItem>Weight decay and an L2 penalty stop being equivalent once the optimizer divides by an adaptive per-parameter scale, which is exactly the gap AdamW closes by decaying weights outside that division.</ListItem>
        <ListItem>Warmup exists because the earliest gradient statistics are unreliable, and step decay, cosine decay, and cosine restarts are all different shapes for the same underlying idea, start assertive, end careful.</ListItem>
        <ListItem>A loss curve's shape, a sharp spike, a NaN, sustained oscillation, or a long plateau, is usually the cheapest and fastest signal for diagnosing what's actually going wrong in a training run.</ListItem>
      </List>

      <Paragraph delay={2.40}>
        Every one of these tricks is solving a problem that plain gradient descent and momentum alone leave on the table: a surface that curves unevenly across parameters, a start of training too unreliable to trust a full-size step, and a training run long enough that a single fixed learning rate stops being the right choice for all of it at once. None of it is exotic once the shape of the underlying problem is clear. It's the same handful of ideas: adapt the step to the parameter, adapt the rate to the stage of training, and cap the worst case, applied in slightly different combinations depending on the optimizer. Thanks for reading.
      </Paragraph>
    </>
  ),
};
