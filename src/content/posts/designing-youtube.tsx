import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  InlineCode,
  List,
  ListItem,
  StatTiles,
  StatItem,
  CapacityMathDiagram,
  CapacityGroup,
  ReplicationDiagram,
  ReplicationPanel,
  ApiEndpointsTable,
  ApiEndpoint,
  SchemaCards,
  SchemaTableSpec,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  DiagramPhase,
} from "../components";
import {
  Play,
  Video,
  HardDrive,
  Gauge,
  Smartphone,
  Waypoints,
  Route,
  Server,
  Zap,
  Database,
  Layers,
  Bell,
  Search,
  Newspaper,
  Cog,
  Image,
  Globe,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Traffic",
    lines: [
      { expression: "800M daily active users × 5 views/day", result: "= 4B views/day" },
      { expression: "4B views/day ÷ 86,400s", result: "≈ 46K views/s" },
      { expression: "46K views/s ÷ 200 (view:upload ratio)", result: "≈ 230 uploads/s" },
    ],
    note: "1.5 billion total users, 800 million of them active on any given day, each watching about five videos.",
  },
  {
    title: "Storage",
    lines: [
      { expression: "500 hours uploaded/min × 60 min × 50 MB", result: "≈ 1,500 GB/min" },
      { expression: "1,500 GB/min ÷ 60s", result: "≈ 25 GB/s" },
    ],
    note: "Every minute of source video is stored in multiple encoded formats, so 50 MB per minute is a reasonable average after replication and format variants.",
  },
  {
    title: "Bandwidth",
    lines: [
      { expression: "500 hours/min × 60 min × 10 MB upload", result: "≈ 300 GB/min inbound" },
      { expression: "300 GB/min ÷ 60s", result: "≈ 5 GB/s inbound" },
      { expression: "5 GB/s × 200 (view:upload ratio)", result: "≈ 1 TB/s outbound" },
    ],
    note: "Upload bandwidth is the raw bytes the client sends. Outbound is what the CDN has to serve once those videos start getting watched.",
  },
  {
    title: "Cache (hot 20%)",
    lines: [
      { expression: "46K views/s × 86,400s", result: "≈ 4B metadata reads/day" },
      { expression: "20% × 4B × 500 bytes", result: "≈ 400 GB" },
    ],
    note: "Caching the hottest fifth of daily metadata lookups keeps most title, thumbnail, and stats reads off the database entirely.",
  },
];

const stats: StatItem[] = [
  { label: "Video views per second", value: 46, suffix: "K/s", icon: Play, color: "text-blue-500" },
  { label: "Video uploads per second", value: 230, suffix: "/s", icon: Video, color: "text-pink-500" },
  { label: "Storage ingested per second", value: 25, suffix: " GB/s", icon: HardDrive, color: "text-indigo-500" },
  { label: "Peak outbound bandwidth", value: 1, suffix: " TB/s", icon: Gauge, color: "text-amber-500" },
];

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/videos",
    description:
      "Accepts a resumable chunked upload of raw video bytes plus title, description, tags, and category. Returns HTTP 202 once the upload is accepted, before encoding finishes.",
  },
  {
    method: "GET",
    path: "/videos/search",
    description:
      "Takes a search query, optional user location, page size, and page token. Returns matching video resources with title, thumbnail URL, creation date, and view count.",
  },
  {
    method: "GET",
    path: "/videos/{video_id}/manifest",
    description:
      "Returns an HLS or DASH manifest listing available resolutions and segment URLs. The player fetches segments directly from the CDN afterward.",
  },
  {
    method: "GET",
    path: "/videos/{video_id}/stream",
    description:
      "Streams a media chunk from a given time offset, codec, and resolution. Used when the client needs a direct byte range instead of manifest-based segment fetch.",
  },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "Video",
    fields: [
      { name: "video_id", note: "primary key" },
      { name: "title" },
      { name: "description" },
      { name: "size" },
      { name: "thumbnail_path", note: "pointer into thumbnail storage" },
      { name: "uploader_id" },
      { name: "likes" },
      { name: "dislikes" },
      { name: "views" },
      { name: "storage_path", note: "pointer into video storage" },
    ],
  },
  {
    name: "Comment",
    fields: [
      { name: "comment_id", note: "primary key" },
      { name: "video_id", note: "foreign key, shard key" },
      { name: "user_id" },
      { name: "comment" },
      { name: "created_at" },
    ],
  },
  {
    name: "User",
    fields: [
      { name: "user_id", note: "primary key" },
      { name: "name" },
      { name: "email" },
      { name: "address" },
      { name: "age" },
      { name: "registered_at" },
    ],
  },
];

const metadataReplicationPanels: [ReplicationPanel, ReplicationPanel] = [
  {
    title: "Metadata DB (primary-secondary)",
    writeLabel: "Metadata server write",
    fanLabel: "replicates to",
    nodes: ["Secondary", "Secondary"],
    note: "Writes land on the primary first, reads spread across secondaries. A brand-new video row might be invisible on a secondary for a few milliseconds, which is acceptable here.",
  },
  {
    title: "View and like counters (buffered)",
    writeLabel: "Increment in Redis",
    fanLabel: "flush every 60s to",
    nodes: ["MySQL"],
    note: "Counters accumulate in memory and flush to MySQL periodically. The number on screen might lag the true total by a minute, and that's fine.",
  },
];

const splitNodes: DiagramNode[] = [
  { id: "client", label: "Client", icon: Smartphone, color: "text-slate-500", x: 50, y: 12 },
  { id: "lb", label: "Load Balancer", icon: Waypoints, color: "text-blue-500", x: 50, y: 34 },
  { id: "gateway", label: "API Gateway", icon: Route, color: "text-sky-500", x: 50, y: 56 },
  { id: "metaSvc", label: "Metadata Server", icon: Server, color: "text-violet-500", x: 22, y: 78 },
  { id: "blockSvc", label: "Block Server", icon: Server, color: "text-pink-500", x: 78, y: 78 },
];

const splitEdges: DiagramEdge[] = [
  { id: "client-lb", from: "client", to: "lb" },
  { id: "lb-gateway", from: "lb", to: "gateway" },
  { id: "gateway-metaSvc", from: "gateway", to: "metaSvc" },
  { id: "gateway-blockSvc", from: "gateway", to: "blockSvc" },
];

const processingNodes: DiagramNode[] = [
  { id: "blockSvc", label: "Block Server", icon: Server, color: "text-pink-500", x: 50, y: 10 },
  { id: "processQ", label: "Processing Queue", icon: Layers, color: "text-orange-500", x: 50, y: 28 },
  { id: "processSvc", label: "Processing Service", icon: Cog, color: "text-violet-500", x: 50, y: 46 },
  { id: "thumbStorage", label: "Thumbnail Storage", icon: Image, color: "text-amber-500", x: 28, y: 64 },
  { id: "videoStorage", label: "Video Storage", icon: HardDrive, color: "text-cyan-600", x: 72, y: 64 },
  { id: "cdn", label: "CDN", icon: Globe, color: "text-fuchsia-500", x: 50, y: 82 },
];

const processingEdges: DiagramEdge[] = [
  { id: "blockSvc-processQ", from: "blockSvc", to: "processQ" },
  { id: "processQ-processSvc", from: "processQ", to: "processSvc" },
  { id: "processSvc-thumbStorage", from: "processSvc", to: "thumbStorage" },
  { id: "processSvc-videoStorage", from: "processSvc", to: "videoStorage" },
  { id: "thumbStorage-cdn", from: "thumbStorage", to: "cdn" },
  { id: "videoStorage-cdn", from: "videoStorage", to: "cdn" },
];

const nodes: DiagramNode[] = [
  { id: "client", label: "Client", icon: Smartphone, color: "text-slate-500", x: 50, y: 6 },
  { id: "lb", label: "Load Balancer", icon: Waypoints, color: "text-blue-500", x: 50, y: 18 },
  { id: "gateway", label: "API Gateway", icon: Route, color: "text-sky-500", x: 50, y: 30 },
  { id: "metaSvc", label: "Metadata Server", icon: Server, color: "text-violet-500", x: 28, y: 43 },
  { id: "blockSvc", label: "Block Server", icon: Server, color: "text-pink-500", x: 82, y: 43 },
  { id: "searchIndex", label: "Search Index", sub: "Elasticsearch", icon: Search, color: "text-red-500", x: 10, y: 55 },
  { id: "cache", label: "Cache", sub: "Redis", icon: Zap, color: "text-teal-500", x: 22, y: 71 },
  { id: "metaDB", label: "Metadata DB", sub: "sharded by creator", icon: Database, color: "text-blue-600", x: 22, y: 89 },
  { id: "feedQ", label: "Feed Queue", icon: Layers, color: "text-orange-300", x: 57, y: 55 },
  { id: "feedSvc", label: "Feed Generation", icon: Newspaper, color: "text-emerald-500", x: 57, y: 71 },
  { id: "notifQ", label: "Notification Queue", icon: Layers, color: "text-orange-400", x: 40, y: 71 },
  { id: "notifSvc", label: "Notification Service", icon: Bell, color: "text-indigo-500", x: 40, y: 89 },
  { id: "processQ", label: "Processing Queue", icon: Layers, color: "text-orange-500", x: 74, y: 59 },
  { id: "processSvc", label: "Processing Service", icon: Cog, color: "text-violet-400", x: 90, y: 59 },
  { id: "thumbStorage", label: "Thumbnail Storage", icon: Image, color: "text-amber-500", x: 74, y: 73 },
  { id: "videoStorage", label: "Video Storage", icon: HardDrive, color: "text-cyan-600", x: 90, y: 73 },
  { id: "cdn", label: "CDN", icon: Globe, color: "text-fuchsia-500", x: 82, y: 87 },
];

const edges: DiagramEdge[] = [
  { id: "client-lb", from: "client", to: "lb" },
  { id: "lb-gateway", from: "lb", to: "gateway" },
  { id: "gateway-metaSvc", from: "gateway", to: "metaSvc" },
  { id: "gateway-blockSvc", from: "gateway", to: "blockSvc" },
  { id: "metaSvc-searchIndex", from: "metaSvc", to: "searchIndex", dashed: true },
  { id: "metaSvc-cache", from: "metaSvc", to: "cache", bidirectional: true },
  { id: "cache-metaDB", from: "cache", to: "metaDB", bidirectional: true },
  { id: "metaSvc-feedQ", from: "metaSvc", to: "feedQ" },
  { id: "feedQ-feedSvc", from: "feedQ", to: "feedSvc" },
  { id: "metaSvc-notifQ", from: "metaSvc", to: "notifQ" },
  { id: "notifQ-notifSvc", from: "notifQ", to: "notifSvc" },
  { id: "blockSvc-processQ", from: "blockSvc", to: "processQ" },
  { id: "processQ-processSvc", from: "processQ", to: "processSvc" },
  { id: "processSvc-thumbStorage", from: "processSvc", to: "thumbStorage" },
  { id: "processSvc-videoStorage", from: "processSvc", to: "videoStorage" },
  { id: "thumbStorage-cdn", from: "thumbStorage", to: "cdn" },
  { id: "videoStorage-cdn", from: "videoStorage", to: "cdn" },
];

const phases: DiagramPhase[] = [
  {
    nodeIds: ["client", "lb", "gateway"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc"],
    note: "A request enters through the load balancer and the API gateway.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc"],
    note: "The gateway splits metadata traffic from the Metadata Server off from raw video bytes headed to the Block Server.",
    highlight: ["metaSvc", "blockSvc"],
  },
  {
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc", "cache", "metaDB"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc", "metaSvc-cache", "cache-metaDB"],
    note: "The Metadata Server reads and writes through a Redis cache in front of a metadata database sharded by creator.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc", "cache", "metaDB", "searchIndex"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc", "metaSvc-cache", "cache-metaDB", "metaSvc-searchIndex"],
    note: "The same metadata write gets forwarded to a search pipeline, which batches it into the Elasticsearch index.",
    highlight: ["searchIndex"],
  },
  {
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc", "cache", "metaDB", "searchIndex", "notifQ", "notifSvc"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc", "metaSvc-cache", "cache-metaDB", "metaSvc-searchIndex", "metaSvc-notifQ", "notifQ-notifSvc"],
    note: "A new video row also drops a job on the notification queue, which tells the uploader their video is live.",
    highlight: ["notifSvc"],
  },
  {
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc", "cache", "metaDB", "searchIndex", "notifQ", "notifSvc", "feedQ", "feedSvc"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc", "metaSvc-cache", "cache-metaDB", "metaSvc-searchIndex", "metaSvc-notifQ", "notifQ-notifSvc", "metaSvc-feedQ", "feedQ-feedSvc"],
    note: "A feed queue triggers the Feed Generation Service, which precomputes rows for every subscriber's home feed.",
    highlight: ["feedSvc"],
  },
  {
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc", "cache", "metaDB", "searchIndex", "notifQ", "notifSvc", "feedQ", "feedSvc", "processQ", "processSvc"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc", "metaSvc-cache", "cache-metaDB", "metaSvc-searchIndex", "metaSvc-notifQ", "notifQ-notifSvc", "metaSvc-feedQ", "feedQ-feedSvc", "blockSvc-processQ", "processQ-processSvc"],
    note: "Meanwhile the Block Server drops the raw upload onto a processing queue, and worker pools pull tasks off it to transcode.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc", "cache", "metaDB", "searchIndex", "notifQ", "notifSvc", "feedQ", "feedSvc", "processQ", "processSvc", "thumbStorage", "videoStorage"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc", "metaSvc-cache", "cache-metaDB", "metaSvc-searchIndex", "metaSvc-notifQ", "notifQ-notifSvc", "metaSvc-feedQ", "feedQ-feedSvc", "blockSvc-processQ", "processQ-processSvc", "processSvc-thumbStorage", "processSvc-videoStorage"],
    note: "Finished thumbnails and encoded video variants land in their own distributed storage tiers.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc", "cache", "metaDB", "searchIndex", "notifQ", "notifSvc", "feedQ", "feedSvc", "processQ", "processSvc", "thumbStorage", "videoStorage", "cdn"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc", "metaSvc-cache", "cache-metaDB", "metaSvc-searchIndex", "metaSvc-notifQ", "notifQ-notifSvc", "metaSvc-feedQ", "feedQ-feedSvc", "blockSvc-processQ", "processQ-processSvc", "processSvc-thumbStorage", "processSvc-videoStorage", "thumbStorage-cdn", "videoStorage-cdn"],
    note: "A CDN fronts both storage tiers, so playback streams straight to the client without ever passing back through the app tier.",
    highlight: ["cdn"],
  },
];

export const designingYoutube: BlogPostData = {
  title: "Designing YouTube",
  date: "July 10, 2026",
  slug: "designing-youtube",
  content: (
    <>
      <Paragraph delay={0.1}>
        Press play on a video and two completely different systems wake up underneath you. One fetches a few
        kilobytes of metadata, a title, a thumbnail URL, a view count. The other starts pulling megabytes per
        second of encoded video from a machine that might be in the same city as you. A platform like YouTube
        or Netflix isn't really one architecture, it's a metadata service glued to a global file delivery
        network, and the interesting design work is almost entirely about keeping those two paths from
        stepping on each other.
      </Paragraph>

      <Heading level={2} delay={0.15}>
        Requirements
      </Heading>

      <Paragraph delay={0.2}>
        The functional scope here is deliberately smaller than real YouTube. Users can upload videos, share
        and view them, search by title, record stats like likes and view counts, and add comments. Channels,
        subscriptions, recommendations, watch later, and live streaming are all out of scope as separate
        problems layered on top.
      </Paragraph>

      <List delay={0.25}>
        <ListItem>
          <strong>High reliability.</strong> A video that finished uploading must never be lost. That bar doesn't move.
        </ListItem>
        <ListItem>
          <strong>High availability.</strong> Consistency can slip. If a freshly uploaded video doesn't show up in
          search for a few seconds, or a like count is off by a handful, that's an acceptable trade.
        </ListItem>
        <ListItem>
          <strong>Low playback latency.</strong> Watching should feel real-time. Buffering mid-stream is the failure
          mode users actually notice.
        </ListItem>
      </List>

      <Heading level={2} delay={0.3}>
        Sizing the problem
      </Heading>

      <Paragraph delay={0.35}>
        Assume <strong>1.5 billion total users</strong>, 800 million of them active on any given day, each
        watching about five videos. Every minute, creators upload roughly 500 hours of source footage. That's
        the whole starting point, everything below is arithmetic.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Traffic, storage, bandwidth, and metadata cache size, all derived from 800 million daily active users watching five videos each."
      />

      <StatTiles items={stats} delay={0.05} />

      <Paragraph delay={0.4}>
        Twenty-five gigabytes of new video landing every second is the number that explains why video bytes
        never live in the same database as titles and comments. A terabyte per second of outbound read
        bandwidth is the number that explains why playback can't be served from a single region of object
        storage. Both numbers are back-of-envelope, compression and replication change the real figures, but
        the orders of magnitude are what matter.
      </Paragraph>

      <Heading level={2} delay={0.45}>
        APIs
      </Heading>

      <Paragraph delay={0.5}>
        The public surface is a small set of REST endpoints. Upload returns HTTP 202 as soon as the raw file
        is accepted, long before transcoding finishes. Search and playback are separate reads with different
        latency budgets.
      </Paragraph>

      <ApiEndpointsTable items={apiEndpoints} delay={0.05} />

      <Paragraph delay={0.55}>
        The upload endpoint is intentionally asynchronous. Encoding a one-hour upload into a full bitrate
        ladder can take minutes. Holding the HTTP connection open until every worker finishes would tie up
        server resources and give the uploader a spinner with no feedback. Accept the bytes, enqueue the
        work, return 202, and let a notification fire when the video is actually watchable.
      </Paragraph>

      <Paragraph delay={0.6}>
        Playback APIs need an offset, a codec, and a resolution because the same account might pause on a TV
        and resume on a phone. The TV was pulling a 1080p H.264 stream, the phone wants 720p in a different
        container. The server needs to know which encoded variant to serve from which byte position.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        Why relational metadata
      </Heading>

      <Paragraph delay={0.7}>
        Most of what a video sharing site stores in tables fits naturally into rows and foreign keys. A video
        belongs to a user. A comment belongs to a video. Likes and view counts attach to a video row. That is
        exactly the shape a relational database is built for, and the ACID guarantees matter on the write
        side. You really do want the metadata row and the storage pointer to land together, or not at all.
      </Paragraph>

      <Paragraph delay={0.75}>
        Strong consistency everywhere is overkill though. A view counter that's exact to the second, or a
        like total that matches across every replica on every read, isn't worth the coordination cost. Buffer
        increments in Redis and flush them to MySQL every minute. Serve slightly stale counts from a cache.
        Users don't notice, and the system stays available when a replica lags.
      </Paragraph>

      <ReplicationDiagram panels={metadataReplicationPanels} delay={0.05} />

      <Heading level={2} delay={0.8}>
        Control path and data path
      </Heading>

      <Paragraph delay={0.85}>
        The read-to-write ratio here is roughly <strong>200 to 1</strong>. For every upload, two hundred
        people watch something. Worse, the things being read aren't the same size. Fetching comments or a
        title is a few kilobytes from a database. Streaming a video is megabytes per second from disk. Putting
        both through the same servers and the same code path means a burst of uploads can starve playback, or
        a viral video's bandwidth can crowd out a metadata lookup.
      </Paragraph>

      <Paragraph delay={0.9}>
        The fix is to split early. The <strong>control path</strong> handles metadata, search, comments, and
        stats through a Metadata Server backed by a cache and a sharded SQL cluster. The <strong>data
        path</strong> handles raw uploads through a Block Server that writes chunks into distributed file
        storage and hands encoding work to an asynchronous pipeline. Playback then goes straight from a CDN to
        the client. The app tier sets up the stream, but it isn't in the hot loop for every video byte.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={splitNodes}
        edges={splitEdges}
        height={440}
        delay={0.05}
        caption="Traffic splits at the API gateway. Metadata requests stay on the control path, raw video bytes go through the data path."
      />

      <Heading level={2} delay={0.95}>
        Database schema
      </Heading>

      <Paragraph delay={1.0}>
        Three tables cover the in-scope features. The <InlineCode>Video</InlineCode> row stores everything
        needed to find and display a video except the bytes themselves. <InlineCode>storage_path</InlineCode>{" "}
        and <InlineCode>thumbnail_path</InlineCode> are pointers into distributed file storage, not the files.
        Comments get their own table keyed by <InlineCode>video_id</InlineCode>, because comment volume per
        video can dwarf the video row itself.
      </Paragraph>

      <SchemaCards tables={schemaTables} delay={0.05} />

      <Heading level={2} delay={1.05}>
        The write path
      </Heading>

      <Paragraph delay={1.1}>
        Video files are large enough that a dropped connection mid-upload can't mean starting over. The client
        slices the file into chunks, uploads each chunk to the <strong>Block Server</strong>, and tracks which
        ranges already landed. If the network blips, it resumes from the last acknowledged byte. The block
        server writes those chunks into block storage as they arrive, the same pattern any system serving
        large files uses when the upload can't fit comfortably in one request.
      </Paragraph>

      <Paragraph delay={1.15}>
        Once the raw file is durable, the block server drops a message on a processing queue, Kafka or
        RabbitMQ, and returns immediately. A <strong>Video Processing Service</strong> pulls tasks off that
        queue and fans them out to worker pools that scale independently. Spikes in uploads add workers
        without touching the metadata tier. Quiet periods let workers scale back down. The queue is what
        decouples "upload accepted" from "encoding finished."
      </Paragraph>

      <Paragraph delay={1.2}>
        After workers finish transcoding and thumbnail generation, they write encoded files into distributed
        video and thumbnail storage, then notify the metadata server. The metadata server inserts the row,
        enqueues a notification job so the uploader gets an email or push, and enqueues a feed job if the
        uploader has subscribers. None of that blocks the upload response, which already went out as a 202.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        Encoding and thumbnails
      </Heading>

      <Paragraph delay={1.3}>
        A single uploaded file gets transcoded into a ladder of versions, 240p up through 1080p or higher, so
        a phone on a weak connection and a TV on fiber can each get a version that actually fits their
        bandwidth. HLS and DASH, the two standards behind almost every streaming player, both work the same
        way underneath. They cut the video into short segments, just a few seconds each, and list them in a
        manifest file the player downloads first. Every resolution is cut at identical timestamps, so when the
        player switches from 480p to 720p mid-video, it lands cleanly on the next segment instead of skipping
        or repeating a beat of footage.
      </Paragraph>

      <Paragraph delay={1.35}>
        Thumbnails need a different kind of storage entirely. A single video might have five preview images,
        each only a few kilobytes, but a search results page loads dozens of them on one screen. Saving each
        one as its own tiny file on ordinary disks is slow, the disk ends up spending more time seeking to the
        right spot than it does actually reading data. The fix is a storage layer built to pack many small
        files together efficiently, with an aggressive cache sitting in front of it. Thumbnails also get
        requested far more often than the videos themselves, even though the videos carry far more total
        bytes.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={processingNodes}
        edges={processingEdges}
        height={560}
        delay={0.05}
        caption="The data path runs asynchronously. The Block Server accepts the upload, workers transcode into multiple formats, and the CDN serves the finished segments."
      />

      <Heading level={2} delay={1.4}>
        The read path and adaptive streaming
      </Heading>

      <Paragraph delay={1.45}>
        Watching a video works by the client asking for pieces, not the server pushing them. The player
        downloads the manifest first, picks a starting quality based on its current connection speed, and
        requests one segment at a time from the nearest CDN edge. After each segment finishes downloading, the
        player checks how fast that download actually was. Fast download, the next request bumps up to a
        higher resolution. Slow download, the next request drops down, right at the next segment boundary so
        there's no visible stutter. The server itself never makes this call, it just hands back whichever
        segment gets asked for.
      </Paragraph>

      <Paragraph delay={1.5}>
        This is also what keeps a terabyte per second of traffic off the origin servers. Once a client has the
        manifest, every segment request after that goes straight to a CDN edge, never back to the origin. The
        first person in a city to watch a video causes a cache miss, so the edge fetches it from origin
        storage once. Everyone who watches that same video afterward, in that same city, gets served straight
        from the edge's memory instead.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        Feed generation
      </Heading>

      <Paragraph delay={1.6}>
        Even with recommendations out of scope, a subscribed user still expects new uploads to show up on a
        home feed without recomputing the list on every app open. When a channel uploads a video and the
        metadata row lands, another asynchronous job goes on a feed queue. A <strong>Feed Generation
        Service</strong> reads who follows that channel, ranks the new video against everything else those
        users should see, and writes precomputed feed rows into a feed table that's cached aggressively.
        Opening the app becomes a lookup, not a join across every followed account.
      </Paragraph>

      <Paragraph delay={1.65}>
        The service itself can be arbitrarily complex underneath, subscription graphs, ranking models, ML
        scoring, all of it runs off the hot path. What matters architecturally is the same push-versus-pull
        tradeoff as any social feed. Do the fan-out work once at publish time so every read stays cheap, and
        reach for a hybrid when one account has enough followers that millions of writes per upload stops being
        practical.
      </Paragraph>

      <Heading level={2} delay={1.7}>
        Search
      </Heading>

      <Paragraph delay={1.75}>
        Title search doesn't belong in a SQL <InlineCode>LIKE</InlineCode> query across a sharded cluster.
        When the metadata server saves a new video, it also forwards the document to a search pipeline. Search
        result aggregators batch updates into an Elasticsearch index with its own cache and storage tier.
        Queries hit the index directly, return titles and thumbnails from the search cluster, and never scan
        every metadata shard.
      </Paragraph>

      <Heading level={2} delay={1.8}>
        Sharding metadata and comments
      </Heading>

      <Paragraph delay={1.85}>
        Video metadata and comments want different shard keys because the access patterns differ. Metadata
        rows are small, on the order of a kilobyte, and one common query is "all videos from this channel."
        Sharding video metadata by <InlineCode>user_id</InlineCode> keeps every video a creator owns on one
        partition, which makes channel pages a single-shard read. A prolific uploader with thousands of videos
        still fits comfortably when each row is tiny. If one user ever outgrows a shard, older videos can
        migrate to cold storage partitions without touching the hot path.
      </Paragraph>

      <Paragraph delay={1.9}>
        Comments are the opposite shape. A viral video might accumulate millions of comments, far more bytes
        than its metadata row. Users almost always read comments for one video at a time, not all comments
        across the site. Shard the <InlineCode>Comment</InlineCode> table by <InlineCode>video_id</InlineCode>{" "}
        instead, and every comment thread for a single video lives together. Search by title still fans out to
        every shard through a centralized aggregator, the same cost either sharding strategy pays for that
        one query.
      </Paragraph>

      <Paragraph delay={1.95}>
        Sharding by <InlineCode>video_id</InlineCode> for metadata alone spreads hot videos evenly but makes
        channel pages expensive. Sharding by <InlineCode>user_id</InlineCode> for metadata optimizes channel
        reads at the cost of hot creators concentrating load on one shard. <strong>Consistent hashing</strong>{" "}
        on whichever key you pick limits how much data moves when a shard is added or removed, and a cache of
        hot video rows in front of the database catches the videos that would otherwise hammer one partition.
      </Paragraph>

      <Heading level={2} delay={2.0}>
        Video deduplication
      </Heading>

      <Paragraph delay={2.05}>
        With hundreds of uploads happening every second, plenty of them are the same clip getting re-uploaded,
        sometimes with a different border, sometimes at a different resolution. Every duplicate that slips
        through gets stored, transcoded, cached, and served all over again, for no reason, which wastes
        storage, compute, and bandwidth. It also means a user searching for that clip sees the same video
        show up several times in their results.
      </Paragraph>

      <Paragraph delay={2.1}>
        The best time to catch a duplicate is at upload, before any work gets spent transcoding or
        replicating a copy of something that already exists. As the file's chunks stream in, fingerprint them
        and check against content already on file. An exact match means the upload can stop early, the new
        video's metadata just points at the file that's already there. A partial match, say someone uploads a
        clip that's really just a segment cut out of a longer video the system already has, only needs the
        pieces that don't already exist to actually get stored.
      </Paragraph>

      <Heading level={2} delay={2.15}>
        Caching
      </Heading>

      <Paragraph delay={2.2}>
        The 80-20 rule shows up immediately. A small fraction of videos account for most daily views. Cache
        about <strong>20% of daily read volume</strong> of metadata in Memcached or Redis with a{" "}
        <strong>Least Recently Used</strong> eviction policy, and the majority of title and stats lookups never
        reach MySQL. Thumbnails, being tiny and numerous, cache even more aggressively.
      </Paragraph>

      <Paragraph delay={2.25}>
        Video segments get a different layer entirely. A geographically distributed CDN is the cache for
        playback, not an application-level Memcached cluster. Less popular videos, a handful of views per day,
        might still be served from origin data centers when no edge node has them yet.
      </Paragraph>

      <Heading level={2} delay={2.3}>
        CDN and origin shields
      </Heading>

      <Paragraph delay={2.35}>
        A CDN's whole job is keeping copies of static content physically close to the people watching it.
        Video segments never change once they're written, which makes them about as easy a case as a CDN ever
        sees. The first viewer in a region causes a fetch from origin, and everyone after that just reads from
        a nearby edge server's memory. Add one more layer for scale, a regional shield cache sitting between
        the edge servers and the origin. Without it, two hundred edge servers all missing on the same popular
        segment at once would turn into two hundred separate requests hitting the origin at the same moment.
        The shield catches that first and forwards only one. At a terabyte per second of total egress, even a
        tiny 1% miss rate at the shield still adds up to an enormous amount of origin traffic, so keeping that
        shield's hit rate high matters just as much as the edge's does.
      </Paragraph>

      <Heading level={2} delay={2.4}>
        Putting it all together
      </Heading>

      <Paragraph delay={2.45}>
        Every upload touches the data path first and the control path second. Every playback touches the CDN
        first and the metadata cache only for the surrounding page. Queues sit between every slow step so no
        single transcode or feed fan-out can block the API that already told the client yes.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={nodes}
        edges={edges}
        phases={phases}
        height={780}
        delay={0.05}
        caption="The complete design. Control and data paths split at the API gateway, notifications, search, and feed generation all fan out from the metadata write, encoding runs asynchronously on queues, and playback streams from the CDN without passing through the app tier."
      />

      <Heading level={2} delay={2.5}>
        Takeaways
      </Heading>

      <List delay={2.55}>
        <ListItem>
          Video streaming is two systems sharing a catalog. Metadata and bytes have opposite size, latency,
          and consistency needs, and they should split into control and data paths before anything else.
        </ListItem>
        <ListItem>
          Large uploads belong on an asynchronous write path. Block storage, a durable queue, and independently
          scalable workers are the standard pattern whenever preprocessing is slower than the API can wait.
        </ListItem>
        <ListItem>
          Relational storage fits metadata and social graph rows, but eventual consistency is fine for counters
          and caches. ACID where losing a row matters, buffered writes where being off by a little doesn't.
        </ListItem>
        <ListItem>
          Shard video metadata by creator and comments by video, because channel pages and comment threads are
          the two hot access patterns and they point at different keys.
        </ListItem>
        <ListItem>
          Playback is a CDN problem. Adaptive bitrate streaming keeps the origin out of the hot loop, and a
          pull CDN with shield tiers is what makes terabyte-per-second egress physically possible.
        </ListItem>
      </List>

      <Paragraph delay={2.6}>
        Nothing here is exotic in isolation. Queues, sharding, caching, consistent hashing, all of it shows up
        elsewhere. What's specific to video is the size gap between a title and a segment, and the upload
        pipeline that has to bridge them without making the user wait on a transcode. Get that split right and
        the rest is scaling machinery you've seen before. Thanks for reading.
      </Paragraph>
    </>
  ),
};
