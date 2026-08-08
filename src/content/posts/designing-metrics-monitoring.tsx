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
  CardinalityExplosionDiagram,
  BlockCompactionDiagram,
  AlertPendingFiringDiagram,
} from "../components";
import {
  Archive,
  Bell,
  Database,
  Gauge,
  GitMerge,
  Layers,
  ListTree,
  Route,
  Search,
  Send,
  Server,
  Timer,
  Waypoints,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Ingest volume",
    lines: [
      { expression: "10,000 hosts × 1,000 series per host", result: "= 10M active series" },
      { expression: "10M series ÷ 10 second scrape interval", result: "= 1M samples/s" },
      { expression: "1M samples/s × 86,400 seconds", result: "= 86.4B samples/day" },
    ],
    note: "Ten thousand hosts is a mid-size fleet. The interval matters more than the host count, since a shorter interval multiplies every downstream number.",
  },
  {
    title: "Storage, hot tier",
    lines: [
      { expression: "86.4B samples/day × 2 bytes compressed", result: "≈ 172.8 GB/day" },
      { expression: "172.8 GB/day × 2 day hot retention", result: "≈ 346 GB hot tier" },
    ],
    note: "Two bytes per sample is realistic once delta and XOR encoding squeeze consecutive values, not the eight or more bytes a naive timestamp-value pair would cost.",
  },
  {
    title: "Storage, downsampled tiers",
    lines: [
      { expression: "172.8 GB/day ÷ 30x downsample", result: "≈ 5.76 GB/day equivalent" },
      { expression: "5.76 GB/day equivalent × 395 days", result: "≈ 2.27 TB warm tier" },
    ],
    note: "Thirty times fewer points comes from rolling ten second samples up to five minute buckets. Thirteen months of warm data costs less than four days of raw data.",
  },
  {
    title: "Cardinality risk",
    lines: [
      { expression: "10M safe series (from ingest volume above)", result: "= 10M series" },
      { expression: "10M series × 100,000 values for one unsafe label", result: "= 1 trillion potential series" },
      { expression: "1 trillion series × 8 bytes of series metadata alone", result: "≈ 8 TB just to name them" },
    ],
    note: "This line is not a real workload, it is what happens the day someone adds a raw user id or request id as a label without a limit in place.",
  },
];

const stats: StatItem[] = [
  { label: "Samples ingested", value: 1, suffix: "M/s", icon: Send, color: "text-blue-500" },
  { label: "Active series", value: 10, suffix: "M", icon: Database, color: "text-teal-500" },
  { label: "Hot tier storage", value: 173, suffix: " GB/day", icon: Archive, color: "text-violet-500" },
  { label: "Runaway cardinality risk", value: 1, suffix: "T series", icon: Search, color: "text-rose-500" },
];

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/ingest",
    description:
      "Accepts a batch of compressed samples from an agent or exporter. The gateway validates and writes to the durable stream before acknowledging.",
  },
  {
    method: "GET",
    path: "/query_range",
    description:
      "Evaluates an expression over a time range for one or more series. This is what a dashboard panel calls on every refresh.",
  },
  {
    method: "PUT",
    path: "/alerts/rules/{rule_id}",
    description:
      "Creates or updates an alert rule, including its rolling evaluation window, its threshold, and how long it must hold before firing.",
  },
  {
    method: "POST",
    path: "/alerts/{alert_id}/silence",
    description:
      "Mutes a pending or firing alert for a bounded window without touching the underlying rule, useful during a planned deploy.",
  },
  {
    method: "GET",
    path: "/alerts/active",
    description:
      "Lists every pending and firing alert visible to the caller's team, along with which rule and series triggered each one.",
  },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "sample",
    fields: [
      { name: "metric_name" },
      { name: "labels", note: "key-value set" },
      { name: "timestamp" },
      { name: "value" },
    ],
  },
  {
    name: "series",
    fields: [
      { name: "series_id", note: "hash of name + labels" },
      { name: "metric_name" },
      { name: "labels" },
      { name: "first_seen, last_seen" },
    ],
  },
  {
    name: "histogram_bucket",
    fields: [
      { name: "series_id" },
      { name: "le", note: "bucket upper bound" },
      { name: "timestamp" },
      { name: "cumulative_count" },
    ],
  },
];

const ingestNodes: DiagramNode[] = [
  { id: "host", label: "Host / Service", icon: Server, color: "text-slate-500", x: 10, y: 15 },
  { id: "agent", label: "Local Agent", sub: "buffer, batch, compress", icon: Send, color: "text-blue-500", x: 32, y: 15 },
  { id: "gateway", label: "Ingestion Gateway", icon: Waypoints, color: "text-amber-500", x: 54, y: 15 },
  { id: "stream", label: "Durable Stream", sub: "ordered log", icon: Layers, color: "text-orange-600", x: 78, y: 15 },
  { id: "writer", label: "TSDB Writer", sub: "WAL + head block", icon: Database, color: "text-teal-500", x: 54, y: 45 },
  { id: "blocks", label: "Time Blocks", sub: "series ID × time bucket", icon: Archive, color: "text-violet-500", x: 32, y: 75 },
  { id: "index", label: "Label Index", sub: "inverted postings", icon: ListTree, color: "text-cyan-600", x: 76, y: 75 },
];

const ingestEdges: DiagramEdge[] = [
  { id: "host-agent", from: "host", to: "agent" },
  { id: "agent-gateway", from: "agent", to: "gateway" },
  { id: "gateway-stream", from: "gateway", to: "stream" },
  { id: "stream-writer", from: "stream", to: "writer" },
  { id: "writer-blocks", from: "writer", to: "blocks" },
  { id: "writer-index", from: "writer", to: "index" },
];

const finalNodes: DiagramNode[] = [
  { id: "agent", label: "Local Agent", sub: "buffer, batch, compress", icon: Send, color: "text-blue-500", x: 8, y: 8 },
  { id: "gateway", label: "Ingestion Gateway", icon: Waypoints, color: "text-amber-500", x: 28, y: 8 },
  { id: "stream", label: "Durable Stream", sub: "ordered log", icon: Layers, color: "text-orange-600", x: 48, y: 8 },
  { id: "writer", label: "TSDB Writer", sub: "WAL + head block", icon: Database, color: "text-teal-500", x: 70, y: 8 },
  { id: "compactor", label: "Compactor", sub: "merge + downsample", icon: GitMerge, color: "text-pink-500", x: 28, y: 30 },
  { id: "blocks", label: "Time Blocks", sub: "series ID × time bucket", icon: Archive, color: "text-violet-500", x: 50, y: 30 },
  { id: "index", label: "Label Index", sub: "inverted postings", icon: ListTree, color: "text-cyan-600", x: 72, y: 30 },
  { id: "query", label: "Query Service", icon: Search, color: "text-blue-600", x: 61, y: 54 },
  { id: "dashboard", label: "Dashboard", icon: Gauge, color: "text-emerald-500", x: 35, y: 78 },
  { id: "evaluator", label: "Rule Evaluator", sub: "rolling window", icon: Timer, color: "text-indigo-500", x: 68, y: 78 },
  { id: "router", label: "Alert Router", sub: "dedup, group, silence", icon: Route, color: "text-rose-500", x: 90, y: 78 },
  { id: "notify", label: "Notifications", sub: "email, chat, pager", icon: Bell, color: "text-fuchsia-500", x: 90, y: 97 },
];

const finalEdges: DiagramEdge[] = [
  { id: "agent-gateway", from: "agent", to: "gateway" },
  { id: "gateway-stream", from: "gateway", to: "stream" },
  { id: "stream-writer", from: "stream", to: "writer" },
  { id: "writer-blocks", from: "writer", to: "blocks" },
  { id: "writer-index", from: "writer", to: "index" },
  { id: "compactor-blocks", from: "compactor", to: "blocks", bidirectional: true },
  { id: "query-blocks", from: "query", to: "blocks" },
  { id: "query-index", from: "query", to: "index" },
  { id: "dashboard-query", from: "dashboard", to: "query" },
  { id: "evaluator-query", from: "evaluator", to: "query" },
  { id: "evaluator-router", from: "evaluator", to: "router" },
  { id: "router-notify", from: "router", to: "notify" },
];

const finalPhases: DiagramPhase[] = [
  {
    nodeIds: ["agent", "gateway", "stream", "writer"],
    edgeIds: ["agent-gateway", "gateway-stream", "stream-writer"],
    note: "A local agent buffers and compresses samples before pushing them through a gateway into a durable, ordered stream.",
  },
  {
    nodeIds: ["agent", "gateway", "stream", "writer", "compactor", "blocks", "index"],
    edgeIds: ["agent-gateway", "gateway-stream", "stream-writer", "writer-blocks", "writer-index", "compactor-blocks"],
    note: "The time-series database writes to a log, flushes immutable blocks, compacts them in the background, and keeps a label index alongside.",
    highlight: ["blocks", "index", "compactor"],
  },
  {
    nodeIds: ["agent", "gateway", "stream", "writer", "compactor", "blocks", "index", "query", "dashboard"],
    edgeIds: [
      "agent-gateway", "gateway-stream", "stream-writer", "writer-blocks", "writer-index", "compactor-blocks",
      "query-blocks", "query-index", "dashboard-query",
    ],
    note: "A query service fans a dashboard's request out across whichever blocks and series the label index points to, then merges the results.",
    highlight: ["query", "dashboard"],
  },
  {
    nodeIds: ["agent", "gateway", "stream", "writer", "compactor", "blocks", "index", "query", "dashboard", "evaluator"],
    edgeIds: [
      "agent-gateway", "gateway-stream", "stream-writer", "writer-blocks", "writer-index", "compactor-blocks",
      "query-blocks", "query-index", "dashboard-query", "evaluator-query",
    ],
    note: "A rule evaluator runs the same kind of query on a fixed schedule, watching a rolling window for a condition that holds.",
    highlight: ["evaluator"],
  },
  {
    nodeIds: ["agent", "gateway", "stream", "writer", "compactor", "blocks", "index", "query", "dashboard", "evaluator", "router", "notify"],
    edgeIds: [
      "agent-gateway", "gateway-stream", "stream-writer", "writer-blocks", "writer-index", "compactor-blocks",
      "query-blocks", "query-index", "dashboard-query", "evaluator-query", "evaluator-router", "router-notify",
    ],
    note: "A firing alert passes through Alertmanager-style routing, which deduplicates and groups it before one notification goes out.",
    highlight: ["router", "notify"],
  },
];

export const designingMetricsMonitoring: BlogPostData = {
  title: "Designing a Metrics Monitoring Platform",
  date: "August 3, 2026",
  slug: "designing-metrics-monitoring",
  content: (
    <>
      <Paragraph delay={0.10}>
        A single host reporting CPU, memory, and request counts every ten seconds is nothing. Ten thousand hosts
        doing the same thing is a million data points a second, arriving forever, from machines that occasionally
        drop off the network mid-sentence. The system has to swallow all of it, keep years of history queryable,
        and notice within a minute when something is actually broken.
      </Paragraph>

      <Paragraph delay={0.15}>
        The interesting part is not the writing or the reading on their own. It is that a single careless choice,
        one label with no natural limit, can turn a tidy handful of metrics into more time series than the
        database has ever seen, and that the alerting on top of all of it has to stay calm about single noisy
        samples while still paging someone the moment a real problem holds steady.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What has to be true
      </Heading>

      <List delay={0.25}>
        <ListItem>
          <strong>Absorb a huge, steady write rate.</strong> Every host and service in the fleet is emitting
          samples continuously, and a slow ingestion path becomes the outage instead of just reporting one.
        </ListItem>
        <ListItem>
          <strong>Identify a series precisely.</strong> A metric name alone is not enough. The same name with a
          different set of labels is a completely different time series with its own storage and its own history.
        </ListItem>
        <ListItem>
          <strong>Answer both narrow and wide queries fast.</strong> A single dashboard panel over the last hour
          and a capacity report over the last year both have to come back before anyone loses patience.
        </ListItem>
        <ListItem>
          <strong>Never let cardinality run away.</strong> One label with unbounded values has to be caught and
          contained before it multiplies a manageable metric into an operational emergency.
        </ListItem>
        <ListItem>
          <strong>Alert on sustained problems, not single samples.</strong> A rule needs a real condition held
          over real time before anyone gets paged, and that notification has to survive the monitoring system's
          own bad day.
        </ListItem>
      </List>

      <Heading level={2} delay={0.30}>
        Sizing the flood
      </Heading>

      <Paragraph delay={0.35}>
        Start from one assumption, <strong>10,000 hosts each reporting 1,000 active time series on a ten second
        interval</strong>. Everything else, the write rate, the daily storage, and the danger a single bad label
        represents, follows from that one number.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Planning numbers for a monitoring platform. The ingest volume is steady and predictable, while the cardinality risk group shows what one unbounded label does to that same fleet."
      />

      <StatTiles items={stats} delay={0.05} />

      <Heading level={2} delay={0.40}>
        The shape of a metric
      </Heading>

      <Paragraph delay={0.45}>
        Almost everything a service reports is one of three shapes. A <strong>counter</strong> only ever goes up,
        like the total number of requests handled, and a dashboard usually cares about its rate of change rather
        than its raw value. A gauge is a point-in-time reading that can go up or down, like memory
        currently in use or the number of open connections. A histogram tracks a distribution by
        counting how many observations fell into each of several buckets, which is how a system reports request
        latency without storing every single request's exact duration.
      </Paragraph>

      <Paragraph delay={0.50}>
        A single incoming value is a <InlineCode>sample</InlineCode>, tagged with a metric name, a full set of
        labels, and a timestamp. Every distinct combination of name and labels gets its own <InlineCode>series</InlineCode>{" "}
        record so the storage layer can find and update it without re-deriving that identity on every write. A
        histogram is really several series at once, one counter per bucket boundary, which is why its schema keeps
        a separate row per bucket rather than trying to cram a distribution into one value.
      </Paragraph>

      <SchemaCards tables={schemaTables} delay={0.05} />

      <Heading level={2} delay={0.55}>
        The public surface
      </Heading>

      <Paragraph delay={0.60}>
        Almost every byte flowing into the system arrives through one ingestion endpoint, batched and compressed.
        Almost every byte flowing out answers either a dashboard's range query or a request about which alerts are
        currently active. The alert rule endpoints are comparatively rare calls that configure behavior rather
        than move data.
      </Paragraph>

      <ApiEndpointsTable items={apiEndpoints} delay={0.05} />

      <Heading level={2} delay={0.65}>
        Getting samples off the host
      </Heading>

      <Paragraph delay={0.70}>
        There are two ways a sample gets from where it was generated to where it is stored. In a <strong>push</strong>{" "}
        model, the host or process actively sends its samples outward on its own schedule. In a pull
        model, a central server keeps a list of known targets and reaches out to each one on a schedule, reading
        whatever the target currently reports.
      </Paragraph>

      <Paragraph delay={0.75}>
        Pull fits long-lived services well. The server already knows who should exist from its service discovery,
        so a target that stops answering scrapes is itself a useful signal that something is wrong, without any
        extra code. Push fits everything a pull server cannot reach on its own schedule, a batch job that finishes
        and exits before a scrape would ever land, a device behind a firewall that cannot accept inbound
        connections, or a mobile client that is offline half the time. Most real platforms end up running both,
        pulling from the steady fleet and accepting pushes from everything short-lived or unreachable.
      </Paragraph>

      <Paragraph delay={0.80}>
        Either way, a small local agent usually sits between the application and the network. It keeps samples in
        an in-memory buffer, batches many of them into one outbound request instead of opening a connection per
        sample, and compresses the batch before it goes over the wire. If the network blips for a few seconds, the
        buffer just holds the backlog and sends it once the connection returns, dropping the oldest data only if
        the outage runs long enough to fill the buffer. None of this should ever block the application thread that
        is trying to emit a metric. A monitoring pipe that can slow down the very thing it is watching has failed
        at its one job.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        One gateway, one durable log
      </Heading>

      <Paragraph delay={0.90}>
        Every batch, whether pushed by an agent or pulled by a scraper, lands on an ingestion gateway first. The
        gateway does the cheap validation, checks who the sender is, and hands accepted samples to a durable,
        ordered stream rather than writing straight into the database. That stream is the buffer that lets the
        database fall behind for a few seconds during a write spike without losing anything, and it is what lets a
        crashed database writer restart and resume from exactly where it left off.
      </Paragraph>

      <Paragraph delay={0.95}>
        A series is identified by its metric name plus its complete, sorted set of label key-value pairs, not by
        name alone. <InlineCode>http_requests_total</InlineCode> with <InlineCode>service=checkout</InlineCode>{" "}
        is a different series from the same metric name with <InlineCode>service=search</InlineCode>, each with its
        own storage and its own history. The gateway or the writer computes a stable hash of that full label set
        once, and every later write for the same combination resolves to the same series without a lookup by name
        alone.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        Inside the time-series database
      </Heading>

      <Paragraph delay={1.05}>
        A write only counts once it survives a crash, so every sample first lands in a write-ahead log, appended
        and flushed to disk before the write is acknowledged. At the same time, the sample also lands in an
        in-memory <InlineCode>head block</InlineCode>, the current shard's open window of recent data, which is
        what makes the most common query, the last few minutes of a series, fast to answer without touching disk
        at all.
      </Paragraph>

      <Paragraph delay={1.10}>
        Once a head block's window closes, typically a couple of hours, it gets flushed to disk as an{" "}
        <strong>immutable block</strong>. Nothing in an already-written block ever changes in place again. A
        background compactor later merges several adjacent small blocks into one larger block, which matters
        because a query that has to open a thousand tiny files is slower than one that opens a handful of big
        ones, and a bigger block also compresses better since there is more repeated structure for it to exploit.
      </Paragraph>

      <BlockCompactionDiagram
        delay={0.05}
        caption="Every sample is durable in a write-ahead log before it is acknowledged. Small flushed blocks later get compacted into one, then aged into a coarser downsampled copy."
      />

      <Heading level={2} delay={1.15}>
        Finding a series without scanning everything
      </Heading>

      <Paragraph delay={1.20}>
        Blocks are partitioned two ways at once, by series ID and by time bucket. Partitioning by series keeps
        every write for one series on the same shard, so appending a new sample never has to coordinate across the
        cluster. Partitioning by time means an entire block can be deleted or moved to cheaper storage as a whole
        unit once it ages out of a tier, instead of deleting individual rows out of a much bigger structure.
      </Paragraph>

      <Paragraph delay={1.25}>
        Finding which series match a query like <InlineCode>service=checkout</InlineCode> still needs an index,
        since scanning every series' full label set on every query would be far too slow. An{" "}
        <strong>inverted label index</strong> keeps, for every label value, a sorted list of the series IDs that
        carry it, the same idea a search engine uses to find documents containing a word. A query with several
        label filters intersects a few of those lists to get a short, exact set of matching series before it ever
        touches a block.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={ingestNodes}
        edges={ingestEdges}
        height={480}
        delay={0.05}
        caption="The full write path. Every sample survives a durable log and a write-ahead log before it becomes part of a partitioned, indexed block."
      />

      <Heading level={2} delay={1.30}>
        The cardinality explosion
      </Heading>

      <Paragraph delay={1.35}>
        A metric's cardinality is the number of distinct series it produces once every label combination is
        counted. Twelve services, forty endpoints, and five status codes on one metric is 2,400 series, easily
        manageable. The moment someone adds a label that carries a raw user id, a request id, or an unprocessed
        URL path, cardinality stops being bounded by anything the schema controls. Every distinct value of that
        label, and there could be millions of them, creates a brand new series with its own entry in the
        in-memory head block and the label index.
      </Paragraph>

      <Paragraph delay={1.40}>
        This is not a slow leak. It can happen inside a single deploy, and every one of those new series consumes
        real memory in the write path and real space in the index, whether or not anyone ever queries it. A
        database that comfortably held ten million series can be pushed toward a hundred million within minutes
        by one bad label choice, and the resulting memory pressure and slower index lookups hit every tenant
        sharing that cluster, not just the one that caused it.
      </Paragraph>

      <CardinalityExplosionDiagram
        delay={0.05}
        caption="Twelve services, forty endpoints, and five status codes stay at a manageable 2,400 series. Adding one unbounded label multiplies that into the hundreds of millions."
      />

      <Heading level={2} delay={1.45}>
        Admission control before the database notices
      </Heading>

      <Paragraph delay={1.50}>
        Because a cardinality explosion can happen faster than a human can react, the defense has to be automatic
        and sit in front of the database rather than behind it.
      </Paragraph>

      <List delay={1.55}>
        <ListItem>
          <strong>Per-tenant series quotas.</strong> Each team or service gets a cap on total active series, so
          one bad metric degrades that team's own visibility rather than every tenant sharing the cluster.
        </ListItem>
        <ListItem>
          <strong>Per-label cardinality limits.</strong> A single label is allowed only so many distinct values
          before new ones are rejected outright, catching the problem at the label that caused it.
        </ListItem>
        <ListItem>
          <strong>Pattern-based rejection.</strong> A gateway can refuse a label value that looks like a UUID, a
          raw numeric ID, or a URL with a path parameter still embedded in it, before it ever creates a series.
        </ListItem>
        <ListItem>
          <strong>Explicit label allowlists.</strong> Some platforms require every label name to be registered
          ahead of time, turning an accidental high-cardinality label into a rejected write instead of a silent
          explosion.
        </ListItem>
        <ListItem>
          <strong>Fail loud, not quiet.</strong> A rejected write should return a clear error to the sender, not
          silently drop the sample, so the mistake gets fixed at the source instead of discovered during an
          incident.
        </ListItem>
      </List>

      <Heading level={2} delay={1.60}>
        Hot, warm, and cold
      </Heading>

      <Paragraph delay={1.65}>
        Not every sample needs to stay at full resolution forever, and keeping years of ten-second data around
        would be an enormous and mostly wasted expense. A hot tier keeps raw resolution on fast
        storage for a couple of days, since that is the data live dashboards and active alert rules actually
        touch. A warm tier keeps coarser rollups, often five-minute or one-minute aggregates, for
        weeks or months on cheaper storage. A cold tier keeps hourly or daily aggregates for
        years, cheap enough that long-range capacity planning does not need its own separate budget.
      </Paragraph>

      <Paragraph delay={1.70}>
        Downsampling itself just means storing fewer, coarser points as data ages instead of the full stream, and
        the block compaction figure above already shows where that step sits, right after blocks get merged. The
        same idea applies to dashboards directly. A recording rule periodically evaluates a common, expensive
        expression, like an error rate computed from two other counters, and stores the result as its own series.
        A dashboard built on that recorded series loads instantly instead of recomputing a heavy aggregation over
        millions of raw points on every single refresh.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Answering a query across a sprawling cluster
      </Heading>

      <Paragraph delay={1.80}>
        A dashboard query names a metric, a set of label filters, and a time range. The query service first uses
        the inverted label index to resolve the filters down to an exact list of matching series IDs, then has to
        fan out to read data for those series, since the matching series and the requested time range can each
        span several partitions.
      </Paragraph>

      <Paragraph delay={1.85}>
        Each partition returns its slice of the matching series, and the query service stitches those slices back
        into one continuous series per match, applying any aggregation like <InlineCode>sum</InlineCode> or{" "}
        <InlineCode>avg</InlineCode> across series afterward. If one shard is slow or briefly unreachable, the
        query service returns the rest of the graph clearly marked as partial rather than failing the whole
        request, since a mostly-complete dashboard is far more useful than a blank one.
      </Paragraph>

      <Heading level={2} delay={1.90}>
        Evaluating an alert rule
      </Heading>

      <Paragraph delay={1.95}>
        An alert rule is really just a query that runs on a schedule instead of when someone opens a dashboard.
        "Error rate over the last five minutes exceeds one percent" gets evaluated every thirty seconds or so, and
        because the window is rolling rather than fixed to the clock, each evaluation looks at a fresh slice, the
        five minutes ending right now, not five minutes tied to a calendar boundary.
      </Paragraph>

      <Paragraph delay={2.00}>
        If a rule fired the instant one evaluation crossed the threshold, a single noisy sample would page someone
        for nothing. Instead, the first violating evaluation only moves the rule into a <InlineCode>pending</InlineCode>{" "}
        state. If a later evaluation comes back clean, the rule drops right back to inactive, that first violation
        is treated as noise. Only once the condition has held continuously for a configured hold time, several
        evaluations in a row, does the rule move to <InlineCode>firing</InlineCode> and an actual notification goes
        out.
      </Paragraph>

      <AlertPendingFiringDiagram
        delay={0.05}
        caption="One bad evaluation only moves a rule to pending. Three straight violating evaluations are what finally push it to firing and send a notification."
      />

      <Heading level={2} delay={2.05}>
        From one condition to one page
      </Heading>

      <Paragraph delay={2.10}>
        A firing alert is not yet a notification, it still passes through a routing layer, often described the
        way Prometheus's Alertmanager works.
      </Paragraph>

      <List delay={2.15}>
        <ListItem>
          <strong>Deduplicate.</strong> Alerts that fire from redundant evaluator replicas around the same moment
          get collapsed by their label fingerprint before anything is sent.
        </ListItem>
        <ListItem>
          <strong>Group.</strong> Related alerts, like the same rule tripping on every shard of one service, get
          bundled into a single notification instead of one page per shard.
        </ListItem>
        <ListItem>
          <strong>Silence.</strong> An on-call engineer can mute a known issue for a bounded window without
          touching the rule itself, useful during a planned deploy.
        </ListItem>
        <ListItem>
          <strong>Inhibit.</strong> A higher-priority alert can suppress a wave of lower-priority alerts it
          already implies, like a hundred single-host alerts once a whole-datacenter alert is already firing.
        </ListItem>
        <ListItem>
          <strong>Route.</strong> Whatever survives all of that gets sent to the right team, channel, and
          escalation policy based on its labels. Turning that route into an actual email, chat message, or page
          is a separate concern downstream of this system.
        </ListItem>
      </List>

      <Heading level={2} delay={2.20}>
        Staying up when everything else is on fire
      </Heading>

      <Paragraph delay={2.25}>
        A monitoring platform's job is to keep working precisely when everything around it is having a bad day, so
        it cannot inherit its dependencies' fate. Ingestion gateways and database writers run as multiple
        replicas behind a load balancer, and the durable stream means a replacement writer resumes exactly where a
        crashed one stopped instead of losing the last few seconds of data.
      </Paragraph>

      <Paragraph delay={2.30}>
        Rule evaluation typically runs on more than one replica evaluating the same rules independently, so one
        evaluator crashing mid-incident does not blind on-call. Running the same rule twice does mean the same
        alert can fire twice, which is exactly what the deduplication step above exists to collapse back into one
        notification. Deploying the monitoring stack in a different failure domain than the systems it watches,
        a separate region, cluster, or power path, is what keeps the tool for seeing an incident from going dark
        during that same incident.
      </Paragraph>

      <Heading level={2} delay={2.35}>
        Putting the design together
      </Heading>

      <Paragraph delay={2.40}>
        Every piece above fits into one pipeline, an ingestion path that never blocks the systems it watches, a
        storage layer built around durability and cheap deletion by time, a query path that fans out and merges
        back, and an alerting path that waits for a sustained problem before routing anything to a human.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={finalNodes}
        edges={finalEdges}
        phases={finalPhases}
        height={820}
        delay={0.05}
        caption="The full metrics platform, from a buffering local agent through durable storage, fan-out queries, rolling-window rule evaluation, and Alertmanager-style routing."
      />

      <Heading level={2} delay={2.45}>
        Takeaways
      </Heading>

      <List delay={2.50}>
        <ListItem>
          <strong>A series is a name plus its full label set.</strong> Two samples with the same metric name and
          different labels are different series with entirely separate storage and history.
        </ListItem>
        <ListItem>
          <strong>Cardinality is the real danger, not raw write volume.</strong> One unbounded label can multiply
          a manageable metric into an emergency faster than any human can react, so admission control has to be
          automatic.
        </ListItem>
        <ListItem>
          <strong>Immutability makes storage tractable.</strong> Write-ahead logs, immutable blocks, and
          background compaction turn a relentless write stream into a small number of large, well-compressed
          files that are cheap to query and cheap to delete by age.
        </ListItem>
        <ListItem>
          <strong>Pending before firing is the whole point of alerting.</strong> A rule that reacts to one sample
          pages people for noise. A rule that requires a sustained condition earns its interruption.
        </ListItem>
        <ListItem>
          <strong>The monitoring system has to outlive the incident it is watching.</strong> Redundant evaluators,
          a durable ingestion path, and a separate failure domain all exist so the tool used to see a problem does
          not disappear along with everything else.
        </ListItem>
      </List>

      <Paragraph delay={2.55}>
        None of this is really about metrics themselves, counters and gauges are simple. It is about building a
        system that stays fast and honest under a write load that never lets up, stays affordable across years of
        history nobody looks at most days, and stays quiet until the moment it genuinely should not be. Thanks for
        reading.
      </Paragraph>
    </>
  ),
};
