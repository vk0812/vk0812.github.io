import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  Formula,
  InlineCode,
  List,
  ListItem,
  TokenBucketDiagram,
  WindowBoundaryDiagram,
} from "../components";

export const rateLimiting: BlogPostData = {
  title: "Rate Limiting",
  date: "July 2, 2026",
  slug: "rate-limiting",
  content: (
    <>
      <Paragraph delay={0.10}>
        Every public API you have ever used has a breaking point, and most of them will tell you exactly where it is with an HTTP <InlineCode>429</InlineCode>. Send too many requests too quickly and the server stops answering the way you expect. It answers with a number instead, one that means "I will happily serve you, just not this fast." That number is the whole point of rate limiting.
      </Paragraph>

      <Paragraph delay={0.15}>
        A rate limiter is the piece of the system responsible for enforcing that pace. It watches how often a client or a service calls an endpoint, and once that client crosses a threshold within some window of time, every extra call gets rejected until the window resets or enough room frees up.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Where the Limiter Actually Lives
      </Heading>

      <Paragraph delay={0.25}>
        The obvious place to enforce this is on the client, since the client is the one making the calls. It is also the worst place. A client might be a mobile app you do not fully control, a browser tab with dev tools open and someone poking at the network requests, or a script written specifically to ignore whatever throttling logic you shipped. Any check that lives entirely in code you cannot trust is a check an attacker can simply delete.
      </Paragraph>

      <Paragraph delay={0.30}>
        Server-side enforcement is the trustworthy version. The server counts its own incoming traffic, and nothing forged on the client changes that count. You do not have to bolt this logic onto every API server individually either. A common pattern is a rate limiting middleware sitting in front of the servers, so the throttling decision happens before a request ever touches application code.
      </Paragraph>

      <Paragraph delay={0.35}>
        Say an API is only supposed to handle 2 requests a second, and a client fires off 3 in that same second. The first two get routed straight through to the API servers like normal. The middleware catches the third, decides it is over budget, and sends back a 429 without the request ever reaching application code.
      </Paragraph>

      <Paragraph delay={0.40}>
        However you decide to host the limiter, the actual decision of whether to let a request through comes down to an algorithm. Five of them show up again and again, and each one trades accuracy against memory a little differently.
      </Paragraph>

      <Heading level={2} delay={0.45}>
        Token Bucket
      </Heading>

      <Paragraph delay={0.50}>
        Picture a bucket that holds a fixed number of tokens, refilled at a steady rate. Every request that comes in spends one token to get through. If a token is sitting there, it gets removed and the request proceeds. If the bucket is empty, the request gets dropped. Tokens that arrive once the bucket is already full just spill over and vanish, the bucket never holds more than its stated capacity.
      </Paragraph>

      <Paragraph delay={0.55}>
        Take a bucket sized for 10 tokens that refills at 2 tokens a second. If it starts full and 10 requests land in the same instant, every one of them goes through, since there are exactly 10 tokens sitting there waiting. Once that burst drains the bucket, the best a client can sustain is 2 requests a second, matched exactly to the refill rate. Push faster than that and the bucket runs dry, and the requests behind the burst start getting dropped.
      </Paragraph>

      <Paragraph delay={0.60}>
        How many buckets you need depends on what you are protecting. A user limited to 1 post a second, 150 new friends a day, and 5 likes a second needs 3 separate buckets, one per action. Throttling by IP address means a bucket per IP. And if the whole system just needs a hard ceiling, something like 10,000 requests a second across everyone, a single global bucket covers it.
      </Paragraph>

      <List delay={0.65}>
        <ListItem><strong>Pros.</strong> Simple to implement, memory efficient, and tolerant of short bursts since idle time lets the bucket refill.</ListItem>
        <ListItem><strong>Cons.</strong> Two parameters, bucket size and refill rate, and getting both right for your actual traffic pattern takes real tuning.</ListItem>
      </List>

      <Paragraph delay={0.70}>
        It is popular for a reason. Amazon and Stripe both throttle their public APIs with a token bucket.
      </Paragraph>

      <Heading level={2} delay={0.75}>
        Leaky Bucket
      </Heading>

      <Paragraph delay={0.80}>
        Leaky bucket looks similar but processes requests at a constant rate instead of a bursty one. Instead of tokens, it is a first in first out queue. An incoming request joins the back of the queue if there is room. If the queue is full, the request is dropped outright. Meanwhile requests get pulled off the front and processed at a fixed rate, regardless of how fast they arrived.
      </Paragraph>

      <Paragraph delay={0.85}>
        Set the queue size to 5 and the outflow rate to 1 request a second, then have a client fire 8 requests at once. The first 5 fill the queue completely. The other 3 arrive to a full queue and get rejected on the spot as overflow. From there, the server works through the queued 5 one at a time, once a second, no matter how impatient the client got.
      </Paragraph>

      <TokenBucketDiagram
        delay={0.05}
        caption="Token bucket drains a burst instantly and caps the sustained rate at the refill speed. Leaky bucket smooths the same burst into a fixed drip. Switch the tab to compare the two."
      />

      <List delay={0.90}>
        <ListItem><strong>Pros.</strong> Memory efficient thanks to the bounded queue, and the fixed outflow rate suits downstream systems that need steady, predictable load.</ListItem>
        <ListItem><strong>Cons.</strong> A traffic burst fills the queue with old requests, so even after the burst passes, fresh requests keep getting rejected until the backlog clears. Same tuning headache as token bucket, two parameters to get right.</ListItem>
      </List>

      <Paragraph delay={0.95}>
        Shopify runs its rate limiting this way.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        Fixed Window Counter
      </Heading>

      <Paragraph delay={1.05}>
        This one is the simplest idea in the list. Slice time into fixed size windows, say one minute each, and keep a counter per window. Every request increments the counter for whichever window it lands in. Once the counter hits the limit, every further request in that window gets dropped, and the counter resets clean the moment the next window starts.
      </Paragraph>

      <Paragraph delay={1.10}>
        The flaw shows up at the edges. Say the limit is 100 requests a minute. A client sends 95 requests right before the window closes, comfortably under the cap. The window resets, and the same client immediately sends 95 more, also under the cap for that new window. Look at what just happened from the server's point of view though. In the span of about 10 seconds straddling that boundary, it received 190 requests, almost double what the limit was supposed to allow.
      </Paragraph>

      <List delay={1.15}>
        <ListItem><strong>Pros.</strong> Cheap to store, trivial to reason about, and a clean reset aligned to round time boundaries fits some business rules well.</ListItem>
        <ListItem><strong>Cons.</strong> A burst straddling a window boundary can slip through at roughly twice the intended rate.</ListItem>
      </List>

      <Heading level={2} delay={1.20}>
        Sliding Window Log
      </Heading>

      <Paragraph delay={1.25}>
        Sliding window log exists specifically to close that boundary gap. Instead of a single counter, it keeps a log of the exact timestamp of every request, usually in something like a Redis sorted set. When a new request shows up, the algorithm first throws out every timestamp older than the start of the current window, then adds the new timestamp to the log. If the log is at or under the allowed count after that, the request goes through. If not, it gets rejected, though its timestamp stays in the log regardless.
      </Paragraph>

      <Paragraph delay={1.30}>
        Walk through it with a limit of 2 requests a minute, counting in seconds from some arbitrary start. A request lands at <InlineCode>t=1</InlineCode>. The log is empty, so it is allowed, and the log now holds <InlineCode>[1]</InlineCode>. Another lands at <InlineCode>t=30</InlineCode>. Nothing is old enough to purge yet, so the new timestamp brings the log to <InlineCode>[1, 30]</InlineCode>, size 2, right at the limit, so it is allowed. A third lands at <InlineCode>t=50</InlineCode>. Still nothing to purge, so the log becomes <InlineCode>[1, 30, 50]</InlineCode>, size 3, over the limit, so this one is rejected. Its timestamp stays in the log anyway, which is exactly why this algorithm is memory hungry, rejected requests do not disappear. A fourth request lands at <InlineCode>t=100</InlineCode>. The current window now only reaches back to <InlineCode>t=40</InlineCode>, so both <InlineCode>1</InlineCode> and <InlineCode>30</InlineCode> get purged as stale, leaving just <InlineCode>[50]</InlineCode>. Add the new timestamp and the log becomes <InlineCode>[50, 100]</InlineCode>, size 2, under the limit, allowed.
      </Paragraph>

      <List delay={1.35}>
        <ListItem><strong>Pros.</strong> Extremely accurate. No rolling window can ever see more requests than the limit allows.</ListItem>
        <ListItem><strong>Cons.</strong> Memory heavy, since a rejected request's timestamp lingers in the log for just as long as an accepted one.</ListItem>
      </List>

      <WindowBoundaryDiagram
        delay={0.05}
        caption="Same 100 per minute limit on both sides. Fixed window resets clean at the boundary and lets a straddling burst nearly double the limit. Sliding window log never loses track of the true rolling count."
      />

      <Heading level={2} delay={1.40}>
        Sliding Window Counter
      </Heading>

      <Paragraph delay={1.45}>
        Sliding window counter tries to get most of the accuracy of the log without paying its memory cost. It blends the fixed window idea with the sliding log idea. Instead of storing every timestamp, it keeps just two numbers, a counter for the previous window and a counter for the current one, and estimates how many requests fall inside the true rolling window with a weighted average.
      </Paragraph>

      <Formula block delay={1.50}>
        {`\\text{Estimated count} = C + P \\times \\frac{W - t}{W}`}
      </Formula>

      <Paragraph delay={1.55}>
        <InlineCode>C</InlineCode> is how many requests have landed in the current window so far. <InlineCode>P</InlineCode> is how many landed in the previous window. <InlineCode>t</InlineCode> is how far into the current window the clock has gotten, and <InlineCode>W</InlineCode> is the width of the window, both in seconds. That fraction is the overlap. It assumes requests in the previous window were spread out evenly, and asks what share of that previous window still counts as part of the last <InlineCode>W</InlineCode> seconds looking back from right now.
      </Paragraph>

      <Paragraph delay={1.60}>
        Plug in real numbers. The limit is 100 requests a minute, the previous 60 second window saw 80 requests, and the current window already has 40 requests with 20 seconds gone by. The estimate comes out to <InlineCode>40 + 80 × (60 - 20) / 60</InlineCode>, which is <InlineCode>40 + 80 × 0.67</InlineCode>, landing at roughly 93.6. That is under the limit of 100, so the request goes through, though the window is close to full. One more request and the estimate would cross the line.
      </Paragraph>

      <List delay={1.65}>
        <ListItem><strong>Pros.</strong> Smooths out spikes since it works off an average rather than a hard reset, and it only needs two numbers instead of a full log.</ListItem>
        <ListItem><strong>Cons.</strong> It is an approximation, not an exact count, since it assumes requests in the previous window were spread evenly rather than clustered.</ListItem>
      </List>

      <Paragraph delay={1.70}>
        Cloudflare measured this drift across 400 million real requests and found only about 0.003 percent were wrongly allowed or wrongly limited. In practice, the approximation holds up fine.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Takeaways
      </Heading>

      <List delay={1.80}>
        <ListItem>A rate limiter caps how many requests a client can make in a window of time, and anything over that limit gets an HTTP 429 instead of a normal response.</ListItem>
        <ListItem>Never trust the client to enforce its own limit. Server-side or gateway-side enforcement is the only version that actually holds up.</ListItem>
        <ListItem>Token bucket and leaky bucket both use two tunable parameters but handle bursts differently. Token bucket lets a burst through immediately, leaky bucket smooths it into a fixed drip.</ListItem>
        <ListItem>Fixed window counter is cheap but leaky at the edges. Sliding window log fixes that at the cost of memory, and sliding window counter splits the difference with an approximation accurate enough for almost everyone.</ListItem>
        <ListItem>There is no universally correct algorithm here. The right choice depends on how strict the limit needs to be and how much memory you are willing to spend enforcing it.</ListItem>
      </List>

      <Paragraph delay={1.85}>
        Rate limiting looks like a small feature bolted onto an API, but it is really a decision about how much trust you extend to traffic you cannot control. Pick an algorithm that matches how bursty your real traffic is, put it somewhere the client cannot bypass, and the rest of your system gets to assume the load in front of it is roughly what it asked for. Thanks for reading.
      </Paragraph>
    </>
  ),
};
