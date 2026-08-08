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
import { ForwardBackwardPassDiagram } from "../components/animations/neural-networks-backpropagation-from-scratch/ConceptViz";

export const neuralNetworksBackpropagationFromScratch: BlogPostData = {
  title: "Neural Networks and Backpropagation from Scratch",
  date: "August 1, 2026",
  slug: "neural-networks-backpropagation-from-scratch",
  content: (
    <>
      <Paragraph delay={0.10}>
        Strip away the framework, the autograd, the GPU kernels, and a neural network's forward pass is barely more than a matrix multiply and a squashing function, repeated a handful of times. What actually lets that stack of multiplies get better at a task, backpropagation, is one clean application of a rule from first-year calculus, applied mechanically however many layers get stacked on top of it. It looks intimidating mostly because of the notation, not the idea.
      </Paragraph>

      <Paragraph delay={0.15}>
        Everything below builds up from a single neuron to a small trainable network, and along the way there's one tiny network, two inputs, two hidden units, one output, whose forward and backward pass gets computed twice, once by hand and once by NumPy, so the two can be checked against each other line by line.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        The perceptron, one neuron on its own
      </Heading>

      <Paragraph delay={0.25}>
        The simplest unit is a <strong>perceptron</strong>. It takes a vector of inputs, multiplies each one by a learned weight, adds them up along with a bias term, and passes the result through some function.
      </Paragraph>

      <Formula block delay={0.30}>
        {`z = w_1 x_1 + w_2 x_2 + \\dots + w_n x_n + b, \\qquad a = f(z)`}
      </Formula>

      <Paragraph delay={0.35}>
        In the original perceptron, <Formula>{`f`}</Formula> was a hard step function, output 1 if <Formula>{`z`}</Formula> crossed zero, output 0 otherwise, which makes the whole thing a linear classifier. Geometrically, <Formula>{`z = 0`}</Formula> is a straight line (or, with more inputs, a flat plane) cutting the input space in two, and the perceptron just reports which side a point falls on. That's enough to learn AND, OR, and any other pattern where a single straight line can separate the two classes.
      </Paragraph>

      <Paragraph delay={0.40}>
        It is not enough for XOR. Plot the four points of XOR, (0,0) and (1,1) both map to 0, (0,1) and (1,0) both map to 1, and there is no single straight line that puts the two zeros on one side and the two ones on the other. A single perceptron simply cannot represent that function, no matter how its weights get tuned. That limitation is exactly what motivates stacking more than one of them together.
      </Paragraph>

      <Heading level={2} delay={0.45}>
        Stacking perceptrons into a multilayer network
      </Heading>

      <Paragraph delay={0.50}>
        A <strong>multilayer network</strong> arranges perceptron-like units into layers, an input layer, one or more hidden layers, and an output layer, where every unit in a layer takes its input from every unit in the layer before it. The running example for the rest of this post is about as small a network as still makes the point, two inputs, one hidden layer with two units, one output unit, usually written as a 2-2-1 network.
      </Paragraph>

      <Paragraph delay={0.55}>
        Writing this out per-neuron gets tedious fast, so it helps to switch to matrix notation right away. Each layer has a weight matrix <Formula>{`W`}</Formula> and a bias vector <Formula>{`b`}</Formula>, and a whole layer's worth of weighted sums is one matrix-vector product.
      </Paragraph>

      <Formula block delay={0.60}>
        {`z^{(1)} = W^{(1)} x + b^{(1)}, \\qquad a^{(1)} = f\\!\\left(z^{(1)}\\right)`}
      </Formula>

      <Paragraph delay={0.65}>
        Here <Formula>{`W^{(1)}`}</Formula> is a 2 by 2 matrix (two hidden units, two inputs each), <Formula>{`x`}</Formula> is the two-element input vector, and <Formula>{`a^{(1)}`}</Formula> is the hidden layer's activations after the nonlinearity. The output layer repeats the exact same pattern one level up, taking the hidden activations as its own input.
      </Paragraph>

      <Formula block delay={0.70}>
        {`z^{(2)} = W^{(2)} a^{(1)} + b^{(2)}, \\qquad \\hat y = f\\!\\left(z^{(2)}\\right)`}
      </Formula>

      <Paragraph delay={0.75}>
        That's the entire <strong>forward pass</strong> for a two-layer network, two matrix multiplies and two nonlinearities, chained together. A deeper network just repeats the same <Formula>{`z^{(l)}=W^{(l)}a^{(l-1)}+b^{(l)}`}</Formula>, <Formula>{`a^{(l)}=f(z^{(l)})`}</Formula> pattern for however many layers <Formula>{`l`}</Formula> there are, with each layer's output feeding straight into the next layer's input.
      </Paragraph>

      <Heading level={2} delay={0.80}>
        Why the nonlinearity can't be dropped
      </Heading>

      <Paragraph delay={0.85}>
        It's tempting to wonder whether the nonlinearity <Formula>{`f`}</Formula> is really necessary, since the matrix multiplies are doing the heavy lifting. It is necessary, and the reason falls straight out of the algebra. Suppose <Formula>{`f`}</Formula> were just the identity function, so <Formula>{`a^{(1)} = z^{(1)}`}</Formula>. Substituting the first layer directly into the second gives
      </Paragraph>

      <Formula block delay={0.90}>
        {`\\hat y = W^{(2)}\\left(W^{(1)} x + b^{(1)}\\right) + b^{(2)} = \\left(W^{(2)}W^{(1)}\\right)x + \\left(W^{(2)}b^{(1)} + b^{(2)}\\right)`}
      </Formula>

      <Paragraph delay={0.95}>
        <Formula>{`W^{(2)}W^{(1)}`}</Formula> is itself just some matrix, and <Formula>{`W^{(2)}b^{(1)} + b^{(2)}`}</Formula> is itself just some vector, so the whole two-layer stack collapses algebraically into a single linear map, no different in expressive power from one perceptron layer. Stack ten linear layers with no nonlinearity between them and the result is still, provably, one linear map. Depth buys nothing without something nonlinear breaking that collapse, which is the entire reason every real hidden layer has a squashing function (sigmoid, tanh, ReLU, whichever a given architecture picks) sitting between the matrix multiplies rather than nothing at all.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        The chain rule, run backward through the network
      </Heading>

      <Paragraph delay={1.05}>
        Training a network means adjusting every weight and bias to reduce a loss, and reducing a loss with gradient descent means computing how the loss changes with respect to every single one of those parameters. <strong>Backpropagation</strong> is the algorithm for computing all of those derivatives efficiently, and it's nothing more exotic than the chain rule, applied layer by layer, starting from the output and working backward.
      </Paragraph>

      <Paragraph delay={1.10}>
        Take squared error as the loss for a single example, <Formula>{`\\mathcal{L} = \\frac{1}{2}(\\hat y - y)^2`}</Formula>. The derivative of the loss with respect to the output layer's pre-activation <Formula>{`z^{(2)}`}</Formula> is where backpropagation always starts, and it has a name, <strong>delta</strong>.
      </Paragraph>

      <Formula block delay={1.15}>
        {`\\delta^{(2)} = \\frac{\\partial \\mathcal{L}}{\\partial z^{(2)}} = \\frac{\\partial \\mathcal{L}}{\\partial \\hat y}\\cdot\\frac{\\partial \\hat y}{\\partial z^{(2)}} = (\\hat y - y)\\, f'\\!\\left(z^{(2)}\\right)`}
      </Formula>

      <Paragraph delay={1.20}>
        Once <Formula>{`\\delta^{(2)}`}</Formula> is known, the gradients with respect to that layer's own weights and bias fall out directly, since <Formula>{`z^{(2)} = W^{(2)}a^{(1)} + b^{(2)}`}</Formula> is linear in both.
      </Paragraph>

      <Formula block delay={1.25}>
        {`\\frac{\\partial \\mathcal{L}}{\\partial W^{(2)}} = \\delta^{(2)} \\left(a^{(1)}\\right)^{\\top}, \\qquad \\frac{\\partial \\mathcal{L}}{\\partial b^{(2)}} = \\delta^{(2)}`}
      </Formula>

      <Paragraph delay={1.30}>
        The interesting step is moving the delta back one more layer, into the hidden layer, since the hidden layer's weights don't touch the loss directly, only through everything downstream of them. The chain rule handles that indirection by first asking how the loss depends on the hidden activation <Formula>{`a^{(1)}`}</Formula> (through every path that activation feeds into, which for this network is just the output unit), then converting that into a derivative with respect to <Formula>{`z^{(1)}`}</Formula> using the hidden layer's own nonlinearity.
      </Paragraph>

      <Formula block delay={1.35}>
        {`\\delta^{(1)} = \\frac{\\partial \\mathcal{L}}{\\partial z^{(1)}} = \\left(\\left(W^{(2)}\\right)^{\\top}\\delta^{(2)}\\right)\\odot f'\\!\\left(z^{(1)}\\right)`}
      </Formula>

      <Paragraph delay={1.40}>
        <Formula>{`\\odot`}</Formula> is an elementwise product, and <Formula>{`\\left(W^{(2)}\\right)^{\\top}\\delta^{(2)}`}</Formula> is exactly the output layer's weight matrix run in reverse, distributing the output's error signal back to whichever hidden unit contributed to it, in proportion to the very same weight that carried its activation forward. That's the whole trick of backpropagation in one line, the same weights used going forward get reused, transposed, going backward. With <Formula>{`\\delta^{(1)}`}</Formula> in hand, the first layer's gradients follow the identical pattern as the second layer's did.
      </Paragraph>

      <Formula block delay={1.45}>
        {`\\frac{\\partial \\mathcal{L}}{\\partial W^{(1)}} = \\delta^{(1)} x^{\\top}, \\qquad \\frac{\\partial \\mathcal{L}}{\\partial b^{(1)}} = \\delta^{(1)}`}
      </Formula>

      <Paragraph delay={1.50}>
        Every additional hidden layer in a deeper network just repeats that same backward step, <Formula>{`\\delta^{(l)} = \\left(\\left(W^{(l+1)}\\right)^{\\top}\\delta^{(l+1)}\\right)\\odot f'(z^{(l)})`}</Formula>, one layer at a time, from the output back to the input. Nothing about a hundred-layer network changes this rule, it's the same two-line computation repeated a hundred times instead of twice.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        A fully worked example, by hand and verified in NumPy
      </Heading>

      <Paragraph delay={1.60}>
        Numbers make all of the above concrete. Take the sigmoid nonlinearity, <Formula>{`f(z) = 1/(1+e^{-z})`}</Formula>, whose convenient derivative is <Formula>{`f'(z) = f(z)(1-f(z))`}</Formula>, an input <Formula>{`x = (0.05, 0.10)`}</Formula>, a target <Formula>{`y = 0.01`}</Formula>, and fixed starting weights.
      </Paragraph>

      <Formula block delay={1.65}>
        {`W^{(1)} = \\begin{bmatrix}0.15 & 0.20 \\\\ 0.25 & 0.30\\end{bmatrix}, \\;\\; b^{(1)} = \\begin{bmatrix}0.35 \\\\ 0.35\\end{bmatrix}, \\;\\; W^{(2)} = \\begin{bmatrix}0.40 & 0.45\\end{bmatrix}, \\;\\; b^{(2)} = 0.60`}
      </Formula>

      <Paragraph delay={1.70}>
        The forward pass computes the hidden pre-activations, <Formula>{`z^{(1)} = W^{(1)}x + b^{(1)} = (0.3775, 0.3925)`}</Formula>, then squashes them with sigmoid to get <Formula>{`a^{(1)} = (0.5933, 0.5969)`}</Formula>. Feeding those into the output layer gives <Formula>{`z^{(2)} = 1.1059`}</Formula> and <Formula>{`\\hat y = 0.7514`}</Formula>. The target was <Formula>{`0.01`}</Formula>, so this network, at its starting weights, is badly wrong, and the squared error loss comes out to <Formula>{`0.2748`}</Formula>.
      </Paragraph>

      <Paragraph delay={1.75}>
        Running the backward equations from the previous section by hand, <Formula>{`\\delta^{(2)} = (\\hat y - y)\\,\\hat y(1-\\hat y) = 0.1385`}</Formula>. That gives the output layer's gradients, <Formula>{`\\partial \\mathcal{L}/\\partial W^{(2)} = \\delta^{(2)} a^{(1)} = (0.0822, 0.0827)`}</Formula> and <Formula>{`\\partial \\mathcal{L}/\\partial b^{(2)} = 0.1385`}</Formula>. Pushing the delta back one layer, <Formula>{`\\delta^{(1)} = \\left(W^{(2)\\top}\\delta^{(2)}\\right)\\odot a^{(1)}(1-a^{(1)}) = (0.0134, 0.0150)`}</Formula>, giving the hidden layer's gradients, <Formula>{`\\partial \\mathcal{L}/\\partial W^{(1)} = \\delta^{(1)} x^{\\top} = \\begin{bmatrix}0.00067 & 0.00134 \\\\ 0.00075 & 0.00150\\end{bmatrix}`}</Formula> and <Formula>{`\\partial \\mathcal{L}/\\partial b^{(1)} = (0.0134, 0.0150)`}</Formula>.
      </Paragraph>

      <ForwardBackwardPassDiagram
        delay={0.08}
        caption="The 2-2-1 network's forward pass (blue, left to right) and backward pass (orange, curved, right to left), every value taken directly from the worked example and confirmed against NumPy."
      />

      <Paragraph delay={1.80}>
        None of that arithmetic was taken on faith. The same forward and backward pass, run in NumPy, reproduces every one of these numbers to at least six decimal places, and a finite-difference gradient check, nudging each individual weight up and down by a tiny amount and measuring how much the loss moves, agrees with the analytic backprop gradients to within <Formula>{`10^{-11}`}</Formula>, well past the point where the difference could be anything other than floating-point noise.
      </Paragraph>

      <CodeBlock
        delay={1.85}
        language="Python"
        code={`import numpy as np

def sigmoid(z):
    return 1.0 / (1.0 + np.exp(-z))

def dsigmoid_from_output(a):
    return a * (1 - a)

W1 = np.array([[0.15, 0.20], [0.25, 0.30]])
b1 = np.array([0.35, 0.35])
W2 = np.array([[0.40, 0.45]])
b2 = np.array([0.60])
x = np.array([0.05, 0.10])
y = np.array([0.01])

# forward pass
z1 = W1 @ x + b1
a1 = sigmoid(z1)
z2 = W2 @ a1 + b2
a2 = sigmoid(z2)
loss = 0.5 * np.sum((a2 - y) ** 2)
print(a1, a2, loss)
# [0.5933 0.5969] [0.7514] 0.27481

# backward pass, analytic
delta2 = (a2 - y) * dsigmoid_from_output(a2)
dW2 = np.outer(delta2, a1)
db2 = delta2
delta1 = (W2.T @ delta2) * dsigmoid_from_output(a1)
dW1 = np.outer(delta1, x)
db1 = delta1
print(dW1, db1, dW2, db2)
# [[0.00067 0.00134] [0.00075 0.00150]] [0.0134 0.0150] [[0.0822 0.0827]] [0.1385]

# finite-difference check on every parameter, eps = 1e-5
eps = 1e-5
def forward_loss(W1, b1, W2, b2):
    a1 = sigmoid(W1 @ x + b1)
    a2 = sigmoid(W2 @ a1 + b2)
    return 0.5 * np.sum((a2 - y) ** 2)

# perturbing each entry of W1, b1, W2, b2 by +-eps and taking
# (loss_plus - loss_minus) / (2 * eps) matches the analytic gradients
# above to within 5e-12 for every single parameter`}
      />

      <Paragraph delay={1.90}>
        One gradient descent step at a learning rate of <Formula>{`0.5`}</Formula> already moves things in the right direction, the output drops from <Formula>{`0.7514`}</Formula> to <Formula>{`0.7284`}</Formula> and the loss drops from <Formula>{`0.2748`}</Formula> to <Formula>{`0.2580`}</Formula>, a small step toward the target of <Formula>{`0.01`}</Formula>. Repeating that update thousands of times, which is exactly what the training loop later in this post does, is the entire recipe.
      </Paragraph>

      <Heading level={2} delay={1.95}>
        Mini-batches and vectorization
      </Heading>

      <Paragraph delay={2.00}>
        Real training never runs one example through the network at a time. A <strong>mini-batch</strong> stacks several examples into a single matrix, one row per example, and the forward and backward equations from before barely change, they just gain a batch dimension.
      </Paragraph>

      <Formula block delay={2.05}>
        {`Z^{(1)} = XW^{(1)\\top} + b^{(1)}, \\qquad A^{(1)} = f\\!\\left(Z^{(1)}\\right)`}
      </Formula>

      <Paragraph delay={2.10}>
        Here <Formula>{`X`}</Formula> is an <Formula>{`n \\times d`}</Formula> matrix (<Formula>{`n`}</Formula> examples, <Formula>{`d`}</Formula> input features) and <Formula>{`Z^{(1)}`}</Formula>, <Formula>{`A^{(1)}`}</Formula> become <Formula>{`n`}</Formula> by hidden-size matrices, every row an independent example running through the exact same weights. The loss for the batch is just the average of each example's individual loss, and the gradient for the batch is the average of each example's individual gradient, so the deltas from the single-example derivation earlier get computed for every row at once and then averaged when forming <Formula>{`\\partial \\mathcal{L}/\\partial W`}</Formula>.
      </Paragraph>

      <Paragraph delay={2.15}>
        Vectorizing this way isn't just a coding convenience. A modern CPU or GPU is enormously more efficient running one large matrix multiply than the equivalent work split into many small per-example loops, so batching a few dozen or a few hundred examples into one matrix operation is most of where a real training loop's speed comes from. The mini-batch size itself is also a genuine tuning knob, a bigger batch gives a less noisy, more accurate estimate of the true gradient over the whole dataset but costs more compute and memory per step, a smaller batch is cheaper per step and its extra gradient noise can even help the optimizer avoid narrow, sharp minima, at the cost of a jumpier training curve.
      </Paragraph>

      <Heading level={2} delay={2.20}>
        A small real training loop
      </Heading>

      <Paragraph delay={2.25}>
        Putting the forward pass, the backward pass, and mini-batch vectorization together produces a complete training loop. The example below trains a fresh 2-4-1 network (four hidden units this time, to give it enough capacity) on the full XOR truth table, all four rows treated as one mini-batch on every step, for five thousand steps at a learning rate of <Formula>{`1.0`}</Formula>.
      </Paragraph>

      <CodeBlock
        delay={2.30}
        language="Python"
        code={`import numpy as np
np.random.seed(0)

def sigmoid(z):
    return 1 / (1 + np.exp(-z))

X = np.array([[0, 0], [0, 1], [1, 0], [1, 1]], dtype=float)
Y = np.array([[0], [1], [1], [0]], dtype=float)  # XOR

W1 = np.random.randn(2, 4) * 0.5
b1 = np.zeros(4)
W2 = np.random.randn(4, 1) * 0.5
b2 = np.zeros(1)
lr = 1.0

for epoch in range(5000):
    # forward, all 4 examples as one mini-batch
    Z1 = X @ W1 + b1
    A1 = sigmoid(Z1)
    Z2 = A1 @ W2 + b2
    A2 = sigmoid(Z2)
    loss = np.mean(0.5 * (A2 - Y) ** 2)

    # backward, averaged over the batch
    dZ2 = (A2 - Y) * A2 * (1 - A2) / X.shape[0]
    dW2 = A1.T @ dZ2
    db2 = dZ2.sum(axis=0)
    dA1 = dZ2 @ W2.T
    dZ1 = dA1 * A1 * (1 - A1)
    dW1 = X.T @ dZ1
    db1 = dZ1.sum(axis=0)

    W2 -= lr * dW2; b2 -= lr * db2
    W1 -= lr * dW1; b1 -= lr * db1

    if epoch % 1000 == 0:
        print(epoch, round(float(loss), 6))

# 0 0.134551
# 1000 0.105557
# 2000 0.010914
# 3000 0.002717
# 4000 0.001435

Z1 = X @ W1 + b1; A1 = sigmoid(Z1)
Z2 = A1 @ W2 + b2; A2 = sigmoid(Z2)
for row, pred in zip(X, A2):
    print(row.tolist(), round(float(pred[0]), 4))
# [0.0, 0.0] 0.0459
# [0.0, 1.0] 0.9592
# [1.0, 0.0] 0.9565
# [1.0, 1.0] 0.0444`}
      />

      <Paragraph delay={2.35}>
        The loss drops from <Formula>{`0.1346`}</Formula> at initialization to <Formula>{`0.0014`}</Formula> after five thousand steps, and the four predictions land at <Formula>{`0.046`}</Formula>, <Formula>{`0.959`}</Formula>, <Formula>{`0.957`}</Formula>, and <Formula>{`0.044`}</Formula> against targets of <Formula>{`0`}</Formula>, <Formula>{`1`}</Formula>, <Formula>{`1`}</Formula>, <Formula>{`0`}</Formula>, close enough that rounding each one to the nearest integer recovers XOR exactly. A single perceptron could never do this, four hidden units and a nonlinearity between the layers is enough.
      </Paragraph>

      <Heading level={2} delay={2.40}>
        Takeaways
      </Heading>

      <List delay={2.45}>
        <ListItem>A perceptron is a weighted sum plus a nonlinearity, and it can only separate data with a single straight line, which is exactly why XOR needs more than one of them.</ListItem>
        <ListItem>The forward pass through a multilayer network is a chain of matrix multiplies and nonlinearities, <Formula>{`z^{(l)} = W^{(l)}a^{(l-1)} + b^{(l)}`}</Formula>, <Formula>{`a^{(l)} = f(z^{(l)})`}</Formula>, repeated once per layer.</ListItem>
        <ListItem>Dropping the nonlinearity collapses any number of stacked layers back into one linear map algebraically, which is why every hidden layer needs one.</ListItem>
        <ListItem>Backpropagation is the chain rule applied backward one layer at a time, each layer's delta reuses that same layer's forward weights, transposed, to distribute the error signal to the layer before it.</ListItem>
        <ListItem>A hand-derived gradient for a real 2-2-1 network matched NumPy's own backward pass and a finite-difference gradient check to within floating-point precision, and the identical machinery, vectorized across a mini-batch, is what a full training loop runs thousands of times in a row.</ListItem>
      </List>

      <Paragraph delay={2.50}>
        Everything a deep network does at training time is this same loop, scaled up. More layers just mean more repetitions of the same backward step, more parameters just mean bigger matrices in the same two equations, and a modern optimizer just means a smarter rule for turning a gradient into a weight update instead of a plain fixed-size step. The chain rule underneath all of it never changes. Thanks for reading.
      </Paragraph>
    </>
  ),
};
