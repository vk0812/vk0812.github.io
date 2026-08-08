import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  InlineCode,
  List,
  ListItem,
  SchemaCards,
  SchemaTableSpec,
  ReplicationDiagram,
  ReplicationPanel,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  DualWriteOutboxDiagram,
  WriteAheadLogDiagram,
  CdcTailingLogDiagram,
} from "../components";
import { ShoppingCart, Database, Radar, Layers, Users } from "lucide-react";

const outboxTable: SchemaTableSpec[] = [
  {
    name: "outbox",
    fields: [
      { name: "id", note: "primary key" },
      { name: "aggregate_type", note: "e.g. order" },
      { name: "aggregate_id", note: "the order's own id" },
      { name: "event_type", note: "e.g. order_placed" },
      { name: "payload", note: "the event body, as JSON" },
      { name: "created_at" },
      { name: "processed_at", note: "nullable, set once relayed" },
    ],
  },
];

const flowNodes: DiagramNode[] = [
  { id: "order", label: "Order Service", icon: ShoppingCart, color: "text-slate-500", x: 8, y: 50 },
  { id: "db", label: "Postgres", sub: "orders + outbox, one txn", icon: Database, color: "text-blue-600", x: 30, y: 50 },
  { id: "relay", label: "Relay / CDC", sub: "Debezium or a poller", icon: Radar, color: "text-violet-500", x: 54, y: 50 },
  { id: "kafka", label: "Kafka Topic", icon: Layers, color: "text-orange-600", x: 76, y: 50 },
  { id: "consumers", label: "Consumers", sub: "billing, inventory...", icon: Users, color: "text-teal-500", x: 95, y: 50 },
];

const flowEdges: DiagramEdge[] = [
  { id: "order-db", from: "order", to: "db" },
  { id: "db-relay", from: "db", to: "relay" },
  { id: "relay-kafka", from: "relay", to: "kafka" },
  { id: "kafka-consumers", from: "kafka", to: "consumers" },
];

const relayPanels: [ReplicationPanel, ReplicationPanel] = [
  {
    title: "Polling Publisher",
    writeLabel: "Outbox table (unprocessed rows)",
    fanLabel: "poll every few seconds",
    nodes: ["Scheduler", "Kafka topic"],
    note: "Simple to build. Latency is floored by the poll interval, and every tick is a query competing with the table's real writers.",
  },
  {
    title: "Log-Based CDC",
    writeLabel: "Transaction log (already durable)",
    fanLabel: "tail commits in order",
    nodes: ["Debezium connector", "Kafka topic"],
    note: "Piggybacks on infrastructure the database already runs. Millisecond latency, near-zero added load, exact commit order preserved.",
  },
];

export const changeDataCaptureOutbox: BlogPostData = {
  title: "Change Data Capture",
  date: "August 8, 2026",
  slug: "change-data-capture-outbox",
  content: (
    <>
      <Paragraph delay={0.10}>
        An order service saves a new order to its own database, then turns around and publishes an order placed event to Kafka so billing, inventory, and shipping can react. That looks like one operation. It is actually two, landing on two completely separate systems that have no idea about each other's transactions.
      </Paragraph>

      <Paragraph delay={0.15}>
        Now let the process crash. Say it dies right after the database commit but before the Kafka publish goes out. The order is sitting in the database, real, paid for, waiting to ship, and not a single downstream system was ever told it exists. A ghost order. Flip the crash to the other side, publish first and the database write never lands, and now there's an event flying around Kafka describing an order that doesn't exist anywhere. Reordering the two calls doesn't fix this. There is always a window between them where the process can die and leave the two systems disagreeing forever. That's the <strong>dual-write problem</strong>, and it shows up anywhere a service has to update its own database and tell the rest of the world about it in the same breath.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        The log every database already keeps
      </Heading>

      <Paragraph delay={0.25}>
        Databases solve a smaller, related problem for themselves already. A relational database has to survive its own crashes, the machine loses power mid-write, and the data files on disk still need to come back consistent. The mechanism behind that is the <strong>write-ahead log</strong>, or WAL, and every serious relational database, Postgres, MySQL, SQL Server, keeps one.
      </Paragraph>

      <Paragraph delay={0.30}>
        The idea is write-ahead, right there in the name. When a transaction changes a row, the database doesn't rush to update that row's page on disk. It first appends a record describing the change to an append-only log file. Only once that log record is safely on disk, confirmed with an fsync call that forces the operating system to actually flush it instead of just buffering it in memory, does the database consider the transaction committed. The data page itself gets updated later, sometimes seconds later, whenever it's convenient.
      </Paragraph>

      <Paragraph delay={0.35}>
        That ordering is what makes crash recovery possible. If the machine dies between the log write and the data page update, the page might be stale, but that's fine, because on restart the database reads the log from wherever it left off and replays every committed change until the data files match what the log says actually happened. The log is the source of truth. The data pages are just a cache of it that's allowed to lag.
      </Paragraph>

      <WriteAheadLogDiagram
        delay={0.05}
        caption="A change is appended to the log before the data page updates. A crash before the flush finishes is fine, replaying the log on restart brings the page back in line."
      />

      <Paragraph delay={0.40}>
        This same log is also what makes replication work in most relational databases. A replica doesn't receive a stream of finished tables, it receives a copy of the primary's write-ahead log and replays it locally, arriving at the same state a moment behind. That detail matters later. It means the log isn't some side feature bolted on for one use case, it's central, durable infrastructure that already exists for reasons that have nothing to do with messaging.
      </Paragraph>

      <Heading level={2} delay={0.45}>
        The outbox pattern
      </Heading>

      <Paragraph delay={0.50}>
        Here's the thing a single database transaction can do that no combination of separate systems can. It's atomic. Either every statement inside it commits, or none of them do, and the database guarantees that no matter what fails partway through. The <strong>outbox pattern</strong> takes advantage of that directly. Instead of writing the order and separately publishing to Kafka, the service writes the order row and an outbox row describing the event in the exact same local transaction.
      </Paragraph>

      <Paragraph delay={0.55}>
        That outbox row just sits in an ordinary table in the same database, right next to the orders table. It isn't sent anywhere yet, it's only recorded, as part of the one transaction that also wrote the order. Either both rows land, or neither does. There's no window where one exists without the other, because there was only ever one write, to one system. The dual-write problem doesn't get handled more carefully here, it disappears, since the thing that caused it, two independent commits, is gone.
      </Paragraph>

      <DualWriteOutboxDiagram
        delay={0.05}
        caption="Left, the dual write, a database commit that succeeds while the Kafka publish is lost to a crash. Right, the outbox fix, one transaction that commits both rows together or neither."
      />

      <Paragraph delay={0.60}>
        The outbox table itself is deliberately plain. A row just needs enough to identify what changed and to describe the event that followed.
      </Paragraph>

      <SchemaCards tables={outboxTable} delay={0.05} />

      <Paragraph delay={0.65}>
        Something still has to move that outbox row into Kafka. That's the relay sitting between the database and the topic, whichever shape it ends up taking.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={flowNodes}
        edges={flowEdges}
        height={300}
        delay={0.05}
        caption="The order and its outbox row commit together in one transaction. A relay, polling or log-based, is the only thing standing between that row and Kafka."
      />

      <Heading level={2} delay={0.70}>
        Getting rows out of the outbox
      </Heading>

      <Heading level={3} delay={0.75}>
        The polling publisher
      </Heading>

      <Paragraph delay={0.80}>
        The simplest relay is a scheduler. A background worker wakes up on a timer, say every two seconds, runs something like <InlineCode>SELECT * FROM outbox WHERE processed_at IS NULL ORDER BY created_at</InlineCode>, publishes each row it finds to Kafka, then marks it processed or deletes it outright. Next tick, it does it again. That's the whole mechanism, and it clears the outbox the same way a person keeps checking their mailbox and pulling out whatever's arrived since the last check.
      </Paragraph>

      <Paragraph delay={0.85}>
        It works, and it's the version most teams reach for first, but every part of it has a cost. Latency is floored by the poll interval, an event published the instant after a poll ran waits the full interval before anyone sees it. The poll query itself runs constantly whether there's anything new or not, adding load to a table that's supposed to be a lightweight side effect of writes. Marking rows processed, or worse, deleting them, means the poller and the application's own writers are now touching the same rows, and a growing processed backlog needs its own cleanup job. There's a subtler issue too. A poller reading by <InlineCode>created_at</InlineCode> can, under concurrent transactions, see a later row committed before an earlier one, since a transaction that started first isn't guaranteed to commit first, so its ordering guarantee is weaker than it looks.
      </Paragraph>

      <Heading level={3} delay={0.90}>
        Log-based CDC
      </Heading>

      <Paragraph delay={0.95}>
        <strong>Change Data Capture</strong> flips the mechanism entirely. Instead of asking the table what's new, a connector, Debezium is the common one, attaches directly to the database's write-ahead log and reads it the way a replica would. Every committed change that touches the outbox table becomes an event the connector emits, tagged with a position in the log, its offset, so it always knows exactly where it left off, even across a restart.
      </Paragraph>

      <Paragraph delay={1.00}>
        The connector turns each committed outbox insert into a message and hands it to Kafka, typically through the exact topic the downstream consumers already read from. Because it's reading the log directly, it sees a row the moment its transaction commits, not on the next tick of some timer. There's no <InlineCode>SELECT</InlineCode> running against the outbox table at all.
      </Paragraph>

      <CdcTailingLogDiagram
        delay={0.05}
        caption="The connector tails the log and its offset advances past each commit. A committed outbox row becomes a message dropped into a Kafka partition for consumers waiting downstream."
      />

      <ReplicationDiagram panels={relayPanels} delay={0.05} />

      <Heading level={2} delay={1.05}>
        Why read the log instead of the table
      </Heading>

      <Paragraph delay={1.10}>
        It's worth asking directly why bother tailing the log at all, when a CDC connector could just poll the outbox table the same way a scheduler does. The answer is that the log gives away several things for free that a table scan has to pay for every single time.
      </Paragraph>

      <Paragraph delay={1.15}>
        The log already exists. Every transaction the database runs writes to it anyway, for its own crash recovery and its own replication, whether or not anyone downstream cares about Kafka. A CDC connector attaching to that log is riding along on infrastructure the database was always going to maintain. Reading it costs the database almost nothing extra, it's the same stream a replica would consume, and one more reader doesn't mean one more query plan competing for locks and buffer pool space against the application's actual writes. A polling query, by contrast, is a real <InlineCode>SELECT</InlineCode> that has to be planned, executed, and paid for on every tick, forever, whether or not anything changed.
      </Paragraph>

      <Paragraph delay={1.20}>
        The log also carries every committed change in the exact order those transactions committed, deletes included, which a naive polling query can miss entirely. A table scan only shows current state, an insert followed quickly by a delete before the next poll simply vanishes, as if it never happened. The log shows both events, in order, because it's a record of what happened, not a snapshot of what's left. And because the connector reads committed transactions directly off the log in commit order, there's none of the visibility ambiguity a poller has to worry about, no risk that a row exists but the poller's query started just before its transaction committed and missed it for one more cycle.
      </Paragraph>

      <Paragraph delay={1.25}>
        Finally, none of this needs a cleanup job. A polling relay has to mark rows processed or delete them, and that's write traffic contending with the application's own writes to the same table. Tailing the log needs no such bookkeeping against the outbox table at all, the connector's offset lives entirely in its own state, off to the side. The database can garbage-collect old outbox rows on its own schedule, or just let them age out, without the relay needing to touch them again.
      </Paragraph>

      <Heading level={2} delay={1.30}>
        Delivery guarantees, downstream
      </Heading>

      <Paragraph delay={1.35}>
        None of this adds up to exactly-once delivery, and it isn't trying to. A relay, polling or log-based, can publish a message to Kafka and then crash before it records that the publish succeeded, and on restart it'll publish that same message again. The whole pipeline, database transaction to outbox row to relay to Kafka to consumer, is <strong>at-least-once</strong>, and duplicates are an expected, ordinary outcome rather than a bug.
      </Paragraph>

      <Paragraph delay={1.40}>
        That pushes the responsibility downstream. A consumer needs to be <strong>idempotent</strong>, using the event's own id to recognize and skip a message it has already processed, rather than assuming Kafka handed it something brand new every time. Ordering holds within a partition key, typically the aggregate id, an order's events arrive in the order they were written, but there's no ordering promise across different orders processing in parallel. Design consumers around both of those, and the guarantees this pipeline actually offers are enough to build on.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Takeaways
      </Heading>

      <List delay={1.50}>
        <ListItem>The dual-write problem is structural. Writing to a database and publishing to a queue are two commits to two systems, and no reordering of the calls closes the crash window between them.</ListItem>
        <ListItem>The outbox pattern collapses that into one commit. The business row and the event row land in the same local transaction, so they're never out of sync.</ListItem>
        <ListItem>A polling publisher is the simplest relay to build, but its latency, load, and cleanup costs all come from asking the table what changed instead of watching commits happen.</ListItem>
        <ListItem>Log-based CDC tails infrastructure the database already runs for its own crash recovery and replication, so it costs the database almost nothing extra and sees every commit in exact order, deletes included.</ListItem>
        <ListItem>The whole pipeline is at-least-once. Idempotent consumers, keyed on the event id, are what make duplicate delivery a non-issue instead of a data bug.</ListItem>
      </List>

      <Paragraph delay={1.55}>
        The outbox pattern and CDC look like two separate tricks, one about a database transaction, one about tailing a log, but they're really the same idea applied twice. Let the part of the system that's already good at being consistent, the database's own transaction and its own log, do the hard part, and build everything downstream to expect it might hear about a change more than once. Thanks for reading.
      </Paragraph>
    </>
  ),
};
