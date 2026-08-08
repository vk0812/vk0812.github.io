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
  ReplicationDiagram,
  ReplicationPanel,
  PaymentIntentStateMachineDiagram,
  IdempotentRetryDiagram,
  LedgerPostingTable,
} from "../components";
import {
  Bell,
  CreditCard,
  Database,
  FileCheck,
  FileText,
  Inbox,
  KeyRound,
  Layers,
  Radio,
  ShieldCheck,
  Store,
  Waypoints,
  Workflow,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Payment attempts",
    lines: [
      { expression: "5M attempts/day ÷ 86,400 seconds", result: "≈ 58/s average" },
      { expression: "58/s × 20 seasonal peak", result: "≈ 1.16K/s peak" },
    ],
    note: "A payment attempt is any call to charge a card, successful or not. Peaks concentrate around a few shopping days a year, not evenly across the month.",
  },
  {
    title: "Webhook events",
    lines: [
      { expression: "5M attempts/day × 3 events each", result: "= 15M events/day" },
      { expression: "15M events/day ÷ 86,400 seconds", result: "≈ 174/s average" },
      { expression: "174/s × 1.3 duplicate and retry overhead", result: "≈ 226/s effective" },
    ],
    note: "Every attempt produces roughly a created, a processing, and a final event. Providers resend on any doubt, so the receiver sees more traffic than the true event count.",
  },
  {
    title: "Ledger growth",
    lines: [
      { expression: "5M attempts/day × 2 ledger rows each", result: "= 10M rows/day" },
      { expression: "10M rows/day × 200 bytes/row", result: "≈ 2 GB/day" },
      { expression: "2 GB/day × 365 days × 7-year retention", result: "≈ 5.11 TB" },
    ],
    note: "Two rows is the minimum for one balanced double-entry posting. Refunds and disputes add more rows later, they never touch the first two.",
  },
  {
    title: "Idempotency store",
    lines: [
      { expression: "5M attempts/day × 1.15 for client retries", result: "≈ 5.75M keys/day" },
      { expression: "5.75M keys/day × 2-day retention window", result: "≈ 11.5M resident keys" },
      { expression: "11.5M keys × 150 bytes each", result: "≈ 1.7 GB resident" },
    ],
    note: "Keys only need to live long enough to cover a realistic retry window. This store is small and fast on purpose, not a permanent record.",
  },
];

const stats: StatItem[] = [
  { label: "Peak payment attempts", value: 1.16, suffix: "K/s", icon: CreditCard, color: "text-blue-500" },
  { label: "Peak webhook load", value: 226, suffix: "/s", icon: Radio, color: "text-teal-500" },
  { label: "Ledger growth, 7 years", value: 5.11, suffix: " TB", icon: Database, color: "text-violet-500" },
  { label: "Idempotency store", value: 1.7, suffix: " GB", icon: KeyRound, color: "text-amber-500" },
];

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/payment_intents",
    description:
      "Creates a payment intent for an amount and currency, using a client-generated idempotency key. Retrying the same key returns the same intent instead of creating a second one.",
  },
  {
    method: "POST",
    path: "/payment_intents/{id}/confirm",
    description:
      "Attaches a tokenized payment method and starts the charge. Returns immediately with the intent's current state, which may still be processing.",
  },
  {
    method: "GET",
    path: "/payment_intents/{id}",
    description:
      "Reads the current state of an intent. Clients poll this after a redirect or a dropped connection instead of guessing what happened.",
  },
  {
    method: "POST",
    path: "/webhooks/provider",
    description:
      "Receives signed, asynchronous status pushes from the payment provider. Verifies the signature, acknowledges fast, and hands the payload to a background worker.",
  },
  {
    method: "POST",
    path: "/payment_intents/{id}/refunds",
    description:
      "Issues a full or partial refund as a new, separate record. It never edits the original charge or its ledger rows.",
  },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "payment_intents",
    fields: [
      { name: "intent_id", note: "primary key" },
      { name: "merchant_id" },
      { name: "amount, currency" },
      { name: "state" },
      { name: "created_at" },
    ],
  },
  {
    name: "payment_attempts",
    fields: [
      { name: "attempt_id", note: "primary key" },
      { name: "intent_id" },
      { name: "provider_reference" },
      { name: "outcome" },
      { name: "created_at" },
    ],
  },
  {
    name: "idempotency_keys",
    fields: [
      { name: "idempotency_key", note: "primary key" },
      { name: "request_fingerprint" },
      { name: "stored_response" },
      { name: "locked_until", note: "nullable" },
    ],
  },
  {
    name: "ledger_entries",
    fields: [
      { name: "entry_id", note: "primary key, never updated" },
      { name: "intent_id" },
      { name: "account, direction" },
      { name: "amount" },
      { name: "posted_at" },
    ],
  },
  {
    name: "webhook_deliveries",
    fields: [
      { name: "event_id", note: "primary key, from provider" },
      { name: "intent_id" },
      { name: "type" },
      { name: "received_at" },
      { name: "processed_at", note: "nullable" },
    ],
  },
  {
    name: "settlement_records",
    fields: [
      { name: "settlement_id", note: "primary key" },
      { name: "provider_reference" },
      { name: "settled_amount" },
      { name: "settlement_date" },
      { name: "reconciled", note: "boolean" },
    ],
  },
];

const failoverPanels: [ReplicationPanel, ReplicationPanel] = [
  {
    title: "Naive dual-region",
    writeLabel: "Payment intent, no shared lock",
    fanLabel: "either region may act",
    nodes: ["Region A", "Region B"],
    note: "During a network partition both regions believe they own the intent, and both can call the provider. That is how one purchase becomes two charges.",
  },
  {
    title: "Fenced single-writer failover",
    writeLabel: "Payment intent, leased to one region",
    fanLabel: "fencing token blocks the other",
    nodes: ["Region A, active", "Region B, standby"],
    highlightNodes: [0],
    note: "Only the region holding the current fencing token may call the provider. A failover hands the token to the new region instead of letting both hold it at once.",
  },
];

const finalNodes: DiagramNode[] = [
  { id: "merchant", label: "Merchant App", icon: Store, color: "text-slate-500", x: 9, y: 7 },
  { id: "gateway", label: "API Gateway", icon: Waypoints, color: "text-blue-500", x: 28, y: 7 },
  { id: "intent", label: "Payment Intent Service", icon: Workflow, color: "text-violet-500", x: 50, y: 7 },
  { id: "vault", label: "Card Tokenization", icon: ShieldCheck, color: "text-teal-500", x: 72, y: 7 },
  { id: "idem", label: "Idempotency Store", sub: "keys and fingerprints", icon: KeyRound, color: "text-amber-500", x: 50, y: 29 },
  { id: "provider", label: "Payment Provider", icon: CreditCard, color: "text-emerald-500", x: 88, y: 29 },
  { id: "ledger", label: "Ledger Database", sub: "append-only, double-entry", icon: Database, color: "text-blue-600", x: 26, y: 51 },
  { id: "outbox", label: "Transactional Outbox", icon: Inbox, color: "text-orange-500", x: 54, y: 51 },
  { id: "webhook", label: "Webhook Receiver", icon: Radio, color: "text-rose-500", x: 78, y: 51 },
  { id: "stream", label: "Event Stream", sub: "Kafka or similar", icon: Layers, color: "text-orange-600", x: 44, y: 73 },
  { id: "reconcile", label: "Reconciliation Worker", sub: "vs settlement file", icon: FileCheck, color: "text-cyan-600", x: 66, y: 73 },
  { id: "notify", label: "Merchant Notification", icon: Bell, color: "text-fuchsia-500", x: 30, y: 93 },
  { id: "settlement", label: "Settlement Files", sub: "from the provider", icon: FileText, color: "text-indigo-500", x: 66, y: 93 },
];

const finalEdges: DiagramEdge[] = [
  { id: "merchant-gateway", from: "merchant", to: "gateway" },
  { id: "gateway-intent", from: "gateway", to: "intent" },
  { id: "intent-vault", from: "intent", to: "vault" },
  { id: "intent-idem", from: "intent", to: "idem", bidirectional: true },
  { id: "vault-provider", from: "vault", to: "provider", bidirectional: true },
  { id: "intent-provider", from: "intent", to: "provider", bidirectional: true },
  { id: "intent-ledger", from: "intent", to: "ledger", bidirectional: true },
  { id: "ledger-outbox", from: "ledger", to: "outbox" },
  { id: "provider-webhook", from: "provider", to: "webhook" },
  { id: "webhook-outbox", from: "webhook", to: "outbox", bidirectional: true },
  { id: "outbox-stream", from: "outbox", to: "stream" },
  { id: "reconcile-ledger", from: "reconcile", to: "ledger", bidirectional: true },
  { id: "stream-notify", from: "stream", to: "notify" },
  { id: "settlement-reconcile", from: "settlement", to: "reconcile", bidirectional: true },
];

const finalPhases: DiagramPhase[] = [
  {
    nodeIds: ["merchant", "gateway", "intent", "vault"],
    edgeIds: ["merchant-gateway", "gateway-intent", "intent-vault"],
    note: "The synchronous path is short on purpose. A merchant creates an intent and attaches a tokenized payment method, and card data never passes through this chain.",
  },
  {
    nodeIds: ["merchant", "gateway", "intent", "vault", "idem", "provider"],
    edgeIds: [
      "merchant-gateway",
      "gateway-intent",
      "intent-vault",
      "intent-idem",
      "vault-provider",
      "intent-provider",
    ],
    note: "Every write checks the idempotency store first, then calls the provider. A retried request finds its earlier result instead of charging a second time.",
    highlight: ["idem", "provider"],
  },
  {
    nodeIds: ["merchant", "gateway", "intent", "vault", "idem", "provider", "ledger", "outbox", "webhook"],
    edgeIds: [
      "merchant-gateway",
      "gateway-intent",
      "intent-vault",
      "intent-idem",
      "vault-provider",
      "intent-provider",
      "intent-ledger",
      "ledger-outbox",
      "provider-webhook",
      "webhook-outbox",
    ],
    note: "The same transaction that updates the intent writes its double-entry ledger rows and an outbox row. The provider's own async webhooks land in a separate receiver, never straight into the ledger.",
    highlight: ["ledger", "outbox"],
  },
  {
    nodeIds: ["merchant", "gateway", "intent", "vault", "idem", "provider", "ledger", "outbox", "webhook", "stream", "reconcile"],
    edgeIds: [
      "merchant-gateway",
      "gateway-intent",
      "intent-vault",
      "intent-idem",
      "vault-provider",
      "intent-provider",
      "intent-ledger",
      "ledger-outbox",
      "provider-webhook",
      "webhook-outbox",
      "outbox-stream",
      "reconcile-ledger",
    ],
    note: "A relay drains the outbox into a durable event stream without ever risking a lost update. The reconciliation worker reads the ledger independently, on its own schedule.",
    highlight: ["stream", "reconcile"],
  },
  {
    nodeIds: [
      "merchant",
      "gateway",
      "intent",
      "vault",
      "idem",
      "provider",
      "ledger",
      "outbox",
      "webhook",
      "stream",
      "reconcile",
      "notify",
      "settlement",
    ],
    edgeIds: [
      "merchant-gateway",
      "gateway-intent",
      "intent-vault",
      "intent-idem",
      "vault-provider",
      "intent-provider",
      "intent-ledger",
      "ledger-outbox",
      "provider-webhook",
      "webhook-outbox",
      "outbox-stream",
      "reconcile-ledger",
      "stream-notify",
      "settlement-reconcile",
    ],
    note: "Downstream, the event stream tells the merchant what happened, while the reconciliation worker diffs the ledger against the provider's own settlement file and flags anything that does not match.",
    highlight: ["notify", "settlement"],
  },
];

export const designingPaymentSystem: BlogPostData = {
  title: "Designing a Payment System",
  date: "August 5, 2026",
  slug: "designing-payment-system",
  content: (
    <>
      <Paragraph delay={0.10}>
        Someone taps Pay at checkout. The app shows a spinner. Three seconds in, the connection drops and the
        screen goes blank. Did the card get charged? Nobody knows in that moment, not the customer holding the
        phone, not the app that sent the request, and for a brief window, not even the provider's own systems
        have fully settled on an answer.
      </Paragraph>

      <Paragraph delay={0.15}>
        That single ambiguous moment is the entire design problem. Everything else, the checkout screen, the
        receipt email, the merchant's dashboard, sits downstream of one hard requirement. The same purchase can
        never be charged twice, and it can never quietly vanish either. A system that gets this right can be
        slow and still be trusted. A system that gets it wrong cannot be trusted no matter how fast it is.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What must be true
      </Heading>

      <List delay={0.25}>
        <ListItem>
          <strong>One durable record per payment.</strong> A merchant creates a payment and gets back one
          object that represents it from the first request through settlement, refund, or dispute.
        </ListItem>
        <ListItem>
          <strong>Card data never sits in this database.</strong> Wherever the raw card number lives, it lives
          behind a boundary built and audited for exactly that job, not inside the application's own tables.
        </ListItem>
        <ListItem>
          <strong>A network failure never causes a double charge.</strong> Retrying a request that may or may
          not have gone through has to be safe, every time, without a human checking first.
        </ListItem>
        <ListItem>
          <strong>Every dollar is provable after the fact.</strong> Support, finance, and an outside auditor can
          all reconstruct exactly what happened to any single payment from durable records alone.
        </ListItem>
        <ListItem>
          <strong>The system degrades instead of breaking.</strong> When the provider itself is slow or
          unreachable, new payments queue or fail cleanly. They do not get lost, and they do not get duplicated.
        </ListItem>
      </List>

      <Paragraph delay={0.30}>
        Notice what is missing from that list. There is no requirement about checkout feeling instant. A
        payment system trades some latency for certainty, deliberately, because the cost of being wrong about
        money is not the same as the cost of being wrong about a search result.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Sizing the flow of money
      </Heading>

      <Paragraph delay={0.40}>
        Assume a mid-size platform processing <strong>5 million payment attempts a day</strong>. That single
        number, plus a seasonal peak multiplier, is enough to see where the real pressure sits. It is not the
        payment traffic itself. It is everything that traffic leaves behind.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Planning numbers for a mid-size payment platform. The write volume is modest, but every write has to be provable, so ledger and idempotency storage grow with retention rules, not with raw traffic."
      />

      <StatTiles items={stats} delay={0.05} />

      <Heading level={2} delay={0.45}>
        The public surface
      </Heading>

      <Paragraph delay={0.50}>
        A payment API is small and deliberate. Nothing in it is optimized for speed of iteration the way a
        typical product endpoint is. Every write requires an idempotency key, and the read path exists mainly so
        a client can ask "what actually happened" instead of guessing.
      </Paragraph>

      <ApiEndpointsTable items={apiEndpoints} delay={0.05} />

      <Heading level={2} delay={0.55}>
        Records built to survive an audit
      </Heading>

      <Paragraph delay={0.60}>
        A payment intent is the anchor record, but it is deliberately thin. The interesting detail lives in
        satellite tables that never overwrite history. A ledger entry, once posted, is never edited again, and a
        webhook delivery keeps its own arrival time separate from when it was actually processed, because those
        two moments can be minutes apart under load.
      </Paragraph>

      <SchemaCards tables={schemaTables} delay={0.05} />

      <Heading level={2} delay={0.65}>
        Trust boundaries, and why correctness outruns speed
      </Heading>

      <Paragraph delay={0.70}>
        Most backend systems treat a slow response as the worst outcome. A payment system treats an ambiguous
        response as the worst outcome, because a slow but truthful "processing" is recoverable, while a fast but
        wrong "success" is a support ticket and possibly a lost refund. That ordering of priorities shapes every
        decision below it. The design accepts an extra round trip, an extra database write, and an extra worker
        almost anywhere it buys certainty about what actually happened to the money.
      </Paragraph>

      <Paragraph delay={0.75}>
        There is also a hard trust boundary running through the middle of the system. On one side sits the
        merchant's own application, which should know as little as possible about raw card data. On the other
        side sits a regulated payment provider that specializes in holding that data safely. The application's
        job is to orchestrate a payment, not to become a target for anyone trying to steal card numbers.
      </Paragraph>

      <Heading level={2} delay={0.80}>
        The payment intent state machine
      </Heading>

      <Paragraph delay={0.85}>
        Rather than track a payment as a single boolean, most designs converge on a small state machine, often
        called a <strong>Payment Intent</strong>. It starts in <InlineCode>created</InlineCode>, may pass through{" "}
        <InlineCode>requires_action</InlineCode> if the card needs extra verification, moves to{" "}
        <InlineCode>processing</InlineCode> while the provider confirms the charge, and ends in exactly one of
        three places, <InlineCode>succeeded</InlineCode>, <InlineCode>failed</InlineCode>, or{" "}
        <InlineCode>cancelled</InlineCode>.
      </Paragraph>

      <PaymentIntentStateMachineDiagram
        delay={0.08}
        caption="A payment intent advances through a small, explicit state machine. Succeeded is a one-way door, while cancelled and failed are the two exits reachable from earlier states."
      />

      <Paragraph delay={0.90}>
        The value of a named state machine, instead of a loose set of flags, is that every part of the system
        can ask the same question in the same way. A support tool, a webhook handler, and a reconciliation job
        all check the intent's current state rather than inventing their own definition of what "done" means.
        Transitions are guarded too. A transition into <InlineCode>succeeded</InlineCode> is only accepted from{" "}
        <InlineCode>processing</InlineCode>, never applied twice, and never reversed by a later event. If money
        needs to come back, that is a new record, not a rewound state.
      </Paragraph>

      <Heading level={2} delay={0.95}>
        Card numbers never enter the building
      </Heading>

      <Paragraph delay={1.00}>
        When a customer types in a card number, that number should reach the payment provider's own hosted
        field or software development kit directly, without passing through the merchant's servers first. The
        provider returns a token, a reference that is useless to anyone who steals it outside that provider's
        systems, and the application stores the token in place of the card. This is called tokenization, and it
        exists specifically to shrink the scope of what has to be protected as sensitive card data. A breach of
        the application's own database, however bad, does not hand an attacker usable card numbers.
      </Paragraph>

      <Paragraph delay={1.05}>
        Tokenization also quietly enables card reuse. Storing a token instead of a number is how a merchant can
        offer a saved payment method or a recurring subscription without ever holding the raw number again after
        the first entry.
      </Paragraph>

      <Heading level={2} delay={1.10}>
        Authorize now, capture on your own schedule
      </Heading>

      <Paragraph delay={1.15}>
        Charging a card is usually two separate provider calls. Authorization checks that the funds are
        available and places a temporary hold, without moving any money yet. Capture actually moves the money,
        and it can happen immediately or days later, for example once an order actually ships. This split exists
        because a lot of real purchases are not final the instant someone clicks buy.
      </Paragraph>

      <Paragraph delay={1.20}>
        This is also why <InlineCode>processing</InlineCode> is a real, sometimes long-lived state rather than a
        brief transitional flicker. An authorized-but-not-captured payment is a legitimate, stable condition. It
        needs its own visibility in the state machine, its own expiration handling if the merchant never
        captures it, and its own line in the ledger once money actually does move.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        Two paths, one intent
      </Heading>

      <Paragraph delay={1.30}>
        Confirming a payment intent looks synchronous from the client's point of view. It sends one request and
        gets one response back quickly. Underneath, the system is really running two paths that only sometimes
        line up in time. The synchronous path validates the request, checks the idempotency key, and starts the
        provider call. The asynchronous path is the provider's own confirmation, arriving later as a webhook,
        sometimes seconds later, sometimes after the original request has already returned a "processing"
        response and moved on.
      </Paragraph>

      <Paragraph delay={1.35}>
        Treating these as one path is the most common design mistake in this space. A client that blocks until
        it hears a final answer ties its own availability to the provider's latency. A client that assumes the
        synchronous response is the final answer will occasionally be wrong, because some payments only resolve
        once the asynchronous webhook lands.
      </Paragraph>

      <Heading level={2} delay={1.40}>
        The response that never arrives
      </Heading>

      <Paragraph delay={1.45}>
        Here is the failure that makes payments hard in a way most systems are not. The application sends a
        charge request. The provider receives it, charges the card, and starts sending a response back. The
        connection drops before that response arrives. From the application's side, this looks identical to a
        request that never reached the provider at all, except that in this version, the card was already
        charged.
      </Paragraph>

      <IdempotentRetryDiagram
        delay={0.08}
        caption="A timeout after the provider already charged the card looks the same as a timeout before it did. Retrying with the same idempotency key returns the original result instead of charging a second time."
      />

      <Paragraph delay={1.50}>
        The fix is not cleverer networking. No amount of retry tuning tells the application, after the fact,
        whether the first attempt landed. The fix is making the retry itself safe regardless of what actually
        happened the first time, which is exactly what an idempotency key is for.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        Exactly-once is a myth, exactly-once effects are not
      </Heading>

      <Paragraph delay={1.60}>
        Networks drop packets, connections reset, and clients time out and try again. No amount of careful
        engineering delivers a message exactly once end to end. What can be engineered is a system where a
        message delivered more than once still only happens once from the customer's point of view. That
        distinction, between delivery and effect, is the whole trick.
      </Paragraph>

      <Paragraph delay={1.65}>
        An <strong>idempotency key</strong> is a value the client generates once per logical attempt and sends
        with every retry of that same attempt. The provider stores the key alongside a fingerprint of the
        request, a hash of the amount, currency, and payment method, and the eventual result. When the same key
        shows up again, the provider compares the new request's fingerprint against the stored one. A match
        means this is a genuine retry, and the stored result comes back untouched, no new charge attempted. A
        key reused with a different fingerprint is a bug or an attack, not a retry, and gets rejected outright.
      </Paragraph>

      <Paragraph delay={1.70}>
        The fingerprint check matters more than it looks. Without it, a client could accidentally reuse an old
        idempotency key for an unrelated, larger charge and have the provider silently return the old small
        result, or worse, get treated as a fresh request. Binding the key to the exact request it originally
        represented closes that gap.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Webhooks that can&apos;t be trusted to arrive once, or in order
      </Heading>

      <Paragraph delay={1.80}>
        The provider's webhook is how the asynchronous side of a payment actually reaches the application.
        Every assumption from the request path applies here too, except now the application is on the receiving
        end instead of the one retrying. A webhook endpoint should assume any event might arrive more than once,
        assume two events for the same intent might arrive out of order, and assume the sender expects a fast
        acknowledgement regardless of how long the real processing takes.
      </Paragraph>

      <Paragraph delay={1.85}>
        Three habits handle all three assumptions. First, verify the provider's signature on every request
        before trusting the payload at all, since this endpoint is public by necessity. Second, use the
        provider's own event ID as an idempotency boundary, recording it before doing any work so a duplicate
        delivery is recognized and skipped. Third, acknowledge receipt in milliseconds and hand the payload to a
        background worker, rather than doing the real state transition inline, so a slow database write never
        turns into a provider-side timeout and an unnecessary resend.
      </Paragraph>

      <Paragraph delay={1.90}>
        Out-of-order delivery is handled the same way the state machine already handles a duplicate request. A
        webhook that tries to move an intent from <InlineCode>succeeded</InlineCode> back to{" "}
        <InlineCode>processing</InlineCode> is rejected by the same guard that rejects an illegal transition
        anywhere else. The event still gets recorded for the audit trail. It just does not get to rewrite
        history.
      </Paragraph>

      <Heading level={2} delay={1.95}>
        A ledger that only ever adds rows
      </Heading>

      <Paragraph delay={2.00}>
        A single mutable balance column answers "what is the balance right now" and nothing else. It cannot
        explain how it got there, and a bug that corrupts it corrupts the only copy of the truth. A{" "}
        <strong>double-entry ledger</strong> replaces that column with an append-only log of balanced postings.
        Every event writes at least two rows, a debit and a credit of equal size, into named accounts, and
        nothing already written is ever changed.
      </Paragraph>

      <LedgerPostingTable
        delay={0.08}
        caption="A $50.00 charge posts three balanced rows. A later refund does not touch them, it posts three new rows that balance on their own."
      />

      <Paragraph delay={2.05}>
        The refund row above is the important part. Reversing a charge does not mean deleting or editing the
        original entry. It means posting a new, independent set of rows that happen to move the same amount back
        the other way. A dispute, or chargeback, works the same way, as a compensating entry that puts a hold on
        the disputed amount without erasing the record of the original charge. The current balance for any
        account is just the sum of every row ever posted to it, which means the balance is always reconstructible
        and always explainable, even years later.
      </Paragraph>

      <Heading level={2} delay={2.10}>
        Getting the ledger out without slowing the write down
      </Heading>

      <Paragraph delay={2.15}>
        The ledger rows for a payment need to commit in the very same database transaction as the payment
        intent's own state change. Otherwise a crash between the two writes leaves an intent marked succeeded
        with no financial record behind it, or a ledger entry for a payment the rest of the system never
        confirmed. But other services, notifications, analytics, the merchant's own webhook, still need to hear
        about that change quickly, and calling them synchronously from inside the transaction would tie the
        database's commit latency to a pile of unrelated network calls.
      </Paragraph>

      <Paragraph delay={2.20}>
        The <strong>transactional outbox</strong> pattern splits the difference. The same transaction that
        writes the ledger rows also writes one row into an outbox table, a plain durable queue that lives in the
        same database. A separate relay process, or a change-data-capture reader watching the database's own
        write-ahead log, picks up new outbox rows and publishes them to an event stream. If the relay crashes
        after publishing but before marking the row as sent, it republishes on restart, which is safe precisely
        because every downstream consumer already treats delivery as at-least-once and de-duplicates by event
        ID.
      </Paragraph>

      <Heading level={2} delay={2.25}>
        Closing the books against the provider&apos;s numbers
      </Heading>

      <Paragraph delay={2.30}>
        Internal confidence is not the same as being correct. Providers periodically deliver a settlement file, a
        batch record of every payment they actually moved money for over some period, independent of anything
        the application's own webhooks reported in real time. A reconciliation job compares that file, row by
        row, against the ledger's own entries for the same period.
      </Paragraph>

      <Paragraph delay={2.35}>
        Most rows match immediately. The interesting cases are the ones that do not. A payment marked{" "}
        <InlineCode>succeeded</InlineCode> internally but missing from the settlement file suggests a webhook
        that was faked, lost, or misread. A settled amount that does not match the ledger's own amount suggests
        a fee change or a currency conversion the application never accounted for. Reconciliation does not fix
        these automatically. It surfaces them, with enough detail attached that a human or a follow-up job can
        decide what compensating entry, if any, needs to be posted.
      </Paragraph>

      <Heading level={2} delay={2.40}>
        Staying open when the provider can&apos;t
      </Heading>

      <Paragraph delay={2.45}>
        A payment provider going slow or unreachable should degrade the system, not take it down. New payment
        intents can still be created and held in <InlineCode>created</InlineCode>, queued for a retry once the
        provider recovers, rather than rejected outright. A circuit breaker around the provider call stops
        piling up requests against a service that is clearly not answering, and returns a fast, honest "try
        again shortly" instead of a slow timeout on every single attempt.
      </Paragraph>

      <Paragraph delay={2.50}>
        Regional failover raises the same ambiguous-failure problem at a larger scale. If one region goes
        unreachable and a second region simply starts handling the same in-flight intents, both regions might
        end up believing they own the call to the provider at the same time. The standard fix is a{" "}
        <strong>fencing token</strong>, a version number tied to whichever region currently holds the lease on a
        given intent. A stale region trying to act after failover presents an old token, gets rejected by the
        provider integration layer, and simply cannot place a second call, even if it never received word that
        failover happened.
      </Paragraph>

      <ReplicationDiagram panels={failoverPanels} delay={0.08} />

      <Heading level={2} delay={2.55}>
        Putting the design together
      </Heading>

      <Paragraph delay={2.60}>
        Laid out end to end, the design has a short synchronous spine and a much longer asynchronous tail. The
        spine only has to create an intent, tokenize a payment method, and start a provider call behind an
        idempotency check. Everything about ledgers, events, notifications, and reconciliation happens after
        that spine has already returned an answer to the client, on its own schedule, safely.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={finalNodes}
        edges={finalEdges}
        phases={finalPhases}
        height={1000}
        delay={0.08}
        caption="The final design keeps a short, idempotent synchronous path at the top and pushes the ledger, event stream, and reconciliation into a durable asynchronous tail underneath it."
      />

      <Heading level={2} delay={2.65}>
        Takeaways
      </Heading>

      <List delay={2.70}>
        <ListItem>
          <strong>Correctness beats latency.</strong> An ambiguous "did it work" is a worse outcome than a slow
          but truthful "still processing," so the design spends effort removing ambiguity rather than shaving
          milliseconds.
        </ListItem>
        <ListItem>
          <strong>Idempotency keys make retries safe, not requests fast.</strong> They exist entirely to make
          the ugly case, a timeout after the charge already happened, harmless to repeat.
        </ListItem>
        <ListItem>
          <strong>A state machine beats a boolean.</strong> A named set of states with guarded transitions gives
          every part of the system, from support tooling to webhook handlers, one shared definition of what
          happened.
        </ListItem>
        <ListItem>
          <strong>The ledger only grows.</strong> Refunds, disputes, and corrections are new balanced rows, never
          edits, which is what makes the whole history reconstructible later.
        </ListItem>
        <ListItem>
          <strong>Reconciliation is not optional.</strong> Internal confidence and actual settled money can drift
          apart quietly, and only a periodic outside comparison catches that before a customer or an auditor
          does.
        </ListItem>
      </List>

      <Paragraph delay={2.75}>
        A payment system looks, from the outside, like any other checkout flow with a spinner and a confirmation
        screen. Underneath, it is a system built around the assumption that networks lie by omission, providers
        answer slowly, and every retry has to be safe by construction rather than by luck. Get the idempotency
        boundary and the ledger right, and the rest of the system gets to be as fast or as slow as it needs to
        be without ever putting a real dollar at risk. Thanks for reading.
      </Paragraph>
    </>
  ),
};
