## Beyond ML: system design and case-study roadmap

### System design fundamentals still open

- **Consensus Algorithms: Raft, Paxos, and Leader Election** — quorum-based agreement, log replication, split-brain avoidance, and leader leases; builds directly on the published Quorum and Heartbeat/Checksum posts.
- **Distributed Transactions Beyond Two-Phase Commit** — 2PC's blocking-coordinator failure mode, Sagas, TCC, and idempotency keys; extends the published Change Data Capture/Outbox post.
- **Database Storage Engine Internals** — B-trees versus LSM-trees, write-ahead logs, compaction, and read/write amplification, framed as "which storage engine for which workload."
- **API Gateways and Service Meshes** — routing, auth, and rate-limit composition, circuit breakers, bulkheads, and sidecar patterns.
- **Distributed Locking and Leader Election Services** — lease-based locks, fencing tokens, and ZooKeeper/etcd-style coordination primitives.

### New case studies to design

- **Designing a Distributed Pub/Sub System (Kafka-style)** — partitioned logs, consumer groups, offset management, exactly-once semantics, and backpressure.
- **Designing a Distributed Key-Value Store (Dynamo/Cassandra-style)** — vector clocks and read repair layered on the published Consistent Hashing post, plus tunable consistency.
- **Designing a Vector Database or Semantic Search Platform** — HNSW/IVF indexing at scale, sharding embeddings, hybrid lexical-plus-vector search, and index rebuild strategy.
- **Designing a Live-Streaming or Video-Conferencing Platform** — WebRTC, SFU versus MCU architectures, adaptive bitrate, and latency budgets.