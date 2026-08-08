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
  TokenLatencyRaceDiagram,
  ContinuousBatchingDiagram,
  PagedKvCacheDiagram,
} from "../components";
import {
  Users,
  Server,
  Radio,
  Database,
  ShieldAlert,
  ListOrdered,
  Gauge,
  Waypoints,
  Cpu,
  MemoryStick,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Requests",
    lines: [
      { expression: "20M daily active users × 4 messages/day", result: "= 80M requests/day" },
      { expression: "80M requests/day ÷ 86,400 seconds", result: "≈ 926 requests/s average" },
      { expression: "926 requests/s × 5 peak multiplier", result: "≈ 4.6K requests/s peak" },
    ],
    note: "The peak multiplier matters more than the daily average. Business-hours traffic is nothing like a 3 a.m. lull.",
  },
  {
    title: "Tokens moved per day",
    lines: [
      { expression: "80M requests × 800 avg input tokens", result: "= 64B input tokens/day" },
      { expression: "80M requests × 400 avg output tokens", result: "= 32B output tokens/day" },
      { expression: "32B output tokens ÷ 86,400 seconds", result: "≈ 370K output tokens/s average" },
    ],
    note: "Input tokens are cheaper to process per token than output tokens, because a prompt is read once while a reply is generated one token at a time.",
  },
  {
    title: "Concurrent generations in flight",
    lines: [
      { expression: "400 output tokens ÷ 40 tokens/s per sequence", result: "= 10s average generation time" },
      { expression: "4.6K requests/s peak × 10s", result: "≈ 46K concurrent generations at peak" },
    ],
    note: "This is Little's Law. A request rate and a service time turn directly into how many generations the fleet must hold open at once.",
  },
  {
    title: "GPU memory for active key-value caches",
    lines: [
      { expression: "800 input tokens + 400 output tokens ÷ 2", result: "≈ 1,000 tokens average active context" },
      { expression: "1,000 tokens × 0.5MB per token (planning assumption)", result: "≈ 500MB per sequence" },
      { expression: "46K concurrent sequences × 500MB", result: "≈ 23 TB of GPU memory for live caches" },
    ],
    note: "The per-token figure is a rough planning assumption, not a specific model's real footprint. The point is that this number is large enough to be the actual limiting resource, not compute.",
  },
];

const stats: StatItem[] = [
  { label: "Peak requests", value: 4630, suffix: "/s", icon: Gauge, color: "text-blue-500" },
  { label: "Concurrent generations", value: 46, suffix: "K", icon: Cpu, color: "text-teal-500" },
  { label: "Output tokens", value: 370, suffix: "K/s", icon: Waypoints, color: "text-violet-500" },
  { label: "Live cache memory", value: 23, suffix: " TB+", icon: Database, color: "text-amber-500" },
];

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/conversations/{conversation_id}/messages",
    description:
      "Persists the user's message immediately, then starts a generation. Returns a generation ID right away, before a single output token exists.",
  },
  {
    method: "GET",
    path: "/conversations/{conversation_id}/generations/{generation_id}/stream",
    description:
      "Opens a Server-Sent Events stream of tokens for a generation already under way. Reconnecting to the same URL resumes from wherever the reply currently stands.",
  },
  {
    method: "POST",
    path: "/generations/{generation_id}/cancel",
    description:
      "Stops a generation early and frees its GPU slot. Whatever already streamed stays part of the conversation.",
  },
  {
    method: "GET",
    path: "/conversations/{conversation_id}",
    description:
      "Returns the stored message history for a conversation, used to resume it in a new browser tab or a new session entirely.",
  },
  {
    method: "GET",
    path: "/usage",
    description:
      "Returns a user's token usage for the current billing window against their tier's quota.",
  },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "conversations",
    fields: [
      { name: "conversation_id", note: "primary key" },
      { name: "user_id" },
      { name: "title" },
      { name: "created_at" },
      { name: "last_message_at" },
    ],
  },
  {
    name: "messages",
    fields: [
      { name: "message_id", note: "primary key" },
      { name: "conversation_id" },
      { name: "role", note: "user, assistant, or system" },
      { name: "content" },
      { name: "created_at" },
    ],
  },
  {
    name: "generation_requests",
    fields: [
      { name: "generation_id", note: "primary key" },
      { name: "message_id", note: "the assistant message it produces" },
      { name: "model_version_id" },
      { name: "status", note: "queued, prefilling, decoding, complete, cancelled, failed" },
      { name: "input_token_count" },
      { name: "output_token_count" },
    ],
  },
  {
    name: "model_versions",
    fields: [
      { name: "model_version_id", note: "primary key" },
      { name: "name" },
      { name: "context_window" },
      { name: "region" },
      { name: "status", note: "active, draining, retired" },
    ],
  },
  {
    name: "usage",
    fields: [
      { name: "user_id, day", note: "composite primary key" },
      { name: "input_tokens" },
      { name: "output_tokens" },
      { name: "quota_limit" },
    ],
  },
];

const splitNodes: DiagramNode[] = [
  { id: "client", label: "Client", icon: Users, color: "text-slate-500", x: 10, y: 50 },
  { id: "apiTier", label: "API Servers", sub: "stateless, autoscale on request count", icon: Server, color: "text-blue-500", x: 35, y: 50 },
  { id: "router", label: "Model Router", sub: "version, region, context, capacity", icon: Waypoints, color: "text-violet-500", x: 60, y: 50 },
  { id: "poolA", label: "GPU Pool", sub: "us-east, model v4", icon: Cpu, color: "text-teal-500", x: 86, y: 22 },
  { id: "poolB", label: "GPU Pool", sub: "us-west, model v4", icon: Cpu, color: "text-teal-600", x: 86, y: 50 },
  { id: "poolC", label: "GPU Pool", sub: "us-east, model v5 canary", icon: Cpu, color: "text-amber-500", x: 86, y: 78 },
];

const splitEdges: DiagramEdge[] = [
  { id: "client-api", from: "client", to: "apiTier" },
  { id: "api-router", from: "apiTier", to: "router" },
  { id: "router-poolA", from: "router", to: "poolA" },
  { id: "router-poolB", from: "router", to: "poolB" },
  { id: "router-poolC", from: "router", to: "poolC" },
];

const finalNodes: DiagramNode[] = [
  { id: "user", label: "User", icon: Users, color: "text-slate-500", x: 10, y: 6 },
  { id: "stream", label: "SSE Stream", sub: "open connection", icon: Radio, color: "text-blue-500", x: 28, y: 16 },
  { id: "api", label: "API Server", icon: Server, color: "text-blue-600", x: 12, y: 28 },
  { id: "convStore", label: "Conversation Store", sub: "durable, message-first", icon: Database, color: "text-amber-500", x: 36, y: 28 },
  { id: "moderation", label: "Moderation Gate", sub: "before and after", icon: ShieldAlert, color: "text-rose-500", x: 12, y: 44 },
  { id: "admission", label: "Admission Queue", sub: "token-budget fair share", icon: ListOrdered, color: "text-violet-500", x: 36, y: 44 },
  { id: "quota", label: "Usage & Quotas", sub: "per-tier limits", icon: Gauge, color: "text-cyan-600", x: 60, y: 44 },
  { id: "router", label: "Model Router", sub: "version, region, context", icon: Waypoints, color: "text-indigo-500", x: 36, y: 60 },
  { id: "workers", label: "GPU Worker Pool", sub: "prefill, decode, batching", icon: Cpu, color: "text-teal-500", x: 22, y: 78 },
  { id: "kvcache", label: "Paged KV Cache", sub: "fixed-size blocks", icon: MemoryStick, color: "text-orange-500", x: 48, y: 78 },
];

const finalEdges: DiagramEdge[] = [
  { id: "user-stream", from: "user", to: "stream", bidirectional: true },
  { id: "stream-api", from: "stream", to: "api", bidirectional: true },
  { id: "api-convStore", from: "api", to: "convStore", bidirectional: true },
  { id: "api-moderation", from: "api", to: "moderation" },
  { id: "moderation-admission", from: "moderation", to: "admission" },
  { id: "admission-quota", from: "admission", to: "quota", bidirectional: true },
  { id: "admission-router", from: "admission", to: "router" },
  { id: "router-workers", from: "router", to: "workers" },
  { id: "workers-kvcache", from: "workers", to: "kvcache", bidirectional: true },
];

const finalPhases: DiagramPhase[] = [
  {
    nodeIds: ["user", "stream", "api"],
    edgeIds: ["user-stream", "stream-api"],
    note: "A message travels in over a connection the API server keeps open, the same connection the reply will stream back through.",
    highlight: ["stream"],
  },
  {
    nodeIds: ["user", "stream", "api", "convStore"],
    edgeIds: ["user-stream", "stream-api", "api-convStore"],
    note: "The API server writes the message to the conversation store before any GPU ever sees it, so a crash later cannot lose it.",
    highlight: ["convStore"],
  },
  {
    nodeIds: ["user", "stream", "api", "convStore", "moderation", "admission", "quota"],
    edgeIds: ["user-stream", "stream-api", "api-convStore", "api-moderation", "moderation-admission", "admission-quota"],
    note: "A moderation gate and an admission queue decide, cheaply, whether this generation is allowed to start and whether GPU capacity actually exists for it right now.",
    highlight: ["moderation", "admission", "quota"],
  },
  {
    nodeIds: ["user", "stream", "api", "convStore", "moderation", "admission", "quota", "router"],
    edgeIds: ["user-stream", "stream-api", "api-convStore", "api-moderation", "moderation-admission", "admission-quota", "admission-router"],
    note: "The router places the request with a worker pool by model version, region, context length, and who actually has room.",
    highlight: ["router"],
  },
  {
    nodeIds: ["user", "stream", "api", "convStore", "moderation", "admission", "quota", "router", "workers", "kvcache"],
    edgeIds: ["user-stream", "stream-api", "api-convStore", "api-moderation", "moderation-admission", "admission-quota", "admission-router", "router-workers", "workers-kvcache"],
    note: "Continuous batching and a paged key-value cache keep the accelerator fleet saturated, and tokens stream back out the same connection they came in on.",
    highlight: ["workers", "kvcache"],
  },
];

export const designingChatgpt: BlogPostData = {
  title: "Designing ChatGPT",
  date: "August 1, 2026",
  slug: "designing-chatgpt",
  content: (
    <>
      <Paragraph delay={0.10}>
        Somebody types a question into a chat box and, less than half a second later, words start appearing.
        The reply itself might take four or five seconds to finish streaming out. Almost nobody notices that
        second number. They noticed the first one.
      </Paragraph>

      <Paragraph delay={0.15}>
        The model that produces the words is already trained by the time any of this happens. What is left to
        design is everything around it, a serving platform that takes a prompt, finds a sliver of very
        expensive, very scarce accelerator time, and gets tokens back to a browser fast enough and reliably
        enough that the whole thing feels instant. That platform, not the model's internals, is the subject
        here.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What must be true
      </Heading>

      <List delay={0.25}>
        <ListItem>
          <strong>Reply fast, not just finish fast.</strong> The user needs to see something moving within a
          few hundred milliseconds, even if the full reply takes several seconds.
        </ListItem>
        <ListItem>
          <strong>Never lose a sent message.</strong> A crash somewhere downstream should not make it look like
          the user's question vanished into nothing.
        </ListItem>
        <ListItem>
          <strong>Protect the accelerators.</strong> GPU capacity is the scarce, expensive resource. Accepting
          more work than the fleet can hold makes every in-flight reply slower at once.
        </ListItem>
        <ListItem>
          <strong>Let a conversation resume.</strong> Closing a laptop mid-reply and opening it again later
          should show the same conversation, not a fresh start.
        </ListItem>
        <ListItem>
          <strong>Be fair across very different requests.</strong> A two-line question and a ten-page document
          summary cost wildly different amounts, and the scheduler needs to know that.
        </ListItem>
      </List>

      <Paragraph delay={0.30}>
        How the model itself was trained, how many parameters it has, and what its attention layers look like
        are all out of scope. None of that changes once the model ships. Everything below is about what happens
        to a request after it lands on a server that already has a working model loaded.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Sizing the load
      </Heading>

      <Paragraph delay={0.40}>
        Start from one input assumption, 20 million daily active users, each sending an average of four
        messages a day. Everything else, request rate, tokens moved, concurrent generations, and GPU memory
        for active sequences, falls out of that single number plus a handful of round planning assumptions.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Planning numbers for a chat serving platform. The concurrency and memory lines matter more than the daily total, because they describe what the accelerator fleet must hold open at any one instant."
      />

      <StatTiles items={stats} delay={0.05} />

      <Paragraph delay={0.45}>
        Notice what those four numbers are really saying. Forty-six thousand conversations are open on GPUs at
        once, and each one is holding onto several hundred megabytes of memory for as long as it stays active.
        That memory, not raw compute, is usually the thing that runs out first.
      </Paragraph>

      <Heading level={2} delay={0.50}>
        The public API is small
      </Heading>

      <Paragraph delay={0.55}>
        A client sends a message and gets back an identifier for a generation that has already started, not the
        finished reply. Everything after that is either streaming tokens for that generation or checking on a
        conversation that already exists.
      </Paragraph>

      <ApiEndpointsTable items={apiEndpoints} delay={0.05} />

      <Heading level={2} delay={0.60}>
        What a conversation is made of
      </Heading>

      <Paragraph delay={0.65}>
        A conversation is a container. A message is one turn inside it, from either the user or the model. A
        generation request is separate from the message it eventually produces, because a generation has a
        life cycle of its own, queued, then prefilling, then decoding, then finished, cancelled, or failed,
        while the message row it fills in is comparatively static.
      </Paragraph>

      <SchemaCards tables={schemaTables} delay={0.05} />

      <Paragraph delay={0.70}>
        Splitting <InlineCode>model_versions</InlineCode> out as its own table looks like overkill until a
        second version of the model needs to run at the same time as the first, during a gradual rollout. Then
        every generation row can point at exactly which version produced it, which turns out to matter later.
      </Paragraph>

      <Heading level={2} delay={0.75}>
        The real deadline is the first token
      </Heading>

      <Paragraph delay={0.80}>
        Two clocks start at the same instant a request lands. One measures <strong>time to first token</strong>,
        how long until the very first piece of the reply appears. The other measures total completion time, how
        long until the whole reply has streamed out. Total completion time is almost always the bigger number,
        and it is almost never the one that matters for how the product feels.
      </Paragraph>

      <TokenLatencyRaceDiagram
        delay={0.05}
        caption="Time to first token versus total response time. The first token lands early and is what the user actually reacts to, while decoding continues for seconds afterward."
      />

      <Paragraph delay={0.85}>
        This is why the reply streams at all instead of arriving as one finished block. A response that took
        four seconds to generate but appeared instantly, word by word, reads as fast. The identical response,
        held back and delivered all at once after four seconds, reads as slow, even though the total wait was
        exactly the same. Every design choice from here on treats time to first token as close to sacred, and
        treats total completion time as something to keep reasonable but not obsess over.
      </Paragraph>

      <Heading level={2} delay={0.90}>
        Save the message before the model ever runs
      </Heading>

      <Paragraph delay={0.95}>
        A generation can take several seconds. Waiting for it to fully finish before writing anything to
        durable storage would mean a crashed worker, a network blip, or a restart in the middle of decoding
        could make it look like the user's own message never arrived. So the write order is deliberate. The
        message row is committed to the conversation store first, a generation request row is created in the
        queued state second, and only then does anything touch a GPU. If everything after that first write
        fails, the user's question still exists and the client can retry cleanly.
      </Paragraph>

      <Paragraph delay={1.00}>
        Streaming happens over Server-Sent Events, a simple one-way channel built on plain HTTP, or a
        WebSocket when the client also needs to push things back, like a cancel signal or a follow-up before
        the first reply is even done. Either way the API server keeps the connection open and forwards tokens
        as the GPU worker produces them, instead of buffering the whole reply first.
      </Paragraph>

      <Paragraph delay={1.05}>
        Two things fall out of treating the generation request as its own durable row instead of something
        that only exists inside one open connection. Cancellation becomes a simple state change, a client can
        call an endpoint that flips the row to cancelled and frees the GPU slot, and whatever streamed before
        that point stays saved as a normal, if short, reply. Reconnect becomes possible too, because if a
        phone loses signal mid-stream, the generation itself keeps running against that same row on the
        server. Reopening the stream connection reads from wherever the row currently stands and picks up the
        remaining tokens, instead of restarting the whole generation from scratch.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        Two kinds of servers
      </Heading>

      <Paragraph delay={1.15}>
        An API server that parses a request, checks auth, and writes a row to a database is cheap to run and
        trivial to scale. Adding ten more of them takes seconds. A GPU worker holding a multi-gigabyte model in
        accelerator memory is nothing like that. Bringing up a new one means loading that model onto the
        device before it can serve a single token, and the hardware itself is both expensive and limited in
        supply. Mixing those two jobs into one fleet would mean scaling the cheap, fast part at the pace of the
        expensive, slow part.
      </Paragraph>

      <Paragraph delay={1.20}>
        So they are separated into different tiers entirely. API servers handle everything that is not the
        model itself, parsing, auth, persistence, moderation, and queueing, and they scale horizontally the
        normal way. GPU workers do nothing but run the model, and a model router sits between the two tiers
        deciding which worker pool actually gets a given request. Routing depends on which model version the
        client asked for, which region keeps latency and data residency reasonable, how long the requested
        context is, since some pools may be configured for a shorter maximum sequence length than others, and,
        critically, which pools currently have room.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={splitNodes}
        edges={splitEdges}
        height={420}
        delay={0.05}
        caption="API servers and GPU workers scale on completely different rules, so a model router sits between them, picking a pool by version, region, context length, and available room."
      />

      <Heading level={2} delay={1.25}>
        Getting in line for a GPU
      </Heading>

      <Paragraph delay={1.30}>
        A normal web service under too much load just gets slower, and adding boxes fixes it within minutes.
        A GPU fleet under too much load does not have that escape hatch, new capacity takes real time to bring
        online, and overloading it degrades every single in-flight reply at once instead of just the newest
        ones. That is the case for <strong>admission control</strong>, a check that runs before a request is
        allowed to consume a GPU slot at all.
      </Paragraph>

      <Paragraph delay={1.35}>
        If a worker pool has room, the request is admitted immediately. If it does not, the request waits in a
        bounded queue instead of being accepted and left to compete for scraps. Once that queue itself is full,
        new requests get an honest rejection with a retry hint rather than a slow, quiet decline. A short
        wait behind a visible queue position beats an accepted request that silently takes ten times longer
        than it should.
      </Paragraph>

      <Heading level={2} delay={1.40}>
        Prefill is a sprint, decode is a jog
      </Heading>

      <Paragraph delay={1.45}>
        Generating a reply happens in two very different phases. In <strong>prefill</strong>, the model reads
        the entire prompt in one pass, computing attention over every input token at once. That is a large,
        highly parallel block of matrix multiplication, and it is the kind of work a GPU is built for, so
        prefill tends to be compute-bound. It runs fast per token processed because so many tokens are being
        processed together.
      </Paragraph>

      <Paragraph delay={1.50}>
        Decode is the opposite shape. Each step produces exactly one new token, using the growing history of
        everything generated and read so far. A single sequence decoding by itself barely uses the chip,
        because the actual arithmetic per step is tiny. What dominates decode instead is moving the accumulated
        history in and out of memory fast enough to feed that small amount of arithmetic. Decode is
        memory-bandwidth-bound, not compute-bound, and that single fact is the reason the next two sections
        exist at all.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        From static batching to continuous batching
      </Heading>

      <Paragraph delay={1.60}>
        Because one decoding sequence wastes most of a GPU, the fix is to decode many sequences together,
        stepping every one of them forward by one token at the same time, batched. The naive version of this,
        static batching, fills a fixed set of slots once and does not touch that batch again until every
        sequence inside it is completely finished. A four-word answer sitting next to a four-paragraph one
        means the short reply's slot sits empty and unused for however long the long one keeps going.
      </Paragraph>

      <Paragraph delay={1.65}>
        <strong>Continuous batching</strong> treats the batch as a living set instead. At every decode step, any
        sequence that just finished is removed and any request waiting in the admission queue is dropped
        straight into that freed slot, all without waiting for the rest of the batch to catch up. The GPU
        stays saturated with useful work almost all the time instead of periodically idling on slots nobody
        is using.
      </Paragraph>

      <ContinuousBatchingDiagram
        delay={0.05}
        caption="Static batching leaves a finished slot idle until the whole batch drains. Continuous batching drops the next waiting request straight into that same freed slot."
      />

      <Paragraph delay={1.70}>
        This one change is usually the single biggest lever on how many concurrent users a fixed number of GPUs
        can serve, bigger than almost any other optimization available at the serving layer.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        The cache that grows with every word
      </Heading>

      <Paragraph delay={1.80}>
        Attention needs to compare a new token against every token that came before it. Recomputing those
        comparisons from scratch at every single decode step would multiply the work by the length of the
        conversation so far. Instead, the model keeps a <strong>key-value cache</strong>, the intermediate
        attention vectors for every token already processed, and just adds one new entry per step. That cache
        has to live in GPU memory for as long as its sequence is active, and it grows the entire time the
        sequence is generating or even just sitting in a long conversation.
      </Paragraph>

      <Paragraph delay={1.85}>
        This is why memory, not compute, is the resource the capacity math above kept bumping into. A naive
        allocator has to guess a sequence's maximum possible length up front and reserve one contiguous block
        of memory sized for it, because reallocating a bigger contiguous region mid-generation is expensive.
        Two problems follow immediately. Short replies waste most of their reservation, and as sequences of
        different lengths finish at different times, the memory that is freed ends up scattered in gaps too
        small and too spread out for a new sequence's contiguous reservation to fit into, even when the total
        free memory would technically be enough.
      </Paragraph>

      <Paragraph delay={1.90}>
        A paged approach borrows the same trick an operating system uses for virtual memory. The cache is cut
        into small, fixed-size blocks, and a sequence's blocks do not need to sit next to each other in
        physical memory at all, a lookup table just tracks which physical block holds which piece of that
        sequence's history. Any free block, anywhere in memory, can serve any sequence that needs one next.
      </Paragraph>

      <PagedKvCacheDiagram
        delay={0.05}
        caption="A sequence's logical key-value cache blocks claim whatever fixed-size physical slots are free, wherever they sit, instead of needing one contiguous reservation."
      />

      <Paragraph delay={1.95}>
        Fragmentation mostly disappears, and because nothing is over-reserved for a worst-case length that
        rarely happens, more sequences fit into the same physical GPU memory at once. That directly raises how
        many concurrent conversations the fleet can hold, which is exactly the number continuous batching was
        trying to keep busy in the first place. The two ideas reinforce each other.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        When one model doesn't fit on one chip
      </Heading>

      <Paragraph delay={2.05}>
        A large enough model simply does not fit in one accelerator's memory, no matter how well its cache is
        managed. Tensor parallelism splits the model's own math across chips, each layer's weight matrix gets
        sliced up so that every GPU holds a shard of every layer, and the chips exchange partial results
        constantly during a single forward pass. That needs very fast interconnects between the chips, since
        the communication happens on every layer of every token.
      </Paragraph>

      <Paragraph delay={2.10}>
        Pipeline parallelism cuts the model the other way, by depth instead of by width. One chip holds the
        first several layers, the next chip holds the following several, and activations get handed down the
        line like stations on an assembly line. Communication happens far less often than with tensor
        parallelism, but keeping every stage of the pipeline busy needs several requests moving through it at
        once, or later stages sit idle waiting on earlier ones. Real deployments often combine both, splitting
        a model by depth across groups of chips and by width within each group, chosen to match how the
        hardware in a given cluster is actually wired together.
      </Paragraph>

      <Heading level={2} delay={2.15}>
        Fairness measured in tokens, not requests
      </Heading>

      <Paragraph delay={2.20}>
        Treating every request as one equal unit of work sounds fair and is not. A two-sentence question and a
        request asking for a detailed rewrite of a long document with a huge conversation history behind it
        consume wildly different amounts of GPU time and memory, even though each is, in request-counting
        terms, exactly one request. Scheduling by request count lets a handful of huge requests starve a much
        larger number of small, cheap ones sitting right behind them.
      </Paragraph>

      <Paragraph delay={2.25}>
        The fix is to schedule and account by <strong>token budget</strong> instead, since tokens processed,
        input and output combined, are what a request actually costs the fleet. A user's allotment over a
        rolling window is denominated in tokens, not in a number of calls, and a maximum generation length caps
        how much any single request can consume in the worst case, so one runaway reply cannot hold a slot
        indefinitely or blow through an entire context window on its own. A heavy user crossing their tier's
        budget gets throttled or deprioritized at the scheduler itself, which is a much more precise lever
        than a blunt requests-per-minute limit that cannot tell a tiny request from a huge one.
      </Paragraph>

      <Heading level={2} delay={2.30}>
        Reusing the part of the prompt that never changes
      </Heading>

      <Paragraph delay={2.35}>
        Every turn in a conversation resends the entire history as the prompt, because the model has no memory
        between calls, everything it knows about the conversation has to be handed to it again each time. That
        means a long system prompt, a set of tool definitions, or the first ten messages of a conversation get
        reprocessed from scratch on every single turn, even though their content has not changed at all.
      </Paragraph>

      <Paragraph delay={2.40}>
        Prompt-prefix caching keeps the key-value cache blocks for a previously seen prefix warm, keyed by its
        exact content, so a later request sharing that same prefix can reuse those blocks instead of running
        prefill over them again. The saving compounds with conversation length, since the shared, reusable
        portion of the prompt only grows as a conversation goes on, and it shows up most directly as a faster
        time to first token on the second and later messages in a thread.
      </Paragraph>

      <Heading level={2} delay={2.45}>
        When a conversation outgrows its context window
      </Heading>

      <Paragraph delay={2.50}>
        Every model has a hard limit on combined input and output length, its context window. A long enough
        conversation, resending its full history every turn, eventually runs into that ceiling no matter how
        efficiently the cache behind it is managed. A few strategies handle this, usually layered together
        rather than used alone. Truncation simply drops the oldest turns once the limit is close, keeping the
        conversation cheap but losing whatever context those turns held. Summarization periodically replaces a
        block of older turns with a shorter, generated summary that keeps the gist while shedding most of the
        token cost. Broader compaction goes further still, restructuring older context into a denser form
        rather than just shortening it, the same general problem any long-running exchange with a model runs
        into once its history stops fitting comfortably in one window.
      </Paragraph>

      <Paragraph delay={2.55}>
        None of these are free. Every one of them trades some amount of detail for staying inside a budget the
        conversation would otherwise blow past, and the choice of which to use, and when, is really a choice
        about which kind of forgetting is least damaging for a given product.
      </Paragraph>

      <Heading level={2} delay={2.60}>
        Moderation, coming and going
      </Heading>

      <Paragraph delay={2.65}>
        A message gets screened before it ever reaches the model, a cheap, fast classifier gate that runs at
        the API layer and rejects clearly disallowed input before it spends a single cycle of expensive GPU
        time. That alone is not enough, because a model can produce something that violates policy even from an
        entirely ordinary prompt, so the output gets screened too, on the way out rather than only once at the
        very end.
      </Paragraph>

      <Paragraph delay={2.70}>
        Because the reply is streaming, output moderation runs incrementally on the chunks as they are
        produced, not just once against the finished text. That lets a violation stop the stream mid-generation
        instead of only catching it after the harmful continuation has already reached the user, at the cost of
        a small amount of added latency on every chunk while the check runs.
      </Paragraph>

      <Heading level={2} delay={2.75}>
        When a GPU worker dies mid-sentence
      </Heading>

      <Paragraph delay={2.80}>
        A worker process can crash, or the hardware underneath it can fault, while a reply is only half
        streamed. Because the generation request row and whatever tokens already reached the client exist
        independently of that one worker, the system always knows exactly how far the reply got, even after the
        worker that was producing it is gone.
      </Paragraph>

      <Paragraph delay={2.85}>
        What it cannot do is pick up decoding from that exact point on a different worker, because the crashed
        worker's in-memory key-value cache went down with it, and rebuilding that state elsewhere would mean
        rerunning prefill over the whole history anyway. So the generation gets marked failed, the partial
        reply stays visible to the user labeled as cut off, and a retry starts an entirely new generation from
        the full conversation history, a fresh prefill under a new generation ID. That new attempt is safe to
        run precisely because it is a distinct request, it does not double-charge quota for output that was
        never delivered, and it does not depend on any state the dead worker was holding.
      </Paragraph>

      <Heading level={2} delay={2.90}>
        Shipping a new model without breaking a live conversation
      </Heading>

      <Paragraph delay={2.95}>
        A new model version does not replace the old one everywhere at once. It starts on a small pool of
        workers taking a trickle of traffic, a canary, precisely because a model's behavior can shift in ways
        ordinary software tests do not catch, and only spreads further once that trickle looks healthy.
      </Paragraph>

      <Paragraph delay={3.00}>
        Retiring the previous version means draining its worker pool rather than switching it off, new
        generations simply stop being routed there while requests already in flight are left to finish
        normally. And because <strong>pinning</strong> a specific conversation, or even one in-flight request,
        to the exact model version it started on is straightforward once every generation row already records
        which <InlineCode>model_version_id</InlineCode> produced it, a user's thread never shifts tone or
        quality mid-conversation just because a newer version rolled out somewhere else in the fleet while they
        were mid-reply.
      </Paragraph>

      <Heading level={2} delay={3.05}>
        Putting the design together
      </Heading>

      <Paragraph delay={3.10}>
        None of these pieces are useful in isolation. A router that ignores GPU load is pointless, an admission
        queue with no continuous batching behind it is only half the fix, and a durable conversation store that
        the streaming path never checks in with cannot actually protect a message. The full design lines them
        up so each one hands off cleanly to the next.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={finalNodes}
        edges={finalEdges}
        phases={finalPhases}
        height={950}
        delay={0.05}
        caption="The full serving path, from an open streaming connection through moderation and admission, model routing, and a GPU worker pool backed by a paged key-value cache."
      />

      <Heading level={2} delay={3.15}>
        Takeaways
      </Heading>

      <List delay={3.20}>
        <ListItem>
          <strong>Optimize for the first token, not the last one.</strong> Streaming turns a several-second
          reply into something that feels instant, because the perceived speed of a chat product is set by
          time to first token, not total completion time.
        </ListItem>
        <ListItem>
          <strong>Persist before you generate.</strong> Writing the user's message durably before touching a
          GPU means a crash mid-reply loses seconds of work, never the question itself.
        </ListItem>
        <ListItem>
          <strong>Treat GPUs as the scarce resource they are.</strong> Admission control, queueing, and
          scheduling by token budget instead of request count keep a fixed, expensive fleet from collapsing
          under a handful of very large requests.
        </ListItem>
        <ListItem>
          <strong>Batch continuously and page the cache.</strong> Together they turn the same GPU fleet into
          one that holds far more concurrent conversations without wasting either compute or memory.
        </ListItem>
        <ListItem>
          <strong>Design for failure and change from the start.</strong> Safe regeneration after a worker
          crash and pinned, drained model rollouts both come from the same habit, treating every generation as
          a durable, resumable record rather than something that only exists inside one open connection.
        </ListItem>
      </List>

      <Paragraph delay={3.25}>
        None of this changes what the model says. It changes whether ten thousand people can ask it something
        at the same moment without the whole system falling over, and whether the answer starts appearing
        before anyone has time to wonder if it is working at all. That is the entire job of the platform
        sitting underneath the reply. Thanks for reading.
      </Paragraph>
    </>
  ),
};
