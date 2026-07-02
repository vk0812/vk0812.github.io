# Upcoming System Design Blogs

Goal: make this site one-stop for system design interview prep (juniors → mid-level, all company types).

Already covered (do not repeat as new posts, only cross-link):
system-design-basics, caching, cap-theorem, cdn, consistent-hashing, data-partitioning,
heartbeat-and-checksum, load-balancing, proxies, quorum, redundancy-and-replication,
web-protocols (long-polling/WebSockets/SSE), bloom-filters, cors.

Write order: Fundamentals → Patterns → Case Studies. Within each section, top to bottom = write order.

---

## 1. Fundamentals

### 1.1 Rate Limiting
- Why rate limit (abuse, fairness, cost control, protecting downstream)
- Token bucket
- Leaky bucket
- Fixed window counter
- Sliding window log
- Sliding window counter
- Where to enforce it: client, API gateway, per-service
- Distributed rate limiting (shared counter in Redis, race conditions, Lua scripts for atomicity)
- Response contract: 429, Retry-After header
- Takeaways

### 1.2 Message Queues & Pub-Sub
- Why decouple producers from consumers
- Queue vs topic (point-to-point vs pub-sub)
- At-most-once vs at-least-once vs exactly-once delivery
- Ordering guarantees (per-partition ordering, global ordering costs)
- Idempotent consumers (dedup keys, why exactly-once at the app layer is a design choice not a queue feature)
- Backpressure and consumer lag
- Dead-letter queues and retry policies
- Fan-out patterns (one event, many consumers)
- Kafka vs RabbitMQ vs SQS/SNS — when to pick which
- Takeaways

### 1.3 Databases Deep Dive
- SQL vs NoSQL: what the tradeoff actually is (schema flexibility vs joins/transactions)
- Document, key-value, wide-column, graph databases — when each fits
- Indexing basics: what an index is, cost of writes vs speed of reads
- B-Tree vs LSM-Tree (why LSM wins for write-heavy workloads)
- ACID properties explained
- BASE and eventual consistency
- Normalization vs denormalization for scale
- Read replicas vs multi-leader vs leaderless (light touch — full depth lives in replication post)
- Takeaways

### 1.4 API Design
- REST principles and resource modeling
- gRPC (protobuf, streaming, when binary beats JSON)
- GraphQL (query flexibility vs caching/complexity tradeoff)
- Pagination: offset vs cursor-based
- Idempotency keys for unsafe operations (POST retries)
- API versioning strategies (URI, header, content negotiation)
- Rate limiting and auth at the API layer (cross-link to rate limiting post)
- Takeaways

### 1.5 Authentication & Authorization Basics
- Session-based auth (cookies, server-side session store)
- Token-based auth (JWT structure, signing, expiry)
- OAuth 2.0 flow (authorization code grant, why it exists)
- SSO basics
- API keys vs user auth
- Where auth checks belong (gateway vs service) and why that matters for system design answers
- Takeaways

### 1.6 Distributed Locks
- Why a single-machine mutex doesn't work across nodes
- Lock via database row (SELECT FOR UPDATE) and its limits
- Redis-based locks and the Redlock algorithm
- ZooKeeper/etcd ephemeral nodes for locking
- Lock expiry, fencing tokens, and the "lost lock" problem
- When to avoid locks entirely (optimistic concurrency, CAS)
- Takeaways

### 1.7 Consensus Algorithms
- The problem consensus solves (agreement despite failures)
- Paxos at a conceptual level (proposers, acceptors, learners) — no need for full proof
- Raft: leader election, log replication, term numbers (why Raft is more "readable" than Paxos)
- Quorum's role in consensus (cross-link to existing quorum post)
- Where consensus shows up in real systems (etcd, ZooKeeper, Kafka controller election)
- Takeaways

### 1.8 Distributed Transactions
- Why cross-service transactions are hard (no shared DB, no single commit point)
- Two-Phase Commit (2PC): prepare/commit phases, blocking problem
- Saga pattern: choreography vs orchestration
- Compensating transactions
- Eventual consistency as a design choice, not a fallback
- Outbox pattern for reliable event publishing
- Takeaways

### 1.9 Sharding Deep Dive
- Recap: partitioning vs sharding (light, cross-link to data-partitioning post)
- Hot key / hot shard problem and detection
- Resharding strategies: stop-the-world vs online migration
- Directory-based sharding vs algorithmic sharding
- Cross-shard queries and joins (why they're expensive, how to avoid needing them)
- Takeaways

### 1.10 Service Discovery & API Gateway
- Why services need to find each other in a dynamic/elastic fleet
- Client-side discovery vs server-side discovery
- Service registry (Consul, etcd, ZooKeeper) and health checks
- API gateway responsibilities: routing, auth, rate limiting, request aggregation
- Gateway vs service mesh (brief distinction)
- Takeaways

### 1.11 Observability
- The three pillars: logs, metrics, traces
- Structured logging and log aggregation
- Metrics: counters, gauges, histograms; RED and USE methods
- Distributed tracing (trace ID propagation, spans, why it matters in microservices)
- Alerting: SLI, SLO, SLA defined and how they relate
- On-call basics: paging thresholds, avoiding alert fatigue
- Takeaways

### 1.12 Search Infrastructure
- Why databases are bad at full-text search
- Inverted index: how it's built and queried
- Tokenization, stemming, relevance scoring (TF-IDF / BM25 at a conceptual level)
- Elasticsearch/Lucene basics: shards, replicas, near-real-time indexing
- Autocomplete data structures (trie, prefix search) — sets up the typeahead case study
- Takeaways

---

## 2. Patterns (keep short, foundational only)

### 2.1 Back-of-Envelope Estimation
- Why interviewers ask for this (sanity-checking design decisions)
- QPS estimation from DAU/MAU and usage patterns
- Storage estimation (per-record size × growth rate × retention)
- Bandwidth estimation
- Common numbers worth memorizing (latency numbers every engineer should know, powers of 2/10)
- Worked example start to finish
- Takeaways

### 2.2 The System Design Interview Framework
- Step 1: Clarify requirements (functional vs non-functional, explicitly ask about scale)
- Step 2: Back-of-envelope estimation
- Step 3: High-level design (draw boxes before internals)
- Step 4: Deep dive into 1-2 components the interviewer cares about
- Step 5: Identify bottlenecks and discuss tradeoffs
- Step 6: Wrap-up (what you'd do with more time, monitoring, failure modes)
- Common mistakes (jumping to tech names before requirements, over-engineering, silence)
- Takeaways

### 2.3 Tradeoff Vocabulary Cheat Sheet
- Latency vs throughput
- Consistency vs availability (cross-link CAP)
- Push vs pull
- Synchronous vs asynchronous
- Vertical vs horizontal scaling
- Strong vs eventual consistency
- Stateless vs stateful services
- Takeaways

---

## 3. Case Studies (the main event — full worked designs)

Each case study should follow the interview framework from 2.2: requirements → estimation → high-level design → deep dive → tradeoffs/bottlenecks.

### 3.1 URL Shortener
- Functional requirements (shorten, redirect, custom aliases, expiry)
- Encoding approach: base62 counter vs hash-based
- Handling collisions
- Database schema and choice (KV store fits well)
- Redirect flow and caching hot links
- Analytics (click tracking) as an extension
- Scaling reads vs writes

### 3.2 Rate Limiter (as a system)
- Where it sits in the request path (gateway vs per-service)
- Distributed counter storage (Redis) and race conditions
- Multi-region rate limiting challenges
- Algorithm choice tradeoffs (cross-link to 1.1)
- Returning proper client feedback (429 + Retry-After)

### 3.3 Distributed Cache (design a Redis-like system)
- Single-node data structures and eviction
- Partitioning cache keys across nodes (consistent hashing cross-link)
- Replication for durability/availability
- Handling node failure and rebalancing
- Client-side vs server-side sharding

### 3.4 Key-Value Store (Dynamo/Cassandra-style)
- Partitioning with consistent hashing
- Replication (N, W, R quorum — cross-link)
- Vector clocks / versioning for conflict resolution
- Read repair and anti-entropy (Merkle trees)
- Gossip protocol for membership
- Tunable consistency

### 3.5 Chat Application (WhatsApp/Messenger)
- 1:1 messaging architecture
- Group messaging fan-out
- Message delivery states (sent/delivered/read receipts)
- Online presence tracking
- Storage for chat history and pagination
- Push notifications for offline users
- End-to-end encryption at a conceptual level

### 3.6 News Feed / Twitter Timeline
- Fan-out on write vs fan-out on read vs hybrid
- Celebrity/hot-user problem
- Timeline storage and ranking
- Pagination of feed
- Handling deletes/edits after fan-out

### 3.7 Notification System
- Multi-channel delivery (push, email, SMS)
- Fan-out via message queue
- Third-party gateway integration and retries
- User preferences and rate limiting notifications
- Idempotency (avoiding duplicate notifications)
- Priority queues for urgent vs bulk notifications

### 3.8 Web Crawler
- URL frontier and prioritization
- Politeness (robots.txt, per-domain rate limiting)
- Duplicate URL detection (cross-link bloom filters)
- Distributed crawling and coordination
- Storage of crawled content
- Handling crawler traps and infinite loops

### 3.9 Instagram / Photo-Sharing
- Upload flow and pre-signed URLs to blob storage
- Metadata storage vs binary storage separation
- Feed generation (cross-link news feed case study)
- Image resizing/thumbnailing pipeline
- CDN delivery of images (cross-link CDN post)

### 3.10 YouTube / Video Streaming
- Upload and chunked transfer
- Transcoding pipeline (multiple resolutions/bitrates)
- Adaptive bitrate streaming basics (HLS/DASH)
- Storage tiering (hot vs cold video storage)
- CDN delivery and edge caching (cross-link CDN post)
- View count and metadata consistency

### 3.11 Ride-Sharing (Uber-style)
- Driver location updates (frequency, protocol choice — cross-link web-protocols)
- Geospatial indexing (geohash, quad-tree)
- Matching algorithm (nearest driver, surge considerations)
- Trip state machine and dispatch
- Handling driver/rider disconnects mid-trip

### 3.12 Ticket Booking / Seat Reservation
- Concurrency control for seat locking (pessimistic vs optimistic)
- Preventing double-booking under high contention
- Reservation timeout/expiry flow
- Payment coordination (cross-link distributed transactions)
- Waitlist and queueing during high-demand drops

### 3.13 Payment System
- Idempotency keys to prevent double-charging
- Ledger design (double-entry accounting basics)
- Strong consistency requirements vs eventual consistency elsewhere in the stack
- Handling partial failures across payment provider calls (saga pattern cross-link)
- Reconciliation jobs

### 3.14 Search Autocomplete / Typeahead
- Trie-based prefix matching
- Ranking suggestions (frequency, recency, personalization)
- Precomputing top-K suggestions per prefix
- Handling scale (sharding the trie, caching hot prefixes)
- Updating suggestions in near-real-time

### 3.15 Collaborative Document Editing (Google Docs)
- The concurrent-edit conflict problem
- Operational Transformation (OT) at a conceptual level
- CRDTs as an alternative approach
- Presence and cursor sharing
- Persistence and version history

### 3.16 Distributed Job Scheduler (cron-at-scale)
- Job definition and scheduling storage
- Leader election for the scheduler itself (cross-link consensus)
- Handling missed/overlapping runs
- Distributing job execution across workers
- Retry and failure handling for jobs

### 3.17 Ad Click Aggregation / Analytics Pipeline
- High-throughput ingestion (message queue cross-link)
- Stream processing for real-time aggregation vs batch for accuracy
- Handling late-arriving and duplicate events
- Storage for aggregated metrics (time-series considerations)
- Fraud/bot click filtering at a conceptual level

### 3.18 Nearby Friends / Location-Based Service
- Geospatial indexing recap (geohash, quad-tree, R-tree)
- Efficient proximity queries at scale
- Location update frequency vs battery/bandwidth tradeoff
- Privacy considerations (precision reduction, opt-in)
