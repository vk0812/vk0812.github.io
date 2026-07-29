import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  InlineCode,
  CodeBlock,
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
  SeatHoldRaceDiagram,
} from "../components";
import {
  Armchair,
  Bell,
  CalendarDays,
  CreditCard,
  Database,
  DoorOpen,
  Layers,
  LockKeyhole,
  Search,
  ShieldCheck,
  Ticket,
  Timer,
  Users,
  Waypoints,
  Zap,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Browsing traffic",
    lines: [
      { expression: "3B page views/month ÷ 30 days", result: "≈ 100M views/day" },
      { expression: "100M views/day ÷ 86,400 seconds", result: "≈ 1.16K views/s average" },
      { expression: "1.16K views/s × 25 sale-day peak", result: "≈ 29K views/s peak" },
    ],
    note: "Browsing is mostly cacheable. A popular on-sale is not an average day, so the peak multiplier matters more than the monthly average.",
  },
  {
    title: "Checkout traffic",
    lines: [
      { expression: "10M tickets/month ÷ 30 days", result: "≈ 333K tickets/day" },
      { expression: "333K tickets/day ÷ 86,400 seconds", result: "≈ 3.9 tickets/s average" },
      { expression: "3.9 tickets/s × 100 sale peak", result: "≈ 390 tickets/s peak" },
    ],
    note: "The payment count is much lower than browsing, but it needs a much stricter correctness boundary because every successful write consumes inventory.",
  },
  {
    title: "Show inventory",
    lines: [
      { expression: "500 cities × 10 venues", result: "= 5,000 venues" },
      { expression: "5,000 venues × 2,000 seats × 2 shows/day", result: "= 20M seat states/day" },
      { expression: "20M states × 100 bytes", result: "≈ 2 GB/day" },
    ],
    note: "One hundred bytes covers a simplified seat-state record plus booking metadata. Static venue and event data is tiny next to per-show inventory.",
  },
  {
    title: "Five-year history",
    lines: [
      { expression: "2 GB/day × 365 days", result: "≈ 730 GB/year" },
      { expression: "730 GB/year × 5 years", result: "≈ 3.65 TB raw" },
      { expression: "3.65 TB × 3 replicas", result: "≈ 11 TB before indexes" },
    ],
    note: "These are planning assumptions, not Ticketmaster production figures. They show that durable storage is tractable, while a sudden onsale is the real stress case.",
  },
];

const stats: StatItem[] = [
  { label: "Peak browsing", value: 29, suffix: "K views/s", icon: Search, color: "text-blue-500" },
  { label: "Peak ticket sales", value: 390, suffix: "/s", icon: Ticket, color: "text-teal-500" },
  { label: "Daily seat states", value: 20, suffix: "M", icon: Armchair, color: "text-violet-500" },
  { label: "Five-year replicas", value: 11, suffix: " TB+", icon: Database, color: "text-amber-500" },
];

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "GET",
    path: "/events",
    description:
      "Searches events by city, date range, artist, venue, and page token. The response is served from a search index and cache where possible.",
  },
  {
    method: "GET",
    path: "/shows/{show_id}/seat-map",
    description:
      "Returns the venue layout, pricing tiers, and a recent availability projection. An admission token is required for high-demand onsales.",
  },
  {
    method: "POST",
    path: "/shows/{show_id}/holds",
    description:
      "Atomically requests a complete set of seat IDs for one session. It returns a hold ID and expiration, or a conflict without holding a partial set.",
  },
  {
    method: "POST",
    path: "/holds/{hold_id}/checkout",
    description:
      "Starts payment for a still-valid hold with an idempotency key. Repeating the same request returns the original checkout result instead of charging twice.",
  },
  {
    method: "GET",
    path: "/queue/{event_id}",
    description:
      "Returns queue position, admission state, and a short-lived access token once the shopper may enter the seat-selection flow.",
  },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "shows",
    fields: [
      { name: "show_id", note: "primary key and shard key" },
      { name: "event_id" },
      { name: "venue_id" },
      { name: "starts_at" },
      { name: "sale_state" },
    ],
  },
  {
    name: "show_seats",
    fields: [
      { name: "show_id, seat_id", note: "composite primary key" },
      { name: "section, row, number" },
      { name: "price_tier" },
      { name: "status" },
      { name: "hold_id", note: "nullable" },
    ],
  },
  {
    name: "holds",
    fields: [
      { name: "hold_id", note: "primary key" },
      { name: "show_id" },
      { name: "session_id" },
      { name: "expires_at" },
      { name: "state" },
    ],
  },
  {
    name: "hold_seats",
    fields: [
      { name: "hold_id, seat_id", note: "composite primary key" },
      { name: "show_id" },
      { name: "price_at_hold" },
    ],
  },
  {
    name: "bookings",
    fields: [
      { name: "booking_id", note: "primary key" },
      { name: "hold_id", note: "unique" },
      { name: "state" },
      { name: "confirmed_at" },
    ],
  },
  {
    name: "payments",
    fields: [
      { name: "payment_id", note: "primary key" },
      { name: "booking_id" },
      { name: "provider_reference" },
      { name: "idempotency_key", note: "unique" },
      { name: "state" },
    ],
  },
];

const finalNodes: DiagramNode[] = [
  { id: "fan", label: "Fan", icon: Users, color: "text-slate-500", x: 8, y: 7 },
  { id: "bot", label: "Bot Defense", icon: ShieldCheck, color: "text-rose-500", x: 28, y: 7 },
  { id: "queue", label: "Virtual Queue", icon: DoorOpen, color: "text-amber-500", x: 50, y: 7 },
  { id: "edge", label: "Edge Gateway", icon: Waypoints, color: "text-blue-500", x: 76, y: 7 },
  { id: "catalog", label: "Catalog Service", icon: Search, color: "text-teal-500", x: 18, y: 31 },
  { id: "inventory", label: "Inventory Service", icon: Armchair, color: "text-violet-500", x: 48, y: 31 },
  { id: "checkout", label: "Checkout Service", icon: CreditCard, color: "text-pink-500", x: 79, y: 31 },
  { id: "catalogCache", label: "Catalog Cache", icon: Zap, color: "text-cyan-600", x: 14, y: 55 },
  { id: "holds", label: "Redis Holds", sub: "atomic leases", icon: LockKeyhole, color: "text-orange-500", x: 39, y: 55 },
  { id: "sql", label: "SQL Booking DB", sub: "durable truth", icon: Database, color: "text-blue-600", x: 63, y: 55 },
  { id: "payment", label: "Payment Provider", icon: CreditCard, color: "text-emerald-500", x: 88, y: 55 },
  { id: "events", label: "Event Stream", sub: "Kafka or RabbitMQ", icon: Layers, color: "text-orange-600", x: 50, y: 78 },
  { id: "tickets", label: "Ticket Service", icon: Ticket, color: "text-indigo-500", x: 75, y: 78 },
  { id: "notify", label: "Notification Service", icon: Bell, color: "text-fuchsia-500", x: 91, y: 93 },
];

const finalEdges: DiagramEdge[] = [
  { id: "fan-bot", from: "fan", to: "bot" },
  { id: "bot-queue", from: "bot", to: "queue" },
  { id: "queue-edge", from: "queue", to: "edge" },
  { id: "edge-catalog", from: "edge", to: "catalog" },
  { id: "edge-inventory", from: "edge", to: "inventory" },
  { id: "edge-checkout", from: "edge", to: "checkout" },
  { id: "catalog-cache", from: "catalog", to: "catalogCache", bidirectional: true },
  { id: "inventory-holds", from: "inventory", to: "holds", bidirectional: true },
  { id: "inventory-sql", from: "inventory", to: "sql", bidirectional: true },
  { id: "checkout-sql", from: "checkout", to: "sql", bidirectional: true },
  { id: "checkout-payment", from: "checkout", to: "payment", bidirectional: true },
  { id: "sql-events", from: "sql", to: "events" },
  { id: "events-tickets", from: "events", to: "tickets" },
  { id: "tickets-notify", from: "tickets", to: "notify" },
];

const finalPhases: DiagramPhase[] = [
  {
    nodeIds: ["fan", "bot", "queue", "edge"],
    edgeIds: ["fan-bot", "bot-queue", "queue-edge"],
    note: "Bot checks and a virtual queue turn a sale-time stampede into a controlled stream of admitted shoppers.",
  },
  {
    nodeIds: ["fan", "bot", "queue", "edge", "catalog", "catalogCache"],
    edgeIds: ["fan-bot", "bot-queue", "queue-edge", "edge-catalog", "catalog-cache"],
    note: "The catalog path is cheap and cacheable, so fans can browse events without touching the booking database.",
    highlight: ["catalog", "catalogCache"],
  },
  {
    nodeIds: ["fan", "bot", "queue", "edge", "catalog", "catalogCache", "inventory", "holds", "sql"],
    edgeIds: [
      "fan-bot",
      "bot-queue",
      "queue-edge",
      "edge-catalog",
      "edge-inventory",
      "catalog-cache",
      "inventory-holds",
      "inventory-sql",
    ],
    note: "Seat selection reaches the inventory service, where short Redis leases absorb the race and the SQL database remains the durable record.",
    highlight: ["inventory", "holds", "sql"],
  },
  {
    nodeIds: ["fan", "bot", "queue", "edge", "catalog", "catalogCache", "inventory", "holds", "sql", "checkout", "payment"],
    edgeIds: [
      "fan-bot",
      "bot-queue",
      "queue-edge",
      "edge-catalog",
      "edge-inventory",
      "edge-checkout",
      "catalog-cache",
      "inventory-holds",
      "inventory-sql",
      "checkout-sql",
      "checkout-payment",
    ],
    note: "Checkout uses an idempotency key with the payment provider, then changes the held inventory into one confirmed booking.",
    highlight: ["checkout", "payment"],
  },
  {
    nodeIds: ["fan", "bot", "queue", "edge", "catalog", "catalogCache", "inventory", "holds", "sql", "checkout", "payment", "events", "tickets", "notify"],
    edgeIds: [
      "fan-bot",
      "bot-queue",
      "queue-edge",
      "edge-catalog",
      "edge-inventory",
      "edge-checkout",
      "catalog-cache",
      "inventory-holds",
      "inventory-sql",
      "checkout-sql",
      "checkout-payment",
      "sql-events",
      "events-tickets",
      "tickets-notify",
    ],
    note: "Confirmed bookings produce durable events for ticket delivery, email, and analytics without slowing the seat hold or payment path.",
    highlight: ["events", "tickets", "notify"],
  },
];

export const designingTicketmaster: BlogPostData = {
  title: "Designing Ticketmaster",
  date: "July 13, 2026",
  slug: "designing-ticketmaster",
  content: (
    <>
      <Paragraph delay={0.10}>
        A concert can have 70,000 seats and millions of people who want one at exactly the same second. The
        hard part is not showing a seat map. It is making sure a seat has one owner, a payment is charged once,
        and everyone else gets an honest answer when the answer is no.
      </Paragraph>

      <Paragraph delay={0.15}>
        Ticketmaster publicly describes its Smart Queue as a waiting room that meters fans into a sale at a
        manageable rate. That public behavior is the useful starting point here. The design below is a
        Ticketmaster-style architecture, not a claim about the company&apos;s private implementation.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What must be true
      </Heading>

      <List delay={0.25}>
        <ListItem>
          <strong>Browse events and seat maps.</strong> A fan can find an event by city, artist, venue, or
          date, then inspect a show&apos;s layout and prices.
        </ListItem>
        <ListItem>
          <strong>Hold a complete selection.</strong> A request for three seats succeeds only when all three
          are available. A partial order is worse than a rejection.
        </ListItem>
        <ListItem>
          <strong>Protect the sale.</strong> A five-minute hold gives checkout time without letting someone
          park on inventory forever. A virtual queue keeps an onsale from collapsing under a flash crowd.
        </ListItem>
        <ListItem>
          <strong>Complete money safely.</strong> A confirmed booking, payment record, and ticket issuance
          need an auditable and recoverable path.
        </ListItem>
        <ListItem>
          <strong>Be fair enough to explain.</strong> The queue admits shoppers in a defined order, while
          the inventory service gives the same seat to exactly one completed hold.
        </ListItem>
      </List>

      <Paragraph delay={0.30}>
        Venue setup, seller contracts, refunds, resale rules, and artist presales all matter in a real
        product. They sit around the core design rather than changing its central rule. One seat cannot become
        two tickets.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Sizing the rush
      </Heading>

      <Paragraph delay={0.40}>
        Use 3 billion monthly page views, 10 million monthly tickets, 500 cities, 10 venues per city, 2,000
        seats per venue, and two shows per day. These are deliberately round assumptions inherited from the
        movie-ticket version of the problem. The lesson is not that every event platform has these numbers.
        It is that reads are broad and cheap, while one popular sale concentrates a tiny amount of inventory
        under brutal contention.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Planning numbers for a ticketing service. Browsing dominates total traffic, while the small checkout path needs the strongest consistency."
      />

      <StatTiles items={stats} delay={0.05} />

      <Heading level={2} delay={0.45}>
        The public API is small
      </Heading>

      <Paragraph delay={0.50}>
        The browser mostly reads cached catalog data. The important write endpoints are different. A hold
        takes a list of seats and returns one outcome for the whole list. Checkout takes an idempotency key,
        which means a lost mobile response can be retried without creating another purchase.
      </Paragraph>

      <ApiEndpointsTable items={apiEndpoints} delay={0.05} />

      <Heading level={2} delay={0.55}>
        Model the show, not just the venue
      </Heading>

      <Paragraph delay={0.60}>
        A seat is not sold forever. It is available for one specific show. A stadium seat B12 might be
        available for Friday&apos;s show and sold for Saturday&apos;s. The primary key of the hot inventory record is
        therefore <InlineCode>show_id</InlineCode> plus <InlineCode>seat_id</InlineCode>, not the seat alone.
      </Paragraph>

      <SchemaCards tables={schemaTables} delay={0.05} />

      <Paragraph delay={0.65}>
        The booking database is relational because the critical updates span related rows. A hold changes
        several seat rows, creates a hold, records which seats belong to it, and later creates one booking and
        payment record. Those changes need all-or-nothing behavior. That is what ACID transactions provide.
        NoSQL databases can offer transactions too, but a SQL database is usually the clearest fit for this
        relational, money-adjacent core.
      </Paragraph>

      <Heading level={2} delay={0.70}>
        Turn a stampede into a line
      </Heading>

      <Paragraph delay={0.75}>
        Letting every shopper refresh the seat map at sale time would turn a few thousand seats into millions
        of simultaneous writes and retries. A virtual waiting room runs before inventory. It verifies the
        user and bot signals, assigns a position, then admits a measured number of users each second. The
        rate follows real capacity, not optimism.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={[
          { id: "fans", label: "Fans", icon: Users, color: "text-slate-500", x: 9, y: 25 },
          { id: "defense", label: "Bot Defense", icon: ShieldCheck, color: "text-rose-500", x: 28, y: 25 },
          { id: "room", label: "Waiting Room", icon: DoorOpen, color: "text-amber-500", x: 50, y: 25 },
          { id: "admit", label: "Admission Token", icon: Ticket, color: "text-blue-500", x: 73, y: 25 },
          { id: "seatMap", label: "Seat Map", icon: Armchair, color: "text-teal-500", x: 88, y: 70 },
          { id: "queueStore", label: "Queue Store", sub: "ordered positions", icon: Layers, color: "text-violet-500", x: 50, y: 70 },
        ]}
        edges={[
          { id: "fans-defense", from: "fans", to: "defense" },
          { id: "defense-room", from: "defense", to: "room" },
          { id: "room-admit", from: "room", to: "admit" },
          { id: "room-store", from: "room", to: "queueStore", bidirectional: true },
          { id: "admit-seatMap", from: "admit", to: "seatMap" },
        ]}
        height={430}
        delay={0.05}
        caption="The waiting room is a traffic valve. It records an order, issues short-lived admission tokens, and lets only a controlled set of shoppers reach the seat map."
      />

      <Paragraph delay={0.80}>
        A Redis sorted set is a practical queue store because it keeps a score and a member together. The
        score can represent the assigned position or admission time, and rank lookup is fast. Server-Sent
        Events can push a position update to the browser without making every fan poll every second. The queue
        itself does not guarantee a ticket. It guarantees that the booking service is not drowned before a
        fan gets a chance to choose.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        Hold seats before payment
      </Heading>

      <Paragraph delay={0.90}>
        Payment is slow compared with a seat lock. A card authorization may wait on a bank, a verification
        challenge, or an unreliable mobile network. Holding a database lock throughout that whole journey
        would make the database a checkout waiting room. Instead, the inventory service creates a short lease,
        commonly five to ten minutes, then checkout turns that lease into a confirmed booking.
      </Paragraph>

      <SeatHoldRaceDiagram
        delay={0.05}
        caption="One atomic all-or-nothing hold decides a contested seat selection before payment begins. The losing request gets a conflict, not a partial reservation."
      />

      <Paragraph delay={0.95}>
        Redis is useful for this first decision because an atomic command such as <InlineCode>SET NX EX</InlineCode>{" "}
        can set a key only when it does not already exist, and the expiry cleans up an abandoned lease. A
        multi-seat selection needs a small script or one atomic server operation so the service either gets
        every requested key or releases the ones it briefly acquired. The final SQL write still checks the
        seat state. Redis makes contention fast. SQL remains the durable source of truth.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        Why ordered holds make expiry cheap
      </Heading>

      <Paragraph delay={1.05}>
        A regular hash map is great at finding a reservation by ID, but it has no useful expiry order. A
        linked hash map keeps the same expected constant-time lookup and removal while also linking entries in
        insertion order. For one show, that means the oldest hold sits at the head.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={[
          { id: "show", label: "Show 123", icon: CalendarDays, color: "text-blue-500", x: 10, y: 40 },
          { id: "map", label: "Hold Map", sub: "reservation ID lookup", icon: Layers, color: "text-violet-500", x: 31, y: 40 },
          { id: "oldest", label: "Hold 901", sub: "10:00:00, head", icon: Timer, color: "text-amber-500", x: 54, y: 23 },
          { id: "next", label: "Hold 902", sub: "10:01:30", icon: Timer, color: "text-teal-500", x: 76, y: 23 },
          { id: "newest", label: "Hold 903", sub: "10:02:15, tail", icon: Timer, color: "text-cyan-600", x: 91, y: 23 },
          { id: "expiry", label: "Expiry Worker", icon: Timer, color: "text-rose-500", x: 54, y: 76 },
          { id: "release", label: "Release Seats", icon: Armchair, color: "text-emerald-500", x: 80, y: 76 },
        ]}
        edges={[
          { id: "show-map", from: "show", to: "map" },
          { id: "map-oldest", from: "map", to: "oldest" },
          { id: "oldest-next", from: "oldest", to: "next" },
          { id: "next-newest", from: "next", to: "newest" },
          { id: "oldest-expiry", from: "oldest", to: "expiry" },
          { id: "expiry-release", from: "expiry", to: "release" },
        ]}
        height={430}
        delay={0.05}
        caption="A per-show ordered hold map points directly at the oldest reservation. If that head has not expired, newer entries cannot have expired either."
      />

      <Paragraph delay={1.10}>
        The expiry worker only checks the head timestamp. If it is still live, it stops. If it has expired,
        it releases that hold&apos;s seats, removes the entry, and checks the new head. A cancellation or completed
        payment can still remove a known reservation directly by ID. In a distributed service, this ordered
        index belongs to the show&apos;s assigned partition and is rebuilt from durable holds after failover. A
        Redis sorted set is often a better production-shaped version of the same idea because it is shared and
        ordered by expiration time.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        The final SQL transaction closes the race
      </Heading>

      <Paragraph delay={1.20}>
        Atomic does not mean one transaction runs at a time across the entire database. It means the database
        makes one transaction appear to happen completely or not at all. Different, unrelated seats can still
        be processed in parallel. Contending requests for the same rows are where locking and isolation do the
        work.
      </Paragraph>

      <Paragraph delay={1.25}>
        Serializable is the strongest standard SQL isolation level. It guarantees an outcome equivalent to
        some serial order, but the way a database enforces it varies. The explicit <InlineCode>FOR UPDATE</InlineCode>{" "}
        below is the important part for this flow. It locks the existing seat rows that were read, so another
        reservation for those rows waits, then sees that the first transaction changed their status. A
        serialization failure is retried with the same idempotency key.
      </Paragraph>

      <CodeBlock
        delay={1.30}
        language="SQL"
        code={`BEGIN TRANSACTION ISOLATION LEVEL SERIALIZABLE;

SELECT show_seat_id
FROM show_seats
WHERE show_id = $1
  AND show_seat_id = ANY($2::bigint[])
  AND status = 'available'
FOR UPDATE;

-- Continue only when the query returned every requested seat.
UPDATE show_seats
SET status = 'held', hold_id = $3
WHERE show_id = $1
  AND show_seat_id = ANY($2::bigint[])
  AND status = 'available';

INSERT INTO holds (hold_id, show_id, session_id, expires_at, state)
VALUES ($3, $1, $4, NOW() + INTERVAL '5 minutes', 'active');

INSERT INTO hold_seats (hold_id, show_seat_id, show_id, price_at_hold)
SELECT $3, show_seat_id, show_id, price
FROM show_seats
WHERE hold_id = $3;

COMMIT;`}
      />

      <Paragraph delay={1.35}>
        The service compares the returned row count with the requested seat count before issuing the update.
        If any seat was already held or sold, it rolls back. The client sees one conflict and goes back to the
        map. At confirmation, another guarded transaction checks that the hold belongs to the same session and
        has not expired, changes its seats from held to sold, creates the booking, and records the payment
        attempt.
      </Paragraph>

      <Heading level={2} delay={1.40}>
        Payments need a recovery story
      </Heading>

      <Paragraph delay={1.45}>
        A payment provider is outside the database, so a database transaction cannot atomically commit a card
        charge and a seat sale together. The checkout service uses a durable state machine, often called a
        saga, to coordinate the steps. It creates a pending booking, calls the provider with an idempotency
        key, records the provider reference, then confirms the booking. A timeout retries the same logical
        charge. A failed payment releases the hold. A delayed provider callback reconciles the pending state
        instead of guessing.
      </Paragraph>

      <Paragraph delay={1.50}>
        Card numbers should never sit in these tables. The provider tokenizes the payment method and returns a
        reference the system can safely store. That keeps the booking service out of the raw card-data path
        while retaining an audit trail for refunds, support, and charge disputes.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        Partition by show and keep recovery boring
      </Heading>

      <Paragraph delay={1.60}>
        Partitioning by event or movie is tempting, but one famous artist can turn one partition into a
        bottleneck. Partition the hot inventory by <InlineCode>show_id</InlineCode> instead. Every hold and
        seat update for a show goes to the same shard, while different performances spread naturally across
        the fleet. Consistent hashing makes adding and removing service nodes move only part of the assignment.
      </Paragraph>

      <Paragraph delay={1.65}>
        Hold expiry, payment reconciliation, ticket generation, notification, analytics, and fraud checks are
        delivered as durable events through Kafka or RabbitMQ. Those workers may receive a message more than
        once, so every consumer treats its event ID or booking ID as an idempotency boundary. The database
        remains recoverable even if a worker restarts halfway through an email or a barcode generation job.
      </Paragraph>

      <Heading level={2} delay={1.70}>
        Putting the design together
      </Heading>

      <Paragraph delay={1.75}>
        The final design has two personalities. Browsing favors caches, search indexes, and broad
        availability. Booking favors narrow admission, short atomic holds, SQL transactions, and durable
        recovery. Keeping those personalities separate is what lets a popular event be exciting for fans
        instead of exciting for the incident channel.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={finalNodes}
        edges={finalEdges}
        phases={finalPhases}
        height={1000}
        delay={0.05}
        caption="The final Ticketmaster-style design builds from queue admission to catalog reads, seat holds, payment confirmation, and asynchronous ticket delivery."
      />

      <Heading level={2} delay={1.80}>
        Takeaways
      </Heading>

      <List delay={1.85}>
        <ListItem>
          <strong>Queue before inventory.</strong> A virtual waiting room converts a sale-time spike into an
          admission rate the booking path can actually sustain.
        </ListItem>
        <ListItem>
          <strong>Hold complete seat sets.</strong> The system either holds every requested seat or none, so a
          fan never pays for an accidental partial selection.
        </ListItem>
        <ListItem>
          <strong>Use SQL for the durable boundary.</strong> Relational transactions make the booking, seat
          status, and payment record move together, while Redis keeps the short hold race fast.
        </ListItem>
        <ListItem>
          <strong>Expire from the oldest hold.</strong> An ordered per-show index makes cleanup a head check
          instead of a scan through every live reservation.
        </ListItem>
        <ListItem>
          <strong>Design for retries.</strong> Idempotency keys, guarded state transitions, and durable events
          turn payment timeouts and worker crashes into recoverable work.
        </ListItem>
      </List>

      <Paragraph delay={1.90}>
        Ticketing looks like a search-and-checkout product until demand arrives all at once. Then it becomes a
        coordination problem with a very small number of precious rows. Guard those rows carefully, let
        everything else scale around them, and the system has a fair shot at selling every real seat exactly
        once. Thanks for reading.
      </Paragraph>
    </>
  ),
};
