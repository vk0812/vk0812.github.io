import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  BlogImage,
  InlineCode,
  Formula,
  List,
  ListItem,
} from "../components";

export const quorum: BlogPostData = {
  title: "Quorum",
  date: "May 26, 2026",
  slug: "quorum",
  content: (
    <>
      <Paragraph delay={0.1}>
        When a database replicates data across five nodes, which nodes does a write need to reach before it's considered committed? When a client reads, which nodes does it need to query to be sure it's getting the latest value and not a stale copy from a lagging replica? These questions don't have a single right answer, but they have a principled framework: quorum.
      </Paragraph>

      <Paragraph delay={0.15}>
        A quorum is the minimum number of nodes that must participate in an operation for that operation to be considered successful. Getting quorum right is what separates a distributed system that reliably serves consistent data from one that silently returns stale reads or splits into a "split-brain" where two halves believe different things are true.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        The Core Problem
      </Heading>

      <Paragraph delay={0.25}>
        Replication gives you fault tolerance: if one node dies, others have the data. But it introduces a new problem, consistency. Consider three replicas R1, R2, R3. A client writes value <InlineCode>v1</InlineCode> to R1. Before that write propagates to R2 and R3, a second client reads from R2. It gets the old value. The data exists on all three nodes, but the clients see different versions. The write succeeded, but the system is inconsistent.
      </Paragraph>

      <Paragraph delay={0.3}>
        Quorum solves this by ensuring writes and reads overlap: if a write must reach enough nodes, and a read must query enough nodes, then at least one node in every read has seen the most recent write. The client always gets the latest value, regardless of which replica it happens to contact.
      </Paragraph>

      <BlogImage
        delay={0.35}
        src="/blog/quorum/quorumrule.png"
        alt="Quorum rule: W + R > N where W is write quorum (minimum nodes to ack a write), R is read quorum (minimum nodes to ack a read), N is total replicas, majority-based quorum is N/2 + 1, example with N=5, W=3, R=3, check W+R = 6 > N=5 ✓"
        caption="Figure 1: The W + R > N rule. When it holds, every read overlaps at least one node that has the latest write."
      />

      <Heading level={2} delay={0.4}>
        The Quorum Rule
      </Heading>

      <Paragraph delay={0.45}>
        The rule that guarantees consistency is:
      </Paragraph>

      <Formula block delay={0.5}>
        {`W + R > N`}
      </Formula>

      <Paragraph delay={0.55}>
        Where <Formula>{`N`}</Formula> is the total number of replicas, <Formula>{`W`}</Formula> is the minimum number of nodes that must acknowledge a write before it's considered committed, and <Formula>{`R`}</Formula> is the minimum number of nodes that must respond to a read before it's considered complete. When <Formula>{`W + R > N`}</Formula>, the write set and read set must overlap, at least one node has seen the latest write and will be included in every valid read. Any read will always see at least one copy of the most recent write.
      </Paragraph>

      <Paragraph delay={0.6}>
        The majority quorum is the most common choice for both reads and writes:
      </Paragraph>

      <Formula block delay={0.65}>
        {`\\text{Majority} = \\left\\lfloor \\frac{N}{2} \\right\\rfloor + 1`}
      </Formula>

      <Paragraph delay={0.7}>
        For a 5-node cluster: majority = 3. With W=3 and R=3: <Formula>{`W + R = 6 > 5`}</Formula>. The check passes, reads and writes are guaranteed to overlap on at least nodes 2 and 3 in the diagram, so every read sees the latest write.
      </Paragraph>

      <BlogImage
        delay={0.72}
        src="/blog/quorum/howitworks.png"
        alt="How quorum works: Write (W=3) writes to any 3 nodes (e.g., nodes 1, 2, 3), Read (R=3) reads from any 3 nodes (e.g., nodes 2, 3, 4), overlap on nodes 2 and 3 ensures the read sees the most recent write"
        caption="Figure 2: Write set ∩ Read set ≠ ∅, the overlap is what makes the latest write visible to every read."
      />

      <Heading level={2} delay={0.75}>
        Choosing N, W, and R
      </Heading>

      <Paragraph delay={0.8}>
        N should be odd. In a 5-node cluster, majority is 3, the system tolerates 2 node failures. In a 4-node cluster, majority is still 3, but now you can only tolerate 1 failure. Adding a fifth node doesn't cost extra in failure tolerance math but gives you an additional node to fail before losing quorum. Odd numbers give you clean majority arithmetic, even numbers add an ambiguous "tie" case.
      </Paragraph>

      <Paragraph delay={0.85}>
        Different W and R values produce different consistency and performance profiles:
      </Paragraph>

      <BlogImage
        delay={0.87}
        src="/blog/quorum/example.png"
        alt="Example quorum scenarios for N=5: Strong Consistency (W=3, R=3 → W+R=6>5), High Write Availability (W=2, R=4 → W+R=6>5, faster writes), High Read Availability (W=4, R=2 → W+R=6>5, reads fast), Invalid (W=2, R=2 → W+R=4≤5, no overlap guarantee)"
        caption="Figure 3: Four W/R configurations for N=5. The last one is invalid, it violates W+R>N."
      />

      <List delay={0.9}>
        <ListItem><strong>W=3, R=3 (N=5):</strong> strong consistency, good fault tolerance. Every read overlaps with every write. Higher latency, you wait for 3 acknowledgments. <Formula>{`W + R = 6 > 5`}</Formula> ✓</ListItem>
        <ListItem><strong>W=2, R=4 (N=5):</strong> fast writes, reads need more nodes. Writes complete quickly, reads are more expensive. Still satisfies the rule: <Formula>{`W + R = 6 > 5`}</Formula> ✓</ListItem>
        <ListItem><strong>W=4, R=2 (N=5):</strong> slow writes (need 4 acknowledgments), fast reads (only need 2). Good for read-heavy workloads where write throughput isn't the bottleneck. <Formula>{`W + R = 6 > 5`}</Formula> ✓</ListItem>
        <ListItem><strong>W=1, R=3 (N=3):</strong> fast writes, slow reads, low durability. A write completes on a single node, if that node fails before replicating, the write is lost. Low durability despite satisfying <Formula>{`W + R = 4 > 3`}</Formula>.</ListItem>
        <ListItem><strong>W=2, R=2 (N=5):</strong> invalid configuration. <Formula>{`W + R = 4 <= 5`}</Formula>. No overlap guarantee, reads can return stale data. The rule is violated.</ListItem>
      </List>

      <Paragraph delay={0.95}>
        In most applications, reads outnumber writes significantly. The practical sweet spot is to minimize read quorum (faster reads) while maintaining a write quorum high enough to ensure durability. A common configuration: W=2, R=2 with N=3 (which satisfies <Formula>{`W + R = 4 > 3`}</Formula>).
      </Paragraph>

      <Heading level={2} delay={1.0}>
        The Trade-off Axis
      </Heading>

      <BlogImage
        delay={1.02}
        src="/blog/quorum/tradeoffs.png"
        alt="Quorum trade-offs: Higher Quorum offers better durability, stronger consistency, but higher latency and lower availability, Lower Quorum offers lower latency and higher availability but risk of stale reads and weaker consistency"
        caption="Figure 4: Higher quorum → safer but slower. Lower quorum → faster but risk of staleness."
      />

      <List delay={1.05}>
        <ListItem><strong>Higher quorum</strong> (larger W and R): better durability, stronger consistency, higher latency per operation, lower availability (requires more nodes to be up to satisfy quorum). Right for financial systems, leader election, critical configuration, anywhere incorrect data is worse than slow or unavailable data.</ListItem>
        <ListItem><strong>Lower quorum</strong> (smaller W and R, still satisfying W+R{">"}N): lower latency, higher availability, risk of stale reads if configured incorrectly, weaker consistency. Right for read-heavy systems where performance matters and brief staleness is acceptable.</ListItem>
      </List>

      <Heading level={2} delay={1.1}>
        Quorum in Distributed Databases
      </Heading>

      <Paragraph delay={1.15}>
        Consider a bank balance stored across 5 replicas. A client writes <InlineCode>balance = 100</InlineCode> with W=3: the write must reach nodes 1, 2, and 3 before committing. A second client reads with R=3: it queries nodes 2, 3, and 4. Nodes 2 and 3 both participated in the write, they have <InlineCode>balance = 100</InlineCode>. The overlap guarantees the read returns the correct value even though node 4 may not have received the write yet.
      </Paragraph>

      <BlogImage
        delay={1.17}
        src="/blog/quorum/inaction.png"
        alt="Quorum in action, distributed database with N=5 replicas: Write (W=3) updates balance=100 on nodes 1, 2, 3, Read (R=3) gets latest balance from nodes that overlap with the write, via node 2 or 3 the read always sees the latest data"
        caption="Figure 5: A bank balance write on 3 of 5 replicas, any 3-of-5 read intersects the write set and returns the latest value."
      />

      <Paragraph delay={1.2}>
        Cassandra implements exactly this model with tunable consistency levels. <InlineCode>QUORUM</InlineCode> consistency level means the operation must succeed on a majority of replicas. <InlineCode>ALL</InlineCode> means every replica must acknowledge. <InlineCode>ONE</InlineCode> means a single replica suffices. The application chooses per-operation based on its consistency requirements.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        Quorum in Consensus Algorithms
      </Heading>

      <Paragraph delay={1.3}>
        Consensus algorithms, Paxos, Raft, Zab (used by ZooKeeper), all rely on quorum as their core safety mechanism.
      </Paragraph>

      <BlogImage
        delay={1.32}
        src="/blog/quorum/consensusalgos.png"
        alt="Quorum in consensus algorithms: Paxos uses majority accept for a value to be chosen, Raft uses majority confirm for leader election and log replication, quorum is the backbone of reliable and consistent distributed systems"
        caption="Figure 6: Paxos and Raft both lean on majority quorum as their core safety guarantee."
      />

      <List delay={1.35}>
        <ListItem><strong>Paxos:</strong> a proposer must get a majority of nodes to accept a value before it can be chosen. No value can be chosen without a quorum accepting it, and no two conflicting values can both achieve quorum (since majority sets always overlap), so the system can never commit two different values for the same round.</ListItem>
        <ListItem><strong>Raft:</strong> a leader is elected only when a majority of nodes vote for it, quorum prevents two leaders existing simultaneously (split-brain). Log entries are committed only after a majority of followers acknowledge replication. Leader election and log replication both use the same majority quorum property.</ListItem>
      </List>

      <Paragraph delay={1.4}>
        This is why ZooKeeper requires a majority quorum to function, discussed in the CAP theorem post. If fewer than a majority of nodes are reachable, ZooKeeper stops accepting operations. No quorum, no decisions. It's not a bug, it's the guarantee.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Challenges
      </Heading>

      <List delay={1.5}>
        <ListItem><strong>Network partitions:</strong> a partition that splits the cluster below quorum size makes the system unavailable on the minority side (which is the correct behavior to avoid split-brain, but it means operations stall until the partition heals).</ListItem>
        <ListItem><strong>Latency overhead:</strong> waiting for W or R acknowledgments adds latency proportional to the slowest responding node in the quorum set. In geographically distributed clusters, this can be significant.</ListItem>
        <ListItem><strong>Configuration complexity:</strong> choosing N, W, and R that balance your consistency, availability, and performance requirements requires understanding your application's actual read/write ratio and failure tolerance needs. Misconfigured quorums silently violate consistency.</ListItem>
      </List>

      <Heading level={2} delay={1.55}>
        Takeaways
      </Heading>

      <List delay={1.6}>
        <ListItem>Quorum is the minimum number of nodes that must participate in an operation for it to count. The rule <Formula>{`W + R > N`}</Formula> guarantees that every read overlaps with the most recent write, no stale reads possible when the rule holds.</ListItem>
        <ListItem>Majority quorum (<Formula>{`\\lfloor N/2 \\rfloor + 1`}</Formula>) is the standard. For N=5, that's 3. With W=3 and R=3, the system tolerates 2 node failures and maintains strong consistency.</ListItem>
        <ListItem>Always use an odd number of nodes. Even numbers don't improve failure tolerance but complicate tie-breaking.</ListItem>
        <ListItem>Higher quorum means stronger consistency and durability at the cost of latency and availability. Lower quorum means faster operations at the cost of potential staleness.</ListItem>
        <ListItem>Paxos and Raft both use majority quorum as their core safety mechanism, it's what prevents split-brain and ensures that only one value can be committed per round of consensus.</ListItem>
      </List>

      <Paragraph delay={1.65}>
        Quorum is the mathematical foundation underneath a lot of distributed systems behavior that might otherwise seem like magic, how ZooKeeper avoids split-brain, how Cassandra lets you tune consistency, how Raft guarantees only one leader. Once you see the W+R{">"}N overlap, the behavior makes sense. Thanks for reading.
      </Paragraph>
    </>
  ),
};
