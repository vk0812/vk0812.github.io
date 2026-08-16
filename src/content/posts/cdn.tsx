import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  InlineCode,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  ReplicationDiagram,
  ReplicationPanel,
} from "../components";
import { User, Server, CheckCircle2, Database, Layers } from "lucide-react";

const cdnFlowNodes: DiagramNode[] = [
  { id: "user", label: "User", sub: "requests a page", icon: User, color: "text-slate-500", x: 8, y: 50 },
  { id: "edge", label: "Edge server (PoP)", sub: "checks the local cache", icon: Server, color: "text-blue-500", x: 35, y: 50 },
  { id: "hit", label: "Cache hit", sub: "served immediately", icon: CheckCircle2, color: "text-emerald-500", x: 63, y: 18 },
  { id: "origin", label: "Origin server", sub: "reached only on a cache miss", icon: Database, color: "text-orange-500", x: 63, y: 82 },
  { id: "cached", label: "Cached at edge", sub: "next request served locally", icon: Layers, color: "text-indigo-500", x: 91, y: 82 },
];

const cdnFlowEdges: DiagramEdge[] = [
  { id: "e-user-edge", from: "user", to: "edge" },
  { id: "e-edge-hit", from: "edge", to: "hit" },
  { id: "e-edge-origin", from: "edge", to: "origin" },
  { id: "e-origin-cached", from: "origin", to: "cached" },
];

const pullPushPanels: [ReplicationPanel, ReplicationPanel] = [
  {
    title: "Pull CDN",
    writeLabel: "User requests uncached content",
    fanLabel: "edge fetches from origin on demand",
    nodes: ["Edge A", "Edge B", "Edge C"],
    note: "Setup is minimal, but the first request at each edge pays a fetch penalty.",
  },
  {
    title: "Push CDN",
    writeLabel: "Origin publishes new content",
    fanLabel: "content pushed to every edge upfront",
    nodes: ["Edge A", "Edge B", "Edge C"],
    highlightNodes: [0, 1, 2],
    note: "First request everywhere is already fast, at the cost of more operational work.",
  },
];

export const cdn: BlogPostData = {
  title: "Content Delivery Networks",
  date: "May 26, 2026",
  slug: "cdn",
  content: (
    <>
      <Paragraph delay={0.10}>
        A user in Mumbai opens your website. Your origin server is in Virginia. Without a CDN, that request travels roughly 13,000 kilometers across the Atlantic, hits your server, and the response makes the same trip back. With a CDN, the request hits a PoP in Mumbai, finds the content already cached, and delivers it in about 10ms. No transatlantic trip required. That's the core value of a Content Delivery Network: get content physically closer to the people requesting it.
      </Paragraph>

      <Heading level={2} delay={0.15}>
        How CDNs Work
      </Heading>

      <Paragraph delay={0.20}>
        Every CDN request follows the same flow. A user requests content. DNS or Anycast routing directs that request to the nearest edge server. The edge server checks its cache. Cache hit: content is returned immediately. Cache miss: the edge server fetches the content from the origin server, caches it locally, and returns it to the user. Every subsequent request for that content from that region is served from cache, the origin server never sees it again until the cache expires.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={380}
        nodes={cdnFlowNodes}
        edges={cdnFlowEdges}
        caption="The end-to-end CDN flow. Routing hands the request to the nearest edge, a hit returns right away, a miss goes to origin and backfills the cache for next time."
      />

      <Heading level={2} delay={0.25}>
        Key Concepts
      </Heading>

      <List delay={0.30}>
        <ListItem><strong>Point of Presence (PoP):</strong> a physical data center location in the CDN's distributed network, typically containing multiple edge servers. PoPs are placed in cities and regions with high user density to minimize the distance requests travel.</ListItem>
        <ListItem><strong>Edge server:</strong> a CDN server at a PoP that stores cached content and serves it to nearby users. Edge servers handle the actual delivery, origin servers only get involved on cache misses.</ListItem>
        <ListItem><strong>Origin server:</strong> the source of truth. Hosts the original content. Ideally, the CDN shields it from most traffic, only cache misses and content updates reach it directly.</ListItem>
        <ListItem><strong>TTL (Time to Live):</strong> how long a cached item is considered fresh. When TTL expires, the next request for that content triggers a fresh fetch from the origin. Set too low: frequent origin hits. Set too high: stale content served to users after updates.</ListItem>
        <ListItem><strong>Anycast:</strong> a routing technique where multiple edge servers share a single IP address. When a user sends a request to that IP, the network automatically routes it to the nearest server by network distance. No DNS lookup required to pick a server, the routing infrastructure handles it.</ListItem>
        <ListItem><strong>Cache warming:</strong> proactively loading content into edge server caches before users request it. Useful before a product launch or a flash sale, you don't want the first thousand requests to all be cache misses simultaneously.</ListItem>
        <ListItem><strong>Cache invalidation / purging:</strong> forcibly removing cached content before TTL expires, typically triggered when the origin content changes. Ensures users receive updated content without waiting for natural expiry.</ListItem>
      </List>

      <Heading level={2} delay={0.35}>
        Origin Server vs. Edge Server
      </Heading>

      <Paragraph delay={0.40}>
        The origin server is centralized, one location, all original content. It's the authoritative source but a poor performer for global audiences. Directly serving all user requests from a single Virginia data center means every user in Asia, Europe, and South America is paying a latency penalty proportional to their distance from Virginia.
      </Paragraph>

      <Paragraph delay={0.45}>
        Edge servers are distributed copies, dozens or hundreds of locations, each caching a subset of content relevant to nearby users. A user in Paris hits the Paris PoP. A user in Tokyo hits the Tokyo PoP. Neither waits for Virginia. The origin server's job becomes content management rather than content delivery, it serves edge servers, not end users.
      </Paragraph>

      <Heading level={2} delay={0.50}>
        Routing Mechanisms
      </Heading>

      <Paragraph delay={0.55}>
        Getting a user's request to the right edge server is the CDN's first job. Three main techniques:
      </Paragraph>

      <List delay={0.60}>
        <ListItem><strong>Anycast routing:</strong> all edge servers share a single advertised IP address. BGP routing protocols direct each incoming packet to the topologically nearest server. No application-layer logic required, the network does the selection. Fast, transparent, and excellent for DDoS absorption (attack traffic spreads across all PoPs rather than hitting one server).</ListItem>
        <ListItem><strong>DNS-based routing:</strong> the CDN's DNS server responds to each query with the IP of the best edge server for that user, factoring in geographic proximity, server load, and current health. Flexible and easy to update (change DNS records to shift traffic) but dependent on DNS TTLs and resolver behavior.</ListItem>
        <ListItem><strong>GeoIP-based routing:</strong> the user's IP address is mapped to a geographic location, and the request is routed to the nearest PoP in terms of physical distance. Simple and effective, though physical distance and network latency don't always correlate perfectly.</ListItem>
      </List>

      <Heading level={2} delay={0.65}>
        Cache Management
      </Heading>

      <Paragraph delay={0.70}>
        Caching decisions at edge servers determine freshness, origin load, and user experience. Three levers:
      </Paragraph>

      <List delay={0.75}>
        <ListItem><strong>TTL:</strong> set by the origin server via <InlineCode>Cache-Control</InlineCode> headers. A product image might get a 24-hour TTL, a live sports score might get 5 seconds. TTL selection is the primary tool for balancing cache efficiency against content freshness.</ListItem>
        <ListItem><strong>Cache-Control headers:</strong> the origin communicates caching policy to CDN edge servers and browsers via headers like <InlineCode>Cache-Control: max-age=3600</InlineCode>, <InlineCode>no-cache</InlineCode>, or <InlineCode>immutable</InlineCode>. These headers let the origin retain control over how aggressively content is cached without touching CDN configuration.</ListItem>
        <ListItem><strong>Cache invalidation:</strong> when a product image updates, a new blog post publishes, or a price changes, the CDN needs to know immediately, not after the TTL clock runs out. Invalidation APIs (Cloudflare's purge API, CloudFront's invalidation requests) let you remove specific cache keys or patterns across all PoPs on demand.</ListItem>
        <ListItem><strong>Cache warming:</strong> after a large invalidation or before a high-traffic event, proactively populate edge caches by pre-fetching content. Avoids the cold-start problem where a sudden traffic spike hits empty caches and floods the origin with simultaneous misses.</ListItem>
      </List>

      <Heading level={2} delay={0.80}>
        CDN Network Topologies
      </Heading>

      <List delay={0.85}>
        <ListItem><strong>Flat topology:</strong> every PoP connects directly to the origin server. Simple and low-latency for cache hits. Doesn't scale well, as the CDN grows to hundreds of PoPs, the origin handles connections from all of them, and cache miss traffic grows proportionally.</ListItem>
        <ListItem><strong>Hierarchical topology:</strong> PoPs are organized in tiers. Edge PoPs serve users, regional cache servers sit between edge PoPs and the origin, absorbing cache misses from multiple edge PoPs before they reach the origin. A cache miss at the edge goes to the regional cache first, only if the regional cache also misses does the request hit the origin. Significantly reduces origin load at the cost of slightly more hops on a miss.</ListItem>
        <ListItem><strong>Mesh topology:</strong> edge servers are interconnected and can serve content to each other. A PoP with a cache miss can check neighboring PoPs before falling back to the origin, improving cache hit rates across the network and reducing origin load. Better redundancy, if one PoP goes down, its neighbors absorb traffic and may already have the needed content cached.</ListItem>
        <ListItem><strong>Hybrid topology:</strong> combines elements of the above, tailoring structure to the content type. A CDN might use a hierarchical model for large video files (where tiered caching dramatically reduces origin bandwidth) and a mesh model for dynamic or frequently updated content (where inter-PoP sharing beats a long hierarchical chain).</ListItem>
      </List>

      <Heading level={2} delay={0.90}>
        Pull CDN vs. Push CDN
      </Heading>

      <Paragraph delay={0.95}>
        CDNs differ in how content gets onto edge servers in the first place.
      </Paragraph>

      <ReplicationDiagram delay={0.08} panels={pullPushPanels} />

      <List delay={1.00}>
        <ListItem><strong>Pull CDN:</strong> edge servers fetch content from the origin on demand, the first request for a piece of content triggers the fetch, it's cached, and all subsequent requests are served from cache. Setup is minimal: point the CDN at your origin and let it handle everything. Cache management is automatic. The first user to request uncached content pays a latency penalty while the edge server fetches it. Cloudflare, Fastly, and AWS CloudFront operate as pull CDNs.</ListItem>
        <ListItem><strong>Push CDN:</strong> the content provider explicitly pushes content to CDN edge servers before users request it. Content is distributed to all PoPs proactively, so the first user gets the same fast response as the millionth. Better for large files and infrequently accessed content where you can't rely on organic traffic to warm caches. The tradeoff: more operational complexity (you manage uploads and distribution), higher storage costs (content lives on both origin and edge), and cache management responsibility falls on you. Akamai NetStorage and Rackspace Cloud Files are examples.</ListItem>
      </List>

      <Paragraph delay={1.05}>
        Pull CDNs are the default for most web applications, easy setup, automatic cache management, and the latency penalty on first access is usually acceptable. Push CDNs make sense for video streaming platforms distributing new releases before launch, or for very large assets where you can't afford cache misses during peak traffic.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        Beyond Performance: Security Benefits
      </Heading>

      <List delay={1.15}>
        <ListItem><strong>DDoS protection:</strong> Anycast distribution means attack traffic spreads across hundreds of PoPs globally rather than concentrating on the origin. A 1 Tbps DDoS attack that would overwhelm a single origin server becomes a few Gbps per PoP, well within capacity to absorb and filter.</ListItem>
        <ListItem><strong>WAF (Web Application Firewall):</strong> CDN edge servers inspect incoming requests for malicious patterns, SQL injection, cross-site scripting, bad bots, and drop them before they reach the origin. Security policies enforced at the edge, at global scale.</ListItem>
        <ListItem><strong>TLS termination:</strong> edge servers handle SSL/TLS handshakes. The origin receives unencrypted traffic over the private network between CDN and origin, saving CPU on the origin and enabling the CDN to manage certificate rotation centrally.</ListItem>
        <ListItem><strong>Origin IP masking:</strong> the CDN's edge servers are the only publicly reachable endpoints. The origin server's IP stays private, attackers can't bypass the CDN and attack the origin directly (as long as origin IP isn't leaked elsewhere).</ListItem>
      </List>

      <Heading level={2} delay={1.20}>
        Takeaways
      </Heading>

      <List delay={1.25}>
        <ListItem>CDNs reduce latency by serving content from edge servers close to users, shielding the origin from direct traffic. The core flow: DNS/Anycast routes the user to the nearest PoP, cache hit returns content immediately, cache miss fetches from origin and populates the cache.</ListItem>
        <ListItem>TTL, cache invalidation, and cache warming are the three levers for balancing freshness against origin load. <InlineCode>Cache-Control</InlineCode> headers let the origin retain control without CDN-side configuration changes.</ListItem>
        <ListItem>Hierarchical topologies reduce origin load, mesh topologies improve redundancy and cross-PoP hit rates, flat topologies are simple but don't scale.</ListItem>
        <ListItem>Pull CDNs are simpler to operate and right for most web content. Push CDNs give more control and are better for large or infrequently accessed assets where proactive distribution outweighs the operational overhead.</ListItem>
        <ListItem>Security benefits, DDoS absorption, WAF, TLS termination, origin IP masking, are often as valuable as the performance benefits in production systems.</ListItem>
      </List>

      <Paragraph delay={1.30}>
        CDNs have quietly become load-bearing infrastructure for almost everything on the web. The page you're reading right now, the images on it, the fonts, the JavaScript, all likely served from an edge server. Understanding how they work helps you configure them well, debug cache behavior, and design systems that use them effectively rather than accidentally. Thanks for reading.
      </Paragraph>
    </>
  ),
};
