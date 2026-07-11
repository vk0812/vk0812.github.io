import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  InlineCode,
  List,
  ListItem,
  Formula,
  StatTiles,
  StatItem,
  CapacityMathDiagram,
  CapacityGroup,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  DiagramPhase,
  TrieStructureDiagram,
  TrieTopKDiagram,
  TrieSerializationDiagram,
} from "../components";
import {
  Gauge,
  Search,
  Database,
  Layers,
  Users,
  Waypoints,
  Route,
  Server,
  Zap,
  HardDrive,
  Cloud,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Traffic",
    lines: [
      { expression: "5B searches/day ÷ 86,400s", result: "≈ 58K searches/s" },
      { expression: "58K searches/s × 5 keystrokes", result: "≈ 290K suggestions/s" },
      { expression: "290K suggestions/s × 1.5 peak factor", result: "≈ 435K peak requests/s" },
    ],
    note: "The typeahead service sees more requests than the search service because a user can generate one request per keystroke.",
  },
  {
    title: "Index size",
    lines: [
      { expression: "100M unique terms × 15 characters × 2 bytes", result: "≈ 3 GB of text" },
      { expression: "100M terms × 15 prefixes × 10 refs × 8 bytes", result: "≈ 120 GB of references" },
    ],
    note: "The top-K references cost more than the text itself, but the index is still practical to replicate in memory when it is split across serving machines.",
  },
  {
    title: "Write path",
    lines: [
      { expression: "290K read requests/s", result: "No synchronous trie writes" },
      { expression: "Search events → hourly batch", result: "Frequency table and new snapshot" },
    ],
    note: "A search event is durable input for the ranking pipeline, not a reason to mutate every ancestor node on the latency-sensitive read path.",
  },
  {
    title: "Cache",
    lines: [
      { expression: "20% of 5B searches/day", result: "≈ 1B hot events/day" },
      { expression: "1B × 10 suggestions × 100 bytes", result: "≈ 1 TB/day of response volume" },
    ],
    note: "The cache does not need to hold every prefix. It only needs the popular prefixes that account for a disproportionate share of requests.",
  },
];

const stats: StatItem[] = [
  { label: "Average search rate", value: 58, suffix: "K/s", icon: Search, color: "text-blue-500" },
  { label: "Peak typeahead requests", value: 435, suffix: "K/s", icon: Gauge, color: "text-pink-500" },
  { label: "Unique indexed terms", value: 100, suffix: "M", icon: Database, color: "text-indigo-500" },
  { label: "Suggestions per response", value: 10, suffix: " top-K", icon: Layers, color: "text-teal-500" },
];

const architectureNodes: DiagramNode[] = [
  { id: "client", label: "Clients", icon: Users, color: "text-slate-500", x: 50, y: 6 },
  { id: "lb", label: "Load Balancer", icon: Waypoints, color: "text-blue-500", x: 50, y: 18 },
  { id: "gateway", label: "API Gateway", icon: Route, color: "text-sky-500", x: 50, y: 30 },
  { id: "cdn", label: "CDN", icon: Cloud, color: "text-emerald-500", x: 12, y: 44 },
  { id: "trie", label: "Trie Servers", sub: "read replicas", icon: Server, color: "text-violet-500", x: 34, y: 44 },
  { id: "storage", label: "Storage Servers", sub: "write path", icon: Server, color: "text-pink-500", x: 72, y: 44 },
  { id: "cache", label: "Hot Prefix Cache", sub: "Redis or Memcached", icon: Zap, color: "text-teal-500", x: 34, y: 61 },
  { id: "rawData", label: "Raw Query Data", icon: HardDrive, color: "text-orange-500", x: 72, y: 61 },
  { id: "trieDb", label: "Trie Snapshot DB", icon: Database, color: "text-indigo-500", x: 34, y: 82 },
  { id: "mapReduce", label: "MapReduce", icon: Layers, color: "text-rose-500", x: 72, y: 82 },
];

const architectureEdges: DiagramEdge[] = [
  { id: "client-lb", from: "client", to: "lb" },
  { id: "lb-gateway", from: "lb", to: "gateway" },
  { id: "gateway-trie", from: "gateway", to: "trie" },
  { id: "gateway-storage", from: "gateway", to: "storage" },
  { id: "trie-cache", from: "trie", to: "cache" },
  { id: "cache-trieDb", from: "cache", to: "trieDb" },
  { id: "storage-rawData", from: "storage", to: "rawData" },
  { id: "rawData-mapReduce", from: "rawData", to: "mapReduce" },
  { id: "mapReduce-trieDb", from: "mapReduce", to: "trieDb" },
  { id: "trie-cdn", from: "trie", to: "cdn" },
  { id: "cdn-client", from: "cdn", to: "client" },
];

const architecturePhases: DiagramPhase[] = [
  {
    nodeIds: ["client", "lb", "gateway"],
    edgeIds: ["client-lb", "lb-gateway"],
    note: "Every keystroke enters through the load balancer and API gateway.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "trie", "storage"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-trie", "gateway-storage"],
    note: "The API gateway separates the fast read path from the slower write path.",
    highlight: ["trie", "storage"],
  },
  {
    nodeIds: ["client", "lb", "gateway", "trie", "storage", "cache", "rawData"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-trie", "gateway-storage", "trie-cache", "storage-rawData"],
    note: "Reads continue through the cache, while writes land in raw query storage.",
    highlight: ["cache", "rawData"],
  },
  {
    nodeIds: ["client", "lb", "gateway", "trie", "storage", "cache", "rawData", "trieDb", "cdn"],
    edgeIds: [
      "client-lb",
      "lb-gateway",
      "gateway-trie",
      "gateway-storage",
      "trie-cache",
      "cache-trieDb",
      "storage-rawData",
      "trie-cdn",
      "cdn-client",
    ],
    note: "The cache and trie snapshot database keep the read model fast, with the CDN serving popular public prefixes near clients.",
    highlight: ["cdn"],
  },
  {
    nodeIds: ["client", "lb", "gateway", "trie", "storage", "cache", "rawData", "trieDb", "mapReduce", "cdn"],
    edgeIds: [
      "client-lb",
      "lb-gateway",
      "gateway-trie",
      "gateway-storage",
      "trie-cache",
      "cache-trieDb",
      "storage-rawData",
      "rawData-mapReduce",
      "mapReduce-trieDb",
      "trie-cdn",
      "cdn-client",
    ],
    note: "MapReduce folds raw events into a new trie snapshot, which refreshes the cache and serving replicas without blocking reads.",
    highlight: ["mapReduce", "trieDb"],
  },
];

export const designingTypeahead: BlogPostData = {
  title: "Designing Typeahead Suggestions",
  date: "July 11, 2026",
  slug: "designing-typeahead",
  content: (
    <>
      <Paragraph delay={0.1}>
        Typeahead is the little dropdown that tries to finish your thought before you finish typing it.
        Type <InlineCode>cap</InlineCode> and it might offer "captain", "caption", or "capital". It looks
        like a small search feature, but the request rate is unusually aggressive. A user can create one
        request for every keypress, and the answer has to arrive while the next key is still on its way.
      </Paragraph>

      <Paragraph delay={0.15}>
        The main design decision is therefore not which database stores the queries. It is keeping the
        read path short enough that a slow ranking update can never make suggestions disappear. We'll use
        an in-memory prefix index for reads, an offline pipeline for popularity, and a small freshness
        overlay for genuinely new trends. The system can tolerate stale rankings, but it cannot tolerate
        being unavailable.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        What are we building?
      </Heading>

      <Paragraph delay={0.25}>
        Given a query prefix, return the ten most useful complete terms that start with it. If the indexed
        terms include <InlineCode>cap</InlineCode>, <InlineCode>cat</InlineCode>, <InlineCode>captain</InlineCode>,
        and <InlineCode>capital</InlineCode>, a request for <InlineCode>cap</InlineCode> should return matching
        completions ranked by a score such as frequency, freshness, language, and location.
      </Paragraph>

      <Paragraph delay={0.3}>
        The hard requirement is a sub-200 millisecond end-to-end response. That budget includes the client,
        network, service, and rendering the dropdown, so the backend should aim much lower, ideally in the
        tens of milliseconds at the tail. A response that arrives after the user has typed three more
        characters is technically incorrect and practically useless.
      </Paragraph>

      <List delay={0.35}>
        <ListItem>
          <strong>Availability.</strong> Suggestions should remain available even if a ranking update,
          replica, cache, or freshness stream is unhealthy.
        </ListItem>
        <ListItem>
          <strong>Consistency.</strong> Popularity can be eventually consistent. A query becoming popular
          does not need to change every server immediately.
        </ListItem>
        <ListItem>
          <strong>Scale.</strong> The service is read heavy, with hundreds of thousands of prefix lookups
          per second at the assumed scale.
        </ListItem>
        <ListItem>
          <strong>Relevance.</strong> Results must start with the prefix, pass policy filters, and respect
          the chosen ranking signals.
        </ListItem>
      </List>

      <Heading level={2} delay={0.4}>
        Sizing the problem
      </Heading>

      <Paragraph delay={0.45}>
        Let's use five billion searches per day as a large-scale reference point. That is about 58,000
        completed searches per second. Typeahead is more demanding because it fires before the search is
        submitted. If the average user types five characters before choosing a suggestion, the service sees
        roughly 290,000 suggestion requests per second before a peak factor.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Back-of-the-envelope sizing for a high-volume typeahead service. The read path is the dominant workload, while ranking updates happen off the critical path."
      />

      <StatTiles items={stats} delay={0.05} />

      <Paragraph delay={0.5}>
        The numbers are deliberately approximate. They tell us what kind of system to build, not how many
        machines to order. The important conclusion is that every keystroke is a read, while updating
        frequencies synchronously would turn every read into a write as well. That is a poor bargain for a
        feature whose ranking can safely lag.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        The read path starts with a trie
      </Heading>

      <Paragraph delay={0.6}>
        A trie, pronounced "try", stores a string one character at a time. Shared prefixes share the same
        path, so all terms beginning with <InlineCode>cap</InlineCode> meet at the same node. To answer a
        request, the service walks the characters in the prefix and stops at the matching node.
      </Paragraph>

      <TrieStructureDiagram
        caption="A prefix trie for CAPTION, CAPITAL, and CAT. Shared characters are stored once, so a request for CAP lands at the common P node."
      />

      <Paragraph delay={0.7}>
        A normal trie solves prefix matching, but it does not solve ranking. The naive next step is to walk
        the entire subtree below the prefix, collect every completed term, sort them by frequency, and return
        ten. That is exactly the work we cannot afford on a hot path. A popular prefix can have millions of
        descendants.
      </Paragraph>

      <Heading level={3} delay={0.75}>
        Precompute top-K at every node
      </Heading>

      <Paragraph delay={0.8}>
        During an offline build, each node stores references to the top ten completed terms in its subtree.
        The references point to the terminal character nodes instead of storing the full strings repeatedly.
        Each terminal node has a parent pointer, so the service can walk upward to reconstruct a suggestion
        when it needs to return it.
      </Paragraph>

      <Paragraph delay={0.85}>
        This is a classic trade. We spend memory and build time to save latency. A lookup now takes
        <InlineCode>O(p)</InlineCode> time to walk a prefix of length <InlineCode>p</InlineCode>, followed
        by a small, fixed amount of work to read the top-K references. It never traverses or sorts the
        subtree at request time.
      </Paragraph>

      <TrieTopKDiagram
        caption="A CAP node stores references to terminal nodes from its best completions. Parent pointers reconstruct the full words only when the response is assembled."
      />

      <Formula block delay={0.9}>
        {`\\text{lookup cost} = O(p) + O(K), \\qquad K = 10`}
      </Formula>

      <Paragraph delay={0.95}>
        The list at the <InlineCode>cap</InlineCode> node might contain references to the terminal nodes for
        <InlineCode>caption</InlineCode>, <InlineCode>capital</InlineCode>, and <InlineCode>captain</InlineCode>.
        The response layer reconstructs those strings, merges any fresh or personalized candidates, applies
        filters, and returns the final ten. The trie does the expensive thinking before users arrive.
      </Paragraph>

      <Heading level={2} delay={1.0}>
        Ranking and updating the index
      </Heading>

      <Paragraph delay={1.05}>
        The simplest ranking signal is how often a term was searched. A real service can use a score that
        also gives weight to recent queries, language, region, device, or whether users clicked the result.
        An exponentially decayed score is useful because a query that was popular last year should not beat
        a query that is trending today forever.
      </Paragraph>

      <Paragraph delay={1.1}>
        A real-time update sounds attractive. When a user searches for a term, increment its frequency at
        the terminal node, then walk through every parent pointer. At each ancestor, check whether the term
        belongs in that node's top ten. If its score is high enough, insert it and evict the current lowest
        entry.
      </Paragraph>

      <Paragraph delay={1.15}>
        The problem is write amplification. One search can touch every prefix of the term, and billions of
        searches would make the read index a battlefield of concurrent writes. It is possible to build a
        strongly consistent version, but it spends complexity and resources on a property the product does
        not need.
      </Paragraph>

      <Paragraph delay={1.2}>
        Instead, every completed search emits an event containing the normalized query, timestamp, locale,
        and useful ranking signals. A durable log absorbs the writes. A batch job groups those events into a
        frequency table, applies decay and policy filters, and builds a new trie every hour or a few times a
        day. MapReduce, Spark, or a similar distributed job can do the aggregation in parallel.
      </Paragraph>

      <Paragraph delay={1.25}>
        The builder works bottom up. Terminal nodes provide their scores, parents merge the best candidates
        from their children, and each node keeps only the top ten. Once the new snapshot is complete and
        validated, serving processes load it beside the old snapshot and switch an atomic pointer. Reads
        continue throughout the rebuild, and the old version remains available until the new one is ready.
      </Paragraph>

      <Heading level={3} delay={1.3}>
        Freshness without sacrificing availability
      </Heading>

      <Paragraph delay={1.35}>
        Hourly updates are enough for most rankings, but they can miss a breaking news query or a sudden
        event. A small streaming layer can consume the same event log in minute-sized windows and write
        trending candidates to a replicated in-memory store. The read service merges those candidates with
        the base trie using the same prefix and policy checks.
      </Paragraph>

      <Paragraph delay={1.4}>
        This overlay is optional by design. If it is unavailable, the service returns the slightly older
        trie results. That is the consistency trade-off in concrete terms. Stale suggestions are acceptable.
        An empty dropdown because a freshness worker failed is not.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Keeping a trie after a restart
      </Heading>

      <Paragraph delay={1.5}>
        An in-memory index is fast, but memory is not permanent storage. The builder should serialize every
        snapshot to durable object storage and distribute it to the serving fleet. A compact pre-order
        representation can record each node's character and child count, followed immediately by its
        children.
      </Paragraph>

      <TrieSerializationDiagram
        caption="A trie serialized as C2,A2,R1,T,P,O1,D. The child counts make the compact stream unambiguous when a server rebuilds the tree."
      />

      <Paragraph delay={1.6}>
        The exact format is less important than making it deterministic, versioned, checksummed, and
        streamable. The loader can rebuild the child links and parent pointers from the file, then run the
        same post-order pass to recreate the top-K references. Keeping the frequency table beside the
        snapshot gives us another recovery path if a machine loses both its memory and its local copy.
      </Paragraph>

      <Heading level={2} delay={1.65}>
        Partitioning the index
      </Heading>

      <Paragraph delay={1.7}>
        The sizing exercise suggests that a single large machine might hold the index. We still partition it
        for lower latency, smaller failure domains, rolling deployments, and more read capacity. The
        partitioning scheme must preserve predictable routing because a request should not fan out to every
        server.
      </Paragraph>

      <Heading level={3} delay={1.75}>
        Prefix range partitioning
      </Heading>

      <Paragraph delay={1.8}>
        The simplest layout assigns ranges such as A to C, D to H, and so on. A router can send a prefix to
        the shard that owns it, and the response is already complete. The weakness is unevenness. Some
        letters and prefixes contain far more terms, and popular prefixes can make one shard a hotspot.
      </Paragraph>

      <Heading level={3} delay={1.85}>
        Capacity-aware ranges
      </Heading>

      <Paragraph delay={1.9}>
        We can walk the sorted trie and cut a partition whenever the next subtree would exceed a server's
        memory budget. One shard might own A through AABC, while the next starts at AABD. This uses capacity
        better than fixed letters, but it still needs a routing table, careful rebalancing, and a plan for a
        very hot range.
      </Paragraph>

      <Heading level={3} delay={1.95}>
        Hashing and replication
      </Heading>

      <Paragraph delay={2.0}>
        Hashing complete terms spreads storage and request load more evenly, but it destroys prefix locality.
        A request for <InlineCode>cap</InlineCode> would need to ask every shard and merge the answers, which
        is a bad fit for a strict latency budget. A better compromise is to keep prefix ranges for routing,
        split unusually hot prefixes into smaller ranges, and replicate those ranges more aggressively.
      </Paragraph>

      <Paragraph delay={2.05}>
        Every shard should have multiple replicas behind a load balancer. The router knows the prefix map,
        while the load balancer chooses a healthy replica. Since snapshots are immutable, replicas can load
        the same file independently and switch versions without coordinating every individual read.
      </Paragraph>

      <Heading level={2} delay={2.1}>
        Cache the hot prefixes
      </Heading>

      <Paragraph delay={2.15}>
        Prefix traffic follows a steep popularity curve. A small set of prefixes such as
        <InlineCode>we</InlineCode>, <InlineCode>cap</InlineCode>, or a popular product name receives a large
        share of all requests. A cache in front of the trie servers can store the final ten suggestions for
        these prefixes with a short time to live.
      </Paragraph>

      <Paragraph delay={2.2}>
        A CDN can serve the most public, locale-independent prefixes even closer to users. Cache keys should
        include the locale, region, and any ranking variant that changes the result. Cache misses go to the
        in-memory trie, not to the raw frequency database. The database belongs to the offline path.
      </Paragraph>

      <Heading level={2} delay={2.25}>
        Client behavior matters too
      </Heading>

      <Paragraph delay={2.3}>
        The browser or mobile client can protect both the user and the backend. Debounce requests for a few
        milliseconds, cancel an older request when a newer prefix exists, avoid querying until two or three
        characters are present, and ignore a response whose prefix no longer matches the input. A client can
        also keep recent suggestions locally and prefetch the next likely prefix after a response.
      </Paragraph>

      <Paragraph delay={2.35}>
        Establishing the connection early is often more valuable than shaving another operation from the
        trie lookup. Opening a connection when the search screen appears means the first keystroke does not
        pay the setup cost. The service should expose a compact response and let the client render instantly.
      </Paragraph>

      <Heading level={2} delay={2.4}>
        Personalization and filtering
      </Heading>

      <Paragraph delay={2.45}>
        Global popularity is only one candidate source. A user's recent searches, language, location, and
        account history can produce better suggestions. Keep that data in a separate personal-history store
        or on the client, then merge a small personalized list with the global top-K list at response time.
        Personalization should not require rebuilding the global trie for every user.
      </Paragraph>

      <Paragraph delay={2.5}>
        Suggestions also need a policy layer. Remove queries that violate content rules, expose personal
        information, or have been submitted for legal removal. Batch rebuilds remove them permanently from
        snapshots, while a fast denylist at the edge prevents an old cached or replicated snapshot from
        serving them in the meantime.
      </Paragraph>

      <Heading level={2} delay={2.55}>
        Putting it all together
      </Heading>

      <Paragraph delay={2.6}>
        The final design keeps two timelines separate. The read timeline is client to cache or trie server
        and back, with only prefix traversal and a fixed top-K read. The write timeline logs search events,
        aggregates scores, builds a fresh snapshot, serializes it, and rolls it out without taking any
        serving replica offline.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={architectureNodes}
        edges={architectureEdges}
        phases={architecturePhases}
        height={820}
        delay={0.05}
        caption="The complete typeahead design. Reads use the cache and replicated in-memory tries, while raw query events flow through MapReduce into a new trie snapshot."
      />

      <Paragraph delay={2.7}>
        The database does not sit in the middle of every keystroke. It stores durable events and frequency
        data, while the serving fleet owns a fast, replaceable read model. That separation is what lets the
        system accept eventual ranking consistency without giving up availability or predictable latency.
      </Paragraph>

      <Heading level={2} delay={2.75}>
        Takeaways
      </Heading>

      <List delay={2.8}>
        <ListItem>
          Typeahead is a read-heavy system where sub-200 millisecond end-to-end latency is a hard product
          requirement.
        </ListItem>
        <ListItem>
          A trie finds a prefix quickly, but precomputed top-K references at every node are what make ranking
          predictable.
        </ListItem>
        <ListItem>
          Search events should feed an offline frequency pipeline and periodic snapshot rebuilds instead of
          mutating every ancestor synchronously.
        </ListItem>
        <ListItem>
          Eventual consistency is acceptable for popularity. Availability is not negotiable, so an older
          snapshot should serve whenever the update path fails.
        </ListItem>
        <ListItem>
          Prefix-aware partitioning, replicas, hot-prefix caching, client debouncing, and a small freshness
          overlay keep the read path fast as the corpus and traffic grow.
        </ListItem>
      </List>

      <Paragraph delay={2.85}>
        Typeahead looks like a tiny interface detail, but it rewards a very clear systems decision. Keep the
        answers close to memory, precompute anything that can be precomputed, and move freshness work away
        from the path that handles every keystroke. The dropdown stays simple because the system underneath
        it does the hard work early. Thanks for reading.
      </Paragraph>
    </>
  ),
};
