import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  SigmoidThresholdDiagram,
  ReliabilityDiagram,
} from "../components";

export const logisticRegressionGlm: BlogPostData = {
  title: "Logistic Regression and Generalized Linear Models",
  date: "August 1, 2026",
  slug: "logistic-regression-glm",
  content: (
    <>
      <Paragraph delay={0.10}>
        Fit a plain linear regression to a column of zeros and ones, spam or not spam, click or no click, fraud or legitimate, and the model will happily hand back predictions like <Formula>{`1.4`}</Formula> or <Formula>{`-0.2`}</Formula>. Neither of those is a probability, and neither one is even a valid label. The line drawn through a cloud of 0/1 points has no reason to stay between 0 and 1 once it extends past the data it was fit on, and nothing in ordinary least squares forces it to.
      </Paragraph>

      <Paragraph delay={0.15}>
        That's not a minor cosmetic problem. It means the model can't be read as "the probability of the positive class," which is usually the entire point of building a classifier in the first place. Fixing it takes one transform on the output side and a different loss on the training side, and both of those pieces turn out to be one member of a much larger family of models built the same way.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Squashing a line into a probability
      </Heading>

      <Paragraph delay={0.25}>
        Linear regression already knows how to produce an unbounded score from a weighted sum of features, <Formula>{`z = w \\cdot x + b`}</Formula>. What's missing is a way to turn that score into something that behaves like a probability, bounded between 0 and 1, increasing as the score increases. The function that does this is the <strong>sigmoid</strong>.
      </Paragraph>

      <Formula block delay={0.30}>
        {`\\sigma(z) = \\frac{1}{1 + e^{-z}}`}
      </Formula>

      <Paragraph delay={0.35}>
        As <Formula>{`z`}</Formula> goes to negative infinity, <Formula>{`\\sigma(z)`}</Formula> goes to 0. As <Formula>{`z`}</Formula> goes to positive infinity, it goes to 1. At <Formula>{`z = 0`}</Formula> it sits exactly at 0.5. Logistic regression is nothing more than fitting the linear score <Formula>{`z`}</Formula> the usual way and passing it through this one function before comparing it to the label.
      </Paragraph>

      <Formula block delay={0.40}>
        {`P(y = 1 \\mid x) = \\sigma(w \\cdot x + b)`}
      </Formula>

      <Paragraph delay={0.45}>
        It helps to run the sigmoid backward for a moment. Solve for <Formula>{`z`}</Formula> in terms of the probability it produced and the <strong>logit</strong>, or <strong>log-odds</strong>, transform falls out.
      </Paragraph>

      <Formula block delay={0.50}>
        {`z = \\log\\frac{P(y=1)}{1 - P(y=1)}`}
      </Formula>

      <Paragraph delay={0.55}>
        The ratio inside the log is just the odds, how many times more likely the positive outcome is than the negative one. Logistic regression is a straight line, the same additive combination of features as ordinary linear regression, just fit in log-odds space instead of probability space. That reframing is what makes the whole model tractable, and it's also exactly the quantity that makes the coefficients interpretable later on.
      </Paragraph>

      <SigmoidThresholdDiagram
        delay={0.08}
        caption="The sigmoid maps any real-valued score to a probability between 0 and 1. A decision threshold picks where along that curve a prediction flips from negative to positive, and it doesn't have to sit at 0.5."
      />

      <Heading level={2} delay={0.60}>
        Where the loss function comes from
      </Heading>

      <Paragraph delay={0.65}>
        Picking a loss function for this model isn't an arbitrary design choice. It falls out of asking a specific question, given a set of weights, how plausible is it that the data actually observed would have occurred. Each label is treated as a coin flip whose bias is the model's own predicted probability, a Bernoulli trial with success probability <Formula>{`\\hat y = \\sigma(w \\cdot x + b)`}</Formula>. The likelihood of one example is <Formula>{`\\hat y`}</Formula> when the true label is 1 and <Formula>{`1 - \\hat y`}</Formula> when it's 0, which a single expression captures without branching.
      </Paragraph>

      <Formula block delay={0.70}>
        {`P(y \\mid x) = \\hat y^{\\,y} (1 - \\hat y)^{1-y}`}
      </Formula>

      <Paragraph delay={0.75}>
        Multiplying that expression across every training example and taking a log to turn the product into a sum is the same maximum-likelihood mechanism that shows up anywhere a model's parameters are chosen to make observed data as plausible as possible. Flipping the sign of the resulting log-likelihood so that better predictions produce a smaller number, rather than a larger one, is what gives the actual training loss.
      </Paragraph>

      <Formula block delay={0.80}>
        {`\\mathcal{L} = -\\frac{1}{n}\\sum_{i=1}^{n} \\Big[ y_i \\log \\hat y_i + (1-y_i)\\log(1-\\hat y_i) \\Big]`}
      </Formula>

      <Paragraph delay={0.85}>
        This is <strong>binary cross-entropy</strong>, the negative log-likelihood of the Bernoulli model above, averaged over the training set. Each term only keeps the piece that matches the true label, when <Formula>{`y_i = 1`}</Formula> the second term vanishes and the example is penalized by <Formula>{`-\\log \\hat y_i`}</Formula>, confident and correct costs almost nothing while confident and wrong costs a lot, since <Formula>{`-\\log`}</Formula> of a number near zero blows up.
      </Paragraph>

      <Paragraph delay={0.90}>
        The gradient of this loss with respect to the weights simplifies to something unexpectedly clean once the sigmoid's own derivative is folded in.
      </Paragraph>

      <Formula block delay={0.95}>
        {`\\frac{\\partial \\mathcal{L}}{\\partial w} = \\frac{1}{n}\\sum_{i=1}^{n} (\\hat y_i - y_i)\\, x_i`}
      </Formula>

      <Paragraph delay={1.00}>
        The update at each step is proportional to the prediction error, <Formula>{`\\hat y_i - y_i`}</Formula>, times the input itself. Bigger mistakes push the weights harder. Correct, confident predictions push them barely at all. That's a satisfying result given how it was derived, a probabilistic argument about plausibility and a calculus exercise on a loss function land on the exact same update rule any gradient descent implementation actually runs.
      </Paragraph>

      <Heading level={2} delay={1.05}>
        More than two classes
      </Heading>

      <Paragraph delay={1.10}>
        Real problems rarely stop at two labels. Two strategies extend logistic regression to <Formula>{`K`}</Formula> classes, and they make different tradeoffs.
      </Paragraph>

      <Paragraph delay={1.15}>
        <strong>One-vs-rest</strong> trains <Formula>{`K`}</Formula> independent binary classifiers, one for each class against everyone else, and predicts whichever classifier reports the highest probability. It's simple, and it reuses the exact machinery above without modification, but the individual probabilities aren't guaranteed to sum to 1 across classes, since each classifier was trained in isolation.
      </Paragraph>

      <Paragraph delay={1.20}>
        <strong>Softmax regression</strong> (also called multinomial logistic regression) fixes that by training one joint model with a separate weight vector per class, and normalizing all the class scores together so they do sum to 1.
      </Paragraph>

      <Formula block delay={1.25}>
        {`P(y = k \\mid x) = \\frac{\\exp(w_k \\cdot x)}{\\sum_{j=1}^{K} \\exp(w_j \\cdot x)}`}
      </Formula>

      <Paragraph delay={1.30}>
        Set <Formula>{`K = 2`}</Formula> and this reduces algebraically back to the plain sigmoid, logistic regression is the two-class special case of softmax regression, not a different model. The loss generalizes the same way, categorical cross-entropy against a one-hot label replaces binary cross-entropy, and the gradient keeps the same shape, prediction error times input, just with a vector of class probabilities instead of a single scalar.
      </Paragraph>

      <Heading level={2} delay={1.35}>
        Reading the coefficients
      </Heading>

      <Paragraph delay={1.40}>
        Because the model is linear in log-odds rather than in probability, a coefficient <Formula>{`w_j`}</Formula> has a specific and useful reading. Increasing feature <Formula>{`x_j`}</Formula> by one unit, holding everything else fixed, adds <Formula>{`w_j`}</Formula> to the log-odds, which multiplies the odds themselves by <Formula>{`e^{w_j}`}</Formula>. A coefficient of <Formula>{`0.7`}</Formula> means the odds of the positive class get multiplied by roughly <Formula>{`e^{0.7} \\approx 2.0`}</Formula> for each extra unit of that feature, not that the probability itself goes up by 0.7. That distinction matters, doubling the odds moves a 10% probability to about 18%, but it moves a 50% probability to about 67%, the same odds multiplier produces a different change in probability depending on where the starting point sits.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Calibration, does 70% actually mean 70%
      </Heading>

      <Paragraph delay={1.50}>
        A classifier can be highly accurate and still report probabilities that are dishonest. <strong>Calibration</strong> checks a narrower thing than accuracy, among all the examples a model assigned roughly 70% probability of being positive, do roughly 70% of them actually turn out positive. A model can rank examples in exactly the right order and still be miscalibrated, routinely outputting 95% when the true rate for that group is closer to 75%.
      </Paragraph>

      <Paragraph delay={1.55}>
        A <strong>reliability diagram</strong> is the usual way to check this. Predictions get bucketed into bins by their predicted probability, and each bin's actual observed frequency of the positive class gets plotted against the bin's predicted value. A perfectly calibrated model traces the diagonal, predicted probability equals observed frequency at every bin. A model that's overconfident bows below the diagonal at the high end, claiming near-certainty on examples that pan out less often than that.
      </Paragraph>

      <ReliabilityDiagram
        delay={0.08}
        caption="A reliability diagram. The dashed diagonal is perfect calibration. This model tracks it closely at low probabilities but drifts below the line at high ones, meaning its 90% predictions come true closer to 70% of the time."
      />

      <Paragraph delay={1.60}>
        Logistic regression tends to be fairly well calibrated out of the box, since it's directly optimizing a likelihood over probabilities rather than some other objective. Models optimized purely for ranking or accuracy, and especially ensembles built from many averaged trees, often need a separate calibration step (fitting a small correction curve on held-out data) before their raw scores can be trusted as probabilities.
      </Paragraph>

      <Heading level={2} delay={1.65}>
        Why 0.5 isn't always the right cutoff
      </Heading>

      <Paragraph delay={1.70}>
        A predicted probability is a continuous number. Turning it into an actual decision, approve the transaction or flag it, requires picking a threshold, and 0.5 is only the natural choice when a false positive and a false negative cost the same. They usually don't.
      </Paragraph>

      <Paragraph delay={1.75}>
        Consider a fraud detection model. Missing an actual fraudulent transaction (a false negative) might cost the full amount of the fraud plus a customer dispute. Flagging a legitimate transaction for extra review (a false positive) costs a support ticket and an annoyed customer, real, but far cheaper. When one type of mistake is that much more expensive than the other, the threshold should move to catch more of the costly kind, even at the price of more of the cheap kind. Lowering the cutoff to, say, 0.2 flags more transactions overall, catching more real fraud at the cost of more manual reviews on transactions that turn out fine. Raising it toward 0.8 does the opposite, fewer false alarms, but some fraud slips through uncaught. There's no universal right answer, the correct threshold is wherever the expected cost of the two error types actually balances for the business in question, and that number comes from outside the model, not from the training process itself.
      </Paragraph>

      <Heading level={2} delay={1.80}>
        The bigger pattern, generalized linear models
      </Heading>

      <Paragraph delay={1.85}>
        Logistic regression looks like a special trick for binary labels, but it's actually one instance of a general recipe called a <strong>generalized linear model</strong> (GLM). Every GLM has three pieces, a linear predictor <Formula>{`z = w \\cdot x + b`}</Formula> built the same way regardless of what's being predicted, a chosen probability distribution for the outcome (Bernoulli for a 0/1 label, Poisson for a count, Gaussian for a continuous value), and a <strong>link function</strong> that connects the linear predictor to the mean of that distribution.
      </Paragraph>

      <Paragraph delay={1.90}>
        Plain linear regression is the GLM where the outcome is modeled as Gaussian and the link function is the identity, the linear predictor directly is the predicted mean, no transform needed. Logistic regression is the GLM where the outcome is Bernoulli and the link function is the logit, the linear predictor equals log-odds rather than the probability itself, which is exactly the sigmoid inversion worked through earlier.
      </Paragraph>

      <Paragraph delay={1.95}>
        <strong>Poisson regression</strong> is the same recipe applied to count data, the number of failed logins in an hour, the number of claims filed against an insurance policy, values that are non-negative integers rather than a probability. It pairs a Poisson distribution with a log link, so the linear predictor equals the log of the expected count. Exponentiating the linear predictor rather than pushing it through a sigmoid keeps the predicted mean positive, the same way the sigmoid kept logistic regression's predicted mean between 0 and 1. The pattern is identical across all of it, take the same linear score, choose the link function that maps it to whatever range the outcome actually lives in, and fit by maximum likelihood under the matching distribution.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        A worked example
      </Heading>

      <Paragraph delay={2.05}>
        A tiny dataset makes all of this concrete. Twenty students report hours studied before an exam, and whether they passed.
      </Paragraph>

      <CodeBlock
        delay={2.10}
        language="Python"
        code={`import numpy as np
from sklearn.linear_model import LogisticRegression

hours = np.array([0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0, 2.25, 2.5, 2.75,
                   3.0, 3.25, 3.5, 4.0, 4.25, 4.5, 4.75, 5.0, 5.5, 6.0])
passed = np.array([0, 0, 0, 0, 0, 0, 1, 0, 1, 0,
                    1, 0, 1, 1, 1, 0, 1, 1, 1, 1])

model = LogisticRegression()
model.fit(hours.reshape(-1, 1), passed)

print(model.coef_, model.intercept_)
# [[0.9955]] [-2.9462]

for h in [1, 2, 3, 4, 5]:
    print(h, model.predict_proba([[h]])[0, 1])
# 1 0.1245
# 2 0.2778
# 3 0.5101
# 4 0.7381
# 5 0.8841`}
      />

      <Paragraph delay={2.15}>
        The fitted coefficient of about <Formula>{`0.996`}</Formula> per hour means each additional hour studied multiplies the odds of passing by roughly <Formula>{`e^{0.996} \\approx 2.71`}</Formula>. The predicted probabilities climb smoothly from 12% at one hour to 88% at five, crossing 50% right around three hours, which is exactly where the intercept and coefficient place the log-odds at zero. Checked against its own twenty training labels, this model gets 16 out of 20 right, 80% accuracy, on a dataset this small a handful of students who studied a similar number of hours but landed on opposite sides of pass and fail.
      </Paragraph>

      <Heading level={2} delay={2.20}>
        Takeaways
      </Heading>

      <List delay={2.25}>
        <ListItem>Linear regression's unbounded output makes it the wrong tool for a 0/1 label, the sigmoid squashes a linear score into a valid probability, and its inverse (the logit) is exactly log-odds.</ListItem>
        <ListItem>Binary cross-entropy is the negative log-likelihood of a Bernoulli model, and its gradient reduces to prediction error times input, the same clean form that shows up across most probabilistic models trained this way.</ListItem>
        <ListItem>A coefficient in logistic regression describes a multiplicative change in odds, <Formula>{`e^{w_j}`}</Formula> per unit of the feature, not an additive change in probability.</ListItem>
        <ListItem>Calibration and accuracy measure different things, a well-ranked model can still report probabilities that don't match observed frequencies, and a reliability diagram is how that gets checked.</ListItem>
        <ListItem>The 0.5 decision threshold is only correct when both error types cost the same, cost-asymmetric problems like fraud detection should move the cutoff toward whichever mistake is cheaper to make.</ListItem>
      </List>

      <Paragraph delay={2.30}>
        Logistic regression tends to get introduced as a one-off trick for classification, but it's really the most commonly used member of a much wider family. Once the pattern of linear predictor plus link function plus matching distribution is visible, Poisson regression for counts and a handful of other GLMs stop looking like separate models and start looking like the same idea with a different link function plugged in. Thanks for reading.
      </Paragraph>
    </>
  ),
};
