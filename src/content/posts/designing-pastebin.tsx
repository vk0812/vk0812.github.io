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
  CapacityMathDiagram,
  CapacityGroup,
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
  Globe,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Traffic",
    lines: [
      { expression: "1M pastes/day × 5 (read:write ratio)", result: "5M reads/day" },
      { expression: "1M pastes/day ÷ 86,400s", result: "≈ 12 new pastes/s" },
      { expression: "5M reads/day ÷ 86,400s", result: "≈ 58 reads/s" },
    ],
    note: "1 million new pastes a day, with reads outnumbering writes 5 to 1.",
  },
  {
    title: "Storage (10 years)",
    lines: [
      { expression: "1M pastes/day × 10 KB", result: "≈ 10 GB/day" },
      { expression: "3.6B pastes × 10 KB", result: "36 TB" },
      { expression: "36 TB ÷ 70% capacity", result: "≈ 51.4 TB" },
    ],
    note: "10 years of pastes at roughly 10 KB each, kept under 70% capacity.",
  },
  {
    title: "Bandwidth",
    lines: [
      { expression: "12 writes/s × 10 KB", result: "≈ 120 KB/s in" },
      { expression: "58 reads/s × 10 KB", result: "≈ 0.6 MB/s out" },
    ],
    note: "A 10 MB per paste cap keeps any single upload from dominating ingress.",
  },
  {
    title: "Cache (hot 20%)",
    lines: [
      { expression: "58 reads/s × 86,400s", result: "≈ 5M reads/day" },
      { expression: "20% × 5M × 10 KB", result: "≈ 10 GB" },
    ],
    note: "Caching the hottest fifth of daily reads covers most of the traffic.",
  },
];

const stats: StatItem[] = [
  { label: "New pastes created per second", value: 12, suffix: "/s", icon: Link2, color: "text-blue-500" },
  { label: "Paste reads per second", value: 58, suffix: "/s", icon: Repeat2, color: "text-teal-500" },
  { label: "Storage for 10 years of pastes", value: 51.4, suffix: " TB", icon: HardDrive, color: "text-indigo-500" },
  { label: "Cache for the hot 20% of traffic", value: 10, suffix: " GB", icon: Gauge, color: "text-amber-500" },
];

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/paste",
    description:
      "Takes the paste's text content, an optional custom alias, an optional user ID, an optional paste name, and an optional expiration date. Returns the paste's URL along with its creation and expiration timestamps.",
  },
  {
    method: "GET",
    path: "/{paste_key}",
    description: "Resolves a paste key and returns the paste's text content directly in the response body.",
  },
  {
    method: "GET",
    path: "/analytics/{paste_key}",
    description: "Takes an optional date range and returns how many times the paste has been viewed.",
  },
  {
    method: "GET",
    path: "/user/pastes",
    description:
      "Takes a user ID and optional pagination parameters, returning every paste that user has created along with its metadata.",
  },
  {
    method: "DELETE",
    path: "/{paste_key}",
    description:
      "Takes the requesting user's ID and returns a confirmation, or an error if the deletion isn't allowed.",
  },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "pastes",
    fields: [
      { name: "hash", note: "primary key" },
      { name: "content_key", note: "points into object storage" },
      { name: "creation_date" },
      { name: "expiration_date" },
      { name: "user_id", note: "nullable" },
      { name: "paste_name" },
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
  { id: "cdn", label: "CDN", icon: Globe, color: "text-fuchsia-500", x: 90, y: 6 },
  { id: "pasteSvc", label: "Paste Creation Service", icon: Link2, color: "text-violet-500", x: 24, y: 27 },
  { id: "redirectSvc", label: "Retrieval Service", icon: Shuffle, color: "text-pink-500", x: 48, y: 27 },
  { id: "queue", label: "Message Queue", sub: "RabbitMQ", icon: Layers, color: "text-orange-500", x: 66, y: 27 },
  { id: "analyticsSvc", label: "Analytics Service", icon: BarChart3, color: "text-emerald-500", x: 86, y: 27 },
  { id: "keygen", label: "Key Gen Service", icon: KeyRound, color: "text-amber-500", x: 24, y: 49 },
  { id: "keygenStandby", label: "Key Gen Service", sub: "standby", icon: KeyRound, color: "text-amber-300", x: 6, y: 49 },
  { id: "cache", label: "Cache", icon: Zap, color: "text-teal-500", x: 48, y: 49 },
  { id: "objectStorage", label: "Object Storage", icon: HardDrive, color: "text-cyan-600", x: 66, y: 49 },
  { id: "analyticsDB", label: "Analytics DB", icon: Database, color: "text-emerald-600", x: 86, y: 49 },
  { id: "keydb", label: "Key DB", icon: Database, color: "text-blue-400", x: 24, y: 71 },
  { id: "keydbStandby", label: "Key DB", sub: "standby", icon: Database, color: "text-blue-300", x: 6, y: 71 },
  { id: "pasteDB", label: "Paste DB", icon: Database, color: "text-blue-600", x: 48, y: 71 },
  { id: "cleanup", label: "Cleanup Service", icon: Trash2, color: "text-rose-500", x: 36, y: 93 },
];

const edges: DiagramEdge[] = [
  { id: "client-lb", from: "client", to: "lb" },
  { id: "lb-gateway", from: "lb", to: "gateway" },
  { id: "gateway-pasteSvc", from: "gateway", to: "pasteSvc" },
  { id: "gateway-redirectSvc", from: "gateway", to: "redirectSvc" },
  { id: "gateway-analyticsSvc", from: "gateway", to: "analyticsSvc" },
  { id: "pasteSvc-keygen", from: "pasteSvc", to: "keygen", bidirectional: true },
  { id: "keygen-keygenStandby", from: "keygen", to: "keygenStandby" },
  { id: "keygen-keydb", from: "keygen", to: "keydb", bidirectional: true },
  { id: "keydb-keydbStandby", from: "keydb", to: "keydbStandby" },
  { id: "pasteSvc-objectStorage", from: "pasteSvc", to: "objectStorage", bidirectional: true },
  { id: "redirectSvc-cache", from: "redirectSvc", to: "cache", bidirectional: true },
  { id: "cache-pasteDB", from: "cache", to: "pasteDB", bidirectional: true },
  { id: "redirectSvc-objectStorage", from: "redirectSvc", to: "objectStorage", bidirectional: true },
  { id: "objectStorage-cdn", from: "objectStorage", to: "cdn", bidirectional: true },
  { id: "cdn-client", from: "cdn", to: "client", bidirectional: true },
  { id: "redirectSvc-queue", from: "redirectSvc", to: "queue" },
  { id: "queue-analyticsSvc", from: "queue", to: "analyticsSvc" },
  { id: "analyticsSvc-analyticsDB", from: "analyticsSvc", to: "analyticsDB", bidirectional: true },
  { id: "pasteDB-cleanup", from: "pasteDB", to: "cleanup", bidirectional: true },
  { id: "keydb-cleanup", from: "keydb", to: "cleanup", bidirectional: true },
  { id: "objectStorage-cleanup", from: "objectStorage", to: "cleanup", bidirectional: true },
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
    nodeIds: ["client", "lb", "gateway", "pasteSvc", "keygen", "keygenStandby", "keydb", "keydbStandby", "objectStorage"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-pasteSvc", "pasteSvc-keygen", "keygen-keygenStandby", "keygen-keydb", "keydb-keydbStandby", "pasteSvc-objectStorage"],
    note: "Creating a paste routes to the Paste Creation Service, which pulls a key from the Key Generation Service and uploads the raw content straight to object storage.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "pasteSvc", "keygen", "keygenStandby", "keydb", "keydbStandby", "objectStorage", "redirectSvc", "cache", "pasteDB"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-pasteSvc", "pasteSvc-keygen", "keygen-keygenStandby", "keygen-keydb", "keydb-keydbStandby", "pasteSvc-objectStorage", "gateway-redirectSvc", "redirectSvc-cache", "cache-pasteDB"],
    note: "Reading a paste routes to the Retrieval Service, which checks the metadata cache before falling back to the paste database for the content's location.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "pasteSvc", "keygen", "keygenStandby", "keydb", "keydbStandby", "objectStorage", "redirectSvc", "cache", "pasteDB"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-pasteSvc", "pasteSvc-keygen", "keygen-keygenStandby", "keygen-keydb", "keydb-keydbStandby", "pasteSvc-objectStorage", "gateway-redirectSvc", "redirectSvc-cache", "cache-pasteDB", "redirectSvc-objectStorage"],
    note: "The metadata only records where the content lives. The Retrieval Service still has to fetch the actual bytes from object storage using that reference.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "pasteSvc", "keygen", "keygenStandby", "keydb", "keydbStandby", "objectStorage", "redirectSvc", "cache", "pasteDB", "cdn"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-pasteSvc", "pasteSvc-keygen", "keygen-keygenStandby", "keygen-keydb", "keydb-keydbStandby", "pasteSvc-objectStorage", "gateway-redirectSvc", "redirectSvc-cache", "cache-pasteDB", "redirectSvc-objectStorage", "objectStorage-cdn", "cdn-client"],
    note: "Popular pastes get served straight from a CDN sitting in front of object storage, so repeat reads of the same content never reach the application layer at all.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "pasteSvc", "keygen", "keygenStandby", "keydb", "keydbStandby", "objectStorage", "redirectSvc", "cache", "pasteDB", "cdn", "queue", "analyticsSvc", "analyticsDB"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-pasteSvc", "pasteSvc-keygen", "keygen-keygenStandby", "keygen-keydb", "keydb-keydbStandby", "pasteSvc-objectStorage", "gateway-redirectSvc", "redirectSvc-cache", "cache-pasteDB", "redirectSvc-objectStorage", "objectStorage-cdn", "cdn-client", "gateway-analyticsSvc", "redirectSvc-queue", "queue-analyticsSvc", "analyticsSvc-analyticsDB"],
    note: "Every read also drops an event on a queue, so the Analytics Service can tally views off the hot path.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "pasteSvc", "keygen", "keygenStandby", "keydb", "keydbStandby", "objectStorage", "redirectSvc", "cache", "pasteDB", "cdn", "queue", "analyticsSvc", "analyticsDB", "cleanup"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-pasteSvc", "pasteSvc-keygen", "keygen-keygenStandby", "keygen-keydb", "keydb-keydbStandby", "pasteSvc-objectStorage", "gateway-redirectSvc", "redirectSvc-cache", "cache-pasteDB", "redirectSvc-objectStorage", "objectStorage-cdn", "cdn-client", "gateway-analyticsSvc", "redirectSvc-queue", "queue-analyticsSvc", "analyticsSvc-analyticsDB", "pasteDB-cleanup", "keydb-cleanup", "objectStorage-cleanup"],
    note: "In the background, the Cleanup Service sweeps expired pastes out of the metadata store, releases their object storage blob, and returns the freed key to the key database.",
    highlight: ["cleanup"],
  },
];

export const designingPastebin: BlogPostData = {
  title: "Designing a Pastebin",
  date: "July 4, 2026",
  slug: "designing-pastebin",
  content: (
    <>
      <Paragraph delay={0.1}>
        Pastebin services let you paste a block of text, a stack trace, a config file, a chunk of code, and
        get back a short link that anyone can open to read it. Pull an error out of a terminal, drop it into
        a paste, and hand the link to a teammate instead of dumping fifty lines directly into a chat window.
      </Paragraph>

      <Heading level={2} delay={0.15}>
        The core idea
      </Heading>

      <Paragraph delay={0.2}>
        Strip away the web form and a Pastebin service is a close cousin of a URL shortener. Both take
        something a user hands over and return a short, unique key that resolves back to it. What differs is
        what sits behind the key. A URL shortener's key points at a redirect target, at most a few hundred
        bytes. A Pastebin's key points at the actual content, which the requirements below cap at 10 MB.
        Storing the payload itself instead of just a pointer to it is the one design choice that pulls a
        whole second storage tier into the system, and it's the thread running through most of what makes
        this design different.
      </Paragraph>

      <Heading level={2} delay={0.25}>
        Requirements
      </Heading>

      <Paragraph delay={0.3}>
        The functional side is short. A user pastes text, no binary uploads, just plain text, and gets back
        a unique URL. Pastes expire automatically after a timespan, with a sensible default the user can
        override at creation, and a user can optionally choose a custom alias instead of an autogenerated
        one.
      </Paragraph>

      <Paragraph delay={0.35}>
        The non-functional requirements carry more weight. Uploaded data has to be reliable, nothing a user
        pastes should ever quietly disappear. The service needs to stay highly available, since an outage
        doesn't just block new pastes, it breaks every existing link too. Reads need to come back with
        minimal latency, and generated keys can't be guessable in sequence, the same enumeration risk a URL
        shortener has to avoid.
      </Paragraph>

      <Paragraph delay={0.4}>
        Two extensions round it out, view analytics per paste, how many times has this been opened, and a
        REST API so other services can create and fetch pastes programmatically.
      </Paragraph>

      <Heading level={2} delay={0.45}>
        Where this differs from a URL shortener
      </Heading>

      <Paragraph delay={0.5}>
        Two decisions come up here that a URL shortener never has to make. First, how big a single paste is
        allowed to be. A 10 MB ceiling is generous enough for a full log dump or a small codebase, and tight
        enough that nobody can use the service as free unlimited file hosting. Second, whether a custom
        alias gets the same size cap as an autogenerated one. It should, an alias with no upper bound means
        the key column in the database stops having a predictable width, which complicates every index built
        on it later. Custom aliases aren't mandatory, but if a user provides one, it plays by the same size
        rules as everything else.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        Sizing the problem
      </Heading>

      <Paragraph delay={0.6}>
        Assume <strong>1 million new pastes a day</strong>, with reads outnumbering writes 5 to 1, a far
        gentler skew than a URL shortener typically sees, since pastes tend to get revisited by a smaller,
        more deliberate audience than a redirect link shared widely on social media. The rest is arithmetic.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Traffic, storage, bandwidth, and cache, each derived from the same starting assumption of 1 million pastes a day."
      />

      <StatTiles items={stats} delay={0.05} />

      <Heading level={2} delay={0.65}>
        Designing the API
      </Heading>

      <Paragraph delay={0.7}>
        A handful of REST endpoints cover the functional requirements and the analytics extension.
      </Paragraph>

      <ApiEndpointsTable items={apiEndpoints} delay={0.05} />

      <Paragraph delay={0.75}>
        The retrieval endpoint is the one place this design parts ways with a URL shortener's redirect. A URL
        shortener's read returns an HTTP 302 with the target in the <InlineCode>Location</InlineCode> header,
        empty body, and lets the browser do the navigating. A Pastebin's read has nothing to navigate to, it
        has to hand back the actual content in the response body, so it returns a plain 200 with the paste's
        text as the payload. That single difference is why a second storage tier for content shows up later
        in this design and never did in the URL shortener one.
      </Paragraph>

      <Paragraph delay={0.8}>
        The same abuse concerns apply here as they do for any public write endpoint. Rate limit paste
        creation and paste retrieval per user or per IP, with looser thresholds for authenticated users than
        anonymous ones, so a handful of scripted callers can't burn through the key space or scrape every
        paste by brute forcing keys.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        Storing the data
      </Heading>

      <Paragraph delay={0.9}>
        The metadata is small and simple, well under a kilobyte a row, with no relationships between pastes
        beyond which user created which one. Two tables cover it.
      </Paragraph>

      <SchemaCards tables={schemaTables} delay={0.05} />

      <Paragraph delay={0.95}>
        Notice the <InlineCode>pastes</InlineCode> table doesn't hold the paste's actual text, only a{" "}
        <InlineCode>content_key</InlineCode> pointing at where that text actually lives. That split, small
        structured metadata in one store, large unstructured content in another, is the main structural
        difference from a URL shortener's schema, where the row itself was small enough to hold the entire
        payload. A key-value or wide-column store like DynamoDB or Cassandra fits the metadata table well,
        the access pattern is a lookup by key, not a join.
      </Paragraph>

      <Heading level={2} delay={1.0}>
        Generating the key
      </Heading>

      <Paragraph delay={1.05}>
        Turning a paste into a short key is the same problem a URL shortener solves, and it's worth walking
        through quickly even though the mechanism doesn't change.
      </Paragraph>

      <Heading level={3} delay={1.1}>
        Hash the paste
      </Heading>

      <Paragraph delay={1.15}>
        Hash the content, or some identifier for it, with MD5 or SHA-256, base62-encode the result, and take
        the first six characters.
      </Paragraph>

      <Formula block delay={1.2}>
        {`64^{6} \\approx 68.7 \\times 10^{9}`}
      </Formula>

      <Paragraph delay={1.25}>
        Six characters already cover the 3.6 billion pastes this system is sized for with plenty of headroom.
        The catch, same as with URLs, is that truncating a 128-bit hash down to six characters throws away
        most of its entropy and opens the door to two different pastes landing on the same short key.
      </Paragraph>

      <HashCollisionDiagram
        delay={0.05}
        caption="A real collision, computed live. Two different pieces of content hash to the same first two characters, the same math that produces a collision at six characters, just slower to reach."
      />

      <Paragraph delay={1.3}>
        There's a second problem specific to hashing the content itself. If two different users happen to
        paste the exact same text, a shared error message copied out of the same crash log, say, they'd get
        the exact same key. That quietly merges two pastes that have nothing to do with each other beyond
        sharing text, tangling ownership, expiration, and analytics that should stay separate.
      </Paragraph>

      <Heading level={3} delay={1.35}>
        Generate keys ahead of time
      </Heading>

      <Paragraph delay={1.4}>
        A standalone <strong>Key Generation Service</strong> sidesteps both problems by pre-generating random, unique
        six-character keys ahead of any paste, storing them in a key database split into unused and used
        tables. An app server asks for a key, the service hands one out and immediately marks it used before
        that key ever reaches the server, so two concurrent requests can never walk away with the same one.
      </Paragraph>

      <KeyHandoffDiagram
        delay={0.05}
        caption="Two servers ask for a key at once. The Key Generation Service marks a key used the instant it hands it out, so no two servers can ever walk away with the same one."
      />

      <Paragraph delay={1.45}>
        App servers can cache a batch of keys locally so most create requests skip the round trip to the Key
        Generation Service entirely. If a server dies holding unused keys, those are simply lost, an
        acceptable cost against a key space this large.
      </Paragraph>

      <Formula block delay={1.5}>
        {`6 \\text{ bytes/key} \\times 68.7 \\times 10^{9} \\text{ keys} \\approx 412 \\text{ GB}`}
      </Formula>

      <Paragraph delay={1.55}>
        That's the whole key database, and it's the exact same Key Generation Service a URL shortener uses,
        the math doesn't care what the key eventually points to. What's different here is where that number
        lands relative to everything else. In a URL shortener, the key database was roughly on the same order
        as the rest of the storage. Here it's a rounding error next to the 51.4 TB of actual paste content
        waiting in object storage, a reversal of which piece of the system is the big one.
      </Paragraph>

      <Heading level={2} delay={1.6}>
        Splitting metadata from content
      </Heading>

      <Paragraph delay={1.65}>
        This is the structural change a URL shortener never needed. A redirect target is small enough to sit
        directly in the same row as its key. A paste can run up to 10 MB, and cramming that into the same row
        as its metadata would bloat every index built on that table and slow down every metadata-only query,
        even ones that never touch the content at all.
      </Paragraph>

      <Paragraph delay={1.7}>
        The fix is to keep them apart. Metadata, the key, expiration, owner, paste name, lives in a small,
        fast key-value store. The actual bytes live in <strong>object storage</strong>, something like Amazon S3, addressed by
        the <InlineCode>content_key</InlineCode> stored in that metadata row. Writing a paste means two steps,
        upload the content to object storage first, then write a metadata row that points at it. Reading a
        paste reverses the order, look up the metadata row to check it exists and hasn't expired, then fetch
        the actual bytes from object storage using its <InlineCode>content_key</InlineCode>.
      </Paragraph>

      <Paragraph delay={1.75}>
        Splitting them this way means the two stores scale on completely different axes. The metadata store
        scales for lookup throughput, the object store scales for raw capacity, and neither one's growth
        curve is bottlenecked by the other.
      </Paragraph>

      <Heading level={2} delay={1.8}>
        Caching hot pastes
      </Heading>

      <Paragraph delay={1.85}>
        The same 80-20 pattern from the URL shortener applies here, a small slice of pastes account for most
        reads. A cache in front of the metadata store, keyed by the paste's short key, keeps the majority of
        lookups from ever touching the database.
      </Paragraph>

      <CacheFlowDiagram
        delay={0.05}
        caption="The Retrieval Service always checks the metadata cache first. A hit skips straight to fetching content, a miss falls through to the paste database and populates the cache before continuing."
      />

      <Paragraph delay={1.9}>
        <strong>Least Recently Used</strong> is a reasonable eviction policy here too, and running multiple cache replicas
        spreads read load further. The wrinkle a URL shortener didn't have is that a cache hit on the
        metadata still leaves a second fetch to make. The actual content still has to come out of object
        storage, the metadata cache only shortcuts the "does this exist and is it still valid" check.
      </Paragraph>

      <Heading level={2} delay={1.95}>
        A CDN in front of the content
      </Heading>

      <Paragraph delay={2.0}>
        That second fetch is worth optimizing separately, and it's the other real addition over a URL
        shortener's design. A redirect is a few hundred bytes, cheap enough that caching it at the
        application layer is plenty. Paste content can run up to 10 MB, and a popular paste, a widely shared
        incident writeup or a snippet linked from a public forum, gets fetched by the same bytes over and
        over. Fronting object storage with a <strong>CDN</strong> lets those repeat reads get served from an edge location
        close to the reader, without the request ever reaching the Retrieval Service or the origin object
        store at all.
      </Paragraph>

      <Paragraph delay={2.05}>
        This only pays off for pastes that are actually popular, so it's the same 80-20 logic as the metadata
        cache, just applied one layer further out and to a much heavier payload.
      </Paragraph>

      <Heading level={2} delay={2.1}>
        Data partitioning
      </Heading>

      <Paragraph delay={2.15}>
        The metadata store still needs partitioning once it holds billions of rows. Range partitioning by key
        prefix is simple but uneven, since keys don't distribute themselves evenly across the alphabet.
        <strong>Consistent hashing</strong> does better, mapping both keys and shards onto the same ring so adding or removing
        a shard only reshuffles its immediate neighbors instead of the whole dataset. Object storage services
        like S3 largely handle this partitioning problem internally, so the manual work here is really just
        the metadata layer.
      </Paragraph>

      <Heading level={2} delay={2.2}>
        Load balancing
      </Heading>

      <Paragraph delay={2.25}>
        A load balancer sits in the same three places it would for any of these designs, between clients and
        app servers, between app servers and the metadata store, and between app servers and the cache. Round
        robin is a fine default, cheap and self-correcting when a backend goes down, though it's blind to
        load, so a load balancer that actually checks backend health and shifts traffic away from a
        struggling instance is worth the extra complexity once the fleet grows.
      </Paragraph>

      <Heading level={2} delay={2.3}>
        Expiration and cleanup
      </Heading>

      <Paragraph delay={2.35}>
        Checking expiration on every write would mean scanning the whole metadata table on a schedule, which
        is wasted work most of the time. Lazy expiration is lighter, check a paste's expiration only when
        someone actually requests it, and delete it on the spot if it's past due. A background Cleanup
        Service catches whatever lazy deletion misses, sweeping expired rows out of the metadata store,
        freeing the object storage blob they pointed to, and returning the key to the key database's unused
        table, all during low traffic windows.
      </Paragraph>

      <Paragraph delay={2.4}>
        That third step is new. A URL shortener's cleanup only ever touched two stores, the URL table and the
        key table. Here it's three, since every expired paste also has to release actual bytes sitting in
        object storage, not just a row.
      </Paragraph>

      <Heading level={2} delay={2.45}>
        Tracking usage
      </Heading>

      <Paragraph delay={2.5}>
        Once per-paste view counts are a requirement, every read has to leave a trace. Incrementing a counter
        on the paste's own row for every view falls over exactly where it matters, a popular paste getting
        hammered with concurrent reads all fighting to update the same row. Logging each view to an
        append-only event stream and aggregating counts out of band, a batched write every few seconds,
        trades perfectly real-time counts for a system that doesn't buckle under its own popular pastes.
      </Paragraph>

      <Heading level={2} delay={2.55}>
        Private pastes and permissions
      </Heading>

      <Paragraph delay={2.6}>
        Paste content leans sensitive more often than a redirect target does, a config file with an internal
        hostname in it, a log dump with an API key nobody meant to share. Supporting private pastes means
        storing a permission level alongside each paste and a separate table mapping a paste's key to the
        user IDs allowed to read it. A request for a private paste from someone not on that list gets an HTTP
        401 instead of the content, one extra lookup on the read path that's cheap enough not to move the
        latency budget.
      </Paragraph>

      <Heading level={2} delay={2.65}>
        Putting it all together
      </Heading>

      <Paragraph delay={2.7}>
        Every piece lands in one architecture. Client traffic hits a load balancer, fans out through an API
        gateway to dedicated creation, retrieval, and analytics services, and each of those leans on its own
        datastore, with a CDN sitting in front of object storage for the pastes popular enough to need it.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={nodes}
        edges={edges}
        phases={phases}
        height={700}
        delay={0.05}
        caption="The complete design. Client traffic passes through a load balancer and gateway into dedicated creation, retrieval, and analytics services, with paste content split off into object storage and a CDN in front of it, and a cleanup service sweeping the metadata store, key database, and object storage alike."
      />

      <Heading level={2} delay={2.75}>
        Takeaways
      </Heading>

      <List delay={2.8}>
        <ListItem>
          Split metadata from content the moment a payload can outgrow a single database row. Small
          structured data belongs in a key-value store, large blobs belong in object storage, and each scales
          on its own axis.
        </ListItem>
        <ListItem>
          Reuse the same Key Generation Service pattern as a URL shortener. The math for six-character keys
          doesn't change just because the key now points at 10 MB instead of 10 bytes.
        </ListItem>
        <ListItem>
          Cache the metadata lookup and front the content itself with a CDN separately. They solve different
          problems, one shortcuts a database hit, the other shortcuts the network path for a much heavier
          payload.
        </ListItem>
        <ListItem>
          Cleanup now touches three stores instead of two. Forgetting to release the object storage blob when
          a paste expires quietly leaks storage that never shows up in the metadata table's row count.
        </ListItem>
        <ListItem>
          Treat private pastes as a first class requirement, not an afterthought. Paste content ends up
          holding secrets far more often than a shortened link does.
        </ListItem>
      </List>

      <Paragraph delay={2.85}>
        A Pastebin service looks like a URL shortener with a bigger payload until you actually design it, and
        that one difference cascades into a second storage tier, a CDN, and a three-way cleanup sweep that
        the smaller system never needed. Most of the scaffolding, the key generation, the caching pattern,
        the partitioning strategy, carries over untouched. Thanks for reading.
      </Paragraph>
    </>
  ),
};
