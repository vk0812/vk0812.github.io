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
  ReplicationDiagram,
  ReplicationPanel,
  LateClickWindowDiagram,
  HotAdSaltingDiagram,
} from "../components";
import {
  Archive,
  Boxes,
  Cpu,
  Database,
  ExternalLink,
  HardDrive,
  Layers,
  LineChart,
  MousePointerClick,
  Radio,
  RotateCcw,
  Save,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Click traffic",
    lines: [
      { expression: "100M clicks/day ÷ 86,400 seconds", result: "≈ 1.16K clicks/s average" },
      { expression: "1.16K clicks/s × 8 peak multiplier", result: "≈ 9.3K clicks/s peak" },
    ],
    note: "Clicks are spiky around business hours and big campaigns, so the peak matters far more than the daily average.",
  },
  {
    title: "Raw event storage",
    lines: [
      { expression: "100M clicks/day × 500 bytes/click", result: "= 50 GB/day raw" },
      { expression: "50 GB/day × 30 days retention", result: "= 1.5 TB in object storage" },
    ],
    note: "Every click is kept exactly as it happened. Object storage is cheap enough that this is a rounding error next to the compute it protects.",
  },
  {
    title: "Aggregate rows",
    lines: [
      { expression: "1M active ads × 1 row/minute (worst case)", result: "= 1M minute-rows/minute" },
      { expression: "1M rows/minute × 1,440 minutes/day", result: "= 1.44B minute-rows/day" },
    ],
    note: "This assumes every active ad gets at least one click every single minute, an intentional worst case for sizing the columnar store.",
  },
  {
    title: "Rollup compression",
    lines: [
      { expression: "1.44B minute-rows/day ÷ 60", result: "= 24M hourly rows/day" },
      { expression: "24M hourly rows/day ÷ 24", result: "= 1M daily rows/day" },
    ],
    note: "Each rollup level is an order of magnitude smaller than the one below it, which is exactly why dashboards querying a month of data stay fast.",
  },
];

const stats: StatItem[] = [
  { label: "Peak clicks", value: 9, suffix: "K/s", icon: Zap, color: "text-amber-500" },
  { label: "Raw events", value: 50, suffix: " GB/day", icon: HardDrive, color: "text-blue-500" },
  { label: "30-day retention", value: 1500, suffix: " GB", icon: Archive, color: "text-violet-500" },
  { label: "Minute rows", value: 1440, suffix: "M/day", icon: Database, color: "text-teal-500" },
];

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/impressions",
    description:
      "Called by the ad server the moment an ad is rendered. Mints a signed impression token that ties an ad ID, a placement, and a timestamp together.",
  },
  {
    method: "GET",
    path: "/r/{impression_token}",
    description:
      "The click redirect endpoint. Validates the signature, records the click if it hasn't been seen before, then redirects to the advertiser's page.",
  },
  {
    method: "GET",
    path: "/ads/{ad_id}/metrics",
    description:
      "Minute, hour, or day windowed click counts for an advertiser dashboard, served from the fast streaming aggregates.",
  },
  {
    method: "GET",
    path: "/ads/{ad_id}/metrics/reconciled",
    description:
      "The same windows after the daily batch job has recomputed them from raw events and corrected any drift.",
  },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "click_events",
    fields: [
      { name: "event_id", note: "primary key" },
      { name: "impression_token", note: "unique, used for dedup" },
      { name: "ad_id" },
      { name: "event_time", note: "when the click happened" },
      { name: "received_time", note: "when the pipeline saw it" },
    ],
  },
  {
    name: "ad_click_minute",
    fields: [
      { name: "ad_id, window_start", note: "composite primary key" },
      { name: "click_count" },
      { name: "updated_at" },
    ],
  },
  {
    name: "ad_click_daily",
    fields: [
      { name: "ad_id, day", note: "composite primary key" },
      { name: "click_count" },
      { name: "source", note: "streaming or reconciled" },
    ],
  },
  {
    name: "reconciliation_runs",
    fields: [
      { name: "run_id", note: "primary key" },
      { name: "day" },
      { name: "streaming_total" },
      { name: "batch_total" },
      { name: "delta" },
    ],
  },
];

const ingestNodes: DiagramNode[] = [
  { id: "adServer", label: "Ad Server", sub: "mints a signed token", icon: Radio, color: "text-slate-500", x: 12, y: 25 },
  { id: "browser", label: "Browser", icon: Users, color: "text-blue-500", x: 38, y: 25 },
  { id: "redirect", label: "Redirect Service", sub: "validates, dedups", icon: MousePointerClick, color: "text-rose-500", x: 65, y: 25 },
  { id: "advertiser", label: "Advertiser Site", icon: ExternalLink, color: "text-emerald-500", x: 90, y: 25 },
  { id: "stream", label: "Ingestion Stream", sub: "Kafka or Kinesis", icon: Layers, color: "text-amber-500", x: 65, y: 75 },
];

const ingestEdges: DiagramEdge[] = [
  { id: "ad-browser", from: "adServer", to: "browser" },
  { id: "browser-redirect", from: "browser", to: "redirect" },
  { id: "redirect-advertiser", from: "redirect", to: "advertiser" },
  { id: "redirect-stream", from: "redirect", to: "stream" },
];

const replicationPanels: [ReplicationPanel, ReplicationPanel] = [
  {
    title: "Fast streaming path",
    writeLabel: "Click lands on the ingestion stream",
    fanLabel: "windowed by the stream processor",
    nodes: ["Minute row written", "Visible in under a minute"],
    note: "Trades perfect correctness for speed. A click just past its grace period or a merge that runs before every salted partition reports in can leave this number slightly off.",
  },
  {
    title: "Slower batch path",
    writeLabel: "Raw events read from object storage",
    fanLabel: "the full day recomputed from scratch",
    nodes: ["Audited daily total", "Streaming numbers corrected if they drifted"],
    note: "No grace period, no salting, no shortcuts. Every event for the day gets read once and counted exactly once, hours later.",
  },
];

const finalNodes: DiagramNode[] = [
  { id: "user", label: "Browser", icon: Users, color: "text-slate-500", x: 8, y: 10 },
  { id: "redirect", label: "Redirect Service", icon: MousePointerClick, color: "text-rose-500", x: 30, y: 10 },
  { id: "kafka", label: "Ingestion Stream", sub: "Kafka or Kinesis", icon: Layers, color: "text-amber-500", x: 56, y: 10 },
  { id: "archiver", label: "Archiver", icon: Boxes, color: "text-orange-500", x: 30, y: 35 },
  { id: "flink", label: "Stream Processor", sub: "stateful, windowed", icon: Cpu, color: "text-blue-500", x: 56, y: 35 },
  { id: "checkpoint", label: "Checkpoint Store", sub: "durable state snapshots", icon: Save, color: "text-indigo-500", x: 80, y: 35 },
  { id: "objectStore", label: "Raw Event Store", sub: "immutable, replayable", icon: HardDrive, color: "text-violet-500", x: 10, y: 60 },
  { id: "olap", label: "OLAP Store", sub: "minute rows", icon: Database, color: "text-teal-500", x: 34, y: 60 },
  { id: "rollup", label: "Rollup Job", sub: "hourly and daily", icon: TrendingUp, color: "text-emerald-500", x: 56, y: 60 },
  { id: "dashboard", label: "Advertiser Dashboard", icon: LineChart, color: "text-cyan-600", x: 80, y: 60 },
  { id: "batchJob", label: "Reconciliation Job", sub: "recomputes truth", icon: RotateCcw, color: "text-pink-500", x: 10, y: 85 },
];

const finalEdges: DiagramEdge[] = [
  { id: "user-redirect", from: "user", to: "redirect" },
  { id: "redirect-kafka", from: "redirect", to: "kafka" },
  { id: "kafka-flink", from: "kafka", to: "flink" },
  { id: "kafka-archiver", from: "kafka", to: "archiver" },
  { id: "flink-checkpoint", from: "flink", to: "checkpoint", bidirectional: true },
  { id: "flink-olap", from: "flink", to: "olap" },
  { id: "olap-rollup", from: "olap", to: "rollup" },
  { id: "rollup-dashboard", from: "rollup", to: "dashboard" },
  { id: "archiver-objectStore", from: "archiver", to: "objectStore" },
  { id: "objectStore-batchJob", from: "objectStore", to: "batchJob" },
  { id: "batchJob-olap", from: "batchJob", to: "olap" },
];

const finalPhases: DiagramPhase[] = [
  {
    nodeIds: ["user", "redirect", "kafka"],
    edgeIds: ["user-redirect", "redirect-kafka"],
    note: "A click hits the redirect service first. It validates the signed token and appends the event to a durable stream before it does anything else.",
  },
  {
    nodeIds: ["user", "redirect", "kafka", "flink", "checkpoint"],
    edgeIds: ["user-redirect", "redirect-kafka", "kafka-flink", "flink-checkpoint"],
    note: "The stream processor keeps a running count per ad and per window in memory, checkpointing that state regularly so a restart doesn't lose progress.",
    highlight: ["flink", "checkpoint"],
  },
  {
    nodeIds: ["user", "redirect", "kafka", "flink", "checkpoint", "olap", "rollup", "dashboard"],
    edgeIds: ["user-redirect", "redirect-kafka", "kafka-flink", "flink-checkpoint", "flink-olap", "olap-rollup", "rollup-dashboard"],
    note: "Finished windows land as rows in a columnar store, queryable within a minute, then roll up into hourly and daily numbers for the dashboard.",
    highlight: ["olap", "rollup", "dashboard"],
  },
  {
    nodeIds: ["user", "redirect", "kafka", "flink", "checkpoint", "olap", "rollup", "dashboard", "archiver", "objectStore"],
    edgeIds: [
      "user-redirect",
      "redirect-kafka",
      "kafka-flink",
      "flink-checkpoint",
      "flink-olap",
      "olap-rollup",
      "rollup-dashboard",
      "kafka-archiver",
      "archiver-objectStore",
    ],
    note: "The same stream is archived untouched to object storage, so the full click history can be replayed if anything downstream ever needs rebuilding.",
    highlight: ["archiver", "objectStore"],
  },
  {
    nodeIds: ["user", "redirect", "kafka", "flink", "checkpoint", "olap", "rollup", "dashboard", "archiver", "objectStore", "batchJob"],
    edgeIds: [
      "user-redirect",
      "redirect-kafka",
      "kafka-flink",
      "flink-checkpoint",
      "flink-olap",
      "olap-rollup",
      "rollup-dashboard",
      "kafka-archiver",
      "archiver-objectStore",
      "objectStore-batchJob",
      "batchJob-olap",
    ],
    note: "A slower batch job periodically recomputes the true counts from raw events and reconciles any drift left behind by the fast path.",
    highlight: ["batchJob"],
  },
];

export const designingAdClickAggregator: BlogPostData = {
  title: "Designing an Ad Click Aggregator",
  date: "August 4, 2026",
  slug: "designing-ad-click-aggregator",
  content: (
    <>
      <Paragraph delay={0.10}>
        A shoe brand runs an ad that gets clicked 40 times a second during a lunchtime rush. Every one of
        those clicks is a line item the advertiser expects to be billed for, and a number the platform has to
        be able to defend if the advertiser ever asks to see the math. Showing the click count an hour late is
        annoying. Showing the wrong click count is a trust problem.
      </Paragraph>

      <Paragraph delay={0.15}>
        The interesting part of this system isn't the redirect itself, a browser bouncing from one URL to
        another is old news. The interesting part is turning a firehose of individual clicks into a running,
        trustworthy total, one that a dashboard can show within a minute and that a billing system can still
        stand behind a day later.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What must be true
      </Heading>

      <List delay={0.25}>
        <ListItem>
          <strong>Redirect fast.</strong> A click has to send the user on to the advertiser's page almost
          immediately. Nobody notices a well-designed backend, they only notice a slow one.
        </ListItem>
        <ListItem>
          <strong>Count every click exactly once.</strong> A dropped click loses the platform money. A click
          counted twice loses the advertiser's trust. Neither is acceptable at scale.
        </ListItem>
        <ListItem>
          <strong>Give advertisers minute-level numbers quickly.</strong> A campaign dashboard that lags hours
          behind real spend is not a dashboard anyone can act on.
        </ListItem>
        <ListItem>
          <strong>Keep the raw truth around.</strong> If a bug ever produces the wrong aggregate, the original
          events need to still exist so the real number can be recomputed instead of guessed at.
        </ListItem>
        <ListItem>
          <strong>Stay out of ad selection.</strong> Deciding which ad to show, and how to rank it, is a
          separate problem. This system only has to count what already got clicked.
        </ListItem>
      </List>

      <Heading level={2} delay={0.30}>
        Sizing the pipeline
      </Heading>

      <Paragraph delay={0.35}>
        Start from one input assumption, <strong>100 million ad clicks a day</strong> across the platform,
        with an eight-times multiplier for the busiest hours of the day. Everything else, storage, row counts,
        and rollup savings, follows from that one number.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Planning numbers for the click pipeline. The peak rate, not the daily average, is what the ingestion layer has to survive."
      />

      <StatTiles items={stats} delay={0.05} />

      <Heading level={2} delay={0.40}>
        The public surface is small
      </Heading>

      <Paragraph delay={0.45}>
        Most of the interesting behavior happens after the request, not in the request itself. The redirect
        endpoint takes a token and returns a location header. The metrics endpoints take an ad ID and a window
        size and return numbers that were computed well before the request arrived.
      </Paragraph>

      <ApiEndpointsTable items={apiEndpoints} delay={0.05} />

      <Heading level={2} delay={0.50}>
        Model the click, not just the count
      </Heading>

      <Paragraph delay={0.55}>
        A raw <InlineCode>click_events</InlineCode> record is the only place the full truth lives. Everything
        else derived from it, minute rows, hourly rollups, daily rollups, is a summary that can always be
        rebuilt from that table if it's ever wrong. The composite key on <InlineCode>ad_click_minute</InlineCode>{" "}
        matters because the count that gets updated is always scoped to one ad and one specific one-minute
        window, never a running total for the ad overall.
      </Paragraph>

      <SchemaCards tables={schemaTables} delay={0.05} />

      <Heading level={2} delay={0.60}>
        A click has to survive its own redirect
      </Heading>

      <Paragraph delay={0.65}>
        A tempting shortcut is to let the browser fire a tracking request in the background while it navigates
        straight to the advertiser's page. That is fragile in exactly the way it looks fragile. The browser
        can leave the page before the tracking call finishes, an ad blocker can strip it out entirely, and
        nothing stops a script from replaying the same tracking call a thousand times to inflate a count.
      </Paragraph>

      <Paragraph delay={0.70}>
        The more reliable pattern routes the click through the platform's own server first. The link the
        browser actually follows doesn't point at the advertiser, it points at a redirect endpoint the
        platform controls. That request has to succeed for the user to get anywhere, which turns "did this
        click get counted" into "did the server handle this request," a question with one clear place to make
        true instead of a hope about what the browser managed to do before it moved on.
      </Paragraph>

      <Paragraph delay={0.75}>
        That still leaves the question of how the redirect service tells a genuine click from a bot hitting
        the same URL, or a slow retry from double-counting the click it already saw. The fix starts earlier,
        at the moment the ad is served. The ad server mints a <strong>signed impression token</strong>, a
        short-lived value that bundles the ad ID, the placement, and a timestamp, and signs it with a key only
        the platform holds. The link embedded in the ad points at{" "}
        <InlineCode>/r/{"{token}"}</InlineCode> instead of a plain ad ID.
      </Paragraph>

      <Paragraph delay={0.80}>
        When a click arrives, the redirect service checks the signature before trusting anything else. A
        forged or replayed token fails that check immediately. A legitimate token still needs one more guard,
        since a slow mobile network or an impatient double tap can send the exact same request twice. The
        service keeps a short-lived record of impression tokens it has already turned into a counted click,
        so a duplicate request still gets its redirect but does not get counted a second time.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={ingestNodes}
        edges={ingestEdges}
        height={420}
        delay={0.05}
        caption="A signed token minted at ad-serving time lets the redirect service tell a real click from a forgery or a retry, then it both redirects the user and appends the click to a durable stream."
      />

      <Heading level={2} delay={0.85}>
        Land every click on a durable stream first
      </Heading>

      <Paragraph delay={0.90}>
        The redirect service's job on the hot path is narrow on purpose, validate the token, append the click
        to a partitioned log such as Kafka or Kinesis, and answer with the redirect. It does not wait around
        for the click to be aggregated anywhere. That log is the durable buffer the rest of the system leans
        on, replicated across brokers, holding every click even if the aggregation job that reads it crashes
        or falls badly behind.
      </Paragraph>

      <Paragraph delay={0.95}>
        Retention on that log is what makes replay possible later. A log kept for, say, seven days means an
        aggregator that shipped with a bug can rewind to a known position and recompute a corrected result
        over the exact same input, rather than accepting whatever the buggy run happened to produce.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        One viral ad can flood a single partition
      </Heading>

      <Paragraph delay={1.05}>
        Partitioning the click log by ad ID keeps per-ad counting simple, since every click for one ad lands
        on the same partition and gets processed by the same task, in order. That simplicity has a cost. A
        genuinely viral ad, one running during a big sale, can produce so many clicks that its single
        partition and the one task reading it can't keep up, while every other partition sits comfortably
        idle. This is the classic hot-key problem, just wearing an advertising costume.
      </Paragraph>

      <Paragraph delay={1.10}>
        The fix is to <strong>salt</strong> the partition key for ads that actually need it, appending a
        random suffix to the ad ID before hashing so one ad's clicks land across several partitions instead of
        one. Each partition keeps its own partial count for the current window. A second aggregation stage,
        running after the windows close, sums those partial counts back into the one true total per ad and
        window before anything gets written durably. Ads that aren't busy skip salting entirely, so ordinary
        traffic never pays for a mechanism it doesn't need.
      </Paragraph>

      <HotAdSaltingDiagram caption="Every click for a viral ad hashing to one partition overloads it while three sit idle. Salting the key spreads the load evenly, and a second stage sums the four partial counts back into one number." delay={0.05} />

      <Heading level={2} delay={1.15}>
        Turning a stream into running totals
      </Heading>

      <Paragraph delay={1.20}>
        A stateless function would have to look up the current count for an ad's window from some external
        store on every single click, which gets expensive fast at this volume. A Flink-style stream processor
        instead keeps that count as state living right next to the code processing the click, commonly backed
        by a local embedded store like RocksDB. Each click updates a number that's already sitting in memory
        rather than triggering a fresh round trip to a database.
      </Paragraph>

      <CodeBlock
        delay={1.25}
        language="TypeScript"
        code={`// One instance of this handles one (adId, windowStart) key.
// The count lives in local state, not a remote database.
class ClickWindowAggregator {
  count: ValueState<number>;

  onClick(click: ClickEvent) {
    const current = this.count.get() ?? 0;
    this.count.set(current + 1);
  }

  onWindowClose(adId: string, windowStart: number) {
    const total = this.count.get() ?? 0;
    emit({ adId, windowStart, total });
    this.count.clear();
  }
}`}
      />

      <Paragraph delay={1.30}>
        This only produces a trustworthy answer if the clicks are grouped by when they actually happened,
        rather than by when the processor got around to handling them. <strong>Event time</strong> is the
        timestamp stamped on the click at the moment the redirect service saw it. Processing time is whenever
        the stream processor happens to touch that record, which can lag behind event time by a lot during a
        network retry or a backlog. Grouping by event time keeps "how many clicks happened between 10:00 and
        10:01" tied to reality, no matter when the pipeline personally got around to it.
      </Paragraph>

      <Heading level={2} delay={1.35}>
        Windows close, but not right away
      </Heading>

      <Paragraph delay={1.40}>
        A <InlineCode>tumbling window</InlineCode> is a fixed, non-overlapping slice of time, one minute wide
        here, and every click's event time places it into exactly one such slice. The catch is that the
        aggregator can never be completely sure it has seen every click for a given minute the instant that
        minute ends. Some click from that minute might still be in flight.
      </Paragraph>

      <Paragraph delay={1.45}>
        A <strong>watermark</strong> is the pipeline's running estimate of how far event time has actually
        progressed, based on the timestamps it has observed so far, minus some slack for expected lateness.
        Once the watermark passes a window's end, that window is considered safe to close. What happens to a
        click that shows up after its window already closed is a policy decision. A common approach gives each
        window a short grace period during which a late arrival can still update it, and only routes truly
        late clicks, the ones that miss even the grace period, to a separate path instead of ever touching a
        closed window's number.
      </Paragraph>

      <LateClickWindowDiagram caption="A click delayed by a retry still lands in the window its event time says it belongs to, because that window hasn't finalized yet. A click delayed past the grace period gets routed to a late-events path instead." delay={0.05} />

      <Heading level={2} delay={1.50}>
        What exactly-once actually requires
      </Heading>

      <Paragraph delay={1.55}>
        Recovering from a crash safely depends on being able to replay the input the aggregator hadn't
        finished processing yet. That's exactly what a durable log's retained offsets provide, the aggregator
        can ask for everything since a known position again. Periodically, often every ten to thirty seconds,
        the stream processor takes a consistent snapshot of every window's partial state and its position in
        each partition, called a <strong>checkpoint</strong>, and writes it durably. A crash restarts from that
        snapshot instead of from zero.
      </Paragraph>

      <Paragraph delay={1.60}>
        Recovering by replaying input means the same click record can genuinely get processed twice. If the
        sink on the other end reacted to that by incrementing a stored count, a restart would double count
        whatever it reprocessed. Sinks avoid this either by writing a value that's naturally safe to repeat,
        overwriting a window's row with its final absolute count rather than adding to it, so writing it twice
        produces the same result as writing it once, or by writing transactionally alongside the checkpoint so
        the two either both land or neither does.
      </Paragraph>

      <List delay={1.65}>
        <ListItem>
          <strong>Exactly-once from the source.</strong> The input can be replayed from a durable, known
          position after a failure.
        </ListItem>
        <ListItem>
          <strong>Exactly-once in state.</strong> Every window's partial progress is checkpointed consistently
          with that same input position.
        </ListItem>
        <ListItem>
          <strong>Exactly-once at the sink.</strong> The final write is either idempotent by construction or
          committed transactionally with the checkpoint.
        </ListItem>
      </List>

      <Paragraph delay={1.70}>
        "Exactly-once" only means anything when all three of those hold together. A sink that increments
        instead of overwrites, a source that can't rewind, or state that isn't checkpointed atomically with
        the input position, any one of those quietly turns the whole pipeline into at-least-once or
        at-most-once, regardless of what the surrounding tooling advertises.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Where the numbers actually live
      </Heading>

      <Paragraph delay={1.80}>
        A general-purpose relational database is tuned for finding and updating one row fast. A dashboard
        query is closer to the opposite, sum the clicks for one ad across thousands of minute rows in one shot.
        A columnar analytical store built for exactly that job, ClickHouse, Pinot, and Druid are the usual
        names that come up, is what the streaming aggregator writes finished minute rows into.
      </Paragraph>

      <List delay={1.85}>
        <ListItem>
          <strong>Minute rows</strong> come straight from the stream processor and keep the write rate bounded
          to one row per ad per minute rather than one per click.
        </ListItem>
        <ListItem>
          <strong>Hourly rollups</strong> sum sixty minute rows into one, computed either by a small periodic
          job or a scheduled query, and get stored as their own rows.
        </ListItem>
        <ListItem>
          <strong>Daily rollups</strong> sum twenty-four hourly rows the same way, so a "clicks this month"
          query never has to touch a single raw minute.
        </ListItem>
      </List>

      <Heading level={2} delay={1.90}>
        Keeping the raw truth around
      </Heading>

      <Paragraph delay={1.95}>
        Minute rows answer "how many," not "which ones" or "why," and a billing dispute or an audit eventually
        asks one of those other questions. Every click event, unmodified, also gets written to cheap durable
        object storage, typically partitioned by date and kept in a compressed columnar file format so a batch
        job can scan a day's worth efficiently. As long as that raw log exists, the platform is never stuck
        defending a number it can't reconstruct.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        A slower job that checks the fast one
      </Heading>

      <Paragraph delay={2.05}>
        The streaming path makes real trade-offs for speed. A grace period cuts off very late events on
        purpose, and a salted ad's total depends on every partial merge behaving correctly. Once a day, a
        batch job reads every raw event for the previous day directly from object storage and recomputes the
        true click counts with no shortcuts at all. It compares that recomputed total against what streaming
        already wrote for the same ad and window, and overwrites the streaming number whenever the two
        disagree.
      </Paragraph>

      <ReplicationDiagram panels={replicationPanels} delay={0.05} />

      <Paragraph delay={2.10}>
        Advertisers looking at today's numbers see the fast, mostly-correct answer within a minute. The
        fully-audited version of yesterday's numbers shows up a few hours later, once the batch job finishes.
        Both are useful. Neither pretends to be the other.
      </Paragraph>

      <Heading level={2} delay={2.15}>
        Stream health is its own problem
      </Heading>

      <Paragraph delay={2.20}>
        Keeping the fast path fast is an ongoing operational job, separate from getting the logic right once.
      </Paragraph>

      <List delay={2.25}>
        <ListItem>
          <strong>Consumer lag</strong> measures how far behind the stream processor is from the newest event
          on the log. A steadily growing lag means the processing side is losing a race it needs to win back.
        </ListItem>
        <ListItem>
          <strong>Backpressure</strong> is the signal that a downstream stage is falling behind and needs the
          stages feeding it to slow down, rather than letting a buffer grow until something falls over.
        </ListItem>
        <ListItem>
          <strong>Schema evolution</strong> has to stay backward compatible, adding an optional field is safe,
          renaming or removing one breaks every consumer still reading the old shape during a rollout.
        </ListItem>
        <ListItem>
          <strong>Failed events</strong> need a dead-letter path. One malformed record should never be able to
          stall an entire partition behind it.
        </ListItem>
      </List>

      <Heading level={2} delay={2.30}>
        Putting the design together
      </Heading>

      <Paragraph delay={2.35}>
        The finished pipeline has two speeds running side by side on purpose. The stream path is fast and
        mostly right, built from state, checkpoints, and windows. The batch path is slow and exactly right,
        built from raw events and no shortcuts. Neither one is optional, and neither one is the whole answer
        by itself.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={finalNodes}
        edges={finalEdges}
        phases={finalPhases}
        height={860}
        delay={0.05}
        caption="The finished design carries a click from redirect to durable stream, through stateful windowed aggregation, into a queryable OLAP store, while an untouched copy sits in object storage waiting for the reconciliation job."
      />

      <Heading level={2} delay={2.40}>
        Takeaways
      </Heading>

      <List delay={2.45}>
        <ListItem>
          <strong>Route the click through your own server first.</strong> A server-side redirect with a signed
          token turns click validation into one clear decision instead of a hope about the browser.
        </ListItem>
        <ListItem>
          <strong>Salt the keys that actually get hot.</strong> Spreading one viral ad's clicks across several
          partitions, then merging the partials, beats letting one partition drown while the rest sit idle.
        </ListItem>
        <ListItem>
          <strong>Group by event time, not arrival time.</strong> Watermarks and a grace period let a delayed
          click still land in the window it actually belongs to.
        </ListItem>
        <ListItem>
          <strong>Exactly-once needs three things to agree.</strong> A replayable source, checkpointed state,
          and an idempotent or transactional sink all have to hold together, or the guarantee is fiction.
        </ListItem>
        <ListItem>
          <strong>Never throw away the raw events.</strong> A fast aggregate that can't be rebuilt from the
          truth it summarized is a liability waiting for its first real bug.
        </ListItem>
      </List>

      <Paragraph delay={2.50}>
        None of this changes what a click is. It's still one person, one moment, one ad. What changes is how
        much has to go right, quietly, in the background, before that moment turns into a number an advertiser
        is willing to pay for and a platform is willing to stand behind. Thanks for reading.
      </Paragraph>
    </>
  ),
};
