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
  ActivationDerivativeChart,
  GradientFlowDepthChart,
} from "../components/animations/activations-initialization-gradient-flow/ConceptViz";

export const activationsInitializationGradientFlow: BlogPostData = {
  title: "Activations, Initialization, and Gradient Flow",
  date: "August 1, 2026",
  slug: "activations-initialization-gradient-flow",
  content: (
    <>
      <Paragraph delay={0.10}>
        Stack ten or fifteen layers of a plain feedforward network and initialize the weights however feels natural. Something goes wrong before a single training step even gets a chance to help. The gradient reaching the earliest layers can end up a thousand times smaller than the gradient reaching the last one, or occasionally a thousand times bigger. Either way, those early layers barely move. Nobody wrote a bug. The network just picked an activation and a starting weight scale that quietly strangled its own backward pass, and the resulting loss curve looks identical to a model that's broken for some completely different reason.
      </Paragraph>

      <Paragraph delay={0.15}>
        Two choices are responsible for almost all of it: which nonlinearity sits between the layers, and how the weights get scaled before training even starts. Neither one shows up in the loss function or the optimizer. Both of them decide, before anything is learned, whether a signal traveling forward stays a reasonable size and whether a gradient traveling backward survives the trip.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Sigmoid and tanh saturate, and their derivative pays for it
      </Heading>

      <Paragraph delay={0.25}>
        A <strong>sigmoid</strong> unit computes <Formula>{`f(z) = 1/(1+e^{-z})`}</Formula>, squashing any real number into the open interval between 0 and 1. Its derivative has a convenient closed form, <Formula>{`f'(z) = f(z)(1-f(z))`}</Formula>, and that expression is exactly where the trouble starts. It's a product of two numbers that are each at most 1 and sum to 1, so the derivative is maximized at <Formula>{`z=0`}</Formula>, where it equals <Formula>{`0.25`}</Formula>, and it only gets smaller from there as <Formula>{`z`}</Formula> moves away from zero in either direction.
      </Paragraph>

      <Paragraph delay={0.30}>
        <strong>Tanh</strong>, <Formula>{`f(z) = \\tanh(z)`}</Formula>, is the zero-centered cousin, squashing into <Formula>{`(-1, 1)`}</Formula> instead, with derivative <Formula>{`f'(z) = 1 - \\tanh^2(z)`}</Formula>. Its peak derivative is a full <Formula>{`1.0`}</Formula> at <Formula>{`z=0`}</Formula>, four times sigmoid's peak, which is one reason tanh usually trains better than sigmoid when both are options. But past that peak it saturates just as hard, arguably harder.
      </Paragraph>

      <ActivationDerivativeChart
        delay={0.06}
        caption="Sigmoid and tanh derivatives at increasing |z|, both computed directly, not approximated. By z=4 either one is passing through less than two percent of whatever gradient arrives."
      />

      <Paragraph delay={0.35}>
        A unit sitting at <Formula>{`z=6`}</Formula> isn't "a little saturated," its local derivative is <Formula>{`0.00247`}</Formula> for sigmoid and <Formula>{`0.00002`}</Formula> for tanh, meaning whatever gradient the chain rule hands to that unit gets multiplied by a number close enough to zero to be indistinguishable from it in floating point. That unit's weights receive an update so tiny it might as well not have happened, on that step and on most of the ones after it, since nothing about the forward pass changes to move <Formula>{`z`}</Formula> back toward zero on its own. Stack enough of these units in a row, each one multiplying an already-small gradient by another number under <Formula>{`0.25`}</Formula>, and the product shrinks geometrically with depth. That's the <strong>vanishing gradient</strong> problem in one sentence, a chain of small derivatives multiplied together across many layers.
      </Paragraph>

      <Heading level={2} delay={0.40}>
        ReLU trades saturation for a different failure mode
      </Heading>

      <Paragraph delay={0.45}>
        <strong>ReLU</strong> (rectified linear unit), <Formula>{`f(z) = \\max(0, z)`}</Formula>, sidesteps the saturation problem for any <Formula>{`z > 0`}</Formula> entirely. Its derivative there is exactly <Formula>{`1`}</Formula>, not a number approaching zero, so a gradient passing through an active ReLU unit is untouched, no shrinkage at all. That's most of why ReLU became the default hidden-layer activation once networks started getting genuinely deep, a fifty-layer stack of ReLUs has a real chance of a gradient reaching layer one intact, where the same depth in sigmoid would have crushed it to nothing.
      </Paragraph>

      <Paragraph delay={0.50}>
        The cost shows up on the other side of zero. ReLU's derivative for <Formula>{`z \\leq 0`}</Formula> is exactly <Formula>{`0`}</Formula>, not small, actually zero. So a unit with a negative pre-activation for a given input passes no gradient back through that input at all. A unit whose weights and bias drift into a region where it outputs zero for every example in the training set is a <strong>dead unit</strong>: permanently inactive, contributing nothing to the forward pass, and receiving no gradient to climb back out with. This isn't a rare edge case either. In a freshly initialized network with symmetric random weights, roughly half of any given ReLU layer's units are inactive for a typical input, simply because half of a zero-mean pre-activation distribution sits below zero.
      </Paragraph>

      <Paragraph delay={0.55}>
        <strong>Leaky ReLU</strong> patches exactly this failure mode by giving the negative side a small nonzero slope instead of flattening it to zero, <Formula>{`f(z) = z`}</Formula> for <Formula>{`z>0`}</Formula>, <Formula>{`f(z) = \\alpha z`}</Formula> for <Formula>{`z \\leq 0`}</Formula>, with <Formula>{`\\alpha`}</Formula> usually a fixed small constant like <Formula>{`0.01`}</Formula>. A unit that drifts negative still has a nonzero derivative, <Formula>{`\\alpha`}</Formula> instead of <Formula>{`0`}</Formula>, so a gradient keeps flowing and the unit gets a chance to drift back. Smoother variants push this further still, <strong>GELU</strong> and <strong>Swish</strong> both replace ReLU's hard corner at zero with a smooth curve that's approximately linear for large positive <Formula>{`z`}</Formula> and approximately zero for very negative <Formula>{`z`}</Formula>, but with a continuous derivative everywhere in between rather than a sharp kink. Modern transformer architectures lean on GELU specifically for that smoothness, though the basic story about gradients and saturation is the same one told here for ReLU and its leaky variant.
      </Paragraph>

      <Heading level={2} delay={0.60}>
        Initialization decides whether variance survives the trip through depth
      </Heading>

      <Paragraph delay={0.65}>
        Activation choice explains what happens to a gradient passing through one unit. What happens across many layers depends just as much on how the weights were scaled to begin with, before any training has occurred. Consider a single linear layer, <Formula>{`z = Wx`}</Formula>, with <Formula>{`x`}</Formula> a vector of <Formula>{`n`}</Formula> independent, zero-mean inputs each with variance <Formula>{`\\text{Var}(x)`}</Formula>, and <Formula>{`W`}</Formula>'s entries independently drawn with variance <Formula>{`\\text{Var}(w)`}</Formula>. The variance of a single output coordinate of <Formula>{`z`}</Formula> works out to a clean product.
      </Paragraph>

      <Formula block delay={0.70}>
        {`\\text{Var}(z) = n \\cdot \\text{Var}(w) \\cdot \\text{Var}(x)`}
      </Formula>

      <Paragraph delay={0.75}>
        Here <Formula>{`n`}</Formula> is the layer's <strong>fan-in</strong>, the number of inputs feeding each output unit. If <Formula>{`\\text{Var}(w)`}</Formula> is set to exactly <Formula>{`1/n`}</Formula>, that factor of <Formula>{`n`}</Formula> cancels and <Formula>{`\\text{Var}(z) = \\text{Var}(x)`}</Formula>, the pre-activation coming out of the layer has the same variance as whatever went in. That's the entire idea behind <strong>Xavier</strong> (also called <strong>Glorot</strong>) initialization, scale each weight by <Formula>{`1/\\sqrt{n}`}</Formula> so its variance is <Formula>{`1/n`}</Formula>, and a signal's spread neither balloons nor collapses purely from passing through the matrix multiply, layer after layer, so long as the activation in between stays close to linear near the origin (which sigmoid and tanh both do, right around <Formula>{`z=0`}</Formula>).
      </Paragraph>

      <Paragraph delay={0.80}>
        ReLU breaks that assumption in a specific, fixable way. It doesn't just squash values near zero, it deletes roughly half of them outright, so a ReLU layer's output variance comes out to about half its input's, not the same. <strong>He initialization</strong> compensates by doubling the weight variance, <Formula>{`\\text{Var}(w) = 2/n`}</Formula> instead of <Formula>{`1/n`}</Formula>, so that after ReLU throws away half the signal, what's left still has roughly the variance it started with. It's the same variance-preserving idea as Xavier, just corrected for the specific way ReLU changes the accounting.
      </Paragraph>

      <Formula block delay={0.85}>
        {`\\text{Xavier, } \\text{Var}(w) = \\frac{1}{n} \\qquad \\text{He, } \\text{Var}(w) = \\frac{2}{n}`}
      </Formula>

      <Heading level={2} delay={0.90}>
        A worked example, twenty tanh layers and three initialization scales
      </Heading>

      <Paragraph delay={0.95}>
        The cleanest way to see what a mismatched scale does is to watch the standard deviation of a layer's activations as a batch of inputs passes through a twenty-layer tanh network, one hundred units wide, comparing three choices for the weight standard deviation, deliberately too small, Xavier's <Formula>{`1/\\sqrt{100} = 0.1`}</Formula>, and deliberately too large.
      </Paragraph>

      <CodeBlock
        delay={1.00}
        language="Python"
        code={`import numpy as np
np.random.seed(0)

N, D, L = 500, 100, 20   # batch size, layer width, depth
x = np.random.randn(N, D)

def run(std_scale):
    a = x.copy()
    stds = [a.std()]
    for _ in range(L):
        W = np.random.randn(D, D) * std_scale
        a = np.tanh(a @ W)
        stds.append(a.std())
    return stds

for label, scale in [("too small, std=0.01", 0.01),
                      ("xavier, std=0.1",   1/np.sqrt(D)),
                      ("too big, std=1.0",  1.0)]:
    print(label, [round(s, 4) for s in run(scale)])

# too small, std=0.01 [0.9967, 0.0988, 0.0096, 0.001, 0.0001, 0.0, 0.0, ...]
# xavier, std=0.1     [0.9967, 0.6267, 0.4835, 0.4051, 0.3541, 0.3205, 0.2829, 0.2603, 0.236, 0.2232, 0.2241, 0.2137, 0.2007, 0.1944, 0.1843, 0.1835, 0.1832, 0.1826, 0.1732, 0.1657, 0.1519]
# too big, std=1.0    [0.9967, 0.958, 0.9583, 0.9581, 0.9583, 0.9576, 0.9581, 0.9576, 0.9571, 0.9574, 0.958, 0.9576, 0.9576, 0.9565, 0.9577, 0.9578, 0.9576, 0.9575, 0.9573, 0.9575, 0.957]`}
      />

      <Paragraph delay={1.05}>
        With <Formula>{`\\text{std}=0.01`}</Formula>, activation spread collapses from <Formula>{`0.997`}</Formula> to <Formula>{`0.0001`}</Formula> by the fifth layer and is indistinguishable from a constant by layer six, every unit in every later layer is outputting essentially the same number regardless of input, which is a network that has, for practical purposes, stopped being able to represent anything. With <Formula>{`\\text{std}=1.0`}</Formula>, the opposite happens immediately, activations jump straight to a spread around <Formula>{`0.96`}</Formula> and stay pinned there, because that scale is large enough to push most tanh units hard into saturation on the very first layer, and once a unit is saturated it stays saturated, since tanh close to <Formula>{`\\pm 1`}</Formula> maps almost any further input right back to nearly the same output.
      </Paragraph>

      <Paragraph delay={1.10}>
        The Xavier-scaled run does something in between, and it's worth being honest about what it actually shows rather than the cleaner story sometimes told about it. Activation spread does decay across depth, from <Formula>{`0.997`}</Formula> down to <Formula>{`0.152`}</Formula> by layer twenty, because tanh is still a nonlinearity and any nonzero fraction of units drifting even slightly into its curved region loses a bit of variance on every pass. But that decay is gradual and roughly geometric rather than a cliff, twenty layers in, the signal is diminished, not gone, which is the entire practical difference Xavier buys over a naively chosen scale. It's a real improvement, not a perfect fix, and that gap between "meaningfully mitigates" and "completely solves" is exactly why later architectural tools, residual connections and normalization layers among them, exist on top of good initialization rather than instead of it.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        The same story on the backward pass, ReLU with Xavier versus He scale
      </Heading>

      <Paragraph delay={1.20}>
        Forward activation variance is one half of the picture, the other is what happens to a gradient running back through the same kind of stack during backpropagation. The setup below builds a fifteen-layer ReLU network, two hundred units wide, seeds a random gradient at the output the way a real loss function would, and pushes it backward through every layer's ReLU derivative and transposed weight matrix, exactly the same mechanics as any full backward pass, just with nothing but random weights and no actual loss attached.
      </Paragraph>

      <CodeBlock
        delay={1.25}
        language="Python"
        code={`import numpy as np
np.random.seed(1)

N, D, L = 256, 200, 15
def relu(z): return np.maximum(0, z)
def drelu(z): return (z > 0).astype(float)

x = np.random.randn(N, D)

def backward_rms(std_scale):
    a, zs, Ws = x.copy(), [], []
    for _ in range(L):
        W = np.random.randn(D, D) * std_scale
        Ws.append(W)
        z = a @ W
        zs.append(z)
        a = relu(z)

    grad = np.random.randn(*a.shape)          # gradient arriving at the output
    rms = [np.linalg.norm(grad) / np.sqrt(grad.size)]
    for l in reversed(range(L)):
        grad = grad * drelu(zs[l])            # through the ReLU derivative
        grad = grad @ Ws[l].T                 # through the linear layer, transposed
        rms.append(np.linalg.norm(grad) / np.sqrt(grad.size))
    return rms   # index 0 = near the output, index L = near the input

xavier_scale = 1 / np.sqrt(D)     # 1/sqrt(fan_in)
he_scale = np.sqrt(2.0 / D)       # sqrt(2/fan_in)

for label, scale in [("xavier scale", xavier_scale), ("he scale", he_scale)]:
    print(label, [round(g, 5) for g in backward_rms(scale)])

# xavier scale [1.00186, 0.68764, 0.4778, 0.35106, 0.23981, 0.17272, 0.12057, 0.0836, 0.05681, 0.04058, 0.02825, 0.02014, 0.0144, 0.01023, 0.00739, 0.00523]
# he scale     [0.998, 1.0258, 1.02229, 1.0229, 0.96846, 0.95052, 0.92991, 0.94607, 0.95546, 0.99521, 0.94862, 0.9489, 0.90371, 0.88176, 0.8971, 0.89255]`}
      />

      <GradientFlowDepthChart
        delay={0.08}
        caption="Backward gradient magnitude at checkpoint layers for the same 15-layer ReLU network under two initialization scales, Xavier's 1/sqrt(fan_in) versus He's sqrt(2/fan_in)."
      />

      <Paragraph delay={1.30}>
        The Xavier-scaled ReLU network's gradient magnitude drops from <Formula>{`1.002`}</Formula> at the output to <Formula>{`0.005`}</Formula> by layer fifteen, roughly halving at every single layer, a factor of nearly <Formula>{`200`}</Formula> lost over fifteen steps. That halving isn't a coincidence, it's the exact mechanism from the earlier section, ReLU zeroes out about half the units at each layer, and Xavier's scale was never designed to account for that loss, only for a linear or near-linear unit that keeps everything. The He-scaled network, run on the identical architecture with nothing changed but that one scale factor, stays within roughly <Formula>{`0.88`}</Formula> to <Formula>{`1.02`}</Formula> across the entire depth, no systematic drift in either direction. Same activation, same depth, same random seed for the data, one deliberately chosen constant is the entire difference between a gradient that reaches the first layer nearly intact and one that's lost more than 99 percent of its magnitude getting there.
      </Paragraph>

      <Paragraph delay={1.35}>
        It's worth checking the dead-unit claim from earlier the same honest way, by counting it directly rather than asserting it. Running that same Xavier-scaled ReLU stack forward and measuring what fraction of each layer's units are exactly zero for a given batch gives roughly <Formula>{`0.5`}</Formula> at every single layer, layer one at <Formula>{`0.500`}</Formula>, layer eight at <Formula>{`0.532`}</Formula>, layer fifteen at <Formula>{`0.531`}</Formula>, bouncing around one half with no particular trend. That's exactly the "roughly half of a zero-mean pre-activation sits below zero" claim, confirmed layer by layer rather than assumed, and it's also a reminder that a healthy ReLU network runs with something close to half its units off at any given moment, that alone isn't the failure mode, a unit stuck at zero for every input across the whole training set is.
      </Paragraph>

      <Heading level={2} delay={1.40}>
        Putting activation and initialization back together
      </Heading>

      <Paragraph delay={1.45}>
        None of this is really two separate topics wearing one heading. An activation function decides, unit by unit, how much of an incoming gradient survives passing through it. A saturated sigmoid or tanh unit passes almost none. An inactive ReLU unit passes exactly none. An active ReLU unit passes all of it.
      </Paragraph>

      <Paragraph delay={1.47}>
        Initialization decides the starting odds of a unit landing in a healthy regime in the first place. A weight scale that's too large drives tanh units straight into saturation before training even begins. A weight scale that ignores what an activation actually does to variance, treating ReLU like it preserves everything the way an identity function would, quietly halves the signal at every layer without anyone choosing that on purpose. Depth is what turns either mistake from a minor inefficiency into a wall: a per-layer effect that would be barely noticeable at three layers compounds into a factor of hundreds by fifteen, and into something indistinguishable from zero well before fifty.
      </Paragraph>

      <Paragraph delay={1.50}>
        The practical takeaway is narrower than it might sound given how much math sits above it. Match the initialization to the activation, Xavier or Glorot scaling for sigmoid and tanh, He scaling for ReLU and its variants, and treat that pairing as one decision, not two independent knobs. Every mainstream framework already defaults new layers to roughly the right scale for whatever activation gets attached to them, which is precisely why this failure mode is easy to go an entire career without hitting directly, and also why it's worth understanding the one time a custom layer, an unusual activation, or a from-scratch implementation removes that safety net.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        Takeaways
      </Heading>

      <List delay={1.60}>
        <ListItem>Sigmoid and tanh both have a bounded, single-peaked derivative (<Formula>{`0.25`}</Formula> and <Formula>{`1.0`}</Formula> respectively) that shrinks toward zero as a unit's pre-activation moves away from zero in either direction, that shrinkage compounding across depth is the vanishing gradient problem.</ListItem>
        <ListItem>ReLU passes gradient untouched for any positive input but exactly zero for any non-positive input, trading saturation for dead units, roughly half of any freshly initialized ReLU layer sits inactive for a typical input, confirmed directly rather than assumed.</ListItem>
        <ListItem>Xavier or Glorot initialization scales weight variance to <Formula>{`1/n`}</Formula> (fan-in) so a linear or near-linear activation preserves signal variance layer to layer, He initialization doubles that to <Formula>{`2/n`}</Formula> specifically to compensate for ReLU zeroing out about half of every layer's units.</ListItem>
        <ListItem>A twenty-layer tanh network's activation spread collapsed to near zero within five layers at a too-small weight scale, and pinned into saturation immediately at a too-large one, Xavier's scale sat between those extremes with a gradual, not catastrophic, decay.</ListItem>
        <ListItem>A fifteen-layer ReLU network's backward gradient magnitude fell by a factor of nearly 200 under Xavier scaling but stayed within a narrow band across the same depth under He scaling, identical architecture, one constant changed.</ListItem>
      </List>

      <Paragraph delay={1.65}>
        Modern architectures layer plenty more on top of this: residual connections that give a gradient a direct path around any single problematic layer, and normalization schemes that re-center and re-scale activations mid-network rather than trusting the initial scale to hold for the whole forward pass. But none of those tools are solving a new problem. They're patching the exact same one demonstrated here with nothing but NumPy and fifteen or twenty plain layers: depth multiplies whatever a single layer does to a gradient's magnitude, for better or very much for worse. Thanks for reading.
      </Paragraph>
    </>
  ),
};
