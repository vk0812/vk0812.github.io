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
  InsertConvergenceDiagram,
} from "../components";
import {
  Camera,
  Database,
  History,
  Layers,
  Radio,
  Recycle,
  Route,
  ShieldCheck,
  Users,
  Waypoints,
  Zap,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Concurrent editing sessions",
    lines: [
      { expression: "50M documents opened for editing per day ÷ 86,400 seconds", result: "≈ 580 opens/s average" },
      { expression: "580 opens/s × 600 second average session length", result: "≈ 350K concurrent sessions on average" },
      { expression: "350K average concurrent × 3 business-hours peak multiplier", result: "≈ 1.05M concurrent sessions at peak" },
    ],
    note: "Most open sessions are idle at any given instant, someone is reading rather than typing, so concurrency by itself is not the same thing as edit load.",
  },
  {
    title: "Operation throughput",
    lines: [
      { expression: "1.05M peak concurrent sessions × 10% actively typing at any instant", result: "≈ 105K sessions typing right now" },
      { expression: "105K typing sessions ÷ 1 operation every 2 seconds", result: "≈ 52.5K operations/s at peak" },
    ],
    note: "Clients batch a short burst of keystrokes into one operation instead of sending every keypress, which keeps this number well below raw typing speed.",
  },
  {
    title: "Operation log growth",
    lines: [
      { expression: "52.5K operations/s × 100 bytes per operation record", result: "≈ 5.25 MB/s of durable writes" },
      { expression: "5.25 MB/s × 86,400 seconds", result: "≈ 454 GB/day of log growth" },
    ],
    note: "An append-only log is about the cheapest write pattern a database can serve. Every write lands at the end, nothing already on disk is ever rewritten.",
  },
  {
    title: "Snapshot storage",
    lines: [
      { expression: "50M active documents/day × 20 KB average snapshot size", result: "≈ 1 TB/day of snapshot storage" },
    ],
    note: "The snapshot is what makes reopening a five-year-old document with forty thousand edits behind it just as fast as opening a brand-new one.",
  },
];

const stats: StatItem[] = [
  { label: "Peak concurrent sessions", value: 1.05, suffix: "M", icon: Users, color: "text-blue-500" },
  { label: "Peak operation rate", value: 52.5, suffix: "K/s", icon: Zap, color: "text-teal-500" },
  { label: "Op log growth", value: 454, suffix: " GB/day", icon: Database, color: "text-violet-500" },
  { label: "Snapshot storage", value: 1, suffix: " TB/day", icon: Camera, color: "text-amber-500" },
];

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "GET",
    path: "/documents/{document_id}",
    description:
      "Returns document metadata, the caller's permission level, and the current version number needed to open a live session.",
  },
  {
    method: "GET",
    path: "/documents/{document_id}/snapshot",
    description:
      "Returns the latest durable snapshot plus every operation committed since it, everything a client needs to reconstruct the current text before joining.",
  },
  {
    method: "WS",
    path: "/documents/{document_id}/session",
    description:
      "The persistent connection for submitting local operations, receiving the canonical broadcast, and exchanging ephemeral presence updates.",
  },
  {
    method: "POST",
    path: "/documents/{document_id}/share",
    description:
      "Creates or updates a share link and its role, viewer, commenter, or editor, without touching the document body itself.",
  },
  {
    method: "GET",
    path: "/documents/{document_id}/history",
    description:
      "Lists named restore points built from durable snapshots, letting a collaborator preview or revert to an earlier version.",
  },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "documents",
    fields: [
      { name: "document_id", note: "primary key" },
      { name: "owner_id" },
      { name: "title" },
      { name: "current_version" },
      { name: "created_at" },
    ],
  },
  {
    name: "operations",
    fields: [
      { name: "document_id, version", note: "composite primary key" },
      { name: "op_type" },
      { name: "position" },
      { name: "payload" },
      { name: "author_id" },
      { name: "committed_at" },
    ],
  },
  {
    name: "snapshots",
    fields: [
      { name: "document_id, version", note: "composite primary key" },
      { name: "content" },
      { name: "created_at" },
    ],
  },
  {
    name: "collaborators",
    fields: [
      { name: "document_id, user_id", note: "composite primary key" },
      { name: "role" },
      { name: "added_at" },
    ],
  },
  {
    name: "share_links",
    fields: [
      { name: "link_id", note: "primary key" },
      { name: "document_id" },
      { name: "role" },
      { name: "expires_at" },
      { name: "revoked_at", note: "nullable" },
    ],
  },
];

const openDocNodes: DiagramNode[] = [
  { id: "client", label: "Client", icon: Users, color: "text-slate-500", x: 12, y: 50 },
  { id: "session", label: "Document Session", sub: "authoritative in-memory state", icon: Layers, color: "text-violet-500", x: 45, y: 50 },
  { id: "snapshot", label: "Snapshot Store", sub: "latest full copy", icon: Camera, color: "text-teal-500", x: 78, y: 25 },
  { id: "oplog", label: "Operation Log", sub: "ops since that snapshot", icon: Database, color: "text-blue-600", x: 78, y: 75 },
];

const openDocEdges: DiagramEdge[] = [
  { id: "client-session", from: "client", to: "session" },
  { id: "session-snapshot", from: "session", to: "snapshot" },
  { id: "session-oplog", from: "session", to: "oplog" },
];

const finalNodes: DiagramNode[] = [
  { id: "editors", label: "Editors", icon: Users, color: "text-slate-500", x: 10, y: 8 },
  { id: "gateway", label: "WebSocket Gateway", icon: Waypoints, color: "text-blue-500", x: 32, y: 8 },
  { id: "auth", label: "Permission Check", icon: ShieldCheck, color: "text-rose-500", x: 54, y: 8 },
  { id: "router", label: "Document Router", sub: "consistent hashing by document ID", icon: Route, color: "text-amber-500", x: 78, y: 8 },
  { id: "session", label: "Document Session", sub: "authoritative in-memory state", icon: Layers, color: "text-violet-500", x: 45, y: 32 },
  { id: "oplog", label: "Operation Log", sub: "append-only, durable", icon: Database, color: "text-blue-600", x: 18, y: 58 },
  { id: "snapshot", label: "Snapshot Store", sub: "periodic full copy", icon: Camera, color: "text-teal-500", x: 50, y: 58 },
  { id: "presence", label: "Presence Service", sub: "ephemeral, Redis pub-sub", icon: Radio, color: "text-fuchsia-500", x: 82, y: 58 },
  { id: "compaction", label: "Compaction Worker", sub: "consolidates old ops", icon: Recycle, color: "text-emerald-500", x: 34, y: 84 },
  { id: "history", label: "Version History", sub: "named restore points", icon: History, color: "text-indigo-500", x: 66, y: 84 },
];

const finalEdges: DiagramEdge[] = [
  { id: "editors-gateway", from: "editors", to: "gateway", bidirectional: true },
  { id: "gateway-auth", from: "gateway", to: "auth" },
  { id: "auth-router", from: "auth", to: "router" },
  { id: "router-session", from: "router", to: "session" },
  { id: "session-oplog", from: "session", to: "oplog" },
  { id: "session-snapshot", from: "session", to: "snapshot" },
  { id: "session-presence", from: "session", to: "presence", bidirectional: true },
  { id: "oplog-compaction", from: "oplog", to: "compaction" },
  { id: "compaction-snapshot", from: "compaction", to: "snapshot" },
  { id: "snapshot-history", from: "snapshot", to: "history" },
];

const finalPhases: DiagramPhase[] = [
  {
    nodeIds: ["editors", "gateway", "auth", "router"],
    edgeIds: ["editors-gateway", "gateway-auth", "auth-router"],
    note: "Every connection passes through a gateway and a permission check before it ever reaches a document.",
  },
  {
    nodeIds: ["editors", "gateway", "auth", "router", "session"],
    edgeIds: ["editors-gateway", "gateway-auth", "auth-router", "router-session"],
    note: "Consistent hashing on the document ID routes every editor of one document to the same session, so ordering decisions happen in exactly one place.",
    highlight: ["session"],
  },
  {
    nodeIds: ["editors", "gateway", "auth", "router", "session", "oplog", "snapshot"],
    edgeIds: ["editors-gateway", "gateway-auth", "auth-router", "router-session", "session-oplog", "session-snapshot"],
    note: "Every accepted operation is durably appended before it is ever acknowledged, and a periodic snapshot keeps reopening the document fast.",
    highlight: ["oplog", "snapshot"],
  },
  {
    nodeIds: ["editors", "gateway", "auth", "router", "session", "oplog", "snapshot", "compaction"],
    edgeIds: ["editors-gateway", "gateway-auth", "auth-router", "router-session", "session-oplog", "session-snapshot", "oplog-compaction", "compaction-snapshot"],
    note: "A background worker folds old operations into fresh snapshots, so the log a new session has to replay never grows without bound.",
    highlight: ["compaction"],
  },
  {
    nodeIds: ["editors", "gateway", "auth", "router", "session", "oplog", "snapshot", "compaction", "presence"],
    edgeIds: ["editors-gateway", "gateway-auth", "auth-router", "router-session", "session-oplog", "session-snapshot", "oplog-compaction", "compaction-snapshot", "session-presence"],
    note: "Cursors and selections flow through a separate, ephemeral channel that never touches the durable log.",
    highlight: ["presence"],
  },
  {
    nodeIds: ["editors", "gateway", "auth", "router", "session", "oplog", "snapshot", "compaction", "presence", "history"],
    edgeIds: ["editors-gateway", "gateway-auth", "auth-router", "router-session", "session-oplog", "session-snapshot", "oplog-compaction", "compaction-snapshot", "session-presence", "snapshot-history"],
    note: "Named restore points are just snapshots with a label, letting a collaborator preview or roll back to an earlier version.",
    highlight: ["history"],
  },
];

export const designingGoogleDocs: BlogPostData = {
  title: "Designing Google Docs",
  date: "August 7, 2026",
  slug: "designing-google-docs",
  content: (
    <>
      <Paragraph delay={0.10}>
        Two people open the same document. One is fixing a typo three words into a sentence, the other is typing
        a new sentence at the very end of it. Both edits land within the same fraction of a second. A moment
        later, both screens show the exact same text, in the exact same order, with nothing that looks like a
        merge conflict and no dialog asking anyone to pick a winner.
      </Paragraph>

      <Paragraph delay={0.15}>
        Getting a keystroke from a browser to a server and back quickly is a solved problem, plenty of chat
        apps do it. The hard part here is different. Two people can edit the same character position at the
        same instant, and the system still has to land on one document that both of them agree on, without
        ever asking a human to resolve it.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What must be true
      </Heading>

      <List delay={0.25}>
        <ListItem>
          <strong>Everyone converges on the same document.</strong> Concurrent edits from different people
          merge into one consistent result, never a silently different copy sitting in someone's browser tab.
        </ListItem>
        <ListItem>
          <strong>Typing feels instant.</strong> A keystroke shows up in the editor the moment it happens,
          whether or not the network round trip to confirm it has finished yet.
        </ListItem>
        <ListItem>
          <strong>Presence is cheap to lose.</strong> Cursors and selections update live so collaborators can
          see where everyone else is working, but losing a stray cursor position is fine. Losing a typed
          character is not.
        </ListItem>
        <ListItem>
          <strong>Edits survive going offline.</strong> A dropped connection queues local changes and
          reconciles them on reconnect instead of discarding them.
        </ListItem>
        <ListItem>
          <strong>Access is enforced continuously.</strong> A share link or a collaborator role is checked
          when a session opens, and kept checked for as long as that session stays open.
        </ListItem>
      </List>

      <Paragraph delay={0.30}>
        Rich formatting, tables, and images all matter to a real product, and they make the editing model more
        complicated. The design below treats a document as a flat sequence of characters, since almost every
        hard problem in collaborative editing already shows up at that level. A short note near the end covers
        what changes once structure gets added on top.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Sizing collaborative editing
      </Heading>

      <Paragraph delay={0.40}>
        Start from <strong>50 million documents opened for editing every day</strong>, with an average editing
        session lasting about ten minutes. These are round planning assumptions, not a claim about any real
        product's traffic. The goal is to see how a small number of concurrent editors turns into a much larger
        number of tiny, constant writes.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Planning numbers for collaborative editing. A modest number of open documents still produces a steady stream of small, cheap, append-only writes."
      />

      <StatTiles items={stats} delay={0.05} />

      <Heading level={2} delay={0.45}>
        A small public surface
      </Heading>

      <Paragraph delay={0.50}>
        Most of the interesting traffic never touches a REST endpoint at all, it flows over one long-lived
        connection per open document. The handful of request-response endpoints exist to get a client into that
        connection, and to manage who is allowed to join it.
      </Paragraph>

      <ApiEndpointsTable items={apiEndpoints} delay={0.05} />

      <Heading level={2} delay={0.55}>
        What a document actually is
      </Heading>

      <Paragraph delay={0.60}>
        A document's current text is never the primary source of truth by itself. It is a value that gets
        rebuilt from a snapshot and a trailing list of operations, which is why the operations table below
        matters just as much as the documents table.
      </Paragraph>

      <SchemaCards tables={schemaTables} delay={0.05} />

      <Paragraph delay={0.65}>
        Notice what is missing. There is no table for cursor positions or who is currently typing. That data
        is real and updates constantly, but it does not belong in a durable schema, and the section on presence
        below explains why.
      </Paragraph>

      <Heading level={2} delay={0.70}>
        Opening a document without replaying its whole history
      </Heading>

      <Paragraph delay={0.75}>
        A document that has existed for five years might have accumulated tens of thousands of edits. Replaying
        every one of them from an empty page every time someone opens it would make old documents slower to
        open than new ones, which is backwards. Instead, the service keeps a periodic full copy of the document,
        a snapshot, tagged with the version number it was taken at.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={openDocNodes}
        edges={openDocEdges}
        height={380}
        delay={0.05}
        caption="Opening a document pulls the latest snapshot and only the operations committed after it, instead of replaying the entire edit history."
      />

      <Paragraph delay={0.80}>
        Opening a document fetches the newest snapshot plus every operation committed after it, applies those
        few operations on top of the snapshot, and the client has the current text without ever touching an
        edit older than that snapshot. The client then subscribes to the live session for anything committed
        after that moment.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        Typing before the network agrees
      </Heading>

      <Paragraph delay={0.90}>
        Waiting for a server round trip before showing a typed character would make an editor feel laggy on
        any connection worse than perfect. Instead, the client applies its own edit to its local copy of the
        document immediately, then sends the operation to the server in the background. The keystroke the
        person just typed is visible before the network has done anything at all.
      </Paragraph>

      <Paragraph delay={0.95}>
        That local edit is optimistic. It is correct only if nothing else changes the document in a
        conflicting way before the server confirms it. The client keeps a small queue of operations it has
        sent but not yet had acknowledged, and it is exactly that queue that has to be reconciled the moment
        two people happen to edit the same part of the document at once.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        Every editor of one document lands on the same session
      </Heading>

      <Paragraph delay={1.05}>
        Reconciling conflicting edits is much simpler if one process, not a fleet of them, gets to decide the
        order those edits happened in. The service routes every WebSocket connection for a given document to
        the same backend process using consistent hashing on the document ID, so the same <strong>Document
        Session</strong> handles every editor of that document at once. That session holds the document's
        current text, its connected clients, and the next version number to hand out, all in memory.
      </Paragraph>

      <Paragraph delay={1.10}>
        Keeping one document's ordering decisions inside one process removes the need for a distributed lock
        every time two edits race. The tradeoff shows up later, what happens when that one process is holding
        far more connections than any other, and what happens when it crashes, both covered further down.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        Two people, one position, one converged result
      </Heading>

      <Paragraph delay={1.20}>
        Here is the actual conflict. Both editors start from the same two-character document, "AC". One editor
        inserts "B" at index 1, meaning right after "A". At the same instant, the other editor inserts "X" at
        that same index 1, on their own copy of "AC", which they have not yet heard anyone else touched.
        Applied locally and immediately, editor one now sees "ABC" and editor two now sees "AXC". Two different
        documents, from two edits that both looked completely reasonable on their own.
      </Paragraph>

      <Paragraph delay={1.25}>
        If each client simply forwarded the other's raw operation and replayed it blindly, they would not even
        agree with each other afterward. Editor one, sitting on "ABC", would apply "insert X at index 1"
        unchanged and get "AXBC". Editor two, sitting on "AXC", would apply "insert B at index 1" unchanged and
        get "ABXC". Same two original edits, two different final documents. This is the entire problem, and it
        is why a raw character index is not enough information to send over the wire.
      </Paragraph>

      <Paragraph delay={1.30}>
        <strong>Operational Transformation</strong> solves it by having a single authority for each document,
        the Document Session described above, act as a server sequencer. It receives both
        operations, assigns each one a version number in the order they actually arrived, and appends them to
        the durable log in that order. Say editor one's insert is assigned version 1 and editor two's insert is
        assigned version 2. Before broadcasting version 2, the sequencer transforms it against everything that
        already committed ahead of it. Both operations target the same index, so a fixed tie-break rule (lower
        session ID commits first, for instance) decides that editor one's insert effectively happened first,
        which means editor two's insert has to shift one position to the right to land after it, at index 2
        instead of index 1. Both clients replay that transformed history and land on "ABXC".
      </Paragraph>

      <InsertConvergenceDiagram
        delay={0.05}
        caption="Two inserts at the same index would diverge if applied raw. A sequencer assigns each one a version and transforms the later insert to make room for the earlier one, so both clients converge on the same text."
      />

      <Paragraph delay={1.35}>
        <strong>Conflict-free Replicated Data Types</strong> reach the same kind of agreement from a completely
        different direction. Instead of transforming operations against each other, every character gets a
        stable, globally unique position identifier the moment it is inserted, chosen so it sorts consistently
        relative to its neighbors no matter which replica generated it. In the same example, "B" might be
        assigned a position between "A" and "C" that sorts before the position "X" gets assigned for the same
        gap, using the same kind of tie-break rule as above. Neither client needs to transform anything or wait
        for a central authority to hand out version numbers, they just apply operations in any order and sort
        by position, and every replica lands on the same result on its own. The price is that each character
        needs to carry that identifier permanently, which is more metadata than Operational Transformation's
        compact "insert at index" record.
      </Paragraph>

      <Paragraph delay={1.40}>
        Rich formatting complicates both approaches in the same way. An "insert at index" or a stable position
        identifier is enough for plain text, but a bold span, a table cell, or a moved paragraph needs its own
        conflict rule on top, often handled as a separate set of attributes attached to a range of text, merged
        with a simple rule like whichever change committed last wins for that one attribute. The character-level
        mechanism above still does the heavy lifting, structure is additional bookkeeping layered over it.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Presence and cursors don't belong in the log
      </Heading>

      <Paragraph delay={1.50}>
        A cursor position or a text selection has to update dozens of times a second per active editor, and
        nobody needs to recover it after a crash or replay it into a version history. Routing it through the
        same durable, ordered, sequencer-assigned path as an actual edit would add load to the one thing that
        must never lose data, for information that is fine to lose.
      </Paragraph>

      <Paragraph delay={1.55}>
        Presence updates instead flow through a separate, ephemeral channel, commonly an in-memory publish and
        subscribe layer such as Redis, scoped to that one document's connected clients. A dropped presence
        update just means someone's cursor looks momentarily stale, the next update a fraction of a second
        later fixes it. That channel never writes to the operation log and never needs to be durable, which
        also means it can be dropped under load first, before an actual edit ever would be.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        Editing offline and catching back up
      </Heading>

      <Paragraph delay={1.65}>
        A client that loses its connection keeps working. Local edits keep applying to the in-memory document
        exactly as before, they just accumulate in that pending queue instead of being sent anywhere. Typing
        does not need a network to happen.
      </Paragraph>

      <Paragraph delay={1.70}>
        On reconnect, the client tells the server the last version number it knew about and asks for everything
        committed since then. It replays those missed operations on top of its own document, then resends its
        still-pending local queue as new operations against that caught-up state. Whether the underlying
        mechanism is Operational Transformation or the position-based approach, the machinery is the same
        machinery covered above, the client's queued edits just get transformed or merged against however much
        history it missed while it was gone, instead of against a single concurrent edit.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        The log grows forever unless something trims it
      </Heading>

      <Paragraph delay={1.80}>
        Every accepted operation is appended to the operation log before the sequencer ever acknowledges it,
        which is what makes the log the actual durable source of truth. Left alone forever, though, it grows
        without bound, and reconstructing a document would eventually mean replaying an enormous history on
        every open.
      </Paragraph>

      <Paragraph delay={1.85}>
        A background compaction worker periodically applies a long run of operations to the last snapshot and
        writes out a new one, then the operations folded into it can be archived or deleted from the hot path
        without losing anything a client actually needs to open the document quickly. Named restore points, the
        kind of version history a person can browse and revert to, are really just snapshots that were given a
        label instead of being cleaned up on the usual schedule.
      </Paragraph>

      <Heading level={2} delay={1.90}>
        Sharding by document, and what a popular one does to a session
      </Heading>

      <Paragraph delay={1.95}>
        Routing every editor of a document to one session, described above, is a form of partitioning, each
        document's live state lives on exactly one backend process at a time. Consistent hashing on the document
        ID spreads millions of documents across a fleet of these processes, and moving a document to a new
        owner (a deploy, a crash, added capacity) only reshuffles a small slice of that assignment.
      </Paragraph>

      <Paragraph delay={2.00}>
        A document with hundreds of simultaneous editors, a viral public form or a big shared planning doc,
        puts real pressure on the one session that owns it. Every committed operation has to be broadcast to
        every connected client of that document, so a slow or badly connected client can back up that
        broadcast queue if nothing pushes back. Presence updates get shed first under that kind of pressure,
        since they are the one category of data already designed to be lossy. Batching several small operations
        into fewer WebSocket frames, and giving a hot document's session extra memory and connection headroom,
        keeps a single popular document from degrading everyone else sharing the fleet.
      </Paragraph>

      <Heading level={2} delay={2.05}>
        Permissions checked at the door and every time after
      </Heading>

      <Paragraph delay={2.10}>
        A share link or a collaborator role gets checked before a WebSocket connection is even allowed to open,
        confirming that this identity can view, comment on, or edit this specific document. That check cannot
        be a one-time gate. A share link can be revoked, or an editor's role downgraded, while that person's
        session is still open.
      </Paragraph>

      <Paragraph delay={2.15}>
        The permission check is repeated on every operation the session receives, not just at connect time, and
        a revocation event pushed into that document's session forces any connection whose access just changed
        to be dropped immediately rather than quietly waiting for its next reconnect.
      </Paragraph>

      <Heading level={2} delay={2.20}>
        When a Document Session dies mid-edit
      </Heading>

      <Paragraph delay={2.25}>
        Every operation was already durably appended to the log before it was acknowledged, so a session
        crashing loses nothing that a client was told succeeded. What it does lose is its in-memory state, the
        current text, the connected client list, the next version counter, none of which was ever the source
        of truth in the first place.
      </Paragraph>

      <Paragraph delay={2.30}>
        A new session, on the same process after a restart or a different one after a rehash, rebuilds that
        state from the latest snapshot plus the log's tail before it accepts a single new write. Clients whose
        connection dropped reconnect and ask for everything since their last known version, the exact same
        request an offline client already makes on reconnect. A dead session and a disconnected client recover
        through the same mechanism, because from the log's point of view they are the same kind of gap.
      </Paragraph>

      <Heading level={2} delay={2.35}>
        Putting the design together
      </Heading>

      <Paragraph delay={2.40}>
        The finished design has a clear separation. A thin, stateless front handles connections and permission
        checks. Exactly one session per document holds the state that must be ordered, backed by a durable log
        and its snapshots. Presence sits entirely outside that durable path, allowed to be lossy in a way an
        edit never can be.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={finalNodes}
        edges={finalEdges}
        phases={finalPhases}
        height={900}
        delay={0.05}
        caption="The final design routes every editor of one document to a single authoritative session, backed by a durable operation log, periodic snapshots, background compaction, and a separate ephemeral presence channel."
      />

      <Heading level={2} delay={2.45}>
        Takeaways
      </Heading>

      <List delay={2.50}>
        <ListItem>
          <strong>Convergence, not locking, is the goal.</strong> The design never blocks one editor to protect
          another. It lets both edits happen and guarantees they land on the same result afterward.
        </ListItem>
        <ListItem>
          <strong>Apply locally first, confirm later.</strong> Optimistic local edits keep typing instant, at
          the cost of a pending queue that has to be reconciled against whatever the server decides actually
          happened.
        </ListItem>
        <ListItem>
          <strong>One authority per document beats a distributed lock.</strong> Routing every editor of a
          document to the same session turns a hard coordination problem into an ordinary in-memory one.
        </ListItem>
        <ListItem>
          <strong>Not all real-time data deserves the same guarantees.</strong> Presence is allowed to be lossy.
          An edit is not. Keeping them on separate paths lets each one be handled at the cost it deserves.
        </ListItem>
        <ListItem>
          <strong>The log is truth, the snapshot is just a shortcut.</strong> Snapshots and compaction exist
          purely to avoid replaying history, recovery and offline reconciliation both fall back to the log
          itself.
        </ListItem>
      </List>

      <Paragraph delay={2.55}>
        None of this is really about text editing. It is about what happens whenever two independent actors
        change the same shared thing at almost the same moment, and a system still has to produce one answer
        without asking anyone to referee. A document is just a convenient, visible place to watch that problem
        get solved in real time. Thanks for reading.
      </Paragraph>
    </>
  ),
};
