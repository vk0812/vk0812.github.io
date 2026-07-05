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
  DiagramPhase,
  StatTiles,
  StatItem,
  CapacityMathDiagram,
  CapacityGroup,
  ReplicationDiagram,
  ReplicationPanel,
  DirectoryLookupDiagram,
  MessageAckChainDiagram,
} from "../components";
import {
  Users,
  Waypoints,
  Server,
  KeyRound,
  Layers,
  Zap,
  Database,
  Bell,
  Smartphone,
  MessageSquare,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Traffic",
    lines: [
      { expression: "500M daily active users × 40 messages/user/day", result: "= 20 billion messages/day" },
    ],
    note: "Every one of those messages needs to be stored, ordered, and delivered, so this one number drives everything below it.",
  },
  {
    title: "Storage",
    lines: [
      { expression: "20B messages/day × 100 bytes avg message size", result: "= 2 TB/day" },
      { expression: "2 TB/day × 365 days × 5 years", result: "≈ 3.65 PB over five years" },
      { expression: "3.65 PB ÷ 4 TB per shard", result: "≈ 913 shards, round up to 1,000" },
    ],
    note: "That's before replication, compression, or the metadata that rides alongside every message.",
  },
  {
    title: "Bandwidth",
    lines: [
      { expression: "2 TB/day ÷ 86,400 seconds/day", result: "≈ 23 MB/s inbound" },
    ],
    note: "Every incoming message eventually needs to go back out to someone, so outbound bandwidth runs at roughly the same rate.",
  },
  {
    title: "Chat servers",
    lines: [
      { expression: "500M concurrent connections ÷ 50K connections/server", result: "= 10,000 chat servers" },
    ],
    note: "One persistent connection per online user, spread across however many servers it takes to hold them all open at once.",
  },
];

const stats: StatItem[] = [
  { label: "Daily active users", value: 500, suffix: "M", icon: Users, color: "text-blue-500" },
  { label: "Messages per day", value: 20, suffix: "B", icon: MessageSquare, color: "text-teal-500" },
  { label: "Storage over 5 years", value: 3.65, suffix: " PB", icon: Database, color: "text-indigo-500" },
  { label: "Chat servers needed", value: 10, suffix: "K", icon: Server, color: "text-amber-500" },
];

const pubSubNodes: DiagramNode[] = [
  { id: "chatA", label: "Chat Server A", sub: "publisher", icon: Server, color: "text-violet-500", x: 8, y: 50 },
  { id: "topic", label: "Kafka Topic", sub: "one per chat", icon: Layers, color: "text-orange-500", x: 42, y: 50 },
  { id: "chatB", label: "Chat Server B", icon: Server, color: "text-pink-500", x: 82, y: 15 },
  { id: "chatC", label: "Chat Server C", icon: Server, color: "text-pink-500", x: 82, y: 50 },
  { id: "notif", label: "Notification Service", icon: Bell, color: "text-indigo-500", x: 82, y: 85 },
];

const pubSubEdges: DiagramEdge[] = [
  { id: "chatA-topic", from: "chatA", to: "topic" },
  { id: "topic-chatB", from: "topic", to: "chatB" },
  { id: "topic-chatC", from: "topic", to: "chatC" },
  { id: "topic-notif", from: "topic", to: "notif", dashed: true },
];

const directoryReplicationPanels: [ReplicationPanel, ReplicationPanel] = [
  {
    title: "Directory service (UserID → chat server)",
    writeLabel: "Chat server registers connection",
    fanLabel: "replicates to",
    nodes: ["Replica"],
    note: "Leader takes every registration write, a follower stands by to take over if the leader dies, a routing lookup that's briefly stale just gets retried.",
  },
  {
    title: "Message storage (chat history)",
    writeLabel: "Chat server writes message",
    fanLabel: "replicates to",
    nodes: ["Replica", "Replica"],
    highlightNodes: [0, 1],
    note: "Multiple copies from the start, a lost message is unrecoverable in a way a stale routing lookup isn't.",
  },
];

const nodes: DiagramNode[] = [
  { id: "clientA", label: "Client A", sub: "sender", icon: Smartphone, color: "text-slate-500", x: 4, y: 8 },
  { id: "lb", label: "Load Balancer", icon: Waypoints, color: "text-blue-500", x: 20, y: 8 },
  { id: "chatA", label: "Chat Server A", icon: Server, color: "text-violet-500", x: 38, y: 8 },
  { id: "queue", label: "Kafka Topic", sub: "per chat", icon: Layers, color: "text-orange-500", x: 58, y: 8 },
  { id: "chatB", label: "Chat Server B", icon: Server, color: "text-pink-500", x: 76, y: 8 },
  { id: "clientB", label: "Client B", sub: "recipient", icon: Smartphone, color: "text-slate-500", x: 94, y: 8 },
  { id: "directory", label: "Directory Service", sub: "UserID → server", icon: KeyRound, color: "text-cyan-600", x: 38, y: 34 },
  { id: "directoryReplica", label: "Directory Replica", icon: KeyRound, color: "text-cyan-300", x: 20, y: 34 },
  { id: "storage", label: "Chat History Store", sub: "HBase", icon: Database, color: "text-blue-600", x: 58, y: 56 },
  { id: "cache", label: "Recent Messages Cache", icon: Zap, color: "text-teal-500", x: 76, y: 34 },
  { id: "notif", label: "Notification Service", icon: Bell, color: "text-indigo-500", x: 76, y: 56 },
  { id: "push", label: "Push Provider", sub: "APNs / FCM", icon: Bell, color: "text-red-500", x: 94, y: 56 },
];

const edges: DiagramEdge[] = [
  { id: "clientA-lb", from: "clientA", to: "lb" },
  { id: "lb-chatA", from: "lb", to: "chatA" },
  { id: "chatA-directory", from: "chatA", to: "directory", bidirectional: true },
  { id: "directory-directoryReplica", from: "directory", to: "directoryReplica", bidirectional: true },
  { id: "chatA-storage", from: "chatA", to: "storage", bidirectional: true },
  { id: "chatA-queue", from: "chatA", to: "queue" },
  { id: "queue-chatB", from: "queue", to: "chatB" },
  { id: "chatB-clientB", from: "chatB", to: "clientB", bidirectional: true },
  { id: "chatB-cache", from: "chatB", to: "cache", bidirectional: true },
  { id: "cache-storage", from: "cache", to: "storage", bidirectional: true },
  { id: "queue-notif", from: "queue", to: "notif", dashed: true },
  { id: "notif-push", from: "notif", to: "push" },
  { id: "push-clientB", from: "push", to: "clientB", dashed: true },
];

const phases: DiagramPhase[] = [
  {
    nodeIds: ["clientA", "lb"],
    edgeIds: ["clientA-lb"],
    note: "Client A sends a message over its already-open connection to the load balancer.",
  },
  {
    nodeIds: ["clientA", "lb", "chatA"],
    edgeIds: ["clientA-lb", "lb-chatA"],
    note: "The load balancer routes it to whichever chat server is holding Client A's connection.",
  },
  {
    nodeIds: ["clientA", "lb", "chatA", "directory", "directoryReplica"],
    edgeIds: ["clientA-lb", "lb-chatA", "chatA-directory", "directory-directoryReplica"],
    note: "Chat Server A checks its local cache, and on a miss, asks the Directory Service which chat server holds Client B's connection.",
  },
  {
    nodeIds: ["clientA", "lb", "chatA", "directory", "directoryReplica", "storage"],
    edgeIds: ["clientA-lb", "lb-chatA", "chatA-directory", "directory-directoryReplica", "chatA-storage"],
    note: "Chat Server A writes the message to the chat history store, tagged with a per-recipient sequence number.",
  },
  {
    nodeIds: ["clientA", "lb", "chatA", "directory", "directoryReplica", "storage", "queue", "chatB"],
    edgeIds: ["clientA-lb", "lb-chatA", "chatA-directory", "directory-directoryReplica", "chatA-storage", "chatA-queue", "queue-chatB"],
    note: "Chat Server A publishes to the chat's own Kafka topic, and Chat Server B, subscribed to that topic, picks it up.",
  },
  {
    nodeIds: ["clientA", "lb", "chatA", "directory", "directoryReplica", "storage", "queue", "chatB", "clientB", "cache"],
    edgeIds: ["clientA-lb", "lb-chatA", "chatA-directory", "directory-directoryReplica", "chatA-storage", "chatA-queue", "queue-chatB", "chatB-clientB", "chatB-cache"],
    note: "If Client B is online, Chat Server B pushes the message down its open connection and updates the recent-messages cache.",
    highlight: ["chatB", "clientB"],
  },
  {
    nodeIds: ["clientA", "lb", "chatA", "directory", "directoryReplica", "storage", "queue", "chatB", "clientB", "cache", "notif", "push"],
    edgeIds: ["clientA-lb", "lb-chatA", "chatA-directory", "directory-directoryReplica", "chatA-storage", "chatA-queue", "queue-chatB", "chatB-clientB", "chatB-cache", "queue-notif", "notif-push", "push-clientB"],
    note: "If Client B is offline instead, the Notification Service consumes the same message off the topic and hands it to a push provider.",
    highlight: ["notif", "push"],
  },
  {
    nodeIds: ["clientA", "lb", "chatA", "directory", "directoryReplica", "storage", "queue", "chatB", "clientB", "cache", "notif", "push"],
    edgeIds: ["clientA-lb", "lb-chatA", "chatA-directory", "directory-directoryReplica", "chatA-storage", "chatA-queue", "queue-chatB", "chatB-clientB", "chatB-cache", "queue-notif", "notif-push", "push-clientB", "cache-storage"],
    note: "The cache stays backed by the durable store underneath it, so a cache miss still resolves correctly.",
  },
];

export const designingMessenger: BlogPostData = {
  title: "Designing Facebook Messenger",
  date: "July 6, 2026",
  slug: "designing-messenger",
  content: (
    <>
      <Paragraph delay={0.1}>
        Send a text and it shows up on your friend's phone half a second later, a little checkmark turns blue, and
        you move on with your day without ever thinking about what just happened underneath. That instant round
        trip is deceptively hard to build at the scale a service like Facebook Messenger runs at, hundreds of
        millions of people holding open connections at once, every one of them expecting a message to arrive in
        the same order it was sent, on every device, even when the network in between is doing its best to make
        that difficult.
      </Paragraph>

      <Paragraph delay={0.15}>
        What makes this problem interesting isn't any single hard algorithm, it's that almost every choice trades
        against another. Push a message the instant it's sent, or wait for a durable write first. Broadcast
        presence to everyone, or make clients ask. Partition by conversation, or by person. None of these have a
        universally correct answer, and working through why is most of what this design actually is.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        Requirements
      </Heading>

      <Paragraph delay={0.25}>
        Functionally, the system needs to support one-on-one conversations between users, track who's currently
        online, and persist chat history so a conversation survives a restart or a new device. Extended
        requirements add group conversations and the ability to notify a user of a new message even when their
        app isn't open.
      </Paragraph>

      <Paragraph delay={0.3}>
        The non-functional requirements are where the interesting trade-off lives. Real-time delivery with
        minimum latency is table stakes for a chat product, nobody tolerates a five-second delay on a text. But
        the harder requirement is <strong>strong consistency</strong>, a user should see the exact same messages, in the
        exact same order, whether they open the conversation on their phone or their laptop. That's worth giving
        up some availability for. A brief window where the system refuses a write rather than risk two devices
        disagreeing about history is an acceptable cost, a permanently diverging chat history is not.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Sizing the problem
      </Heading>

      <Paragraph delay={0.4}>
        Assume <strong>500 million daily active users</strong>, each sending about 40 messages a day, with an average
        message size of 100 bytes.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Traffic, storage, bandwidth, and chat server count, all derived from the same 500 million daily active user starting point."
      />

      <StatTiles items={stats} delay={0.05} />

      <Paragraph delay={0.45}>
        Ten thousand chat servers holding fifty thousand connections apiece is the number that shapes the rest of
        this design. Every one of those servers needs a way to find any other one, since a message's sender and
        its recipient are, more often than not, connected to two different machines.
      </Paragraph>

      <Heading level={2} delay={0.5}>
        High level design
      </Heading>

      <Paragraph delay={0.55}>
        At the center of the system sits a fleet of chat servers, each one holding open connections to whichever
        users a load balancer has assigned to it. Sending a message is a round trip that touches both the sender's
        and the recipient's chat server before the sender ever sees a delivery confirmation.
      </Paragraph>

      <List delay={0.6}>
        <ListItem>Client A sends a message to its chat server.</ListItem>
        <ListItem>The chat server acknowledges receipt back to Client A.</ListItem>
        <ListItem>The chat server persists the message and routes it toward Client B.</ListItem>
        <ListItem>Client B receives the message and acknowledges it back to its own chat server.</ListItem>
        <ListItem>Client A gets notified that the message was actually delivered, not just received by the server.</ListItem>
      </List>

      <MessageAckChainDiagram
        delay={0.05}
        caption="The full ack chain, three arrows between User A and its own chat server, a background write to storage, a double-arrow handoff across to Server B, and two arrows delivering and acking with User B."
      />

      <Paragraph delay={0.65}>
        The gap between step two and step five is exactly the difference between a message being <InlineCode>sent</InlineCode> and a
        message being <InlineCode>delivered</InlineCode>, a distinction the delivery states section further down makes precise.
      </Paragraph>

      <Heading level={2} delay={0.7}>
        One-on-one messaging and the connection problem
      </Heading>

      <Paragraph delay={0.75}>
        The first design decision is how a client learns about a new message at all. One option is a pull model,
        the client periodically asks the server whether anything new has arrived. It's simple, but tuning the
        interval is a lose-lose, poll too slowly and messages feel delayed, poll too quickly and most requests
        come back empty, wasting connections and battery for nothing. The alternative is a push model, the client
        keeps a connection open and the server writes to it the instant a message shows up. That's strictly
        better for this workload, so the design keeps every active client on an open connection, a <strong>WebSocket</strong>,
        and lets the server push instead of waiting to be asked.
      </Paragraph>

      <Paragraph delay={0.8}>
        A chat server keeps a simple in-memory table mapping each connected UserID to its live connection object.
        A new message for that user is a hash table lookup and a write to the socket, nothing more exotic than
        that.
      </Paragraph>

      <Heading level={3} delay={0.85}>
        Finding the right chat server
      </Heading>

      <Paragraph delay={0.9}>
        The connection table only helps a chat server route to users it's personally holding a connection for.
        Ten thousand servers spread across five hundred million connections means the sender and recipient are
        almost always attached to two different machines, so something has to answer the question of which
        server currently holds a given user's connection.
      </Paragraph>

      <Paragraph delay={0.95}>
        A <strong>directory service</strong>, a Redis-like key-value store mapping UserID to chat server, answers exactly
        that. When a client connects, its chat server registers the mapping. When another chat server needs to
        route a message to that user, it looks the mapping up. This is simpler and more flexible than trying to
        infer the right server from a hash of the UserID or the user's geographic location, connections move
        around as people reconnect, switch networks, or get reassigned by the load balancer, and a directory
        service just reflects whatever's currently true rather than trying to compute it.
      </Paragraph>

      <Paragraph delay={1}>
        Hitting the directory service on every single message doesn't scale at this volume, even a well-sharded,
        replicated key-value store with separated reads and writes is still an unnecessary round trip for a
        mapping that rarely changes mid-conversation. The fix is for each chat server to cache the UserID to
        server mappings it looks up. A cached entry serves most subsequent messages to the same recipient for
        free, and if a cached entry turns out to be stale, because the user reconnected somewhere else, the
        delivery attempt fails, the chat server falls back to the directory service for a fresh lookup, and
        updates its cache. That failure path is rare enough, and cheap enough when it happens, that the cache
        carries almost all of the real traffic.
      </Paragraph>

      <DirectoryLookupDiagram
        delay={0.05}
        caption="Local cache first, directory service only on a miss. A hit skips the round trip entirely, a miss resolves the real mapping and caches it for next time."
      />

      <Heading level={2} delay={1.05}>
        Ordering and consistency
      </Heading>

      <Paragraph delay={1.1}>
        A server-assigned timestamp looks like an obvious way to order messages, but it doesn't actually
        guarantee a consistent view for both participants. Consider two messages crossing in flight, User 1
        sends M1 at time T1, and before M1 is delivered, User 2 independently sends M2 at time T2, where T2 comes
        slightly after T1. The server ends up sending M1 to User 2 and M2 to User 1. User 1 sees M1 first, then
        M2. User 2 sees M2 first, then M1. Both users are looking at a different ordering of the same two
        messages, and a single global timestamp can't fix that, because each user was only ever a valid recipient
        of one of the two.
      </Paragraph>

      <Paragraph delay={1.15}>
        The actual fix is a <strong>per-recipient sequence number</strong>, a counter the chat server increments for every
        message it hands to one specific user, independent of any other conversation. This doesn't make both
        users see identical orderings of the exact same conversation events, that's not actually required, it
        makes each user's own view of their own message stream internally consistent across every device they own,
        which is the actual strong consistency requirement from the top of this design. A user's phone and laptop
        agree on the order because they're both reading the same per-recipient sequence, not because the two
        participants in a conversation somehow agree on a single shared clock.
      </Paragraph>

      <Heading level={2} delay={1.2}>
        Message delivery states
      </Heading>

      <Paragraph delay={1.25}>
        The blue checkmarks and gray ticks users actually see map onto three server-tracked states, each one
        triggered by a specific acknowledgment further down the chain.
      </Paragraph>

      <List delay={1.3}>
        <ListItem>
          <strong>Sent.</strong> The sender's chat server has accepted the message and acknowledged it back to the
          sender. This says nothing about the recipient yet, only that the message is now the server's problem.
        </ListItem>
        <ListItem>
          <strong>Delivered.</strong> The recipient's device has received the message over its open connection and
          acknowledged that receipt back to its chat server, which relays the acknowledgment back to the sender.
          A message can sit at sent for an arbitrary amount of time if the recipient is offline.
        </ListItem>
        <ListItem>
          <strong>Read.</strong> The recipient has actually opened the conversation. This is a separate
          client-triggered event, distinct from delivery, since a message can be sitting on a device
          unread for hours after it's technically been delivered.
        </ListItem>
      </List>

      <Paragraph delay={1.35}>
        Each transition is an acknowledgment traveling in the opposite direction from the original message, sent
        needs an ack from the sender's own chat server, delivered needs one from the recipient's device relayed
        back through the recipient's chat server, and read needs an explicit signal the client only fires when
        the conversation is actually foregrounded. None of these states requires a new mechanism beyond the
        acknowledgment chain the system already needs for reliable delivery, they're just three different points
        along that same chain being surfaced to the user.
      </Paragraph>

      <Heading level={2} delay={1.4}>
        Failure handling and deduplication
      </Heading>

      <Paragraph delay={1.45}>
        Two distinct failure modes need separate handling, and conflating them leads to either lost messages or
        duplicated ones.
      </Paragraph>

      <Paragraph delay={1.5}>
        The first is a chat server dying before it acknowledges the sender at all. The client never gets past
        the sent state, so it shows the message as failed, typically in red, reconnects through the load
        balancer to whatever chat server it gets assigned next, and retries the send. Nothing was ever durably
        stored, so nothing needs to be reconciled, the retry is a clean do-over.
      </Paragraph>

      <Paragraph delay={1.55}>
        The second is worse. The chat server successfully persists the message to storage, but crashes before
        it can send the acknowledgment back to the client. From the client's point of view this looks identical
        to the first failure, it never got an ack, so it retries. But this time the message did make it into
        storage once already, and a naive retry stores it twice. The fix is deduplication at write time, the
        client attaches an idempotency key to every message, commonly a hash over the sender, the content, and a
        client-generated timestamp, and the storage layer rejects a write that already has a record with the
        same key. A retried send after a crash lands on the same key both times, so the second write is
        recognized as a duplicate and dropped rather than double-stored.
      </Paragraph>

      <Heading level={2} delay={1.6}>
        Group messaging fan-out
      </Heading>

      <Paragraph delay={1.65}>
        A one-on-one message only ever needs to reach one other chat server. A group message might need to reach
        as many chat servers as there are online members, potentially dozens, scattered across the fleet. Two
        options exist for actually moving the message from the sending chat server to every relevant one.
      </Paragraph>

      <Paragraph delay={1.7}>
        The first is a direct synchronous call, the sending chat server looks up every member's server through
        the directory service and calls each one directly. It's the lowest-latency option for the common
        one-on-one case, but for a group it couples the sender's chat server to the availability of every single
        recipient's chat server, one slow or momentarily unreachable member stalls the whole fan-out, and there's
        no buffering if a burst of messages lands in a large, active group all at once.
      </Paragraph>

      <Paragraph delay={1.75}>
        The second is a distributed log such as <strong>Apache Kafka</strong>, the same kind of naming a Redis-like store
        earns for the directory service, giving each chat a dedicated topic. The sending chat server publishes
        once, and every chat server holding a connection for a member of that chat subscribes to the topic and
        consumes independently. This is a <strong>publish-subscribe</strong> pattern, and it fits both one-on-one and group
        delivery through the same mechanism, a one-on-one chat's topic just happens to have one subscriber
        instead of many. The trade is added latency and infrastructure complexity in exchange for decoupling the
        sender from any one recipient's availability, and for naturally absorbing bursty fan-out load in large
        groups without one slow subscriber blocking everyone else. Given that group chats are exactly the case
        where fan-out width is unpredictable and a single member being temporarily offline shouldn't stall
        delivery to everyone else, Kafka-style pub-sub is the better fit here, even though it costs a bit of
        latency the one-on-one case alone wouldn't have needed to pay.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={pubSubNodes}
        edges={pubSubEdges}
        height={280}
        delay={0.05}
        caption="One publish reaches every subscriber independently. A group's fan-out and a one-on-one delivery use the same mechanism, just with a different number of subscribers on the topic."
      />

      <Heading level={3} delay={1.8}>
        Group membership changes
      </Heading>

      <Paragraph delay={1.85}>
        A group's member list gets cached wherever it's needed, at the chat servers handling that group's
        traffic and potentially at the directory service too, so a lookup doesn't have to hit the group's
        database record on every message. Removing a member from a group means that cached list is now stale
        everywhere it's held. The fix follows the same shape as any cache invalidation problem, update the
        authoritative member list in the group's database record first, then broadcast an invalidation event
        (over the same Kafka infrastructure already in place) telling every chat server holding a stale copy
        to evict or refresh it. A removed member briefly still routable through a stale cache is a much smaller
        problem than a database update that never propagates at all.
      </Paragraph>

      <Heading level={2} delay={1.9}>
        Storage and pagination
      </Heading>

      <Paragraph delay={1.95}>
        The write pattern here is unusual enough to rule out the obvious choices. This system needs to absorb an
        extremely high rate of small writes, a single 100-byte message at a time, while also supporting fast
        sequential range reads, pulling the last fifty messages of one conversation in order. A relational
        database or a general document store pays a real cost reading and writing one small row at a time at
        this volume, the per-row overhead dominates the actual data being moved.
      </Paragraph>

      <Paragraph delay={2}>
        A <strong>wide-column store</strong> like HBase fits this shape well. Modeled after Google's Bigtable and built on
        top of a distributed file system, it buffers incoming writes in memory and flushes them to disk in bulk,
        which is exactly the pattern that makes a huge volume of small writes cheap. Rows for one conversation
        are stored together and sorted by key, so fetching a range of recent messages is a sequential scan, not a
        scatter of random lookups. Each row carries the chat it belongs to, a sortable message ID that encodes a
        timestamp, the sender, a per-recipient sequence number, the body, and its current delivery status.
      </Paragraph>

      <Paragraph delay={2.05}>
        Clients never fetch a conversation's entire history at once, they paginate, and page size varies by
        device, a phone with a small viewport requests fewer messages per page than a desktop client with more
        screen real estate to fill. Because messages within a conversation are stored contiguously and sorted by
        message ID, a page is just the next contiguous slice, no separate index or join required.
      </Paragraph>

      <Heading level={2} delay={2.1}>
        Partitioning
      </Heading>

      <Paragraph delay={2.15}>
        With 3.65 petabytes of messages to store, the data has to split across roughly a thousand shards, and
        which key drives that split matters as much here as the storage engine choice itself.
      </Paragraph>

      <Heading level={3} delay={2.2}>
        Partition by UserID
      </Heading>

      <Paragraph delay={2.25}>
        Every message a user sends or receives lands on one shard, keyed by hashing their UserID. Fetching one
        user's entire message history is a single-shard operation, about as fast as this kind of lookup gets.
        The failure mode is a single unusually active user, someone in a huge number of conversations, whose
        combined message volume can outgrow whatever one shard can comfortably hold, concentrating load in a way
        no amount of caching fully absorbs.
      </Paragraph>

      <Heading level={3} delay={2.3}>
        Partition by ChatID
      </Heading>

      <Paragraph delay={2.35}>
        Every message belonging to one conversation lands on one shard instead, keyed by hashing the chat's own
        ID. Since a client only ever reads one conversation at a time, this matches the actual access pattern
        just as well as partitioning by user does. The failure mode moves rather than disappears, a single
        enormous, extremely active group chat can now dominate one shard the same way a hyperactive user could
        under the other scheme, just scoped to a conversation instead of an account.
      </Paragraph>

      <Paragraph delay={2.4}>
        Partitioning by MessageID, the message's own unique identifier, is worth ruling out explicitly. It would
        spread every conversation evenly across every shard with no hotspot risk at all, but it destroys the one
        property both other schemes preserve, fetching a conversation's history would mean scattering reads
        across nearly every shard in the cluster and merging the results, exactly the scatter-gather cost this
        design exists to avoid. Both UserID and ChatID trade the same hot-shard risk for the locality a chat
        product actually needs, MessageID gives up that locality for an even distribution nothing here asked for.
      </Paragraph>

      <Paragraph delay={2.45}>
        Realistically, one of those two remaining hotspot risks is far more likely to actually happen. A single
        person generating enough message volume to overwhelm a shard on their own is rare, there's only so much
        typing one human does in a day. An oversized, extremely active group chat is a much more ordinary
        occurrence, and one operators can see coming and split proactively, the same way a hot shard gets
        rebalanced onto a fresh machine under any other partitioning scheme. That's why ChatID, not UserID, is
        the key most production chat systems actually reach for.
      </Paragraph>

      <Heading level={2} delay={2.5}>
        Caching
      </Heading>

      <Paragraph delay={2.55}>
        A user's viewport rarely shows more than a handful of open conversations at once, so caching the last
        fifteen or so messages from the five most recent conversations covers the overwhelming majority of reads
        without needing to touch the durable store. Because messages for one user already live on one shard,
        that user's cache entries naturally live on one machine too, keeping the cache lookup as cheap as the
        underlying storage lookup it's shortcutting.
      </Paragraph>

      <Heading level={2} delay={2.6}>
        Online presence tracking
      </Heading>

      <Paragraph delay={2.65}>
        A chat server already knows exactly who's connected to it, that part is free. What's expensive is telling
        everyone else. Naively broadcasting every status change to a user's entire friend list would mean five
        hundred million users each generating fan-out traffic to their whole social graph on every connect and
        disconnect, most of it for someone who isn't even looking at that friend's name right now. The fix is to
        broadcast only the transition that's rare and time-sensitive, and let clients pull everything else, which
        breaks down into five concrete rules.
      </Paragraph>

      <List delay={2.7}>
        <ListItem>A client pulls the current status of its entire friends list once, when the app starts, a single burst instead of an ongoing feed.</ListItem>
        <ListItem>Messaging an offline user surfaces the failure directly, so the client marks that one user offline locally without a dedicated presence check.</ListItem>
        <ListItem>Going online is broadcast, but with a short delay of a few seconds, so a user who reconnects immediately after a brief drop doesn't trigger a flicker of updates to everyone watching.</ListItem>
        <ListItem>Clients pull presence only for whichever users are currently visible in their own viewport, and only occasionally, tolerating a few seconds of staleness on an offline status.</ListItem>
        <ListItem>Opening a new conversation triggers one fresh pull for that specific person.</ListItem>
      </List>

      <Paragraph delay={2.75}>
        The pattern underneath all five is the same, push the transition that's rare and time-sensitive, coming
        online, and let clients pull the transition that's common and tolerant of a little delay, going offline,
        or a status nobody's currently watching.
      </Paragraph>

      <Heading level={2} delay={2.8}>
        Push notifications for offline users
      </Heading>

      <Paragraph delay={2.85}>
        An offline recipient still needs to find out a message arrived, just not over the same open connection
        that no longer exists. A <strong>Notification Service</strong> consumes messages destined for offline users off
        the same Kafka infrastructure used for fan-out, and hands each one to the appropriate manufacturer's push
        gateway, Apple's or Google's push notification service depending on the device, which delivers it through
        the operating system's own notification channel rather than the app maintaining any connection of its
        own. This is why a phone can show a message notification even with the app fully closed, the OS-level
        push channel exists entirely outside this system's own connection layer.
      </Paragraph>

      <Heading level={2} delay={2.9}>
        End-to-end encryption, conceptually
      </Heading>

      <Paragraph delay={2.95}>
        Everything described so far treats the chat server as trusted enough to read message content, it has to,
        in order to store and route messages. End-to-end encryption changes that assumption, the server only
        ever handles ciphertext it cannot read, and only the sender and recipient devices hold the keys needed
        to decrypt it.
      </Paragraph>

      <Paragraph delay={3}>
        The mechanism modern messengers reach for is built around a <strong>key exchange</strong> that lets two devices
        agree on a shared secret without ever transmitting that secret itself, followed by a ratcheting scheme
        (the Signal Protocol's double ratchet is the most widely deployed example) that derives a fresh
        encryption key for every message rather than reusing one key for a whole conversation. That means
        compromising one message's key doesn't expose the rest of the conversation, forward and backward, a
        property plain symmetric encryption with a single static key doesn't give you.
      </Paragraph>

      <Paragraph delay={3.05}>
        The trade-off is real, not just a checkbox. A server that can't read message content can't run
        server-side search over chat history, can't scan for abusive content before it's reported, and can't
        offer a cloud backup that doesn't itself become a place where plaintext has to live somewhere.
      </Paragraph>

      <Paragraph delay={3.1}>
        Production systems that ship end-to-end encryption work around this without quietly weakening it. Search
        typically moves entirely on-device, each client already holds a decrypted copy of its own history, so it
        can build and query its own local search index without the server ever seeing plaintext. Abuse detection
        leans on client-side scanning before encryption happens, matching against known-bad content hashes on the
        device itself, similar in spirit to how some platforms scan images against abuse databases before upload,
        plus metadata and behavioral signals the server can see regardless of content, message frequency, report
        rates, account graphs, and user-submitted reports, none of which need plaintext at all. Every piece of
        this design still stands with encryption layered on top, the chat server, the directory service, the
        topic, and the storage layer all keep doing exactly what they already do, they just do it to bytes they
        can no longer interpret.
      </Paragraph>

      <Heading level={2} delay={3.15}>
        Fault tolerance and replication
      </Heading>

      <Paragraph delay={3.2}>
        A chat server holding open TCP connections is genuinely hard to fail over, there's no clean way to hand a
        live socket to another machine. The simpler and more common answer is to not try, clients detect the
        drop and reconnect through the load balancer, landing on a fresh server and re-registering with the
        directory service as if they'd just opened the app.
      </Paragraph>

      <Paragraph delay={3.25}>
        The directory service and the message store need different replication guarantees because a stale
        mapping and a lost message have very different consequences. A directory lookup that's briefly wrong just
        triggers a retry against the real chat server. A message that's gone is gone. Leader-follower replication
        with a standby ready to take over, the same shape a Zookeeper-style leader election gives you, is enough
        to remove the directory service as a single point of failure without paying for anything stronger. The
        message store, where losing data is unacceptable, replicates every write to multiple copies before
        considering it durable.
      </Paragraph>

      <ReplicationDiagram panels={directoryReplicationPanels} delay={0.05} />

      <Heading level={2} delay={3.3}>
        Putting it all together
      </Heading>

      <Paragraph delay={3.35}>
        A message's journey touches nearly every piece of this design in one round trip, the load balancer
        assigning a connection, the directory service resolving where the recipient actually lives, a Kafka
        topic fanning the message out to however many chat servers need it, durable storage backing everything
        the cache serves, and a notification path standing by for whoever's offline when it all happens.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={nodes}
        edges={edges}
        phases={phases}
        height={640}
        delay={0.05}
        caption="The complete design. The directory service resolves recipient routing, a per-chat Kafka topic handles both one-on-one and group fan-out, storage backs the cache, and the notification service picks up exactly what an offline client's chat server can't deliver directly."
      />

      <Heading level={2} delay={3.4}>
        Takeaways
      </Heading>

      <List delay={3.45}>
        <ListItem>
          Push beats pull for real-time delivery, but the harder problem is routing between chat servers, not
          maintaining the connection itself. A directory service with an aggressive local cache on top is what
          makes that routing cheap enough to survive at scale.
        </ListItem>
        <ListItem>
          Ordering is per-recipient, not global. A shared timestamp across two participants can't produce a
          consistent view for both of them, a sequence number scoped to one user's own message stream can.
        </ListItem>
        <ListItem>
          Sent, delivered, and read are just three points along the same acknowledgment chain the system already
          needs for reliability, not a separate feature bolted on top of it.
        </ListItem>
        <ListItem>
          A Kafka-style topic per chat handles one-on-one and group fan-out through the same publish-subscribe
          mechanism, trading a little latency for decoupling the sender from every recipient's availability.
        </ListItem>
        <ListItem>
          Match replication strength to what's actually at stake, a stale routing entry just needs a retry, a
          lost message needs multiple durable copies before it's ever acknowledged.
        </ListItem>
      </List>

      <Paragraph delay={3.5}>
        None of the individual pieces here are exotic on their own, a hash table, a pub-sub topic, a wide-column
        store, a key-value cache. What makes this design worth sitting with is how many of those pieces exist
        purely to make a trade-off explicit, availability against consistency, latency against decoupling, one
        hot shard against another. Thanks for reading.
      </Paragraph>
    </>
  ),
};
