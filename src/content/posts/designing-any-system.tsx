import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  DiagramPhase,
} from "../components";
import {
  Users,
  Waypoints,
  Globe,
  Route,
  Server,
  Zap,
  Database,
  Boxes,
  Radar,
  Bell,
  Newspaper,
  Search,
  FileSearch,
  Film,
  Workflow,
  Cpu,
  Warehouse,
} from "lucide-react";

const entryNodes: DiagramNode[] = [
  { id: "client", label: "Client", icon: Users, color: "text-slate-500", x: 50, y: 15 },
  { id: "cdn", label: "CDN", sub: "static content", icon: Globe, color: "text-fuchsia-500", x: 85, y: 15 },
  { id: "lb", label: "Load Balancer", icon: Waypoints, color: "text-blue-500", x: 50, y: 50 },
  { id: "apiGateway", label: "API Gateway", sub: "auth, rate limits, routing", icon: Route, color: "text-sky-500", x: 50, y: 85 },
];

const entryEdges: DiagramEdge[] = [
  { id: "client-lb", from: "client", to: "lb" },
  { id: "client-cdn", from: "client", to: "cdn", bidirectional: true },
  { id: "lb-apiGateway", from: "lb", to: "apiGateway" },
];

const splitStorageNodes: DiagramNode[] = [
  { id: "apiGateway2", label: "API Gateway", icon: Route, color: "text-sky-500", x: 50, y: 10 },
  { id: "metadataServer2", label: "Metadata Server", sub: "control plane", icon: Server, color: "text-violet-500", x: 25, y: 38 },
  { id: "blockServer2", label: "Block Server", sub: "data plane", icon: Server, color: "text-pink-500", x: 75, y: 38 },
  { id: "cache2", label: "Cache", sub: "Redis / Memcached", icon: Zap, color: "text-teal-500", x: 25, y: 66 },
  { id: "metadataDB2", label: "Metadata DB", sub: "replicated, partitioned", icon: Database, color: "text-blue-600", x: 25, y: 94 },
];

const splitStorageEdges: DiagramEdge[] = [
  { id: "gw-meta", from: "apiGateway2", to: "metadataServer2" },
  { id: "gw-block", from: "apiGateway2", to: "blockServer2" },
  { id: "meta-block", from: "metadataServer2", to: "blockServer2", bidirectional: true },
  { id: "meta-cache", from: "metadataServer2", to: "cache2", bidirectional: true },
  { id: "cache-db", from: "cache2", to: "metadataDB2", bidirectional: true },
];

const asyncSearchNodes: DiagramNode[] = [
  { id: "metadataServer3", label: "Metadata Server", icon: Server, color: "text-violet-500", x: 50, y: 12 },
  { id: "notification3", label: "Notification Service", sub: "queue-backed", icon: Bell, color: "text-rose-500", x: 15, y: 55 },
  { id: "feedGen3", label: "Feed Generation Service", sub: "queue-backed", icon: Newspaper, color: "text-emerald-500", x: 50, y: 55 },
  { id: "searchAggregator3", label: "Search Results Aggregator", icon: Search, color: "text-cyan-600", x: 85, y: 55 },
  { id: "searchIndex3", label: "Search Index", sub: "Elasticsearch, sharded", icon: FileSearch, color: "text-indigo-500", x: 85, y: 90 },
];

const asyncSearchEdges: DiagramEdge[] = [
  { id: "meta-notif", from: "metadataServer3", to: "notification3" },
  { id: "meta-feed", from: "metadataServer3", to: "feedGen3" },
  { id: "meta-aggregator", from: "metadataServer3", to: "searchAggregator3" },
  { id: "aggregator-index", from: "searchAggregator3", to: "searchIndex3", bidirectional: true },
];

const mediaNodes: DiagramNode[] = [
  { id: "blockServer4", label: "Block Server", icon: Server, color: "text-pink-500", x: 50, y: 10 },
  { id: "mediaStorage4", label: "Media Storage", sub: "images, thumbnails, video", icon: Film, color: "text-orange-500", x: 50, y: 45 },
  { id: "videoPipeline4", label: "Video Processing", sub: "queue, service, workers", icon: Workflow, color: "text-amber-600", x: 50, y: 80 },
];

const mediaEdges: DiagramEdge[] = [
  { id: "block-media", from: "blockServer4", to: "mediaStorage4", bidirectional: true },
  { id: "media-video", from: "mediaStorage4", to: "videoPipeline4" },
];

const analyticsNodes: DiagramNode[] = [
  { id: "metadataDB5", label: "Metadata DB", icon: Database, color: "text-blue-600", x: 50, y: 10 },
  { id: "dataProcessing5", label: "Data Processing", sub: "Hadoop / Spark, scheduler, workers", icon: Cpu, color: "text-purple-500", x: 50, y: 45 },
  { id: "warehouseReports5", label: "Data Warehouse", sub: "warehouse + reports", icon: Warehouse, color: "text-green-600", x: 50, y: 80 },
];

const analyticsEdges: DiagramEdge[] = [
  { id: "db-processing", from: "metadataDB5", to: "dataProcessing5" },
  { id: "processing-warehouse", from: "dataProcessing5", to: "warehouseReports5" },
];

const finalNodes: DiagramNode[] = [
  { id: "client", label: "Client", icon: Users, color: "text-slate-500", x: 50, y: 4 },
  { id: "lb", label: "Load Balancer", icon: Waypoints, color: "text-blue-500", x: 50, y: 14 },
  { id: "cdn", label: "CDN", sub: "static content", icon: Globe, color: "text-fuchsia-500", x: 90, y: 14 },
  { id: "apiGateway", label: "API Gateway", sub: "auth, rate limits, routing", icon: Route, color: "text-sky-500", x: 50, y: 24 },
  { id: "metadataServer", label: "Metadata Server", sub: "control plane", icon: Server, color: "text-violet-500", x: 32, y: 34 },
  { id: "blockServer", label: "Block Server", sub: "data plane", icon: Server, color: "text-pink-500", x: 68, y: 34 },
  { id: "notification", label: "Notification Service", sub: "queue-backed", icon: Bell, color: "text-rose-500", x: 10, y: 54 },
  { id: "cache", label: "Cache", sub: "Redis / Memcached", icon: Zap, color: "text-teal-500", x: 32, y: 54 },
  { id: "feedGen", label: "Feed Generation Service", sub: "queue-backed", icon: Newspaper, color: "text-emerald-500", x: 50, y: 54 },
  { id: "mediaStorage", label: "Media Storage", sub: "images, thumbnails, video", icon: Film, color: "text-orange-500", x: 68, y: 54 },
  { id: "searchAggregator", label: "Search Results Aggregator", icon: Search, color: "text-cyan-600", x: 90, y: 54 },
  { id: "observability", label: "Coordination Service", sub: "ZooKeeper, logging, tracing", icon: Radar, color: "text-slate-500", x: 10, y: 65 },
  { id: "shardManager", label: "Shard Manager", sub: "directory-based partitioning", icon: Boxes, color: "text-amber-600", x: 32, y: 65 },
  { id: "videoPipeline", label: "Video Processing", sub: "queue, service, workers", icon: Workflow, color: "text-amber-600", x: 68, y: 65 },
  { id: "searchIndex", label: "Search Index", sub: "Elasticsearch, sharded", icon: FileSearch, color: "text-indigo-500", x: 90, y: 65 },
  { id: "metadataDB", label: "Metadata DB", sub: "replicated, partitioned", icon: Database, color: "text-blue-600", x: 32, y: 76 },
  { id: "dataProcessing", label: "Data Processing", sub: "Hadoop / Spark, scheduler, workers", icon: Cpu, color: "text-purple-500", x: 32, y: 85 },
  { id: "warehouseReports", label: "Data Warehouse", sub: "warehouse + reports", icon: Warehouse, color: "text-green-600", x: 32, y: 94 },
];

const finalEdges: DiagramEdge[] = [
  { id: "client-lb", from: "client", to: "lb" },
  { id: "client-cdn", from: "client", to: "cdn", bidirectional: true },
  { id: "lb-apiGateway", from: "lb", to: "apiGateway" },
  { id: "gw-meta", from: "apiGateway", to: "metadataServer" },
  { id: "gw-block", from: "apiGateway", to: "blockServer" },
  { id: "meta-block", from: "metadataServer", to: "blockServer", bidirectional: true },
  { id: "meta-notif", from: "metadataServer", to: "notification" },
  { id: "meta-cache", from: "metadataServer", to: "cache", bidirectional: true },
  { id: "meta-feed", from: "metadataServer", to: "feedGen" },
  { id: "block-media", from: "blockServer", to: "mediaStorage", bidirectional: true },
  { id: "meta-aggregator", from: "metadataServer", to: "searchAggregator" },
  { id: "aggregator-index", from: "searchAggregator", to: "searchIndex", bidirectional: true },
  { id: "cache-shard", from: "cache", to: "shardManager", bidirectional: true },
  { id: "obs-shard", from: "observability", to: "shardManager", bidirectional: true },
  { id: "media-video", from: "mediaStorage", to: "videoPipeline", bidirectional: true },
  { id: "shard-db", from: "shardManager", to: "metadataDB", bidirectional: true },
  { id: "db-processing", from: "metadataDB", to: "dataProcessing" },
  { id: "processing-warehouse", from: "dataProcessing", to: "warehouseReports" },
];

const finalPhases: DiagramPhase[] = [
  {
    nodeIds: ["client", "lb"],
    edgeIds: ["client-lb"],
    note: "A request starts at a load balancer, which spreads traffic across many identical servers so no single one gets overwhelmed.",
  },
  {
    nodeIds: ["client", "lb", "cdn"],
    edgeIds: ["client-lb", "client-cdn"],
    note: "A CDN sits beside it, serving cached static content from the edge without ever reaching the servers behind the gateway.",
  },
  {
    nodeIds: ["client", "lb", "cdn", "apiGateway"],
    edgeIds: ["client-lb", "client-cdn", "lb-apiGateway"],
    note: "Everything else passes through an API Gateway, one front door that handles auth, rate limiting, and routing before any real logic runs.",
  },
  {
    nodeIds: ["client", "lb", "cdn", "apiGateway", "metadataServer", "blockServer"],
    edgeIds: ["client-lb", "client-cdn", "lb-apiGateway", "gw-meta", "gw-block", "meta-block"],
    note: "Past the gateway, the system splits into a Metadata Server that makes decisions and a Block Server that moves large files, control plane and data plane.",
  },
  {
    nodeIds: ["client", "lb", "cdn", "apiGateway", "metadataServer", "blockServer", "cache", "shardManager"],
    edgeIds: ["client-lb", "client-cdn", "lb-apiGateway", "gw-meta", "gw-block", "meta-block", "meta-cache", "cache-shard"],
    note: "The Metadata Server reads through a cache before ever touching a database, with a Shard Manager keeping directory-based partitioning current as the cache grows.",
  },
  {
    nodeIds: ["client", "lb", "cdn", "apiGateway", "metadataServer", "blockServer", "cache", "shardManager", "metadataDB"],
    edgeIds: ["client-lb", "client-cdn", "lb-apiGateway", "gw-meta", "gw-block", "meta-block", "meta-cache", "cache-shard", "shard-db"],
    note: "Underneath sits the Metadata DB itself, replicated for durability and partitioned across enough machines that no single one holds the whole dataset.",
  },
  {
    nodeIds: ["client", "lb", "cdn", "apiGateway", "metadataServer", "blockServer", "cache", "shardManager", "metadataDB", "observability"],
    edgeIds: ["client-lb", "client-cdn", "lb-apiGateway", "gw-meta", "gw-block", "meta-block", "meta-cache", "cache-shard", "shard-db", "obs-shard"],
    note: "A Coordination Service, alongside distributed logging and tracing, watches the whole fleet, answering who's in charge of what and what actually happened across every machine.",
    highlight: ["observability"],
  },
  {
    nodeIds: ["client", "lb", "cdn", "apiGateway", "metadataServer", "blockServer", "cache", "shardManager", "metadataDB", "observability", "notification", "feedGen"],
    edgeIds: ["client-lb", "client-cdn", "lb-apiGateway", "gw-meta", "gw-block", "meta-block", "meta-cache", "cache-shard", "shard-db", "obs-shard", "meta-notif", "meta-feed"],
    note: "A Notification Service and a Feed Generation Service each sit behind their own queue, reacting to events without making the original request wait for them.",
  },
  {
    nodeIds: ["client", "lb", "cdn", "apiGateway", "metadataServer", "blockServer", "cache", "shardManager", "metadataDB", "observability", "notification", "feedGen", "searchAggregator", "searchIndex"],
    edgeIds: ["client-lb", "client-cdn", "lb-apiGateway", "gw-meta", "gw-block", "meta-block", "meta-cache", "cache-shard", "shard-db", "obs-shard", "meta-notif", "meta-feed", "meta-aggregator", "aggregator-index"],
    note: "A Search Results Aggregator fans a query out across a sharded Search Index and merges the ranked results back into one list.",
  },
  {
    nodeIds: ["client", "lb", "cdn", "apiGateway", "metadataServer", "blockServer", "cache", "shardManager", "metadataDB", "observability", "notification", "feedGen", "searchAggregator", "searchIndex", "mediaStorage", "videoPipeline"],
    edgeIds: ["client-lb", "client-cdn", "lb-apiGateway", "gw-meta", "gw-block", "meta-block", "meta-cache", "cache-shard", "shard-db", "obs-shard", "meta-notif", "meta-feed", "meta-aggregator", "aggregator-index", "block-media", "media-video"],
    note: "The Block Server hands large files to media storage, and video specifically routes through a processing pipeline before it's watchable everywhere.",
  },
  {
    nodeIds: ["client", "lb", "cdn", "apiGateway", "metadataServer", "blockServer", "cache", "shardManager", "metadataDB", "observability", "notification", "feedGen", "searchAggregator", "searchIndex", "mediaStorage", "videoPipeline", "dataProcessing", "warehouseReports"],
    edgeIds: ["client-lb", "client-cdn", "lb-apiGateway", "gw-meta", "gw-block", "meta-block", "meta-cache", "cache-shard", "shard-db", "obs-shard", "meta-notif", "meta-feed", "meta-aggregator", "aggregator-index", "block-media", "media-video", "db-processing", "processing-warehouse"],
    note: "Everything that already happened eventually feeds a batch data processing pipeline, landing in a warehouse that turns history into reports.",
  },
];

export const designingAnySystem: BlogPostData = {
  title: "Designing Any System",
  date: "July 1, 2026",
  slug: "designing-any-system",
  content: (
    <>
      <Paragraph delay={0.1}>
        Open the hood on almost any large product, a photo app, a video site, a chat app, a search engine,
        and the backend underneath rhymes with every other large product's backend far more than the
        marketing pages suggest. Strip away the one specific feature that makes the product what it is, and
        what's left is a short, recurring list of pieces, wired together a little differently depending on
        what the product actually does.
      </Paragraph>

      <Paragraph delay={0.15}>
        This post is that list. Not one specific system, but the template most complex systems eventually
        draw from, the boxes and arrows that show up again and again once a product grows past "one server
        talking to one database." Treat it as a checklist for the next time a system design question shows
        up, not a recipe to follow box by box.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        Start with the questions, not the boxes
      </Heading>

      <Paragraph delay={0.25}>
        Before drawing anything, two kinds of questions decide what the design even needs to look like. The
        first kind is functional, what should the system actually let a user do. Post a photo, send a
        message, search for a video, whatever the product's core actions are. The second kind is
        non-functional, what promises does the system make about how well it does those things. How many
        users, how much data, how fast does a request need to come back, how much downtime is acceptable,
        does a read need to reflect the very latest write or can it lag by a few seconds without anyone
        noticing.
      </Paragraph>

      <Paragraph delay={0.3}>
        Those non-functional answers are what actually shape the diagram. A system that can tolerate a few
        seconds of staleness gets to lean on caches and background queues everywhere. A system that can't
        gets stuck doing more of that work synchronously, on the critical path, where it's slower and more
        fragile. Nearly every design decision below is really a decision about which non-functional promise
        matters most, dressed up as a choice between two boxes.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Getting a request into the system
      </Heading>

      <Paragraph delay={0.4}>
        A request's first stop is rarely the actual application. A load balancer sits in front of a fleet of
        identical servers and decides which one handles each incoming request, so no single machine drowns
        under traffic and a single dead machine doesn't take the whole service down with it. Right beside it
        usually sits a CDN, short for content delivery network, a set of servers spread across the world that
        cache static content, images, video, scripts, close to wherever the user actually is, so a request
        made in Tokyo doesn't have to round-trip to a data center in Virginia for something that hasn't
        changed in a week.
      </Paragraph>

      <Paragraph delay={0.45}>
        Past the load balancer sits an API Gateway, a single front door that every request passes through
        before it reaches any real application logic. Bundling a handful of concerns into one place here,
        instead of every service reimplementing them separately, is the whole point.
      </Paragraph>

      <List delay={0.5}>
        <ListItem>
          <strong>Authentication.</strong> Confirms who's making the request.
        </ListItem>
        <ListItem>
          <strong>Authorization.</strong> Confirms what that caller is actually allowed to do.
        </ListItem>
        <ListItem>
          <strong>Rate limiting.</strong> Caps how many requests one caller can make in a given window, so one
          aggressive script can't starve everyone else.
        </ListItem>
        <ListItem>
          <strong>Caching.</strong> Answers a repeat request straight from the gateway without waking up any
          service behind it.
        </ListItem>
        <ListItem>
          <strong>Transformation.</strong> Reshapes a request or response between what the client sends and
          what internal services expect.
        </ListItem>
        <ListItem>
          <strong>Reverse proxy.</strong> Stands in front of the real servers so a client only ever sees the
          gateway's address, never the internals.
        </ListItem>
        <ListItem>
          <strong>Monitoring and logging.</strong> The gateway is the first thing that sees every single
          request, which makes it a natural place to record that it happened.
        </ListItem>
        <ListItem>
          <strong>Serverless functions.</strong> Small pieces of logic that run on demand without needing a
          full server sitting idle and waiting for traffic.
        </ListItem>
      </List>

      <Paragraph delay={0.55}>
        All of that happens before a single line of product-specific code runs.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={entryNodes}
        edges={entryEdges}
        height={380}
        delay={0.05}
        caption="A request's path before it reaches any real application logic, a load balancer, a CDN for static content, and an API gateway handling every cross-cutting concern in one place."
      />

      <Heading level={2} delay={0.6}>
        Splitting the servers that decide from the servers that move bytes
      </Heading>

      <Paragraph delay={0.65}>
        Past the gateway, most systems split into two kinds of servers doing two very different jobs. One
        kind answers questions and makes decisions, where is this file, who owns this account, what should go
        in this response. The other kind moves large amounts of raw data around, an uploaded photo, a video
        chunk, a file's actual bytes. Calling the first kind a Metadata Server and the second a Block Server
        is one common naming, but the underlying split, a <strong>control plane versus a data plane</strong>,
        shows up under different names in almost every system that handles both small structured records and
        big raw files. Mixing the two on the same servers means a burst of large uploads can quietly starve
        every quick metadata lookup behind it, since both are now waiting on the same overloaded machines.
      </Paragraph>

      <Paragraph delay={0.7}>
        The Metadata Server usually owns the actual decisions, and its records need to come back fast, so a
        cache sits directly in front of whatever stores them. Cache here means an in-memory store like Redis
        or Memcached, a small, fast layer holding the most frequently requested records so most reads never
        reach the slower database at all. When one cache server can't hold everything,{" "}
        <strong>directory-based partitioning</strong> is one common way to split the keyspace, a lookup table
        tells every request which specific cache node owns a given key, and a Shard Manager keeps that lookup
        table current as nodes get added or removed. Underneath all of that sits the Metadata DB itself,
        replicated so a single disk failure doesn't lose anything, and partitioned across enough machines that
        no single one has to hold the whole dataset.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={splitStorageNodes}
        edges={splitStorageEdges}
        height={700}
        delay={0.05}
        caption="Control plane and data plane split at the gateway, with the Metadata Server reading through a cache in front of a replicated, partitioned database."
      />

      <Heading level={2} delay={0.75}>
        Keeping a distributed system honest
      </Heading>

      <Paragraph delay={0.8}>
        The moment a system has more than a handful of servers, two questions get surprisingly hard to
        answer. Which server is currently in charge of a given piece of work, and what actually happened, in
        what order, across a dozen machines that don't share a clock.
      </Paragraph>

      <List delay={0.85}>
        <ListItem>
          <strong>Coordination Service.</strong> Answers the "who's in charge" question. ZooKeeper is the
          classic example, a small, separate cluster the rest of the fleet consults for leader election
          (picking exactly one server to own a task so two servers don't fight over it), distributed locks,
          and shared configuration.
        </ListItem>
        <ListItem>
          <strong>Distributed logging.</strong> Every server writes down what it did, but a log sitting on one
          machine is useless once a problem spans machines. Centralizing those logs into one searchable place
          turns checking a dozen servers by hand into searching once.
        </ListItem>
        <ListItem>
          <strong>Distributed tracing.</strong> A single user request can hop through a dozen internal
          services before it's done. Tracing tags that one request with an ID at the start and carries it
          through every hop, so when a request takes three seconds, it's possible to see exactly which one of
          those services ate two of them.
        </ListItem>
      </List>

      <Heading level={2} delay={0.9}>
        Reacting to events, and helping people find things
      </Heading>

      <Paragraph delay={0.95}>
        A lot of what a backend does isn't answering a request directly, it's reacting to something that
        already happened. Someone got a new follower, so they should be told. Someone posted something, so it
        should show up in the right feeds. Someone typed a search query, so something relevant should come
        back. All three lean on the same two shapes, a queue that holds work until it's handled, and a
        service that reads off that queue and does the actual work, off the path of whatever original request
        triggered it.
      </Paragraph>

      <Paragraph delay={1.0}>
        A Notification Service sits behind a Notification Queue for exactly that reason. The action that
        triggers a notification, a new comment, a price drop, a followed account posting, shouldn't have to
        wait around for a push message to actually get delivered, so it drops a job on the queue and moves
        on, and the Notification Service handles delivery and retries whenever that job gets picked up. A
        Feed Generation Service and its own queue follow the identical shape for a different job, pushing a
        new post out into every follower's feed the moment it's created, instead of assembling that feed from
        scratch every time someone opens the app.
      </Paragraph>

      <Paragraph delay={1.05}>
        Search works on a different data structure entirely. A Search Index built on something like
        Elasticsearch keeps an inverted index, a structure that maps each word to the list of documents
        containing it, which is what makes "find every document containing this word" fast instead of a full
        scan of everything. A large index gets split across many machines the same way the metadata store
        did, and a Search Results Aggregator is what a query actually talks to first. It fans the same query
        out to every shard, waits for each one to answer, and merges the ranked results into one list before
        sending anything back. That fan-out-and-merge pattern, called <strong>scatter-gather</strong>, shows
        up anywhere a single logical query has to cross a dataset too large to live on one machine.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={asyncSearchNodes}
        edges={asyncSearchEdges}
        height={620}
        delay={0.05}
        caption="Notifications and feed generation each react to an event through their own queue, while a search query fans out through an aggregator to a sharded index and back."
      />

      <Heading level={2} delay={1.1}>
        Storing and processing heavy media
      </Heading>

      <Paragraph delay={1.15}>
        Photos and video don't belong anywhere near the metadata store. A metadata row is a few hundred
        bytes, a video file is gigabytes, and cramming both into the same fast, heavily indexed database
        wastes that database's whole reason for existing. Image, thumbnail, and video storage are usually
        plain <strong>object storage</strong>, systems like Amazon S3 built to hold huge numbers of large
        files cheaply and durably, addressed by a simple key rather than a filesystem path.
      </Paragraph>

      <Paragraph delay={1.2}>
        Video specifically needs work done to it before it's watchable at every device's screen size and
        network speed, and that work, called transcoding, can take anywhere from seconds to minutes depending
        on the file. Making an upload wait for that would ruin the upload experience for no good reason, so
        it goes through a Video Processing Queue instead, picked up by a Video Processing Service, which
        hands the actual transcoding work to a pool of workers that scale up or down independently of
        everything else in the system. The upload finishes the moment the raw file is safely stored, and the
        processed versions show up a little later, off the critical path entirely.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={mediaNodes}
        edges={mediaEdges}
        height={460}
        delay={0.05}
        caption="The Block Server hands large files to object storage, and video routes through a queue-backed processing pipeline before it's watchable everywhere."
      />

      <Heading level={2} delay={1.25}>
        Learning from everything that already happened
      </Heading>

      <Paragraph delay={1.3}>
        Everything above is built to answer requests as they come in. A separate side of most systems exists
        to look backward instead, at everything that's already happened, and turn it into something a human
        can act on. That's data processing, tools like Hadoop and Spark built to run one computation across
        an enormous amount of data by splitting it into pieces and running those pieces on many machines at
        once. A distributed scheduler decides when each job actually runs and on which machines, and a pool
        of workers does the actual computing, the same shape as the video pipeline above, just aimed at bulk
        historical data instead of one file.
      </Paragraph>

      <Paragraph delay={1.35}>
        The output lands in a data warehouse, a store built for exactly the kind of query this side of the
        system runs, scan a huge amount of history and summarize it, rather than the fast single-row lookups
        the metadata store handles. From there, reports and analysis turn those summaries into something
        someone actually looks at, a dashboard, a weekly metrics email, a chart a product manager pulls up
        before a meeting.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={analyticsNodes}
        edges={analyticsEdges}
        height={460}
        delay={0.05}
        caption="A batch processing pipeline reads from the metadata store on its own schedule and lands its output in a warehouse built for scanning history, not serving live traffic."
      />

      <Heading level={2} delay={1.4}>
        Putting the whole template together
      </Heading>

      <Paragraph delay={1.45}>
        None of these pieces are exotic on their own, a load balancer, a cache, a queue, all show up
        individually in far smaller systems too. What makes a system feel like "real" system design is having
        enough of them at once that they start depending on each other, a write that has to update the
        metadata store and drop a job on two different queues, a read that checks a cache before a database
        and a CDN before either. The full picture below is every piece from this post, wired together the way
        they'd actually sit in a real deployment.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={finalNodes}
        edges={finalEdges}
        phases={finalPhases}
        height={1400}
        delay={0.05}
        caption="The complete template. Every piece from this post, from the load balancer at the entry point down to the warehouse that turns history into reports."
      />

      <Heading level={2} delay={1.5}>
        Takeaways
      </Heading>

      <List delay={1.55}>
        <ListItem>
          Every box here solves one recurring problem, fast decisions (the metadata store), moving big bytes
          (block storage and object storage), reacting to events without blocking (a queue plus a worker),
          and looking backward at history (batch processing and a warehouse). Naming the problem usually
          points straight at the box.
        </ListItem>
        <ListItem>
          Splitting control plane from data plane, reads from writes, or hot data from cold data is the same
          move wearing different clothes, keep the thing that needs to be fast away from the thing that's big
          or slow.
        </ListItem>
        <ListItem>
          A queue in front of a service is the default answer to "this work matters but doesn't need to
          happen right now." Notifications, feed fan-out, video transcoding, and batch analytics are all the
          same shape underneath.
        </ListItem>
        <ListItem>
          Caching, sharding, and replication solve three different problems, speed, size, and durability, and
          a real system usually needs all three at once, not a choice between them.
        </ListItem>
        <ListItem>
          A Coordination Service, logging, and tracing rarely show up in a product pitch, but they're what
          makes every other box debuggable once there are enough of them running at once to make "what
          actually happened" a real question.
        </ListItem>
      </List>

      <Paragraph delay={1.6}>
        The specific product sitting on top changes which of these boxes gets stressed the hardest, a video
        site leans hardest on the media pipeline, a social feed leans hardest on the queue-and-fan-out
        pattern, a search engine leans hardest on the index and the aggregator. The underlying shape barely
        moves. Learn this once, and the next system design conversation starts from recognition instead of a
        blank page. Thanks for reading.
      </Paragraph>
    </>
  ),
};
