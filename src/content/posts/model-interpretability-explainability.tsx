import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  FeatureImportanceBars,
  ShapContributionDiagram,
} from "../components";

export const modelInterpretabilityExplainability: BlogPostData = {
  title: "Model Interpretability and Explainability",
  date: "August 1, 2026",
  slug: "model-interpretability-explainability",
  content: (
    <>
      <Paragraph delay={0.10}>
        A model predicts a house is worth $185,600. A loan applicant gets rejected by a model that never explains itself. A hospital's readmission-risk score flags a patient as high risk with no accompanying reason. In every one of these cases, the number itself is only half the story. The other half, the part someone actually needs before trusting the number or acting on it, is why the model landed there.
      </Paragraph>

      <Paragraph delay={0.15}>
        Getting to "why" is what interpretability and explainability tools are for. They don't change what a model predicts, they attach a story to a prediction that was already made, and the honest version of that story turns out to be more subtle, and more limited, than it first looks.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Global questions and local questions
      </Heading>

      <Paragraph delay={0.25}>
        Every explanation method answers one of two different questions, and mixing them up is the single most common way to misread a result. A <strong>global explanation</strong> describes the model's behavior across the whole input space, on average, which features matter most overall, and in which direction. A <strong>local explanation</strong> describes one specific prediction, why did this particular house get priced at $185,600, not houses in general.
      </Paragraph>

      <Paragraph delay={0.30}>
        A model can be globally simple and locally strange, or the reverse. A linear model is easy to summarize globally (every coefficient is a fixed, constant effect), but a single prediction from it can still surprise someone who only skimmed the coefficient table, because that one prediction is the sum of several effects pulling in different directions at once. A deep decision tree ensemble is nearly impossible to summarize globally in one sentence, but a local explanation of one prediction, tracing exactly which features pushed that one number up or down, is still fully available. Knowing which question is actually being asked, model behavior on average or model behavior on this one row, is the first thing to check before reading any explanation output.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        A tiny dataset to keep every number honest
      </Heading>

      <Paragraph delay={0.40}>
        Every technique below gets demonstrated on the same small, synthetic dataset, so the numbers stay comparable across sections instead of resetting with each new example. The setup is a toy house-price model with four features, <InlineCode>size</InlineCode> (hundreds of square feet), <InlineCode>bedrooms</InlineCode>, <InlineCode>age</InlineCode> (years), and <InlineCode>distance</InlineCode> (kilometers to the nearest transit stop). The true generating process used to build the data leans almost entirely on size and distance, gives bedrooms a modest real effect, and gives age no real effect at all beyond noise, which makes it a useful check on whether an explanation method actually recovers the truth or just produces something plausible-looking.
      </Paragraph>

      <CodeBlock
        delay={0.45}
        language="Python"
        code={`import numpy as np
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor

rng = np.random.default_rng(0)
n = 200
size = rng.uniform(8, 30, n)          # hundreds of sqft, so 800-3000 sqft
bedrooms = rng.integers(1, 6, n).astype(float)
age = rng.uniform(0, 50, n)
distance = rng.uniform(0.1, 10, n)
noise = rng.normal(0, 15, n)

# true effect: heavy on size, moderate on distance, mild on bedrooms, none on age
price = 20 * size + 10 * bedrooms - 8 * distance + 50 + noise

X = np.column_stack([size, bedrooms, age, distance])
X_train, y_train = X[:150], price[:150]
X_test, y_test = X[150:], price[150:]`}
      />

      <Heading level={2} delay={0.50}>
        Linear coefficients, the baseline explanation
      </Heading>

      <Paragraph delay={0.55}>
        The simplest possible explanation is also the one every other method gets compared against. Fit an ordinary linear regression and each coefficient is already a complete local and global explanation at once, holding every other feature fixed, a one-unit increase in this feature changes the prediction by exactly this many dollars, everywhere in the input space, for every prediction the model makes.
      </Paragraph>

      <CodeBlock
        delay={0.60}
        language="Python"
        code={`lin = LinearRegression().fit(X_train, y_train)
print(dict(zip(["size", "bedrooms", "age", "distance"], np.round(lin.coef_, 3))))
print("intercept:", round(lin.intercept_, 3))
print("test R^2:", round(lin.score(X_test, y_test), 4))

# {'size': 19.919, 'bedrooms': 9.61, 'age': 0.011, 'distance': -9.067}
# intercept: 57.169
# test R^2: 0.9941`}
      />

      <Paragraph delay={0.65}>
        The coefficients recover the true generating process almost exactly, size at <Formula>{`19.9`}</Formula> against a true effect of <Formula>{`20`}</Formula>, distance at <Formula>{`-9.1`}</Formula> against a true effect of <Formula>{`-8`}</Formula>, and age at <Formula>{`0.011`}</Formula>, correctly reporting almost nothing, since age was never in the true formula to begin with. That's the appeal of a linear model as a baseline, the explanation is not an approximation bolted on after training, it's a direct readout of how the model actually works. The cost is that this readout is only trustworthy to the extent the true relationship really is linear and additive, a linear model forced onto a curved relationship reports a coefficient that's an honest description of the wrong shape.
      </Paragraph>

      <Heading level={2} delay={0.70}>
        Partial dependence, reading a curve out of a black box
      </Heading>

      <Paragraph delay={0.75}>
        A random forest doesn't have a coefficient to read off, its predictions come from averaging hundreds of trees, each one carving the input space into its own patchwork of rectangles. A <strong>partial dependence plot</strong> (PDP) recovers something coefficient-shaped anyway, sweep one feature across a grid of values, holding every other feature at each of its actual observed values, average the model's prediction at each grid point over the whole dataset, and plot the result. The curve that comes out is the model's average marginal response to that one feature, exactly the same question a linear coefficient answers, just estimated instead of read directly off a formula.
      </Paragraph>

      <CodeBlock
        delay={0.80}
        language="Python"
        code={`from sklearn.inspection import partial_dependence

rf = RandomForestRegressor(n_estimators=200, random_state=0).fit(X_train, y_train)
pd_result = partial_dependence(rf, X_train, features=[0], grid_resolution=10)  # feature 0 = size

print(np.round(pd_result["grid_values"][0], 2))
print(np.round(pd_result["average"][0], 2))

# size grid (hundreds sqft): [ 8.88 11.13 13.37 15.62 17.87 20.12 22.37 24.62 26.87 29.11]
# avg predicted price:       [218.3 256.72 309.84 335.98 404.59 441.27 499.27 532.18 578.33 640.87]`}
      />

      <Paragraph delay={0.85}>
        The curve climbs steadily and close to a straight line across the whole range, from about <Formula>{`\\$218k`}</Formula> at 888 square feet to about <Formula>{`\\$641k`}</Formula> at 2,911 square feet, which is exactly what a genuinely linear underlying effect looks like when a nonparametric model is asked to rediscover it from scratch. A PDP earns its keep specifically when the true curve isn't a straight line, a feature with a threshold effect, or one that matters a lot at low values and barely at all past some point, shows up as a bend or a flattening that a single linear coefficient could never represent. The tradeoff, worth knowing before trusting one, is that averaging over every other feature's observed values can blur together combinations that never actually happen together in the real data, and can also hide the fact that the feature's effect on any one particular prediction depends on which other features that prediction happens to have.
      </Paragraph>

      <Heading level={2} delay={0.90}>
        Permutation importance, a worked example
      </Heading>

      <Paragraph delay={0.95}>
        Feature importance asks a narrower global question than a PDP, not what shape the effect takes, just how much a feature matters overall. <strong>Permutation importance</strong> answers it by breaking one feature at a time. Shuffle a single column's values across the test set, breaking whatever real relationship it had to the target while leaving every other feature and every other row untouched, then measure how much the model's score drops. A feature the model actually relies on causes a big drop when scrambled. A feature the model ignores causes almost no drop, since shuffling noise the model wasn't using anyway changes nothing.
      </Paragraph>

      <CodeBlock
        delay={1.00}
        language="Python"
        code={`from sklearn.inspection import permutation_importance

result = permutation_importance(rf, X_test, y_test, n_repeats=30, random_state=0, scoring="r2")
for name, mean, std in zip(["size", "bedrooms", "age", "distance"], result.importances_mean, result.importances_std):
    print(f"{name}: {mean:.4f} (std {std:.4f})")

# size:      1.8634 (std 0.3468)
# bedrooms:  0.0061 (std 0.0017)
# age:       0.0025 (std 0.0013)
# distance:  0.0365 (std 0.0057)`}
      />

      <Paragraph delay={1.05}>
        The random forest scores <Formula>{`R^2 = 0.9764`}</Formula> on the held-out test set to start with. Shuffling <InlineCode>size</InlineCode> alone drops that score by an average of <Formula>{`1.86`}</Formula>, meaning the model's fit collapses far below zero without it, the single biggest signal in the data by a wide margin. Shuffling <InlineCode>distance</InlineCode> costs a real but much smaller <Formula>{`0.037`}</Formula>. Shuffling <InlineCode>bedrooms</InlineCode> or <InlineCode>age</InlineCode> costs almost nothing, <Formula>{`0.006`}</Formula> and <Formula>{`0.0025`}</Formula>, both close enough to their own standard deviation across repeats to be indistinguishable from noise. That ranking matches the true generating process from the start of this post almost exactly, size dominates, distance has a real but secondary effect, bedrooms is a minor contributor, and age was never actually in the formula.
      </Paragraph>

      <FeatureImportanceBars
        delay={1.10}
        caption="Permutation importance for each feature, the drop in test R2 when that column is shuffled and every other column is left untouched. Size dwarfs the other three."
      />

      <Paragraph delay={1.15}>
        Two things are easy to get wrong with permutation importance. It measures how much the model relied on a feature, not how much that feature actually drives the real-world outcome, a model that never learned a real effect reports zero importance for it regardless of whether that effect exists in the world. And it splits credit unpredictably between correlated features, if two columns carry almost the same information, shuffling either one alone barely hurts the score because the model can lean on the other, which can make two genuinely important, correlated features both look unimportant on their own.
      </Paragraph>

      <Heading level={2} delay={1.20}>
        Shapley-style attributions, splitting credit for one prediction
      </Heading>

      <Paragraph delay={1.25}>
        Permutation importance and a PDP both answer global questions. Explaining one specific prediction, why this house came out at $185,600 and not the training average, needs a local method, and the most principled one borrows an idea from cooperative game theory called the <strong>Shapley value</strong>. Treat the four features as players cooperating to produce a prediction, starting from a baseline (the model's average prediction with no information at all) and asking how much each player's presence changes the payout. The fair way to split credit, the Shapley value's whole contribution, is to average each feature's marginal effect over every possible order the features could have been "added" to the model, so that a feature which only matters when paired with another one still gets credit proportional to how much it actually changed the outcome across all those orderings, rather than however the credit happens to fall out from whichever single order a naive analysis defaults to.
      </Paragraph>

      <Paragraph delay={1.30}>
        Computing the exact Shapley value for a black box model this way means examining every subset of features, exponential in the feature count, which is why most implementations resort to sampling or clever approximations instead. There is one case where the exact answer is cheap. For a linear model with independent features, the Shapley value for a feature reduces to precisely its coefficient times the distance between that feature's value in this row and its average value across training data. No sampling needed, no exponential search, just arithmetic, and it's an exact, fully worked stand-in for what SHAP is estimating in the general case.
      </Paragraph>

      <Formula block delay={1.35}>
        {`\\phi_i(x) = \\beta_i \\cdot (x_i - \\bar{x}_i)`}
      </Formula>

      <Paragraph delay={1.40}>
        Here <Formula>{`\\beta_i`}</Formula> is the linear model's coefficient for feature <Formula>{`i`}</Formula>, <Formula>{`x_i`}</Formula> is this row's value for that feature, and <Formula>{`\\bar{x}_i`}</Formula> is that feature's average across the training set. Sum every <Formula>{`\\phi_i(x)`}</Formula> and add the baseline (the model's average prediction), and the total lands exactly on this row's actual prediction, not approximately, exactly, because the model really is a sum of independent linear terms.
      </Paragraph>

      <CodeBlock
        delay={1.45}
        language="Python"
        code={`means = X_train.mean(axis=0)
x0 = X_test[0]  # size=8.219, bedrooms=1.0, age=35.581, distance=4.993
pred0 = lin.predict(x0.reshape(1, -1))[0]

baseline = lin.intercept_ + np.dot(lin.coef_, means)
contributions = lin.coef_ * (x0 - means)

print("baseline:", round(baseline, 3))                          # 436.855
print("contributions:", dict(zip(["size","bedrooms","age","distance"], np.round(contributions, 3))))
# {'size': -231.257, 'bedrooms': -19.413, 'age': 0.102, 'distance': -0.688}
print("baseline + sum(contributions):", round(baseline + contributions.sum(), 3))  # 185.6
print("direct prediction:", round(pred0, 3))                                       # 185.6`}
      />

      <Paragraph delay={1.50}>
        This particular house is small, only 821.9 square feet against a training average of 1,982.9, and that single fact does almost all the work. The baseline, the average predicted price across the whole training set, is <Formula>{`\\$436.9k`}</Formula>. Being far smaller than average knocks <Formula>{`\\$231.3k`}</Formula> off that baseline. Having only one bedroom against an average of about three knocks off another <Formula>{`\\$19.4k`}</Formula>. Being slightly farther from transit than average costs a nearly invisible <Formula>{`\\$0.7k`}</Formula>, and being somewhat older than average adds back a negligible <Formula>{`\\$0.1k`}</Formula>. Add the baseline and all four contributions together and the total lands, exactly, on the model's actual prediction of <Formula>{`\\$185.6k`}</Formula>.
      </Paragraph>

      <ShapContributionDiagram
        delay={0.07}
        caption="Additive attribution for one house, the exact Shapley decomposition for a linear model. Being far below average size does almost all the work of pulling the prediction below baseline."
      />

      <Paragraph delay={1.55}>
        That additive, exact structure is a property of linear models specifically. A real SHAP value on a random forest or a neural network is an approximation to this same idea, computed by sampling feature orderings or by faster model-specific shortcuts, and it inherits the same guarantee only approximately, in the limit of enough samples the contributions still add up to the difference between the baseline and the actual prediction, but any single run carries some sampling noise. The intuition, though, transfers cleanly, a Shapley-style attribution is answering "how much did this feature's actual value, compared to its typical value, push this one prediction away from average," which is a genuinely different question from permutation importance's "how much does the model rely on this feature overall."
      </Paragraph>

      <Heading level={2} delay={1.60}>
        Counterfactual explanations, what would have to change
      </Heading>

      <Paragraph delay={1.65}>
        A different way to explain the same prediction skips attribution entirely and asks a more actionable question instead. A <strong>counterfactual explanation</strong> finds the smallest change to this row's inputs that would have produced a meaningfully different prediction, framed as "if this had been different, the outcome would have been different too," which is often exactly the form of answer a person on the receiving end of a prediction actually wants.
      </Paragraph>

      <CodeBlock
        delay={1.70}
        language="Python"
        code={`# Holding size, bedrooms, and age fixed at this house's actual values, solve for the
# distance that would make the linear model's prediction equal exactly $150k.
other_terms = lin.intercept_ + lin.coef_[0]*x0[0] + lin.coef_[1]*x0[1] + lin.coef_[2]*x0[2]
target = 150.0
needed_distance = (target - other_terms) / lin.coef_[3]

print("current distance (km):", round(x0[3], 2))    # 4.99
print("current prediction:", round(pred0, 2))         # 185.6
print("distance needed to hit $150k:", round(needed_distance, 2))  # 8.92
print("check:", round(lin.predict([[x0[0], x0[1], x0[2], needed_distance]])[0], 2))  # 150.0`}
      />

      <Paragraph delay={1.75}>
        This house is 4.99 kilometers from the nearest transit stop and predicted at <Formula>{`\\$185.6k`}</Formula>. Solving the linear model's equation for whatever distance would bring the prediction down to <Formula>{`\\$150k`}</Formula>, holding size, bedrooms, and age exactly where they are, gives 8.92 kilometers. That's a genuinely actionable statement in a way none of the attribution numbers above quite are, "move about four kilometers farther from transit and this model's estimate drops by roughly $35,600." For a linear model the algebra is trivial, one variable, solve directly. For a black box the same question usually gets answered by search instead, perturb the input repeatedly, nudging it toward the desired outcome while penalizing how far the search strays from the original row, and stop at the smallest change found that flips the prediction. The two counterfactuals answer the same kind of question with different amounts of certainty behind the answer, exact algebra for a linear model, a best-effort search result for anything more complex.
      </Paragraph>

      <Heading level={2} delay={1.80}>
        Surrogate models, fitting something simple to something not
      </Heading>

      <Paragraph delay={1.85}>
        Every method so far explains a black box while leaving it exactly as complicated as it was. A <strong>surrogate model</strong> takes a different approach entirely, train a genuinely interpretable model, usually a shallow decision tree or a linear model, not on the true labels, but on the black box's own predictions. If the surrogate can reproduce what the black box outputs closely enough, its simple, readable structure becomes a stand-in explanation for the more complex model it was trained to imitate.
      </Paragraph>

      <CodeBlock
        delay={1.90}
        language="Python"
        code={`from sklearn.tree import DecisionTreeRegressor, export_text

rf_train_preds = rf.predict(X_train)
surrogate = DecisionTreeRegressor(max_depth=3, random_state=0).fit(X_train, rf_train_preds)

rf_test_preds = rf.predict(X_test)
surrogate_test_preds = surrogate.predict(X_test)
ss_res = np.sum((rf_test_preds - surrogate_test_preds) ** 2)
ss_tot = np.sum((rf_test_preds - rf_test_preds.mean()) ** 2)
fidelity = 1 - ss_res / ss_tot
print("surrogate fidelity vs the random forest's own predictions:", round(fidelity, 4))  # 0.9764`}
      />

      <Paragraph delay={1.95}>
        The shallow tree recovers <Formula>{`97.6\\%`}</Formula> of the variance in the random forest's own predictions, using nothing but repeated threshold splits on <InlineCode>size</InlineCode>, exactly the feature permutation importance already flagged as dominant. Reading the printed tree shows something genuinely useful, small houses under about 922 square feet get the lowest predicted band, and each successive size threshold steps the prediction up to the next band, an honest, human-readable sketch of what the forest is doing overall, even though the forest itself never made a single hard threshold decision anywhere in its own internals.
      </Paragraph>

      <Paragraph delay={2.00}>
        The catch is right there in the phrase "fidelity to its own predictions." A surrogate is only ever as trustworthy as how well it matches the black box, and a shallow tree that misses <Formula>{`2.4\\%`}</Formula> of that variance is quietly wrong about some fraction of cases, with no built-in signal for which ones. A more complex surrogate closes that gap at the direct cost of being less readable, which is the same capacity-versus-clarity tradeoff every interpretable model faces on its own, just one level removed.
      </Paragraph>

      <Heading level={2} delay={2.05}>
        Explanations are fragile in ways predictions usually aren't
      </Heading>

      <Paragraph delay={2.10}>
        A model's predictions are usually fairly stable, retraining on a slightly different sample of the same data barely moves the numbers a well-fit model outputs. Explanations of that same model are noticeably less stable, and it's worth checking this rather than assuming it away.
      </Paragraph>

      <CodeBlock
        delay={2.15}
        language="Python"
        code={`# Retrain on a lightly perturbed version of the training set (drop 10 rows, add 10 different ones)
keep = rng.choice(150, 140, replace=False)
X_train_pert = np.vstack([X_train[keep], X[150:160]])
y_train_pert = np.concatenate([y_train[keep], price[150:160]])
rf_pert = RandomForestRegressor(n_estimators=200, random_state=0).fit(X_train_pert, y_train_pert)

r_pert = permutation_importance(rf_pert, X_test, y_test, n_repeats=30, random_state=0, scoring="r2")
# original:  size 1.8634  bedrooms 0.0061  age 0.0025  distance 0.0365
# perturbed: size 1.8799  bedrooms 0.0065  age 0.0036  distance 0.0380`}
      />

      <Paragraph delay={2.20}>
        In this particular case the ranking barely moves, size still dominates by roughly the same margin after retraining on a slightly different sample, which is what happens when one feature's real effect is large enough to swamp everything else regardless of exactly which rows the model happened to see. That reassuring result doesn't generalize to every dataset. The moment two or more features carry genuinely overlapping information, correlated features that could each explain roughly the same variance, a small change in which rows get sampled, or even just a different random seed in the model itself, can flip which of those correlated features an importance ranking or a Shapley value credits more. Neither answer is wrong exactly, both features really were available to lean on, but the specific split of credit between them is far more sensitive to incidental noise than the prediction itself ever was. Treating a single explanation run as the final word on which feature matters, without checking whether it holds up under a resample or a different random seed, is one of the more common ways an explanation ends up more confident than it has any right to be.
      </Paragraph>

      <Heading level={2} delay={2.25}>
        What an explanation is not telling anyone
      </Heading>

      <Paragraph delay={2.30}>
        Every method above describes the model, not the world. A feature importance number, a PDP curve, a Shapley value, a counterfactual, all of them answer some version of "what did this specific model do with this specific input," and every one of them is entirely capable of being correct about the model while being wrong about reality.
      </Paragraph>

      <Paragraph delay={2.35}>
        The house-price example makes this easy to see because the true relationship was written down in advance, size really does drive price in that toy world. Real datasets don't come with the answer key. A model trained on observational data routinely learns a strong, genuine statistical relationship between a feature and an outcome that isn't the feature causing the outcome at all, both driven instead by some third thing neither the model nor its explanation ever sees. Distance to transit predicting house price plausibly reflects transit access itself mattering to buyers, or it could just as easily be standing in for neighborhood wealth, since well-off neighborhoods happen to have both good transit and expensive houses for reasons that have nothing to do with the transit stop itself. The model cannot tell those two stories apart, and no explanation method bolted on afterward can either, because every one of them is reading the same correlational pattern the model already learned, just presenting it more legibly.
      </Paragraph>

      <Paragraph delay={2.40}>
        That has a direct, practical consequence for the counterfactual example above. "Moving eight kilometers farther from transit would drop this model's price estimate" is a true statement about the model's arithmetic. It is not a claim that moving the actual house would change its actual market value, and treating a model explanation as license to reason about intervention in the real world, rather than about what the model would output given a different input, is exactly the gap between correlation and causation showing up again, this time wearing the more convincing costume of a specific, individually computed number.
      </Paragraph>

      <Heading level={2} delay={2.45}>
        Takeaways
      </Heading>

      <List delay={2.50}>
        <ListItem>Global explanations describe a model's behavior on average, local explanations describe one prediction, and the two can disagree in shape even for the same model.</ListItem>
        <ListItem>Linear coefficients are the honest baseline explanation, partial dependence plots and permutation importance recover similar global information from models that don't offer a coefficient to read directly.</ListItem>
        <ListItem>A Shapley-style attribution splits one prediction's distance from the model's average output across its features, exactly for a linear model, approximately for anything more complex, and surrogate models trade some fidelity to the black box for a genuinely readable stand-in.</ListItem>
        <ListItem>Explanations are measurably less stable than predictions, especially once features start carrying overlapping information, so a single run of any method deserves a stability check before being trusted.</ListItem>
        <ListItem>Every explanation method describes what the model did, not what causes what in the world, and mistaking the first for the second is the single most common way an explanation gets over-trusted.</ListItem>
      </List>

      <Paragraph delay={2.55}>
        None of this is an argument against using these tools, a wrong or opaque prediction with no explanation attached is strictly worse than the same prediction with an honest, appropriately hedged story behind it. The discipline is just in reading that story for what it actually is, a description of one model's arithmetic on one input, useful, checkable, and worth a second look before it gets mistaken for a fact about the world the model was trained on. Thanks for reading.
      </Paragraph>
    </>
  ),
};
