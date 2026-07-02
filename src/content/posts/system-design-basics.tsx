import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  BlogImage,
  InlineCode,
  List,
  ListItem,
} from "../components";

export const systemDesignBasics: BlogPostData = {
  title: "System Design Basics",
  date: "May 25, 2026",
  slug: "system-design-basics",
  content: (
    <>
      <Paragraph delay={0.1}>
        Every large-scale system you've interacted with, search engines, social feeds, payment processors, is built on the same small set of foundational properties. Not because engineers are uncreative, but because these properties are load-bearing. Get them right and the system survives growth, failure, and change. Get them wrong and no amount of clever architecture saves you.
      </Paragraph>

      <Heading level={2} delay={0.25}>
        Scalability
      </Heading>

      <Paragraph delay={0.3}>
        Scalability is a system's ability to handle more load, more users, more data, without the quality of service degrading. There are two levers: add more machines, or make each machine more powerful.
      </Paragraph>

      <List delay={0.35}>
        <ListItem><strong>Horizontal scaling (scaling out):</strong> add more nodes to the fleet and distribute the workload across them. Easier to do dynamically, you can spin up nodes when traffic spikes and spin them down when it drops. Cassandra and MongoDB are classic examples: adding a node means the cluster automatically redistributes data to it. No downtime, no upper bound on capacity (in theory).</ListItem>
        <ListItem><strong>Vertical scaling (scaling up):</strong> give the existing machine more CPU, RAM, or faster storage. MySQL is the canonical example, you can switch to a bigger instance and get more headroom, but at some point you hit the physical ceiling of what a single machine can have. Vertical scaling also often involves downtime during the upgrade, and the bigger the machine, the more catastrophic a single-node failure becomes.</ListItem>
      </List>

      <Paragraph delay={0.4}>
        In practice, most systems do both: vertically scale individual nodes to a comfortable size, then horizontally scale the fleet. Pure horizontal scaling requires that your application handles distributed state correctly, which is where most of the complexity lives.
      </Paragraph>

      <Heading level={2} delay={0.45}>
        Availability
      </Heading>

      <Paragraph delay={0.5}>
        Availability measures how often a system is operational and accessible. It's usually expressed as a percentage of uptime over a rolling window, the famous "nines": 99.9% means about 8.7 hours of downtime per year, 99.999% means about 5 minutes. High availability doesn't just mean the servers are running. It means the system can handle failure and increased load without users noticing.
      </Paragraph>

      <BlogImage
        delay={0.52}
        src="/blog/system_design_basics/availability.png"
        alt="Availability illustrated: a highly available system stays up and reachable, while an available-but-unreliable one returns wrong data due to hidden bugs"
        caption="Figure 1: Availability measures uptime, but uptime alone doesn't guarantee correctness."
      />

      <Paragraph delay={0.55}>
        The main strategies:
      </Paragraph>

      <List delay={0.6}>
        <ListItem><strong>Redundancy and replication:</strong> duplicate critical components so that if one fails, another takes over. Replicate data across nodes so a single disk failure doesn't mean data loss. This is the most fundamental availability mechanism, it shows up at every layer.</ListItem>
        <ListItem><strong>Load balancing:</strong> distribute traffic so no single server is overwhelmed. A server at 90% capacity has no headroom for failure recovery, a fleet at 40% average load absorbs node failures gracefully.</ListItem>
        <ListItem><strong>Distributed data storage:</strong> store data across multiple locations or data centers. If one site goes down, reads and writes continue from the others. Geographic distribution extends this to entire regions: a data center outage in one continent doesn't take down the service globally.</ListItem>
        <ListItem><strong>Health monitoring and alerting:</strong> continuously check that every component is functioning. Automated alerts let teams respond before users notice. Without health checks, a quietly failing service can go undetected for hours.</ListItem>
        <ListItem><strong>Regular maintenance and updates:</strong> systems that aren't kept current accumulate debt in the form of unpatched vulnerabilities and accumulating bugs. Planned maintenance with zero-downtime deployment patterns (rolling updates, blue-green deployments) keeps systems current without sacrificing availability.</ListItem>
      </List>

      <Heading level={2} delay={0.65}>
        Consistency Models
      </Heading>

      <Paragraph delay={0.7}>
        When data lives on multiple replicas, those replicas can disagree. Consistency models define the rules for when that disagreement is visible and how long it's allowed to persist. Different applications have different tolerances.
      </Paragraph>

      <List delay={0.75}>
        <ListItem><strong>Strong consistency (linearizability):</strong> any read immediately reflects the most recent write. Traditional relational databases like PostgreSQL offer this by default. Every transaction sees a globally consistent view. The cost: higher latency and reduced availability under network partitions.</ListItem>
        <ListItem><strong>Eventual consistency:</strong> all replicas will converge to the same value, but not immediately. Amazon DynamoDB uses this. A write might not be visible to all readers for a few milliseconds or seconds. The payoff: much higher availability and write throughput.</ListItem>
        <ListItem><strong>Read-your-writes consistency:</strong> once you write something, your own subsequent reads reflect that write. Useful for profile updates, the user who just changed their name should see the new name immediately, even if other users see the old one briefly.</ListItem>
        <ListItem><strong>Sequential consistency:</strong> all operations appear in the same global order across all nodes, but that order doesn't have to match real time. Used in distributed logging systems where merge order matters but real-time freshness doesn't.</ListItem>
      </List>

      <Heading level={2} delay={0.8}>
        Latency and Performance
      </Heading>

      <Paragraph delay={0.85}>
        Latency is the time from request to response. Throughput is how many requests per second the system handles. They're related but distinct, a system can have low latency per request but still saturate at low throughput if concurrency isn't handled well.
      </Paragraph>

      <BlogImage
        delay={0.87}
        src="/blog/system_design_basics/efficiency.png"
        alt="Efficiency split into latency (response time per request) and throughput (requests per second)"
        caption="Figure 2: Efficiency has two axes, how fast a single request finishes (latency) and how many fit through per second (throughput)."
      />

      <List delay={0.9}>
        <ListItem><strong>Data locality:</strong> reduce how far data has to travel to reach the processor that needs it. Store related data on the same node (sharding by user ID, for example) so that queries don't require cross-node joins. Replicate hot data closer to users (CDN) so bytes travel fewer hops. Techniques: partitioning, sharding, replication.</ListItem>
        <ListItem><strong>Load balancing:</strong> even distribution of requests prevents any single node from becoming a bottleneck. A system where one server handles 10x the load of the others has effectively reduced its throughput to that server's capacity.</ListItem>
        <ListItem><strong>Caching:</strong> serve frequently accessed data from fast memory instead of fetching it from the database on every request. In-memory caches (Redis) for hot data, CDN caches for static assets, database buffer pools for query results. Caching converts database load into memory reads, orders of magnitude faster. (Covered in depth in the Caching post.)</ListItem>
      </List>

      <Heading level={2} delay={0.95}>
        Concurrency and Coordination
      </Heading>

      <Paragraph delay={1.0}>
        Distributed systems are inherently concurrent: multiple processes read and write shared state simultaneously. Without coordination, you get race conditions, inconsistent reads, and lost updates.
      </Paragraph>

      <List delay={1.05}>
        <ListItem><strong>Concurrency control:</strong> manages simultaneous access to shared data. Locking (only one process modifies a resource at a time), optimistic concurrency control (assume conflicts are rare, detect and roll back on collision), and transactional memory (group operations into atomic transactions) are the main approaches. The tradeoff is always between throughput and consistency.</ListItem>
        <ListItem><strong>Synchronization:</strong> coordinates when concurrent processes execute. Barriers ensure all workers reach a checkpoint before anyone proceeds. Semaphores control access counts. Condition variables let processes wait for specific conditions rather than spinning. Synchronization prevents destructive interference but introduces coordination overhead.</ListItem>
        <ListItem><strong>Coordination services:</strong> tools like Apache ZooKeeper, etcd, and Consul provide distributed primitives (leader election, distributed locks, configuration management, service discovery) as a managed service. Instead of implementing distributed consensus yourself, you delegate it to a battle-tested system. These are the glue that holds service meshes together.</ListItem>
      </List>

      <Paragraph delay={1.1}>
        The key distinction: concurrency control is about data access (who can read/write what), synchronization is about execution timing (when processes run relative to each other). Both are needed in a system with shared state.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        Monitoring and Observability
      </Heading>

      <Paragraph delay={1.2}>
        You can't fix what you can't see. Observability is the property of a system that makes its internal state inferable from external outputs. Monitoring is the practice of continuously checking those outputs.
      </Paragraph>

      <BlogImage
        delay={1.22}
        src="/blog/system_design_basics/manageability.png"
        alt="Manageability covers monitoring, alerting, logging, metrics, and deployment, better visibility plus tooling means faster fixes and higher availability"
        caption="Figure 3: Manageability, the toolchain that makes a system diagnosable, maintainable, and easy to evolve."
      />

      <List delay={1.25}>
        <ListItem><strong>Metrics:</strong> quantitative time-series measurements, latency percentiles, error rates, request throughput, CPU and memory utilization. Tools like Prometheus, Graphite, or InfluxDB collect and store these. Metrics are cheap to produce and easy to aggregate, making them the first signal of something going wrong.</ListItem>
        <ListItem><strong>Distributed tracing:</strong> tracks a single request as it flows through multiple services, recording timing at each hop. Tools like Jaeger, Zipkin, or OpenTelemetry instrument service boundaries. When a request takes 3 seconds and you have 12 microservices, tracing shows you exactly which service ate the 2.8 seconds.</ListItem>
        <ListItem><strong>Logging:</strong> structured event records from every component. Centralizing logs (ELK Stack, Graylog) lets you correlate events across services. Logs provide the narrative that metrics hint at and traces summarize.</ListItem>
        <ListItem><strong>Alerting and anomaly detection:</strong> trigger notifications when metrics cross thresholds or deviate from baselines. Tools like Grafana and PagerDuty route alerts to the right team. Machine learning-based anomaly detection catches problems that don't cross fixed thresholds but are statistically unusual.</ListItem>
        <ListItem><strong>Dashboards:</strong> aggregate metrics, trace data, and log summaries into a unified view. Good dashboards let an on-call engineer understand system health in under 30 seconds. Grafana and Datadog are the common choices.</ListItem>
      </List>

      <Heading level={2} delay={1.3}>
        Resilience and Error Handling
      </Heading>

      <Paragraph delay={1.35}>
        Failures are not edge cases in distributed systems. Network calls fail. Disks die. Services become temporarily unavailable. Resilient systems expect this and handle it gracefully.
      </Paragraph>

      <BlogImage
        delay={1.37}
        src="/blog/system_design_basics/reliability.png"
        alt="Reliability illustrated: a load balancer fronting three service replicas (A-1, A-2, A-3) and a primary/replica database, if one fails, others take over and results stay correct"
        caption="Figure 4: Reliability, end-to-end correctness despite faults, usually via redundancy at every layer."
      />

      <List delay={1.4}>
        <ListItem><strong>Fault tolerance:</strong> continue operating correctly when components fail. Achieved through redundancy at every layer: multiple service replicas, replicated data, redundant network paths. If Service A-2 fails, traffic routes to A-1 and A-3 without user impact.</ListItem>
        <ListItem><strong>Graceful degradation:</strong> when a component fails, serve reduced functionality rather than crashing entirely. Circuit breakers stop forwarding requests to a failing downstream service and return a fallback response. Timeouts prevent one slow dependency from blocking all requests. The user sees a degraded experience instead of an error page.</ListItem>
        <ListItem><strong>Retry and backoff:</strong> automatically retry transient failures with increasing delay between attempts. Exponential backoff with jitter prevents thundering-herd scenarios where all clients retry simultaneously after a brief outage, overwhelming the recovering service.</ListItem>
        <ListItem><strong>Chaos engineering:</strong> intentionally inject failures in production (or a production-like environment) to verify that resilience mechanisms actually work. Netflix's Chaos Monkey randomly terminates instances, Gremlin provides more structured failure injection. If you've never tested your failover, you don't know if it works.</ListItem>
      </List>

      <Heading level={2} delay={1.45}>
        Fault Tolerance vs. High Availability
      </Heading>

      <Paragraph delay={1.5}>
        These terms are often used interchangeably but they describe different design goals and different levels of investment.
      </Paragraph>

      <BlogImage
        delay={1.52}
        src="/blog/system_design_basics/fault_tolerance.png"
        alt="Fault tolerance illustrated: load balancer fronting three service instances A-1, A-2, A-3, if A-2 fails, traffic is routed to A-1 or A-3 and the system stays operational"
        caption="Figure 5: Fault tolerance, keep running when a component dies, via seamless failover to a healthy replica."
      />

      <List delay={1.55}>
        <ListItem><strong>Fault tolerance</strong> means the system continues operating with zero visible interruption during a component failure. No brief blip, no error to the user. Achieved through exact redundancy and automatic seamless failover. Used in aviation, healthcare, and financial transaction systems where even a moment of downtime has severe consequences. More expensive, you're paying for standby capacity that only activates on failure.</ListItem>
        <ListItem><strong>High availability</strong> means the system stays operational and accessible the vast majority of the time. Brief interruptions during recovery are acceptable. Achieved through redundant resources, load balancing, and fast recovery procedures. Used in e-commerce, SaaS applications, and enterprise software. The target is uptime measured in nines (99.9%, 99.99%), not zero downtime.</ListItem>
      </List>

      <Paragraph delay={1.6}>
        The practical difference: fault tolerance is about making failure invisible. High availability is about recovering quickly enough that it barely matters. A fault-tolerant system has no downtime during failure. A highly available system has minimal downtime. Fault tolerance costs more because it requires exact redundant replicas in constant standby. High availability is the pragmatic version for most production systems.
      </Paragraph>

      <Heading level={2} delay={1.65}>
        Takeaways
      </Heading>

      <List delay={1.7}>
        <ListItem>Scalability has two axes: more machines (horizontal) or bigger machines (vertical). Horizontal scales dynamically, vertical hits a ceiling and involves downtime.</ListItem>
        <ListItem>High availability requires redundancy, load balancing, health monitoring, and geographic distribution working together, no single mechanism is sufficient.</ListItem>
        <ListItem>Consistency models are a spectrum. Strong consistency is correct but costly. Eventual consistency is fast but requires the application to tolerate temporary disagreement.</ListItem>
        <ListItem>Latency comes from data distance (locality), uneven load (load balancing), and repeated computation (caching). Fixing any one of these often has outsized impact.</ListItem>
        <ListItem>Observability is not optional at scale. Metrics tell you something is wrong, traces tell you where, logs tell you why.</ListItem>
        <ListItem>Fault tolerance means zero visible interruption during failure. High availability means fast recovery. The right choice depends on your downtime tolerance and budget.</ListItem>
      </List>

      <Paragraph delay={1.75}>
        These aren't independent topics, they interact constantly. A caching layer improves latency but introduces consistency challenges. Horizontal scaling improves availability but complicates concurrency. Geographic distribution improves fault tolerance but makes strong consistency much harder to achieve. Understanding the connections between these properties is what separates a working system from one that works at scale. Thanks for reading.
      </Paragraph>
    </>
  ),
};
