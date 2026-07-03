import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  InlineCode,
  Formula,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  DiagramPhase,
  StatTiles,
  StatItem,
  UrlSqueeze,
  HashCollisionDiagram,
  KeyHandoffDiagram,
  CacheFlowDiagram,
  ApiEndpointsTable,
  ApiEndpoint,
  SchemaCards,
  SchemaTableSpec,
} from "../components";
import {
  Users,
  Waypoints,
  Route,
  Server,
  KeyRound,
  Database,
  Zap,
  Trash2,
  Link2,
  Repeat2,
  HardDrive,
  Gauge,
  Shuffle,
  Layers,
  BarChart3,
} from "lucide-react";

const stats: StatItem[] = [
  { label: "New URLs created per second", value: 200, suffix: "/s", icon: Link2, color: "text-blue-500" },
  { label: "Redirects served per second", value: 20000, suffix: "/s", icon: Repeat2, color: "text-teal-500" },
  { label: "Storage for 5 years of links", value: 15, suffix: " TB", icon: HardDrive, color: "text-indigo-500" },
  { label: "Cache for the hot 20% of traffic", value: 170, suffix: " GB", icon: Gauge, color: "text-amber-500" },
];

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/shorten",
    description:
      "Takes the original URL, an optional custom alias, an optional expiration date, and an optional user ID. Returns the shortened URL with its creation and expiration timestamps.",
  },
  {
    method: "GET",
    path: "/{shortened_url}",
    description: "Resolves a short link and redirects the caller to the original URL.",
  },
  {
    method: "GET",
    path: "/analytics/{shortened_url}",
    description:
      "Takes an optional date range and returns click count, unique clicks, referring sites, and a breakdown of visitor location and device.",
  },
  {
    method: "GET",
    path: "/user/urls",
    description:
      "Takes a user ID and optional pagination parameters, returning every link that user has created along with its metadata.",
  },
  {
    method: "DELETE",
    path: "/{shortened_url}",
    description:
      "Takes the requesting user's ID and returns a confirmation, or an error if the deletion isn't allowed.",
  },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "urls",
    fields: [
      { name: "hash", note: "primary key" },
      { name: "original_url" },
      { name: "creation_date" },
      { name: "expiration_date" },
      { name: "user_id", note: "nullable" },
    ],
  },
  {
    name: "users",
    fields: [
      { name: "user_id", note: "primary key" },
      { name: "name" },
      { name: "email" },
      { name: "creation_date" },
      { name: "last_login" },
    ],
  },
];

const nodes: DiagramNode[] = [
  { id: "client", label: "Clients", icon: Users, color: "text-slate-500", x: 5, y: 6 },
  { id: "lb", label: "Load Balancer", icon: Waypoints, color: "text-blue-500", x: 24, y: 6 },
  { id: "gateway", label: "API Gateway", icon: Route, color: "text-sky-500", x: 44, y: 6 },
  { id: "urlSvc", label: "URL Shortening Service", icon: Link2, color: "text-violet-500", x: 26, y: 27 },
  { id: "redirectSvc", label: "Redirection Service", icon: Shuffle, color: "text-pink-500", x: 50, y: 27 },
  { id: "queue", label: "Message Queue", sub: "RabbitMQ", icon: Layers, color: "text-orange-500", x: 68, y: 27 },
  { id: "analyticsSvc", label: "Analytics Service", icon: BarChart3, color: "text-emerald-500", x: 88, y: 27 },
  { id: "keygen", label: "Key Gen Service", icon: KeyRound, color: "text-amber-500", x: 26, y: 49 },
  { id: "keygenStandby", label: "Key Gen Service", sub: "standby", icon: KeyRound, color: "text-amber-300", x: 8, y: 49 },
  { id: "cache", label: "Cache", icon: Zap, color: "text-teal-500", x: 50, y: 49 },
  { id: "analyticsDB", label: "Analytics DB", icon: Database, color: "text-emerald-600", x: 88, y: 49 },
  { id: "keydb", label: "Key DB", icon: Database, color: "text-blue-400", x: 26, y: 71 },
  { id: "keydbStandby", label: "Key DB", sub: "standby", icon: Database, color: "text-blue-300", x: 8, y: 71 },
  { id: "urlDB", label: "URL DB", icon: Database, color: "text-blue-600", x: 50, y: 71 },
  { id: "cleanup", label: "Cleanup Service", icon: Trash2, color: "text-rose-500", x: 38, y: 93 },
];

const edges: DiagramEdge[] = [
  { id: "client-lb", from: "client", to: "lb" },
  { id: "lb-gateway", from: "lb", to: "gateway" },
  { id: "gateway-urlSvc", from: "gateway", to: "urlSvc" },
  { id: "gateway-redirectSvc", from: "gateway", to: "redirectSvc" },
  { id: "gateway-analyticsSvc", from: "gateway", to: "analyticsSvc" },
  { id: "urlSvc-keygen", from: "urlSvc", to: "keygen", bidirectional: true },
  { id: "keygen-keygenStandby", from: "keygen", to: "keygenStandby" },
  { id: "keygen-keydb", from: "keygen", to: "keydb", bidirectional: true },
  { id: "keydb-keydbStandby", from: "keydb", to: "keydbStandby" },
  { id: "redirectSvc-cache", from: "redirectSvc", to: "cache", bidirectional: true },
  { id: "cache-urlDB", from: "cache", to: "urlDB", bidirectional: true },
  { id: "redirectSvc-queue", from: "redirectSvc", to: "queue" },
  { id: "queue-analyticsSvc", from: "queue", to: "analyticsSvc" },
  { id: "analyticsSvc-analyticsDB", from: "analyticsSvc", to: "analyticsDB", bidirectional: true },
  { id: "urlDB-cleanup", from: "urlDB", to: "cleanup", bidirectional: true },
  { id: "keydb-cleanup", from: "keydb", to: "cleanup", bidirectional: true },
];

const phases: DiagramPhase[] = [
  {
    nodeIds: ["client", "lb"],
    edgeIds: ["client-lb"],
    note: "A client sends a request to the load balancer.",
  },
  {
    nodeIds: ["client", "lb", "gateway"],
    edgeIds: ["client-lb", "lb-gateway"],
    note: "The load balancer forwards it to an API gateway instance.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "urlSvc", "keygen", "keygenStandby", "keydb", "keydbStandby"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-urlSvc", "urlSvc-keygen", "keygen-keygenStandby", "keygen-keydb", "keydb-keydbStandby"],
    note: "Creating a link routes to the URL Shortening Service, which pulls a pre-generated key from the Key Generation Service.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "urlSvc", "keygen", "keygenStandby", "keydb", "keydbStandby", "redirectSvc", "cache", "urlDB"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-urlSvc", "urlSvc-keygen", "keygen-keygenStandby", "keygen-keydb", "keydb-keydbStandby", "gateway-redirectSvc", "redirectSvc-cache", "cache-urlDB"],
    note: "Visiting a link routes to the Redirection Service, which checks the cache before falling back to the URL database.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "urlSvc", "keygen", "keygenStandby", "keydb", "keydbStandby", "redirectSvc", "cache", "urlDB", "queue", "analyticsSvc", "analyticsDB"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-urlSvc", "urlSvc-keygen", "keygen-keygenStandby", "keygen-keydb", "keydb-keydbStandby", "gateway-redirectSvc", "redirectSvc-cache", "cache-urlDB", "gateway-analyticsSvc", "redirectSvc-queue", "queue-analyticsSvc", "analyticsSvc-analyticsDB"],
    note: "Every redirect also drops an event on a queue, so the Analytics Service can update click counts off the hot path.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "urlSvc", "keygen", "keygenStandby", "keydb", "keydbStandby", "redirectSvc", "cache", "urlDB", "queue", "analyticsSvc", "analyticsDB", "cleanup"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-urlSvc", "urlSvc-keygen", "keygen-keygenStandby", "keygen-keydb", "keydb-keydbStandby", "gateway-redirectSvc", "redirectSvc-cache", "cache-urlDB", "gateway-analyticsSvc", "redirectSvc-queue", "queue-analyticsSvc", "analyticsSvc-analyticsDB", "urlDB-cleanup", "keydb-cleanup"],
    note: "In the background, the Cleanup Service sweeps expired links from the URL database and returns their freed keys to the key database.",
    highlight: ["cleanup"],
  },
];

export const designingUrlShortener: BlogPostData = {
  title: "Designing a URL Shortener",
  date: "July 3, 2026",
  slug: "designing-url-shortener",
  content: (
    <>
      <Paragraph delay={0.1}>
        A URL shortener is the first system design question most people meet, and it stays a good one. The
        problem statement fits in a sentence, but pulling it apart touches hashing, key generation, database
        schema, partitioning, caching, and expiration, most of the building blocks that show up in bigger
        systems later. If you can reason through this one cleanly, you have a template for a lot of the
        rest.
      </Paragraph>

      <Heading level={2} delay={0.15}>
        Why shorten a URL at all
      </Heading>

      <Paragraph delay={0.2}>
        A shortener turns a long URL into a short alias that redirects to it. Take a URL like{" "}
        <InlineCode>https://www.example.com/course/grokking-the-system-design-interview</InlineCode>, run it
        through a shortener, and you get something like <InlineCode>https://tny.co/vzet59pa</InlineCode>, a
        fraction of the size. That matters more than it sounds. Short links are easier to paste, easier to
        say out loud, harder to mistype, and easier to track individually. Every short link is a single row
        you can attach metadata to, so it doubles as a natural unit for analytics, ad campaign performance,
        or quietly routing around an affiliate URL you'd rather not expose directly.
      </Paragraph>

      <UrlSqueeze
        longUrl="https://www.example.com/course/grokking-the-system-design-interview"
        shortUrl="https://tny.co/vzet59pa"
        delay={0.1}
      />

      <Heading level={2} delay={0.25}>
        Requirements
      </Heading>

      <Paragraph delay={0.3}>
        Functional requirements are straightforward. Given a URL, generate a short, unique alias for it.
        When someone visits the short link, redirect them to the original. Let users optionally choose a
        custom alias instead of an auto-generated one. Let links expire, with a sensible default and an
        option to override it at creation time.
      </Paragraph>

      <Paragraph delay={0.35}>
        The non-functional requirements are where the design decisions actually come from. The system has
        to be highly available, since if it's down, every redirect fails, not just new link creation.
        Redirects have to happen with minimal latency, and generated links should not be guessable in
        sequence. A service that hands out keys like <InlineCode>000001</InlineCode>,{" "}
        <InlineCode>000002</InlineCode> would let anyone enumerate every link ever created just by
        incrementing a counter, which is both a privacy problem and a scraping vector.
      </Paragraph>

      <Heading level={2} delay={0.4}>
        Sizing the problem
      </Heading>

      <Paragraph delay={0.45}>
        Say we expect 500 million new short links a month, with a 100 to 1 read to write ratio, since people
        click links far more often than they create them. That gives roughly 50 billion redirects over the
        same period. Broken into requests per second, 500 million divided by the seconds in a month works
        out to about 200 new URLs a second, and multiplying that by the 100 to 1 ratio puts redirects at
        roughly 20,000 a second.
      </Paragraph>

      <Paragraph delay={0.5}>
        Store every mapping for five years and you're at around 30 billion records, 500 million a month
        times 12 months times 5 years. At roughly 500 bytes per record, that's about 15 TB of storage, a
        number small enough that the interesting problems here are read latency and availability, not raw
        disk space. Bandwidth follows the same split. Writes push about 100 KB/s into the system, reads pull
        roughly 10 MB/s back out.
      </Paragraph>

      <Paragraph delay={0.55}>
        Memory for caching comes from the 80-20 rule, a small slice of links accounts for most of the
        traffic, so caching the hottest 20% covers the bulk of redirects. At 20,000 requests a second,
        that's about 1.7 billion requests a day, and caching a fifth of those at 500 bytes each lands at
        roughly 170 GB, comfortably inside a single modern server's memory, and less in practice once you
        account for the same hot links being requested over and over.
      </Paragraph>

      <StatTiles items={stats} delay={0.05} />

      <Heading level={2} delay={0.6}>
        Designing the API
      </Heading>

      <Paragraph delay={0.65}>
        With the scale roughly pinned down, the next step is nailing down exactly what the service exposes,
        since that shapes everything underneath it. A handful of REST endpoints cover the functional
        requirements plus the analytics extension.
      </Paragraph>

      <ApiEndpointsTable items={apiEndpoints} delay={0.7} />

      <Paragraph delay={0.75}>
        The redirect endpoint deserves a closer look, because the HTTP status code it returns has a real
        side effect. An HTTP 302, a temporary redirect, tells the browser not to cache the mapping, so every
        visit round trips through the service, which is exactly what you want if you're counting clicks. An
        HTTP 301, a permanent redirect, gets cached by the browser itself, so repeat visits skip the service
        entirely, cheaper for the system but invisible to analytics. Almost every production shortener uses
        302 for this reason, trading a bit of redirect latency for a click count that's actually accurate.
      </Paragraph>

      <Paragraph delay={0.8}>
        Left unchecked, a handful of malicious or just poorly written clients could burn through the
        service's entire key space by hammering the create endpoint, or scrape every redirect by brute
        forcing short codes. The usual fix is to rate limit both operations per user or per IP, with
        different thresholds for authenticated users, anonymous callers, and API consumers.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        Storing the data
      </Heading>

      <Paragraph delay={0.9}>
        The data itself is simple. Billions of records, each one small, well under a kilobyte, with
        essentially no relationships between rows other than which user created which link. Two tables cover
        it.
      </Paragraph>

      <SchemaCards tables={schemaTables} delay={0.95} />

      <Paragraph delay={1.0}>
        Given that shape, a NoSQL store like DynamoDB, Cassandra, or Riak is a better fit than a relational
        database. There's no need for joins or multi-row transactions, the access pattern is almost entirely
        "look up one row by its key," and a wide-column or key-value store scales out horizontally far more
        easily than a single relational instance does once you're past a few billion rows.
      </Paragraph>

      <Heading level={2} delay={1.05}>
        Generating the short key
      </Heading>

      <Paragraph delay={1.1}>
        This is the actual design problem hiding inside "shorten a URL." Two approaches show up constantly.
      </Paragraph>

      <Heading level={3} delay={1.15}>
        Hash the URL
      </Heading>

      <Paragraph delay={1.2}>
        Run the URL through MD5 or SHA-256, base62-encode the result ([A-Z, a-z, 0-9], or base64 if you
        throw in <InlineCode>+</InlineCode> and <InlineCode>/</InlineCode>), and take the first six or eight
        characters. The key length is a real trade-off.
      </Paragraph>

      <Formula block delay={1.25}>
        {`64^{6} \\approx 68.7 \\times 10^{9}, \\qquad 64^{8} \\approx 2.81 \\times 10^{14}`}
      </Formula>

      <Paragraph delay={1.3}>
        Six base64 characters already give you about 68.7 billion combinations, comfortably more than the 30
        billion links this system is sized for, so there's no real need to reach for eight. The catch is
        that MD5 produces a 128-bit hash, which base64-encodes to a string over 21 characters long. Slicing
        that down to the first six throws away most of the hash's entropy, and it opens the door to
        collisions, two different URLs whose hashes happen to share the same first six characters.
      </Paragraph>

      <HashCollisionDiagram
        delay={0.05}
        caption="A real collision, computed live. Two different paths hash to the same first two characters. The system truncates to six, not two, but the math is identical."
      />

      <Paragraph delay={1.35}>
        There's a second, quieter problem underneath the collision one. Hashing the URL directly means two
        users shortening the exact same link get the exact same short code, which usually isn't what you
        want if links are meant to be owned or tracked per user. And two URLs that are semantically identical
        but encoded differently in their query string (<InlineCode>?id=design</InlineCode> versus its
        percent-encoded equivalent) hash to completely different values despite pointing at the same
        content.
      </Paragraph>

      <Paragraph delay={1.4}>
        The usual workaround is appending something unique to the URL before hashing it, like an
        ever-incrementing sequence number or the requesting user's ID, then re-hashing until you land on a
        key nobody's used yet. It works, but it's a patch. A global counter has to live somewhere and can in
        principle overflow, appending it costs a bit of latency on every write, and anonymous users don't
        have a stable ID to lean on, so you're back to a retry loop on collision either way.
      </Paragraph>

      <Heading level={3} delay={1.45}>
        Generate keys ahead of time
      </Heading>

      <Paragraph delay={1.5}>
        The cleaner approach, a standalone Key Generation Service pre-generates random, unique six-character
        keys and stores them in a key-DB, split into an unused table and a used table. When an app server
        needs a key, it asks the service, which hands one out and marks it used. No hashing, no collisions,
        no encoding step on the request path, and the service guarantees every key it ever hands out is
        unique by construction.
      </Paragraph>

      <Paragraph delay={1.55}>
        Concurrency is the part that needs care. If several app servers ask for keys at the same moment, two
        of them can't be allowed to walk away with the same one. The service handles this by keeping keys in
        two tables, unused and used, and moving a batch of keys into the used table the instant it loads them
        into memory to hand out, before any server has actually consumed them. That way even if the service
        crashes mid-handout, the worst case is a few wasted keys, not a duplicate. Reading from and writing
        to that in-memory batch is synchronized so two servers can never be handed the same key out of it.
      </Paragraph>

      <KeyHandoffDiagram
        delay={0.05}
        caption="Two servers ask for a key at once. The Key Generation Service marks a key used the instant it hands it out, so no two servers can ever walk away with the same one."
      />

      <Paragraph delay={1.6}>
        App servers can go a step further and cache a batch of keys locally, so most create requests never
        make a network call to the Key Generation Service at all. If an app server dies with unused keys
        still cached locally, those are simply lost, an acceptable trade given how large the key space is.
      </Paragraph>

      <Formula block delay={1.65}>
        {`6 \\text{ bytes/key} \\times 68.7 \\times 10^{9} \\text{ keys} \\approx 412 \\text{ GB}`}
      </Formula>

      <Paragraph delay={1.7}>
        That's the entire key-DB, unused and used keys combined, at one byte per character. It's a single
        point of failure by design, so it runs with a standby replica that takes over if the primary goes
        down, and the app server layer talks to it the same way it talks to any other backend dependency,
        through a load balancer, with retries.
      </Paragraph>

      <Paragraph delay={1.75}>
        On the read side, resolving a link is a single lookup. Find the key in the database, and if it's
        there, issue an HTTP 302 with the original URL in the <InlineCode>Location</InlineCode> header. If
        it isn't there, either because it never existed or because it expired and was already cleaned up,
        return a 404 or redirect to the homepage instead. Custom aliases go through the same table, just
        supplied by the user instead of the Key Generation Service, capped at a reasonable length, 16
        characters is a common choice, so the schema stays consistent regardless of who picked the key.
      </Paragraph>

      <Heading level={2} delay={1.8}>
        Data partitioning
      </Heading>

      <Paragraph delay={1.85}>
        At 30 billion rows, one database isn't an option. Range-based partitioning, all keys starting with
        "A" on one shard, "B" on another, rare letters grouped together, is simple and predictable, but
        uneven. Some letters are just more common than others, and shards end up lopsided in a way that's
        hard to predict ahead of time.
      </Paragraph>

      <Paragraph delay={1.9}>
        Hash-based partitioning distributes keys more evenly by hashing the key itself and using the result
        to pick a shard, say mapping every key to a bucket between 1 and 256. It spreads load far more
        uniformly than range partitioning, though a naive modulo scheme still concentrates load on a few
        partitions and forces a near total reshuffle whenever a shard gets added or removed. Consistent
        hashing solves both problems at once. It maps both keys and shards onto the same ring, so adding or
        removing a shard only moves the keys that land in its immediate neighborhood, not the entire dataset.
      </Paragraph>

      <Heading level={2} delay={1.95}>
        Caching hot links
      </Heading>

      <Paragraph delay={2.0}>
        Traffic to short links follows the usual 80-20 pattern, a small slice of links account for most
        redirects. An off-the-shelf cache like Memcached, keyed by the short hash and storing the full
        original URL, keeps the vast majority of redirects out of the database entirely. App servers check
        the cache first and only fall through to storage on a miss.
      </Paragraph>

      <CacheFlowDiagram
        delay={0.05}
        caption="The Redirection Service always checks the cache first. A hit returns immediately, a miss falls through to the URL database and populates the cache before returning."
      />

      <Paragraph delay={2.05}>
        When the cache fills up and something has to go, Least Recently Used is a reasonable default
        eviction policy, implementable with a linked hash map that tracks access order alongside the
        key-value pairs. Running multiple cache replicas spreads read load further, and keeping them
        consistent is cheap. On a miss, the app server pulls from the database, writes the result into the
        cache, and propagates that new entry to every replica. A replica that already has the entry just
        ignores the update.
      </Paragraph>

      <Heading level={2} delay={2.1}>
        Load balancing
      </Heading>

      <Paragraph delay={2.15}>
        A load balancer fits in three places here, between clients and the app servers, between app servers
        and the database, and between app servers and the cache. Round robin is a reasonable starting point
        at all three, cheap to run and simple enough that it automatically stops sending traffic to a server
        that's gone down. Its blind spot is load. Round robin doesn't know or care if a particular backend is
        already struggling, and will happily keep routing new requests to it. A more capable load balancer
        periodically checks each backend's current load and shifts traffic away from the ones that are
        falling behind, which matters more as the fleet grows and servers start failing or degrading
        independently of each other.
      </Paragraph>

      <Heading level={2} delay={2.2}>
        Expiration and cleanup
      </Heading>

      <Paragraph delay={2.25}>
        Links expire, but scanning the whole table for expired rows on a schedule would hammer the database
        for no good reason. A lighter approach, check expiration lazily, only when a link is actually
        requested, and delete it on the spot if it's past its date, returning an error to whoever tried to
        follow it. Some expired links will sit around a little longer than they technically should, but none
        of them are ever served to a real visitor, which is the property that actually matters.
      </Paragraph>

      <Paragraph delay={2.3}>
        A separate, low-priority Cleanup Service runs on a schedule to catch what lazy deletion misses,
        sweeping expired links out of both storage and cache during low-traffic windows so it doesn't compete
        with real user requests. Every link gets a default expiration if the user doesn't set one, two years
        is a common default, and once a link is removed, its key goes back into the key-DB's unused table
        to be handed out again.
      </Paragraph>

      <Paragraph delay={2.35}>
        Whether to also expire links that are technically still valid but haven't been visited in months is
        a genuinely open question, and reasonable systems land on either side of it. Since storage is cheap
        relative to the cost of accidentally breaking a link someone still has bookmarked, keeping unvisited
        links around indefinitely is usually the safer default.
      </Paragraph>

      <Heading level={2} delay={2.4}>
        Tracking usage
      </Heading>

      <Paragraph delay={2.45}>
        Once analytics is a requirement, every redirect needs to leave a trace, which country the click came
        from, the timestamp, the referring page, and the browser or platform. The naive implementation,
        incrementing a click counter on the link's own row every time it's visited, falls over exactly where
        it matters most, since a popular link can get slammed with thousands of concurrent redirects all
        trying to update the same row at once.
      </Paragraph>

      <Paragraph delay={2.5}>
        The fix is to stop treating each click as a synchronous write to the hot row. Log each click event
        to a separate, append-only stream instead, and aggregate counts out of band on a delay, whether
        that's a batched write every few seconds or a background job that rolls the event log up into
        per-link counters. It trades perfectly real-time click counts for a system that doesn't buckle under
        its own popular links, a trade that's almost always worth making.
      </Paragraph>

      <Heading level={2} delay={2.55}>
        Private links and permissions
      </Heading>

      <Paragraph delay={2.6}>
        Not every link needs to be public. Supporting private links just means storing a permission level,
        public or private, alongside each URL, plus a separate table mapping each link's hash to the set of
        user IDs allowed to resolve it. In a wide-column store like Cassandra, that table's row key is the
        hash itself, with each permitted user ID stored as a column. A request for a private link from
        someone not on that list gets an HTTP 401 instead of a redirect, and the check costs one extra
        lookup on the hot path, cheap enough not to affect the latency budget in any meaningful way.
      </Paragraph>

      <Heading level={2} delay={2.65}>
        Putting it all together
      </Heading>

      <Paragraph delay={2.7}>
        Every piece so far, the load balancer, the key generation service, the cache, the cleanup sweep,
        slots into one architecture. Client traffic lands on a load balancer, fans out through an API
        gateway to dedicated shortening, redirection, and analytics services, and each of those services
        leans on its own datastore behind it.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={nodes}
        edges={edges}
        phases={phases}
        height={700}
        delay={0.05}
        caption="The complete design. Client traffic passes through a load balancer and gateway into dedicated shortening, redirection, and analytics services, each backed by its own datastore, with a cleanup service tying the URL and key databases together."
      />

      <Heading level={2} delay={2.75}>
        Takeaways
      </Heading>

      <List delay={2.8}>
        <ListItem>
          Pre-generate keys with a Key Generation Service instead of hashing URLs on the fly. It sidesteps
          collisions entirely and keeps the write path off the request's critical section.
        </ListItem>
        <ListItem>
          Cache the hot 20% of links with an LRU policy. It's the single change that keeps the database out
          of the request path for most redirects.
        </ListItem>
        <ListItem>
          Partition by consistent hash rather than by range. It spreads load evenly and keeps a shard change
          from turning into a full data migration.
        </ListItem>
        <ListItem>
          Expire links lazily, on access, and let a background cleanup job catch the rest during quiet
          hours. Scanning billions of rows on a timer is the expensive way to do it.
        </ListItem>
        <ListItem>
          Move analytics off the hot path entirely. A popular link updating its own row on every click is a
          bottleneck waiting to happen, an event log with batched aggregation isn't.
        </ListItem>
      </List>

      <Paragraph delay={2.85}>
        A URL shortener is small enough to hold in your head completely, which is exactly why it's useful.
        Every decision here generalizes directly to systems with far more moving parts, and learning to
        justify these trade-offs on something this small makes them much easier to spot everywhere else.
        Thanks for reading.
      </Paragraph>
    </>
  ),
};
