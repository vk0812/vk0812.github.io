# System design case study roadmap

This roadmap is intentionally finite. The site already covers the common product systems well, so the remaining posts should introduce genuinely new design problems instead of producing slightly different versions of Instagram, Dropbox, Messenger, YouTube, Yelp, Uber, or Ticketmaster.

## Existing case studies and the ground they already cover

1. **Designing a URL Shortener**
   - Short-key generation, collision handling, read-heavy storage, caching, partitioning, expiration, and analytics.
2. **Designing a Pastebin**
   - Metadata and blob separation, large text storage, expiration, private content, and content delivery.
3. **Designing Instagram**
   - Photo uploads, unique IDs, metadata sharding, news-feed generation, thumbnails, blob storage, and CDN delivery.
4. **Designing Dropbox**
   - Chunked and resumable uploads, deduplication, metadata synchronization, version history, and file sharing.
5. **Designing Facebook Messenger**
   - WebSockets, message ordering, delivery states, group fan-out, presence, offline notifications, and encryption.
6. **Designing YouTube**
   - Direct uploads, encoding pipelines, adaptive streaming, feed generation, search, deduplication, and CDN delivery.
7. **Designing Typeahead Suggestions**
   - Tries, precomputed top-K results, ranking, freshness, prefix partitioning, caching, and personalization.
8. **Designing Yelp**
   - Geospatial search, fixed grids, QuadTrees, scatter-gather queries, regional partitioning, and ranking.
9. **Designing Uber**
   - Live location updates, geospatial indexing, driver matching, distributed coordination, and ride state.
10. **Designing Ticketmaster**
    - Traffic spikes, waiting rooms, temporary inventory holds, concurrency control, payment recovery, and show-based partitioning.

The standalone System Design posts already cover caching, load balancing, partitioning, replication, content delivery networks, CAP, quorum, consistent hashing, Bloom filters, WebSockets, rate limiting, and message queues. New case studies should apply these concepts without re-explaining them as if they were new.

## Recommended finish line

Write the following eight posts, in this order, and then move on from the general system design case-study series.

---

## 1. Designing Google Docs

**Suggested slug:** `designing-google-docs`

**Why it earns a post**

This is the largest missing product-design pattern. None of the existing case studies tackles multiple users concurrently mutating the same logical object and converging on one result. It introduces collaborative editing, optimistic local state, operation logs, and conflict resolution.

### Main scope

- Create, open, edit, share, and restore a document.
- Multiple users edit a document concurrently.
- Changes and cursor positions appear in near real time.
- Edits survive disconnects and server failures.
- Keep rich document structure mostly out of scope. Start with text and briefly explain how formatting complicates operations.

### Sections and ideas to cover

1. Requirements and latency expectations.
2. Capacity estimates for active documents, edits per second, WebSocket connections, operation-log growth, and snapshots.
3. Document metadata, canonical document state, collaborators, operation records, and snapshot schema.
4. Opening a document through a snapshot plus operations newer than the snapshot.
5. The optimistic client path. Apply a keystroke locally first, then send the operation to the collaboration service.
6. Routing every editor of one document to the same logical document session.
7. Operational Transformation versus Conflict-free Replicated Data Types.
8. A server sequencer that assigns operation versions and broadcasts a canonical order.
9. Concurrent insertion and deletion examples showing why raw character indexes are insufficient.
10. Presence and cursor updates as ephemeral data that should not enter the durable edit log.
11. Offline editing, reconnecting, rebasing pending operations, and recovering missed updates.
12. Append-only operation logs, periodic snapshots, compaction, and version history.
13. Sharding collaboration servers by document ID.
14. Hot documents with many simultaneous editors, slow consumers, and fan-out pressure.
15. Permissions, share links, and revocation checks on both initial connection and subsequent writes.
16. Failure recovery when a collaboration server dies halfway through a session.
17. Final architecture and takeaways.

### Visual opportunities

- Two users insert text at the same position, followed by transformation into a convergent result.
- Snapshot plus operation-log reconstruction.
- Client, WebSocket gateway, document session, operation log, snapshot store, and presence service.

### Main references

- [Hello Interview, Design Google Docs](https://www.hellointerview.com/learn/system-design/problem-breakdowns/google-docs) for requirements, WebSocket scaling, and storage deep dives.
- [Design Gurus, Real-Time Collaborative Document Editor](https://www.designgurus.io/blog/design-real-time-editor) for Operational Transformation versus Conflict-free Replicated Data Types and document sharding.
- [How Figma's Multiplayer Technology Works](https://madebyevan.com/figma/how-figmas-multiplayer-technology-works/) for a production comparison using server-authoritative, property-level last-writer-wins behavior, fractional indexing, offline edits, and tree conflicts.

### Avoid repeating

Do not turn this into another Messenger post. WebSockets are only the transport. The central story is concurrent mutation and convergence.

---

## 2. Designing a Web Crawler

**Suggested slug:** `designing-web-crawler`

**Why it earns a post**

This adds a pipeline that primarily interacts with unreliable external systems. Its defining problems are politeness, crawl scheduling, duplicate detection, fault-tolerant staged processing, and balancing freshness against coverage.

### Main scope

- Start from seed URLs.
- Fetch public pages while respecting `robots.txt` and per-domain limits.
- Extract text and links.
- Persist raw pages and metadata.
- Continually revisit important pages without repeatedly crawling unchanged content.

### Sections and ideas to cover

1. Requirements and defining what counts as a successful crawl.
2. Capacity estimates for pages, bandwidth, storage, domains, and target recrawl time.
3. The fetch, store, parse, extract, deduplicate, and enqueue pipeline.
4. Why queue messages should contain references instead of full HTML payloads.
5. The URL frontier with separate priority and politeness concerns.
6. Front queues for importance or freshness and host-specific back queues for politeness.
7. Partitioning the frontier by hostname so one owner controls a domain's crawl rate.
8. `robots.txt`, crawl delays, per-host rate limiting, jitter, and legal boundaries.
9. DNS caching and why DNS becomes a bottleneck at crawler scale.
10. URL normalization, canonical URLs, redirect handling, and URL-level deduplication.
11. Content hashing for different URLs serving identical pages.
12. Bloom filters versus an indexed metadata store, including false-positive trade-offs.
13. Retries, exponential backoff, visibility timeouts, poison pages, and dead-letter queues.
14. Crawler traps, infinite calendars, maximum depth, and per-domain crawl budgets.
15. JavaScript-rendered pages and a limited pool of expensive headless-browser workers.
16. Freshness scheduling based on page importance and observed change frequency.
17. Monitoring queue lag, fetch success, parser throughput, and domain-level errors.
18. Final architecture and takeaways.

### Visual opportunities

- Priority front queues feeding host-specific politeness queues.
- A failed fetch retrying independently from the parsing stage.
- Complete crawl pipeline with raw blob storage and metadata.

### Main references

- [Hello Interview, Design a Web Crawler](https://www.hellointerview.com/learn/system-design/problem-breakdowns/web-crawler) for the staged pipeline, retries, politeness, DNS, and scaling discussion.
- [System Design Primer, Web Crawler](https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/web_crawler/README.md) for the classic crawler and reverse-index service design.
- [Google Research, Mercator](https://research.google/pubs/mercator-a-scalable-extensible-web-crawler/) for the foundational scalable and extensible crawler architecture.
- [Stanford IR Book, The URL Frontier](https://nlp.stanford.edu/IR-book/html/htmledition/the-url-frontier-1.html) for priority queues, host queues, politeness, and recrawl ordering.

### Avoid repeating

Do not expand this into a complete Google Search design. Index construction and ranking can be a short downstream section, while the crawler remains the main subject.

---

## 3. Designing a Payment System like Stripe

**Suggested slug:** `designing-payment-system`

**Why it earns a post**

Ticketmaster contains payment recovery, but payments deserve a dedicated correctness-first case study. This post should explain ambiguous network failures, idempotency, asynchronous processor responses, immutable financial records, and reconciliation.

### Main scope

- A merchant creates a payment.
- A customer authorizes a card payment through an external payment service provider.
- The merchant observes pending, succeeded, or failed status.
- The design prevents duplicate charges and preserves an audit trail.
- Refunds and payouts can be extensions rather than primary requirements.

### Sections and ideas to cover

1. Requirements, trust boundaries, and why correctness outranks low latency.
2. Capacity estimates for payment attempts, status reads, webhook events, and ledger growth.
3. Payment, payment attempt, idempotency record, ledger entry, and webhook-delivery schemas.
4. A Payment Intent style state machine with created, requires action, processing, succeeded, failed, and cancelled states.
5. Card tokenization and keeping raw card data outside the application boundary.
6. The synchronous initiation path and the asynchronous completion path.
7. Ambiguous failures where the provider may have charged the card but the response was lost.
8. Client-generated idempotency keys, request fingerprints, stored responses, and safe retries.
9. Why exactly-once delivery is unrealistic and how idempotent effects create exactly-once business behavior.
10. Authorization versus capture and why some payments remain pending.
11. Signed webhooks, duplicate delivery, out-of-order delivery, fast acknowledgement, and background processing.
12. An append-only double-entry ledger rather than a mutable balance column.
13. Transactional outbox or change-data-capture for publishing events after a database commit.
14. Reconciliation against payment service provider settlement files.
15. Refunds, reversals, disputes, and compensating entries.
16. Per-merchant limits, fraud checks, and degraded operation when the provider is unavailable.
17. Regional failover without allowing two regions to execute the same payment.
18. Final architecture and takeaways.

### Visual opportunities

- Payment Intent state machine.
- A request timing out after the provider charged the card, followed by a safe idempotent retry.
- Double-entry ledger postings and settlement reconciliation.

### Main references

- [Hello Interview, Design a Payment System](https://www.hellointerview.com/learn/system-design/problem-breakdowns/payment-system) for the interview-level architecture and deep dives.
- [ByteByteGo, Payment System](https://blog.bytebytego.com/p/payment-system) for payment service, executor, wallet, ledger, and settlement flow.
- [Stripe, Designing Robust APIs with Idempotency](https://stripe.com/blog/idempotency) for retry safety after ambiguous failures.
- [Stripe, Payment Intents](https://edge.stripe.com/docs/api/payment_intents?lang=python) for a persistent payment lifecycle with at most one successful charge.
- [Stripe, Webhooks](https://stripe.com/docs/webhooks) for signature verification, retries, duplicate events, and quick acknowledgement.

### Avoid repeating

Use Ticketmaster only as motivation. Do not repeat seat holds, waiting rooms, or show partitioning. The new material is the financial state machine, ledger, idempotency boundary, webhooks, and reconciliation.

---

## 4. Designing an Ad Click Aggregator

**Suggested slug:** `designing-ad-click-aggregator`

**Why it earns a post**

This is the missing high-throughput stream-processing case study. It introduces event time, watermarks, windowed aggregation, hot keys, online analytical processing storage, replay, and batch reconciliation.

### Main scope

- Record an ad click and redirect the user quickly.
- Let advertisers query minute-level metrics with low latency.
- Do not lose clicks or count retries twice.
- Preserve raw events so derived aggregates can be rebuilt.
- Keep ad selection and recommendation out of scope.

### Sections and ideas to cover

1. Requirements and why click data affects billing.
2. Capacity estimates for peak clicks, daily raw events, stream bandwidth, retention, and aggregate rows.
3. Server-side redirect versus client-side tracking.
4. Signed impression IDs as the basis for validation and deduplication.
5. Kafka or Kinesis as the durable ingestion buffer.
6. Partitioning by ad ID and the hot-ad problem.
7. Salted keys for hot ads, followed by a second aggregation stage.
8. Flink-style stateful stream processing.
9. Processing time versus event time.
10. Tumbling windows, watermarks, and a policy for late events.
11. Checkpoints, replayable sources, and idempotent or transactional sinks.
12. Why “exactly once” must cover source, processor state, and sink to be meaningful.
13. Pre-aggregated minute rows in ClickHouse, Pinot, Druid, or another online analytical processing store.
14. Rollups for hourly and daily queries.
15. Raw immutable events in object storage.
16. A slower batch job that recomputes truth and reconciles real-time aggregates.
17. Stream lag, backpressure, schema evolution, and failed-event handling.
18. Final architecture and takeaways.

### Visual opportunities

- One late click entering the correct event-time window.
- A hot ad split across salted partitions and merged later.
- Fast stream path beside the slower reconciliation path.

### Main references

- [Hello Interview, Design an Ad Click Aggregator](https://www.hellointerview.com/learn/system-design/problem-breakdowns/ad-click-aggregator) for ingestion, Flink aggregation, hot shards, idempotency, and reconciliation.
- [Engineering Handbook, Ad Click Aggregation](https://github.com/handbook-academy/engineering-handbook/blob/main/content/hld/part-8-case-studies/23-ad-click-aggregation.md) for end-to-end exactly-once reasoning, checkpoint barriers, transactional sinks, and batch auditing.
- [Stripe, Usage-Based Billing](https://stripe.com/blog/how-we-built-it-usage-based-billing) for a real production example of fast and slow aggregation paths, delayed events, and reconciliation.

### Avoid repeating

Do not make this another message-queue explainer. The focus is stateful processing over time, correctness across replay, and serving analytical queries.

---

## 5. Designing a Metrics Monitoring Platform like Datadog

**Suggested slug:** `designing-metrics-monitoring`

**Why it earns a post**

This adds time-series storage and operational alerting, neither of which is covered by the current product case studies. The defining challenge is extremely high write volume combined with label cardinality, long-range queries, and reliable alert evaluation.

### Main scope

- Services emit counters, gauges, and histograms.
- Engineers query dashboards over time ranges.
- Users define alert rules and receive actionable notifications.
- Logs and distributed traces remain out of scope.

### Sections and ideas to cover

1. Requirements and the metric data model.
2. Capacity estimates for hosts, samples per interval, bytes per sample, active time series, and retention.
3. Push versus pull collection and when each model fits.
4. Local agents for buffering, batching, compression, and temporary network failure.
5. An ingestion gateway followed by a durable stream.
6. Series identity as metric name plus the complete label set.
7. Time-series database writes, write-ahead logs, immutable blocks, and compaction.
8. Partitioning by series ID and time bucket.
9. An inverted label index for finding relevant series.
10. The cardinality explosion caused by labels such as user ID, request ID, and raw URL.
11. Admission controls, per-tenant quotas, label limits, and dropping unsafe dimensions.
12. Hot, warm, and cold retention tiers.
13. Downsampling old data and precomputing expensive dashboard expressions.
14. Query fan-out across time and series partitions.
15. Alert-rule evaluation over rolling windows.
16. Pending and firing states to avoid reacting to one noisy sample.
17. Deduplicating, grouping, silencing, inhibiting, and routing alerts.
18. High availability for ingestion and alert evaluation during a monitoring incident.
19. Final architecture and takeaways.

### Visual opportunities

- One additional unbounded label multiplying a manageable metric into millions of series.
- Raw samples compacted into time blocks and later downsampled.
- Metrics ingestion, time-series storage, query, rule evaluation, and Alertmanager-style notification flow.

### Main references

- [Hello Interview, Design Metrics Monitoring](https://www.hellointerview.com/learn/system-design/problem-breakdowns/metrics-monitoring) for requirements, scale, dashboard queries, alerts, and cardinality.
- [Cloudflare, How Cloudflare Runs Prometheus at Scale](https://blog.cloudflare.com/how-cloudflare-runs-prometheus-at-scale/) for a production account of cardinality limits and protecting Prometheus.
- [Prometheus Storage](https://prometheus.io/docs/prometheus/latest/storage/) for the local time-series database and remote-storage boundary.
- [Prometheus Alerting Overview](https://prometheus.io/docs/alerting/latest/overview/) and [Alertmanager](https://prometheus.io/docs/alerting/latest/alertmanager/) for rule evaluation, grouping, deduplication, silencing, inhibition, and routing.

### Avoid repeating

Notifications are the output of this system, not its main subject. Keep channel delivery shallow here because the final roadmap item covers a general notification platform.

---

## 6. Designing a Distributed Job Scheduler like Airflow

**Suggested slug:** `designing-job-scheduler`

**Why it earns a post**

The current posts use background workers but do not explain how work is scheduled at a precise future time, leased to workers, retried after crashes, or coordinated through a dependency graph.

### Main scope

- Schedule immediate, future, recurring, and dependency-driven jobs.
- Execute thousands of jobs per second close to their intended time.
- Track job and attempt status.
- Guarantee at-least-once execution while making duplicate effects manageable.

### Sections and ideas to cover

1. Requirements and the difference between a task definition, job, run, and attempt.
2. Capacity estimates for schedules, due jobs, attempts, queue throughput, and history retention.
3. One-time timestamps, cron expressions, and directed acyclic graph workflows.
4. Job, schedule, dependency, run, attempt, and lease schemas.
5. Finding due jobs without scanning the complete jobs table.
6. Time buckets, a timing wheel, or a sharded priority queue.
7. Scheduler sharding and ownership of time ranges or schedule IDs.
8. Leader election versus multiple schedulers using database locks or compare-and-swap claims.
9. Moving a due run into a durable execution queue.
10. Worker leases, heartbeats, visibility timeouts, and reclaiming abandoned work.
11. At-least-once execution and why task handlers should be idempotent.
12. Retry policies, exponential backoff, maximum attempts, and dead-letter queues.
13. Dependency tracking and releasing downstream tasks only after prerequisites succeed.
14. Backfills, reruns, cancellation, and schedule changes.
15. Priority, tenant fairness, concurrency pools, and backpressure.
16. Long-running jobs, progress heartbeats, and avoiding lease expiry during healthy work.
17. Scheduler recovery, duplicate dispatch races, and clock skew.
18. Final architecture and takeaways.

### Visual opportunities

- A job moving through scheduled, queued, running, success, and retry states.
- A worker crashing while holding a lease and another worker reclaiming it.
- A directed acyclic graph releasing tasks as dependencies complete.

### Main references

- [Hello Interview, Design a Job Scheduler](https://www.hellointerview.com/learn/system-design/problem-breakdowns/job-scheduler) for scheduling precision, throughput, and at-least-once execution.
- [Apache Airflow Architecture Overview](https://airflow.apache.org/docs/apache-airflow/stable/core-concepts/overview.html) for directed acyclic graphs, tasks, schedulers, executors, and workers.
- [Apache Airflow Scheduler](https://airflow.apache.org/docs/apache-airflow/stable/administration-and-deployment/scheduler.html) for the scheduling loop, concurrency limits, batching, and database locking.
- [Airbnb, Airflow](https://airbnb.tech/opensource/airflow/) for the original workflow-as-code framing and scalable worker architecture.
- [Airbnb, Skipper](https://airbnb.tech/infrastructure/skipper-building-airbnbs-embedded-workflow-engine/) for durable workflow execution through checkpointing, leases, and replay.

### Avoid repeating

Do not spend the post teaching Kafka again. The queue is one component. The hard parts are time, ownership, leases, duplicate execution, and workflow state.

---

## 7. Designing ChatGPT

**Suggested slug:** `designing-chatgpt`

**Why it earns a post**

This is a useful bridge between the site's machine-learning writing and its system-design writing. It introduces scarce accelerator scheduling, token streaming, continuous batching, key-value cache management, and cost-aware context handling.

### Main scope

- A user sends a text prompt and receives a streamed response.
- Conversations are stored and can be resumed.
- Treat model training and model internals as out of scope.
- Focus on the serving platform around an already trained model.

### Sections and ideas to cover

1. Requirements and why time to first token matters more than total completion time.
2. Capacity estimates in input tokens, output tokens, concurrent generations, GPU memory, and tokens per second.
3. Conversation, message, generation request, model version, and usage schemas.
4. Persisting the user message before starting a long-running generation.
5. Server-Sent Events or WebSockets for token streaming, cancellation, and reconnect behavior.
6. Separating API servers from GPU inference workers.
7. Model routing based on model version, region, context length, and available accelerator capacity.
8. Admission control and queues for scarce GPU capacity.
9. Prefill versus decode and why they stress hardware differently.
10. Static batching versus continuous batching.
11. The attention key-value cache and why it grows with every active sequence.
12. PagedAttention-style fixed blocks to reduce fragmentation and admit more concurrent requests.
13. Tensor or pipeline parallelism when one model does not fit on one accelerator.
14. Fair scheduling by token budget instead of request count.
15. Paid tiers, per-user quotas, maximum generation length, and protection from heavy users.
16. Prompt-prefix caching for repeated system instructions.
17. Long conversations, context truncation, summaries, and compaction.
18. Moderation before and after generation.
19. Worker failure halfway through a response, partial output, retries, and whether regeneration is safe.
20. Model rollouts, draining old workers, and pinning an in-flight request to one version.
21. Final architecture and takeaways.

### Visual opportunities

- Time to first token compared with total response time.
- Static batching leaving GPU slots idle versus continuous batching admitting new requests.
- Logical key-value cache blocks mapped to non-contiguous physical GPU memory.
- API, scheduler, model router, GPU workers, conversation store, and streaming connection.

### Main references

- [Hello Interview, Design ChatGPT](https://www.hellointerview.com/learn/system-design/problem-breakdowns/chatgpt) for product requirements, streaming, GPU scheduling, fairness, and context-cost deep dives.
- [vLLM, PagedAttention](https://vllm.ai/blog/2023-06-20-vllm) for key-value cache paging and improved batching capacity.
- [PagedAttention Paper](https://arxiv.org/pdf/2309.06180) for the deeper memory-management and scheduler design.
- [OpenAI, Unrolling the Codex Agent Loop](https://openai.com/index/unrolling-the-codex-agent-loop/) for prompt caching and context compaction in a production agent loop.

### Avoid repeating

Do not turn this into an explanation of transformers or model training. The post is about serving, scheduling, streaming, reliability, and cost.

---

## 8. Designing a Notification System

**Suggested slug:** `designing-notification-system`

**Why it earns a post**

Messenger mentions offline push notifications, but a notification platform has a wider problem. It accepts events from many products, applies preferences and policy, and reliably delivers through push, email, SMS, and in-app channels without overwhelming users or providers.

### Main scope

- Product services request immediate or scheduled notifications.
- Users control channels, categories, quiet hours, and opt-outs.
- The platform delivers through channel-specific providers.
- Track accepted, sent, delivered, failed, opened, and expired states.

### Sections and ideas to cover

1. Requirements and the difference between transactional and promotional notifications.
2. Capacity estimates for fan-out, provider requests, templates, device tokens, retries, and history.
3. Notification request, recipient, template, preference, device token, and delivery-attempt schemas.
4. A notification gateway for validation, authentication, idempotency, and single or batch requests.
5. Converting product events into channel-independent notification intents.
6. Templates, localization, variable validation, and versioning.
7. Preference checks, legal opt-outs, quiet hours, and per-category controls.
8. Immediate versus scheduled delivery.
9. Separate queues and worker pools for push, email, SMS, and in-app channels.
10. Priority lanes so password resets are not delayed behind marketing campaigns.
11. Provider adapters for Firebase Cloud Messaging, Apple Push Notification Service, email, and SMS vendors.
12. Device-token lifecycle, stale-token cleanup, and multiple devices per user.
13. At-least-once delivery, idempotent attempts, deduplication windows, and collapse keys.
14. Exponential backoff with jitter, provider `Retry-After`, dead-letter queues, and message expiry.
15. Per-provider, per-tenant, per-campaign, and per-user rate limits.
16. Topic fan-out versus individual-token delivery.
17. Notification budgets, digesting, ranking, and fatigue protection.
18. Delivery receipts, opens, clicks, and analytics without blocking the delivery path.
19. Provider outages, automatic failover where possible, and graceful degradation where it is not.
20. Final architecture and takeaways.

### Visual opportunities

- One notification intent branching into channel-specific queues.
- Retry with exponential backoff, jitter, expiry, and dead-letter handling.
- Preference and quiet-hours filtering before provider delivery.

### Main references

- [ByteByteGo, Typical Push Notification Architecture](https://blog.bytebytego.com/p/ep94-rest-api-cheatsheet) for gateway, distribution, templates, preferences, channel queues, and tracking.
- [Firebase Cloud Messaging Architecture](https://firebase.google.com/docs/cloud-messaging/fcm-architecture) for registration tokens, topic fan-out, platform transports, and delivery.
- [Firebase, Sending at Scale](https://firebase.google.com/docs/cloud-messaging/scale-fcm) for quotas, throttling, `Retry-After`, exponential backoff, jitter, and retry amplification.
- [ByteByteGo, Reddit Notifications](https://blog.bytebytego.com/p/how-reddit-delivers-notifications) for budgeting, retrieval, ranking, reranking, and fatigue control.
- [Spotify, Targeting In-App Messaging](https://engineering.atspotify.com/2023/06/experimenting-with-machine-learning-to-target-in-app-messaging) for multi-channel communication and deciding whether a user should receive a message at all.

### Avoid repeating

Do not redesign chat delivery. Notifications are asynchronous, policy-driven, multi-channel, and often allowed to expire. A chat message is durable conversation content and has different guarantees.

---

## Topics researched but intentionally not scheduled

These are common on other system-design sites, but they add too little new material after the existing posts and the eight recommendations above.

- **Twitter or Facebook News Feed**
  - The celebrity fan-out problem is useful, but Instagram already has a dedicated news-feed section. Ad aggregation also introduces streaming and trending-style computation. Revisit only if feed ranking becomes a separate machine-learning systems post.
  - References if needed later are [Hello Interview, Facebook News Feed](https://www.hellointerview.com/learn/system-design/problem-breakdowns/fb-news-feed), [System Design Primer, Twitter](https://github.com/donnemartin/system-design-primer/blob/master/solutions/system_design/twitter/README.md), and [Meta, News Feed Ranking](https://engineering.fb.com/2021/01/26/ml-applications/news-feed-ranking/).
- **Netflix or Twitch**
  - YouTube already covers encoding, adaptive streaming, control and data paths, caching, and content delivery networks. A future post would only be justified if scoped specifically to live video.
  - Useful future reference is [Netflix, Behind the Streams](https://netflixtechblog.com/behind-the-streams-live-at-netflix-part-1-d23f917c2f40).
- **Slack, Discord, or WhatsApp**
  - Messenger already covers WebSockets, ordering, presence, group fan-out, offline delivery, and encryption.
  - Slack's [Real-Time Messaging](https://slack.engineering/real-time-messaging/) remains a strong production reference for stateful channel servers and gateway servers.
- **Google Drive**
  - Dropbox already covers the defining file-sync mechanisms.
- **Food delivery**
  - Most of its dispatch, location, and matching design overlaps Uber.
- **Hotel or flight booking**
  - Inventory holds, expiry, contention, and payment recovery overlap Ticketmaster.
- **A standalone distributed cache**
  - The site already has posts on caching, consistent hashing, replication, and data partitioning. The remaining case studies apply those pieces repeatedly.
- **Top-K or trending videos**
  - Typeahead already precomputes top-K results. Ad click aggregation adds the missing stream-processing version of the problem.
- **Tinder**
  - Matching, geospatial filtering, notifications, and feed serving are represented elsewhere. It adds less foundational value than collaborative editing, payments, observability, scheduling, or stream processing.

## Research catalogs used to choose the shortlist

- [System Design Primer](https://github.com/donnemartin/system-design-primer/) for the classic interview set.
- [Design Gurus, Top System Design Questions](https://www.designgurus.io/blog/system-design-interview-questions-to-crack-your-next-faang-interview) for current commonly taught case studies.
- Hello Interview's detailed problem breakdowns linked under each recommended post.
- ByteByteGo articles linked under payments and notifications.
- First-party engineering and documentation from Stripe, Figma, Google Research, Prometheus, Airflow, Airbnb, Firebase, Cloudflare, Spotify, Meta, Slack, Netflix, OpenAI, and vLLM.

## Completion rule

Complete the eight recommended posts, then close this roadmap. Only add another general system-design case study if it introduces a major mechanism not covered by either the existing ten posts or these eight.

---

# Applied machine learning and MLE blog roadmap

This is the long-term machine-learning roadmap for the site. It is deliberately broader than a list of model architectures: Applied ML and Machine Learning Engineering roles are expected to frame problems, build trustworthy datasets, train and evaluate models, deploy them, and keep them useful in production. The topics below cover that complete lifecycle without depending on any particular company or cloud.

The order is a learning path, not a requirement to publish every foundational post before writing an advanced one. Each numbered item is large enough to become one focused post; closely related items can become a short series.

## Already covered

- **Contrastive Learning**
  - Positive and negative pairs, dual encoders, normalized embeddings, similarity matrices, temperature, and symmetric contrastive loss.
- **Group Relative Policy Optimization**
  - Group-relative advantages, verifiable rewards, clipped policy updates, the KL penalty, and the differences from Proximal Policy Optimization.

Do not rewrite these two subjects. Future posts should link to them when discussing self-supervised representation learning or reinforcement-learning-based language-model post-training.

## Track 1: Mathematical and statistical foundations

1. **Probability for Machine Learning**
   - Random variables, common distributions, joint and conditional probability, Bayes' rule, expectation, variance, covariance, independence, likelihood, and log-likelihood.
2. **Statistics, Estimation, and Uncertainty**
   - Sampling, estimators, bias and variance, maximum-likelihood estimation, confidence intervals, bootstrapping, hypothesis tests, and multiple-comparison pitfalls.
3. **Information Theory for ML**
   - Entropy, cross-entropy, conditional entropy, Kullback-Leibler divergence, mutual information, perplexity, and how they connect to classification, compression, representation learning, and language models.
4. **Optimization Fundamentals**
   - Convexity, constrained optimization, Lagrange multipliers, gradient descent, stochastic optimization, momentum, conditioning, saddle points, and why deep-learning objectives behave differently from convex problems.
5. **Generalization and the Bias-Variance Trade-off**
   - Underfitting, overfitting, model capacity, inductive bias, regularization, learning curves, distribution assumptions, and the limits of judging a model from training loss.

## Track 2: Classical machine learning

22. **Linear Regression from First Principles**
    - Ordinary least squares, assumptions, residuals, gradients.
23. **Regularized Linear Models**
    - Ridge, Lasso, Elastic Net, coefficient shrinkage, sparsity, multicollinearity, feature scaling, regularization paths, and cross-validated penalty selection.
24. **Logistic Regression and Generalized Linear Models**
    - Log-odds, maximum likelihood, cross-entropy, multiclass strategies, interpretation, calibration, and decision thresholds.
25. **Decision Trees**
    - Entropy and Gini impurity, regression splits, pruning, missing values, feature importance, instability, and the bias-variance behavior of trees.
26. **Bagging and Random Forests**
    - Bootstrap samples, random feature subsets, out-of-bag evaluation, variance reduction, probability estimates, feature importance caveats, and Extra Trees.
27. **Gradient-Boosted Decision Trees**
    - Additive models, residual fitting, learning rate and tree-depth trade-offs, regularization, categorical handling, early stopping, missing values, and why boosting is a tabular-data baseline.
28. **Support Vector Machines and Kernel Methods**
    - Maximum-margin classification, hinge loss, soft margins, the kernel trick, common kernels, support-vector regression, scaling behavior, and when kernels remain useful.
29. **Nearest Neighbors and Instance-Based Learning**
    - Distance metrics, normalization, the curse of dimensionality, exact versus approximate search, weighting neighbors, indexing, latency, and memory trade-offs.
30. **Naive Bayes and Probabilistic Classifiers**
    - Conditional independence, Gaussian, multinomial, and Bernoulli variants, log probabilities, smoothing, text classification, calibration, and failure modes.
31. **Clustering**
    - K-means, hierarchical clustering, density-based clustering, choosing distance and cluster count, cluster validation, stability, and turning clusters into product decisions.
32. **Dimensionality Reduction and Manifold Learning**
    - Principal component analysis, singular value decomposition, independent component analysis, random projections, t-SNE, UMAP, visualization traps, and preserving structure.
36. **Learning to Rank**
    - Pointwise, pairwise, and listwise objectives; relevance labels; ranking losses; NDCG, MAP, and MRR; position bias; negative sampling; calibration; and offline-online metric gaps.

## Track 3: Evaluation, experimentation, and diagnosis

37. **Classification Metrics and Decision Thresholds**
    - Confusion matrices, precision, recall, specificity, F-scores, ROC-AUC, PR-AUC, top-k metrics, cost-sensitive thresholds, micro/macro averaging, and metric choice under imbalance.
38. **Regression, Ranking, Retrieval, and Forecasting Metrics**
    - MAE, MSE, RMSE, quantile loss, \(R^2\), MAPE pitfalls, NDCG, MAP, MRR, Recall@K, calibration of forecasts, and selecting metrics that match user impact.
40. **Cross-Validation and Hyperparameter Optimization**
    - K-fold and nested cross-validation, time-aware validation, grid/random/Bayesian search, early stopping and pruning trials, search-space design, budget allocation, and selection bias.
46. **Model Interpretability and Explainability**
    - Global versus local explanations, coefficients, partial dependence, permutation importance, SHAP-style attributions, counterfactuals, surrogate models, explanation stability, and avoiding causal claims.

## Track 4: Deep-learning foundations and architectures

47. **Neural Networks and Backpropagation from Scratch**
    - Perceptrons, multilayer networks, forward passes, chain-rule gradients, mini-batches, vectorization, and implementing a small autodiff training loop.
48. **Activations, Initialization, and Gradient Flow**
    - Sigmoid, tanh, ReLU-family and gated activations; Xavier and He initialization; saturation; dead units; vanishing and exploding gradients; and signal propagation through depth.
49. **Loss Functions and Objective Design**
    - Cross-entropy, binary and multiclass losses, regression and robust losses, margin and metric-learning losses, focal loss, label smoothing, multi-task objectives, and matching loss to metric.
50. **Optimizers and Learning-Rate Schedules**
    - SGD, momentum, adaptive optimizers, weight decay versus L2 penalties, warmup, step/cosine schedules, restarts, batch-size interactions, gradient clipping, and diagnosing unstable updates.
51. **Normalization, Residual Connections, and Modern Blocks**
    - Batch, layer, group, and root-mean-square normalization; residual and skip paths; pre-norm versus post-norm; gated blocks; and why these choices stabilize large models.
52. **Regularizing Deep Networks**
    - Weight decay, dropout, stochastic depth, early stopping, augmentation, label smoothing, mixup, ensembling, data scale, and reading train-validation loss curves.
54. **Recurrent Networks and Sequence Modeling**
    - Backpropagation through time, recurrent networks, LSTM and GRU gates, bidirectionality, sequence-to-sequence learning, teacher forcing, exposure bias, and long-range limitations.
55. **Attention and Transformers**
    - Queries, keys, values, scaled dot-product and multi-head attention, positional representations, masks, encoder/decoder variants, feed-forward blocks, residual paths, and computational complexity.
56. **Embeddings and Representation Learning**
    - Sparse versus dense features, static and contextual embeddings, metric spaces, negative sampling, similarity measures, dimensionality, normalization, collapse, visualization, and evaluation.

## Track 5: Training strategies and systems

61. **Debugging a Neural-Network Training Run**
    - Overfit one batch, validate shapes and labels, inspect gradients and activations, compare loss to a random baseline, find NaNs, profile the input pipeline, and localize data/model/optimizer bugs.
62. **Transfer Learning and Fine-Tuning**
    - Feature extraction, frozen versus trainable layers, gradual unfreezing, discriminative learning rates, domain shift, catastrophic forgetting, small-data regimes, and when training from scratch wins.
63. **Self-Supervised Pretraining**
    - Masked prediction, autoregressive prediction, denoising, predictive and joint-embedding objectives, pretext-task design, transfer evaluation, and avoiding representation collapse.
64. **Contrastive Learning — Already Covered**
    - Link to the existing post; an extension may cover hard negatives, false negatives, memory banks, multimodal contrast, and retrieval evaluation without repeating the fundamentals.
65. **Curriculum Learning, Sampling, and Hard-Example Mining**
    - Easy-to-hard schedules, importance and loss-aware sampling, hard positives and negatives, replay, class-balanced batches, data mixtures, and how sampling changes the learned objective.
66. **Knowledge Distillation**
    - Teacher-student training, soft targets and temperature, feature and relation distillation, self-distillation, sequence-level distillation, capacity gaps, and measuring compression-quality trade-offs.
67. **Pruning, Sparsity, and Quantization**
    - Structured versus unstructured pruning, magnitude and movement pruning, quantization-aware versus post-training quantization, integer and low-bit formats, calibration data, kernels, and accuracy loss.
68. **Mixed Precision, Gradient Accumulation, and Activation Checkpointing**
    - FP32, FP16, BF16 and lower precision; loss scaling; effective batch size; recomputation; optimizer-state memory; throughput; numerical stability; and out-of-memory debugging.
69. **Distributed Training**
    - Synchronous versus asynchronous updates, data/model/tensor/pipeline/context/expert parallelism, all-reduce, parameter servers, sharded optimizer states, communication bottlenecks, stragglers, and fault-tolerant checkpoints.
70. **Profiling and Accelerating Training**
    - CPU/GPU timelines, compute versus memory bounds, input-pipeline stalls, batching, prefetch and pinned memory, kernel fusion, compilation, efficient attention, utilization, scaling efficiency, and cost per useful experiment.

## Track 6: Applied modeling domains

76. **Search, Semantic Retrieval, and Approximate Nearest Neighbors**
    - Inverted indexes and BM25, dense and sparse retrieval, dual and cross encoders, vector indexes, similarity metrics, approximate search, hybrid retrieval, reranking, and Recall@K/latency trade-offs.

## Track 7: Reinforcement learning and sequential decisions

81. **Multi-Armed Bandits**
    - Exploration versus exploitation, epsilon-greedy, upper-confidence bounds, Thompson sampling, contextual bandits, regret, non-stationarity, delayed rewards, and safe online experimentation.
82. **Markov Decision Processes and Dynamic Programming**
    - States, actions, transitions, rewards, returns, discounting, policies, value functions, Bellman equations, policy evaluation, value iteration, and the Markov assumption.
83. **Monte Carlo and Temporal-Difference Learning**
    - Episode returns, bootstrapping, TD error, n-step returns, eligibility traces, on-policy versus off-policy learning, SARSA, Q-learning, and the bias-variance trade-off.
84. **Deep Q-Learning**
    - Function approximation, replay buffers, target networks, exploration schedules, Double and Dueling DQN, prioritized replay, instability, overestimation, and sample efficiency.
85. **Policy Gradients**
    - Stochastic policies, the likelihood-ratio objective, REINFORCE, reward-to-go, baselines, entropy bonuses, credit assignment, high-variance gradients, and continuous actions.
86. **Actor-Critic Methods and Proximal Policy Optimization**
    - Value critics, advantage estimation, generalized advantage estimation, clipped objectives, rollout collection, update epochs, entropy and KL controls, and stable implementation details.
87. **Offline Reinforcement Learning and Imitation Learning**
    - Behavior cloning, dataset coverage, distribution shift, conservative value learning, inverse RL, demonstrations, off-policy evaluation, and why deployment-time exploration may be unacceptable.
88. **Model-Based, Multi-Agent, and Hierarchical RL**
    - Learned dynamics, planning and world models, options and temporal abstraction, cooperative and competitive agents, centralized training, non-stationarity, and sim-to-real gaps.
89. **Reward Design, Safe Exploration, and RL Evaluation**
    - Sparse and shaped rewards, specification gaming, constraints, reward hacking, simulators, seeds and confidence intervals, offline policy evaluation, safety limits, and production rollouts.
90. **Group Relative Policy Optimization — Already Covered**
    - Link to the existing post; use it as the final step in a sequence from policy gradients through actor-critic and preference-based language-model training.

## Track 8: Language models, RAG, and post-training

92. **Transformer Language Models in Detail**
    - Decoder-only computation, causal masks, positional and rotary representations, normalization, gated feed-forward layers, grouped/multi-query attention, key-value caches, context length, and parameter counting.
99. **Supervised Fine-Tuning**
    - Instruction and chat data, templates, assistant-only loss, packing, data mixtures, full-parameter tuning, validation, catastrophic forgetting, checkpoint selection, and when SFT changes knowledge versus behavior.
100. **LoRA, QLoRA, and Parameter-Efficient Fine-Tuning**
    - Low-rank updates, rank and target modules, scaling and dropout, adapters and prompt tuning, quantized base models, memory accounting, merging, multiple adapters, serving, and quality trade-offs.
102. **Reinforcement Learning from Human Feedback**
    - The SFT-policy-reward-model pipeline, rollout generation, PPO updates, KL control, advantage estimation, infrastructure cost, instability, safety checks, and online versus offline preference collection.
103. **Direct Preference Optimization and Related Objectives**
    - Reference policies, chosen/rejected pairs, DPO intuition and loss, implicit rewards, beta, preference overfitting, KTO/ORPO/RLOO-style alternatives, and when preference optimization is simpler than RLHF.
104. **Reasoning-Model Post-Training**
    - Verifiable rewards, outcome versus process supervision, rejection sampling, self-training, curriculum, long reasoning traces, GRPO-style updates, reward hacking, and evaluation beyond answer accuracy.
105. **Generation and Decoding Strategies**
    - Greedy decoding, temperature, top-k and nucleus sampling, beam search, repetition controls, constrained decoding, stopping, log probabilities, best-of-N, speculative decoding, and quality-diversity-latency trade-offs.
106. **Efficient LLM Serving**
    - Prefill versus decode, continuous batching, paged key-value caches, prefix caching, chunked prefill, quantization, tensor/pipeline parallelism, speculative decoding, streaming, admission control, and tokens-per-dollar.
107. **LLM Evaluation**
    - Task and capability benchmarks, contamination, deterministic graders, semantic metrics, pairwise preference, human evaluation, model judges and their biases, safety evals, regression suites, and confidence intervals.
108. **Agents, Planning, and Memory**
    - Tool selection, planning loops, state machines, short- and long-term memory, retrieval, reflection, multi-agent patterns, permissions, idempotent actions, traces, evaluation, budgets, and graceful failure.
109. **LLM and Agent Security**
    - Direct and indirect prompt injection, insecure output handling, sensitive-data leakage, poisoning, supply-chain risk, denial of wallet/service, excessive agency, least privilege, sandboxing, and human approval.

## Research basis and coverage check

The roadmap was checked against current role and production-lifecycle guides, framework documentation, and specialized curricula rather than a collection of interview-question listicles:

- [Machine Learning Crash Course](https://developers.google.com/machine-learning/crash-course) for regression, classification, numerical and categorical data, generalization, neural networks, embeddings, language models, production systems, AutoML, and fairness.
- [Rules of Machine Learning](https://developers.google.com/machine-learning/guides/rules-of-ml/) and [Production ML Systems](https://developers.google.com/machine-learning/crash-course/production-ml-systems) for baselines, data dependencies, training-serving skew, feedback loops, testing, serving, and monitoring.
- [Deep Learning Tuning Playbook](https://developers.google.com/machine-learning/guides/deep-learning-tuning-playbook) for scientific tuning, optimizer and learning-rate choices, batch size, instability, and training diagnosis.
- [Professional Machine Learning Engineer exam guide](https://cloud.google.com/learn/certification/guides/machine-learning-engineer) and [Machine Learning Engineer Associate exam guide](https://docs.aws.amazon.com/aws-certification/latest/machine-learning-engineer-associate-01/machine-learning-engineer-associate-01.html) for the current job-level split across data, modeling, deployment, orchestration, monitoring, security, and responsible AI.
- [Scikit-learn User Guide](https://scikit-learn.org/stable/user_guide.html) for supervised and unsupervised algorithms, model selection, preprocessing, calibration, inspection, semi-supervised learning, and common pitfalls.
- [PyTorch Tutorials](https://docs.pytorch.org/tutorials/) for model implementation, performance profiling, automatic mixed precision, compilation, distributed training, quantization, and checkpointing.
- [Recommendation Systems course](https://developers.google.com/machine-learning/recommendation) for candidate generation, collaborative filtering, scoring, and re-ranking.
- [Transformers course](https://huggingface.co/learn/llm-course/en/chapter1/1), [PEFT documentation](https://huggingface.co/docs/peft/), and [TRL documentation](https://huggingface.co/docs/trl/) for tokenization, transformers, datasets, distributed fine-tuning, LoRA/QLoRA, SFT, reward modeling, DPO, PPO, and GRPO.
- [Deep Reinforcement Learning course](https://huggingface.co/learn/deep-rl-course/en/unit0/introduction) for Q-learning, deep Q-networks, policy gradients, actor-critic methods, PPO, multi-agent RL, and imitation learning.
- [vLLM documentation](https://docs.vllm.ai/) for paged key-value caches, continuous batching, quantization, speculative decoding, prefix caching, parallel serving, and streaming.
- [RAG overview](https://learn.microsoft.com/en-us/azure/search/retrieval-augmented-generation-overview) for document ingestion, chunking, vectorization, hybrid retrieval, multimodal content, and agentic retrieval.
- [OWASP Top 10 for LLM Applications](https://genai.owasp.org/llm-top-10/) for prompt injection, sensitive-information disclosure, supply-chain risk, poisoning, improper output handling, excessive agency, and resource abuse.
- [Introduction to Responsible AI](https://developers.google.com/machine-learning/guides/intro-responsible-ai) for fairness, accountability, safety, privacy, transparency, and human impact.

## Completion rule

Treat this as a coverage map, not a promise to chase every new acronym. A new ML topic belongs here only if it adds a durable concept, architecture, evaluation method, training strategy, or production mechanism not already covered above. Framework-specific tutorials should teach the underlying idea and use the framework only as the implementation vehicle.
