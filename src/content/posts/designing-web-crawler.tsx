import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  InlineCode,
  List,
  ListItem,
  CapacityMathDiagram,
  CapacityGroup,
  StatTiles,
  StatItem,
  ApiEndpointsTable,
  ApiEndpoint,
  SchemaCards,
  SchemaTableSpec,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  DiagramPhase,
  FrontierPolitenessDiagram,
  IndependentRetryDiagram,
} from "../components";
import {
  Ban,
  Bot,
  Copy,
  Database,
  FileText,
  Globe,
  HardDrive,
  Hourglass,
  Layers,
  Link2,
  ListOrdered,
  Search,
  Server,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Crawl throughput",
    lines: [
      { expression: "5B pages tracked ÷ 30 days", result: "≈ 167M pages/day" },
      { expression: "167M pages/day ÷ 86,400 seconds", result: "≈ 1.93K pages/s average" },
      { expression: "1.93K pages/s × 0.3s average fetch latency", result: "≈ 580 fetches in flight" },
    ],
    note: "The in-flight number comes from Little's Law. It is the concurrency the fetch fleet needs, not the request rate any single host ever sees.",
  },
  {
    title: "Bandwidth",
    lines: [
      { expression: "1.93K pages/s × 100 KB average raw page", result: "≈ 193 MB/s" },
      { expression: "193 MB/s × 8 bits/byte", result: "≈ 1.54 Gbps sustained" },
    ],
    note: "This is aggregate bandwidth across every host combined. No individual server ever sees more than its own small slice of it.",
  },
  {
    title: "Raw storage",
    lines: [
      { expression: "5B pages × 100 KB average raw HTML", result: "≈ 500 TB raw" },
      { expression: "500 TB raw × 20% after compression", result: "≈ 100 TB compressed" },
      { expression: "100 TB compressed × 3 replicas", result: "≈ 300 TB durable storage" },
    ],
    note: "Text compresses well, so the on-disk footprint is a fraction of what actually crossed the network.",
  },
  {
    title: "Dedupe index",
    lines: [
      { expression: "5B URLs tracked × 150 bytes/entry", result: "≈ 750 GB exact metadata index" },
      { expression: "5B URLs tracked × 1 byte/entry (Bloom filter)", result: "≈ 5 GB fuzzy pre-filter" },
    ],
    note: "The gap between these two numbers is the entire argument for putting a Bloom filter in front of the exact store instead of querying it for every URL.",
  },
];

const stats: StatItem[] = [
  { label: "Pages fetched per day", value: 167, suffix: "M", icon: Globe, color: "text-blue-500" },
  { label: "Concurrent fetches", value: 580, suffix: "", icon: Hourglass, color: "text-teal-500" },
  { label: "Raw page storage", value: 500, suffix: " TB", icon: HardDrive, color: "text-violet-500" },
  { label: "URLs tracked for dedupe", value: 5, suffix: "B", icon: Copy, color: "text-amber-500" },
];

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/seeds",
    description: "Submits a batch of seed URLs, starting or expanding one crawl job.",
  },
  {
    method: "GET",
    path: "/crawl-jobs/{job_id}",
    description:
      "Returns a job's progress. Pages fetched, URLs still sitting in the frontier, and pages that failed permanently.",
  },
  {
    method: "GET",
    path: "/pages/{url_hash}",
    description:
      "Returns stored metadata for one page, including its content hash, last crawl time, and a pointer to the raw blob.",
  },
  {
    method: "POST",
    path: "/domains/{host}/policy",
    description: "Overrides the crawl delay and concurrency limit the crawler uses for one host.",
  },
  {
    method: "GET",
    path: "/domains/{host}/health",
    description: "Returns recent fetch success rate and latency for one host, used to decide whether to back off further.",
  },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "pages",
    fields: [
      { name: "url_hash", note: "primary key" },
      { name: "canonical_url" },
      { name: "host" },
      { name: "content_hash" },
      { name: "last_crawled_at" },
      { name: "last_status" },
      { name: "etag", note: "nullable, for conditional refetch" },
    ],
  },
  {
    name: "content_hashes",
    fields: [
      { name: "content_hash", note: "primary key" },
      { name: "first_seen_url" },
      { name: "duplicate_count" },
    ],
  },
  {
    name: "frontier_entries",
    fields: [
      { name: "entry_id", note: "primary key" },
      { name: "host" },
      { name: "url" },
      { name: "priority_score" },
      { name: "discovered_at" },
    ],
  },
  {
    name: "domains",
    fields: [
      { name: "host", note: "primary key" },
      { name: "crawl_delay_ms" },
      { name: "robots_rules" },
      { name: "next_allowed_fetch_at" },
      { name: "recent_error_rate" },
    ],
  },
];

const pipelineNodes: DiagramNode[] = [
  { id: "frontier", label: "URL Frontier", icon: Layers, color: "text-blue-500", x: 12, y: 25 },
  { id: "fetcher", label: "Fetch Worker", icon: Globe, color: "text-teal-500", x: 50, y: 25 },
  { id: "rawStore", label: "Raw Blob Store", icon: HardDrive, color: "text-violet-500", x: 88, y: 25 },
  { id: "parser", label: "Parser", icon: FileText, color: "text-indigo-500", x: 88, y: 75 },
  { id: "extractor", label: "Link Extractor", icon: Link2, color: "text-pink-500", x: 50, y: 75 },
  { id: "dedupe", label: "Dedupe Filter", icon: Copy, color: "text-amber-500", x: 12, y: 75 },
];

const pipelineEdges: DiagramEdge[] = [
  { id: "frontier-fetcher", from: "frontier", to: "fetcher" },
  { id: "fetcher-rawStore", from: "fetcher", to: "rawStore" },
  { id: "rawStore-parser", from: "rawStore", to: "parser" },
  { id: "parser-extractor", from: "parser", to: "extractor" },
  { id: "extractor-dedupe", from: "extractor", to: "dedupe" },
  { id: "dedupe-frontier", from: "dedupe", to: "frontier" },
];

const finalNodes: DiagramNode[] = [
  { id: "seeds", label: "Seed URLs", icon: Link2, color: "text-slate-500", x: 10, y: 6 },
  { id: "frontFront", label: "Front Queues", sub: "priority order", icon: ListOrdered, color: "text-blue-500", x: 10, y: 20 },
  { id: "backQueues", label: "Back Queues", sub: "per host, paced", icon: Hourglass, color: "text-amber-500", x: 10, y: 34 },
  { id: "dnsCache", label: "DNS Cache", icon: Server, color: "text-cyan-600", x: 40, y: 34 },
  { id: "fetcher", label: "Fetch Workers", sub: "one per host slot", icon: Globe, color: "text-teal-500", x: 10, y: 48 },
  { id: "headless", label: "Headless Pool", sub: "JS-rendered pages", icon: Bot, color: "text-violet-500", x: 40, y: 48 },
  { id: "rawStore", label: "Raw Blob Store", sub: "untouched bytes", icon: HardDrive, color: "text-blue-600", x: 10, y: 62 },
  { id: "dlq", label: "Dead Letter Queue", sub: "exhausted retries", icon: Ban, color: "text-rose-500", x: 63, y: 70 },
  { id: "parser", label: "Parser", sub: "text and links", icon: FileText, color: "text-indigo-500", x: 10, y: 76 },
  { id: "dedupe", label: "Dedupe Filter", sub: "Bloom filter + hash store", icon: Copy, color: "text-pink-500", x: 20, y: 88 },
  { id: "metadataStore", label: "Metadata Store", sub: "pages + content hashes", icon: Database, color: "text-emerald-600", x: 45, y: 80 },
  { id: "indexer", label: "Downstream Index", sub: "search and ranking", icon: Search, color: "text-fuchsia-500", x: 75, y: 88 },
];

const finalEdges: DiagramEdge[] = [
  { id: "seeds-frontFront", from: "seeds", to: "frontFront" },
  { id: "frontFront-backQueues", from: "frontFront", to: "backQueues" },
  { id: "backQueues-fetcher", from: "backQueues", to: "fetcher" },
  { id: "dnsCache-fetcher", from: "dnsCache", to: "fetcher", bidirectional: true },
  { id: "fetcher-headless", from: "fetcher", to: "headless" },
  { id: "fetcher-rawStore", from: "fetcher", to: "rawStore" },
  { id: "headless-rawStore", from: "headless", to: "rawStore" },
  { id: "fetcher-dlq", from: "fetcher", to: "dlq" },
  { id: "rawStore-parser", from: "rawStore", to: "parser" },
  { id: "parser-dlq", from: "parser", to: "dlq" },
  { id: "parser-dedupe", from: "parser", to: "dedupe" },
  { id: "dedupe-metadataStore", from: "dedupe", to: "metadataStore", bidirectional: true },
  { id: "dedupe-indexer", from: "dedupe", to: "indexer" },
];

const finalPhases: DiagramPhase[] = [
  {
    nodeIds: ["seeds", "frontFront", "backQueues"],
    edgeIds: ["seeds-frontFront", "frontFront-backQueues"],
    note: "Seed URLs land in priority front queues, which feed per-host back queues that pace requests to any one domain.",
    highlight: ["frontFront", "backQueues"],
  },
  {
    nodeIds: ["seeds", "frontFront", "backQueues", "dnsCache", "fetcher", "headless"],
    edgeIds: ["seeds-frontFront", "frontFront-backQueues", "backQueues-fetcher", "dnsCache-fetcher", "fetcher-headless"],
    note: "Fetch workers pull from a ready back queue, lean on a warm DNS cache, and hand JavaScript-heavy pages to a small headless rendering pool.",
    highlight: ["fetcher", "headless", "dnsCache"],
  },
  {
    nodeIds: ["seeds", "frontFront", "backQueues", "dnsCache", "fetcher", "headless", "rawStore", "dlq"],
    edgeIds: [
      "seeds-frontFront",
      "frontFront-backQueues",
      "backQueues-fetcher",
      "dnsCache-fetcher",
      "fetcher-headless",
      "fetcher-rawStore",
      "headless-rawStore",
      "fetcher-dlq",
    ],
    note: "A successful fetch lands in raw blob storage untouched. A fetch that keeps failing goes to a dead letter queue instead of retrying forever.",
    highlight: ["rawStore", "dlq"],
  },
  {
    nodeIds: ["seeds", "frontFront", "backQueues", "dnsCache", "fetcher", "headless", "rawStore", "dlq", "parser"],
    edgeIds: [
      "seeds-frontFront",
      "frontFront-backQueues",
      "backQueues-fetcher",
      "dnsCache-fetcher",
      "fetcher-headless",
      "fetcher-rawStore",
      "headless-rawStore",
      "fetcher-dlq",
      "rawStore-parser",
      "parser-dlq",
    ],
    note: "A parser reads the stored bytes to pull out text and links. A page that reliably crashes parsing also ends up in the dead letter queue.",
    highlight: ["parser"],
  },
  {
    nodeIds: ["seeds", "frontFront", "backQueues", "dnsCache", "fetcher", "headless", "rawStore", "dlq", "parser", "dedupe", "metadataStore"],
    edgeIds: [
      "seeds-frontFront",
      "frontFront-backQueues",
      "backQueues-fetcher",
      "dnsCache-fetcher",
      "fetcher-headless",
      "fetcher-rawStore",
      "headless-rawStore",
      "fetcher-dlq",
      "rawStore-parser",
      "parser-dlq",
      "parser-dedupe",
      "dedupe-metadataStore",
    ],
    note: "Every parsed page is checked against a metadata store keyed by URL and content hash, so identical content under a new URL never gets treated as new.",
    highlight: ["dedupe", "metadataStore"],
  },
  {
    nodeIds: ["seeds", "frontFront", "backQueues", "dnsCache", "fetcher", "headless", "rawStore", "dlq", "parser", "dedupe", "metadataStore", "indexer"],
    edgeIds: [
      "seeds-frontFront",
      "frontFront-backQueues",
      "backQueues-fetcher",
      "dnsCache-fetcher",
      "fetcher-headless",
      "fetcher-rawStore",
      "headless-rawStore",
      "fetcher-dlq",
      "rawStore-parser",
      "parser-dlq",
      "parser-dedupe",
      "dedupe-metadataStore",
      "dedupe-indexer",
    ],
    note: "Genuinely new or changed content moves downstream to indexing. Everything already seen quietly stops right here.",
    highlight: ["indexer"],
  },
];

export const designingWebCrawler: BlogPostData = {
  title: "Designing a Web Crawler",
  date: "August 6, 2026",
  slug: "designing-web-crawler",
  content: (
    <>
      <Paragraph delay={0.10}>
        A blog with one visitor a month might still get a burst of thirty requests in a single second
        from a crawler that just discovered thirty links pointing at it. Multiply that by a crawl that
        touches billions of independently owned pages, and the actual hard problem comes into view. It
        is not fetching a page. Browsers do that. It is fetching billions of pages, from millions of
        servers that never agreed to be crawled at all, without any single one of them noticing.
      </Paragraph>

      <Paragraph delay={0.15}>
        A search engine's crawler is the clearest version of this problem, so that is the frame used
        below. The same shape of system also powers price trackers, archive projects, and link checkers.
        What they share is a pipeline that talks to systems it does not control, and has to stay polite,
        correct, and fresh anyway.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What must be true
      </Heading>

      <List delay={0.25}>
        <ListItem>
          <strong>Start from seeds and grow.</strong> A crawl begins with a small list of known URLs and
          expands by following the links each fetched page contains.
        </ListItem>
        <ListItem>
          <strong>Never look like an attack.</strong> A crawl respects <InlineCode>robots.txt</InlineCode>,
          a per-host rate limit, and a crawl delay, so no single server ever sees more traffic than a
          handful of real browsers would send it.
        </ListItem>
        <ListItem>
          <strong>Treat duplicates as duplicates.</strong> A redirect, a tracking parameter, or the same
          article mirrored on two domains should collapse into one record instead of being crawled as if
          each were new.
        </ListItem>
        <ListItem>
          <strong>Separate content from metadata.</strong> The full bytes of a page and the small facts
          about it, when it was fetched, its status, its content hash, have very different sizes and very
          different access patterns.
        </ListItem>
        <ListItem>
          <strong>Recrawl by importance, not by clock alone.</strong> A page that changes daily deserves a
          tighter revisit schedule than one that has not changed in years.
        </ListItem>
        <ListItem>
          <strong>Fail without losing the crawl.</strong> One unreachable server, one malformed page, or
          one crashed worker should never stall the millions of pages that do not depend on it.
        </ListItem>
      </List>

      <Paragraph delay={0.30}>
        Building a search index or ranking results is a separate, much larger problem that sits
        downstream of all of this. This design stops at handing off clean, deduped, freshly fetched
        content. What happens to that content afterward gets one short section near the end, not a
        rebuild of a whole search engine.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Sizing the crawl
      </Heading>

      <Paragraph delay={0.40}>
        Assume the crawler is trying to keep <strong>5 billion pages</strong> reasonably fresh, each
        revisited at least once within a 30-day window. That single number drives everything else. It is
        a planning assumption, not a claim about any real company's numbers, but it is large enough that
        the interesting bottlenecks show up honestly.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Planning numbers for a web crawler. The fetch rate looks modest per host, but the dedupe index and raw storage grow with every page ever seen."
      />

      <StatTiles items={stats} delay={0.05} />

      <Heading level={2} delay={0.45}>
        A small operator API
      </Heading>

      <Paragraph delay={0.50}>
        Nobody outside the crawl team calls this API. It exists for operators to start jobs, check
        progress, and step in when one domain is behaving badly. Almost everything interesting about a
        crawler happens inside its own pipeline, not at this surface.
      </Paragraph>

      <ApiEndpointsTable items={apiEndpoints} delay={0.05} />

      <Heading level={2} delay={0.55}>
        What the crawler remembers
      </Heading>

      <Paragraph delay={0.60}>
        A page's identity is its URL, but two very different questions get asked about it constantly. Has
        this exact URL been fetched before, and separately, has this exact content been fetched before
        under some other URL. The schema keeps those two questions cheap to answer by storing a
        <InlineCode>content_hash</InlineCode> alongside the URL, not instead of it.
      </Paragraph>

      <SchemaCards tables={schemaTables} delay={0.05} />

      <Paragraph delay={0.65}>
        None of these tables store the actual page. A raw HTML document can run into megabytes, and most
        of that never needs to sit next to a metadata row that gets queried thousands of times a second.
        Raw bytes live in blob storage, addressed by their <InlineCode>url_hash</InlineCode> or content
        hash. The database only ever holds a pointer to them.
      </Paragraph>

      <Heading level={2} delay={0.70}>
        The pipeline, one hop at a time
      </Heading>

      <Paragraph delay={0.75}>
        Six things happen to a URL, in order. It gets fetched, the raw response gets stored, the stored
        bytes get parsed, links get extracted from the parsed text, both the URL and its content get
        checked against what has already been seen, and anything genuinely new goes back into the queue
        that started this whole loop.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={pipelineNodes}
        edges={pipelineEdges}
        height={360}
        delay={0.05}
        caption="Fetch, store, parse, extract, dedupe, enqueue. Each hop is a separate stage connected by a durable queue, not one long function call."
      />

      <Paragraph delay={0.80}>
        The reason this is drawn as six separate stages, and not one function that fetches and processes
        a page start to finish, is that a queue between stages is what makes the whole thing recoverable.
        A message moving between stages carries a URL, a content hash, and a pointer to wherever the raw
        bytes landed. It does not carry the page itself. That keeps every queue small even with millions
        of pages in flight, and it means a parser that crashes on one page can be handed that exact
        message again without anyone re-fetching the network resource. Fetching is the expensive,
        unreliable part. Reprocessing a stored blob is cheap and safe to retry.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        The frontier decides what to fetch next
      </Heading>

      <Paragraph delay={0.90}>
        Calling the crawler's to-do list a single queue undersells it. It has to answer two different
        questions at once. Which URL matters most right now, and is this particular host even allowed to
        be touched again yet. Splitting those concerns into a <strong>front queue</strong> and a back
        queue is the classic answer, going back to early large-scale crawler designs.
        The front queue holds URLs ranked by priority, mixing signals like how important a page looks and
        how often it tends to change. The back queue is where politeness lives, one queue per host, each
        one gated by that host's own crawl delay.
      </Paragraph>

      <FrontierPolitenessDiagram
        delay={0.05}
        caption="A shared priority frontier feeds one back queue per host. Each back queue paces itself independently, so a slow host never holds up a fast one."
      />

      <Paragraph delay={0.95}>
        Partitioning the back queues by host is what makes the pacing actually work. If two different
        fetch workers could each pull a URL for the same host at the same moment, they would need to
        coordinate on every single fetch to avoid doubling up on that host's rate limit. Assigning every
        host to exactly one back queue, owned by one worker or one shard, removes that coordination
        entirely. The same idea that spreads keys evenly across a partitioned store works here too, a
        host name hashes to a shard, and that shard is the only place its pending fetches ever wait.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        Being a polite guest
      </Heading>

      <Paragraph delay={1.05}>
        Politeness is not a courtesy feature bolted on afterward. It is close to the entire design
        constraint. A back queue enforces it through a handful of concrete rules, checked before every
        fetch.
      </Paragraph>

      <List delay={1.10}>
        <ListItem>
          Fetch and cache <InlineCode>robots.txt</InlineCode> once per host, and skip any path it
          disallows before a request ever goes out.
        </ListItem>
        <ListItem>
          Respect that host's crawl delay, either its own robots.txt value or a sensible default, as the
          minimum gap between two fetches to the same host.
        </ListItem>
        <ListItem>
          Cap concurrency per host. Even with spacing in place, only one or two in-flight requests to a
          single host at a time keeps a burst from ever forming.
        </ListItem>
        <ListItem>
          Add jitter. A perfectly regular request every exactly two seconds looks and behaves like a
          script, so a small random offset avoids synchronizing with anything else hitting the same host.
        </ListItem>
      </List>

      <Paragraph delay={1.15}>
        DNS resolution is an easy thing to overlook and an easy thing to get bitten by. A crawler resolving
        millions of distinct hostnames can turn DNS lookups into the actual bottleneck, especially since a
        lookup that should take milliseconds can quietly take seconds against a slow authoritative server.
        A local, aggressively cached resolver in front of the fetch fleet turns a repeated lookup into a
        cache hit instead of a network round trip, the same caching instinct that shows up anywhere a slow
        remote call sits in a hot path.
      </Paragraph>

      <Heading level={2} delay={1.20}>
        The same page never counts twice
      </Heading>

      <Paragraph delay={1.25}>
        Before a URL is even worth comparing against anything, it needs to be put into one predictable
        shape. A handful of normalization rules catch most of the noise that would otherwise make the same
        page look like a hundred different ones.
      </Paragraph>

      <List delay={1.30}>
        <ListItem>Lowercase the host, and strip a default port like 80 or 443.</ListItem>
        <ListItem>Remove the fragment after a hash, since it never changes what the server returns.</ListItem>
        <ListItem>Sort query parameters, so the same two parameters in a different order match.</ListItem>
        <ListItem>Resolve relative path segments like a parent directory reference.</ListItem>
        <ListItem>Follow a redirect chain to its final target and record that target as canonical.</ListItem>
      </List>

      <Paragraph delay={1.35}>
        Normalization only catches URLs that are superficially different. Two entirely different URLs can
        still serve byte-for-byte identical content, a printer-friendly version, a mirrored article, a page
        served from two domains. That is what the <InlineCode>content_hash</InlineCode> column is for. A
        hash of the parsed content, checked against the metadata store, catches this case regardless of
        what the URL looks like.
      </Paragraph>

      <Paragraph delay={1.40}>
        Checking every single discovered URL against an exact metadata store works, but it means a
        database lookup for every link on every page, at a scale where that adds up fast. A Bloom filter
        sitting in memory in front of that store answers a cheaper, slightly fuzzier question first, has
        this URL almost certainly never been seen. A filter tuned for a low false-positive rate lets the
        overwhelming majority of genuinely new URLs skip the database entirely, while the rare false
        positive just costs one unnecessary lookup instead of a missed page. The failure mode is bounded
        and tunable, and the size difference in the capacity numbers above shows exactly what that
        trade buys back.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Failure is the default, not the exception
      </Heading>

      <Paragraph delay={1.50}>
        A synchronous fetch-then-process design would mean one slow or broken server stalls everything
        behind it. Splitting fetch and parse into separate stages, connected by a queue, is what prevents
        that. A message that a worker pulls off a queue and does not acknowledge within some window
        becomes visible again automatically, so a worker that dies mid-fetch does not silently lose that
        URL. A message that keeps failing gets retried with exponential backoff, and after enough attempts
        it moves to a <strong>dead letter queue</strong> instead of retrying forever. That queue is where a
        genuinely broken page, one that reliably crashes the parser no matter how many times it is fed in,
        ends up too. Neither kind of failure should block the pages that have nothing to do with it.
      </Paragraph>

      <IndependentRetryDiagram
        delay={0.05}
        caption="A fetch that keeps timing out backs off and retries on its own lane. A different page, already fetched, keeps moving through parsing on a completely independent lane."
      />

      <Paragraph delay={1.55}>
        The other failure worth designing around is not a broken server, it is a working one that never
        stops. A calendar page that links to next month, forever, or a session identifier appended to
        every link that generates an endless stream of technically unique URLs, both look like legitimate
        content one page at a time. A maximum crawl depth from each seed, and a <strong>crawl budget</strong>{" "}
        that caps how many pages get fetched from one host per day, stop a trap from quietly consuming the
        entire fetch fleet's attention.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        Pages that only exist after JavaScript runs
      </Heading>

      <Paragraph delay={1.65}>
        A plain fetch and parse gets the full page for most of the web, but a growing slice of it renders
        its real content only after client-side JavaScript runs. A heuristic catches most of these cases
        cheaply, a page whose raw HTML has almost no text and almost no links relative to its byte size is
        very likely one of them. Those pages, and only those pages, get routed to a small pool of headless
        browser workers, a real browser engine running without a visible window, that can execute the page
        and hand back the resulting rendered content for the normal parser to take over from there.
      </Paragraph>

      <Paragraph delay={1.70}>
        That pool stays deliberately small and separately scaled from the plain fetch fleet. Rendering a
        page this way costs far more CPU and memory than downloading and parsing text, so routing only the
        pages that actually need it is what keeps the expensive path from swallowing the budget meant for
        everything else.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Deciding what to crawl again
      </Heading>

      <Paragraph delay={1.80}>
        A page's priority score in the front queue is not fixed at discovery time. It gets revised using
        two signals that matter more than a flat schedule ever could, how important the page looks, judged
        loosely by things like how many other pages link to it, and how often it has actually been
        observed to change across past crawls. A page that changes every day earns a short revisit
        interval. A page that has not changed in three years earns a long one, with a floor so nothing
        gets ignored forever.
      </Paragraph>

      <Paragraph delay={1.85}>
        Checking whether a page changed does not always require refetching its full body. When a server
        supports conditional requests, sending its last known <InlineCode>ETag</InlineCode> or{" "}
        <InlineCode>Last-Modified</InlineCode> value lets it reply with a small not-modified response
        instead of the whole page again. That single cheap check is often enough to confirm a page's
        revisit interval was set correctly, without spending a full fetch on the answer.
      </Paragraph>

      <Paragraph delay={1.90}>
        Keeping this whole system honest depends on watching a handful of signals continuously. Frontier
        depth trending upward faster than the fetch fleet can drain it means discovery has outrun
        throughput. A rising error rate concentrated on one host means back off harder there before it
        gets worse. A jump in how often pages land in the dead letter queue usually means some site changed
        its markup or started blocking the crawler outright, not that pages across the web suddenly got
        harder to parse all at once.
      </Paragraph>

      <Heading level={2} delay={1.95}>
        Putting the design together
      </Heading>

      <Paragraph delay={2.00}>
        Assembling every piece so far gives a pipeline where discovery, politeness, storage, and cleanup
        each get their own stage, connected by durable queues rather than direct calls. What comes out the
        other end is deduped, freshly fetched content sitting in blob storage with a metadata row pointing
        at it, ready for whatever builds a search index or a ranking model on top. That part is
        genuinely a separate system, built around inverted indexes and relevance scoring, and it starts
        exactly where this design ends.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={finalNodes}
        edges={finalEdges}
        phases={finalPhases}
        height={1000}
        delay={0.05}
        caption="The final crawler design builds from seed intake and politeness queues through fetching, storage, parsing, and dedupe, ending at a handoff to downstream indexing."
      />

      <Heading level={2} delay={2.05}>
        Takeaways
      </Heading>

      <List delay={2.10}>
        <ListItem>
          <strong>Split priority from politeness.</strong> A front queue decides what matters. A per-host
          back queue decides when that host may be touched again, and the two concerns should not be
          tangled together.
        </ListItem>
        <ListItem>
          <strong>Pass references, not payloads.</strong> A queue message carrying a URL and a pointer to a
          stored blob keeps every stage cheap to retry, since retrying never means re-fetching the network.
        </ListItem>
        <ListItem>
          <strong>Dedupe at two levels.</strong> Normalize and canonicalize the URL first, then hash the
          content, because different URLs serving identical bytes are common and neither check alone
          catches everything.
        </ListItem>
        <ListItem>
          <strong>Let failures fail locally.</strong> Retries, backoff, visibility timeouts, and a dead
          letter queue keep one broken host or one poison page from ever stalling the rest of the crawl.
        </ListItem>
        <ListItem>
          <strong>Spend the expensive path deliberately.</strong> A small, separately scaled headless
          rendering pool and a bounded crawl budget per host keep rare, costly work from quietly eating
          the budget meant for everything else.
        </ListItem>
      </List>

      <Paragraph delay={2.15}>
        A crawler never really finishes. It is a permanent, low-grade negotiation with a web that keeps
        changing shape and a set of hosts that never agreed to any of this in the first place. Get the
        politeness and the dedupe right, and the rest of the system gets to spend its effort on staying
        fresh instead of constantly cleaning up after itself. Thanks for reading.
      </Paragraph>
    </>
  ),
};
