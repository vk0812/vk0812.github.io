import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  CodeBlock,
  InlineCode,
  List,
  ListItem,
  PredictionsTable,
  ReliabilityDiagram,
} from "../components";

export const regressionRankingRetrievalForecastingMetrics: BlogPostData = {
  title: "Regression, Ranking, Retrieval, and Forecasting Metrics",
  date: "August 1, 2026",
  slug: "regression-ranking-retrieval-forecasting-metrics",
  content: (
    <>
      <Paragraph delay={0.10}>
        A model review deck usually ends with a slide of numbers. MAE 812, R-squared 0.89, NDCG 0.91, MAPE 14 percent, all sitting next to each other as if any one of them settles whether the model is good. They don't measure the same thing, and they don't fail the same way. A demand forecast with a low MAPE can still be quietly wrecking inventory decisions on the one product that barely sells. A recommender with a strong R-squared on click probability can still be putting the wrong items at the top of the page. The number on the slide is only useful if it was the right number to compute in the first place.
      </Paragraph>

      <Paragraph delay={0.15}>
        That choice is the actual subject here, not the formulas themselves. Regression, ranking, retrieval, and forecasting all reduce to "how far off was the model," but each one asks that question differently. The real job is picking the metric that matches how the prediction actually gets used, not the one that's easiest to compute or most familiar from a stats class.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        MAE, MSE, and RMSE, three ways to size an error
      </Heading>

      <Paragraph delay={0.25}>
        Start with the plainest case, a model predicts a number and there's a true number to compare it to. <strong>Mean Absolute Error</strong> averages the raw size of the miss, no sign, no exaggeration.
      </Paragraph>

      <Formula block delay={0.30}>
        {`\\text{MAE} = \\frac{1}{n}\\sum_{i=1}^{n} |y_i - \\hat y_i|`}
      </Formula>

      <Paragraph delay={0.35}>
        <strong>Mean Squared Error</strong> squares each error before averaging, which does two things at once. It makes every error positive without needing an absolute value, and it makes big misses count far more than small ones. A miss twice as large contributes four times the penalty. <strong>Root Mean Squared Error</strong> just takes the square root of that average back down, so the number lands in the same units as the original target again instead of squared units.
      </Paragraph>

      <Formula block delay={0.40}>
        {`\\text{MSE} = \\frac{1}{n}\\sum_{i=1}^{n} (y_i - \\hat y_i)^2, \\qquad \\text{RMSE} = \\sqrt{\\text{MSE}}`}
      </Formula>

      <Paragraph delay={0.45}>
        The gap between MAE and RMSE is the whole point of computing both. MAE treats every unit of error the same regardless of where it happened. RMSE penalizes a model that's consistently close but occasionally wildly wrong more harshly than a model that's uniformly a little bit off, even if both average out to the same MAE. A shipping-time model that's usually off by an hour, but once every hundred predictions off by two full days, will look far worse under RMSE than under MAE. Which of those two numbers actually matters depends on whether a rare two-day miss is a minor annoyance or the reason a customer never orders again.
      </Paragraph>

      <Paragraph delay={0.50}>
        Five predictions make the arithmetic concrete. Take actual values <Formula>{`y = (3.0, -0.5, 2.0, 7.0, 4.2)`}</Formula> and predictions <Formula>{`\\hat y = (2.5, 0.0, 2.1, 7.8, 5.0)`}</Formula>.
      </Paragraph>

      <PredictionsTable
        delay={0.06}
        extraHeader="Squared error"
        rows={[
          { label: "Point 1", actual: 3.0, predicted: 2.5, extra: "0.250" },
          { label: "Point 2", actual: -0.5, predicted: 0.0, extra: "0.250" },
          { label: "Point 3", actual: 2.0, predicted: 2.1, extra: "0.010" },
          { label: "Point 4", actual: 7.0, predicted: 7.8, extra: "0.640" },
          { label: "Point 5", actual: 4.2, predicted: 5.0, extra: "0.640" },
        ]}
        stats={[
          { label: "MAE", value: "0.540" },
          { label: "MSE", value: "0.358" },
          { label: "RMSE", value: "0.598" },
          { label: "R²", value: "0.941" },
        ]}
        caption="Five actual-vs-predicted points, each row's squared error, and the resulting MAE, MSE, RMSE, and R-squared for the set."
      />

      <Paragraph delay={0.60}>
        The residuals are <Formula>{`0.5, -0.5, -0.1, -0.8, -0.8`}</Formula>, so MAE averages their absolute values to <Formula>{`0.540`}</Formula>. Squaring first gives <Formula>{`0.25, 0.25, 0.01, 0.64, 0.64`}</Formula>, averaging to an MSE of <Formula>{`0.358`}</Formula>, and its square root is the RMSE of <Formula>{`0.598`}</Formula>. RMSE sits a little above MAE here because two of the five residuals, points 4 and 5, are the largest in the set and squaring stretches their contribution. NumPy confirms all three, along with R-squared, covered next.
      </Paragraph>

      <CodeBlock
        delay={0.65}
        language="Python"
        code={`import numpy as np

y = np.array([3.0, -0.5, 2.0, 7.0, 4.2])
y_hat = np.array([2.5, 0.0, 2.1, 7.8, 5.0])

resid = y - y_hat
mae = np.mean(np.abs(resid))
mse = np.mean(resid ** 2)
rmse = np.sqrt(mse)

ss_res = np.sum(resid ** 2)
ss_tot = np.sum((y - y.mean()) ** 2)
r2 = 1 - ss_res / ss_tot

print(mae, mse, rmse, r2)
# 0.54 0.358 0.598 0.941`}
      />

      <Heading level={2} delay={0.70}>
        R-squared, and where it stops telling the truth
      </Heading>

      <Paragraph delay={0.75}>
        <Formula>{`R^2`}</Formula> reframes the same residuals as a share of variance explained, the sum of squared residuals divided by the total variance in the actual values, subtracted from one.
      </Paragraph>

      <Formula block delay={0.80}>
        {`R^2 = 1 - \\frac{\\sum_i (y_i - \\hat y_i)^2}{\\sum_i (y_i - \\bar y)^2}`}
      </Formula>

      <Paragraph delay={0.85}>
        For the five points above that ratio comes out to <Formula>{`0.941`}</Formula>, the model explains 94 percent of the spread in the actual values. It's a genuinely useful single number for "does this model track the data at all," and it has three limits that get ignored constantly. It never decreases when a new feature gets added, regardless of whether that feature means anything. That means comparing models with different feature counts on raw R-squared rewards padding the input list. It also says nothing about the actual size of the error in the target's own units. A model can post a high R-squared purely because the target barely varies to begin with, not because the predictions are especially accurate. And it's computed on whatever data it was handed. A strong R-squared on training data is not a claim about how the model performs once it sees something new.
      </Paragraph>

      <Heading level={2} delay={0.90}>
        Quantile loss, when the mean isn't the point
      </Heading>

      <Paragraph delay={0.95}>
        MAE, MSE, and RMSE all implicitly aim a model at the conditional mean, and they treat an over-prediction and an under-prediction of the same size as equally bad. That's the wrong target the moment the cost of being wrong isn't symmetric. A retailer forecasting demand for a product loses a sale for every unit it under-orders, but only pays a small holding cost for every unit it over-orders, so a forecast tuned to minimize squared error is optimizing for the wrong number entirely. <strong>Quantile loss</strong> (also called pinball loss) fixes this by training the model to predict a specific percentile of the outcome instead of its mean, and by penalizing the two directions of error differently.
      </Paragraph>

      <Formula block delay={1.00}>
        {`\\mathcal{L}_\\tau(y, \\hat y) = \\max\\big(\\tau (y - \\hat y),\\; (\\tau - 1)(y - \\hat y)\\big)`}
      </Formula>

      <Paragraph delay={1.05}>
        <Formula>{`\\tau`}</Formula> is the target quantile, between 0 and 1. At <Formula>{`\\tau = 0.5`}</Formula> the two branches collapse into ordinary absolute error and the loss is symmetric. At <Formula>{`\\tau = 0.9`}</Formula>, aiming for the 90th percentile, under-predicting costs nine times as much as over-predicting by the same amount. For a true value of 10, predicting 8 (under by 2) costs <Formula>{`0.9 \\times 2 = 1.8`}</Formula>, while predicting 12 (over by 2) costs only <Formula>{`0.1 \\times 2 = 0.2`}</Formula>. That asymmetry is exactly the shape a stock-out-averse retailer wants, a forecast trained at a high quantile deliberately over-orders more often than it under-orders, because the two mistakes really don't cost the same in the real world.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        MAPE, and the two ways it lies
      </Heading>

      <Paragraph delay={1.15}>
        <strong>Mean Absolute Percentage Error</strong> reports error as a share of the actual value instead of raw units, which is genuinely convenient, a MAPE of 14 percent means the same thing whether the target is measured in dollars or units or milliseconds. That convenience hides two real traps.
      </Paragraph>

      <Formula block delay={1.20}>
        {`\\text{MAPE} = \\frac{100}{n}\\sum_{i=1}^{n} \\frac{|y_i - \\hat y_i|}{|y_i|}`}
      </Formula>

      <Paragraph delay={1.25}>
        The actual value sits in the denominator, and the moment one actual value lands near zero, that single point's percentage error explodes and drags the whole average with it. Reuse the same five points from the earlier worked example, where the second point's actual value is <Formula>{`-0.5`}</Formula>, close enough to zero to cause exactly this.
      </Paragraph>

      <PredictionsTable
        delay={0.08}
        extraHeader="Abs. pct. error"
        rows={[
          { label: "Point 1", actual: 3.0, predicted: 2.5, extra: "16.7%" },
          { label: "Point 2", actual: -0.5, predicted: 0.0, extra: "100.0%", note: "near-zero actual" },
          { label: "Point 3", actual: 2.0, predicted: 2.1, extra: "5.0%" },
          { label: "Point 4", actual: 7.0, predicted: 7.8, extra: "11.4%" },
          { label: "Point 5", actual: 4.2, predicted: 5.0, extra: "19.0%" },
        ]}
        stats={[
          { label: "MAPE (all 5 points)", value: "30.4%" },
          { label: "MAPE (excl. point 2)", value: "13.0%" },
        ]}
        caption="The same five points as the MAE and RMSE example. Point 2's actual value of -0.5 is close enough to zero that its percentage error alone more than doubles the overall MAPE."
      />

      <Paragraph delay={1.35}>
        A residual of only 0.5 on a near-zero actual value produces a 100 percent error on that single point. Averaged across five points, that one point alone pulls the overall MAPE from 13.0 percent up to 30.4 percent. Nothing else in the dataset changed. One point with a small denominator did all of the damage. Any target that legitimately crosses or hovers near zero, temperature change, account balance, day-over-day growth rate, makes MAPE unreliable for exactly this reason. It's worth checking the distribution of actual values before ever reporting it.
      </Paragraph>

      <Paragraph delay={1.40}>
        The second trap is asymmetry, and it's less obvious because it doesn't require a near-zero denominator at all. For any actual value that can't go negative (revenue, quantity sold, wait time), a prediction of zero produces at most a 100 percent error, since the numerator can never exceed the actual value itself. But a wildly over-shooting prediction faces no such ceiling, forecasting 1,000 against an actual of 100 produces a 900 percent error. The metric can never punish under-forecasting past 100 percent, no matter how wrong the model gets. Over-forecasting has no upper bound at all. That quietly biases a model optimized to minimize MAPE toward under-predicting rather than over-predicting, regardless of which direction is actually worse for the business.
      </Paragraph>

      <CodeBlock
        delay={1.45}
        language="Python"
        code={`import numpy as np

y = np.array([3.0, -0.5, 2.0, 7.0, 4.2])
y_hat = np.array([2.5, 0.0, 2.1, 7.8, 5.0])

ape = np.abs(y - y_hat) / np.abs(y)
print(ape * 100)          # per-point pct error, point 2 is 100.0
print(ape.mean() * 100)   # 30.43, all five points
print(np.delete(ape, 1).mean() * 100)  # 13.04, point 2 excluded

# the asymmetry, bounded below the true value, unbounded above it
actual = 100.0
print(abs(actual - 0.0) / actual * 100)     # 100.0, prediction of zero
print(abs(actual - 1000.0) / actual * 100)  # 900.0, prediction of 1000`}
      />

      <Heading level={2} delay={1.50}>
        Ranking metrics, when order matters more than magnitude
      </Heading>

      <Paragraph delay={1.55}>
        A search engine or a feed isn't asked whether any single item's score was numerically accurate. It's asked whether the right items landed near the top of the list. That's a genuinely different question from everything above, and it needs a genuinely different metric family. <strong>Normalized Discounted Cumulative Gain</strong> sums each result's relevance, discounted by how far down the list it sits, a relevant result at rank one counts almost fully, the same result at rank fifty barely counts at all. It then divides that sum by the best possible score for the same set of results, so it stays comparable across queries with different numbers of relevant items available.
      </Paragraph>

      <Paragraph delay={1.57}>
        <strong>Mean Average Precision</strong> instead averages precision at every rank where a relevant result actually shows up, rewarding a list that surfaces several relevant results early rather than just one. <strong>Mean Reciprocal Rank</strong> is the narrowest of the three. It only cares how far down the list the first relevant result sits. That makes it the right metric when a user genuinely only needs one good answer, a spelling suggestion or a single factual lookup, and the wrong one the moment a list is supposed to surface several good results at once. The full mechanics of discounting and normalizing a ranked list are worth a derivation of their own. The point to take here is narrower, once a task is judged on order rather than on individual accuracy, none of MAE, RMSE, or R-squared has any way to notice a ranking mistake at all.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        Recall@K, when the answer just needs to be in the list somewhere
      </Heading>

      <Paragraph delay={1.65}>
        Retrieval systems, the step that narrows a huge catalog down to a shortlist before anything gets ranked or scored, get judged by a simpler question still. Not where in the shortlist the right items landed, just whether they made it in at all. <strong>Recall@K</strong> asks exactly that, of everything genuinely relevant to a query, what fraction showed up somewhere in the top K retrieved.
      </Paragraph>

      <Formula block delay={1.70}>
        {`\\text{Recall@K} = \\frac{|\\{\\text{relevant items}\\} \\cap \\{\\text{top-}K\\text{ retrieved}\\}|}{|\\{\\text{relevant items}\\}|}`}
      </Formula>

      <Paragraph delay={1.75}>
        Twenty documents in a corpus are genuinely relevant to a query, and the first-stage retriever's top ten results contain six of them. Recall@10 is <Formula>{`6/20 = 0.3`}</Formula>. It doesn't matter whether those six landed at ranks one through six or were scattered across the full ten, order plays no role at all. That's the deliberate difference from NDCG. A retrieval stage is usually followed by a separate ranking stage that will sort whatever made the shortlist, so its own job is just to not leave a relevant item out of the shortlist entirely. A retriever tuned to maximize precision instead of recall can look excellent while quietly discarding items the downstream ranker never gets a chance to consider. That's why recall, not precision, is usually the metric that matters most at this stage of the pipeline.
      </Paragraph>

      <Heading level={2} delay={1.80}>
        Calibration, when the forecast is a probability
      </Heading>

      <Paragraph delay={1.85}>
        A different failure mode shows up once a model's output is a probability rather than a point estimate, a 70 percent chance of rain, a 70 percent predicted likelihood of churn, a quantile interval meant to contain the true value 90 percent of the time. None of MAE, RMSE, or NDCG check whether those stated probabilities are honest. <strong>Calibration</strong> does. It asks a narrower question: of everything the model called "70 percent likely," did roughly 70 percent of those events actually happen? A model whose "70 percent" events happen 90 percent of the time is systematically underconfident. One whose "70 percent" events happen only 40 percent of the time is systematically overconfident. And a model can be well calibrated overall while still ranking and discriminating between cases poorly, or vice versa, calibration and discriminative accuracy are genuinely separate properties.
      </Paragraph>

      <ReliabilityDiagram
        delay={0.06}
        caption="A reliability curve, predicted probability on one axis, the actual observed frequency of that outcome on the other. The diagonal is perfect calibration, the curve sitting below it means the model's confident predictions happen less often than claimed."
      />

      <Paragraph delay={1.90}>
        Checking this in practice means bucketing predictions by their stated probability (everything the model called "60 to 70 percent," everything it called "70 to 80 percent," and so on) and comparing each bucket's average prediction to how often the event actually happened inside it, exactly what a reliability curve plots. For a quantile forecast the same idea shows up as coverage, of every actual value, whether the stated 90 percent interval genuinely contained the true value roughly 90 percent of the time, not 60 percent or 99 percent. A demand forecast that quietly overstates its own confidence is a much more dangerous failure than one that's merely a little imprecise, because every downstream decision that trusts the stated probability is calibrated against a number that was never honest in the first place.
      </Paragraph>

      <Heading level={2} delay={1.95}>
        Choosing the metric for the decision it feeds
      </Heading>

      <Paragraph delay={2.00}>
        Every metric above answers a slightly different question. The throughline is that the right one is whichever question actually matches how the prediction gets used, not whichever is fastest to compute or most familiar from a stats course. A demand forecast that feeds an ordering decision with asymmetric stock-out and holding costs wants quantile loss at the quantile those costs actually imply, not a mean-seeking RMSE. A search or feed ranking wants NDCG or MRR depending on whether users need one good answer or several, never plain accuracy on individual scores. A retrieval stage feeding a downstream ranker wants recall, because a relevant item left out of the shortlist can never be recovered by however good the ranker is. A probability that feeds a threshold or a bet-sizing decision needs to be checked for calibration specifically, a model can be excellent at ordering cases correctly and still be lying about its own confidence. Reaching for R-squared or MAPE because they're the numbers everyone already recognizes is how a model report ends up green across the board while the one failure that actually costs the business money sits in a column nobody thought to compute.
      </Paragraph>

      <Heading level={2} delay={2.05}>
        Takeaways
      </Heading>

      <List delay={2.10}>
        <ListItem>MAE and RMSE both size an error but disagree on how much a rare, large miss should count, RMSE penalizes it far more heavily, and that gap alone can decide which model looks better.</ListItem>
        <ListItem>R-squared is a useful one-number summary of variance explained and nothing more, it never decreases as features get added and it says nothing about the error's actual size or how the model performs on new data.</ListItem>
        <ListItem>Quantile loss exists for exactly the case where under-predicting and over-predicting cost genuinely different amounts, a symmetric loss like MSE optimizes for the wrong target the moment that asymmetry is real.</ListItem>
        <ListItem>MAPE breaks in two specific ways, a near-zero actual value in the denominator can blow up the average on its own, and the metric structurally caps under-forecasting at 100 percent while leaving over-forecasting unbounded.</ListItem>
        <ListItem>Ranking metrics (NDCG, MAP, MRR) judge relative order within a list, retrieval metrics (Recall@K) judge whether relevant items made a shortlist at all, and calibration judges whether a stated probability is honest, three questions none of the regression metrics above can answer.</ListItem>
      </List>

      <Paragraph delay={2.15}>
        None of this is really about formulas, it's about resisting the pull toward whichever metric is easiest to report on a slide. The actual work is tracing a prediction forward to the decision it feeds, an order quantity, a ranked position, a shortlist, a threshold, and picking the number that would actually catch the failure that matters there. Thanks for reading.
      </Paragraph>
    </>
  ),
};
