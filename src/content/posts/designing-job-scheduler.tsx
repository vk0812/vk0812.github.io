import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  InlineCode,
  CodeBlock,
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
  JobLifecycleDiagram,
  LeaseReclaimDiagram,
  DagReleaseDiagram,
} from "../components";
import {
  AlertTriangle,
  Bell,
  CalendarDays,
  Clock,
  Cpu,
  Database,
  GitBranch,
  Layers,
  RefreshCw,
  RotateCcw,
  Send,
  Timer,
  Users,
  Waypoints,
  Zap,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Dispatch rate",
    lines: [
      { expression: "10,000,000 schedules ÷ (6 hours × 3,600 seconds)", result: "≈ 463 due/s average" },
      { expression: "463 due/s × 8x peak multiplier", result: "≈ 3.7K due/s peak" },
    ],
    note: "Cron-style schedules cluster at the top of the hour, midnight, and other round numbers, so peak load is a multiple of the average, not a smooth curve.",
  },
  {
    title: "Attempts, including retries",
    lines: [
      { expression: "463 due/s × 1.15 attempts per job", result: "≈ 532 attempts/s average" },
      { expression: "3.7K due/s × 1.15 attempts per job", result: "≈ 4.3K attempts/s peak" },
    ],
    note: "The 1.15 multiplier assumes about 15 percent of jobs need one retry. A scheduler that's cheap to retry against can tolerate a far worse ratio without falling behind.",
  },
  {
    title: "History and retention",
    lines: [
      { expression: "532 attempts/s × 86,400 seconds/day", result: "≈ 46M attempts/day" },
      { expression: "46M attempts/day × 90-day retention", result: "≈ 4.1B attempt rows" },
      { expression: "4.1B rows × 300 bytes/row", result: "≈ 1.23 TB raw" },
      { expression: "1.23 TB raw × 3 replicas", result: "≈ 3.7 TB replicated" },
    ],
    note: "Even a generous retention window stays in the low terabytes, because an attempt record is small. The real pressure sits on the due-job lookup path, not on storage.",
  },
];

const stats: StatItem[] = [
  { label: "Active schedules", value: 10, suffix: "M", icon: CalendarDays, color: "text-blue-500" },
  { label: "Peak dispatch rate", value: 3.7, suffix: "K/s", icon: Zap, color: "text-amber-500" },
  { label: "Attempts per day", value: 46, suffix: "M", icon: RefreshCw, color: "text-teal-500" },
  { label: "Replicated history", value: 3.7, suffix: " TB", icon: Database, color: "text-violet-500" },
];

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/task-definitions",
    description:
      "Registers a reusable handler, its default timeout, and its default retry policy. Schedules point at a task definition instead of embedding logic directly.",
  },
  {
    method: "POST",
    path: "/schedules",
    description:
      "Creates a schedule bound to a task definition, using a one-time timestamp, a cron expression, or a dependency on another job's completion.",
  },
  {
    method: "GET",
    path: "/jobs/{job_id}/runs",
    description:
      "Lists every run for a job, each carrying its own attempts, current state, and the worker that last held its lease.",
  },
  {
    method: "POST",
    path: "/runs/{run_id}/cancel",
    description:
      "Cancels a run that hasn't started, or signals a currently executing one to stop, without touching any sibling run of the same job.",
  },
  {
    method: "POST",
    path: "/schedules/{schedule_id}/backfill",
    description:
      "Launches out-of-cycle runs for a past time range, for example after fixing a bug that made a task silently do the wrong thing for a week.",
  },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "task_definitions",
    fields: [
      { name: "task_definition_id", note: "primary key" },
      { name: "handler_name" },
      { name: "default_timeout_seconds" },
      { name: "default_retry_policy" },
    ],
  },
  {
    name: "schedules",
    fields: [
      { name: "schedule_id", note: "primary key and shard key" },
      { name: "task_definition_id" },
      { name: "trigger_type", note: "timestamp, cron, or dependency" },
      { name: "trigger_expr" },
      { name: "next_due_at" },
    ],
  },
  {
    name: "jobs",
    fields: [
      { name: "job_id", note: "primary key" },
      { name: "schedule_id" },
      { name: "scheduled_for" },
      { name: "dag_id", note: "nullable" },
    ],
  },
  {
    name: "job_dependencies",
    fields: [
      { name: "job_id, depends_on_job_id", note: "composite primary key" },
      { name: "dag_id" },
    ],
  },
  {
    name: "runs",
    fields: [
      { name: "run_id", note: "primary key" },
      { name: "job_id" },
      { name: "state" },
      { name: "current_attempt" },
    ],
  },
  {
    name: "attempts",
    fields: [
      { name: "attempt_id", note: "primary key" },
      { name: "run_id" },
      { name: "worker_id" },
      { name: "lease_expires_at" },
      { name: "state" },
    ],
  },
];

const finalNodes: DiagramNode[] = [
  { id: "author", label: "Job Author", icon: Users, color: "text-slate-500", x: 10, y: 8 },
  { id: "api", label: "Scheduling API", icon: Waypoints, color: "text-blue-500", x: 30, y: 8 },
  { id: "store", label: "Schedule & Job Store", sub: "sharded by schedule ID", icon: Database, color: "text-indigo-500", x: 52, y: 8 },
  { id: "scheduler", label: "Scheduler Shard", sub: "CAS-owned time range", icon: Clock, color: "text-teal-500", x: 74, y: 8 },
  { id: "worker", label: "Worker Pool", sub: "leases + heartbeats", icon: Cpu, color: "text-pink-500", x: 30, y: 32 },
  { id: "queue", label: "Execution Queue", sub: "durable, at-least-once", icon: Send, color: "text-amber-500", x: 52, y: 32 },
  { id: "bucket", label: "Due-Time Buckets", sub: "per-minute index", icon: Layers, color: "text-violet-500", x: 74, y: 32 },
  { id: "runStore", label: "Run & Attempt Store", sub: "state + history", icon: Database, color: "text-blue-600", x: 30, y: 56 },
  { id: "dag", label: "Dependency Resolver", sub: "releases downstream jobs", icon: GitBranch, color: "text-emerald-500", x: 52, y: 56 },
  { id: "retry", label: "Retry & Backoff", sub: "max attempts", icon: RotateCcw, color: "text-orange-500", x: 74, y: 56 },
  { id: "dlq", label: "Dead-Letter Queue", icon: AlertTriangle, color: "text-rose-500", x: 45, y: 80 },
  { id: "notify", label: "Downstream Consumers", icon: Bell, color: "text-fuchsia-500", x: 65, y: 80 },
];

const finalEdges: DiagramEdge[] = [
  { id: "author-api", from: "author", to: "api" },
  { id: "api-store", from: "api", to: "store" },
  { id: "store-scheduler", from: "store", to: "scheduler", bidirectional: true },
  { id: "scheduler-bucket", from: "scheduler", to: "bucket", bidirectional: true },
  { id: "scheduler-queue", from: "scheduler", to: "queue" },
  { id: "queue-worker", from: "queue", to: "worker", bidirectional: true },
  { id: "worker-runStore", from: "worker", to: "runStore", bidirectional: true },
  { id: "runStore-dag", from: "runStore", to: "dag" },
  { id: "dag-queue", from: "dag", to: "queue" },
  { id: "worker-retry", from: "worker", to: "retry" },
  { id: "retry-queue", from: "retry", to: "queue" },
  { id: "retry-dlq", from: "retry", to: "dlq" },
  { id: "runStore-notify", from: "runStore", to: "notify" },
];

const finalPhases: DiagramPhase[] = [
  {
    nodeIds: ["author", "api", "store", "scheduler"],
    edgeIds: ["author-api", "api-store", "store-scheduler"],
    note: "A team registers a task definition and a schedule. The scheduler shard that owns this schedule's ID range claims it with a compare-and-swap lock instead of a separate leader-election service.",
  },
  {
    nodeIds: ["author", "api", "store", "scheduler", "worker", "queue", "bucket"],
    edgeIds: ["author-api", "api-store", "store-scheduler", "scheduler-bucket", "scheduler-queue", "queue-worker"],
    note: "The scheduler finds due work in its own per-minute time buckets, never by scanning the full schedule table, then hands the due job to a durable execution queue that a worker leases.",
    highlight: ["bucket", "queue"],
  },
  {
    nodeIds: ["author", "api", "store", "scheduler", "worker", "queue", "bucket", "runStore", "dag", "retry"],
    edgeIds: ["author-api", "api-store", "store-scheduler", "scheduler-bucket", "scheduler-queue", "queue-worker", "worker-runStore", "runStore-dag", "worker-retry"],
    note: "Every attempt is written to the run and attempt store. A failed attempt goes to the retry policy, and a successful run lets the dependency resolver check whether any downstream job just became eligible.",
    highlight: ["runStore", "dag", "retry"],
  },
  {
    nodeIds: ["author", "api", "store", "scheduler", "worker", "queue", "bucket", "runStore", "dag", "retry", "dlq", "notify"],
    edgeIds: ["author-api", "api-store", "store-scheduler", "scheduler-bucket", "scheduler-queue", "queue-worker", "worker-runStore", "runStore-dag", "worker-retry", "dag-queue", "retry-queue", "retry-dlq", "runStore-notify"],
    note: "A newly eligible downstream job goes straight back into the execution queue, and so does a retried attempt, unless it has used up its attempt budget and lands in the dead-letter queue instead. A finished run also fires an event for anything downstream that's watching.",
    highlight: ["dlq", "notify"],
  },
];

export const designingJobScheduler: BlogPostData = {
  title: "Designing a Distributed Job Scheduler",
  date: "August 2, 2026",
  slug: "designing-job-scheduler",
  content: (
    <>
      <Paragraph delay={0.10}>
        A retailer runs a job every night that rebuilds tomorrow's pricing feed for every store. It has to
        start at 2 AM sharp, finish before the morning batch that reads its output, and never run twice,
        because running it twice would double every markdown in the feed. Now multiply that one job by
        thousands of others a company schedules at once, hourly reports, weekly backups, reminders tied to a
        customer's time zone, and pipelines where step four can't start until steps one through three finish
        cleanly. That's the job a distributed job scheduler does all day.
      </Paragraph>

      <Paragraph delay={0.15}>
        The naive version sounds easy. Store a due time, poll for it, run the job. What actually makes it hard
        is the same handful of things that make any distributed system hard. Clocks on different machines
        don't agree exactly, workers die in the middle of a task, and a job that runs at-least-once can quietly
        become a job that runs twice unless something in the design explicitly refuses to let that happen. The
        queue that carries work to a worker turns out to be one of the least interesting parts of this design.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What must be true
      </Heading>

      <List delay={0.25}>
        <ListItem>
          <strong>Run jobs at the right time.</strong> A one-time job fires at an exact timestamp, a recurring
          job follows a cron-style rule, and a dependent job waits until the jobs it depends on finish.
        </ListItem>
        <ListItem>
          <strong>Find due work without scanning everything.</strong> Millions of schedules can't mean
          scanning millions of rows every few seconds just to see what's due right now.
        </ListItem>
        <ListItem>
          <strong>Guarantee at-least-once delivery.</strong> A job handed to a worker either finishes, or the
          system notices and reassigns it. Nothing silently disappears because a process happened to die.
        </ListItem>
        <ListItem>
          <strong>Survive crashes without duplicating work.</strong> A scheduler process or a worker can die at
          any point, and whatever replaces it needs to pick up cleanly, not repeat work that already finished.
        </ListItem>
        <ListItem>
          <strong>Keep state precisely distinguishable.</strong> A retry, a manual rerun, and a first try at a
          task all need separate, unambiguous records, not one blurry "it ran" flag.
        </ListItem>
        <ListItem>
          <strong>Stay fair under load.</strong> One tenant with half a million schedules shouldn't be able to
          starve everyone else's on-time jobs.
        </ListItem>
      </List>

      <Heading level={2} delay={0.30}>
        Sizing the schedule
      </Heading>

      <Paragraph delay={0.35}>
        Assume 10 million active schedules across the whole fleet, one-time and recurring
        combined, each firing on average once every six hours. That's a deliberately round planning number, not
        a claim about any particular company's real load. It's enough to show where the design actually gets
        stressed.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Planning numbers for a scheduler fleet. Dispatch rate spikes hard around round clock times, and history storage stays modest next to the lookup problem."
      />

      <StatTiles items={stats} delay={0.05} />

      <Heading level={2} delay={0.40}>
        A small, sharp API
      </Heading>

      <Paragraph delay={0.45}>
        Most of the surface area is administrative, registering a handler once and pointing schedules at it.
        The interesting endpoints are the ones that touch time and state directly, a schedule's trigger, a
        run's cancellation, and a backfill that replays history without disturbing the schedule's normal
        rhythm.
      </Paragraph>

      <ApiEndpointsTable items={apiEndpoints} delay={0.05} />

      <Heading level={2} delay={0.50}>
        Four words that mean different things
      </Heading>

      <Paragraph delay={0.55}>
        These four terms get used interchangeably in casual conversation, and that's exactly what causes
        confusion once a job starts retrying. Each one is a distinct row in the data model, and keeping them
        separate is what makes the rest of this design coherent.
      </Paragraph>

      <List delay={0.60}>
        <ListItem>
          Task definition is the reusable handler code, registered once, that many different schedules can
          point at. It knows how to actually do the work.
        </ListItem>
        <ListItem>
          A schedule is the rule for when a task definition should fire, a one-time timestamp, a cron
          expression, or a dependency on another job.
        </ListItem>
        <ListItem>
          A job is one concrete instance of a schedule at one specific due time. Tonight's 2 AM run and
          tomorrow's 2 AM run are two different jobs from the same schedule.
        </ListItem>
        <ListItem>
          A run is the system's attempt to actually execute a job. Almost always exactly one run per job,
          except when someone manually reruns a job after a bug fix, which creates a second run for the same
          job.
        </ListItem>
        <ListItem>
          An attempt is one worker's try at finishing a run. A crash or a timeout produces a new attempt for
          the same run, not a new job and not a new run.
        </ListItem>
      </List>

      <Paragraph delay={0.65}>
        A dependency between two jobs is its own row too, rather than a field buried inside one of the jobs, so
        a job with three prerequisites and a job with zero prerequisites use the exact same table shape.
      </Paragraph>

      <SchemaCards tables={schemaTables} delay={0.05} />

      <Heading level={2} delay={0.70}>
        Saying when, timestamps, cron, and dependency graphs
      </Heading>

      <Paragraph delay={0.75}>
        A schedule needs to express "when" in three genuinely different shapes. The first is a plain timestamp,
        run once at an exact moment. The scheduler stores that moment as <InlineCode>next_due_at</InlineCode>{" "}
        and never has to recompute it, since after it fires there's nothing left to schedule.
      </Paragraph>

      <Paragraph delay={0.80}>
        The second shape is a cron expression, a compact rule like <InlineCode>0 */6 * * *</InlineCode> that
        means every six hours on the hour. A cron-based schedule always has exactly one upcoming due time, so
        the scheduler computes the next occurrence from the expression, stores it in the same{" "}
        <InlineCode>next_due_at</InlineCode> column, fires it, then immediately computes the occurrence after
        that. The schedule row never needs a special "recurring" flag elsewhere in the system. It just keeps
        getting a new due time.
      </Paragraph>

      <Paragraph delay={0.85}>
        The third shape isn't a clock rule at all. A job's trigger can be "start once these other jobs finish
        successfully." That describes a workflow shaped like a directed acyclic graph, a diagram where each
        task points at the tasks that must finish before it's allowed to start, and where following the arrows
        forward can never loop back to a task already visited. The "acyclic" part isn't decorative. If a graph
        allowed a cycle, task A could end up waiting on task B, which is waiting on task A, and nothing would
        ever be eligible to run.
      </Paragraph>

      <Heading level={2} delay={0.90}>
        Finding due jobs without scanning the table
      </Heading>

      <Paragraph delay={0.95}>
        A naive scheduler runs something like <InlineCode>SELECT * FROM schedules WHERE next_due_at &lt;=
        NOW()</InlineCode> every few seconds. That's fine at a few thousand rows. At ten million it's a
        recurring full-index range scan, competing with every write that's simultaneously updating{" "}
        <InlineCode>next_due_at</InlineCode> for the schedules that just fired. The fix is to stop treating
        "what's due right now" as a query over everything, and instead maintain a structure that only ever
        touches the small slice that's actually close to firing.
      </Paragraph>

      <Paragraph delay={1.00}>
        One version of this rounds each schedule's next due time down to the nearest minute and keeps a bucket
        per minute holding just the schedule IDs due in that minute. The scheduler only ever looks at the
        current minute's bucket, which is proportional to how much is due right now, not to how many schedules
        exist in total. A timing wheel is the same idea taken further, a circular array of slots like a clock
        face, where slot <InlineCode>i</InlineCode> holds everything due <InlineCode>i</InlineCode> ticks from
        now. As real time advances the wheel rotates, the slot that just reached "now" gets drained and
        processed, and that same slot gets reused for a future tick once it's empty. A sharded priority queue,
        a per-shard min-heap ordered by due time, gets to the same place from another angle, peeking at
        "what's next" is a cheap constant-time lookup at the top of the heap instead of a scan through
        everything behind it.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={[
          { id: "store", label: "Schedule Store", icon: Database, color: "text-indigo-500", x: 50, y: 15 },
          { id: "bucketNow", label: "Bucket 10:00", sub: "due now", icon: Clock, color: "text-rose-500", x: 20, y: 50 },
          { id: "bucketNext", label: "Bucket 10:01", sub: "due next", icon: Clock, color: "text-amber-500", x: 50, y: 50 },
          { id: "bucketLater", label: "Bucket 10:02", sub: "due later", icon: Clock, color: "text-slate-500", x: 80, y: 50 },
          { id: "puller", label: "Due-Job Puller", icon: Timer, color: "text-teal-500", x: 35, y: 85 },
          { id: "queue", label: "Execution Queue", icon: Send, color: "text-blue-500", x: 65, y: 85 },
        ]}
        edges={[
          { id: "store-now", from: "store", to: "bucketNow" },
          { id: "store-next", from: "store", to: "bucketNext" },
          { id: "store-later", from: "store", to: "bucketLater" },
          { id: "now-puller", from: "bucketNow", to: "puller" },
          { id: "puller-queue", from: "puller", to: "queue" },
        ]}
        height={420}
        delay={0.05}
        caption="Schedules land in a bucket keyed by their due minute. The scheduler only ever drains the current bucket, so the lookup cost tracks what's due, not the size of the whole table."
      />

      <Heading level={2} delay={1.05}>
        Scheduler shards claim ownership, not the calendar
      </Heading>

      <Paragraph delay={1.10}>
        One scheduler process can't poll ten million schedules alone, so the schedule space gets split by a
        hash of the schedule ID into shards, and each shard is owned by exactly one scheduler instance at a
        time. Two schedulers polling the same shard would both find the same due jobs and could both dispatch
        them, so ownership has to be exclusive and has to be provable, not assumed.
      </Paragraph>

      <Paragraph delay={1.15}>
        There are two common ways to get that exclusivity. Leader election runs a coordination service that
        every scheduler instance talks to, and that service hands out one clear owner per shard. It's easy to
        reason about, at the cost of an extra external dependency that itself needs to stay available. The
        other approach keeps ownership as a row in the same database that already holds the schedules, and
        schedulers race for it with a compare-and-swap update, an update that only succeeds if the row's
        current owner is empty or its lease has expired.
      </Paragraph>

      <CodeBlock
        delay={1.20}
        language="SQL"
        code={`UPDATE scheduler_shards
SET owner_id = 'scheduler-07', lease_expires_at = NOW() + INTERVAL '30 seconds'
WHERE shard_id = 42
  AND (owner_id IS NULL OR lease_expires_at < NOW())
RETURNING shard_id;`}
      />

      <Paragraph delay={1.25}>
        If that update returns a row, this scheduler now owns shard 42 until the new lease runs out, and it
        has to renew the lease well before then to keep polling. If it returns nothing, some other process
        already renewed a live lease more recently, so this one backs off and tries a different shard. That's
        the exact same pattern the design leans on again for worker leases a few sections from here, ownership
        of anything time-sensitive expires unless it's actively renewed.
      </Paragraph>

      <Heading level={2} delay={1.30}>
        From due to dispatched
      </Heading>

      <Paragraph delay={1.35}>
        Once a shard's due-job path pulls out a job that's actually due, the scheduler doesn't execute the task
        in place. It writes a run record in the state <InlineCode>scheduled</InlineCode>, then hands a message
        describing that run to a durable execution queue. The queue's job is boring on purpose. It just has to
        hold the message safely and hand it to exactly one consumer at a time, without losing it if a worker
        dies mid-delivery. The interesting part is everything that happens on the other side of that handoff.
      </Paragraph>

      <JobLifecycleDiagram
        delay={0.05}
        caption="A run moves from scheduled to queued to running. A failed attempt goes back through backoff and requeues as a fresh attempt on the same run, until it eventually succeeds."
      />

      <Heading level={2} delay={1.40}>
        A lease is a promise with a deadline
      </Heading>

      <Paragraph delay={1.45}>
        A worker that pulls a run off the queue doesn't just start executing and hope nothing goes wrong. It
        takes out a <strong>lease</strong>, a time-boxed claim that says this worker owns this run until a
        specific timestamp, unless it renews that claim first. The worker sends periodic heartbeats that push
        the lease's expiry forward as long as it's alive and making progress. If the heartbeats stop, whether
        because the worker crashed, lost network connectivity, or got killed by its host, the lease eventually
        expires on its own.
      </Paragraph>

      <Paragraph delay={1.50}>
        That expiry is what makes the run recoverable instead of stuck. A visibility timeout on the queue side
        does the equivalent job for the message itself, once the timeout passes without an acknowledgment, the
        message becomes visible to other workers again. A separate reclaim process, or the next worker that
        happens to poll, sees the expired lease, claims the run with a fresh lease of its own, and starts a new
        attempt. The run finishes exactly once from the outside, even though it took two different workers and
        one of them never got to finish.
      </Paragraph>

      <LeaseReclaimDiagram
        delay={0.05}
        caption="Worker A leases run 4821 and then crashes silently. Once the lease expires without a heartbeat, worker B claims the same run and finishes it."
      />

      <Heading level={2} delay={1.55}>
        At-least-once means the handler has to be idempotent
      </Heading>

      <Paragraph delay={1.60}>
        No practical distributed system can promise a message is delivered exactly once across an unreliable
        network. The honest version of that promise is at-least-once, a message might get delivered twice, and
        the receiver is responsible for making a second delivery harmless. A handler is <strong>idempotent</strong>{" "}
        when running it twice with the same input produces the same result as running it once, sending an
        email is not naturally idempotent, but recording "email sent for run 4821" before actually sending, and
        checking that record first, turns it into something that is.
      </Paragraph>

      <CodeBlock
        delay={1.65}
        language="Python"
        code={`def run_attempt(run_id, handler):
    if attempt_store.already_applied(run_id):
        return attempt_store.get_result(run_id)
    result = handler.execute()
    attempt_store.record_result(run_id, result)  # keyed by run_id, not attempt_id
    return result`}
      />

      <Paragraph delay={1.70}>
        Keying that record by the run rather than the attempt is what makes retries safe. Two attempts for the
        same run share one row, so the second attempt either sees the first one's result already recorded and
        skips redoing the side effect, or safely overwrites the same row instead of creating a second one.
      </Paragraph>

      <Paragraph delay={1.75}>
        Retries themselves follow a backoff policy so a struggling handler doesn't get hammered with immediate
        retries the moment it fails.
      </Paragraph>

      <Formula block delay={1.80}>
        {`\\text{delay} = \\min(\\text{base} \\times 2^{\\,\\text{attempt}-1},\\ \\text{max\\_delay})`}
      </Formula>

      <Paragraph delay={1.85}>
        Each failed attempt doubles the wait before the next one, capped at a maximum so a handler that's
        stuck for hours doesn't wait longer and longer forever. A small random jitter gets added on top so
        that a batch of jobs that all failed at the same instant don't all retry at the same instant too. Once
        a run exhausts its maximum attempt count, it stops going back to the queue and lands in a dead-letter
        queue instead, a holding area for runs that need a human or a separate recovery process rather than
        another automatic try.
      </Paragraph>

      <Heading level={2} delay={1.90}>
        Dependency graphs release work only when it's earned
      </Heading>

      <Paragraph delay={1.95}>
        A dependency-driven job doesn't get a due time from the clock. It gets one from the dependency
        resolver watching the run and attempt store. When a job's prerequisites all reach a successful state,
        the resolver marks every job that depends on all of them as newly eligible and drops each one straight
        into the execution queue, the same queue a clock-triggered job would have reached on its own.
      </Paragraph>

      <Paragraph delay={2.00}>
        The useful case to picture is a diamond, one job feeds two independent jobs that both have to finish
        before a fourth job can start. The two middle jobs can run in parallel the moment the first one
        succeeds, but the last job stays locked until both of them report success, not just the faster one.
      </Paragraph>

      <DagReleaseDiagram
        delay={0.05}
        caption="Extract finishes and releases transform and validate together. Load stays locked until both of them succeed, not just whichever one finishes first."
      />

      <Heading level={2} delay={2.05}>
        Changing your mind, backfills, reruns, cancellations, and schedule edits
      </Heading>

      <Paragraph delay={2.10}>
        A backfill launches new job rows for a past time range under an existing schedule, without touching
        that schedule's live <InlineCode>next_due_at</InlineCode>. This matters after fixing a bug that made a
        task quietly do the wrong thing for a week, the fix goes in, then a backfill regenerates the affected
        week's jobs as if the fix had always been there, while tonight's regular run stays completely
        unaffected.
      </Paragraph>

      <Paragraph delay={2.15}>
        A rerun creates a fresh run for a job that already has one, which is exactly why runs and jobs are
        separate rows in the first place, a job can carry an ordinary first run and a later manual rerun
        without either one overwriting the other's history. A cancellation has to account for the fact that a
        run might already be executing on some worker right now, so canceling doesn't just flip a row to
        cancelled, it also needs the worker to notice, usually by checking the run's state the next time it
        heartbeats and stopping cleanly if it sees cancelled instead of running.
      </Paragraph>

      <Paragraph delay={2.20}>
        Editing a schedule's cron expression or dependency rule should only change what happens in the future.
        Jobs that already exist keep their original <InlineCode>scheduled_for</InlineCode> time and their own
        run history, and the edit just changes how the next due time gets computed going forward. That edit
        also has to avoid racing the scheduler shard that might be mid-claim on that exact schedule, which is
        the same ownership discipline covered earlier, a write to a schedule row is only safe once it holds
        the lock or lease that governs that row.
      </Paragraph>

      <Heading level={2} delay={2.25}>
        Fairness under load, priority, tenant pools, and backpressure
      </Heading>

      <Paragraph delay={2.30}>
        A shared scheduler eventually serves one tenant with a handful of critical jobs and another tenant
        with hundreds of thousands of low-priority ones. Without any limits, the noisy tenant's sheer volume
        can push everyone else's on-time jobs later and later. A priority field on each schedule lets urgent
        work jump ahead in the queue, but priority alone isn't enough, a tenant with unlimited jobs at the
        highest priority would still crowd out everyone else.
      </Paragraph>

      <List delay={2.35}>
        <ListItem>
          <strong>Concurrency pools.</strong> Each tenant, or each task definition, gets a cap on how many runs
          can be executing at once, so one tenant's backlog can't consume every worker in the fleet.
        </ListItem>
        <ListItem>
          A separate cap per priority tier stops low-priority work from ever fully starving, since even the
          lowest tier keeps a small guaranteed slice of capacity.
        </ListItem>
        <ListItem>
          <strong>Backpressure.</strong> When the execution queue's depth or the worker pool's utilization
          crosses a threshold, the scheduler slows or pauses dispatch instead of pushing more due jobs into an
          already saturated system.
        </ListItem>
      </List>

      <Heading level={2} delay={2.40}>
        Long jobs need a heartbeat, not just a lease
      </Heading>

      <Paragraph delay={2.45}>
        A lease with a fixed five-minute expiry works fine for a task that finishes in ten seconds. It breaks
        down for a job that legitimately runs for three hours, since renewing on a rigid timer either wastes
        renewal calls constantly or risks the lease expiring on perfectly healthy work. The fix is to separate
        two questions that look similar but aren't, is the worker still alive, and is the work still making
        progress.
      </Paragraph>

      <Paragraph delay={2.50}>
        A progress heartbeat reports both at once, a lightweight "still here, and here's how far along I am"
        signal sent every few seconds regardless of the lease's length. As long as heartbeats keep arriving on
        schedule, the system extends the lease automatically and never treats the job as abandoned, no matter
        how long the lease's nominal expiry window is. A worker that stops heartbeating gets treated as dead
        even if its lease technically has time left, and a worker that keeps heartbeating without ever
        reporting new progress is a different, quieter problem, one worth flagging to an operator rather than
        silently reclaiming, since the process is alive but the work itself might be stuck.
      </Paragraph>

      <Heading level={2} delay={2.55}>
        Recovery, duplicate dispatch, and clock skew
      </Heading>

      <Paragraph delay={2.60}>
        Right after a scheduler shard changes owners, there's a narrow window where the old owner might still
        believe it's in charge and the new owner has already started polling the same shard. If both dispatch
        the same due job, the run store needs a unique constraint on job ID plus run number that makes the
        second dispatch fail cleanly instead of quietly creating a duplicate run. This is the same fencing idea
        distributed locks use everywhere, a stale owner shouldn't be able to take an action that looks valid
        just because it hasn't yet noticed it lost ownership.
      </Paragraph>

      <Paragraph delay={2.65}>
        Clock skew is the other quiet source of trouble. Two machines rarely agree on the exact time down to
        the millisecond, so comparing a lease expiry computed on one machine against the current time read on
        another can be off by more than it looks. The safer pattern is to let a single source, usually the
        database that stores the lease itself, be the only clock that matters for expiry decisions, rather than
        trusting each node's local clock to agree closely enough with everyone else's.
      </Paragraph>

      <Heading level={2} delay={2.70}>
        Putting the design together
      </Heading>

      <Paragraph delay={2.75}>
        Every piece above earns its place because time, ownership, and duplicate execution are hard, not
        because moving a message from one place to another is hard. The final design reflects that, the
        execution queue is one box among many, sitting between a scheduler that decides what's due and a
        worker pool that leases, heartbeats, and retries its way to exactly-once-looking results.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={finalNodes}
        edges={finalEdges}
        phases={finalPhases}
        height={780}
        delay={0.05}
        caption="The final design builds from schedule registration to shard-owned dispatch, leased execution, dependency release, and the retry and dead-letter paths that keep failures recoverable."
      />

      <Heading level={2} delay={2.80}>
        Takeaways
      </Heading>

      <List delay={2.85}>
        <ListItem>
          <strong>Separate task definition, job, run, and attempt.</strong> Blurring these into one concept is
          what makes retries and reruns confusing to reason about later.
        </ListItem>
        <ListItem>
          <strong>Turn "what's due" into a lookup, not a scan.</strong> Time buckets, a timing wheel, or a
          sharded priority queue all trade a full scan for a targeted read.
        </ListItem>
        <ListItem>
          <strong>Ownership needs an expiry.</strong> Shard ownership and worker leases both use the same
          pattern, a claim that lapses unless it's actively renewed, so a dead owner never blocks progress
          forever.
        </ListItem>
        <ListItem>
          <strong>At-least-once is the honest promise.</strong> Idempotent handlers, backoff, and dead-letter
          queues are what make duplicate delivery survivable instead of dangerous.
        </ListItem>
        <ListItem>
          <strong>A dependency graph is just a different trigger.</strong> It reaches the same queue and the
          same worker pool as a clock-triggered job, it just waits on other jobs instead of a timestamp.
        </ListItem>
      </List>

      <Paragraph delay={2.90}>
        A job scheduler looks, from the outside, like a slightly fancier alarm clock. What it's actually
        managing is a fleet of untrusted, occasionally crashing workers, a calendar that has to stay accurate
        under contention, and a promise that work happens once as far as anyone downstream can tell, even when
        the truth underneath is closer to twice. Get the ownership and the idempotency right, and everything
        else, cron parsing, dependency graphs, priority tiers, is just bookkeeping on top of a design that was
        already sound. Thanks for reading.
      </Paragraph>
    </>
  ),
};
