import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  InlineCode,
  CodeBlock,
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
  FeedFanoutDiagram,
  PhotoUploadDiagram,
  SchemaCards,
  SchemaTableSpec,
} from "../components";
import {
  Users,
  Waypoints,
  Route,
  Server,
  Zap,
  Database,
  HardDrive,
  Layers,
  Globe,
  Newspaper,
  Image,
  Aperture,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Traffic",
    lines: [
      { expression: "2M new photos/day ÷ 86,400s", result: "≈ 23 photos/s" },
    ],
    note: "500 million total users, 1 million daily active, uploading 2 million new photos a day.",
  },
  {
    title: "Photo storage (10 years)",
    lines: [
      { expression: "2M photos/day × 200 KB", result: "≈ 400 GB/day" },
      { expression: "400 GB/day × 3,650 days", result: "1,460,000 GB" },
      { expression: "1,460,000 GB ÷ 1024", result: "≈ 1,425 TB" },
    ],
    note: "Ten years of photos at roughly 200 KB each, the number that dwarfs everything else in this system.",
  },
];

const stats: StatItem[] = [
  { label: "New photos uploaded per second", value: 23, suffix: "/s", icon: Image, color: "text-blue-500" },
  { label: "Daily active users", value: 1, suffix: "M", icon: Users, color: "text-teal-500" },
  { label: "Average photo size", value: 200, suffix: " KB", icon: Aperture, color: "text-violet-500" },
  { label: "Photo storage needed for 10 years", value: 1425, suffix: " TB", icon: HardDrive, color: "text-indigo-500" },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "User",
    fields: [
      { name: "user_id", note: "4 bytes, primary key" },
      { name: "name", note: "20 bytes" },
      { name: "email", note: "32 bytes" },
      { name: "date_of_birth", note: "4 bytes" },
      { name: "creation_date", note: "4 bytes" },
      { name: "last_login", note: "4 bytes" },
    ],
  },
  {
    name: "Photo",
    fields: [
      { name: "photo_id", note: "4 bytes, primary key, indexed with creation_date" },
      { name: "user_id", note: "4 bytes" },
      { name: "photo_path", note: "256 bytes, points into object storage" },
      { name: "photo_latitude", note: "4 bytes" },
      { name: "photo_longitude", note: "4 bytes" },
      { name: "user_latitude", note: "4 bytes" },
      { name: "user_longitude", note: "4 bytes" },
      { name: "creation_date", note: "4 bytes" },
    ],
  },
  {
    name: "UserFollow",
    fields: [
      { name: "follower_id", note: "4 bytes" },
      { name: "followee_id", note: "4 bytes" },
    ],
  },
];

const metadataCapacityGroups: CapacityGroup[] = [
  {
    title: "User table",
    lines: [
      { expression: "4 + 20 + 32 + 4 + 4 + 4 bytes", result: "68 bytes/row" },
      { expression: "500M users × 68 bytes", result: "≈ 32 GB" },
    ],
    note: "user_id, date_of_birth, creation_date, and last_login are 4-byte fields, name is 20 bytes, email is 32.",
  },
  {
    title: "Photo table (10 years)",
    lines: [
      { expression: "4 + 4 + 256 + 4 + 4 + 4 + 4 + 4 bytes", result: "284 bytes/row" },
      { expression: "2M photos/day × 284 bytes × 3,650 days", result: "≈ 1.88 TB" },
    ],
    note: "photo_path reserves 256 bytes for the object storage key, every other field is a 4-byte integer or timestamp.",
  },
  {
    title: "UserFollow table",
    lines: [
      { expression: "4 + 4 bytes", result: "8 bytes/row" },
      { expression: "500M users × 500 followers × 8 bytes", result: "≈ 1.82 TB" },
    ],
    note: "Just two integer foreign keys per row, but 500 million users following 500 people each adds up fast.",
  },
  {
    title: "Total metadata",
    lines: [
      { expression: "32 GB + 1.88 TB + 1.82 TB", result: "≈ 3.7 TB" },
    ],
    note: "Every metadata table combined, for all 10 years.",
  },
];

const nodes: DiagramNode[] = [
  { id: "client", label: "Client", icon: Users, color: "text-slate-500", x: 8, y: 6 },
  { id: "cdn", label: "CDN", icon: Globe, color: "text-fuchsia-500", x: 92, y: 6 },
  { id: "lb", label: "Load Balancer", icon: Waypoints, color: "text-blue-500", x: 8, y: 26 },
  { id: "gateway", label: "API Gateway", icon: Route, color: "text-sky-500", x: 8, y: 46 },
  { id: "appRead", label: "App Server", sub: "read", icon: Server, color: "text-purple-500", x: 8, y: 66 },
  { id: "appWrite", label: "App Server", sub: "write", icon: Server, color: "text-pink-600", x: 32, y: 66 },
  { id: "cache", label: "Cache", sub: "Redis / Memcached", icon: Zap, color: "text-teal-500", x: 8, y: 86 },
  { id: "metadataDB", label: "Metadata DB", icon: Database, color: "text-blue-600", x: 32, y: 86 },
  { id: "blobStorage", label: "Blob Storage", icon: HardDrive, color: "text-cyan-600", x: 60, y: 46 },
  { id: "taskQueue", label: "Task Queue", icon: Layers, color: "text-orange-500", x: 60, y: 66 },
  { id: "feedSvc", label: "Feed Generation Service", icon: Newspaper, color: "text-emerald-500", x: 84, y: 66 },
];

const edges: DiagramEdge[] = [
  { id: "client-lb", from: "client", to: "lb" },
  { id: "lb-gateway", from: "lb", to: "gateway" },
  { id: "gateway-appWrite", from: "gateway", to: "appWrite" },
  { id: "appWrite-blobStorage", from: "appWrite", to: "blobStorage", bidirectional: true },
  { id: "appWrite-metadataDB", from: "appWrite", to: "metadataDB", bidirectional: true },
  { id: "appWrite-taskQueue", from: "appWrite", to: "taskQueue" },
  { id: "taskQueue-feedSvc", from: "taskQueue", to: "feedSvc" },
  { id: "feedSvc-metadataDB", from: "feedSvc", to: "metadataDB", bidirectional: true },
  { id: "gateway-appRead", from: "gateway", to: "appRead" },
  { id: "appRead-cache", from: "appRead", to: "cache", bidirectional: true },
  { id: "cache-metadataDB", from: "cache", to: "metadataDB", bidirectional: true },
  { id: "blobStorage-cdn", from: "blobStorage", to: "cdn", bidirectional: true },
  { id: "cdn-client", from: "cdn", to: "client", bidirectional: true },
];

const phases: DiagramPhase[] = [
  {
    nodeIds: ["client", "lb"],
    edgeIds: ["client-lb"],
    note: "A client's request hits the load balancer first.",
  },
  {
    nodeIds: ["client", "lb", "gateway"],
    edgeIds: ["client-lb", "lb-gateway"],
    note: "The load balancer forwards it to one of several API gateway instances.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "appWrite", "blobStorage"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-appWrite", "appWrite-blobStorage"],
    note: "Uploading a photo routes to the write app server, which streams the bytes straight into blob storage.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "appWrite", "blobStorage", "metadataDB"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-appWrite", "appWrite-blobStorage", "appWrite-metadataDB"],
    note: "The write server also stores the photo's metadata, owner, location, timestamp, in the metadata database.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "appWrite", "blobStorage", "metadataDB", "taskQueue", "feedSvc"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-appWrite", "appWrite-blobStorage", "appWrite-metadataDB", "appWrite-taskQueue", "taskQueue-feedSvc", "feedSvc-metadataDB"],
    note: "The write also drops a feed generation task on a queue, so the Feed Generation Service can push this photo into followers' feeds off the hot path.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "appWrite", "blobStorage", "metadataDB", "taskQueue", "feedSvc", "appRead", "cache"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-appWrite", "appWrite-blobStorage", "appWrite-metadataDB", "appWrite-taskQueue", "taskQueue-feedSvc", "feedSvc-metadataDB", "gateway-appRead", "appRead-cache", "cache-metadataDB"],
    note: "Reading a feed or a profile routes to a separate read app server, which checks the cache before falling back to the metadata database.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "appWrite", "blobStorage", "metadataDB", "taskQueue", "feedSvc", "appRead", "cache", "cdn"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-appWrite", "appWrite-blobStorage", "appWrite-metadataDB", "appWrite-taskQueue", "taskQueue-feedSvc", "feedSvc-metadataDB", "gateway-appRead", "appRead-cache", "cache-metadataDB", "blobStorage-cdn", "cdn-client"],
    note: "A CDN sits in front of blob storage, so repeat views of a popular photo get served from the edge and never reach the origin at all.",
    highlight: ["cdn"],
  },
];

export const designingInstagram: BlogPostData = {
  title: "Designing Instagram",
  date: "July 4, 2026",
  slug: "designing-instagram",
  content: (
    <>
      <Paragraph delay={0.1}>
        Open Instagram and two things happen almost immediately. You see a feed of photos from people you
        follow, freshly sorted and ready before you've even asked for it, and somewhere behind the scenes
        your own last post already reached every one of your followers' feeds without you doing anything
        else. Both of those feel instant. Neither of them is free. Strip away filters, stories, and direct
        messages, and what's actually running underneath is a photo sharing service built around one
        relationship, a user follows other users, and one output, a <strong>News Feed</strong> assembled from the top
        photos of everyone that user follows.
      </Paragraph>

      <Heading level={2} delay={0.15}>
        Requirements
      </Heading>

      <Paragraph delay={0.2}>
        The functional scope is deliberately narrow. Users can upload and view photos, search by photo or
        video titles, follow other users, and get a News Feed built from the top photos of everyone they
        follow.
      </Paragraph>

      <Paragraph delay={0.25}>
        The non-functional requirements are where the real design pressure comes from.
      </Paragraph>

      <List delay={0.3}>
        <ListItem>
          <strong>High availability.</strong> An outage here doesn't just block new uploads, it takes the feed down for
          everyone still trying to read.
        </ListItem>
        <ListItem>
          <strong>200ms latency</strong> for News Feed generation. A feed that takes a second to load feels broken, even
          if every individual photo behind it loaded fine.
        </ListItem>
        <ListItem>
          Consistency can slip a little. If a user doesn't see a brand new photo in their feed for a few
          seconds, that's an acceptable trade for staying available.
        </ListItem>
        <ListItem>
          Reliability cannot slip at all. An uploaded photo or video should never be lost, full stop.
        </ListItem>
      </List>

      <Paragraph delay={0.35}>
        Tags on photos, searching by tag, comments, tagging users in a photo, and suggesting who to follow
        are all out of scope here, each is its own design problem layered on top of this one.
      </Paragraph>

      <Heading level={2} delay={0.4}>
        Design considerations
      </Heading>

      <Paragraph delay={0.45}>
        Four things fall out of the requirements directly. The system is read heavy, so it should be built to
        retrieve photos fast above almost everything else. Users can upload as many photos as they want, so
        storage management has to scale gracefully rather than being an afterthought. Viewing a photo needs
        low latency, and an uploaded photo needs to be reliable enough that losing one is treated as a real
        incident, not an acceptable rounding error.
      </Paragraph>

      <Heading level={2} delay={0.5}>
        Sizing the problem
      </Heading>

      <Paragraph delay={0.55}>
        Assume <strong>500 million total users</strong>, 1 million of them active daily, uploading 2 million new photos a
        day at an average size of 200 KB. That's the whole starting point, everything else below is
        arithmetic.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Traffic and photo storage, both derived from 2 million new photos a day at 200 KB each."
      />

      <StatTiles items={stats} delay={0.05} />

      <Heading level={2} delay={0.6}>
        Splitting reads from writes
      </Heading>

      <Paragraph delay={0.65}>
        A web server can only hold so many open connections at once, a limit of 500 concurrent connections is
        a reasonable assumption. A photo upload holds that connection open far longer than a read does,
        writing to disk is slow, reading from a warm cache is fast. If uploads and reads share the same pool
        of app servers, a burst of uploads can quietly starve every read request behind it, even though
        reads are the far more common case in a system this skewed toward viewing over posting.
      </Paragraph>

      <Paragraph delay={0.7}>
        The fix is to split them into two dedicated fleets, a set of write app servers that only handle
        uploads and a set of read app servers that only handle everything else. Each fleet scales
        independently, and a spike in uploads never touches the read path's latency budget.
      </Paragraph>

      <Heading level={2} delay={0.75}>
        Database schema
      </Heading>

      <Paragraph delay={0.8}>
        Three tables cover the functional requirements. <InlineCode>Photo</InlineCode> needs an index on{" "}
        <InlineCode>(photo_id, creation_date)</InlineCode> since the News Feed always wants the most recent
        photos first, and <InlineCode>UserFollow</InlineCode> is nothing more than a directed edge list between
        two user IDs.
      </Paragraph>

      <SchemaCards tables={schemaTables} delay={0.05} />

      <Paragraph delay={0.85}>
        A relational database like MySQL handles this schema fine at small scale, and its joins make queries
        like "photos from everyone I follow" straightforward to write. The familiar catch is that relational
        databases get harder to scale horizontally the bigger they get. A distributed key-value store
        sidesteps that, with <InlineCode>photo_id</InlineCode> as the key
        and an object holding the photo's location, owner, and timestamp as the value, at the cost of doing
        joins in application code instead of in the database. Either way, notice that{" "}
        <InlineCode>photo_path</InlineCode> is a pointer, not the photo itself. The actual bytes live in{" "}
        <strong>object storage</strong>, something like Amazon S3 or HDFS, addressed by that path, completely
        separate from the metadata store that just remembers where to find them. NoSQL stores used this way
        typically keep a handful of replicas for durability, and deletes are usually soft, the row is marked
        deleted and kept around for a grace period before it's actually purged, which is what makes
        undeleting a photo possible at all.
      </Paragraph>

      <Paragraph delay={0.9}>
        Every integer or timestamp field, <InlineCode>user_id</InlineCode>,{" "}
        <InlineCode>creation_date</InlineCode>, <InlineCode>photo_latitude</InlineCode>, and so on, is assumed to
        be 4 bytes. <InlineCode>name</InlineCode> gets 20 bytes and <InlineCode>email</InlineCode> gets 32, and{" "}
        <InlineCode>photo_path</InlineCode> gets a generous 256 bytes to hold an object storage key. Add up a
        User row's fields, or a Photo row's, and the totals below are what you get.
      </Paragraph>

      <CapacityMathDiagram
        groups={metadataCapacityGroups}
        delay={0.05}
        caption="Row sizes computed directly from the schema above, then multiplied out across 500 million users and 10 years of photos."
      />

      <Paragraph delay={0.95}>
        3.7 TB of metadata against 1,425 TB of raw photo bytes is the ratio that shapes the rest of this
        design. Whatever stores the metadata can be small, fast, and heavily indexed. Whatever stores the
        photos themselves needs to be built for raw capacity above everything else, and the two should
        almost certainly not be the same system.
      </Paragraph>

      <Heading level={2} delay={1.0}>
        Generating unique photo IDs
      </Heading>

      <Paragraph delay={1.05}>
        Every photo needs a globally unique ID before it can be written anywhere, and a naive
        auto-increment column on a single database instance becomes a single point of failure the moment
        that instance goes down. The fix is a <strong>Key Generation Service</strong>, the same pattern any
        system needs when it has to hand out unique IDs without a single point of failure, just generating
        numeric IDs instead of short codes here.
      </Paragraph>

      <Paragraph delay={1.1}>
        Run two ID generating databases instead of one, one producing only even numbers and the other only
        odd, so neither is a single point of failure on its own.
      </Paragraph>

      <CodeBlock
        language="Bash"
        delay={1.15}
        code={`KeyGeneratingServer1
auto-increment-increment = 2
auto-increment-offset = 1

KeyGeneratingServer2
auto-increment-increment = 2
auto-increment-offset = 2`}
      />

      <Paragraph delay={1.2}>
        A load balancer round robins between them. The two can drift out of sync, one generating slightly
        more IDs than the other, and that's fine, nothing downstream cares which server an ID came from, only
        that no two photos ever end up with the same one.
      </Paragraph>

      <Paragraph delay={1.25}>
        Fold the creation timestamp into the ID itself and this same mechanism buys something extra, IDs
        that sort chronologically for free. Reserve the top 31 bits for an epoch timestamp, enough to cover
        the next 50 years, and the bottom 9 bits for an auto-incrementing sequence that resets every second.
      </Paragraph>

      <Formula block delay={1.3}>
        {`86{,}400 \\times 365 \\times 50 \\approx 1.6 \\times 10^{9} \\text{ seconds} \\;\\Rightarrow\\; 31 \\text{ bits}`}
      </Formula>

      <Paragraph delay={1.35}>
        23 new photos a second only needs about 5 bits, but rounding up to 9 lands the whole ID on a clean
        40 bit, 5 byte boundary, with plenty of headroom left over. A primary index on this ID now sorts
        photos by creation time as a side effect of sorting by key, which is exactly the access pattern the
        News Feed needs.
      </Paragraph>

      <Heading level={2} delay={1.4}>
        Sharding the metadata
      </Heading>

      <Paragraph delay={1.45}>
        3.7 TB of metadata is small enough to fit on a handful of machines, but it won't stay that way for
        long at this growth rate, so it needs a partitioning scheme from the start.
      </Paragraph>

      <Paragraph delay={1.5}>
        Sharding by <InlineCode>user_id</InlineCode> keeps every photo a user owns on the same shard, which sounds
        convenient until a celebrity account with millions of followers turns their one shard into the
        hottest machine in the fleet. It also assumes every user's photos fit on one shard in the first
        place, which stops being true for a sufficiently prolific poster.
      </Paragraph>

      <Paragraph delay={1.55}>
        Sharding by <InlineCode>photo_id</InlineCode> instead avoids both problems, since load spreads evenly across
        shards regardless of which user posted what. The tradeoff is that <InlineCode>photo_id</InlineCode> has to
        exist before you know which shard to write it to, which is exactly what the Key Generation Service
        above already solves, generate the ID first, then route with <InlineCode>photo_id % number_of_shards</InlineCode>.
      </Paragraph>

      <Paragraph delay={1.6}>
        Modulo sharding has a sharp edge though, adding or removing a shard changes the divisor, which
        reshuffles almost every key's target shard at once. <strong>Consistent hashing</strong> is the standard fix, it maps
        both shards and keys onto the same ring so that adding or removing one shard only reassigns its
        immediate neighbors instead of the whole dataset. Keeping many more logical partitions than physical
        database servers, with a small config mapping one to the other, gives the same flexibility, moving a
        busy partition to its own server later is just an update to that config, not a data migration.
      </Paragraph>

      <Heading level={2} delay={1.65}>
        Building the News Feed
      </Heading>

      <Paragraph delay={1.7}>
        The naive approach computes a feed at read time, fetch the list of people a user follows, pull each
        of their latest photos, merge and rank the results, and return the top 100. This is <strong>fan-out on
        read</strong>, and it puts real work, several queries plus a sort, on the critical path of every single feed
        load, which is exactly the request this design has a 200ms budget for.
      </Paragraph>

      <Paragraph delay={1.75}>
        <strong>Fan-out on write</strong> flips the order. The moment a photo is posted, a background Feed Generation
        Service immediately pushes it into a precomputed <InlineCode>UserNewsFeed</InlineCode> row for every one of that
        user's followers. Reading a feed later is then just a lookup against that table, no joins, no
        ranking at request time, because the work already happened when the photo was posted instead of when
        it was read.
      </Paragraph>

      <FeedFanoutDiagram
        delay={0.05}
        caption="Posting a photo triggers the Feed Generation Service to push it directly into every follower's precomputed News Feed, so reading a feed later is just a lookup, not an assembly."
      />

      <Paragraph delay={1.8}>
        This is the same push versus pull tradeoff that shows up anywhere a system has to choose between
        doing work eagerly or lazily. Push, fan-out on write, means the server does the work once at post
        time and every subsequent read is cheap, but a celebrity account with millions of followers turns
        one post into millions of writes. Pull, fan-out on read, means posting stays cheap no matter how many
        followers someone has, at the cost of doing that assembly work over and over on every single feed
        load. A hybrid splits the difference, fan out normal accounts on write since their follower counts
        are small, and let very high follower count accounts get pulled and merged in at read time instead,
        so one popular account can't turn every post into a fan-out storm.
      </Paragraph>

      <Heading level={2} delay={1.85}>
        Uploading a photo directly to blob storage
      </Heading>

      <Paragraph delay={1.9}>
        A naive upload path has the client send the photo's bytes to the write app server, which then relays
        them into blob storage. That doubles the bandwidth every upload consumes, once into the app server,
        again out to storage, and turns the app tier into a wall the entire write path has to funnel
        through.
      </Paragraph>

      <Paragraph delay={1.95}>
        A <strong>pre-signed URL</strong> skips the relay. The write app server asks blob storage for a short-lived,
        single-use upload URL scoped to one exact object key, generated from the new photo ID, and hands
        that URL back to the client instead of accepting the bytes itself. The client uploads directly to
        blob storage, and only pings the app server afterward to confirm the upload finished, at which point
        the app server writes the metadata row pointing at that key.
      </Paragraph>

      <Paragraph delay={2.0}>
        The signed URL itself is what keeps this safe to hand to a client. It's scoped to a single key,
        expires within minutes, and can carry a maximum content length and a locked content type, so a
        client can't reuse it to upload something arbitrary, oversized, or aimed at a key it was never
        granted.
      </Paragraph>

      <Heading level={2} delay={2.05}>
        Generating thumbnails
      </Heading>

      <Paragraph delay={2.1}>
        Rendering a feed of full resolution originals would waste bandwidth on every scroll, so a separate
        step generates several smaller sizes, a feed thumbnail, a profile grid thumbnail, alongside the
        original.
      </Paragraph>

      <PhotoUploadDiagram
        delay={0.05}
        caption="The write path stores the original in object storage and, in parallel, a Thumbnail Service generates smaller sizes for feeds and previews. A CDN fronts both, so repeat views never reach origin storage again."
      />

      <Paragraph delay={2.15}>
        Doing this resizing synchronously on the upload request would make every upload wait on image
        processing it doesn't need to. Queuing it as a background job, the same task queue pattern used to
        drive the Feed Generation Service, lets the upload itself return as soon as the original is safely
        stored, while thumbnails get generated a moment later off the request path.
      </Paragraph>

      <Heading level={2} delay={2.2}>
        Reliability and redundancy
      </Heading>

      <Paragraph delay={2.25}>
        Losing a photo isn't an option, so every uploaded file gets stored as multiple copies across
        different storage servers, if one dies, the photo is still retrievable from another. The same logic
        extends to every other stateful piece of this design. A service running as a single instance is a
        single point of failure, so every one of them, the API gateway, the ID generating databases, the
        write app servers, runs as more than one instance. A standby copy that isn't serving live traffic but
        can take over automatically on failover buys the same protection for pieces that only need one active
        instance at a time.
      </Paragraph>

      <Heading level={2} delay={2.3}>
        Caching and a CDN
      </Heading>

      <Paragraph delay={2.35}>
        The same 80-20 pattern that shows up in every read-heavy system applies here too, a small slice of
        photos accounts for most of the traffic. A metadata cache in front of the database, evicted with
        <strong> Least Recently Used</strong>, keeps the majority of feed lookups from ever reaching the database at all.
      </Paragraph>

      <Paragraph delay={2.4}>
        The actual photo bytes get a second layer of caching in front of object storage, a CDN.
        Instagram's content is exactly the case where a <strong>pull CDN</strong> beats a push CDN, a push model
        would require proactively uploading every new photo to edge locations ahead of any demand for it,
        which makes no sense against 2 million uploads a day when most of them will never go viral. A pull
        CDN instead fetches from origin storage lazily on the first request for a given photo and caches it
        at the edge from then on, so only photos that are actually being viewed ever occupy edge cache
        space, and the edge naturally tracks whatever's currently popular without anyone deciding what to
        pre-load.
      </Paragraph>

      <Heading level={2} delay={2.45}>
        Rate limiting
      </Heading>

      <Paragraph delay={2.5}>
        Public write endpoints need a ceiling. Capping uploads and searches per user or per IP, with looser
        limits for authenticated users than anonymous ones, keeps a handful of scripted callers from being
        able to flood the write path or scrape the metadata store by hammering search.
      </Paragraph>

      <Heading level={2} delay={2.55}>
        Private accounts
      </Heading>
      <Paragraph delay={2.6}>
        A public photo can be served to anyone who asks, but a private account changes that check on every
        single read. Storing an account privacy flag on the user row, plus a separate table of approved
        follower relationships for private accounts, means the read app server has one extra lookup to make,
        is the requester an approved follower of this account, before it returns anything. A request that
        fails that check gets an HTTP 403 instead of the photo, and that lookup has to happen for every photo
        read, not just profile views, or a private account's individual photo URLs become an accidental leak.
      </Paragraph>

      <Heading level={2} delay={2.65}>
        Putting it all together
      </Heading>

      <Paragraph delay={2.7}>
        Every piece lands in one architecture. Client traffic passes through a load balancer and a pool of
        API gateways into separate read and write app server fleets, uploads fan out to blob storage and a
        background feed generation queue, and reads lean on a cache in front of the metadata database with a
        CDN fronting the photos themselves.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={nodes}
        edges={edges}
        phases={phases}
        height={640}
        delay={0.05}
        caption="The complete design. Reads and writes split into separate app server fleets, uploads fan out into blob storage and a feed generation queue, and a cache plus CDN sit in front of the metadata database and photo storage respectively."
      />

      <Heading level={2} delay={2.75}>
        Takeaways
      </Heading>

      <List delay={2.8}>
        <ListItem>
          A read-heavy system with a hard latency budget on its main read path should split writes and reads
          into separate fleets before anything else, a slow upload should never be able to starve a fast
          read.
        </ListItem>
        <ListItem>
          Fan-out on write turns feed reads into a cheap lookup by doing the assembly work once, at post
          time, instead of on every single load, the same push versus pull tradeoff worth reaching for
          hybrid on once one account's follower count gets large enough to make fan-out expensive.
        </ListItem>
        <ListItem>
          Photo bytes and their metadata scale on completely different axes, 1,425 TB versus 3.7 TB in this
          design, and belong in different systems, object storage for the former, a fast indexed store for
          the latter.
        </ListItem>
        <ListItem>
          Shard by an ID that's independent of any one user, not by the user themselves, or a single popular
          account turns its shard into the hottest machine in the fleet.
        </ListItem>
        <ListItem>
          Let clients upload straight to blob storage with a scoped, short-lived pre-signed URL instead of
          relaying bytes through the app tier, and a pull CDN fits user-generated content better than a push
          CDN precisely because nobody knows ahead of time which of today's 2 million uploads will actually
          get traffic.
        </ListItem>
      </List>

      <Paragraph delay={2.85}>
        Nothing about Instagram's core mechanics is exotic on its own, key generation, sharding, caching, a
        CDN, all of it shows up in some form in every other system. What makes this one
        distinct is the combination, a follow graph driving a precomputed feed, a two order of magnitude gap
        between photo storage and metadata storage, and a write path that has to fan out to both a queue and
        a thumbnail pipeline before it's actually done. Thanks for reading.
      </Paragraph>
    </>
  ),
};
