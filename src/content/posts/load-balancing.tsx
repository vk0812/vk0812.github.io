import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  BlogImage,
  InlineCode,
  List,
  ListItem,
} from "../components";

export const loadBalancing: BlogPostData = {
  title: "Load Balancing",
  date: "May 25, 2026",
  slug: "load-balancing",
  content: (
    <>
      <Paragraph delay={0.1}>
        It's Friday night. Your app is running on 50 servers. Server 3 quietly dies from a memory leak. If each server has a public IP and clients know them directly, 2% of your users just hit a dead end. They see a spinner, give up, and go somewhere else. With a load balancer in front of that fleet, the load balancer detects the failed health check in seconds, pulls Server 3 from rotation, and redistributes its traffic. Nobody notices.
      </Paragraph>

      <Paragraph delay={0.15}>
        That's the core promise of load balancing: make your backend's internal state invisible to users. This post covers what load balancers are, how they work, the algorithms that drive them, and when to reach for which one.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        What is a Load Balancer?
      </Heading>

      <Paragraph delay={0.25}>
        A load balancer sits between clients and your backend servers. Clients talk to the load balancer's address, the load balancer decides which server handles each request. The backend is invisible from the outside. There's also a second job the load balancer runs continuously: health monitoring. It periodically pings each server (typically a GET to <InlineCode>/health</InlineCode>), and any server that fails to return a valid response gets removed from rotation until it recovers.
      </Paragraph>

      <BlogImage
        delay={0.3}
        size="md"
        src="/blog/load_balancing/how_load_balancer_works.png"
        alt="Load balancer architecture: clients send requests through the load balancer, which routes traffic across healthy backend servers (Server 01–04) while health monitoring marks Server 04 as unhealthy and excludes it from rotation"
        caption="Figure 1: The load balancer sits between clients and servers. Server 04 fails its health check and is dropped from rotation until it recovers."
      />

      <Paragraph delay={0.35}>
        You can place load balancers at multiple layers. Between users and your web servers (internet-facing). Between web servers and your application or cache layer (internal). Between the application layer and your database. Each tier independently handles traffic distribution and failure detection.
      </Paragraph>

      <BlogImage
        delay={0.4}
        src="/blog/load_balancing/key_functions.png"
        alt="Key functions of a load balancer: traffic distribution, health monitoring, failure handling, and high availability"
        caption="Figure 2: A load balancer is more than a router, it monitors health, removes bad nodes, and keeps the fleet available."
      />

      <Heading level={2} delay={0.45}>
        How it Works
      </Heading>

      <Paragraph delay={0.5}>
        Every request follows the same path:
      </Paragraph>

      <List ordered delay={0.55}>
        <ListItem>Client sends a request. The load balancer receives it.</ListItem>
        <ListItem>The load balancer picks a backend server using its configured algorithm, considering factors like active connections, response times, or a simple counter.</ListItem>
        <ListItem>The request is forwarded to that server.</ListItem>
        <ListItem>The server processes it and sends a response back to the load balancer.</ListItem>
        <ListItem>The load balancer forwards the response to the client.</ListItem>
      </List>

      <Paragraph delay={0.6}>
        Step 2 is where all the interesting decisions happen. The algorithm determines what "pick a server" actually means.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        Load Balancing Algorithms
      </Heading>

      <Paragraph delay={0.7}>
        Algorithms fall into three categories. Static methods distribute traffic without looking at server state. Dynamic methods react to live load metrics in real time. Persistence-based methods route a specific client to a specific server every time.
      </Paragraph>

      <BlogImage
        delay={0.75}
        size="lg"
        src="/blog/load_balancing/common_algos.png"
        alt="Common load balancing algorithms: Round Robin (sequential), Least Connections (fewest active), IP Hash (route by client IP), Weighted Round Robin (by capacity weight), Least Response Time (lowest latency)"
        caption="Figure 3: The five algorithms you'll see in every load balancer config. Each one optimizes for a different signal."
      />

      <Heading level={3} delay={0.8}>
        Static Methods
      </Heading>

      <BlogImage
        delay={0.82}
        size="lg"
        src="/blog/load_balancing/static_methods.png"
        alt="Static methods illustrated: Round Robin cycles servers in order, Weighted Round Robin assigns proportionally to server weights, Random picks any server uniformly"
        caption="Figure 4: Static algorithms, Round Robin, Weighted Round Robin, and Random. No live server state required."
      />

      <Heading level={4} delay={0.85}>
        Round Robin
      </Heading>

      <List delay={0.9}>
        <ListItem>Cycles through servers in fixed order: S1, S2, S3, back to S1. Every server gets an equal turn regardless of current load.</ListItem>
        <ListItem>Best for homogeneous fleets where servers are identical and requests cost roughly the same.</ListItem>
        <ListItem>Completely load-blind: a server at 90% CPU still gets its turn in rotation.</ListItem>
      </List>

      <Heading level={4} delay={0.95}>
        Weighted Round Robin
      </Heading>

      <List delay={1.0}>
        <ListItem>Assigns requests proportionally by weight: a server with weight 5 handles 5 requests for every 2 that a weight-2 server handles.</ListItem>
        <ListItem>Good for heterogeneous fleets where servers have different processing capacities.</ListItem>
        <ListItem>Weights are static and don't adapt if a server's performance degrades over time.</ListItem>
      </List>

      <Heading level={4} delay={1.05}>
        Random
      </Heading>

      <List delay={1.1}>
        <ListItem>Picks a server at random for each request. Statistically equivalent to Round Robin over time.</ListItem>
        <ListItem>Zero state: no counter to maintain, no coordination needed between load balancer instances.</ListItem>
        <ListItem>Can cause short-term imbalance since there's no guarantee of even distribution in small windows.</ListItem>
      </List>

      <Heading level={3} delay={1.15}>
        Dynamic Methods
      </Heading>

      <BlogImage
        delay={1.17}
        size="lg"
        src="/blog/load_balancing/dynamic_methods.png"
        alt="Dynamic methods illustrated: Least Connections routes to the server with fewest active connections, Least Response Time picks the fastest responder, Custom Load uses CPU/memory metrics"
        caption="Figure 5: Dynamic algorithms react to live server state, connections, response time, or custom metrics."
      />

      <Heading level={4} delay={1.2}>
        Least Connections
      </Heading>

      <List delay={1.25}>
        <ListItem>Routes each new request to the server with the fewest active connections at that moment (e.g., Server 2 with 4 connections over Server 1 with 12).</ListItem>
        <ListItem>Right for variable-duration requests: file uploads, streaming, long database queries where Round Robin would pile work onto already-busy servers.</ListItem>
        <ListItem>Requires the load balancer to track active connection counts, more overhead than static methods.</ListItem>
      </List>

      <Heading level={4} delay={1.3}>
        Weighted Least Connections
      </Heading>

      <List delay={1.35}>
        <ListItem>Combines capacity weights (from Weighted Round Robin) with real-time connection tracking (from Least Connections).</ListItem>
        <ListItem>Higher-weight servers get proportionally more traffic, but distribution still adjusts to live connection counts.</ListItem>
        <ListItem>Most accurate for heterogeneous fleets, but highest bookkeeping overhead of the dynamic methods.</ListItem>
      </List>

      <Heading level={4} delay={1.4}>
        Least Response Time
      </Heading>

      <List delay={1.45}>
        <ListItem>Routes to the server with the lowest recent response time, directly optimizing for latency.</ListItem>
        <ListItem>Ideal for latency-critical applications: real-time gaming, financial dashboards, trading systems.</ListItem>
        <ListItem>Response times fluctuate, can trigger frequent rebalancing under volatile load.</ListItem>
      </List>

      <Heading level={4} delay={1.5}>
        Least Bandwidth
      </Heading>

      <List delay={1.55}>
        <ListItem>Routes to the server currently consuming the least bandwidth.</ListItem>
        <ListItem>Best for high-throughput workloads where data volume is the real load metric: video streaming, CDNs, large file transfers.</ListItem>
        <ListItem>Less relevant for API-heavy services where request count matters more than bytes transferred.</ListItem>
      </List>

      <Heading level={4} delay={1.6}>
        Custom Load
      </Heading>

      <List delay={1.65}>
        <ListItem>Define your own metric: CPU usage, memory pressure, disk I/O, or any composite score you compute.</ListItem>
        <ListItem>Use when no standard algorithm captures what "overloaded" means for your specific workload.</ListItem>
        <ListItem>Misconfigured metrics or stale data can make routing decisions actively harmful, instrument carefully.</ListItem>
      </List>

      <Heading level={3} delay={1.7}>
        Persistence-Based Methods
      </Heading>

      <Heading level={4} delay={1.75}>
        IP Hash
      </Heading>

      <List delay={1.8}>
        <ListItem>Hashes the client's IP address to deterministically assign them to a server. Same IP always hits the same server, every request, without the load balancer needing to track session IDs.</ListItem>
        <ListItem>Session persistence for free, useful for stateful applications like shopping carts or user sessions.</ListItem>
        <ListItem>Adding or removing servers reshuffles the hash mapping, so some clients will land on different servers after a scaling event.</ListItem>
      </List>

      <BlogImage
        delay={1.85}
        size="lg"
        src="/blog/load_balancing/persistence_methods.png"
        alt="Persistence-based routing via IP Hash: Client A (1.1.1.1) always lands on S1, Client B (2.2.2.2) always lands on S2, same IP, same server"
        caption="Figure 6: IP Hash, deterministic client-to-server mapping. Same IP always reaches the same server, so sessions stick without external storage."
      />

      <Heading level={2} delay={1.9}>
        Five Core Use Cases
      </Heading>

      <BlogImage
        delay={1.92}
        size="lg"
        src="/blog/load_balancing/benefits.png"
        alt="Five benefits of load balancing: Improved Performance (reduces load, improves response), High Availability (keeps apps running on failure), Scalability (add servers easily), Better Resource Utilization, Fault Tolerance (routes around failures)"
        caption="Figure 7: The five wins from putting a load balancer in front of your fleet."
      />

      <Heading level={3} delay={1.95}>
        High Availability and Fault Tolerance
      </Heading>

      <List delay={2.0}>
        <ListItem>Health checks run continuously, any server that fails its check is removed from rotation instantly and traffic reroutes to the healthy fleet.</ListItem>
        <ListItem>One server dying is an infrastructure event, not a user-facing event.</ListItem>
        <ListItem>Run the load balancer itself in active-active or active-passive configuration so it doesn't become a single point of failure for your entire stack.</ListItem>
      </List>

      <Heading level={3} delay={2.05}>
        Horizontal Scalability
      </Heading>

      <List delay={2.1}>
        <ListItem>Clients only know the load balancer's address, never individual server IPs.</ListItem>
        <ListItem>When a traffic spike hits and your auto-scaling group boots 50 new instances, they register with the load balancer and start taking traffic immediately. No DNS changes, no client reconfiguration.</ListItem>
        <ListItem>The load balancer is the unified entry point that makes your fleet's size invisible to the outside world.</ListItem>
      </List>

      <Heading level={3} delay={2.15}>
        Zero-Downtime Deployments
      </Heading>

      <List delay={2.2}>
        <ListItem>Blue-green deployments: run "blue" (current version) and "green" (new version) pools simultaneously, then shift traffic from 1% to 10% to 100% as confidence grows.</ListItem>
        <ListItem>Catch a critical bug at 1%? Flip back to blue instantly. No downtime, no failed transactions.</ListItem>
        <ListItem>Connection draining lets the load balancer stop sending new requests to a server while existing connections finish naturally, so you can patch servers without cutting live sessions.</ListItem>
      </List>

      <Heading level={3} delay={2.25}>
        Security and DDoS Mitigation
      </Heading>

      <List delay={2.3}>
        <ListItem>Never expose application server IPs directly to the internet. The load balancer acts as a reverse proxy, the internet only ever touches it, your backend stays invisible.</ListItem>
        <ListItem>WAF (Web Application Firewall) rules on the load balancer detect and drop malicious traffic at the edge before it reaches your application logic.</ListItem>
        <ListItem>A SYN flood targeting your login page gets absorbed by the load balancer. Your database never sees it.</ListItem>
      </List>

      <Heading level={3} delay={2.35}>
        SSL Termination
      </Heading>

      <List delay={2.4}>
        <ListItem>TLS handshakes are CPU-intensive. Offloading decryption to the load balancer frees your app servers to spend cycles on actual business logic.</ListItem>
        <ListItem>Clients speak HTTPS to the load balancer, the load balancer speaks HTTP (or lighter encryption) to your backend over the private network.</ListItem>
        <ListItem>A fleet spending 30% of CPU on OpenSSL can drop that overhead to near zero with SSL termination at the load balancer, effectively increasing capacity by a third with no new hardware.</ListItem>
      </List>

      <Heading level={2} delay={2.45}>
        Challenges to Know
      </Heading>

      <Paragraph delay={2.5}>
        Load balancers solve a lot, but they come with their own failure modes. The most important: if you run a single load balancer instance, you've traded N single points of failure for one catastrophic one. Active-active or active-passive load balancer configurations with shared state (via something like etcd, Consul, or Redis) are the standard fix.
      </Paragraph>

      <List delay={2.55}>
        <ListItem><strong>Config complexity:</strong> algorithm choice, health check thresholds, timeout values, and session persistence settings all interact. Misconfiguration is a real and common failure mode.</ListItem>
        <ListItem><strong>Latency overhead:</strong> the load balancer adds a network hop. Usually under 1ms, but worth measuring on latency-critical paths.</ListItem>
        <ListItem><strong>Sticky sessions vs. even distribution:</strong> IP Hash and session persistence can cause load skew if client IPs aren't evenly distributed. You're trading balance for consistency.</ListItem>
        <ListItem><strong>Load balancer scalability:</strong> the load balancer tier itself can become a bottleneck at high enough traffic. Plan for horizontal scaling of the load balancer, not just the backend.</ListItem>
        <ListItem><strong>Cost:</strong> managed load balancer services (AWS ALB, Cloudflare, GCP) add meaningful infrastructure cost at scale. Budget for it.</ListItem>
      </List>

      <Heading level={2} delay={2.6}>
        Takeaways
      </Heading>

      <List delay={2.65}>
        <ListItem>The load balancer decouples clients from individual servers, making your backend's size, health, and deployment state invisible to users.</ListItem>
        <ListItem>Static algorithms (Round Robin, Weighted Round Robin, Random) are simple and low-overhead. Right for homogeneous fleets with uniform request cost.</ListItem>
        <ListItem>Dynamic algorithms (Least Connections, Response Time, Custom Load) react to real server state. Right when request duration varies or server capacities differ.</ListItem>
        <ListItem>Persistence-based routing (IP Hash) gives session stickiness without external session storage, at the cost of possible load skew.</ListItem>
        <ListItem>The load balancer is not just a traffic router: it's your health monitor, deployment tool, security layer, and SSL offloader.</ListItem>
        <ListItem>The load balancer itself needs high availability treatment. An unprotected single instance is a single point of failure for your entire application.</ListItem>
      </List>

      <Paragraph delay={2.7}>
        Load balancing is one of those system design fundamentals that looks obvious until you actually have to configure one for production. The "just distribute traffic evenly" framing glosses over the real decisions: which algorithm fits your workload, how you handle session state, where your load balancer sits in the stack, and how the load balancer itself stays alive. Get those right and the rest of your infrastructure has a much more stable foundation. Thanks for reading.
      </Paragraph>
    </>
  ),
};
