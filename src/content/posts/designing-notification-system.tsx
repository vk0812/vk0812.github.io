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
  IntentFanoutDiagram,
  PreferenceGateDiagram,
  RetryBackoffDiagram,
} from "../components";
import {
  Activity,
  BellRing,
  Clock,
  FileText,
  GitBranch,
  Inbox,
  ListChecks,
  Mail,
  MessageSquare,
  Radio,
  Send,
  Server,
  SlidersHorizontal,
  Smartphone,
  Waypoints,
} from "lucide-react";

const capacityGroups: CapacityGroup[] = [
  {
    title: "Notification volume",
    lines: [
      { expression: "2B notifications/month ÷ 30 days", result: "≈ 67M notifications/day" },
      { expression: "67M notifications/day ÷ 86,400 seconds", result: "≈ 775 notifications/s average" },
      { expression: "775 notifications/s × 8 campaign-peak", result: "≈ 6.2K notifications/s peak" },
    ],
    note: "A single marketing campaign or a big product event can multiply average traffic by an order of magnitude in minutes.",
  },
  {
    title: "Channel split",
    lines: [
      { expression: "67M/day × 70% push", result: "≈ 46.9M push/day" },
      { expression: "67M/day × 20% email", result: "≈ 13.4M email/day" },
      { expression: "67M/day × 8% in-app", result: "≈ 5.4M in-app/day" },
      { expression: "67M/day × 2% SMS", result: "≈ 1.34M SMS/day" },
    ],
    note: "Push dominates by volume because it is cheap to send. SMS is the smallest share because it is the most expensive per message.",
  },
  {
    title: "Provider calls with retries",
    lines: [
      { expression: "67M notifications/day × 1.15 retry overhead", result: "≈ 77M provider calls/day" },
      { expression: "77M calls/day ÷ 86,400 seconds", result: "≈ 891 calls/s average" },
    ],
    note: "Assume 15% of notifications need at least one retry before a provider accepts them. Every retry is still one call against a provider's rate limit.",
  },
  {
    title: "Devices and delivery history",
    lines: [
      { expression: "500M users × 2.4 devices/user", result: "≈ 1.2B device tokens" },
      { expression: "1.2B tokens × 200 bytes/token", result: "≈ 240 GB token store" },
      { expression: "67M notifications/day × 90-day retention × 300 bytes", result: "≈ 1.8 TB delivery history" },
    ],
    note: "Most users carry a phone and a tablet or a second phone, so the token store is meaningfully larger than the user table.",
  },
];

const stats: StatItem[] = [
  { label: "Peak volume", value: 6.2, suffix: "K notifications/s", icon: BellRing, color: "text-fuchsia-500" },
  { label: "Provider calls", value: 891, suffix: " calls/s", icon: Send, color: "text-teal-500" },
  { label: "Device tokens", value: 1.2, suffix: "B", icon: Smartphone, color: "text-violet-500" },
  { label: "Delivery history", value: 1.8, suffix: " TB+", icon: FileText, color: "text-amber-500" },
];

const apiEndpoints: ApiEndpoint[] = [
  {
    method: "POST",
    path: "/notifications",
    description:
      "Accepts one notification request with an idempotency key. A repeated key returns the original accepted response instead of creating a second notification.",
  },
  {
    method: "POST",
    path: "/notifications/batch",
    description:
      "Accepts up to a few thousand requests in one call so a product service does not open one connection per user for a bulk send.",
  },
  {
    method: "GET",
    path: "/notifications/{notification_id}",
    description:
      "Returns the current state, accepted, sent, delivered, failed, or expired, plus the channel and provider that handled the last attempt.",
  },
  {
    method: "POST",
    path: "/users/{user_id}/preferences",
    description:
      "Updates channel opt-ins, category subscriptions, and quiet-hours windows for one user. Legal opt-outs are enforced here and cannot be overridden by a campaign.",
  },
  {
    method: "POST",
    path: "/devices/register",
    description:
      "Registers or refreshes a device token for a platform. A stale token from a reinstalled app naturally replaces the old one for the same device.",
  },
  {
    method: "DELETE",
    path: "/devices/{token_id}",
    description:
      "Removes a device token immediately, used both by explicit logout and by the cleanup job that reacts to a provider's unregistered-token response.",
  },
];

const schemaTables: SchemaTableSpec[] = [
  {
    name: "notification_requests",
    fields: [
      { name: "request_id", note: "primary key" },
      { name: "tenant_id" },
      { name: "event_type" },
      { name: "idempotency_key", note: "unique" },
      { name: "payload" },
      { name: "created_at" },
    ],
  },
  {
    name: "notification_intents",
    fields: [
      { name: "intent_id", note: "primary key" },
      { name: "request_id" },
      { name: "user_id" },
      { name: "category" },
      { name: "template_id" },
      { name: "priority" },
    ],
  },
  {
    name: "templates",
    fields: [
      { name: "template_id, version", note: "composite primary key" },
      { name: "locale" },
      { name: "channel" },
      { name: "variables_schema" },
    ],
  },
  {
    name: "preferences",
    fields: [
      { name: "user_id, category", note: "composite primary key" },
      { name: "channels_enabled" },
      { name: "quiet_hours_start, quiet_hours_end" },
      { name: "opted_out" },
    ],
  },
  {
    name: "device_tokens",
    fields: [
      { name: "token_id", note: "primary key" },
      { name: "user_id" },
      { name: "platform" },
      { name: "last_seen_at" },
      { name: "status" },
    ],
  },
  {
    name: "delivery_attempts",
    fields: [
      { name: "attempt_id", note: "primary key" },
      { name: "intent_id" },
      { name: "channel" },
      { name: "state" },
      { name: "attempt_count" },
      { name: "next_retry_at" },
    ],
  },
];

const finalNodes: DiagramNode[] = [
  { id: "product", label: "Product Services", icon: Server, color: "text-slate-500", x: 15, y: 6 },
  { id: "gateway", label: "Notification Gateway", sub: "auth, idempotency, batch", icon: Waypoints, color: "text-blue-500", x: 50, y: 6 },
  { id: "intent", label: "Intent Service", sub: "channel independent", icon: GitBranch, color: "text-violet-500", x: 85, y: 6 },
  { id: "template", label: "Template Store", icon: FileText, color: "text-cyan-600", x: 20, y: 24 },
  { id: "preference", label: "Preference Engine", sub: "quiet hours, opt-outs", icon: SlidersHorizontal, color: "text-rose-500", x: 50, y: 24 },
  { id: "scheduler", label: "Scheduler", sub: "immediate or scheduled", icon: Clock, color: "text-amber-500", x: 80, y: 24 },
  { id: "pushQ", label: "Push Queue", icon: BellRing, color: "text-fuchsia-500", x: 12, y: 48 },
  { id: "emailQ", label: "Email Queue", icon: Mail, color: "text-teal-500", x: 38, y: 48 },
  { id: "smsQ", label: "SMS Queue", icon: MessageSquare, color: "text-indigo-500", x: 64, y: 48 },
  { id: "inappQ", label: "In-App Queue", icon: Inbox, color: "text-pink-500", x: 90, y: 48 },
  { id: "fcm", label: "FCM / APNs", icon: Smartphone, color: "text-fuchsia-600", x: 12, y: 70 },
  { id: "emailP", label: "Email Provider", icon: Send, color: "text-teal-600", x: 38, y: 70 },
  { id: "smsP", label: "SMS Provider", icon: Radio, color: "text-indigo-600", x: 64, y: 70 },
  { id: "inappS", label: "In-App Store", icon: ListChecks, color: "text-pink-600", x: 90, y: 70 },
  { id: "outcomes", label: "Delivery Outcomes", sub: "dead-letter, receipts", icon: Activity, color: "text-emerald-500", x: 50, y: 90 },
];

const finalEdges: DiagramEdge[] = [
  { id: "product-gateway", from: "product", to: "gateway" },
  { id: "gateway-intent", from: "gateway", to: "intent" },
  { id: "intent-template", from: "intent", to: "template", bidirectional: true },
  { id: "intent-preference", from: "intent", to: "preference" },
  { id: "preference-scheduler", from: "preference", to: "scheduler" },
  { id: "scheduler-pushQ", from: "scheduler", to: "pushQ" },
  { id: "scheduler-emailQ", from: "scheduler", to: "emailQ" },
  { id: "scheduler-smsQ", from: "scheduler", to: "smsQ" },
  { id: "scheduler-inappQ", from: "scheduler", to: "inappQ" },
  { id: "pushQ-fcm", from: "pushQ", to: "fcm" },
  { id: "emailQ-emailP", from: "emailQ", to: "emailP" },
  { id: "smsQ-smsP", from: "smsQ", to: "smsP" },
  { id: "inappQ-inappS", from: "inappQ", to: "inappS" },
  { id: "fcm-outcomes", from: "fcm", to: "outcomes" },
  { id: "emailP-outcomes", from: "emailP", to: "outcomes" },
  { id: "smsP-outcomes", from: "smsP", to: "outcomes" },
  { id: "inappS-outcomes", from: "inappS", to: "outcomes" },
];

const finalPhases: DiagramPhase[] = [
  {
    nodeIds: ["product", "gateway"],
    edgeIds: ["product-gateway"],
    note: "Every product sends events through one gateway, which checks authentication, validates the payload, and treats a repeated request as one request.",
  },
  {
    nodeIds: ["product", "gateway", "intent", "template"],
    edgeIds: ["product-gateway", "gateway-intent", "intent-template"],
    note: "The gateway hands the event to the intent service, which turns it into a channel-independent notification and loads the right template.",
    highlight: ["intent", "template"],
  },
  {
    nodeIds: ["product", "gateway", "intent", "template", "preference", "scheduler"],
    edgeIds: ["product-gateway", "gateway-intent", "intent-template", "intent-preference", "preference-scheduler"],
    note: "Before anything goes out, the preference engine checks opt-outs, categories, and quiet hours, then the scheduler decides now or later.",
    highlight: ["preference", "scheduler"],
  },
  {
    nodeIds: ["product", "gateway", "intent", "template", "preference", "scheduler", "pushQ", "emailQ", "smsQ", "inappQ"],
    edgeIds: [
      "product-gateway", "gateway-intent", "intent-template", "intent-preference", "preference-scheduler",
      "scheduler-pushQ", "scheduler-emailQ", "scheduler-smsQ", "scheduler-inappQ",
    ],
    note: "Approved notifications fan out into one queue per channel, so a stalled SMS provider never blocks push or email.",
    highlight: ["pushQ", "emailQ", "smsQ", "inappQ"],
  },
  {
    nodeIds: [
      "product", "gateway", "intent", "template", "preference", "scheduler",
      "pushQ", "emailQ", "smsQ", "inappQ", "fcm", "emailP", "smsP", "inappS",
    ],
    edgeIds: [
      "product-gateway", "gateway-intent", "intent-template", "intent-preference", "preference-scheduler",
      "scheduler-pushQ", "scheduler-emailQ", "scheduler-smsQ", "scheduler-inappQ",
      "pushQ-fcm", "emailQ-emailP", "smsQ-smsP", "inappQ-inappS",
    ],
    note: "A dedicated worker pool per channel calls the right provider adapter and turns a queued job into an actual push, email, text, or in-app message.",
    highlight: ["fcm", "emailP", "smsP", "inappS"],
  },
  {
    nodeIds: [
      "product", "gateway", "intent", "template", "preference", "scheduler",
      "pushQ", "emailQ", "smsQ", "inappQ", "fcm", "emailP", "smsP", "inappS", "outcomes",
    ],
    edgeIds: [
      "product-gateway", "gateway-intent", "intent-template", "intent-preference", "preference-scheduler",
      "scheduler-pushQ", "scheduler-emailQ", "scheduler-smsQ", "scheduler-inappQ",
      "pushQ-fcm", "emailQ-emailP", "smsQ-smsP", "inappQ-inappS",
      "fcm-outcomes", "emailP-outcomes", "smsP-outcomes", "inappS-outcomes",
    ],
    note: "Exhausted retries, delivery receipts, and open or click events all flow into one outcomes path that never blocks the next notification.",
    highlight: ["outcomes"],
  },
];

export const designingNotificationSystem: BlogPostData = {
  title: "Designing a Notification System",
  date: "July 31, 2026",
  slug: "designing-notification-system",
  content: (
    <>
      <Paragraph delay={0.10}>
        A food delivery app needs to text a driver, push an alert to a phone, and email a receipt within
        seconds of an order closing, all from one backend event. The same platform also runs marketing
        campaigns that would happily wake up every user in a time zone at three in the morning if nothing
        stopped them.
      </Paragraph>

      <Paragraph delay={0.15}>
        Those two jobs, deliver the important message fast and hold back the unimportant one politely, sound
        similar from the outside. A notification platform has to do both at once, for every product team in a
        company, through providers it does not control and that can go down without warning.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What must be true
      </Heading>

      <List delay={0.25}>
        <ListItem>
          <strong>Accept events from many products.</strong> Orders, payments, chat, and marketing all send
          notification requests through the same front door, in the same shape.
        </ListItem>
        <ListItem>
          <strong>Respect what the user chose.</strong> Channel preferences, category subscriptions, quiet
          hours, and legal opt-outs are checked before a provider is ever called, not after.
        </ListItem>
        <ListItem>
          <strong>Never let one channel block another.</strong> A slow SMS provider should not delay a push
          notification, and a marketing surge should not delay a password reset.
        </ListItem>
        <ListItem>
          <strong>Retry honestly, then stop.</strong> A failed attempt gets retried with a growing delay, and
          a message that has expired or exhausted its attempts stops trying instead of retrying forever.
        </ListItem>
        <ListItem>
          <strong>Track the outcome without slowing delivery.</strong> Sent, delivered, opened, and clicked
          states are recorded, but recording them never sits on the path a message travels to reach a device.
        </ListItem>
      </List>

      <Paragraph delay={0.30}>
        One more distinction shapes almost every later decision. A <strong>transactional</strong> notification,
        a password reset code or a shipping update, is something the user is waiting for and expects. A{" "}
        <strong>promotional</strong> notification, a flash sale or a re-engagement nudge, is something the
        platform wants to send but the user did not ask for at that exact moment. The two travel through the
        same pipes, but policy treats them very differently once preferences and quiet hours get involved.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        Sizing the fan-out
      </Heading>

      <Paragraph delay={0.40}>
        Assume a platform sending <strong>2 billion notifications a month</strong> across every channel for
        every product team it serves, split roughly 70 percent push, 20 percent email, 8 percent in-app, and 2
        percent SMS, the ordering that reflects both cost per message and how often each channel gets used.
      </Paragraph>

      <CapacityMathDiagram
        groups={capacityGroups}
        delay={0.05}
        caption="Planning numbers for a multi-channel notification platform. Push carries most of the volume, SMS carries the least because it costs the most per message."
      />

      <StatTiles items={stats} delay={0.05} />

      <Heading level={2} delay={0.45}>
        A gateway that says no early
      </Heading>

      <Paragraph delay={0.50}>
        Every product service talks to the same <strong>Notification Gateway</strong> instead of calling
        push, email, and SMS providers directly. The gateway checks who is calling, validates the request
        shape, and treats a repeated idempotency key as the same request rather than a new one. A batch
        endpoint exists for the same reason a single endpoint does, so a service sending ten thousand receipts
        does not open ten thousand connections to do it.
      </Paragraph>

      <ApiEndpointsTable items={apiEndpoints} delay={0.05} />

      <Heading level={2} delay={0.55}>
        From event to intent
      </Heading>

      <Paragraph delay={0.60}>
        An incoming event describes what happened in the sender's terms, an order ID, a carrier, a tracking
        link. It says nothing about push tokens or email addresses. The intent service turns that event into a
        channel-independent record, a <strong>Notification Intent</strong>, that names a category and a
        template and lets every downstream channel fill in its own delivery details.
      </Paragraph>

      <CodeBlock
        delay={0.65}
        language="JSON"
        code={`// Incoming event from the orders service
{
  "event_type": "order.shipped",
  "tenant_id": "acme-retail",
  "user_id": "u_88213",
  "idempotency_key": "ord-772001-shipped",
  "data": { "order_id": "ord-772001", "carrier": "UPS" }
}

// Resulting notification intent, channel independent
{
  "intent_id": "int_9f2c1a",
  "category": "order_updates",
  "template_id": "order_shipped_v3",
  "variables": { "carrier": "UPS" },
  "priority": "high"
}`}
      />

      <Paragraph delay={0.70}>
        Separating the event from the intent means a product team never needs to know that push uses Firebase
        Cloud Messaging or that email runs through a separate vendor. It only needs to describe what happened
        and pick a category. Everything channel-specific happens later, closer to the provider that actually
        cares about it.
      </Paragraph>

      <SchemaCards tables={schemaTables} delay={0.05} />

      <Heading level={2} delay={0.75}>
        Templates that survive translation
      </Heading>

      <Paragraph delay={0.80}>
        A template is not just a string with blanks in it. It has a locale, so the same category can render in
        a dozen languages. It has a version, so a campaign written last month keeps rendering the way it did
        even after a copywriter edits the current version. Renders should also validate that every variable a
        template expects (a carrier name, a discount amount) was actually supplied, so a missing field fails
        loudly at request time instead of shipping a broken sentence to a million inboxes.
      </Paragraph>

      <Paragraph delay={0.85}>
        Localization adds a wrinkle worth naming directly. Word order, pluralization, and even which variables
        exist can change between languages, so a template engine that just swaps words into a fixed English
        sentence structure breaks the moment it meets a language with different grammar. Treating each locale
        as its own complete template, rather than one template with a translation layer bolted on, avoids that
        failure mode.
      </Paragraph>

      <Heading level={2} delay={0.90}>
        Preferences and quiet hours come before delivery
      </Heading>

      <Paragraph delay={0.95}>
        Once an intent has a category and a rendered template, it still has to pass the recipient's own rules.
        A user can turn off a whole channel, unsubscribe from a category, or set quiet hours that hold
        promotional messages until morning. Legal opt-outs sit above all of that and cannot be overridden by
        campaign settings, a marketing dashboard should not be able to accidentally re-enable a channel a user
        opted out of for compliance reasons.
      </Paragraph>

      <PreferenceGateDiagram
        delay={0.05}
        caption="A password reset and a promotional message hit the same category and quiet-hours checks at the same moment. The transactional message bypasses quiet hours, the promotional one waits for morning."
      />

      <Paragraph delay={1.00}>
        Transactional notifications generally bypass quiet hours entirely, a password reset that waits until
        8 a.m. is not a password reset anymore. Promotional notifications respect the window, and a held
        message is typically rescheduled rather than dropped, so a shopper who missed a sale notice at 11 p.m.
        still sees it once quiet hours end.
      </Paragraph>

      <Heading level={2} delay={1.05}>
        Immediate or scheduled
      </Heading>

      <Paragraph delay={1.10}>
        Not every intent should fire the instant it clears preferences. A shipping update goes out immediately.
        A weekly digest or a rescheduled quiet-hours message has a target time attached instead, and the
        scheduler is the component that holds it until then. Under the hood this usually looks like a delayed
        queue or a database row with a <InlineCode>send_at</InlineCode> timestamp that a periodic sweep picks
        up, rather than something exotic, the interesting design decision is keeping this step separate from
        the channel queues below it, so a scheduled campaign and an immediate alert share the same downstream
        machinery once their time comes.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        One queue per channel, with priority lanes
      </Heading>

      <Paragraph delay={1.20}>
        After scheduling, one approved intent can turn into up to four separate jobs, one for each channel the
        user allows. Giving push, email, SMS, and in-app their own queue and their own worker pool means a
        provider outage or a slow vendor on one channel never backs up the others. A marketing campaign
        flooding the email queue should never make a push notification wait behind it either, so most designs
        add a second axis inside each channel's queue, a small number of priority lanes, so a password reset or
        a security alert always drains ahead of a promotional batch on the same channel.
      </Paragraph>

      <IntentFanoutDiagram
        delay={0.05}
        caption="One notification intent fans out into one queue per channel. Each channel keeps its own workers and its own failure domain from this point forward."
      />

      <Heading level={2} delay={1.25}>
        Provider adapters and the device-token lifecycle
      </Heading>

      <Paragraph delay={1.30}>
        Each channel's worker pool calls a provider adapter that knows how to talk to one specific vendor, one
        adapter for Firebase Cloud Messaging (FCM) and Apple Push Notification Service (APNs), one for the
        email vendor, one for the SMS vendor. The adapter's job is narrow on purpose, take a rendered message
        and a destination, and turn it into the exact request shape that provider expects.
      </Paragraph>

      <Paragraph delay={1.35}>
        Push needs a device token to mean anything, and tokens are messy in practice. A user can own several
        devices, a token can go stale when an app is reinstalled or a device is wiped, and a provider will
        often tell the platform directly that a token is no longer valid by returning an unregistered or
        not-found response on a delivery attempt. A cleanup worker listens for that response and removes the
        dead token immediately, rather than waiting for a scheduled sweep, so the platform stops paying for
        delivery attempts nobody will ever see.
      </Paragraph>

      <Heading level={2} delay={1.40}>
        At-least-once delivery needs idempotent attempts
      </Heading>

      <Paragraph delay={1.45}>
        A worker can crash after calling a provider but before recording that it did, and the retry logic
        described below can legitimately fire twice for the same underlying event. The system's only honest
        guarantee is at-least-once delivery, so every attempt needs to be safe to repeat. A deduplication
        window, keyed on the intent ID and channel, catches the case where two workers process the same queued
        job within a short span, and a <strong>collapse key</strong> lets a provider merge several updates
        about the same thing, three delivery-progress pushes for one order, into whichever is freshest instead
        of stacking three notifications on a lock screen.
      </Paragraph>

      <Heading level={2} delay={1.50}>
        Retries end somewhere
      </Heading>

      <Paragraph delay={1.55}>
        A provider timeout or a five-hundred response is not automatically a reason to give up, but it is also
        not a reason to hammer the same provider immediately. <strong>Exponential backoff with jitter</strong>{" "}
        spaces retries out with a growing delay, doubling roughly each time, and adds a small random offset so
        thousands of queued retries for the same outage do not all wake up in the same millisecond and
        recreate the outage. When a provider is explicit about it and returns a <InlineCode>Retry-After</InlineCode>{" "}
        header, that value overrides the platform's own backoff schedule, the provider knows its own recovery
        time better than a guess does.
      </Paragraph>

      <RetryBackoffDiagram
        delay={0.05}
        caption="Three failed attempts with a growing wait between them. By the time the third attempt fails, the message has already passed its own expiry, so it moves to the dead-letter queue instead of trying a fourth time."
      />

      <Paragraph delay={1.60}>
        Retries cannot continue forever, both because a message can become useless with age (nobody needs a
        five-day-old "your ride has arrived" alert) and because an endless retry loop against a struggling
        provider makes that provider's outage worse. Every intent carries an expiry, and once an attempt would
        happen after that expiry, or after a fixed attempt count, it stops retrying and lands in a{" "}
        <strong>dead-letter queue</strong> instead. That queue is not silent failure, it is a place a human or a
        monitoring job can inspect afterward to see what never made it out and why.
      </Paragraph>

      <Heading level={2} delay={1.65}>
        Rate limits, topics, and fan-out shape
      </Heading>

      <Paragraph delay={1.70}>
        A single push provider has its own limits, and a platform serving many product teams needs rate limits
        at several levels at once, per provider so nobody exceeds a vendor contract, per tenant so one product
        team cannot starve another, and per campaign and per user so one enthusiastic marketer cannot send the
        same user forty messages in an hour. These limits sit in front of the provider call, not after it, a
        request that would exceed a limit gets queued or rejected before it ever reaches the vendor.
      </Paragraph>

      <Paragraph delay={1.75}>
        Delivery shape matters too. Sending the same message to five million subscribers of one topic is much
        cheaper through a provider's topic fan-out feature, which lets the platform publish once and have the
        provider handle distribution to every subscribed device, than by looping over five million individual
        tokens and calling the provider that many times. Individual token delivery is still necessary for
        anything personalized, a shipping update naturally has one recipient, but a broadcast announcement
        should use topic fan-out whenever the content is identical for everyone receiving it.
      </Paragraph>

      <Heading level={2} delay={1.80}>
        Budgets, digests, and fatigue
      </Heading>

      <Paragraph delay={1.85}>
        Respecting individual preferences is not enough if the sum of everything a user is opted into still
        adds up to twenty notifications a day. A notification budget caps how many low-priority messages a
        user receives in a window, and when several candidates compete for a limited number of slots, a
        ranking step picks the ones most likely to matter rather than sending strictly in arrival order. Some
        categories are naturally suited to digesting, batching ten "someone liked your post" events into one
        summary notification instead of ten separate interruptions. None of this applies to transactional
        messages, a budget exists to protect attention from things that can wait, not to delay things the user
        is actively waiting for.
      </Paragraph>

      <Heading level={2} delay={1.90}>
        Watching delivery without slowing it down
      </Heading>

      <Paragraph delay={1.95}>
        Sent, delivered, opened, and clicked events are valuable, but writing them synchronously on the
        delivery path would mean an analytics database hiccup could slow down every push notification in the
        system. Delivery attempts, provider callbacks, and client-side open and click events instead publish to
        a durable event stream, and separate consumers write them into an analytics store on their own schedule.
        The delivery path only ever writes what it needs to retry correctly, everything else about how a
        campaign performed is reconstructed downstream.
      </Paragraph>

      <Heading level={2} delay={2.00}>
        When a provider goes down
      </Heading>

      <Paragraph delay={2.05}>
        A push, email, or SMS vendor having a bad day is a when, not an if. Where a real alternative exists, a
        secondary email or SMS vendor, for instance, the adapter layer can fail over automatically, some
        platforms even split ordinary traffic across two vendors so failover is a well-exercised path rather
        than a switch nobody has flipped in a year. Push through Firebase Cloud Messaging or Apple Push
        Notification Service has no real substitute, since each is the only route to its own operating system,
        so the only honest response to an outage there is graceful degradation, hold the message, keep retrying
        within its expiry window, and let the in-app channel carry the update in the meantime if the user opens
        the app.
      </Paragraph>

      <Heading level={2} delay={2.10}>
        Putting the design together
      </Heading>

      <Paragraph delay={2.15}>
        Every piece above earns its place because a notification platform juggles two different jobs at once.
        It has to move fast for the message someone is actually waiting for, and it has to be genuinely willing
        to slow down, hold back, or drop the message nobody asked for right now. The full design keeps those
        two instincts from fighting each other by checking policy once, early, and then letting each channel
        run its own queue, its own retries, and its own recovery from there.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={finalNodes}
        edges={finalEdges}
        phases={finalPhases}
        height={1050}
        delay={0.05}
        caption="The final notification platform builds from the gateway and intent service, through preference and scheduling checks, out to per-channel queues and provider adapters, ending in one outcomes path for retries and receipts."
      />

      <Heading level={2} delay={2.20}>
        Takeaways
      </Heading>

      <List delay={2.25}>
        <ListItem>
          <strong>Separate the event from the intent.</strong> A channel-independent notification intent lets
          every product team describe what happened once, without knowing anything about push tokens or
          SMS vendors.
        </ListItem>
        <ListItem>
          <strong>Check policy before touching a provider.</strong> Preferences, opt-outs, and quiet hours
          run before a delivery attempt, not after, so a held message never reaches a device it should not.
        </ListItem>
        <ListItem>
          <strong>Give every channel its own failure domain.</strong> Separate queues and worker pools mean a
          struggling SMS vendor never slows down push, email, or in-app delivery.
        </ListItem>
        <ListItem>
          <strong>Retry with a plan to stop.</strong> Exponential backoff with jitter, a Retry-After header,
          an expiry, and a dead-letter queue turn provider trouble into recoverable work instead of an
          infinite loop.
        </ListItem>
        <ListItem>
          <strong>Protect attention like a scarce resource.</strong> Rate limits, budgets, and digesting exist
          because being correct about delivery is not the same as being welcome in someone's pocket.
        </ListItem>
      </List>

      <Paragraph delay={2.30}>
        A notification platform never gets to see the moment its message actually lands, no confirmation that
        a phone buzzed on a nightstand, no view of a face reading an email. All it can do is make good
        decisions with the information it has, respect what a user asked for, retry what is worth retrying,
        and stop cleanly when it is not. Thanks for reading.
      </Paragraph>
    </>
  ),
};
