import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  BlogImage,
  List,
  ListItem,
} from "../components";

export const messageQueues: BlogPostData = {
  title: "Message Queues",
  date: "July 2, 2026",
  slug: "message-queues",
  content: (
    <>
      <Paragraph delay={0.1}>
        Upload a video to any platform and you get a response back almost instantly, long before that video is anywhere close to being watchable in every resolution it eventually ships in. Behind the scenes, someone still has to transcode that file into 360p, 480p, 720p, and 1080p, which is real, slow, CPU heavy work. The trick that makes the upload feel instant is that none of that work happens inside the request that received the file.
      </Paragraph>

      <Paragraph delay={0.15}>
        Do it the naive way and the flow looks like this. The client uploads the file, and the same server that received it turns around and transcodes every resolution, runs whatever checks it needs to, and only then tells the client the upload succeeded. That one request is now doing minutes of work before it can return. One crashed transcoding step takes the whole upload down with it, and a burst of uploads at once means every one of those requests is stuck waiting behind CPU heavy work that has nothing to do with just accepting a file.
      </Paragraph>

      <Paragraph delay={0.2}>
        A message queue breaks that chain. The server accepting the upload just saves the file and drops a message onto a queue describing the job, then responds to the client immediately. A separate pool of worker processes, the consumers, pull jobs off that queue whenever they have capacity and do the actual transcoding on their own time. If uploads spike, the queue just gets longer for a while. Nothing crashes, nothing blocks, the workers catch up when they catch up.
      </Paragraph>

      <Heading level={2} delay={0.25}>
        How It Works
      </Heading>

      <BlogImage
        delay={0.3}
        size="lg"
        src="/blog/message_queues/working.png"
        alt="How it works. A producer, the API or backend service, publishes a job to a message queue, and a consumer, a worker service, consumes it. Below, a video transcoding pipeline example shows a client uploading a video to an API server, which enqueues a job to the queue and returns an immediate response, while a transcode worker processes the job asynchronously and stores the result in S3."
        caption="Figure 1. The API server enqueues a transcoding job and responds immediately, while a pool of transcode workers pulls jobs off the queue and writes the result to storage."
      />

      <Paragraph delay={0.35}>
        The <strong>producer</strong> here is the API server. It publishes a job onto the queue and moves on. The queue itself is just a durable buffer sitting between the two sides. The <strong>consumer</strong>, a pool of transcode workers, pulls jobs off that buffer whenever it is ready, processes the file, and writes the result to storage. Producer and consumer never talk to each other directly. Both only ever talk to the queue.
      </Paragraph>

      <Heading level={2} delay={0.4}>
        Pull, Push, and Picking a Broker
      </Heading>

      <BlogImage
        delay={0.45}
        size="lg"
        src="/blog/message_queues/implementation_patterns.png"
        alt="Three implementation patterns. Amazon SQS is a pull based queue where workers poll for messages, used for tasks like image resizing jobs. Apache Kafka is a disk persistent streaming log split into partitions where consumers read at their own offset, used for event streaming. RabbitMQ is a push based broker that routes messages through an exchange to multiple queues and pushes them to consumers, used for workflows like order processing."
        caption="Figure 2. Amazon SQS, Apache Kafka, and RabbitMQ solve the same problem three different ways, pull based, log based, and push based."
      />

      <Paragraph delay={0.5}>
        How a consumer actually gets a message differs across systems, and the choice has real consequences. A pull based queue like Amazon SQS puts the worker in charge, it polls the queue whenever it wants more work. That is simple to reason about and scales horizontally without any coordination, but you own writing sensible backoff so an idle worker is not hammering an empty queue with wasted calls. A push based broker like RabbitMQ flips this. Workers register with the broker and send heartbeats to prove they are alive, and the broker pushes work to whichever registered worker is free, handling deduplication and retries for you. The tradeoff is that the broker now owns more state and can become the bottleneck if enough workers register at once.
      </Paragraph>

      <Paragraph delay={0.55}>
        Apache Kafka is a third shape entirely, a disk persisted, append only log rather than a queue that empties as it is read. A message published to a queue like SQS is consumed once and gone. A message published to a Kafka topic just sits in the log, and any number of independent consumer groups can read through it at their own pace, each tracking its own position. That difference is what makes fan out easy. Say an order gets placed and three completely different systems need to react to it, billing, inventory, and analytics. Publish one event to a topic and let all three subscribe independently, instead of the producer needing to know who is listening or push to each system one by one. Kafka honestly deserves its own post, this is barely scratching the surface.
      </Paragraph>

      <Heading level={2} delay={0.6}>
        Delivery Guarantees
      </Heading>

      <BlogImage
        delay={0.65}
        size="md"
        src="/blog/message_queues/reliability.png"
        alt="Reliability. A publisher sends a message to the queue, which delivers it to a consumer. On success the consumer sends an ACK back through the queue. On failure or timeout there is no ACK, and the message becomes visible again. At-least-once delivery means duplicates can occur, so consumers must be idempotent and safe to reprocess messages."
        caption="Figure 3. A consumer acknowledges a message once it succeeds. A timeout with no ACK puts the message back for another consumer to try."
      />

      <Paragraph delay={0.7}>
        Whatever the transport, a queue has to decide what happens to a message after handing it to a consumer. Most systems solve this with a <strong>visibility timeout</strong>. Once a consumer pulls a message, the queue hides it from other consumers for some window of time. If the consumer finishes and sends an acknowledgment, the message is deleted for good. If the timeout expires with no acknowledgment, maybe the consumer crashed, maybe it just took too long, the queue assumes the worst and puts the message back for someone else to try.
      </Paragraph>

      <Paragraph delay={0.75}>
        That single mechanism produces three different delivery guarantees depending on how it is tuned. <strong>At-most-once</strong> is fire and forget, a message goes out once and if it is lost, it is lost, which is fine for something like metrics where a dropped data point does not matter. <strong>At-least-once</strong> is the default almost everyone actually runs, a message keeps getting redelivered until it is acknowledged, which means the same message can legitimately arrive twice. <strong>Exactly-once</strong>, a message processed once and only once, sounds like what everyone wants and is genuinely hard to guarantee end to end. Most systems that claim it are really doing at-least-once delivery plus enough bookkeeping on the consumer side to fake the effect.
      </Paragraph>

      <Heading level={2} delay={0.8}>
        Idempotent Consumers
      </Heading>

      <Paragraph delay={0.85}>
        That bookkeeping is called <strong>idempotency</strong>. It just means processing the same message more than once does not change the outcome. Say a message tells a consumer to set your profile picture to this photo. Deliver it once or five times, the profile picture ends up exactly the same, so a duplicate is harmless. Compare that to a message that says add one like, where processing it twice makes the count wrong.
      </Paragraph>

      <Heading level={2} delay={0.9}>
        Ordering Guarantees
      </Heading>

      <BlogImage
        delay={0.95}
        size="md"
        src="/blog/message_queues/ordering.png"
        alt="Ordering and partitioning. A producer publishes messages tagged with partition keys such as user-1, user-2, and user-3 into the queue. Messages with the same key are delivered to the same consumer in order, while different keys are processed in parallel across different consumers."
        caption="Figure 4. Messages tagged with the same partition key land on the same worker in order. Different keys run in parallel."
      />

      <Paragraph delay={1.0}>
        Order is the other guarantee people assume for free and do not actually get for free. Run several consumers in parallel and a faster worker can finish message three before a slower one finishes message two, so the plain idea of first in first out breaks the moment you parallelize. What most systems actually offer instead is ordering per <strong>partition key</strong>. Tag every message for the same logical entity, say every transaction for one bank account, with the same key, and the queue guarantees those particular messages are handled by the same worker in the order they arrived. Different keys land on different workers and run fully in parallel, with no ordering promise between them.
      </Paragraph>

      <Paragraph delay={1.05}>
        You can force strict global ordering across everything by collapsing down to a single partition, but then you also collapse down to a single consumer, since only one worker can safely own a partition at a time. That is the real cost of ordering. It is not free, it is a direct trade against parallelism, so the right move is almost always to order within a key and let different keys run wide.
      </Paragraph>

      <Heading level={2} delay={1.1}>
        Backpressure and Consumer Lag
      </Heading>

      <Paragraph delay={1.15}>
        None of this holds if consumers cannot keep up. A producer that outpaces its consumers just makes the queue grow, and an unbounded queue eventually means unbounded memory or disk, plus every message sitting in it is getting staler by the second. The gap between how much has been produced and how much has actually been consumed is usually called <strong>consumer lag</strong>, and it is one of the first things worth putting a dashboard on, since a slowly growing lag is an early warning that something downstream is falling behind, well before anything actually breaks.
      </Paragraph>

      <Paragraph delay={1.2}>
        The fixes are the predictable ones. Autoscale the consumer fleet against the lag metric so more workers spin up when the backlog grows. Or push back on the producer side, some form of <strong>backpressure</strong> that slows down whoever is writing once the queue passes a threshold, rather than letting it grow without limit. Either way, the point is to notice the imbalance and react to it, not let the queue quietly absorb a problem that is only going to get worse.
      </Paragraph>

      <Heading level={2} delay={1.25}>
        Dead Letter Queues and Retries
      </Heading>

      <BlogImage
        delay={1.3}
        size="lg"
        src="/blog/message_queues/dlq.png"
        alt="Dead letter queue. A producer publishes a message that the queue delivers to a consumer. On success the consumer ACKs and the message is marked processed. On failure, such as an invalid or unprocessable message, it is routed instead to a separate dead letter queue, isolating bad messages for inspection, alerts, and reprocessing."
        caption="Figure 5. A message that keeps failing gets routed to a dead letter queue instead of blocking the ones behind it."
      />

      <Paragraph delay={1.35}>
        Not every message fails because a worker was briefly overloaded. Some messages are just bad, malformed, missing a field the consumer needs, referencing something that got deleted, and no number of retries will ever make them succeed. Naively retrying forever, or pushing a failed message straight back onto the same queue, just means that one poisoned message keeps consuming worker time and can back up everything behind it.
      </Paragraph>

      <Paragraph delay={1.4}>
        The standard fix is a retry limit paired with a <strong>dead letter queue</strong>. A message gets a handful of attempts, and once it exhausts them without an acknowledgment, it gets routed to a separate DLQ instead of back to the main queue. The main pipeline keeps moving, and the DLQ becomes a place to alert on, inspect by hand, and either fix and replay or discard. It is a small pattern, but it is the difference between one bad message being an annoyance and one bad message taking down a pipeline.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Takeaways
      </Heading>

      <List delay={1.5}>
        <ListItem>A message queue decouples whoever creates work from whoever performs it, so producers and consumers can scale, fail, and recover independently.</ListItem>
        <ListItem>Push based brokers like RabbitMQ manage delivery for you, pull based ones like SQS put the worker in control, and a log based system like Kafka lets many independent consumer groups replay the same stream, which is what makes fan out to multiple systems easy.</ListItem>
        <ListItem>Almost every real system runs at-least-once delivery. Duplicates are expected, and it is the consumer's job to be idempotent, not the queue's job to guarantee exactly-once.</ListItem>
        <ListItem>Ordering is only guaranteed within a partition key. Global ordering is possible but it costs you all the parallelism a queue was supposed to buy you.</ListItem>
        <ListItem>Watch consumer lag and give failure prone pipelines a dead letter queue, so a struggling consumer or one poisoned message never turns into an outage.</ListItem>
      </List>

      <Paragraph delay={1.55}>
        A message queue looks like a simple mailbox sitting between two services, but almost every hard problem in distributed systems shows up in miniature once you actually build one, duplicate delivery, ordering, backpressure, poison messages. Get comfortable with those ideas and picking between SQS, Kafka, and RabbitMQ stops being trivia and starts being an actual design decision. Thanks for reading.
      </Paragraph>
    </>
  ),
};
