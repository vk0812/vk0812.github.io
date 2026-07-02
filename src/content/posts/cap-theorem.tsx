import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  BlogImage,
  InlineCode,
  List,
  ListItem,
} from "../components";

export const capTheorem: BlogPostData = {
  title: "CAP Theorem",
  date: "May 26, 2026",
  slug: "cap-theorem",
  content: (
    <>
      <Paragraph delay={0.1}>
        Why does your banking app sometimes go offline rather than show potentially incorrect account balances? Why does a social media feed occasionally show posts from a few seconds ago instead of the latest? The answer is the same in both cases: a deliberate architectural choice about what to sacrifice when the network misbehaves. The CAP theorem is the framework that explains that choice.
      </Paragraph>

      <Paragraph delay={0.15}>
        Introduced by Eric Brewer in 2000 and formalized as a theorem by Gilbert and Lynch in 2002, CAP states that a distributed system can guarantee at most two of three properties: Consistency, Availability, and Partition Tolerance.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        The Three Properties
      </Heading>

      <List delay={0.25}>
        <ListItem><strong>Consistency (C):</strong> every read receives the result of the most recent write, regardless of which node it contacts. All nodes see the same data at the same time. This is strong consistency, also called linearizability, not the "C" in ACID, which refers to transaction validity. If you update your profile picture, a consistent system ensures any server in any data center returns the new picture the moment after your write completes.</ListItem>
        <ListItem><strong>Availability (A):</strong> every request to a non-failing node receives a response. The system never refuses or ignores a request due to node or network failures. It may return stale data rather than the absolute latest, but it will return something. A banking app that goes offline during a network glitch is sacrificing availability. A social feed that shows posts from 2 seconds ago instead of failing is maintaining it.</ListItem>
        <ListItem><strong>Partition Tolerance (P):</strong> the system continues operating despite network partitions, breaks in connectivity that split nodes into groups that can't communicate. Packets get dropped, switches fail, data centers lose transatlantic links. A partition-tolerant system keeps running on both sides of the split rather than shutting down entirely.</ListItem>
      </List>

      <Heading level={2} delay={0.3}>
        Why P is Non-Negotiable
      </Heading>

      <Paragraph delay={0.35}>
        Network partitions in distributed systems are not edge cases, they are inevitable. Hardware fails, cables get cut, BGP routes flap, data centers lose connectivity. A system that requires perfect network reliability to function is not a distributed system in any practical sense, it's a single node with extra steps. Because partitions will happen, partition tolerance is not really optional for any system that spans multiple machines or locations. That leaves the real choice: when a partition occurs, do you sacrifice consistency or availability?
      </Paragraph>

      <BlogImage
        delay={0.4}
        src="/blog/cap/captradeoff.png"
        alt="CAP trade-off triangle: Consistency, Availability, and Partition Tolerance, pick two, with P assumed in distributed systems, you must choose between Consistency (C) and Availability (A) during a network partition"
        caption="Figure 1: The CAP triangle. Since partitions are unavoidable, the real decision is C or A."
      />

      <Heading level={2} delay={0.45}>
        The Partition Choice: CP vs. AP
      </Heading>

      <Paragraph delay={0.5}>
        When a network partition splits Data Center A from Data Center B, the nodes on each side face a decision. They can't both have the same up-to-date data, the link between them is broken. So they must choose:
      </Paragraph>

      <List delay={0.55}>
        <ListItem><strong>CP (Consistency + Partition Tolerance):</strong> refuse or block requests on one side of the partition rather than risk serving inconsistent data. Consistency is preserved, availability is sacrificed during the failure. The system would rather say "I can't answer right now" than "here's potentially wrong data."</ListItem>
        <ListItem><strong>AP (Availability + Partition Tolerance):</strong> keep accepting requests on both sides of the partition, even though data on each side may diverge. Availability is preserved, consistency is sacrificed until the partition heals and the nodes reconcile. The system would rather return stale data than refuse to respond.</ListItem>
      </List>

      <Paragraph delay={0.6}>
        Under normal operation (no partition), you can have both C and A. CAP is specifically about behavior under failure. Because P is non-negotiable in real distributed systems, the practical design question is always: "When a partition happens, do we prioritize consistency or availability?"
      </Paragraph>

      <Heading level={2} delay={0.65}>
        CP Systems: Consistency Over Availability
      </Heading>

      <Paragraph delay={0.7}>
        CP systems refuse to serve potentially inconsistent data. During a partition, they halt or reject operations on whichever side lacks a quorum, accepting temporary unavailability to ensure all responding nodes agree on the data.
      </Paragraph>

      <BlogImage
        delay={0.72}
        src="/blog/cap/CP.png"
        alt="CP systems prioritize data integrity, during a partition the system rejects/blocks requests to avoid inconsistencies, examples Apache ZooKeeper (coordination, consistent state) and MongoDB (majority write concern), use cases: banking systems, leader election, critical configuration"
        caption="Figure 2: CP systems, when partitions hit, refuse rather than serve inconsistent data."
      />

      <List delay={0.75}>
        <ListItem><strong>Apache ZooKeeper:</strong> a coordination service used for leader election, distributed locks, and configuration management. ZooKeeper uses the Zab consensus protocol and requires a majority quorum of nodes to function. If a network partition leaves fewer than a quorum of nodes reachable, ZooKeeper stops accepting operations entirely rather than risk two sides disagreeing on who the leader is or what the configuration contains. Data integrity is paramount when distributed systems coordinate around it.</ListItem>
        <ListItem><strong>MongoDB (default configuration):</strong> uses a primary-replica model where only the primary accepts writes. If the primary becomes unreachable, the replica set halts writes until a new primary is elected via majority vote. During that election window, typically a few seconds, write operations fail. MongoDB prefers a brief window of write unavailability over the risk of two nodes both believing they are primary and accepting conflicting writes. Financial applications and inventory systems are natural fits: a denied transaction is recoverable, an inconsistent balance or double-counted inventory is not.</ListItem>
      </List>

      <Heading level={2} delay={0.8}>
        AP Systems: Availability Over Consistency
      </Heading>

      <Paragraph delay={0.85}>
        AP systems keep every node accepting reads and writes during a partition, accepting that different nodes may temporarily have different data. After the partition heals, they reconcile divergent state asynchronously, a property called eventual consistency.
      </Paragraph>

      <BlogImage
        delay={0.87}
        src="/blog/cap/AP.png"
        alt="AP systems prioritize uptime, during a partition the system always responds, may return stale data, examples Cassandra (high availability across data centers, eventual consistency) and DynamoDB (key-value with eventual consistency), use cases: social media feeds, shopping carts, IoT telemetry"
        caption="Figure 3: AP systems, answer every request, even if the answer is briefly stale."
      />

      <List delay={0.9}>
        <ListItem><strong>Apache Cassandra:</strong> has no single primary node. Every node can accept reads and writes at any time. During a partition, all nodes stay operational independently. Conflicts that arise when two sides accepted different writes for the same key are resolved using timestamps and anti-entropy repair processes. Cassandra offers tunable consistency, you can require more replicas to acknowledge a write, but its default philosophy is "always be available." Large-scale user activity feeds, messaging systems, and time-series data are natural fits: a slightly stale feed item is invisible to users, a failed write is not.</ListItem>
        <ListItem><strong>Amazon DynamoDB:</strong> built on the principles of Amazon's Dynamo paper, explicitly designed for an "always-on" shopping cart that must accept writes even during regional failures. DynamoDB replicates data across multiple availability zones and continues serving under partial failures, with eventual consistency as the default read model (strongly consistent reads are available as an option, at higher latency cost). Shopping carts, user preferences, and session data are the archetypal use cases: it's better to have a cart that's briefly a few seconds stale than one that refuses to add items during an outage.</ListItem>
        <ListItem><strong>DNS:</strong> a global AP system by design. DNS servers always respond to queries, if one nameserver is unreachable, another answers. Updated DNS records propagate across the network over minutes to hours. During that propagation window, different resolvers return different IPs for the same domain. The system prioritizes availability (always answer) over instant consistency (everyone agrees on the latest record immediately).</ListItem>
      </List>

      <Heading level={2} delay={0.95}>
        CA: Theoretically Consistent and Available, but Not Distributed
      </Heading>

      <Paragraph delay={1.0}>
        A CA system provides consistency and availability but does not tolerate partitions. In practice, this means the "system" is a single machine or a tightly coupled cluster where network partitions simply can't happen, because all components share the same failure domain. A single-node PostgreSQL instance is CA: it's consistent (ACID transactions), available (when the node is up), and doesn't need partition tolerance because there's nothing to partition. The moment you distribute data across multiple independent machines, you're back to needing P, and thus facing the CP vs. AP choice. Pure CA distributed systems are a theoretical category, not a practical one.
      </Paragraph>

      <Heading level={2} delay={1.05}>
        Beyond CAP: The PACELC Theorem
      </Heading>

      <Paragraph delay={1.1}>
        CAP has a blind spot: it only describes system behavior during a partition. What about when everything is working fine? Daniel Abadi's PACELC theorem, introduced around 2010, fills that gap.
      </Paragraph>

      <Paragraph delay={1.15}>
        PACELC states: if a Partition (P) occurs, choose between Availability (A) and Consistency (C), this is CAP. Else (E), when the system is healthy, choose between Latency (L) and Consistency (C). Even without failures, there's a tension between responding quickly (low latency) and ensuring data is fully synchronized across all replicas before responding (strong consistency). Waiting for three replicas to acknowledge a write is consistent, returning the answer from the fastest single replica is fast.
      </Paragraph>

      <BlogImage
        delay={1.17}
        size="lg"
        src="/blog/cap/PACELC.png"
        alt="PACELC theorem: if partition (P) → choose CP (consistency, reject requests) or AP (availability, may return stale data), else if no partition (E) → choose Lower Latency (faster responses, possible stale data) or Consistency (stronger guarantees, potentially slower), examples low-latency systems vs high-consistency systems"
        caption="Figure 4: PACELC, CAP's blind spot filled in. Even with no partition, every read is a latency-vs-consistency choice."
      />

      <List delay={1.2}>
        <ListItem><strong>Cassandra (PA/EL):</strong> available under partition, low latency under normal operation. Writes complete as soon as enough replicas acknowledge, without waiting for full cross-cluster synchronization. Fast responses, eventual consistency. Fits PACELC's PA/EL classification.</ListItem>
        <ListItem><strong>MongoDB (PC/EC):</strong> consistent under partition (halts writes to avoid dual primaries), and consistent under normal operation (routes all writes through one primary, replicates synchronously). Trades some latency for strong consistency at all times. PC/EC in PACELC notation.</ListItem>
        <ListItem><strong>Google Spanner (PC/EC):</strong> a globally distributed SQL database that achieves strong consistency using synchronized atomic clocks (TrueTime). Technically a CP system, it will sacrifice availability during major partitions, but Google's infrastructure makes partitions rare and short-lived, so in practice it behaves like a CA system. Spanner accepts higher transaction latency (waiting out clock uncertainty intervals) in exchange for strong consistency globally. PC/EC: consistent during partitions and consistent in normal operation.</ListItem>
      </List>

      <Paragraph delay={1.25}>
        PACELC adds a practical dimension CAP misses: even a perfectly healthy distributed system must decide whether each operation waits for full replication (more consistent, more latency) or returns fast (lower latency, possibly stale). That tradeoff exists on every request, not just during failures.
      </Paragraph>

      <Heading level={2} delay={1.3}>
        Takeaways
      </Heading>

      <List delay={1.35}>
        <ListItem>CAP theorem: a distributed system can guarantee at most two of Consistency, Availability, and Partition Tolerance. Because partitions are inevitable, the real choice is between C and A when a partition occurs.</ListItem>
        <ListItem>CP systems (ZooKeeper, MongoDB) prioritize data integrity. They refuse requests rather than risk inconsistency. Right for financial systems, leader election, and critical configuration where stale data causes harm.</ListItem>
        <ListItem>AP systems (Cassandra, DynamoDB, DNS) prioritize uptime. They serve requests from all nodes during a partition, accepting temporary divergence. Right for social feeds, shopping carts, caches, and any context where brief staleness is acceptable.</ListItem>
        <ListItem>CA is not a real distributed systems category, it's a single-node or perfectly reliable network scenario. Real distributed systems must tolerate partitions.</ListItem>
        <ListItem>PACELC extends CAP to the no-partition case: even under normal operation, systems choose between latency and consistency. Every write that waits for full replication is a consistency-favoring latency tradeoff. Every write that returns on the first acknowledgment is a latency-favoring consistency tradeoff.</ListItem>
        <ListItem>The right choice depends on your application. "Banking app or social feed?" is a useful mental model. If incorrect data causes real harm, choose CP. If downtime causes more harm than stale data, choose AP.</ListItem>
      </List>

      <Paragraph delay={1.4}>
        CAP is one of those concepts that feels abstract until you're on call at 2am watching a network partition unfold and realizing your system's design already made the choice for you. Understanding that choice, and why it was made, is the difference between debugging confidently and guessing. Thanks for reading.
      </Paragraph>
    </>
  ),
};
