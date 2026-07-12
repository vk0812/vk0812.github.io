import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
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
} from "../components";
import {
  Users,
  Car,
  MapPin,
  Radio,
  Smartphone,
  Database,
  Route,
  Search,
  Bell,
  Layers,
  Timer,
  Waypoints,
  ShieldCheck,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Location updates",
    lines: [
      { expression: "500K active drivers ÷ 3 seconds", result: "≈ 167K updates/s" },
      { expression: "167K updates/s × 86,400 seconds", result: "≈ 14.4B updates/day" },
      { expression: "500K drivers × 48 bytes", result: "≈ 24 MB live location payload" },
    ],
    note: "The live index is compact, but it receives a constant write stream. This is a write-heavy problem even when the number of rides is modest.",
  },
  {
    title: "Ride requests",
    lines: [
      { expression: "1M rides/day ÷ 86,400 seconds", result: "≈ 12 rides/s average" },
      { expression: "12 rides/s × 10 peak factor", result: "≈ 120 ride requests/s peak" },
      { expression: "120 requests/s × 20 candidates", result: "≈ 2,400 ETA checks/s" },
    ],
    note: "The peak factor leaves room for rush hour and event traffic. Matching is less frequent than GPS ingestion, but it has a much tighter latency budget.",
  },
  {
    title: "Nearby-driver refresh",
    lines: [
      { expression: "1M active riders ÷ 5 seconds", result: "≈ 200K map queries/s" },
      { expression: "200K queries/s × 20 returned drivers", result: "≈ 4M driver positions/s" },
      { expression: "4M positions/s × 24 bytes", result: "≈ 96 MB/s before protocol overhead" },
    ],
    note: "Polling every few seconds keeps the rider map fresh without maintaining an unbounded subscription graph for every nearby vehicle.",
  },
  {
    title: "Durable trip data",
    lines: [
      { expression: "1M rides/day × 2 KB trip record", result: "≈ 2 GB/day" },
      { expression: "2 GB/day × 365 days", result: "≈ 730 GB/year" },
      { expression: "730 GB × 3 replicas", result: "≈ 2.19 TB/year before indexes" },
    ],
    note: "Trips, charges, and receipts need durable history. Driver GPS points are short-lived operational state and should not share that storage path.",
  },
];

const stats: StatItem[] = [
  { label: "Active drivers", value: 500, suffix: "K", icon: Car, color: "text-amber-500" },
  { label: "Location updates", value: 167, suffix: "K/s", icon: Radio, color: "text-teal-500" },
  { label: "Peak ride requests", value: 120, suffix: "/s", icon: Route, color: "text-violet-500" },
  { label: "Rider map queries", value: 200, suffix: "K/s", icon: MapPin, color: "text-blue-500" },
];

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "PUT",
    path: "/drivers/me/location",
    description:
      "Accepts a driver position, heading, availability, timestamp, and monotonically increasing sequence number. Older or duplicate reports are ignored.",
  },
  {
    method: "GET",
    path: "/drivers/nearby",
    description:
      "Takes a rider position, vehicle product, map viewport, and freshness limit. Returns a bounded set of available driver positions for map rendering.",
  },
  {
    method: "POST",
    path: "/trips",
    description:
      "Validates pickup, destination, product, and payment eligibility. Creates an idempotent trip request and starts matching.",
  },
  {
    method: "POST",
    path: "/trips/{trip_id}/accept",
    description:
      "Lets a driver accept a specific offer. The service atomically reserves the driver and returns the current trip state or a conflict if another attempt won.",
  },
  {
    method: "POST",
    path: "/trips/{trip_id}/events",
    description:
      "Records a guarded lifecycle transition such as driver arrived, trip started, completed, or cancelled. Each event includes an idempotency key.",
  },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "drivers",
    fields: [
      { name: "driver_id", note: "primary key" },
      { name: "vehicle_product" },
      { name: "rating" },
      { name: "account_status" },
      { name: "current_trip_id", note: "nullable" },
    ],
  },
  {
    name: "trips",
    fields: [
      { name: "trip_id", note: "primary key" },
      { name: "rider_id" },
      { name: "driver_id", note: "nullable until matched" },
      { name: "pickup" },
      { name: "destination" },
      { name: "state" },
      { name: "quoted_fare" },
      { name: "created_at" },
    ],
  },
  {
    name: "payments",
    fields: [
      { name: "payment_id", note: "primary key" },
      { name: "trip_id", note: "unique idempotency boundary" },
      { name: "amount" },
      { name: "currency" },
      { name: "state" },
      { name: "provider_reference" },
    ],
  },
];

const finalNodes: DiagramNode[] = [
  { id: "rider", label: "Rider App", icon: Smartphone, color: "text-slate-500", x: 8, y: 7 },
  { id: "edge", label: "Edge Gateway", icon: Waypoints, color: "text-blue-500", x: 40, y: 7 },
  { id: "driver", label: "Driver App", icon: Car, color: "text-amber-500", x: 90, y: 7 },
  { id: "location", label: "Location Service", icon: Radio, color: "text-teal-500", x: 18, y: 28 },
  { id: "trip", label: "Trip Service", icon: Route, color: "text-violet-500", x: 50, y: 28 },
  { id: "dispatch", label: "Dispatch Service", icon: Search, color: "text-fuchsia-500", x: 82, y: 28 },
  { id: "geo", label: "Live Geo Index", sub: "cell to driver IDs", icon: MapPin, color: "text-emerald-500", x: 8, y: 51 },
  { id: "state", label: "Driver State", sub: "available or reserved", icon: Users, color: "text-cyan-600", x: 30, y: 51 },
  { id: "workflow", label: "Trip Workflow", sub: "durable state machine", icon: Layers, color: "text-orange-500", x: 50, y: 55 },
  { id: "offers", label: "Offer Service", icon: Bell, color: "text-indigo-500", x: 75, y: 51 },
  { id: "pricing", label: "Pricing and ETA", icon: Timer, color: "text-pink-500", x: 91, y: 51 },
  { id: "tripDb", label: "Trip Database", icon: Database, color: "text-blue-600", x: 50, y: 78 },
  { id: "events", label: "Event Log", icon: Layers, color: "text-orange-600", x: 78, y: 78 },
  { id: "settlement", label: "Downstream Workers", sub: "payment, safety, ratings", icon: ShieldCheck, color: "text-green-600", x: 91, y: 93 },
];

const finalEdges: DiagramEdge[] = [
  { id: "rider-edge", from: "rider", to: "edge" },
  { id: "driver-edge", from: "driver", to: "edge" },
  { id: "edge-location", from: "edge", to: "location" },
  { id: "edge-trip", from: "edge", to: "trip" },
  { id: "location-geo", from: "location", to: "geo" },
  { id: "location-state", from: "location", to: "state" },
  { id: "trip-dispatch", from: "trip", to: "dispatch" },
  { id: "dispatch-state", from: "dispatch", to: "state", bidirectional: true },
  { id: "dispatch-offers", from: "dispatch", to: "offers" },
  { id: "dispatch-pricing", from: "dispatch", to: "pricing", bidirectional: true },
  { id: "trip-workflow", from: "trip", to: "workflow" },
  { id: "workflow-tripDb", from: "workflow", to: "tripDb", bidirectional: true },
  { id: "workflow-events", from: "workflow", to: "events" },
  { id: "events-settlement", from: "events", to: "settlement" },
];

const finalPhases: DiagramPhase[] = [
  {
    nodeIds: ["rider", "edge", "driver"],
    edgeIds: ["rider-edge", "driver-edge"],
    note: "Both apps enter through the gateway. Driver reports and rider requests share a secure edge, then take different paths.",
  },
  {
    nodeIds: ["rider", "edge", "driver", "location", "geo", "state"],
    edgeIds: ["rider-edge", "driver-edge", "edge-location", "location-geo", "location-state"],
    note: "Location updates keep the geo index and driver state fresh enough to answer nearby-driver lookups.",
    highlight: ["location", "geo"],
  },
  {
    nodeIds: ["rider", "edge", "driver", "location", "geo", "state", "trip", "dispatch", "offers", "pricing"],
    edgeIds: [
      "rider-edge",
      "driver-edge",
      "edge-location",
      "location-geo",
      "location-state",
      "edge-trip",
      "trip-dispatch",
      "dispatch-state",
      "dispatch-offers",
      "dispatch-pricing",
    ],
    note: "Dispatch combines current availability with route estimates and price, reserves a driver, then sends an offer.",
    highlight: ["dispatch", "offers"],
  },
  {
    nodeIds: [
      "rider",
      "edge",
      "driver",
      "location",
      "geo",
      "state",
      "trip",
      "dispatch",
      "offers",
      "pricing",
      "workflow",
      "tripDb",
      "events",
      "settlement",
    ],
    edgeIds: [
      "rider-edge",
      "driver-edge",
      "edge-location",
      "location-geo",
      "location-state",
      "edge-trip",
      "trip-dispatch",
      "dispatch-state",
      "dispatch-offers",
      "dispatch-pricing",
      "trip-workflow",
      "workflow-tripDb",
      "workflow-events",
      "events-settlement",
    ],
    note: "After acceptance, the durable workflow records each trip transition and sends reliable events to payment and safety systems.",
    highlight: ["workflow", "tripDb", "events"],
  },
];

export const designingUber: BlogPostData = {
  title: "Designing Uber",
  date: "July 12, 2026",
  slug: "designing-uber",
  content: (
    <>
      <Paragraph delay={0.10}>
        Open a ride-sharing app, set a destination, and a few cars start moving around the map. Request a
        ride and one car turns into your car. It feels immediate because the system has already been
        receiving, indexing, and discarding a huge stream of location reports before you ever tap 'Find a Ride'.
      </Paragraph>

      <Paragraph delay={0.15}>
        The interesting change from a local business search is that the things we are searching for do not
        sit still. A restaurant can live in a spatial index for months. A driver can cross a cell boundary
        in seconds, become unavailable while considering an offer, and then spend half an hour in a trip.
        The design has to make those three kinds of state work together without pretending they need the
        same consistency.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What are we building?
      </Heading>

      <Paragraph delay={0.25}>
        We will design the core two-sided marketplace. Riders request a trip with a pickup and destination.
        Drivers continuously report their location and availability. The service finds eligible nearby
        drivers, makes an offer, records the trip, shows both parties live progress, calculates a fare,
        and finishes with payment and ratings.
      </Paragraph>

      <List delay={0.30}>
        <ListItem>
          <strong>Live availability.</strong> A rider can see a representative set of nearby available
          drivers, and a driver can toggle availability.
        </ListItem>
        <ListItem>
          <strong>Dispatch.</strong> A ride request should receive an offer within a few seconds without
          assigning one driver to two riders.
        </ListItem>
        <ListItem>
          <strong>Trip lifecycle.</strong> Pickup, acceptance, arrival, start, completion, cancellation,
          payment, and rating must have valid, recoverable states.
        </ListItem>
        <ListItem>
          <strong>Real-time progress.</strong> During a trip, both apps see recent locations and updated
          arrival estimates.
        </ListItem>
        {/* <ListItem>
          <strong>Regional resilience.</strong> A busy city and a failing server should not make another
          city stop requesting rides.
        </ListItem> */}
      </List>

      <Paragraph delay={0.35}>
        Shared rides, scheduled trips, driver payouts, maps, and navigation are useful extensions, but they
        would blur the core problem. We will call a road-routing provider for routes and estimates instead
        of building a global road graph here. We will also treat payment as a reliable downstream workflow,
        not as a reason to put card data on the dispatch path.
      </Paragraph>

      <Heading level={2} delay={0.40}>
        Sizing the moving map
      </Heading>

      <Paragraph delay={0.45}>
        Use 300 million registered riders, one million registered drivers, one million daily rides, one
        million daily active riders, and 500,000 daily active drivers. An active driver sends a location
        report every three seconds. These are deliberately round planning numbers, but they reveal the
        central asymmetry. The system handles far more coordinate writes and map refreshes than ride
        requests.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Capacity planning for a ride-hailing core. The continuous GPS stream dominates the write path, while trip records stay comparatively small and durable."
      />

      <StatTiles items={stats} delay={0.05} />

      <Paragraph delay={0.50}>
        A 48-byte location entry is an intentionally padded estimate for a driver ID, coordinates, cell ID,
        availability, sequence number, and timestamp. The raw memory estimate is tiny compared with a
        modern cluster. The hard part is not fitting the latest point. It is updating it quickly, finding
        the right nearby points, expiring bad data, and surviving a node loss while those points keep
        arriving.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        Separate live state from durable state
      </Heading>

      <Paragraph delay={0.60}>
        Think of the system as holding two very different kinds of information. A driver location is useful
        for a few seconds, then it is stale. A completed trip or a charge may be needed months later. They
        should not live in the same database or follow the same rules.
      </Paragraph>

      <SchemaCards tables={schemaTables} delay={0.05} />

      <Paragraph delay={0.65}>
        The live store keeps the latest driver location, availability, vehicle product, and last-seen time.
        It also keeps a second lookup from each spatial cell to the available drivers inside it. This
        second lookup is the shortcut that makes nearby search fast. The durable database keeps the trip,
        fare, payment reference, and audit history. An event log carries changes from both paths to
        analytics, pricing, safety, and recovery systems without slowing the live map.
      </Paragraph>

      <Heading level={2} delay={0.70}>
        The API makes retries safe
      </Heading>

      <Paragraph delay={0.75}>
        Mobile networks drop requests, retry them, and sometimes deliver them late. The server should not
        interpret a retry as a second trip request or a stale GPS report as a driver moving backward in
        time. Location writes include a sequence number and timestamp. Trip creation and lifecycle writes
        use an idempotency key, so the caller can safely retry until it gets a response.
      </Paragraph>

      <ApiEndpointsTable items={apiEndpoints} delay={0.05} />

      <Heading level={2} delay={0.80}>
        A QuadTree is not the hot path
      </Heading>

      <Paragraph delay={0.85}>
        A density-aware QuadTree is a strong choice for a mostly stable catalog. It splits crowded regions
        and makes a radius search inspect a much smaller candidate set. The trouble starts when every
        driver reports a fresh coordinate every few seconds. A cross-cell move can require a remove,
        insert, and occasionally a split or merge. Repeating that structural work on the location firehose
        makes the index work harder than the product.
      </Paragraph>

      <Paragraph delay={0.90}>
        Instead, divide the world into stable cells and use the cell ID as a lookup key. H3 is a useful
        example. It is Uber's open-source hierarchical hexagonal indexing system, but the design only
        needs the general property. Given latitude and longitude, compute a stable cell identifier. Given a
        pickup cell, enumerate its nearby cells. A hexagonal grid gives every ordinary cell six equally
        spaced neighbors, which is a convenient shape for local expansion.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={[
          { id: "gps", label: "Driver GPS ping", icon: Radio, color: "text-blue-500", x: 11, y: 22 },
          { id: "cell", label: "Cell lookup", icon: MapPin, color: "text-teal-500", x: 34, y: 22 },
          { id: "state", label: "Driver state", icon: Car, color: "text-amber-500", x: 58, y: 22 },
          { id: "index", label: "Cell to drivers", icon: Layers, color: "text-emerald-500", x: 84, y: 22 },
          { id: "pickup", label: "Pickup cell", icon: MapPin, color: "text-violet-500", x: 18, y: 70 },
          { id: "ring", label: "Neighbor cells", icon: Search, color: "text-pink-500", x: 45, y: 70 },
          { id: "filter", label: "Eligible drivers", icon: Users, color: "text-cyan-600", x: 71, y: 70 },
        ]}
        edges={[
          { id: "gps-cell", from: "gps", to: "cell" },
          { id: "cell-state", from: "cell", to: "state" },
          { id: "state-index", from: "state", to: "index" },
          { id: "pickup-ring", from: "pickup", to: "ring" },
          { id: "ring-index", from: "ring", to: "index", bidirectional: true },
          { id: "index-filter", from: "index", to: "filter" },
        ]}
        height={440}
        delay={0.05}
        caption="The hot index has two simple views. A driver update refreshes the latest state and cell membership, while a pickup searches its cell and neighboring cells before filtering candidates."
      />

      <Paragraph delay={0.95}>
        Most updates are cheap. If the driver remains in the same cell, overwrite the latest coordinates and
        heartbeat. On a cell crossing, atomically remove the driver from the old cell set and add it to the
        new one. A short time to live protects the index when an app disappears without sending an offline
        event. Dispatch filters out an entry whose heartbeat is too old even if cleanup has not run yet.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        Nearby does not mean best
      </Heading>

      <Paragraph delay={1.05}>
        The index returns candidates, not a winner. First inspect the pickup cell and a small ring of
        neighbors. Then filter by availability, requested vehicle product, account eligibility, and a
        freshness deadline. Straight-line distance is a decent coarse filter, but it is a bad promise. A
        river, a highway, or a one-way street can make a physically close vehicle much slower to reach.
      </Paragraph>

      <Paragraph delay={1.10}>
        The dispatch service asks a routing and estimation service for pickup estimated time of arrival for
        the best few candidates. It can combine that estimate with driver rating, cancellation risk, local
        supply, and fairness constraints. In a dense market, it can briefly collect compatible requests and
        candidates as a small bipartite graph. Choosing the best set of pairs beats greedily claiming the
        closest driver for the first request, because the first local choice can leave the next rider with a
        much worse wait.
      </Paragraph>

      <Heading level={3} delay={1.15}>
        Reserving a driver is the correctness boundary
      </Heading>

      <Paragraph delay={1.20}>
        Imagine two riders requesting a car at the same moment. Both dispatch workers may find the same
        nearby driver. A normal read followed by a later write would let both workers believe that driver
        is free. That is how one driver ends up with two offers.
      </Paragraph>

      <Paragraph delay={1.25}>
        The fix is one atomic reserve step. It checks that the driver is still available and changes the
        state to offer pending in the same operation. The reservation has a short expiry. If the driver
        accepts, the trip saves the assignment. If the driver declines, times out, or disappears, the
        reservation expires and matching can try someone else.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={[
          { id: "request", label: "Ride request", icon: Route, color: "text-blue-500", x: 9, y: 23 },
          { id: "candidates", label: "Nearby candidates", icon: Search, color: "text-teal-500", x: 31, y: 23 },
          { id: "eta", label: "ETA scoring", icon: Timer, color: "text-violet-500", x: 54, y: 23 },
          { id: "reserve", label: "Atomic reserve", icon: ShieldCheck, color: "text-amber-500", x: 78, y: 23 },
          { id: "offer", label: "Driver offer", icon: Bell, color: "text-indigo-500", x: 34, y: 70 },
          { id: "accept", label: "Accept or expire", icon: Car, color: "text-pink-500", x: 59, y: 70 },
          { id: "trip", label: "Durable trip", icon: Database, color: "text-emerald-600", x: 84, y: 70 },
        ]}
        edges={[
          { id: "request-candidates", from: "request", to: "candidates" },
          { id: "candidates-eta", from: "candidates", to: "eta" },
          { id: "eta-reserve", from: "eta", to: "reserve" },
          { id: "reserve-offer", from: "reserve", to: "offer" },
          { id: "offer-accept", from: "offer", to: "accept" },
          { id: "accept-trip", from: "accept", to: "trip" },
        ]}
        height={430}
        delay={0.05}
        caption="Dispatch narrows candidates with the live index, evaluates real arrival time, and reserves one driver before an offer is sent. The reservation prevents double assignment."
      />

      <Heading level={2} delay={1.30}>
        The trip is a durable state machine
      </Heading>

      <Paragraph delay={1.35}>
        Once a driver accepts, the problem changes. This is no longer a quick nearby search. It is a
        record of a real trip that may last an hour while either phone loses signal, an app restarts, or a
        payment provider is slow. The service needs to remember exactly where the trip is and what can
        happen next.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={[
          { id: "requested", label: "Requested", icon: Route, color: "text-blue-500", x: 7, y: 50 },
          { id: "matching", label: "Matching", icon: Search, color: "text-teal-500", x: 24, y: 50 },
          { id: "assigned", label: "Driver assigned", icon: Car, color: "text-violet-500", x: 41, y: 50 },
          { id: "arriving", label: "Driver arriving", icon: MapPin, color: "text-pink-500", x: 58, y: 50 },
          { id: "inTrip", label: "In trip", icon: Users, color: "text-amber-500", x: 75, y: 50 },
          { id: "completed", label: "Completed", icon: ShieldCheck, color: "text-emerald-500", x: 93, y: 50 },
        ]}
        edges={[
          { id: "requested-matching", from: "requested", to: "matching" },
          { id: "matching-assigned", from: "matching", to: "assigned" },
          { id: "assigned-arriving", from: "assigned", to: "arriving" },
          { id: "arriving-inTrip", from: "arriving", to: "inTrip" },
          { id: "inTrip-completed", from: "inTrip", to: "completed" },
        ]}
        height={290}
        delay={0.05}
        caption="A trip moves through a small set of legal states. Cancellation and retry rules depend on the current state, so a late mobile request cannot quietly rewrite the trip."
      />

      <Paragraph delay={1.40}>
        A simple route is requested, matching, driver assigned, driver arriving, in trip, and completed.
        Each change is saved before the system tells other services about it. This prevents a trip from
        looking complete in one place while payment or notifications never hear about it. Downstream
        consumers may receive the same event twice, so they use the trip ID and event ID to ignore repeats.
      </Paragraph>

      <Paragraph delay={1.45}>
        Completing a trip starts payment work in the background. The service charges the rider with an
        idempotency key, credits the driver ledger, and marks the trip settled after the necessary steps
        finish. A timeout retries the same payment operation instead of creating another charge. If one
        later step fails, the system records a reversal or an explicit review state.
      </Paragraph>

      <Heading level={2} delay={1.50}>
        Keeping the map current
      </Heading>

      <Paragraph delay={1.55}>
        The app has two map experiences, and they do not need the same delivery method. Before a ride is
        requested, the rider only needs a rough picture of nearby cars. The app can ask for a small map
        update every few seconds. That request naturally includes drivers who have just entered the area.
      </Paragraph>

      <Paragraph delay={1.60}>
        During an active trip, one car matters a lot more than the rest of the map. The rider and driver
        can keep a persistent WebSocket connection for fresh position and arrival updates. Before either
        view is drawn, the system smooths raw GPS points and rejects delayed reports. A map marker can be a
        little behind. Dispatch must use a recent observed point and a heartbeat limit.
      </Paragraph>

      <Heading level={2} delay={1.65}>
        Putting the design together
      </Heading>

      <Paragraph delay={1.70}>
        The final design separates the location firehose from the trip workflow. Driver pings enter the
        location service, refresh the latest state and live geo index, and publish useful events for
        secondary consumers. A rider request enters the trip service, which asks dispatch for a candidate,
        reserves the driver atomically, and creates a durable workflow when the offer is accepted. Events
        then feed payment, ratings, safety, and analytical systems without making them part of the match.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={finalNodes}
        edges={finalEdges}
        phases={finalPhases}
        height={1000}
        delay={0.05}
        caption="The final design builds from the shared app entry point to live location, dispatch, and the durable trip workflow that drives payment and safety work."
      />

      <Paragraph delay={1.75}>
        Real systems add a lot around this core. Identity, document verification, safety tools, fraud
        checks, taxes, support, incentives, accessibility, and regulatory policy all matter. The useful
        boundary is not pretending that those systems are small. It is keeping them off the few paths that
        must answer in a second while still giving them a reliable stream of durable events to act on.
      </Paragraph>

      <Heading level={2} delay={1.80}>
        Takeaways
      </Heading>

      <List delay={1.85}>
        <ListItem>
          <strong>Optimize for motion.</strong> A live cell index supports cheap coordinate updates and
          nearby lookups without continuously restructuring a spatial tree.
        </ListItem>
        <ListItem>
          <strong>Keep live and durable data apart.</strong> Latest locations can expire and refill, while
          trips and payment records need durable, guarded transitions.
        </ListItem>
        <ListItem>
          <strong>Match on arrival time.</strong> Geometry finds a small candidate set. Routing, eligibility,
          and marketplace policy decide which candidate is actually best.
        </ListItem>
        <ListItem>
          <strong>Reserve before offering.</strong> An atomic state change, not a hopeful read and write,
          prevents one driver from accepting two rides.
        </ListItem>
        <ListItem>
          <strong>Make every retry safe.</strong> Sequence numbers, leases, idempotency keys, and durable
          events turn ordinary mobile failure modes into recoverable work.
        </ListItem>
      </List>

      <Paragraph delay={1.90}>
        A ride-sharing system looks like a map, but its real job is coordinating a moving marketplace. The
        map only works because the system treats a location as fresh but disposable, treats a trip as
        durable, and gives the handoff between them one strict rule. Only one rider gets a driver. Thanks
        for reading.
      </Paragraph>
    </>
  ),
};
