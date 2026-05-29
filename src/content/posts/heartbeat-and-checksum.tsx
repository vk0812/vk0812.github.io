import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  BlogImage,
  InlineCode,
  List,
  ListItem,
} from "../components";

export const heartbeatAndChecksum: BlogPostData = {
  title: "Heartbeat and Checksum",
  date: "May 26, 2026",
  slug: "heartbeat-and-checksum",
  content: (
    <>
      <Paragraph delay={0.1}>
        Two quiet mechanisms keep distributed systems trustworthy: one watches whether nodes are alive, the other watches whether data is intact. Heartbeating is how a system detects that a server has failed before a user request hits it. Checksums are how a system detects that data was corrupted in transit or storage before a client receives it. Neither is glamorous. Both are load-bearing.
      </Paragraph>

      <Paragraph delay={0.15}>
        This post covers how each mechanism works, the failure scenarios they protect against, and how they combine in a complete reliability story. Assumes basic distributed systems familiarity.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        Heartbeat
      </Heading>

      <Paragraph delay={0.25}>
        In a distributed system, servers need to know which other servers are alive and reachable. Without that knowledge, a load balancer might route requests to a crashed node, a coordinator might wait forever for a response that will never come, or a replica set might try to reach a primary that went down five minutes ago.
      </Paragraph>

      <Paragraph delay={0.3}>
        The solution is simple: every server periodically sends a small "I'm alive" message, a heartbeat, to a central health monitor, or directly to a subset of peer servers. The monitor tracks when each server last sent a heartbeat. If a server's heartbeat is missing for longer than a configured timeout, the monitor marks that server as failed and stops routing work to it.
      </Paragraph>

      <Paragraph delay={0.35}>
        The failure detection lifecycle has three states. A healthy node sends heartbeats on schedule and gets acknowledged, status: UP. If a heartbeat doesn't arrive within the timeout window, the monitor moves the node to status: UNKNOWN (the node may be slow, the network may be flaky, or the node may be down, it's not yet certain). If no heartbeat arrives after an additional grace period, the monitor marks the node as FAILED and initiates recovery: traffic is rerouted to healthy nodes, and the replacement process begins.
      </Paragraph>

      <Paragraph delay={0.4}>
        The concrete example from the infographic: a chat application where each chat server sends a heartbeat to the load balancer every two seconds. When Server A stops sending heartbeats, the load balancer waits out the timeout, marks it failed, and routes all new user connections to Server B. Users on Server A may briefly lose connection, nobody lands on a dead server from that point forward.
      </Paragraph>

      <Paragraph delay={0.45}>
        Two topologies exist for heartbeat routing. In a centralized setup, all nodes report to a single health monitor, simple to implement but the monitor itself becomes a single point of failure (so the monitor is typically run with its own redundancy). In a decentralized setup, each node randomly selects a subset of peers and sends them heartbeats, no central coordinator, failure information propagates through gossip protocols. Systems like Cassandra and DynamoDB use gossip-based failure detection.
      </Paragraph>

      <BlogImage
        delay={0.5}
        size="md"
        src="/blog/heartbeat_checksum/heartbeat.png"
        alt="Heartbeat mechanism: each node periodically sends a small 'I'm alive' message to a central monitor, three-state lifecycle, Healthy (heartbeats every 2s, status: UP), Missed Heartbeats (monitor doesn't receive expected heartbeat, status: UNKNOWN), Node Marked Failed (monitor confirms node down, reroutes traffic, status: FAILED)"
        caption="Figure 1: Heartbeat, periodic 'I'm alive' signal with a three-state failure detection lifecycle."
      />

      <Heading level={2} delay={0.55}>
        Checksum
      </Heading>

      <Paragraph delay={0.6}>
        Data corruption is a fact of life in distributed systems. Storage hardware develops bad sectors. Network packets get flipped bits. Software bugs introduce subtle data mangling. A node might fetch data from a replica and receive something that looks like valid bytes but is silently wrong. Without a mechanism to detect this, the client receives corrupted data and has no way to know.
      </Paragraph>

      <Paragraph delay={0.65}>
        Checksums address this by attaching a compact fingerprint to every piece of data. A cryptographic hash function, SHA-256 is the standard choice for data integrity, MD5 and SHA-1 are older alternatives that are faster but weaker, takes the raw data as input and produces a fixed-length string of hexadecimal characters. SHA-256 always produces exactly 64 hex characters regardless of input size: a 1-byte file and a 1-terabyte file both produce a 64-character checksum. The same input always produces the same checksum. A different input, even a single flipped bit, produces a completely different checksum.
      </Paragraph>

      <Paragraph delay={0.7}>
        The flow:
      </Paragraph>

      <List ordered delay={0.75}>
        <ListItem>Data is written. The system computes <InlineCode>SHA-256(data)</InlineCode> and stores the checksum alongside the data.</ListItem>
        <ListItem>Data is retrieved. The client receives both the data and the stored checksum.</ListItem>
        <ListItem>The client recomputes <InlineCode>SHA-256(received_data)</InlineCode> and compares it to the stored checksum.</ListItem>
        <ListItem>Match: data is intact. Mismatch: data is corrupted, the client rejects it and fetches from a healthy replica instead.</ListItem>
      </List>

      <Paragraph delay={0.8}>
        File download is the most familiar example. When you download a large file, the provider publishes its SHA-256 checksum. After download, you recompute the checksum locally. If they match, the download is clean. If they don't, the file is corrupted, incomplete download, bit flip in transit, or (in security contexts) tampered content.
      </Paragraph>

      <BlogImage
        delay={0.82}
        size="md"
        src="/blog/heartbeat_checksum/checksum.png"
        alt="Checksum verification process: data passed through SHA-256 hash function produces a fixed-length fingerprint stored or transmitted alongside the data, on retrieval the receiver recomputes the SHA-256 and compares, match means data intact, mismatch means corruption detected"
        caption="Figure 2: Checksum flow, hash on write, recompute on read, compare for corruption."
      />

      <Heading level={2} delay={0.85}>
        Where Checksums Are Used
      </Heading>

      <List delay={0.9}>
        <ListItem><strong>Data integrity in transit:</strong> every data transfer between nodes in a distributed system can attach a checksum. If the receiving node's recomputed checksum doesn't match, the data packet is rejected and the transfer retried from a healthy source.</ListItem>
        <ListItem><strong>Stored data verification:</strong> databases periodically recompute checksums of stored blocks and compare against stored values. A mismatch indicates silent storage corruption, the kind that doesn't trigger a disk error but silently returns wrong data on reads.</ListItem>
        <ListItem><strong>Networking:</strong> TCP and UDP include checksums in packet headers for exactly this reason. Corrupted packets are detected and dropped, TCP requests retransmission, UDP leaves it to the application.</ListItem>
        <ListItem><strong>Deduplication:</strong> storage systems use checksums to detect duplicate content. If two files produce the same checksum, they are (with overwhelming probability) identical, the system stores only one copy and references it from both locations.</ListItem>
        <ListItem><strong>Password storage:</strong> systems store a hash of the password rather than the password itself. On login, the system hashes the entered password and compares it to the stored hash. A match confirms the correct password without ever storing the plaintext. (Note: password hashing uses specialized slow hash functions like bcrypt or Argon2, not SHA-256, to resist brute-force attacks.)</ListItem>
        <ListItem><strong>Software distribution:</strong> OS packages, container images, and firmware updates publish checksums so recipients can verify they received exactly what the publisher signed. If the checksum doesn't match, the installation is aborted, corrupted package or tampered download.</ListItem>
      </List>

      <Heading level={2} delay={0.95}>
        Heartbeat and Checksum Together
      </Heading>

      <Paragraph delay={1.0}>
        The two mechanisms address orthogonal failure modes but compose naturally in a complete system. Consider a distributed file storage service:
      </Paragraph>

      <List ordered delay={1.05}>
        <ListItem>Each storage node sends heartbeats to the health monitor every few seconds.</ListItem>
        <ListItem>The monitor tracks node health and routes requests only to nodes marked UP.</ListItem>
        <ListItem>When data is written to a healthy node, a SHA-256 checksum is computed and stored alongside it.</ListItem>
        <ListItem>When a client retrieves data, it recomputes the checksum. A mismatch means the data on this node is corrupted, the client fetches from a different healthy replica.</ListItem>
      </List>

      <Paragraph delay={1.1}>
        Heartbeat handles the availability problem: nodes that are down don't receive requests. Checksum handles the integrity problem: data that is corrupted is detected and not served. Together: the system is available (only healthy nodes serve traffic) and the data those nodes serve is honest (corruption is detected before it reaches the client).
      </Paragraph>

      <BlogImage
        delay={1.13}
        size="lg"
        src="/blog/heartbeat_checksum/quickref.png"
        alt="Quick reference comparing Heartbeat and Checksum: Heartbeat (periodic liveness signal, missed heartbeats mean failed node, enables failover, focus on Availability) vs Checksum (hash function applied to data, stored/transmitted, recompute and compare to detect corruption, focus on Integrity)"
        caption="Figure 3: Quick reference, heartbeat protects availability, checksum protects integrity."
      />

      <Heading level={2} delay={1.15}>
        Takeaways
      </Heading>

      <List delay={1.2}>
        <ListItem>Heartbeating detects node failures by monitoring periodic liveness signals. Missed heartbeat beyond a timeout threshold triggers failover. The system stops routing to failed nodes before users hit them.</ListItem>
        <ListItem>Two heartbeat topologies: centralized (all nodes report to a monitor) and decentralized/gossip (nodes report to random peers). Gossip removes the monitor as a single point of failure.</ListItem>
        <ListItem>Checksums detect data corruption by attaching a hash fingerprint at write time and recomputing it at read time. SHA-256 is the standard for general data integrity. A mismatch means the data is corrupted, the client fetches from another replica.</ListItem>
        <ListItem>Checksums apply beyond data transit: stored data verification, deduplication, networking (TCP/UDP packet validation), software distribution, and password storage all rely on the same fingerprint-and-compare principle.</ListItem>
        <ListItem>Heartbeat ensures the system is available. Checksum ensures the data is correct. Neither replaces the other, a system that's alive but serving corrupted data is still broken.</ListItem>
      </List>

      <Paragraph delay={1.25}>
        These two mechanisms are the kind of thing you don't notice when they're working, which is exactly the point. A chat server fails silently, traffic routes to the next one, nobody's session drops. A storage node returns a bad checksum, the client retries from a replica, nobody sees corrupt data. The unglamorous infrastructure that makes distributed systems feel reliable. Thanks for reading.
      </Paragraph>
    </>
  ),
};
