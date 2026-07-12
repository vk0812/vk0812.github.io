import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  InlineCode,
  Formula,
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
  ReplicationDiagram,
  ReplicationPanel,
  QuadTreeDiagram,
  ReverseIndexDiagram,
} from "../components";
import {
  Users,
  Waypoints,
  Route,
  Search,
  MapPin,
  Database,
  GitBranch,
  MessageSquare,
  Star,
  Layers,
  Zap,
  Hash,
  RefreshCw,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Traffic",
    lines: [
      { expression: "100K searches/s × 86,400s", result: "≈ 8.64B searches/day" },
      { expression: "8.64B searches/day × 365 days", result: "≈ 3.15T searches/year" },
      { expression: "500M places × 20% growth", result: "≈ 600M places next year" },
    ],
    note: "Search dominates the workload. Place edits and reviews are much less frequent than reads.",
  },
  {
    title: "Place storage",
    lines: [
      { expression: "500M places × 793 bytes", result: "≈ 396.5 GB raw rows" },
      { expression: "396.5 GB × 3 replicas", result: "≈ 1.19 TB before indexes" },
    ],
    note: "The row estimate includes the fields in the simplified schema, but not database indexes, storage overhead, or photos.",
  },
  {
    title: "Search index",
    lines: [
      { expression: "500M places × 24 bytes", result: "≈ 12 GB for IDs and coordinates" },
      { expression: "500M places ÷ 500 places/leaf", result: "≈ 1M leaf grids" },
      { expression: "1M × 1/3 × 4 × 8 bytes", result: "≈ 10.7 MB internal pointers" },
    ],
    note: "The in-memory index stores only what the proximity lookup needs. Full place details stay in durable storage.",
  },
  {
    title: "Growth",
    lines: [
      { expression: "100K searches/s × 1.2", result: "≈ 120K searches/s next year" },
      { expression: "500M places × 1.2", result: "≈ 600M places next year" },
      { expression: "600M places × 24 bytes", result: "≈ 14.4 GB index payload" },
    ],
    note: "The 20 percent annual growth assumption is useful for capacity planning, not a promise about real traffic.",
  },
];

const stats: StatItem[] = [
  { label: "Search queries per second", value: 100, suffix: "K/s", icon: Search, color: "text-blue-500" },
  { label: "Places in the catalog", value: 500, suffix: "M", icon: MapPin, color: "text-teal-500" },
  { label: "Raw place rows", value: 396.5, suffix: " GB", icon: Database, color: "text-indigo-500" },
  { label: "Coordinate index payload", value: 12, suffix: " GB", icon: Layers, color: "text-amber-500" },
];

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "GET",
    path: "/places/search",
    description:
      "Takes a text query, user coordinates, radius, category filters, sort mode, result limit, and page token. Returns matching places with distance, address, rating, and a thumbnail.",
  },
  {
    method: "GET",
    path: "/places/{place_id}",
    description:
      "Returns the place profile, hours, categories, aggregate rating, address, and photo references. The response can be served from a cache for popular places.",
  },
  {
    method: "POST",
    path: "/places",
    description:
      "Creates a place and publishes an indexing event after the source-of-truth write succeeds. The place may take a short time to appear in search.",
  },
  {
    method: "POST",
    path: "/places/{place_id}/reviews",
    description:
      "Stores a review with text, rating, author, and optional photo references. Rating aggregates and the search projection update asynchronously.",
  },
  {
    method: "DELETE",
    path: "/places/{place_id}",
    description:
      "Soft-deletes a place after authorization and emits an event that removes it from the search index and invalidates cached details.",
  },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "places",
    fields: [
      { name: "place_id", note: "primary key" },
      { name: "name" },
      { name: "latitude" },
      { name: "longitude" },
      { name: "description" },
      { name: "category" },
      { name: "average_rating" },
      { name: "review_count" },
    ],
  },
  {
    name: "reviews",
    fields: [
      { name: "review_id", note: "primary key" },
      { name: "place_id", note: "partition key" },
      { name: "user_id" },
      { name: "review_text" },
      { name: "rating" },
      { name: "created_at" },
    ],
  },
  {
    name: "photos",
    fields: [
      { name: "photo_id", note: "primary key" },
      { name: "place_id", note: "nullable for review photos" },
      { name: "review_id", note: "nullable for place photos" },
      { name: "object_key", note: "pointer into object storage" },
    ],
  },
];

const architectureNodes: DiagramNode[] = [
  { id: "client", label: "Clients", icon: Users, color: "text-slate-500", x: 6, y: 8 },
  { id: "edge", label: "Load Balancer", icon: Waypoints, color: "text-blue-500", x: 23, y: 8 },
  { id: "gateway", label: "API Gateway", icon: Route, color: "text-sky-500", x: 41, y: 8 },
  { id: "search", label: "Search Service", icon: Search, color: "text-violet-500", x: 61, y: 8 },
  { id: "details", label: "Place Service", icon: MapPin, color: "text-teal-500", x: 22, y: 31 },
  { id: "reviews", label: "Review Service", icon: MessageSquare, color: "text-pink-500", x: 43, y: 31 },
  { id: "aggregator", label: "Result Aggregator", icon: GitBranch, color: "text-indigo-500", x: 78, y: 31 },
  { id: "placeDb", label: "Place Database", icon: Database, color: "text-blue-600", x: 22, y: 55 },
  { id: "reviewDb", label: "Review Database", icon: Database, color: "text-fuchsia-600", x: 38, y: 55 },
  { id: "cache", label: "Details Cache", icon: Zap, color: "text-amber-500", x: 56, y: 55 },
  { id: "quadA", label: "QuadTree A", sub: "partition", icon: Layers, color: "text-emerald-500", x: 74, y: 55 },
  { id: "quadB", label: "QuadTree B", sub: "partition", icon: Layers, color: "text-emerald-600", x: 92, y: 55 },
  { id: "indexBuilder", label: "Index Builder", icon: RefreshCw, color: "text-orange-500", x: 63, y: 79 },
  { id: "queue", label: "Event Log", icon: MessageSquare, color: "text-orange-600", x: 43, y: 79 },
  { id: "ranking", label: "Ranking Worker", icon: Star, color: "text-yellow-500", x: 83, y: 79 },
];

const architectureEdges: DiagramEdge[] = [
  { id: "client-edge", from: "client", to: "edge" },
  { id: "edge-gateway", from: "edge", to: "gateway" },
  { id: "gateway-search", from: "gateway", to: "search" },
  { id: "gateway-details", from: "gateway", to: "details" },
  { id: "gateway-reviews", from: "gateway", to: "reviews" },
  { id: "search-aggregator", from: "search", to: "aggregator" },
  { id: "aggregator-quadA", from: "aggregator", to: "quadA", bidirectional: true },
  { id: "aggregator-quadB", from: "aggregator", to: "quadB", bidirectional: true },
  { id: "details-placeDb", from: "details", to: "placeDb", bidirectional: true },
  { id: "details-cache", from: "details", to: "cache", bidirectional: true },
  { id: "reviews-reviewDb", from: "reviews", to: "reviewDb", bidirectional: true },
  { id: "reviewDb-queue", from: "reviewDb", to: "queue" },
  { id: "placeDb-indexBuilder", from: "placeDb", to: "indexBuilder" },
  { id: "reviewDb-ranking", from: "reviewDb", to: "ranking" },
  { id: "indexBuilder-quadA", from: "indexBuilder", to: "quadA" },
  { id: "indexBuilder-quadB", from: "indexBuilder", to: "quadB" },
  { id: "queue-indexBuilder", from: "queue", to: "indexBuilder" },
];

const architecturePhases: DiagramPhase[] = [
  {
    nodeIds: ["client", "edge", "gateway", "search"],
    edgeIds: ["client-edge", "edge-gateway", "gateway-search"],
    note: "Search traffic enters through the load balancer and gateway before reaching the search service.",
  },
  {
    nodeIds: ["client", "edge", "gateway", "search", "details", "reviews"],
    edgeIds: ["client-edge", "edge-gateway", "gateway-search", "gateway-details", "gateway-reviews"],
    note: "Place details and review writes split into separate services at the gateway.",
  },
  {
    nodeIds: ["client", "edge", "gateway", "search", "details", "reviews", "placeDb", "reviewDb", "cache"],
    edgeIds: [
      "client-edge", "edge-gateway", "gateway-search", "gateway-details", "gateway-reviews",
      "details-placeDb", "details-cache", "reviews-reviewDb",
    ],
    note: "Durable databases hold the source records, while a cache keeps popular place details off the database.",
  },
  {
    nodeIds: ["client", "edge", "gateway", "search", "details", "reviews", "aggregator", "placeDb", "reviewDb", "cache", "quadA", "quadB"],
    edgeIds: [
      "client-edge", "edge-gateway", "gateway-search", "gateway-details", "gateway-reviews",
      "search-aggregator", "aggregator-quadA", "aggregator-quadB",
      "details-placeDb", "details-cache", "reviews-reviewDb",
    ],
    note: "The aggregator fans out to replicated QuadTree partitions and merges nearby candidates.",
  },
  {
    nodeIds: ["client", "edge", "gateway", "search", "details", "reviews", "aggregator", "placeDb", "reviewDb", "cache", "quadA", "quadB", "indexBuilder", "queue", "ranking"],
    edgeIds: [
      "client-edge", "edge-gateway", "gateway-search", "gateway-details", "gateway-reviews",
      "search-aggregator", "aggregator-quadA", "aggregator-quadB",
      "details-placeDb", "details-cache", "reviews-reviewDb", "reviewDb-queue",
      "placeDb-indexBuilder", "reviewDb-ranking", "indexBuilder-quadA", "indexBuilder-quadB", "queue-indexBuilder",
    ],
    note: "Events update derived indexes and ranking signals without putting rebuild work on the search path.",
  },
];

const replicationPanels: [ReplicationPanel, ReplicationPanel] = [
  {
    title: "Region routing",
    writeLabel: "Region server",
    fanLabel: "replicates to",
    nodes: ["Secondary", "Secondary"],
    highlightNodes: [0],
    note: "Queries stay local, but a dense city or popular region can overload one shard and require a difficult repartition.",
  },
  {
    title: "Location ID hashing",
    writeLabel: "Hash(Location ID)",
    fanLabel: "routes to",
    nodes: ["Partition 1", "Partition 2"],
    highlightNodes: [0, 1],
    note: "Place counts balance better, but a nearby search becomes scatter and gather across every partition before results are merged.",
  },
];

export const designingYelp: BlogPostData = {
  title: "Designing Yelp",
  date: "July 12, 2026",
  slug: "designing-yelp",
  content: (
    <>
      <Paragraph delay={0.10}>
        Search for a restaurant on Yelp and the answer feels obvious. Type a cuisine, move the map, and a
        list of places appears around you. Underneath that small interaction is a less obvious problem. The
        service needs to search a huge collection of points in two dimensions, filter them by text and category,
        rank them, and still return something useful before the user notices the network.
      </Paragraph>

      <Paragraph delay={0.15}>
        The central design decision is to make the search index match the dominant query. Places do not
        usually move. Users do search, open place pages, and read reviews constantly. That makes this a
        read-heavy proximity service, not a live location tracker.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What is the service?
      </Heading>

      <Paragraph delay={0.25}>
        Given a user's latitude and longitude, return nearby places within a requested radius. The query
        can also contain search terms, a category filter, a maximum result count, and a sort mode. A user
        might ask for the highest-rated coffee shops within five miles, or simply browse all restaurants
        around a map position.
      </Paragraph>

      <List delay={0.30}>
        <ListItem>
          <strong>Place management.</strong> Authorized users can add, update, and delete places.
        </ListItem>
        <ListItem>
          <strong>Discovery.</strong> Users can search nearby places by location, radius, text, and category.
        </ListItem>
        <ListItem>
          <strong>Reviews.</strong> Users can leave text, ratings, and optional photos for a place.
        </ListItem>
        <ListItem>
          <strong>Low latency.</strong> Search should feel real time even when the catalog is very large.
        </ListItem>
        <ListItem>
          <strong>Availability.</strong> A slightly stale rating or listing is better than an unavailable search page.
        </ListItem>
      </List>

      <Paragraph delay={0.35}>
        The word place refers to a business, attraction, theater, or any other point of interest. The
        service has two related paths. A location-based path finds candidate place IDs quickly. A business
        path loads details and reviews. Keeping those paths separate lets the proximity index stay small
        and lets the review system evolve without slowing every location query.
      </Paragraph>

      <Heading level={2} delay={0.40}>
        Sizing the problem
      </Heading>

      <Paragraph delay={0.45}>
        Let's use 500 million places and 100,000 searches per second as the starting point. Assume both
        the catalog and traffic grow by 20 percent each year. These are deliberately broad estimates, but
        they immediately show where the pressure is. Search is the main workload, while adding a place
        is comparatively rare.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Back-of-the-envelope sizing for a proximity service. The coordinate index is much smaller than the full catalog because the search path does not need every place field."
      />

      <StatTiles items={stats} delay={0.05} />

      <Paragraph delay={0.50}>
        The raw place row estimate is not a production storage bill. Real storage also includes indexes,
        replicas, write-ahead logs, row overhead, and historical versions. The useful conclusion is
        simpler. A compact in-memory index containing IDs and coordinates is plausible, but the full
        place record should remain in a durable database.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        The data model follows the read path
      </Heading>

      <Paragraph delay={0.60}>
        The source of truth stores fields needed for place pages and review pages. The proximity index
        stores a smaller projection, usually a place ID and its coordinates, with enough summary data to
        filter or rank candidates. Photos belong in object storage rather than inside a database row. The
        database keeps metadata and an object key.
      </Paragraph>

      <SchemaCards
        tables={schemaTables}
        delay={0.05}
      />

      <Paragraph delay={0.65}>
        A rating is a useful example of the consistency boundary. The review database should durably store
        every rating. An aggregate such as average rating and review count can be recalculated or updated
        asynchronously. Search may show yesterday's aggregate for a short time, but it should not lose a
        review because two systems were forced into one synchronous transaction.
      </Paragraph>

      <Heading level={2} delay={0.70}>
        The API surface
      </Heading>

      <Paragraph delay={0.75}>
        The search endpoint needs both location and intent. Location alone answers what is close. Text,
        category, and sort mode answer what is useful. A page token is preferable to a page number because
        the candidate set is distributed and the result order can change while a user scrolls.
      </Paragraph>

      <ApiEndpointsTable items={apiEndpoints} delay={0.05} />

      <Paragraph delay={0.80}>
        The response should contain enough information to render a result card without immediately making
        another request. That usually means a place ID, name, address, category, distance, rating, review
        count, and a thumbnail reference. The full description, hours, review list, and photo gallery can
        load on the place page.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        Why two latitude indexes are not enough
      </Heading>

      <Paragraph delay={0.90}>
        The tempting first solution is a relational table with separate indexes on latitude and longitude.
        For a point at X and Y with radius D, the query can look for rows where latitude is between X minus D
        and X plus D and longitude is between Y minus D and Y plus D.
      </Paragraph>

      <Paragraph delay={0.95}>
        That rectangle is only an approximation of a circle, so the service must still calculate the true distance
        before returning results. More importantly, two independent indexes produce large candidate lists.
        The database has to intersect those lists and then perform distance checks. With hundreds of
        millions of rows, a query that sounds small can touch far too much data.
      </Paragraph>

      <Paragraph delay={1.00}>
        Spatial databases can do better than this naive query. PostGIS, for example, supports index-assisted
        nearest-neighbor ordering with a GiST or SP-GiST index. A production team could reasonably choose
        that route. It is an important correction to the idea that SQL and geospatial search are inherently
        incompatible. The problem is the pair of independent scalar indexes, not SQL itself.
      </Paragraph>

      <Heading level={2} delay={1.05}>
        Fixed grids improve locality
      </Heading>

      <Paragraph delay={1.10}>
        Divide the map into cells and store each place in the cell containing its coordinates. A request
        can map the user's position to a cell, enumerate nearby cells, and inspect only those candidates.
        The database query now has a compact grid filter in addition to the final distance check.
      </Paragraph>

      <Paragraph delay={1.15}>
        A fixed cell size is easy to implement. If the radius is about the same as one cell, the request
        usually checks the center cell and its eight neighbors. The grid ID can be a hash, a pair of
        integer coordinates, a geohash, or another stable spatial key.
      </Paragraph>

      <Paragraph delay={1.20}>
        The weakness is density. A city center may put thousands of places into one cell, while a desert
        cell has none. Making every cell smaller wastes work in sparse areas. Making every cell larger
        creates an expensive hot cell in dense areas. The map does not distribute businesses uniformly,
        so the index should not assume that it does.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        A dynamic grid with a QuadTree
      </Heading>

      <Paragraph delay={1.30}>
        A QuadTree adapts the cell size to the data. Start with the whole world as one node. When a node
        contains more than a chosen limit, split it into four equal quadrants and redistribute its places.
        Repeat until every leaf contains a manageable number of places. A limit of 500 is a useful
        interview assumption, not a universal constant.
      </Paragraph>

      <Paragraph delay={1.35}>
        The result is a small number of large cells in empty regions and many smaller cells in busy
        regions. The search path starts at the root and follows the child quadrant containing the user's
        coordinates. When it reaches a leaf, it has found the first candidate cell.
      </Paragraph>

      <Formula block delay={1.40}>
        {`\\text{split a node when } \\text{places in node} > 500`}
      </Formula>

      <Paragraph delay={1.45}>
        The first leaf may not contain enough results. The service then expands to adjacent leaves, testing their
        boundaries against the requested radius. A doubly linked list connecting leaf nodes can make local
        iteration convenient. Parent pointers and sibling pointers provide another route. In either case,
        the expansion stops when enough ranked candidates are available, the radius boundary is exhausted, or a
        maximum search budget is reached.
      </Paragraph>

      <QuadTreeDiagram caption="A QuadTree keeps sparse regions large and recursively splits dense regions. Search follows the user's leaf, then checks neighboring leaves when the first cell is not enough." />

      <Paragraph delay={1.50}>
        The final distance check is still necessary. A neighboring cell can intersect the search circle
        while many of its places lie outside it. The QuadTree narrows the candidate set. It does not
        replace geometry.
      </Paragraph>

      <Heading level={3} delay={1.55}>
        Building and updating the tree
      </Heading>

      <Paragraph delay={1.60}>
        A serving node can build its tree by reading the place projection from durable storage or from a
        snapshot in object storage. It inserts each coordinate from the root down. Once a leaf crosses the
        threshold, it creates four children, moves the entries, and updates the leaf-neighbor links.
      </Paragraph>

      <Paragraph delay={1.65}>
        A new place follows the same path. The source database write happens first. An indexing event then
        adds the place to the serving projection. A delete removes it from the source and eventually from
        the tree. Because writes are much rarer than reads and places rarely move, this asynchronous update
        is a good trade. A place can be missing from search for a short interval without making the whole
        service unavailable.
      </Paragraph>

      <Paragraph delay={1.70}>
        A location change is more expensive than a text edit because the place may move to another leaf.
        The index worker removes the old coordinate, inserts the new one, and possibly merges neighboring
        sparse leaves.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Search is a scatter and gather operation
      </Heading>

      <Paragraph delay={1.80}>
        The search service first normalizes the request and asks every relevant index partition for a
        bounded candidate list. Each partition traverses its local QuadTree, expands around the user's
        leaf, applies the radius check, and returns its best candidates. The aggregator merges those lists,
        removes duplicates, applies the final ranking, and returns the page.
      </Paragraph>

      <Paragraph delay={1.85}>
        The index should return more than the requested page size. If the user wants twenty results, asking
        every partition for twenty gives the aggregator enough candidates to produce a good global top
        twenty. The exact fanout depends on the number of partitions and ranking quality. Returning one
        result from each partition would be cheap but often wrong.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={[
          { id: "query", label: "Search request", icon: Search, color: "text-blue-500", x: 12, y: 18 },
          { id: "leaf", label: "User's leaf", icon: MapPin, color: "text-teal-500", x: 35, y: 18 },
          { id: "neighbors", label: "Neighbor leaves", icon: Layers, color: "text-emerald-500", x: 61, y: 18 },
          { id: "distance", label: "Distance filter", icon: Route, color: "text-violet-500", x: 86, y: 18 },
          { id: "candidates", label: "Candidate IDs", icon: Hash, color: "text-indigo-500", x: 35, y: 64 },
          { id: "details", label: "Place details", icon: Database, color: "text-blue-600", x: 61, y: 64 },
          { id: "rank", label: "Rank and return", icon: Star, color: "text-amber-500", x: 86, y: 64 },
        ]}
        edges={[
          { id: "query-leaf", from: "query", to: "leaf" },
          { id: "leaf-neighbors", from: "leaf", to: "neighbors" },
          { id: "neighbors-distance", from: "neighbors", to: "distance" },
          { id: "distance-candidates", from: "distance", to: "candidates" },
          { id: "candidates-details", from: "candidates", to: "details", bidirectional: true },
          { id: "details-rank", from: "details", to: "rank" },
        ]}
        height={430}
        delay={0.05}
        caption="The proximity read path narrows a location to a leaf, expands to nearby leaves, checks exact distance, and only then loads and ranks place details."
      />

      <Heading level={2} delay={1.90}>
        Partitioning the index
      </Heading>

      <Paragraph delay={1.95}>
        Twelve gigabytes for the coordinate payload fits on one modern machine, but a single machine is
        still a failure domain and a traffic ceiling. The index should be partitioned before either limit
        becomes an emergency. There are two straightforward strategies.
      </Paragraph>

      <Heading level={3} delay={2.00}>
        Route by region
      </Heading>

      <Paragraph delay={2.05}>
        Assign each place to a region such as a city, country, or postal area. The region server owns the
        places and index for that area. A local query can often go to one server, which keeps latency and
        network traffic low.
      </Paragraph>

      <Paragraph delay={2.10}>
        The problem is that regions are not equally popular or equally dense. A city center can become a
        hot region even if its geographic area is small. Splitting it into subregions helps, but then the
        routing rules become more complicated. Consistent hashing can spread region IDs across servers and
        make server changes less disruptive, but it does not remove the fact that one popular region may
        receive more queries than others.
      </Paragraph>

      <Heading level={3} delay={2.15}>
        Route by place ID
      </Heading>

      <Paragraph delay={2.20}>
        Hash each place ID and send the record to the resulting partition. This balances the number of
        records well and makes place detail lookups predictable. The downside is the proximity query.
        Nearby places are now scattered across partitions, so the aggregator must query all of them and
        merge the responses.
      </Paragraph>

      <ReplicationDiagram
        panels={replicationPanels}
        delay={0.05}
      />

      <Paragraph delay={2.25}>
        This design starts with place ID partitioning for the in-memory QuadTree fleet. It
        makes storage and repair predictable, and the search aggregator already exists for global ranking.
        If search fanout becomes the bottleneck, geo-sharding or a hybrid strategy becomes attractive.
        Production search engines often use geo-aware shards, inverted text indexes, and a coordinator that
        sends a query only to shards that could contain the requested area.
      </Paragraph>

      <Heading level={2} delay={2.30}>
        Replication and rebuilding
      </Heading>

      <Paragraph delay={2.35}>
        Every index partition gets replicas. Writes go to a primary or index builder, while secondaries
        serve search reads. A secondary can lag by a few seconds and still be useful. If a primary fails,
        a healthy replica takes over. The search service should also use timeouts and return partial results
        rather than waiting forever for a failed partition.
      </Paragraph>

      <Paragraph delay={2.40}>
        A harder case is losing every replica for one partition. Rebuilding by scanning all 500 million
        places and checking the hash is correct but wasteful. Keep a reverse index that maps a partition to
        its place IDs and coordinates. A replacement server can fetch its assignment, rebuild its local
        QuadTree, validate the snapshot, and then join traffic.
      </Paragraph>

      <ReverseIndexDiagram caption="A reverse index maps each QuadTree partition to the place IDs and coordinates it owns, so a replacement server can rebuild one partition without scanning the whole catalog." />

      <Paragraph delay={2.45}>
        That reverse index needs its own durable source and replica. It can be rebuilt from the main place
        database during a disaster, but normal recovery should not depend on a full catalog scan. Snapshots
        in object storage make restart time smaller and give operators a versioned recovery point.
      </Paragraph>

      <Heading level={2} delay={2.50}>
        Reviews, photos, and cache
      </Heading>

      <Paragraph delay={2.55}>
        Reviews have a different access pattern from proximity search. A place page may read many reviews,
        while a map search needs only a rating and count. Keep review text in a review database, cache
        popular place summaries, and store photos in object storage behind a content delivery network.
      </Paragraph>

      <Paragraph delay={2.60}>
        The details cache can use Least Recently Used eviction because a small number of popular places
        usually receive a large share of page reads. Cache entries should include a version or update time.
        When a place changes, publish an invalidation event. If invalidation is delayed, a short time to
        live keeps the stale window bounded.
      </Paragraph>

      <Paragraph delay={2.65}>
        Review writes should not synchronously rebuild every search index. The review service commits the
        review, emits an event, and lets an aggregation worker update average rating, review count, ranking
        features, and caches. This provides eventual consistency where it is safe and strong durability
        where it matters.
      </Paragraph>

      <Heading level={2} delay={2.70}>
        Ranking candidates
      </Heading>

      <Paragraph delay={2.75}>
        Distance is only one signal. A useful result can combine distance, text relevance, category match,
        rating, review count, opening status, freshness, and possibly a user's preferences. The exact score
        should be a separate policy from the QuadTree. The tree answers which places could qualify. Ranking
        decides which qualifying places are useful.
      </Paragraph>

      <Paragraph delay={2.80}>
        If the requested sort is minimum distance, the aggregator can merge candidates by distance. If the
        requested sort is highest rated, each partition can return its top candidates by rating and the
        aggregator can merge those lists. Ranking signals that change often should live in a fast projection
        or search engine rather than forcing a full QuadTree rewrite.
      </Paragraph>

      <Paragraph delay={2.85}>
        Sparse areas need special handling. A radius query should return places within the requested radius,
        even if there are only three. If the product wants at least twenty results, it can explicitly
        expand the radius in stages until it has enough candidates or reaches a maximum. Those are different
        semantics and should not be mixed silently.
      </Paragraph>

      <Heading level={2} delay={2.90}>
        Putting the design together
      </Heading>

      <Paragraph delay={2.95}>
        The final architecture separates the stable catalog from the hot read index. Search requests
        travel through the gateway to the search service. The service fans out to replicated QuadTree
        partitions, gathers candidate IDs, loads the required place projection, and ranks the results.
        Place and review writes go to durable services and update the derived index through events.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={architectureNodes}
        edges={architectureEdges}
        phases={architecturePhases}
        height={820}
        delay={0.05}
        caption="A read-first Yelp design. Durable place and review data produce derived QuadTree partitions, while the search service gathers nearby candidates and ranks them."
      />

      <Paragraph delay={3.00}>
        There is a production-shaped alternative worth naming. Instead of maintaining a custom QuadTree
        service, a team can use a search engine with a geo-point field, an inverted index for text, and
        filters for categories and attributes. Lucene-based engines use spatial structures internally and
        can combine geo filtering with text relevance. That route is often the better choice when search
        behavior is the product and the team does not want to own tree snapshots, neighbor traversal, and
        repair logic.
      </Paragraph>

      <Paragraph delay={3.05}>
        The important invariant survives either implementation. The index is a derived, read-optimized
        view of the catalog. The source of truth remains durable. Search can tolerate a small freshness
        delay, but it cannot afford to scan the entire place table for every request.
      </Paragraph>

      <Heading level={2} delay={3.10}>
        Takeaways
      </Heading>

      <List delay={3.15}>
        <ListItem>
          <strong>Design around search.</strong> The dominant read path should determine the index shape and
          what data is kept in memory.
        </ListItem>
        <ListItem>
          <strong>Use density-aware spatial indexing.</strong> A QuadTree avoids the worst imbalance of a
          fixed grid by splitting crowded areas more aggressively.
        </ListItem>
        <ListItem>
          <strong>Keep the index derived.</strong> Place details, reviews, and photos belong in durable
          systems, while the proximity structure can be rebuilt from snapshots and events.
        </ListItem>
        <ListItem>
          <strong>Prefer availability for reads.</strong> Eventual consistency is acceptable for ratings,
          search projections, and cache entries when it keeps the service responsive.
        </ListItem>
        <ListItem>
          <strong>Separate proximity from ranking.</strong> Finding nearby candidates and deciding which
          candidates are best are related problems, not the same problem.
        </ListItem>
      </List>

      <Paragraph delay={3.20}>
        Yelp looks like a directory with a map on top. The harder part is making geography, text, reviews,
        and ranking cooperate without putting all of them on the critical path. Once the read-heavy nature
        of the product is clear, the rest of the design follows from one idea. Spend the complexity before
        the request arrives, then make the request traverse a small, useful index.
        Thanks for reading.
      </Paragraph>
    </>
  ),
};
