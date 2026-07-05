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
  CacheFlowDiagram,
  PresignedUploadDiagram,
  ChunkHashFlowDiagram,
  GroupedIconCard,
  GroupedIconItem,
  ReplicationDiagram,
  ReplicationPanel,
  ApiEndpointsTable,
  ApiEndpoint,
  SchemaCards,
  SchemaTableSpec,
} from "../components";
import {
  Users,
  Waypoints,
  Route,
  Globe,
  Bell,
  Server,
  Layers,
  Zap,
  Database,
  HardDrive,
  Files,
  RefreshCw,
  Puzzle,
  ListTree,
  Binoculars,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Users and devices",
    lines: [
      { expression: "500M users × 3 devices/user", result: "≈ 1.5B device endpoints" },
      { expression: "500M users × 200 files/user", result: "= 100B total files" },
    ],
    note: "500 million total users, 100 million of them active on any given day, each syncing from about three devices.",
  },
  {
    title: "Storage",
    lines: [
      { expression: "100B files × 100KB avg file size", result: "≈ 10 PB total storage" },
    ],
    note: "Ten petabytes at today's user base, and it only grows as more files get added.",
  },
  {
    title: "Chunking",
    lines: [
      { expression: "100KB avg file size vs 4MB chunk size", result: "most files fit in a single chunk" },
      { expression: "100B files ÷ ~1 chunk/file (typical)", result: "≈ 100B chunks, most well under 4MB" },
    ],
    note: "Chunking mostly matters for the tail of large files, videos, disk images, project archives, not the average one.",
  },
];

const stats: StatItem[] = [
  { label: "Daily active users", value: 100, suffix: "M", icon: Users, color: "text-blue-500" },
  { label: "Total files stored", value: 100, suffix: "B", icon: Files, color: "text-teal-500" },
  { label: "Total storage", value: 10, suffix: " PB", icon: HardDrive, color: "text-indigo-500" },
  { label: "Active long-poll connections per minute", value: 1, suffix: "M", icon: RefreshCw, color: "text-amber-500" },
];

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/chunks/upload-url",
    description:
      "Takes a chunk's hash and size. Returns a pre-signed URL the client can upload the chunk to directly, or nothing at all if a chunk with that hash already exists.",
  },
  {
    method: "POST",
    path: "/files",
    description:
      "Takes a workspace ID, a path, and the ordered list of chunk hashes that make up the file. Creates a new file version pointing at those chunks.",
  },
  {
    method: "GET",
    path: "/files/{file_id}",
    description:
      "Returns the file's current metadata and the ordered list of chunk hashes and locations needed to reconstruct it.",
  },
  {
    method: "GET",
    path: "/files/{file_id}/versions",
    description: "Returns every previous version of the file, each with its own chunk list, size, and timestamp.",
  },
  {
    method: "POST",
    path: "/files/{file_id}/restore",
    description:
      "Takes a version ID and makes it the active version. No bytes get re-uploaded, Block Storage already has every chunk that version needs.",
  },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "chunks",
    fields: [
      { name: "chunk_hash", note: "primary key, SHA-256 of the bytes" },
      { name: "size", note: "up to 4 MB" },
      { name: "ref_count", note: "how many files point at it" },
      { name: "storage_location" },
    ],
  },
  {
    name: "files",
    fields: [
      { name: "file_id", note: "primary key" },
      { name: "workspace_id" },
      { name: "path" },
      { name: "active_version_id" },
      { name: "owner_id" },
    ],
  },
];

const clientItems: GroupedIconItem[] = [
  { icon: Puzzle, label: "Chunker" },
  { icon: ListTree, label: "Indexer" },
  { icon: Binoculars, label: "Watcher" },
  { icon: Database, label: "Internal DB" },
];

const replicationPanels: [ReplicationPanel, ReplicationPanel] = [
  {
    title: "Leader-follower (Metadata DB)",
    writeLabel: "Client write",
    fanLabel: "replicates to",
    nodes: ["Follower", "Follower"],
    note: "One leader takes every write. Reads spread across followers, which may lag slightly behind.",
  },
  {
    title: "Quorum (Block Storage)",
    writeLabel: "Client write",
    fanLabel: "fans out to all replicas",
    nodes: ["Replica A", "Replica B", "Replica C"],
    highlightNodes: [0, 1],
    note: "No single leader. The write succeeds once a majority (here, 2 of 3) acknowledges it.",
  },
];

const versionSchema: SchemaTableSpec[] = [
  {
    name: "file_versions",
    fields: [
      { name: "version_id", note: "primary key" },
      { name: "file_id" },
      { name: "chunk_hashes", note: "ordered list, into the chunks table" },
      { name: "status", note: "active or archived" },
      { name: "created_at" },
    ],
  },
];

const nodes: DiagramNode[] = [
  { id: "client", label: "Client", icon: Users, color: "text-slate-500", x: 5, y: 6 },
  { id: "lb", label: "Load Balancer", icon: Waypoints, color: "text-blue-500", x: 22, y: 6 },
  { id: "gateway", label: "API Gateway", icon: Route, color: "text-sky-500", x: 42, y: 6 },
  { id: "cdn", label: "CDN", icon: Globe, color: "text-fuchsia-500", x: 92, y: 6 },
  { id: "notif", label: "Notification Service", icon: Bell, color: "text-indigo-500", x: 6, y: 27 },
  { id: "metaSvc", label: "Metadata Server", icon: Server, color: "text-violet-500", x: 38, y: 27 },
  { id: "blockSvc", label: "Block Server", icon: Server, color: "text-pink-500", x: 66, y: 27 },
  { id: "syncQ", label: "Sync Queue", icon: Layers, color: "text-orange-500", x: 6, y: 49 },
  { id: "metaCache", label: "Cache", icon: Zap, color: "text-teal-500", x: 38, y: 49 },
  { id: "blockCache", label: "Cache", icon: Zap, color: "text-amber-500", x: 66, y: 49 },
  { id: "metaDB", label: "Metadata DB", icon: Database, color: "text-blue-600", x: 32, y: 71 },
  { id: "metaDBReplica", label: "Metadata DB", sub: "read replica", icon: Database, color: "text-blue-300", x: 15, y: 71 },
  { id: "blockStorage", label: "Block Storage", icon: HardDrive, color: "text-cyan-600", x: 66, y: 71 },
  { id: "blockStorageReplica", label: "Block Storage", sub: "quorum replica", icon: HardDrive, color: "text-cyan-300", x: 85, y: 71 },
];

const edges: DiagramEdge[] = [
  { id: "client-lb", from: "client", to: "lb" },
  { id: "lb-gateway", from: "lb", to: "gateway" },
  { id: "gateway-metaSvc", from: "gateway", to: "metaSvc" },
  { id: "gateway-blockSvc", from: "gateway", to: "blockSvc" },
  { id: "blockSvc-blockCache", from: "blockSvc", to: "blockCache", bidirectional: true },
  { id: "blockCache-blockStorage", from: "blockCache", to: "blockStorage", bidirectional: true },
  { id: "client-blockStorage", from: "client", to: "blockStorage", bidirectional: true },
  { id: "blockSvc-metaSvc", from: "blockSvc", to: "metaSvc", bidirectional: true },
  { id: "metaSvc-metaCache", from: "metaSvc", to: "metaCache", bidirectional: true },
  { id: "metaCache-metaDB", from: "metaCache", to: "metaDB", bidirectional: true },
  { id: "metaDB-metaDBReplica", from: "metaDB", to: "metaDBReplica", bidirectional: true },
  { id: "blockStorage-blockStorageReplica", from: "blockStorage", to: "blockStorageReplica", bidirectional: true },
  { id: "metaSvc-syncQ", from: "metaSvc", to: "syncQ" },
  { id: "syncQ-notif", from: "syncQ", to: "notif" },
  { id: "notif-client", from: "notif", to: "client" },
  { id: "blockStorage-cdn", from: "blockStorage", to: "cdn", bidirectional: true },
  { id: "cdn-client", from: "cdn", to: "client", bidirectional: true },
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
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc"],
    note: "The gateway splits control traffic, file names, folders, versions, from data traffic, the raw chunk bytes.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc", "blockCache", "blockStorage"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc", "blockSvc-blockCache", "blockCache-blockStorage"],
    note: "For an upload, the Block Server checks the chunk's hash, then hands the client a pre-signed URL into Block Storage.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc", "blockCache", "blockStorage"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc", "blockSvc-blockCache", "blockCache-blockStorage", "client-blockStorage"],
    note: "The chunk itself travels straight from the client to Block Storage. The Block Server never touches the bytes.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc", "blockCache", "blockStorage"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc", "blockSvc-blockCache", "blockCache-blockStorage", "client-blockStorage", "blockSvc-metaSvc"],
    note: "Once storage confirms the write, the Block Server reports the chunk's hash and location to the Metadata Server.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc", "blockCache", "blockStorage", "metaCache", "metaDB"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc", "blockSvc-blockCache", "blockCache-blockStorage", "client-blockStorage", "blockSvc-metaSvc", "metaSvc-metaCache", "metaCache-metaDB"],
    note: "The Metadata Server reads and writes through its own cache in front of the metadata database.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc", "blockCache", "blockStorage", "metaCache", "metaDB", "metaDBReplica", "blockStorageReplica"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc", "blockSvc-blockCache", "blockCache-blockStorage", "client-blockStorage", "blockSvc-metaSvc", "metaSvc-metaCache", "metaCache-metaDB", "metaDB-metaDBReplica", "blockStorage-blockStorageReplica"],
    note: "Both stores replicate. Metadata usually runs leader plus read replicas for consistent reads, Block Storage usually runs quorum writes across facilities for raw durability.",
  },
  {
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc", "blockCache", "blockStorage", "metaCache", "metaDB", "metaDBReplica", "blockStorageReplica", "syncQ", "notif"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc", "blockSvc-blockCache", "blockCache-blockStorage", "client-blockStorage", "blockSvc-metaSvc", "metaSvc-metaCache", "metaCache-metaDB", "metaDB-metaDBReplica", "blockStorage-blockStorageReplica", "metaSvc-syncQ", "syncQ-notif", "notif-client"],
    note: "Every metadata change also drops onto a sync queue, which the Notification Service drains to tell every other online device to sync.",
    highlight: ["notif"],
  },
  {
    nodeIds: ["client", "lb", "gateway", "metaSvc", "blockSvc", "blockCache", "blockStorage", "metaCache", "metaDB", "metaDBReplica", "blockStorageReplica", "syncQ", "notif", "cdn"],
    edgeIds: ["client-lb", "lb-gateway", "gateway-metaSvc", "gateway-blockSvc", "blockSvc-blockCache", "blockCache-blockStorage", "client-blockStorage", "blockSvc-metaSvc", "metaSvc-metaCache", "metaCache-metaDB", "metaDB-metaDBReplica", "blockStorage-blockStorageReplica", "metaSvc-syncQ", "syncQ-notif", "notif-client", "blockStorage-cdn", "cdn-client"],
    note: "A CDN fronts Block Storage too, so a popular or frequently re-downloaded chunk doesn't travel all the way from origin storage every time.",
  },
];

export const designingDropbox: BlogPostData = {
  title: "Designing Dropbox",
  date: "July 5, 2026",
  slug: "designing-dropbox",
  content: (
    <>
      <Paragraph delay={0.1}>
        Every laptop, phone, and tablet you own can carry a different slice of your files, and Dropbox's whole
        pitch is that it shouldn't matter which one you're holding. Drop a file into a synced folder on your
        desktop, and by the time you pick up your phone on the train, it's already there. Edit it on the train
        with no signal, and the edit shows up on the desktop the moment you're back on Wi-Fi. Nobody thinks about
        which device is the "real" copy anymore, because none of them are, the cloud is.
      </Paragraph>

      <Paragraph delay={0.15}>
        That convenience hides a genuinely hard systems problem. Storing and syncing files at this scale is a
        different animal from storing a small piece of text, it has to track every device's view of every file,
        resolve two people editing the same document at once, move gigabytes efficiently over a home internet
        connection, and never, under any circumstance, lose a byte a user didn't explicitly delete. Working
        through how it fits together touches chunking, hashing, replication, partitioning, and versioning all
        at once, which is what makes it one of the richer system design problems to actually sit down and design.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        Requirements
      </Heading>

      <Paragraph delay={0.25}>
        Functionally, users need to upload and download files from any device, share individual files or whole
        folders with other users, and have every device converge on the same view automatically. Update a file
        on one laptop, and every other device syncing that folder should pick up the change without anyone
        manually re-uploading anything. Every file operation needs the same <strong>Atomicity, Consistency, Isolation,
        and Durability</strong> guarantees you'd expect from a database, a half-written upload should never look like a valid file to anyone else.
      </Paragraph>

      <Paragraph delay={0.3}>
        The trickiest functional requirement is offline editing. A user on a plane should be able to add,
        delete, and modify files with no connection at all, and the instant they land and reconnect, every
        change needs to reconcile against whatever happened on the server and on their other devices in the
        meantime. That single requirement is why the client ends up being a genuinely complex piece of this
        design, not just a thin uploader.
      </Paragraph>

      <Paragraph delay={0.35}>
        The extended requirement worth designing for up front is snapshotting, letting a user roll a file back
        to any earlier version. It's easy to bolt on badly, storage cost balloons if every edit keeps a full
        copy, so it's worth planning for from the start rather than retrofitting later.
      </Paragraph>

      <Heading level={2} delay={0.4}>
        Design considerations
      </Heading>

      <Paragraph delay={0.45}>
        The one decision that shapes almost everything downstream is splitting every file into fixed-size
        chunks, rather than treating a file as one indivisible blob. 4 MB is a common starting point, but the
        right size depends on the workload, a service built around text and small documents can get away with
        something smaller, one built around video wants something bigger, and the actual number should come
        from measuring real file sizes and access patterns, not from copying a default. A failed upload
        only has to retry the chunk that failed, not the whole gigabyte file. An edit only has to re-transmit
        the chunks that actually changed. And two users who happen to have identical content, the same install
        script, the same stock photo, end up with identical chunk hashes, which opens the door to storing that
        content exactly once no matter how many files reference it.
      </Paragraph>

      <Paragraph delay={0.5}>
        Two more considerations from the requirements shape the client side specifically. Keeping a local copy
        of a file's metadata means the client can answer "has this changed?" without a round trip to the
        server, which is what makes offline editing tractable at all. And when only a few bytes of a chunk
        change, a client that's smart enough to diff instead of re-uploading the whole 4 MB chunk saves real
        bandwidth on every small edit.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        Sizing the problem
      </Heading>

      <Paragraph delay={0.6}>
        Assume <strong>500 million total users</strong>, a fifth of them active on any given day, each syncing
        from about three devices, with an average of 200 files per user at roughly 100 KB apiece.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Users, devices, files, storage, and chunking, all derived from the same 500 million user starting point."
      />

      <StatTiles items={stats} delay={0.05} />

      <Paragraph delay={0.65}>
        That average file size is worth sitting with for a second. At 100 KB, most files are far smaller than a
        single 4 MB chunk, so the typical file is exactly one chunk. Chunking earns its keep on the long tail,
        the video export, the disk image, the multi-gigabyte project archive, not on the median file, and that's
        fine, the mechanism doesn't need to help the common case to justify itself.
      </Paragraph>

      <Heading level={2} delay={0.7}>
        High level design
      </Heading>

      <Paragraph delay={0.75}>
        Four kinds of work happen in this system, and each one gets its own piece. Something has to run on the
        user's machine and notice when a file changes. Something has to move the actual bytes in and out of
        storage. Something has to keep track of what every file is named, how big it is, which chunks make it
        up, and who can see it. And something has to make sure every other device with a stake in a file finds
        out the moment it changes. Those four map directly onto the client, the Block Server, the Metadata
        Server, and a synchronization path running underneath all of it.
      </Paragraph>

      <Heading level={2} delay={0.8}>
        The client
      </Heading>

      <Paragraph delay={0.85}>
        The client watches a designated workspace folder and keeps it in sync with the cloud. Under the hood it
        splits into four cooperating pieces.
      </Paragraph>

      <GroupedIconCard title="Client" items={clientItems} delay={0.05} />

      <List delay={0.9}>
        <ListItem>
          <strong>Internal Metadata Database.</strong> A local record of every file, its chunks, their versions,
          and where they sit in the filesystem, which is what makes offline edits and instant "has this
          changed" checks possible without asking the server first.
        </ListItem>
        <ListItem>
          <strong>Chunker.</strong> Splits files into chunks on the way up and reassembles them on the way down.
          It also figures out which chunks actually changed since the last sync, so only those get retransmitted.
        </ListItem>
        <ListItem>
          <strong>Watcher.</strong> Monitors the workspace folder for local file system events, create, delete,
          modify, and also listens for change notifications broadcast from other devices.
        </ListItem>
        <ListItem>
          <strong>Indexer.</strong> Processes whatever the Watcher reports, updates the internal metadata
          database, and once chunks are safely uploaded or downloaded, tells the remote Synchronization Service
          so it can notify everyone else and update the metadata store.
        </ListItem>
      </List>

      <Paragraph delay={0.95}>
        The Watcher's other job, staying aware of what changed elsewhere, is where the design has to pick
        between polling and something better. Asking the server "anything new?" on a fixed interval either
        wastes bandwidth on empty responses when nothing's changed, or lags behind when it isn't frequent
        enough. Long polling fixes both problems at once, the client opens a request, the server just holds it
        open until there's actually something to report instead of answering immediately, and only then closes
        the connection and lets the client open the next one. No polling loop, no wasted empty responses, and
        changes show up close to the moment they happen.
      </Paragraph>

      <Heading level={2} delay={1}>
        Uploading a chunk without the double hop
      </Heading>

      <Paragraph delay={1.05}>
        The most obvious way to wire up an upload is to route the chunk's bytes through the Block Server on
        their way to storage, client sends the chunk to the Block Server, the Block Server forwards it into
        Block Storage. It works, but every byte crosses the network twice and the Block Server has to hold the
        entire chunk in memory or on local disk while it relays it. At the scale this system runs at, that's a
        lot of servers doing nothing but copying bytes from one socket to another.
      </Paragraph>

      <Paragraph delay={1.1}>
        The fix almost every production system reaches for is to keep the Block Server out of the data path
        entirely. The client asks the Block Server for permission to upload a chunk, the Block Server checks
        whether that chunk's hash already exists (more on that in a moment) and, if it's genuinely new, returns
        a <strong>pre-signed URL</strong>, a temporary, cryptographically signed link that grants write access to one
        specific object in Block Storage for a short window. The client then uploads the chunk's bytes straight
        to that URL. The Block Server issued the permission slip, but never saw the data itself.
      </Paragraph>

      <PresignedUploadDiagram
        delay={0.05}
        caption="The Block Server hands out a pre-signed URL instead of taking the bytes itself, so the chunk travels from the client to storage in one hop, not two."
      />

      <Paragraph delay={1.15}>
        This raises an obvious question, if the Block Server never sees the bytes, how does it know the upload
        actually finished so it can tell the Metadata Server? It can't just trust the client's word for it, a
        client that crashes mid-upload or lies about success would leave the metadata pointing at a chunk that
        doesn't exist. The usual answer is an event notification from the storage layer itself, object storage
        systems like Amazon S3 can fire a completion event the instant an object is durably written, and the
        Block Server subscribes to that event rather than a client-supplied "done" signal. Only once storage
        itself confirms the write does the chunk's hash and location get committed to the Metadata Server, which
        closes the race condition cleanly.
      </Paragraph>

      <Heading level={2} delay={1.2}>
        Chunk hashes and checksums
      </Heading>

      <Paragraph delay={1.25}>
        Every chunk gets identified by a hash of its own content, SHA-256 is the standard choice, computed
        client-side by the Chunker before the chunk ever leaves the device. Computing it on the client, not the
        server, is what makes the dedup check in the previous section possible in the first place, the client
        can ask "does anyone already have a chunk with this exact hash?" before it uploads a single byte, and
        skip the upload entirely on a match.
      </Paragraph>

      <Paragraph delay={1.3}>
        That hash does double duty. It's the deduplication key, and it's also an integrity check. Once the
        bytes land in Block Storage, the storage layer can independently recompute a checksum over what it
        actually received and compare it against the hash the client claimed, catching any corruption that
        crept in during transit rather than trusting the client's claim blindly. Object storage services expose
        this as a matter of course, an uploaded object's returned checksum or ETag either matches what the
        client sent or the upload gets rejected.
      </Paragraph>

      <ChunkHashFlowDiagram
        delay={0.05}
        caption="The client hashes a chunk before uploading anything. A match against metadata skips the upload entirely, a miss uploads it and lets storage independently verify the bytes with its own checksum."
      />

      <Paragraph delay={1.35}>
        Worth noting how different this is from a truncated key space. Some services deliberately truncate a
        hash down to a handful of characters to keep a link short and typeable, which is exactly what opens
        the door to collisions. A chunk hash serves no such purpose, nobody types it, so nothing forces it to
        stay short. Using the full 256 bits keeps the collision risk at the birthday bound of roughly
        <InlineCode> 2^128</InlineCode>, astronomically larger than the 100 billion chunks this system is sized
        for.
      </Paragraph>

      <Formula block delay={1.4}>
        {`2^{256} \\text{ possible hashes}, \\quad \\text{birthday bound} \\approx 2^{128}`}
      </Formula>

      <Paragraph delay={1.45}>
        Once storage confirms the chunk landed intact, its hash, size, and storage location get written into
        the metadata database as a row the owning file's chunk list can point to, which is the mechanism that
        actually gets a chunk from "bytes the client has" to "something every device syncing this file can find."
      </Paragraph>

      <SchemaCards tables={schemaTables} delay={0.05} />

      <Heading level={2} delay={1.5}>
        The metadata database
      </Heading>

      <Paragraph delay={1.55}>
        The metadata store tracks chunks, files, users, devices, and workspaces, and it's the one place in this
        design where the ACID requirement from the top of the post actually has to get enforced. A relational
        database gets this for free. A NoSQL store trades that away for horizontal scalability, which means the
        Synchronization Service has to build consistency guarantees back in at the application layer, checking
        for conflicting concurrent writes itself rather than leaning on the database to reject them. Either
        choice is defensible, it's a real trade between built-in correctness and easier horizontal scaling,
        and which side wins depends on how large a single metadata shard needs to get before this system's
        actual partitioning strategy, covered further down, takes the pressure off.
      </Paragraph>

      <Heading level={2} delay={1.6}>
        Synchronization and notifications
      </Heading>

      <Paragraph delay={1.65}>
        The Synchronization Service is what turns "a file changed on one device" into "every other device
        knows." It validates an incoming change against the Metadata Database, commits it, and then has to fan
        that update out to every other device subscribed to the same file or folder. To keep this efficient, it
        leans on the same differencing idea from the client, sending only the chunks that actually changed
        rather than re-syncing a whole file, and if two chunks land on the same hash even across two unrelated
        users, storage never has to hold more than one copy.
      </Paragraph>

      <Paragraph delay={1.7}>
        Fanning updates out to potentially millions of devices calls for a messaging layer built for exactly
        that shape of problem. A single, shared <strong>Request Queue</strong> collects every client's metadata
        update, and the Synchronization Service drains it to apply changes. Delivering those changes back out
        is different, since a queue message disappears once one consumer reads it, and a single shared queue
        would let one device's read consume the notification another device also needed. So every subscribed
        device gets its own <strong>Response Queue</strong>, and if a device is offline when a change happens, its queue
        just holds the notification until it reconnects, no different from long polling picking up right where
        it left off.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Reliability through replication
      </Heading>

      <Paragraph delay={1.8}>
        Losing a byte a user didn't delete is the one failure this design can't tolerate, which means both
        stores need more than a single copy sitting on a single disk. The two stores solve it differently
        because they're being asked to guarantee different things.
      </Paragraph>

      <Paragraph delay={1.85}>
        The metadata database usually runs <strong>leader-follower replication</strong>, one primary takes every write,
        and one or more read replicas stay caught up behind it, either synchronously or with a short lag. Reads
        that can tolerate slightly stale data, listing a folder's contents, checking a file's last-modified
        timestamp, get spread across the replicas, which keeps the primary free to focus on writes and gives
        the system somewhere to fail over to if the primary goes down. The cost is that a synchronous follower
        adds latency to every write waiting for acknowledgment, and an asynchronous one risks losing the last
        few writes if the primary dies before they replicate.
      </Paragraph>

      <Paragraph delay={1.9}>
        Block Storage tends to reach for <strong>quorum-based replication</strong> instead. Rather than one elected
        leader, a chunk gets written to several storage nodes at once, and the write only counts as successful
        once a quorum of them, a majority, acknowledges it. Reads work the same way in reverse, query enough
        replicas that at least one of them is guaranteed to hold the latest write. There's no single leader to
        fail over from, which suits a store where a chunk's bytes are immutable and content-addressed by hash,
        there's no write conflict to arbitrate the way there can be with a file's mutable metadata, only the
        question of whether enough copies exist to survive a disk, a rack, or an entire facility going dark.
        That's the same idea behind Dropbox's own move to an in-house exabyte-scale storage system after
        outgrowing a general-purpose object store, once you're operating storage at that scale, the replication
        strategy becomes a first-class design decision, not an afterthought bolted onto whatever database you
        picked.
      </Paragraph>

      <ReplicationDiagram panels={replicationPanels} delay={0.05} />

      <Heading level={2} delay={1.95}>
        Partitioning the metadata
      </Heading>

      <Paragraph delay={2}>
        Once the metadata store holds billions of rows, it has to split across many machines, and the question
        of what to partition by matters more here than it does for a flatter key-value workload. A service
        whose keys have no natural relationship to each other can just hash the key itself and scatter rows
        evenly across shards, consistent hashing, and call it close to ideal. Files don't work that way. Partitioning by a
        file's own ID would scatter one user's hundred files across a hundred different shards essentially at
        random, so listing "everything in my Documents folder" turns into a hundred separate lookups merged
        back together, exactly the scatter-gather cost a partitioning scheme should be trying to avoid. The
        natural unit to partition by is something with real locality, either the user or the directory.
      </Paragraph>

      <Heading level={3} delay={2.05}>
        Partition by user
      </Heading>

      <Paragraph delay={2.1}>
        Every user's files and metadata live on one shard, determined by hashing their user ID. Every "show me
        my files" query hits exactly one shard, which is about as good as locality gets. The failure mode is a
        celebrity account, one user whose sharing activity dwarfs everyone else's, concentrating a
        disproportionate amount of read traffic onto a single shard. A CDN and caching absorb a good chunk of
        that for the actual file bytes, but metadata reads, listing what's in a shared folder, checking
        permissions, still funnel through that one shard's database. The second failure mode shows up over
        time rather than all at once, a single power user's files can eventually outgrow whatever one shard can
        hold, and there's no clean way to split "half of one user's files" onto a second shard without breaking
        the very locality this scheme exists for.
      </Paragraph>

      <Heading level={3} delay={2.15}>
        Partition by directory
      </Heading>

      <Paragraph delay={2.2}>
        A directory's own metadata, its list of files and immediate subdirectories, lives on one shard, but a
        subdirectory is itself just another directory record, free to live on a different shard entirely. A
        deeply nested folder tree ends up spread across many shards, one per directory, rather than one per
        user. This flips the earlier trade-off. A hot directory, a public folder a lot of people list at once,
        is actually the good case here, since listing it is still a single-shard read no matter how hot it
        gets. What replaces the celebrity-user problem is a directory that grows enormous on its own, a shared
        team drive with tens of thousands of files sitting flat in one folder, which runs into the same
        single-shard ceiling a huge user's files did in the other scheme, just scoped to a folder instead of an
        account.
      </Paragraph>

      <Paragraph delay={2.25}>
        Neither scheme is strictly better, they push the same two failure modes, one entity outgrowing its
        shard and one entity attracting disproportionate read traffic, onto different units of data. In
        practice, systems that partition this way lean on both a bit, a hot or oversized shard gets manually or
        automatically split and reassigned to a fresh machine, the same rebalancing move consistent hashing
        makes cheap in a flatter key space, just applied here to a directory subtree or a slice of one user's
        files instead of an arbitrary hash range.
      </Paragraph>

      <Heading level={2} delay={2.3}>
        Caching
      </Heading>

      <Paragraph delay={2.35}>
        Two independent caches sit in this design, one in front of the metadata database, one in front of Block
        Storage. The Metadata Server checks its cache before ever touching the database, and the pattern is the
        same read-through shape used everywhere else in a system like this.
      </Paragraph>

      <Paragraph delay={2.4}>
        <strong>Least Recently Used</strong> is a reasonable eviction policy for both caches. For hot chunks specifically, a
        commodity cache server with a large amount of memory can comfortably hold tens of thousands of chunks
        at once, and the number of cache nodes needed scales with how concentrated a service's read traffic
        actually turns out to be.
      </Paragraph>

      <Heading level={2} delay={2.45}>
        Snapshotting and restoring older versions
      </Heading>

      <Paragraph delay={2.5}>
        Letting a user roll a file back to last Tuesday's version needs two things to still exist, that
        version's metadata, and the actual chunk bytes it pointed to. The brute-force approach, keeping a full
        copy of a file for every version, works but multiplies storage cost by however many versions get kept,
        which gets expensive fast for a file that's edited daily.
      </Paragraph>

      <Paragraph delay={2.55}>
        The chunk-level deduplication this design already has turns out to solve most of this for free. A
        file's version isn't a copy of the file, it's an ordered list of chunk hashes. Edit one paragraph in a
        large document and usually only the chunks touching that paragraph change, every other chunk keeps the
        exact same hash it had in the previous version and the new version's chunk list just points at the same
        already-stored objects. No separate diffing step is needed at the chunk level, the dedup mechanism from
        earlier already guarantees unchanged content is never stored twice.
      </Paragraph>

      <SchemaCards tables={versionSchema} delay={0.05} />

      <Paragraph delay={2.6}>
        Restoring a version, in the common case, is then mostly a metadata operation. As long as the old
        version's chunks haven't been garbage collected, which the <InlineCode>ref_count</InlineCode> column
        exists specifically to prevent, restoring just means flipping which version a file's{" "}
        <InlineCode>active_version_id</InlineCode> points to. No bytes move.
      </Paragraph>

      <Heading level={2} delay={2.65}>
        Security, permissions, and sharing
      </Heading>

      <Paragraph delay={2.7}>
        Once files can be shared or made public, permissions have to live somewhere durable. Storing a
        permission level alongside each file or folder in the metadata database, plus a mapping from that
        file's ID to the set of users allowed to see or edit it, covers the functional requirement. Every read
        or write on a shared file checks this mapping first, one extra lookup that's cheap next to the cost of
        getting it wrong.
      </Paragraph>

      <Heading level={2} delay={2.75}>
        Putting it all together
      </Heading>

      <Paragraph delay={2.8}>
        Every piece lands in one architecture. Client traffic passes through a load balancer and gateway, which
        splits control traffic bound for the Metadata Server from data traffic bound for the Block Server. The
        two paths only meet again when the Block Server reports a newly written chunk back to metadata, and
        both stores replicate for durability, notification and synchronization ride on their own path entirely.
      </Paragraph>

      <ApiEndpointsTable items={apiEndpoints} delay={0.05} />

      <IconArchitectureDiagram
        nodes={nodes}
        edges={edges}
        phases={phases}
        height={760}
        delay={0.05}
        caption="The complete design. Control traffic and data traffic split at the gateway, chunk uploads bypass the Block Server entirely once a pre-signed URL is issued, both stores replicate for durability, and a sync queue feeds the Notification Service to keep every device current."
      />

      <Heading level={2} delay={2.85}>
        Takeaways
      </Heading>

      <List delay={2.9}>
        <ListItem>
          Chunking a file does three jobs at once, cheap partial retries, bandwidth-efficient re-syncing, and
          content-addressed deduplication, and it also happens to give version history almost for free, since
          an unchanged chunk in a new version is just a pointer to the same object.
        </ListItem>
        <ListItem>
          Keep bulk data off the Block Server's own network path. A pre-signed URL lets the client talk
          directly to storage, and a completion event from storage itself, not the client's say-so, is what
          should trigger the metadata write.
        </ListItem>
        <ListItem>
          Compute the chunk hash on the client and use it for both deduplication and integrity, but let storage
          independently verify it. A hash used as a full-length content identifier doesn't need the truncation
          trade-offs a short link does.
        </ListItem>
        <ListItem>
          Partition metadata by something with real locality, user or directory, not by a file's own ID. Both
          choices trade a hot-entity problem for an entity-outgrows-its-shard problem, just at different
          granularity.
        </ListItem>
        <ListItem>
          Match the replication strategy to what's actually being guaranteed. Leader-follower suits metadata
          that needs a consistent, arbitrated view. Quorum-based writes suit immutable, content-addressed bytes
          where durability, not conflict resolution, is the whole point.
        </ListItem>
      </List>

      <Paragraph delay={2.95}>
        A file storage service looks, from the outside, like a simpler problem than it is, drag a file into a
        folder, watch it appear everywhere else. Underneath, almost every hard idea in distributed systems shows
        up somewhere in the design, chunking, hashing, two different flavors of replication, and a partitioning
        scheme that has to respect locality most other systems don't need to think about. Thanks for reading.
      </Paragraph>
    </>
  ),
};
