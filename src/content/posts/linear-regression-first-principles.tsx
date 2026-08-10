import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  RegressionFitDiagram,
} from "../components";

export const linearRegressionFirstPrinciples: BlogPostData = {
  title: "Linear Regression from First Principles",
  date: "August 1, 2026",
  slug: "linear-regression-first-principles",
  content: (
    <>
      <Paragraph delay={0.10}>
        Every spreadsheet trendline button and every "fit a line through this" moment in an analytics dashboard is running the same fifteen-minute derivation underneath. Give it a scatter of points and it hands back a line, and a slope, and usually some number that's supposed to say how good the fit is. Almost nobody who clicks that button has watched the line get computed. It's worth watching once, because the same machinery, minimize a squared error, solve for the minimum, shows up again in logistic regression, in neural network training, in almost everything that follows it.
      </Paragraph>

      <Heading level={2} delay={0.15}>
        Setting up the problem
      </Heading>

      <Paragraph delay={0.20}>
        Linear regression asks for the best straight-line relationship between a set of input features and a numeric target. With one feature, that's the familiar <Formula>{`y = \\beta_0 + \\beta_1 x`}</Formula>. With several features, the same idea generalizes to a weighted sum, <Formula>{`y = \\beta_0 + \\beta_1 x_1 + \\beta_2 x_2 + \\dots`}</Formula>. Either way, "fitting" the model means picking the coefficients <Formula>{`\\beta`}</Formula> that make the line's predictions match the observed data as closely as possible.
      </Paragraph>

      <Paragraph delay={0.25}>
        The clean way to write this for <Formula>{`n`}</Formula> observations and <Formula>{`p`}</Formula> features is matrix form. Stack every observation's features into a <strong>design matrix</strong> <Formula>{`X`}</Formula>, one row per observation, one column per feature, plus a column of ones to absorb the intercept. Stack the observed outcomes into a <strong>target vector</strong> <Formula>{`y`}</Formula>.
      </Paragraph>

      <Formula block delay={0.30}>
        {`X = \\begin{bmatrix} 1 & x_{11} & x_{12} & \\dots \\\\ 1 & x_{21} & x_{22} & \\dots \\\\ \\vdots & \\vdots & \\vdots & \\ddots \\end{bmatrix}, \\qquad y = \\begin{bmatrix} y_1 \\\\ y_2 \\\\ \\vdots \\end{bmatrix}`}
      </Formula>

      <Paragraph delay={0.35}>
        The model's predictions are then just a single matrix multiplication, <Formula>{`\\hat y = X\\beta`}</Formula>, and fitting the model means choosing <Formula>{`\\beta`}</Formula> so that <Formula>{`\\hat y`}</Formula> lands as close to the real <Formula>{`y`}</Formula> as possible. "As close as possible" needs a precise definition before it means anything, and <strong>ordinary least squares</strong> defines it as minimizing the sum of squared differences between predicted and observed values.
      </Paragraph>

      <Heading level={2} delay={0.40}>
        Minimizing squared error, and where the normal equations come from
      </Heading>

      <Paragraph delay={0.45}>
        Squared error is used rather than plain error mostly for convenience. It penalizes big misses much harder than small ones, and it's smooth everywhere, which means calculus applies cleanly. The quantity being minimized is the sum of squared residuals, written compactly as a single expression over the whole dataset at once.
      </Paragraph>

      <Formula block delay={0.50}>
        {`\\mathcal{L}(\\beta) = \\|y - X\\beta\\|^2 = (y - X\\beta)^{\\top}(y - X\\beta)`}
      </Formula>

      <Paragraph delay={0.55}>
        Finding the <Formula>{`\\beta`}</Formula> that minimizes this is an ordinary calculus problem, take the derivative with respect to <Formula>{`\\beta`}</Formula>, set it to zero, and solve. Expanding the expression and differentiating (the matrix-calculus rules are mechanical but tedious to reproduce here) gives a clean result.
      </Paragraph>

      <Formula block delay={0.60}>
        {`\\frac{\\partial \\mathcal{L}}{\\partial \\beta} = -2X^{\\top}(y - X\\beta) = 0 \\;\\implies\\; X^{\\top}X\\beta = X^{\\top}y`}
      </Formula>

      <Paragraph delay={0.65}>
        Those are the <strong>normal equations</strong>. Whenever <Formula>{`X^{\\top}X`}</Formula> is invertible, they solve directly for the exact minimizer.
      </Paragraph>

      <Formula block delay={0.70}>
        {`\\hat\\beta = (X^{\\top}X)^{-1}X^{\\top}y`}
      </Formula>

      <Paragraph delay={0.75}>
        That's the entire closed-form solution to linear regression, one formula, no iteration, no learning rate to tune. It exists for a specific reason worth naming. The squared-error loss is a quadratic function of <Formula>{`\\beta`}</Formula>, and a quadratic bowl has exactly one minimum, with a derivative that's linear in <Formula>{`\\beta`}</Formula>. Setting a linear equation to zero and solving is something linear algebra can do in one shot. There's no need to inch toward the answer the way most loss surfaces demand. That's also exactly why this trick doesn't extend to logistic regression or a neural network: their loss surfaces aren't quadratic, so setting the gradient to zero produces an equation that can't be solved directly.
      </Paragraph>

      <Heading level={2} delay={0.80}>
        Gradient descent, when there's no closed form
      </Heading>

      <Paragraph delay={0.85}>
        <Formula>{`X^{\\top}X`}</Formula> stops being invertible when columns of <Formula>{`X`}</Formula> are exact linear combinations of each other, or when there are more features than observations, and in both cases the normal equations either fail outright or have infinitely many equally good solutions. Even when it is invertible, inverting a large matrix by hand or by computer gets expensive fast as the number of features grows, since the cost scales roughly with the cube of the feature count.
      </Paragraph>

      <Paragraph delay={0.90}>
        This is where <strong>gradient descent</strong> earns its keep as the general-purpose alternative. Instead of solving for the minimum directly, it starts from some initial guess for <Formula>{`\\beta`}</Formula> and repeatedly nudges it a small step in the direction that decreases the loss fastest, the negative gradient, until the steps stop making meaningful progress. For linear regression specifically, the two methods are guaranteed to agree, since the loss surface is quadratic and has only one minimum. Gradient descent just walks there instead of solving for it in one algebraic step. The real payoff of understanding gradient descent here is that the exact same procedure, no closed form required, is what trains logistic regression, and what trains every layer of a neural network, once the loss surface stops being a simple quadratic bowl.
      </Paragraph>

      <Heading level={2} delay={0.95}>
        A worked example, by hand and in code
      </Heading>

      <Paragraph delay={1.00}>
        Five points make the normal equations concrete without turning into a page of arithmetic. Take <Formula>{`x = (1, 2, 3, 4, 5)`}</Formula> and <Formula>{`y = (2, 3, 5, 4, 6)`}</Formula>. With a single feature, the closed-form solution simplifies to the familiar slope-and-intercept formulas built from means and deviations.
      </Paragraph>

      <Formula block delay={1.05}>
        {`\\hat\\beta_1 = \\frac{\\sum_i (x_i - \\bar x)(y_i - \\bar y)}{\\sum_i (x_i - \\bar x)^2}, \\qquad \\hat\\beta_0 = \\bar y - \\hat\\beta_1 \\bar x`}
      </Formula>

      <Paragraph delay={1.10}>
        Both means are <Formula>{`\\bar x = 3`}</Formula> and <Formula>{`\\bar y = 4`}</Formula>. The numerator sums <Formula>{`(x_i - 3)(y_i - 4)`}</Formula> across all five points, which comes out to <Formula>{`(-2)(-2) + (-1)(-1) + (0)(1) + (1)(0) + (2)(2) = 4 + 1 + 0 + 0 + 4 = 9`}</Formula>. The denominator sums <Formula>{`(x_i - 3)^2`}</Formula>, giving <Formula>{`4 + 1 + 0 + 1 + 4 = 10`}</Formula>. That puts the slope at <Formula>{`\\hat\\beta_1 = 9/10 = 0.9`}</Formula> and the intercept at <Formula>{`\\hat\\beta_0 = 4 - 0.9(3) = 1.3`}</Formula>, so the fitted line is <Formula>{`\\hat y = 1.3 + 0.9x`}</Formula>.
      </Paragraph>

      <Paragraph delay={1.15}>
        Plugging each <Formula>{`x_i`}</Formula> back in gives predictions of <Formula>{`2.2, 3.1, 4.0, 4.9, 5.8`}</Formula>, and subtracting those from the actual <Formula>{`y`}</Formula> values gives residuals of <Formula>{`-0.2, -0.1, 1.0, -0.9, 0.2`}</Formula>. Squaring and summing those residuals gives <Formula>{`1.9`}</Formula>, the smallest possible sum of squared errors any straight line can achieve on these five points. The same numbers fall out of the general matrix formula, and NumPy's closed-form solve confirms it.
      </Paragraph>

      <CodeBlock
        delay={1.20}
        language="Python"
        code={`import numpy as np

x = np.array([1, 2, 3, 4, 5], dtype=float)
y = np.array([2, 3, 5, 4, 6], dtype=float)

n = len(x)
X = np.column_stack([np.ones(n), x])   # design matrix, intercept column + x

beta = np.linalg.inv(X.T @ X) @ X.T @ y
print(beta)  # [1.3, 0.9] -> intercept, slope

y_hat = X @ beta
residuals = y - y_hat
ss_res = np.sum(residuals ** 2)
ss_tot = np.sum((y - y.mean()) ** 2)
r_squared = 1 - ss_res / ss_tot
print(residuals)    # [-0.2, -0.1, 1.0, -0.9, 0.2]
print(r_squared)    # 0.81`}
      />

      <RegressionFitDiagram
        delay={0.08}
        caption="Five points, the fitted line y = 1.3 + 0.9x, and the residual (dashed) from each point to the line the normal equations minimized."
      />

      <Paragraph delay={1.25}>
        Gradient descent lands on the identical answer without ever forming <Formula>{`X^{\\top}X`}</Formula>, starting both coefficients at zero, repeatedly stepping against the gradient of the squared-error loss, and after a couple thousand small steps at a modest learning rate it converges to the same <Formula>{`1.3`}</Formula> and <Formula>{`0.9`}</Formula> the closed form produced in a single matrix solve.
      </Paragraph>

      <Heading level={2} delay={1.30}>
        The assumptions doing the quiet work
      </Heading>

      <Paragraph delay={1.35}>
        Ordinary least squares always returns some line. It never refuses to fit. Whether that line means anything depends on four assumptions the derivation quietly leans on.
      </Paragraph>

      <List delay={1.40}>
        <ListItem><strong>Linearity.</strong> The true relationship between the features and the target is (approximately) a straight line, or a straight combination of features. Fit a line through data that actually curves and every prediction carries a systematic error that no amount of extra data ever fixes, since the model's whole hypothesis space is lines.</ListItem>
        <ListItem><strong>Homoscedasticity.</strong> The scatter of residuals around the line has roughly constant spread across the whole range of x, not tight near one end and wide near the other. Violate it and the model's error bars and significance tests, which all assume one shared noise level, become wrong exactly where the spread is widest.</ListItem>
        <ListItem><strong>Independence.</strong> One observation's error doesn't leak information about the next one's. Time series data is the classic violator: today's residual and tomorrow's residual are correlated, and treating them as independent makes the model look far more confident than the data actually supports.</ListItem>
        <ListItem><strong>No severe multicollinearity.</strong> The feature columns in <Formula>{`X`}</Formula> aren't near-exact linear combinations of each other. Two features that move almost in lockstep make <Formula>{`X^{\\top}X`}</Formula> close to singular, and the coefficients the normal equations return become numerically unstable, swinging wildly with tiny changes in the data even though the model's overall predictions barely move.</ListItem>
      </List>

      <Paragraph delay={1.45}>
        Violating any of these assumptions doesn't stop the arithmetic from running. <Formula>{`(X^{\\top}X)^{-1}X^{\\top}y`}</Formula> computes a number regardless. What breaks is the ability to trust that number: the coefficients, their confidence intervals, and any claim about which feature matters more all quietly assume these four things hold.
      </Paragraph>

      <Heading level={2} delay={1.50}>
        Residual plots, the practical diagnostic
      </Heading>

      <Paragraph delay={1.55}>
        Checking those assumptions rarely happens by staring at a formula. It happens by plotting residuals against the fitted values or against each feature. A <strong>residual plot</strong> puts <Formula>{`\\hat y`}</Formula> (or <Formula>{`x`}</Formula>) on one axis and <Formula>{`y - \\hat y`}</Formula> on the other, and what shows up there is the fastest read on whether the model's assumptions hold.
      </Paragraph>

      <Paragraph delay={1.60}>
        A good fit produces a residual plot that looks like formless static, points scattered evenly above and below zero with no visible pattern and roughly constant spread left to right. That randomness is the whole point. It means whatever structure the line could capture, it captured, and what's left over really is noise. A bad fit tends to show up in one of two recognizable shapes. A curve — residuals trending negative, then positive, then negative again as <Formula>{`x`}</Formula> increases — is the signature of a linear model forced onto a nonlinear relationship. The line is missing a pattern it doesn't have the shape to represent. A funnel — residuals tightly bunched near one end of the x-axis and fanned out wide near the other — is the signature of heteroscedasticity: the violated constant-spread assumption showing up visually instead of algebraically.
      </Paragraph>

      <Paragraph delay={1.65}>
        Both patterns point to a fix. A curved residual pattern usually means adding a polynomial or interaction term, or switching to a model family built for curvature. A funnel usually means transforming the target (a log transform is the common first try) or switching to a regression variant that explicitly models changing variance. Either way, the residual plot is doing something a single R-squared number can't: it shows exactly where and how the model is wrong, not just how much.
      </Paragraph>

      <Heading level={2} delay={1.70}>
        R-squared, and where it stops telling the truth
      </Heading>

      <Paragraph delay={1.75}>
        <Formula>{`R^2`}</Formula> is the standard headline number for how well a linear model fits, the share of the target's total variance the model actually explains.
      </Paragraph>

      <Formula block delay={1.80}>
        {`R^2 = 1 - \\frac{\\sum_i (y_i - \\hat y_i)^2}{\\sum_i (y_i - \\bar y)^2} = 1 - \\frac{SS_{res}}{SS_{tot}}`}
      </Formula>

      <Paragraph delay={1.85}>
        In the five-point example above, that ratio came out to <Formula>{`0.81`}</Formula>, the fitted line accounts for 81% of the spread in <Formula>{`y`}</Formula>, leaving the remaining 19% as residual noise the line doesn't capture. As a single summary number for "does this line roughly track the data," it's genuinely useful. It also has real limits that get ignored constantly.
      </Paragraph>

      <List delay={1.90}>
        <ListItem><strong>It only ever goes up (or stays flat) as more features get added</strong>, regardless of whether those features are meaningful, since an extra column gives the optimizer one more way to fit the training data more closely. Comparing models with different numbers of features on raw R-squared rewards throwing in more columns for no real reason. Adjusted R-squared exists specifically to penalize that.</ListItem>
        <ListItem><strong>A high R-squared says nothing about whether the assumptions above hold.</strong> A curved relationship crammed into a straight line, or heteroscedastic residuals, can still produce a deceptively high R-squared while the underlying fit is genuinely unreliable in specific regions of x.</ListItem>
        <ListItem><strong>It's a summary of fit on the data it was computed on</strong>, not a guarantee of how the model performs on new data. A model can post a strong R-squared on its training set and still generalize poorly. That's the same overfitting story that shows up everywhere else in modeling.</ListItem>
        <ListItem><strong>It says nothing about the size or practical relevance of the error.</strong> A huge dataset can produce a statistically real but practically tiny R-squared, and a small one can produce a large R-squared purely from having little natural variance to explain in the first place.</ListItem>
      </List>

      <Paragraph delay={1.95}>
        A residual plot and an R-squared number answer different questions and neither substitutes for the other. R-squared says how much variance got explained overall, the residual plot says exactly where the model is still wrong. A responsible read of a fitted line checks both.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        Takeaways
      </Heading>

      <List delay={2.05}>
        <ListItem>Ordinary least squares minimizes the sum of squared residuals, and because that loss is quadratic in the coefficients, setting its gradient to zero produces a closed-form answer, the normal equations, <Formula>{`\\hat\\beta = (X^{\\top}X)^{-1}X^{\\top}y`}</Formula>.</ListItem>
        <ListItem>Gradient descent reaches the identical minimum without inverting anything, and is the only option once the loss surface isn't a simple quadratic bowl, which is every model built on top of linear regression's ideas.</ListItem>
        <ListItem>Linearity, homoscedasticity, independence, and low multicollinearity aren't decorative footnotes, each one silently backs a specific claim the fitted coefficients make, and the arithmetic runs the same whether or not they hold.</ListItem>
        <ListItem>A residual plot is the fastest practical check on those assumptions, formless scatter means a healthy fit, a curve or a funnel means a specific, fixable problem.</ListItem>
        <ListItem>R-squared is a useful one-number summary of fit and nothing more, it climbs with every added feature regardless of relevance, and it says nothing about whether the assumptions behind it actually hold.</ListItem>
      </List>

      <Paragraph delay={2.10}>
        The line through the points is never the interesting part. It's the cheapest thing to compute in the whole pipeline. What actually separates a trustworthy fit from a misleading one is everything covered above, checking that the assumptions hold, reading the residuals instead of just the summary statistic, and knowing which parts of this derivation still apply once the model stops being linear. Thanks for reading.
      </Paragraph>
    </>
  ),
};
