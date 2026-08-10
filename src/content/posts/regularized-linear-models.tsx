import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  RegularizationPathDiagram,
} from "../components";

export const regularizedLinearModels: BlogPostData = {
  title: "Regularized Linear Models",
  date: "August 1, 2026",
  slug: "regularized-linear-models",
  content: (
    <>
      <Paragraph delay={0.10}>
        Fit a straight line through a handful of points and it usually looks reasonable. Fit a linear model with fifty features to twenty-five rows of data and something strange happens. The fit on the training rows looks great, sometimes suspiciously perfect, and then it falls apart the moment new data shows up. Nothing about ordinary least squares broke. It did exactly what it was asked to do: minimize error on the rows it could see. With that many knobs to turn relative to how much data was available, it found a way to explain every wiggle, including the wiggles that were just noise.
      </Paragraph>

      <Paragraph delay={0.15}>
        That's the failure mode regularization exists to fix. A model with a lot of flexibility relative to the amount of data it's trained on tends to swing wildly depending on exactly which rows happened to land in the training set. That's a variance problem more than a bias problem. Regularization trades away a little bit of fit on the training data in exchange for a model that doesn't swing so hard from one dataset to the next. For linear models specifically, that trade shows up as a small addition to the training objective. The exact shape of that addition, whether it's Ridge, Lasso, or something in between, changes what the fitted coefficients end up looking like, in ways that matter well beyond a validation score.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Ordinary least squares and where it overreaches
      </Heading>

      <Paragraph delay={0.25}>
        Ordinary least squares (OLS) picks the coefficient vector <Formula>{`\\beta`}</Formula> that minimizes squared error between predictions and targets.
      </Paragraph>

      <Formula block delay={0.30}>
        {`\\hat\\beta_{\\text{OLS}} = \\arg\\min_\\beta \\sum_{i=1}^{n} (y_i - x_i^\\top \\beta)^2`}
      </Formula>

      <Paragraph delay={0.35}>
        Nothing in that objective penalizes a coefficient for being large. If two features are correlated with each other, OLS is perfectly happy to assign one of them a huge positive coefficient and the other a huge negative one, as long as the two cancel out enough to fit the training rows well. Add more features than the data can comfortably support and this gets worse. The fitted coefficients start absorbing sampling noise instead of the actual relationship between inputs and target, and a slightly different training sample would have produced a noticeably different set of coefficients. That instability is the whole problem regularization is aimed at. This isn't a claim that OLS is calculating something wrong, it's just that an unconstrained fit has no mechanism telling it "not so big" when the data alone can't justify a big coefficient.
      </Paragraph>

      <Heading level={2} delay={0.40}>
        Ridge regression, shrinking everything a little
      </Heading>

      <Paragraph delay={0.45}>
        <strong>Ridge regression</strong> adds a penalty proportional to the sum of squared coefficients, scaled by a strength parameter <Formula>{`\\lambda`}</Formula>.
      </Paragraph>

      <Formula block delay={0.50}>
        {`\\hat\\beta_{\\text{ridge}} = \\arg\\min_\\beta \\sum_{i=1}^{n} (y_i - x_i^\\top \\beta)^2 + \\lambda \\sum_{j=1}^{p} \\beta_j^2`}
      </Formula>

      <Paragraph delay={0.55}>
        This is the <InlineCode>L2</InlineCode> penalty, and it changes the optimization in a specific way. Every coefficient now costs something proportional to its own square, so the fit has to actually earn a large coefficient through a strong relationship with the target, not just through happening to reduce training error a little further. Turning <Formula>{`\\lambda`}</Formula> up shrinks every coefficient toward zero, smoothly and by roughly the same proportion, and there's even a clean closed-form solution behind it.
      </Paragraph>

      <Formula block delay={0.60}>
        {`\\hat\\beta_{\\text{ridge}} = (X^\\top X + \\lambda I)^{-1} X^\\top y`}
      </Formula>

      <Paragraph delay={0.65}>
        Compare that to the unregularized normal equation, <Formula>{`\\hat\\beta_{\\text{OLS}} = (X^\\top X)^{-1} X^\\top y`}</Formula>. Adding <Formula>{`\\lambda I`}</Formula> before inverting does two things at once. It shrinks the coefficients, and it also makes the matrix being inverted better behaved when features are correlated or when there are more features than rows, a case where <Formula>{`X^\\top X`}</Formula> alone can be singular or nearly so. Ridge coefficients shrink toward zero as <Formula>{`\\lambda`}</Formula> grows, but for a feature with a genuine relationship to the target, they never actually reach exactly zero. Every feature stays in the model, just contributing less.
      </Paragraph>

      <Heading level={2} delay={0.70}>
        Lasso, and coefficients that hit zero exactly
      </Heading>

      <Paragraph delay={0.75}>
        <strong>Lasso</strong> (least absolute shrinkage and selection operator) swaps the squared penalty for the sum of absolute values, the <InlineCode>L1</InlineCode> penalty.
      </Paragraph>

      <Formula block delay={0.80}>
        {`\\hat\\beta_{\\text{lasso}} = \\arg\\min_\\beta \\sum_{i=1}^{n} (y_i - x_i^\\top \\beta)^2 + \\lambda \\sum_{j=1}^{p} |\\beta_j|`}
      </Formula>

      <Paragraph delay={0.85}>
        That single change in exponent has a much bigger effect on the result than it looks like it should. The squared penalty gets gentler and gentler as a coefficient approaches zero, since its slope shrinks along with it. It never quite finishes pushing a coefficient all the way there. The absolute-value penalty has a constant slope no matter how small the coefficient gets, so it keeps pushing right up to zero and, for weakly supported features, past the point where the data can justify keeping the coefficient nonzero at all. The geometric intuition is that the <InlineCode>L1</InlineCode> penalty's constraint region has sharp corners sitting exactly on the axes. The optimal solution tends to land on one of those corners, which means some coefficient ends up exactly zero.
      </Paragraph>

      <Paragraph delay={0.90}>
        Practically, this makes Lasso do automatic feature selection as a side effect of fitting. Features that don't carry real signal get dropped from the model entirely rather than just shrunk down to something small, which is a genuinely different outcome from Ridge, not just a matter of degree. That's useful when there's a suspicion that only a handful of the available features actually matter. It comes at a cost, though: when two features are strongly correlated, Lasso tends to arbitrarily keep one and zero out the other, rather than splitting credit between them the way Ridge does.
      </Paragraph>

      <Heading level={2} delay={0.95}>
        Elastic Net, splitting the difference
      </Heading>

      <Paragraph delay={1.00}>
        <strong>Elastic Net</strong> mixes both penalties with a weight <Formula>{`\\alpha \\in [0, 1]`}</Formula> controlling the balance between them.
      </Paragraph>

      <Formula block delay={1.05}>
        {`\\hat\\beta_{\\text{enet}} = \\arg\\min_\\beta \\sum_{i=1}^{n} (y_i - x_i^\\top \\beta)^2 + \\lambda \\Big(\\alpha \\sum_{j=1}^{p} |\\beta_j| + (1-\\alpha) \\sum_{j=1}^{p} \\beta_j^2 \\Big)`}
      </Formula>

      <Paragraph delay={1.10}>
        Setting <Formula>{`\\alpha = 1`}</Formula> recovers plain Lasso, <Formula>{`\\alpha = 0`}</Formula> recovers plain Ridge, and anything in between gets some of each behavior, some coefficients zeroed out, the surviving ones shrunk smoothly rather than each competing feature getting picked essentially at random. Elastic Net exists specifically for the case Lasso struggles with, groups of correlated features where the goal is to keep the whole group rather than arbitrarily keeping one member and dropping the rest. The tradeoff is one more knob to tune, <Formula>{`\\lambda`}</Formula> and <Formula>{`\\alpha`}</Formula> both need to be chosen, instead of just <Formula>{`\\lambda`}</Formula> alone.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        Feature scaling, not optional here
      </Heading>

      <Paragraph delay={1.20}>
        Every penalty above sums coefficients directly, and a coefficient's size depends entirely on the scale of the feature it multiplies. A feature measured in dollars might need a coefficient near 0.001 to have a sensible effect on the prediction, while a feature measured in single-digit counts might need a coefficient near 50 for the same size of effect. An unscaled penalty term would crush the count feature's coefficient toward zero far more aggressively than the dollar feature's, not because the count feature matters less, but purely because its natural coefficient happens to be bigger in absolute terms. That's an artifact of units, not a statement about which feature is more predictive.
      </Paragraph>

      <Paragraph delay={1.25}>
        The fix is to standardize every feature before fitting: subtract its mean and divide by its standard deviation. That puts every feature on the same footing in the penalty, one standard deviation of movement. Ridge, Lasso, and Elastic Net all assume this implicitly. Skipping it doesn't cause an error, it just silently changes which features the model decides to keep or shrink, for reasons that have nothing to do with the actual relationship being modeled. The worked example below shows exactly how large that effect can be.
      </Paragraph>

      <Heading level={2} delay={1.30}>
        A worked example, computed and verified
      </Heading>

      <Paragraph delay={1.35}>
        Twenty-five rows, five features, and a true relationship <Formula>{`y = 4x_0 - 3x_1 + 2x_2 + 0 \\cdot x_3 + 0 \\cdot x_4 + \\varepsilon`}</Formula>, so the last two features carry no real signal at all. Every feature is standardized first, then OLS, Ridge, and Lasso are each fit to the identical data.
      </Paragraph>

      <CodeBlock
        delay={1.40}
        language="Python"
        code={`import numpy as np
from sklearn.linear_model import LinearRegression, Ridge, Lasso
from sklearn.preprocessing import StandardScaler

rng = np.random.default_rng(3)
n, p = 25, 5
X_raw = rng.normal(size=(n, p))
true_coef = np.array([4.0, -3.0, 2.0, 0.0, 0.0])
y = X_raw @ true_coef + rng.normal(scale=1.5, size=n)

X = StandardScaler().fit_transform(X_raw)

ols = LinearRegression().fit(X, y)
ridge = Ridge(alpha=1.0).fit(X, y)
lasso = Lasso(alpha=0.3).fit(X, y)

print("true coef  ", np.round(true_coef, 3))
print("OLS coef   ", np.round(ols.coef_, 3))
print("Ridge coef ", np.round(ridge.coef_, 3))
print("Lasso coef ", np.round(lasso.coef_, 3))
# true coef   [ 4.    -3.     2.     0.     0.   ]
# OLS coef    [ 4.002 -3.687  1.837  0.302  0.017]
# Ridge coef  [ 3.856 -3.579  1.792  0.254  0.018]
# Lasso coef  [ 3.676 -3.524  1.539  0.     0.   ]`}
      />

      <Paragraph delay={1.45}>
        OLS lands close to the true coefficients on the first three features, but it also hands the two noise features nonzero coefficients, 0.302 and 0.017, purely because with only twenty-five rows there's always some spurious correlation to latch onto. Ridge shrinks all five coefficients toward zero, including the noise features, but doesn't eliminate them. Its 0.254 and 0.018 are smaller than OLS's, but still both nonzero. Lasso is the one that actually zeroes out both noise features while leaving the three real ones intact. That comes at the cost of shrinking the real coefficients a bit harder than Ridge does, 3.676 instead of Ridge's 3.856 on the strongest feature. The overall coefficient vector also shrinks in aggregate. The OLS coefficients have an <Formula>{`L2`}</Formula> norm of 5.751, Ridge brings that down to 5.564, a modest but real reduction obtained just by adding the penalty term.
      </Paragraph>

      <Paragraph delay={1.50}>
        The scaling point from above is easy to demonstrate on this same data. Multiply the first feature's raw values by 100 before fitting Ridge without standardizing, and its coefficient gets crushed to 0.0434, even though it's the strongest true signal in the dataset. Standardize first and the same feature's Ridge coefficient comes back to 3.856, right where it was before. Nothing about the relationship between that feature and the target changed, only its units did, and an unscaled penalty responded to the unit change as if it were a real signal change.
      </Paragraph>

      <CodeBlock
        delay={1.55}
        language="Python"
        code={`X_bad = X_raw.copy()
X_bad[:, 0] *= 100  # feature 0 now measured on a much larger scale

ridge_unscaled = Ridge(alpha=1.0).fit(X_bad, y)
ridge_scaled = Ridge(alpha=1.0).fit(StandardScaler().fit_transform(X_bad), y)

print("unscaled  ", np.round(ridge_unscaled.coef_, 4))
print("standardized", np.round(ridge_scaled.coef_, 4))
# unscaled     [ 0.0434 -2.8368  1.8523  0.3181  0.0116]
# standardized [ 3.8556 -3.5791  1.7923  0.2542  0.0185]`}
      />

      <Heading level={2} delay={1.60}>
        The regularization path
      </Heading>

      <Paragraph delay={1.65}>
        Sweeping the penalty strength from very small to very large and tracking every coefficient along the way is called the <strong>regularization path</strong>, and it's the clearest way to see the difference between the two penalties directly. Refitting Ridge and Lasso on the same dataset above across a log-spaced grid of penalty strengths, and following three coefficients through that sweep, the strongest true signal, the moderate true signal, and one of the pure-noise features, produces two very different pictures.
      </Paragraph>

      <RegularizationPathDiagram
        delay={0.08}
        caption="Ridge coefficients shrink smoothly and never reach zero, Lasso coefficients hit exactly zero at a specific penalty strength each, with the noise coefficient (true effect 0) zeroing out first and the strongest signal (true effect 4) hanging on the longest."
      />

      <Paragraph delay={1.70}>
        On the Ridge side, all three lines bend downward as the penalty grows but keep going, none of them touch zero even at the strongest penalty shown. On the Lasso side, the noise feature's coefficient collapses to exactly zero almost immediately, around a penalty strength of 0.018, well before either real feature is affected much at all. The moderate signal follows at a penalty strength around 2.46, and the strongest signal holds out until around 4.96. That ordering isn't a coincidence. Lasso zeroes out the features it's least sure matter first, and keeps a feature nonzero for exactly as long as the data still supports it. Reading a path like this left to right, before ever touching a validation set, already tells a useful story about which features the model treats as reliable.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Choosing the penalty strength with cross-validation
      </Heading>

      <Paragraph delay={1.80}>
        None of the plots above answer the one question that actually matters for deployment, which single penalty strength to ship. Too small and the model is close to unregularized OLS, back to chasing noise. Too large and every coefficient gets crushed toward zero regardless of how real the underlying signal is, trading the overfitting problem for an underfitting one. The standard way to pick a value is <Formula>{`k`}</Formula>-fold cross-validation, fit the model at each candidate penalty strength on <Formula>{`k-1`}</Formula> folds, score it on the held-out fold, rotate which fold is held out, and average the scores across rotations. The penalty strength with the best average held-out score gets picked, then the model is refit on the full training set at that value.
      </Paragraph>

      <CodeBlock
        delay={1.85}
        language="Python"
        code={`from sklearn.linear_model import RidgeCV, LassoCV

ridge_cv = RidgeCV(alphas=np.logspace(-2, 2, 80)).fit(X, y)
lasso_cv = LassoCV(alphas=np.logspace(-2.5, 1.2, 80), cv=5, max_iter=20000).fit(X, y)

print("RidgeCV best alpha", ridge_cv.alpha_)   # 0.665
print("LassoCV best alpha", lasso_cv.alpha_)   # 0.153
print("LassoCV coef      ", np.round(lasso_cv.coef_, 3))
# [ 3.82  -3.611  1.67   0.077  0.   ]`}
      />

      <Paragraph delay={1.90}>
        Cross-validation picks a Lasso penalty of about 0.153 on this dataset, weaker than the 0.3 used in the worked example above. At that strength, one of the two noise features (0.077) hasn't been fully zeroed out yet. That's a reminder that cross-validation optimizes for held-out prediction error, not for a perfectly clean feature selection, the two goals usually agree closely but aren't mathematically the same thing. <InlineCode>RidgeCV</InlineCode> and <InlineCode>LassoCV</InlineCode> both do this grid search internally and efficiently, but the underlying idea is identical to running an ordinary cross-validation loop over any other hyperparameter, only the thing being tuned is <Formula>{`\\lambda`}</Formula> instead of a tree depth or a learning rate.
      </Paragraph>

      <Heading level={2} delay={1.95}>
        Takeaways
      </Heading>

      <List delay={2.00}>
        <ListItem>Unregularized least squares has no mechanism to prefer smaller coefficients, so with many features relative to the amount of data, it absorbs sampling noise into the fitted coefficients themselves.</ListItem>
        <ListItem>Ridge (<InlineCode>L2</InlineCode>) shrinks every coefficient smoothly toward zero without ever fully eliminating one, and keeps the underlying linear system numerically better behaved when features are correlated.</ListItem>
        <ListItem>Lasso (<InlineCode>L1</InlineCode>) drives weakly supported coefficients to exactly zero, doing feature selection as a side effect, at the cost of arbitrary choices among strongly correlated features.</ListItem>
        <ListItem>Elastic Net mixes both penalties to keep groups of correlated features together while still allowing some coefficients to reach exactly zero.</ListItem>
        <ListItem>Feature scaling before regularizing is not optional, an unscaled penalty punishes features based on their units rather than their actual relationship to the target, and cross-validation is the standard way to pick the penalty strength itself.</ListItem>
      </List>

      <Paragraph delay={2.05}>
        Ridge, Lasso, and Elastic Net all start from the exact same least squares objective and change exactly one thing about it, the shape of the penalty added to large coefficients. That one choice ends up deciding whether a weak feature gets shrunk a little or dropped entirely, whether correlated features share credit or compete for it, and how much the fitted model can be trusted to hold up on data it hasn't seen yet. Thanks for reading.
      </Paragraph>
    </>
  ),
};
