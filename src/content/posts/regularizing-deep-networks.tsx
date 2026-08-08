import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  DropoutMaskDiagram,
  RegularizationLossCurveDiagram,
} from "../components";

export const regularizingDeepNetworks: BlogPostData = {
  title: "Regularizing Deep Networks",
  date: "August 1, 2026",
  slug: "regularizing-deep-networks",
  content: (
    <>
      <Paragraph delay={0.1}>
        A convolutional network with twenty million parameters can memorize a training set of a few thousand images outright, labels, JPEG artifacts, and whatever incidental noise happened to be in the photos, and still report a training accuracy in the high nineties. None of the tricks that keep a linear model honest, an L2 penalty on the coefficients, picking a lower polynomial degree, transfer cleanly to a network this large. The parameter count alone guarantees enough capacity to fit almost any finite training set exactly, so the interesting question moves from "can this model fit the data" to "what stops it from fitting only the data it happened to see."
      </Paragraph>

      <Paragraph delay={0.15}>
        Deep networks pick up an entire toolbox of answers to that question, and most of them have nothing to do with adding a penalty term to the loss. Some randomly break the network apart during training. Some watch a validation curve and quit early. Some invent new training examples on the fly. All of them are still doing the same underlying job, trading a little bit of fit on the training set for a model that holds up on data it hasn't seen.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        Weight decay, briefly, since it still applies here
      </Heading>

      <Paragraph delay={0.25}>
        <strong>Weight decay</strong> is the deep-learning-era name for the same L2 penalty behind ridge regression, added directly to the loss so large weights cost something. There's no closed-form solution the way there is for a linear model, the objective is non-convex and gets optimized by gradient descent, but the mechanics of the penalty itself are identical, every weight gets pulled toward zero by an amount proportional to its own current value, on every single step.
      </Paragraph>

      <Formula block delay={0.3}>
        {`\\theta_{t+1} = \\theta_t - \\eta \\Big(\\nabla_\\theta \\mathcal{L}(\\theta_t) + \\lambda \\theta_t\\Big)`}
      </Formula>

      <Paragraph delay={0.35}>
        <Formula>{`\\eta`}</Formula> is the learning rate and <Formula>{`\\lambda`}</Formula> is the weight decay strength. In practice, a modern optimizer like AdamW applies that <Formula>{`\\lambda \\theta_t`}</Formula> term separately from the adaptive gradient update rather than folding it into the loss the naive way, since mixing it into Adam's per-parameter learning rates changes its effective strength in ways that turn out to hurt performance. The full derivation of why the penalty shrinks coefficients and why standardizing inputs matters before applying one lives elsewhere. What matters here is just that weight decay is still in every deep network's toolbox, still tuned with a single scalar, and still the first thing worth trying before reaching for anything below.
      </Paragraph>

      <Heading level={2} delay={0.4}>
        Dropout, breaking co-adaptation on purpose
      </Heading>

      <Paragraph delay={0.45}>
        <strong>Dropout</strong> randomly zeroes out a fraction of a layer's units on every training step, a fresh random mask each forward pass, and lets the rest of the network carry on as if those units didn't exist. A unit surviving one step and dropped the next has no way of knowing in advance which of its neighbors will be there to help it, so it can't afford to specialize into "the unit that only works because unit 47 is also active." That failure mode has a name, <strong>co-adaptation</strong>, a set of units that only function correctly together, having jointly overfit to some detail of the training set, and dropout is aimed directly at preventing it.
      </Paragraph>

      <Paragraph delay={0.5}>
        Each unit in a dropout layer survives independently with probability <Formula>{`p_{\\text{keep}}`}</Formula>, typically somewhere between 0.5 and 0.9 depending on the layer, drawn fresh from a Bernoulli distribution on every forward pass during training.
      </Paragraph>

      <Formula block delay={0.55}>
        {`h'_i = \\frac{m_i}{p_{\\text{keep}}} \\cdot h_i, \\qquad m_i \\sim \\text{Bernoulli}(p_{\\text{keep}})`}
      </Formula>

      <Paragraph delay={0.6}>
        That division by <Formula>{`p_{\\text{keep}}`}</Formula> is the detail that trips people up the first time they implement this by hand. During training, roughly a <Formula>{`1 - p_{\\text{keep}}`}</Formula> fraction of units are zero at any given step, so the sum feeding into the next layer is systematically smaller than it would be with every unit present. Scaling the surviving units up by <Formula>{`1 / p_{\\text{keep}}`}</Formula> keeps the expected value of that sum unchanged, which is what lets inference skip the masking step entirely. At inference time every unit is active and nothing gets scaled at all, since the training-time scaling already accounted for it. This is called <strong>inverted dropout</strong>, and it's the version every modern framework implements by default specifically so inference stays a single, fast, deterministic forward pass with no dependence on which mode the model happens to be in.
      </Paragraph>

      <DropoutMaskDiagram
        delay={0.06}
        caption="A training step zeroes a random subset of hidden units and every connection through them, inference runs every unit at once with the scaling already baked into training."
      />

      <Paragraph delay={0.65}>
        There's a useful way to think about what dropout is actually doing across an entire training run, not just on one step. Every mask defines a slightly different, smaller subnetwork, and a single training run ends up sampling an enormous number of these subnetworks, one per step, each nudged slightly toward fitting the data well on its own. Inference then runs something close to the average prediction over all of those subnetworks at once, since every unit is present and its output already reflects how often it survived. That's the intuition behind calling dropout a cheap approximation to training an ensemble of exponentially many networks and averaging their predictions, without ever paying the cost of actually training more than one network.
      </Paragraph>

      <Heading level={2} delay={0.7}>
        Stochastic depth, the same idea one level up
      </Heading>

      <Paragraph delay={0.75}>
        Dropout randomly zeroes individual units. <strong>Stochastic depth</strong> applies the identical idea to entire residual blocks in a deep network, randomly skipping a whole block for a given training step and passing the input straight through via the residual connection instead. A residual block normally computes <Formula>{`x_{l+1} = x_l + f_l(x_l)`}</Formula>, stochastic depth replaces that with <Formula>{`x_{l+1} = x_l + b_l \\cdot f_l(x_l)`}</Formula>, where <Formula>{`b_l`}</Formula> is a Bernoulli variable that's zero with some small probability, typically increasing for deeper blocks since later layers tend to matter less individually to the final prediction.
      </Paragraph>

      <Paragraph delay={0.8}>
        The training-time effect is the same trick as dropout at a coarser grain, a network of, say, 110 residual blocks effectively trains as a mixture of shallower networks of varying depth, and at test time every block runs, with each block's contribution scaled by its own survival probability, mirroring dropout's inverted scaling exactly. The payoff is specific to very deep residual architectures, it cuts training time noticeably since skipped blocks don't run their forward or backward pass at all that step, and it fights the same co-adaptation and overfitting dropout fights, just applied to whole layers rather than individual units.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        Early stopping, the regularizer that costs nothing extra
      </Heading>

      <Paragraph delay={0.9}>
        Every training run already computes validation loss to know how the model is doing. <strong>Early stopping</strong> just acts on that number instead of only watching it, stopping training the moment validation loss stops improving rather than training for a fixed number of epochs regardless of what the validation curve is doing. In practice this means tracking the best validation loss seen so far, and a <strong>patience</strong> counter, how many epochs to keep waiting after the last improvement before actually stopping and rolling back to the best checkpoint.
      </Paragraph>

      <Paragraph delay={0.95}>
        The reason this counts as regularization and not just good bookkeeping is that a network's effective capacity keeps growing throughout training, not just at initialization. Early in training, weights are close to their random initialization and the function the network computes is close to whatever it started as, mild and smooth by construction. As training continues, weights drift further from that starting point and the function the network represents gets more flexible, more able to bend around individual training points, exactly the flexibility that eventually starts fitting noise instead of signal. Stopping early is stopping before that flexibility outruns what the data can support, without ever adding a term to the loss or removing a single connection.
      </Paragraph>

      <Heading level={2} delay={1}>
        A worked example, dropout and early stopping, computed and verified
      </Heading>

      <Paragraph delay={1.05}>
        Forty noisy training points, twelve input dimensions where only three actually carry signal, and a true relationship <Formula>{`y = \\sin(3x_0) + 0.5x_1^2 - x_2 + \\varepsilon`}</Formula> with Gaussian noise of standard deviation 0.3. A two-hidden-layer MLP with 64 units per layer, trained with Adam for 400 epochs, comfortably has enough capacity to memorize forty points several times over. Two versions get trained on identical data, one with no dropout, one with dropout at <Formula>{`p_{\\text{keep}} = 0.7`}</Formula> (a 30 percent drop rate) on both hidden layers.
      </Paragraph>

      <CodeBlock
        delay={1.1}
        language="Python"
        code={`import numpy as np
import torch
import torch.nn as nn

torch.manual_seed(0)
n_train, n_val, d = 40, 200, 12

def true_fn(X):
    return np.sin(3 * X[:, 0]) + 0.5 * X[:, 1] ** 2 - X[:, 2]

def make_data(n, seed, noise_std=0.3):
    rng = np.random.default_rng(seed)
    X = rng.uniform(-1.5, 1.5, size=(n, d))
    y = true_fn(X) + rng.normal(0, noise_std, size=n)
    return torch.tensor(X, dtype=torch.float32), torch.tensor(y, dtype=torch.float32)

X_train, y_train = make_data(n_train, 1)
X_val, y_val = make_data(n_val, 2)

class MLP(nn.Module):
    def __init__(self, d, hidden=64, p=0.0):
        super().__init__()
        self.fc1, self.fc2, self.fc3 = nn.Linear(d, hidden), nn.Linear(hidden, hidden), nn.Linear(hidden, 1)
        self.drop1, self.drop2 = nn.Dropout(p), nn.Dropout(p)
        self.act = nn.ReLU()

    def forward(self, x):
        x = self.drop1(self.act(self.fc1(x)))
        x = self.drop2(self.act(self.fc2(x)))
        return self.fc3(x).squeeze(-1)

def train(p, epochs=400, lr=0.01, seed=42):
    torch.manual_seed(seed)
    model = MLP(d, hidden=64, p=p)
    opt = torch.optim.Adam(model.parameters(), lr=lr)
    loss_fn = nn.MSELoss()
    train_losses, val_losses = [], []
    for _ in range(epochs):
        model.train()
        opt.zero_grad()
        loss = loss_fn(model(X_train), y_train)
        loss.backward()
        opt.step()
        model.eval()
        with torch.no_grad():
            train_losses.append(loss_fn(model(X_train), y_train).item())
            val_losses.append(loss_fn(model(X_val), y_val).item())
    return train_losses, val_losses

for p in [0.0, 0.3]:
    tl, vl = train(p)
    best_epoch = int(np.argmin(vl))
    print(f"p={p}: final train={tl[-1]:.4f} final val={vl[-1]:.4f} gap={vl[-1]-tl[-1]:.4f}")
    print(f"       best val epoch={best_epoch+1} val={vl[best_epoch]:.4f} train_at_that_point={tl[best_epoch]:.4f}")

# p=0.0: final train=0.0000 final val=1.0538 gap=1.0538
#        best val epoch=10 val=0.7753 train_at_that_point=0.2565
# p=0.3: final train=0.0324 final val=0.9125 gap=0.8801
#        best val epoch=12 val=0.7603 train_at_that_point=0.3294`}
      />

      <Paragraph delay={1.15}>
        Without dropout, training loss hits essentially zero by epoch 100 and stays there for the rest of the run, while validation loss keeps climbing the entire time, settling at 1.0538, an enormous 1.0538 gap between a model that fits its training points exactly and one that's actively getting worse on new data as training continues. With dropout, training loss can't reach zero, the random masking keeps knocking it back up, it settles around 0.03 instead, and validation loss ends the run at 0.9125 rather than 1.0538, with a final gap of 0.8801 instead of 1.0538. Neither number is dramatic in isolation, this is a genuinely tiny, noisy dataset and forty points can only ever support so much, but the direction is exactly what the mechanism predicts, a little deliberate underfitting on the training set in exchange for a real, measured reduction in the training-validation gap.
      </Paragraph>

      <RegularizationLossCurveDiagram
        delay={0.07}
        caption="Both models fit the 40 training points near-perfectly, dropout only slows that down slightly, but validation loss without dropout climbs to 1.0538 while dropout holds it to 0.9125, a visibly smaller gap for the whole rest of training."
      />

      <Paragraph delay={1.2}>
        The best validation loss either model ever reaches, 0.7753 without dropout and 0.7603 with it, shows up around epoch 10 or 12 in both cases, long before either curve settles into its final plateau. That's the early-stopping story sitting right in the same numbers, a model watching its validation loss and stopping around epoch 10 would have shipped something noticeably better than either model's fully-trained, 400-epoch version, dropout or not. The two regularizers aren't competing with each other here, they're catching different parts of the same problem, dropout slows down how fast the gap opens, early stopping decides not to wait around for it to open all the way.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        Reading a train-validation loss curve as a diagnostic
      </Heading>

      <Paragraph delay={1.3}>
        The overfitting signature above generalizes past this one example, and it's worth being able to name on sight. Training loss falling steadily while validation loss falls for a while and then turns around and rises, with a gap between the two curves that keeps widening as training continues, is overfitting, full stop, and it's exactly what both loss curves plotted above show for the no-dropout run. The fix is some combination of the levers in this post, more regularization, less capacity, more data, or stopping earlier, not more epochs of the same training.
      </Paragraph>

      <Paragraph delay={1.35}>
        A different shape means a different diagnosis. Both curves flattening out together, close to each other, but at a stubbornly high loss, is underfitting, the model has stopped improving on data it has already seen, so there's no gap left to close and no amount of extra training time will manufacture one. That calls for the opposite fixes, more capacity, less regularization, or a model architecture with inductive bias that actually matches the problem, not any of the tricks in this post. Reading which of these two shapes a curve has, before reaching for a fix, is the entire point of watching the validation curve rather than only the training one.
      </Paragraph>

      <Heading level={2} delay={1.4}>
        Data augmentation, regularizing by making more data
      </Heading>

      <Paragraph delay={1.45}>
        Every regularizer above works by constraining or perturbing the model. <strong>Data augmentation</strong> attacks the same problem from the other direction, expanding the effective size of the training set instead. A label-preserving transform, a random crop and horizontal flip on an image, a pitch shift on audio, a synonym swap in text, produces a new training example that's different in every pixel or token from the original but obviously still carries the same label to a human. A network shown enough of these variants can't rely on memorizing exact pixel values the way it could with a fixed, finite set of images, because the same underlying photo now shows up as thousands of slightly different inputs across training, all mapping to the same target.
      </Paragraph>

      <Paragraph delay={1.5}>
        The core requirement is that the transform actually preserves the label. Flipping a photo of a cat horizontally is still obviously a photo of a cat, flipping a photo of the digit 6 vertically produces something that looks a lot like a 9, and applying that transform anyway would corrupt the training signal rather than expand it. Choosing the right augmentation set is a genuinely domain-specific decision, what's label-preserving for photographs is often not label-preserving for handwritten digits or medical scans, and getting it wrong quietly poisons training rather than helping it.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        Label smoothing, softening an overconfident target
      </Heading>

      <Paragraph delay={1.6}>
        A standard classification target is a one-hot vector, probability 1 on the correct class and 0 on every other class, and cross-entropy loss pushes the model's predicted probabilities toward exactly that, which technically means pushing the correct class's logit toward positive infinity relative to the rest. Nothing in that objective ever says "confident enough", it keeps rewarding more extreme confidence forever, including confidence built on training examples that are mislabeled, ambiguous, or just noisy. <strong>Label smoothing</strong> caps that incentive by replacing the one-hot target with a slightly softened version.
      </Paragraph>

      <Formula block delay={1.65}>
        {`y_i^{\\text{smooth}} = (1 - \\alpha) \\cdot y_i + \\frac{\\alpha}{K}`}
      </Formula>

      <Paragraph delay={1.7}>
        <Formula>{`K`}</Formula> is the number of classes and <Formula>{`\\alpha`}</Formula> is a small smoothing strength, commonly around 0.1. For the correct class this shrinks the target from 1.0 down to something like 0.9 plus a tiny sliver of that leftover 0.1 spread across every class, including the correct one. The model now gets penalized for pushing its confidence past that softened target, which caps how extreme the logits are allowed to get and, in practice, tends to produce a model whose predicted probabilities are better calibrated, a stated 80 percent confidence that's actually right about 80 percent of the time, rather than a network that's either right or wildly, needlessly overconfident.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Mixup, training on blends of two examples
      </Heading>

      <Paragraph delay={1.8}>
        <strong>Mixup</strong> is a data augmentation technique that doesn't touch a single example at all, it blends two of them. Pick two training pairs, <Formula>{`(x_i, y_i)`}</Formula> and <Formula>{`(x_j, y_j)`}</Formula>, draw a mixing weight <Formula>{`\\lambda`}</Formula> from a Beta distribution, and train on the linear interpolation of both the inputs and the labels.
      </Paragraph>

      <Formula block delay={1.85}>
        {`\\tilde x = \\lambda x_i + (1-\\lambda) x_j, \\qquad \\tilde y = \\lambda y_i + (1-\\lambda) y_j`}
      </Formula>

      <Paragraph delay={1.9}>
        A <Formula>{`\\lambda`}</Formula> near 0.5 produces an input that's genuinely halfway between two images, and a target that's genuinely half one class's one-hot vector and half the other's, not a real image of anything but a valid point for the model to learn to handle sensibly. Training on enough of these blended pairs pushes the network toward behaving linearly between training points instead of carving out sharp, potentially brittle decision boundaries that happen to separate the exact examples it was shown. It also acts as a second, independent source of label softening on top of anything label smoothing already does, since a mixed target is essentially never a clean one-hot vector.
      </Paragraph>

      <CodeBlock
        delay={1.95}
        language="Python"
        code={`import numpy as np

def mixup_batch(x, y_onehot, alpha=0.2, rng=np.random.default_rng(0)):
    lam = rng.beta(alpha, alpha)
    idx = rng.permutation(len(x))
    x_mixed = lam * x + (1 - lam) * x[idx]
    y_mixed = lam * y_onehot + (1 - lam) * y_onehot[idx]
    return x_mixed, y_mixed, lam`}
      />

      <Heading level={2} delay={2}>
        Ensembling, trading compute for variance directly
      </Heading>

      <Paragraph delay={2.05}>
        Every technique so far changes how a single network trains. <strong>Ensembling</strong> skips that entirely and trains several networks, typically the same architecture from different random initializations or on different bootstrap resamples of the training set, and averages their predictions at inference time. Since each individual network's errors on a given input come partly from that network's own particular training run, different initialization, different mini-batch order, different random dropout masks along the way, those errors aren't perfectly correlated across networks, and averaging cancels out a real share of them, exactly the variance-reduction argument behind bagging applied to whichever base model happens to be a deep network instead of a decision tree.
      </Paragraph>

      <Paragraph delay={2.1}>
        The catch is cost, training <Formula>{`M`}</Formula> networks instead of one multiplies training compute by roughly <Formula>{`M`}</Formula>, and running all of them at inference time multiplies serving cost the same way, which is why ensembling shows up more often in settings where accuracy is worth the extra compute, a competition leaderboard, a fraud model where a fraction of a percent of accuracy is worth real money, than in a latency-sensitive production service serving every request through <Formula>{`M`}</Formula> forward passes. A single network trained with dropout gets a rough, much cheaper approximation to this same averaging effect, which is part of why dropout is often described as a practical stand-in for a real ensemble rather than merely a coincidentally similar idea.
      </Paragraph>

      <Heading level={2} delay={2.15}>
        How much of this actually matters at scale
      </Heading>

      <Paragraph delay={2.2}>
        Every technique in this post earns its keep in the same regime, a model with enough capacity to fit its training set exactly, trained on a training set small enough, relative to that capacity, for exact fitting to mean memorizing noise instead of learning signal. That regime is common, forty noisy training points and a 64-unit MLP is a deliberately exaggerated version of it, but it isn't universal, and the same techniques stop pulling their weight once the ratio of data to capacity flips the other way.
      </Paragraph>

      <Paragraph delay={2.25}>
        Train a network on a genuinely enormous dataset, one large enough that even a very high-capacity model can no longer come close to memorizing it, and the gap between training and validation loss shrinks on its own, simply because there's too much real data for the model to substitute memorization for actually learning the underlying pattern. Heavy dropout or aggressive weight decay in that regime doesn't help nearly as much as it does on a small dataset, and can actively hurt, since forcing the network to underfit training data it could otherwise learn genuine, useful structure from just throws away signal the model had every ability to use well. This is the practical reasoning behind why the largest modern models tend to use comparatively light explicit regularization, some weight decay, sometimes a bit of dropout in specific places, but nothing close to what the same architecture would need on a dataset a thousand times smaller. The right amount of regularization isn't a fixed property of an architecture, it's a property of how much real signal the available data can support relative to how much the model is capable of fitting, the exact same accounting the bias-variance tradeoff made explicit for far simpler models.
      </Paragraph>

      <Heading level={2} delay={2.3}>
        Takeaways
      </Heading>

      <List delay={2.35}>
        <ListItem>Dropout randomly zeroes units each training step to break co-adaptation, scales surviving units by <InlineCode>1/p_keep</InlineCode> during training so inference can run every unit with no extra scaling, and behaves like a cheap approximation to averaging an ensemble of subnetworks.</ListItem>
        <ListItem>Stochastic depth applies the same random-dropping idea to whole residual blocks instead of individual units, and cuts training time as a side effect since skipped blocks don't run their forward or backward pass.</ListItem>
        <ListItem>Early stopping is regularization that costs nothing extra, a network's effective flexibility grows throughout training, and stopping when validation loss stops improving keeps the model on the smoother side of that growth.</ListItem>
        <ListItem>Data augmentation, label smoothing, and mixup all soften what the model is asked to fit exactly, more effective training examples, a capped-confidence target, and blended inputs and labels respectively, rather than constraining the model's parameters directly.</ListItem>
        <ListItem>How much regularization actually helps depends on the ratio of usable data to model capacity, not on the technique in isolation, the same dropout rate that rescues a small dataset can quietly cost accuracy on one large enough that the model was never going to memorize it anyway.</ListItem>
      </List>

      <Paragraph delay={2.4}>
        None of these techniques replace a validation set or a learning curve, they're levers to pull once that curve has actually told you the model is overfitting, not something to reach for by default regardless of what the data and capacity look like. Reading the gap correctly comes first, dropout, early stopping, augmentation, and the rest are just the toolbox once the diagnosis is in. Thanks for reading.
      </Paragraph>
    </>
  ),
};
