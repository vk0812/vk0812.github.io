## Track 9: Modern and frontier model architectures

110. **Mixture-of-Experts and Sparse Models**
     - Routing functions, expert capacity and load balancing, auxiliary load-balancing losses, sparse versus dense parameter counts, token-dropping, and why sparsity changes training and serving trade-offs.
111. **State-Space and Linear-Attention Sequence Models**
     - Selective state-space models (Mamba), linear recurrences, hardware-aware scans, linear versus quadratic attention complexity, hybrid Transformer/SSM stacks (Jamba-style), and where long-context efficiency actually wins.
112. **World Models and Joint-Embedding Predictive Architectures**
     - Learned dynamics models, latent-space prediction instead of pixel prediction, JEPA-style objectives, planning with learned world models, and the link back to model-based RL.
113. **Long-Context and Memory-Augmented Architectures**
     - Context-length scaling limits, learned long-term memory modules, KV-cache alternatives, retrieval-as-memory, context compression, and evaluating "needle in a haystack" versus real long-context tasks.
114. **Multimodal and Any-to-Any Models**
     - Shared tokenization across modalities, vision-language fusion, unified generation-and-understanding models, cross-modal alignment objectives, and evaluation beyond single-modality benchmarks.

## Track 10: Frontier LLM and agent engineering

115. **Retrieval-Augmented Generation, End to End**
     - Ingestion and chunking strategy (fixed, semantic, hierarchical), hybrid retrieval, re-ranking, citation grounding, and cataloguing RAG failure modes beyond the retrieval mechanics already covered in Search and Semantic Retrieval.
116. **Tool Use, Function Calling, and the Model Context Protocol**
     - Tool-schema design, the MCP host/client/server model, dynamic tool discovery, tool-selection reliability at scale, and context-window budgeting when many tools are registered.
117. **Context Engineering for Long-Running Agents**
     - Context compaction, memory hierarchies (short-term versus persisted), prompt/context caching economics, sub-agent delegation, and the latency/cost trade-offs of very long contexts.

## Beyond ML: system design and case-study roadmap

### System design fundamentals still open

- **Consensus Algorithms: Raft, Paxos, and Leader Election** — quorum-based agreement, log replication, split-brain avoidance, and leader leases; builds directly on the published Quorum and Heartbeat/Checksum posts.
- **Distributed Transactions Beyond Two-Phase Commit** — 2PC's blocking-coordinator failure mode, Sagas, TCC, and idempotency keys; extends the published Change Data Capture/Outbox post.
- **Database Storage Engine Internals** — B-trees versus LSM-trees, write-ahead logs, compaction, and read/write amplification, framed as "which storage engine for which workload."
- **API Gateways and Service Meshes** — routing, auth, and rate-limit composition (linking to the published Rate Limiting post), circuit breakers, bulkheads, and sidecar patterns.
- **Distributed Locking and Leader Election Services** — lease-based locks, fencing tokens, and ZooKeeper/etcd-style coordination primitives.

### New case studies to design

- **Designing a Distributed Pub/Sub System (Kafka-style)** — partitioned logs, consumer groups, offset management, exactly-once semantics, and backpressure.
- **Designing a Distributed Key-Value Store (Dynamo/Cassandra-style)** — vector clocks and read repair layered on the published Consistent Hashing post, plus tunable consistency.
- **Designing a Vector Database or Semantic Search Platform** — HNSW/IVF indexing at scale, sharding embeddings, hybrid lexical-plus-vector search, and index rebuild strategy.
- **Designing a Live-Streaming or Video-Conferencing Platform** — WebRTC, SFU versus MCU architectures, adaptive bitrate, and latency budgets.