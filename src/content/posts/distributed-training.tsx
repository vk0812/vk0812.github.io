import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  List,
  ListItem,
  IconArchitectureDiagram,
  ReplicationDiagram,
} from "../components";
import { RingAllReduceDiagram } from "../components/animations/distributed-training/ConceptViz";
import { Database, Cpu, RefreshCw, Layers, Waypoints, Shuffle, Boxes } from "lucide-react";

export const distributedTraining: BlogPostData = {
  title: "Distributed Training",
  date: "August 8, 2026",
  slug: "distributed-training",
  content: (
    <>
      <Paragraph delay={0.10}>
        Train a small model on a laptop and the whole loop, forward pass, loss, backward pass, weight update, happens on one machine using one processor. That stops working the moment either of two things gets big enough. The training data might be too large to get through in a reasonable amount of time on a single machine. Or the model itself might have more parameters than a single GPU's memory can hold, so it literally cannot load, let alone train.
      </Paragraph>

      <Paragraph delay={0.15}>
        Distributed training is the general answer to both problems, spread the work across many machines so no single one has to carry it all. Handing out the work isn't the hard part, that's mostly bookkeeping. The hard part is putting the pieces back together into one model that trains as if it had seen everything in the right order, without waiting forever on the slowest machine or drowning the network in traffic every time the weights need to update.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Copying the model, splitting the data
      </Heading>

      <Paragraph delay={0.25}>
        The simplest way to spread out training is <strong>data parallelism</strong>. Every worker (a GPU, or a whole machine) gets an identical, full copy of the model. Instead of showing every worker the same data, the training batch gets split into shards, and each worker only ever sees its own shard. Four workers splitting a batch of 512 examples might each work on 128 examples of their own, all at the same time.
      </Paragraph>

      <Paragraph delay={0.30}>
        Each worker runs its own forward pass and backward pass on its own shard, completely independently, and ends up with its own gradient, a direction to nudge the weights in based on what it just saw. Left alone, the four workers would drift apart, each learning from a different slice of the world. So before anyone updates their weights, the gradients get combined across every worker into one shared gradient, usually by averaging, and every worker applies that exact same combined gradient. That's what keeps every copy of the model identical throughout training, no worker ever quietly diverges from the rest.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={440}
        caption="Data parallelism. The same model is copied to every worker, each worker sees a different shard of the data, and the resulting gradients are synced and averaged before anyone updates their weights."
        nodes={[
          { id: "dataset", label: "Full training data", icon: Database, color: "text-blue-500", x: 50, y: 14 },
          { id: "w1", label: "Worker 1", sub: "sees shard 1", icon: Cpu, color: "text-foreground", x: 22, y: 48 },
          { id: "w2", label: "Worker 2", sub: "sees shard 2", icon: Cpu, color: "text-foreground", x: 50, y: 48 },
          { id: "w3", label: "Worker 3", sub: "sees shard 3", icon: Cpu, color: "text-foreground", x: 78, y: 48 },
          { id: "sync", label: "Synced gradients", sub: "averaged, applied to every copy", icon: RefreshCw, color: "text-blue-500", x: 50, y: 82 },
        ]}
        edges={[
          { id: "e1", from: "dataset", to: "w1" },
          { id: "e2", from: "dataset", to: "w2" },
          { id: "e3", from: "dataset", to: "w3" },
          { id: "e4", from: "w1", to: "sync" },
          { id: "e5", from: "w2", to: "sync" },
          { id: "e6", from: "w3", to: "sync" },
        ]}
      />

      <Heading level={2} delay={0.35}>
        Synchronous versus asynchronous updates
      </Heading>

      <Paragraph delay={0.40}>
        <strong>Synchronous training</strong> makes every worker finish computing its gradient before anyone combines and updates. Nobody's weights change until the slowest worker in that step catches up, at which point every worker advances together, in lockstep.
      </Paragraph>

      <Paragraph delay={0.45}>
        <strong>Asynchronous training</strong> removes that wait. A worker computes its gradient, immediately pushes it to wherever weights get combined, and immediately pulls back whatever the current weights happen to be, without checking whether any other worker is still mid-step. This keeps every worker constantly busy instead of idling, but it comes at a real cost. By the time a worker's gradient gets applied, other workers may have already changed the weights it was computed against, so the update ends up based on a version of the model that's already gone stale. This is called gradient staleness, and enough of it can make training noisy or even unstable.
      </Paragraph>

      <Paragraph delay={0.50}>
        The word for a worker that's meaningfully slower than its peers on a given step, a flaky GPU, a slow disk, a noisy network link, is a <strong>straggler</strong>. In synchronous training a single straggler stalls the whole group, since everyone else has to sit and wait for it. In asynchronous training a straggler just contributes a more stale gradient than everyone else, a quieter failure, but a real one. Most large-scale systems still lean synchronous, since it keeps every worker's model identical and its behavior predictable, and deal with stragglers directly (timeouts, dropping a slow worker's contribution for that step) rather than reaching for asynchronous updates to route around them.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        Two ways to combine gradients, parameter servers and all-reduce
      </Heading>

      <Paragraph delay={0.60}>
        Combining gradients across every worker needs an actual mechanism, and two topologies dominate in practice. The older one is the <strong>parameter server</strong>. One or more dedicated machines hold the single master copy of the model's weights. Every worker sends its gradient to a parameter server, the server updates its master copy, and the worker pulls back the new weights before its next step.
      </Paragraph>

      <Paragraph delay={0.65}>
        The newer, now far more common approach is <strong>all-reduce</strong>. There's no dedicated server at all. Workers exchange gradients directly with each other, following some fixed communication pattern, until every worker ends up holding the exact same combined result. Nobody holds a master copy that everyone else depends on, the combined gradient just exists, identically, on every worker at once.
      </Paragraph>

      <ReplicationDiagram
        delay={0.08}
        panels={[
          {
            title: "Parameter server",
            writeLabel: "Parameter server (master weights)",
            fanLabel: "gradients in, weights out",
            nodes: ["Worker 1", "Worker 2", "Worker 3"],
            note: "Every worker sends its gradient to the server and pulls back updated weights, so all traffic funnels through one place.",
          },
          {
            title: "All-reduce",
            writeLabel: "No central server",
            fanLabel: "workers exchange directly",
            nodes: ["Worker 1", "Worker 2", "Worker 3"],
            highlightNodes: [0, 1, 2],
            note: "Workers combine gradients directly with each other, so no single node ever has to carry all the traffic alone.",
          },
        ]}
      />

      <Paragraph delay={0.70}>
        The practical difference is where the traffic goes. A parameter server's incoming and outgoing traffic both scale with the number of workers talking to it, so adding more workers eventually turns that machine, or its network link, into a bottleneck no matter how much the parameters get sharded across several servers. All-reduce spreads the same total amount of communication across every worker instead of funneling it through one place, which is the main reason it scaled better as training runs started using hundreds or thousands of workers.
      </Paragraph>

      <Heading level={2} delay={0.75}>
        Ring all-reduce, passing gradient chunks around a circle
      </Heading>

      <Paragraph delay={0.80}>
        The most common way to actually implement all-reduce is called <strong>ring all-reduce</strong>, and the mechanism itself is the reason it scales so well. Arrange every worker in a logical ring, so each one only ever talks to its two neighbors. Instead of moving each worker's full gradient around as one giant block, split every worker's gradient into as many equal-sized chunks as there are workers. A four-worker ring splits each gradient into four chunks.
      </Paragraph>

      <Paragraph delay={0.85}>
        The process runs in two phases. In the <strong>reduce-scatter</strong> phase, each chunk travels around the ring one hop at a time, and every worker it passes through adds its own piece to the running total. After a chunk has gone all the way around, whichever worker it lands on is holding that chunk fully summed across every worker. Every chunk does this at the same time, just starting from a different worker, so by the end of this phase every worker is holding one complete, fully-summed chunk. In the <strong>all-gather</strong> phase, those finished chunks travel the rest of the way around the ring so that every worker ends up holding all of them, the full, fully-summed gradient.
      </Paragraph>

      <RingAllReduceDiagram
        delay={0.08}
        caption="One of the four gradient chunks moving around a 4-worker ring. Every other chunk is doing the same handoff at the same time, just starting from a different worker, which is what keeps every link in the ring busy at once."
      />

      <Paragraph delay={0.90}>
        Notice what never happens here, no worker ever has to send or receive the entire gradient at once, and no single link in the ring ever carries more traffic than any other. That's the property a parameter server can't offer. Every worker does the same fixed amount of work no matter how many workers join the ring, so the per-worker communication cost stays roughly flat as the cluster grows instead of climbing with it.
      </Paragraph>

      <Heading level={2} delay={0.95}>
        When the model itself doesn't fit, model parallelism
      </Heading>

      <Paragraph delay={1.00}>
        Data parallelism solves the first problem from the opening, too much data to get through fast enough, by copying the model everywhere. It does nothing for the second problem. If a single model is too big to fit in one GPU's memory in the first place, copying it to every worker isn't even possible, there's nothing to copy that fits. <strong>Model parallelism</strong> is the general term for splitting the model itself across multiple devices, so no single device ever has to hold the whole thing. There isn't one way to do this, there are several, and they split along genuinely different axes.
      </Paragraph>

      <Heading level={2} delay={1.05}>
        Tensor parallelism, splitting the math inside one layer
      </Heading>

      <Paragraph delay={1.10}>
        <strong>Tensor parallelism</strong> splits the math inside a single layer. A big matrix multiplication, the core operation inside almost every layer of a modern network, can be split by columns across several GPUs, so each GPU computes its own slice of the output using only its own slice of the weight matrix. A weight matrix split four ways across four GPUs means each one only ever has to store and multiply a quarter of it.
      </Paragraph>

      <Paragraph delay={1.15}>
        The catch is that the GPUs need each other's partial results to reconstruct the real output of that layer, and this has to happen after every single layer, not once per training step. That means tensor parallelism needs an extremely fast connection between the GPUs involved, something like NVLink inside a single machine. It's rarely stretched across separate machines connected only by ordinary networking, the back and forth would be too slow.
      </Paragraph>

      <Heading level={2} delay={1.20}>
        Pipeline parallelism, splitting the model into stages
      </Heading>

      <Paragraph delay={1.25}>
        <strong>Pipeline parallelism</strong> splits the model the other way, by depth instead of by width. Instead of every device holding a slice of every layer, each device holds a few whole, consecutive layers, called a stage. A twelve-layer model split across four workers might give worker one layers one through three, worker two layers four through six, and so on. Data flows through the stages in order, worker one's output (its activations) becomes worker two's input, worker two's output becomes worker three's input, all the way down the chain, and gradients flow back through the same stages in reverse during backpropagation.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={280}
        caption="Pipeline parallelism. The model is split into stages across four workers, activations flow forward stage to stage, and gradients flow back through the same links during backpropagation."
        nodes={[
          { id: "s1", label: "Worker 1", sub: "layers 1-3", icon: Layers, color: "text-foreground", x: 14, y: 50 },
          { id: "s2", label: "Worker 2", sub: "layers 4-6", icon: Layers, color: "text-foreground", x: 38, y: 50 },
          { id: "s3", label: "Worker 3", sub: "layers 7-9", icon: Layers, color: "text-foreground", x: 62, y: 50 },
          { id: "s4", label: "Worker 4", sub: "layers 10-12", icon: Layers, color: "text-foreground", x: 86, y: 50 },
        ]}
        edges={[
          { id: "e1", from: "s1", to: "s2", bidirectional: true },
          { id: "e2", from: "s2", to: "s3", bidirectional: true },
          { id: "e3", from: "s3", to: "s4", bidirectional: true },
        ]}
      />

      <Paragraph delay={1.30}>
        The obvious problem is that worker four has nothing to do until worker one, two, and three have all finished passing their piece along, and once worker one is done with a batch, it sits idle until the next one starts. This dead time is called a <strong>pipeline bubble</strong>. The usual fix is to split a batch into several smaller microbatches and feed them into the pipeline one after another, so that by the time worker one finishes microbatch one, it starts on microbatch two while worker two works on microbatch one, keeping every stage busy in parallel instead of idle most of the time.
      </Paragraph>

      <Heading level={2} delay={1.35}>
        Context parallelism, splitting the sequence itself
      </Heading>

      <Paragraph delay={1.40}>
        <strong>Context parallelism</strong> splits the input sequence itself rather than the model or the batch. Self-attention, the mechanism a transformer uses to let every token look at every other token, needs memory that grows quadratically with sequence length. Push the sequence long enough, a very long document, a long audio transcript, a long chain of reasoning, and even a single layer's activations for that one sequence can outgrow a single GPU's memory, no matter how the model's own weights are split. Context parallelism divides the sequence into contiguous chunks and hands each chunk to a different device, so a 100,000-token sequence might be split into four chunks of 25,000 tokens, each living on its own GPU. The devices then exchange the pieces they need from each other during the attention computation, since a token's attention calculation still depends on every other token, not just the ones sitting on the same device.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Expert parallelism, routing tokens to specialists
      </Heading>

      <Paragraph delay={1.50}>
        <strong>Expert parallelism</strong> splits something different from the others, not layers, not the sequence, but which parts of the model get used at all. A Mixture of Experts (MoE) model replaces a single dense feedforward layer with many smaller networks, called experts, plus a lightweight router that looks at each token and decides which one or two experts should actually process it. Most of the model's total capacity sits unused for any given token, since a token only ever visits a couple of experts instead of all of them.
      </Paragraph>

      <Paragraph delay={1.55}>
        Expert parallelism places different experts on different devices. A layer with four experts might spread them one per GPU across four GPUs. When the router sends a token to an expert that doesn't live on the same device the token is currently on, the token itself gets sent over the network to whichever GPU holds that expert, processed there, and routed back. This is why Mixture of Experts models can have an enormous total parameter count while keeping the actual compute per token low, the total capacity is spread across many experts, but any one token only pays for the one or two it actually visits.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={420}
        caption="Expert parallelism. A router looks at each incoming token and sends it to only one or two experts, spread across separate devices, instead of running every expert on every token."
        nodes={[
          { id: "tokens", label: "Incoming tokens", icon: Waypoints, color: "text-blue-500", x: 50, y: 12 },
          { id: "router", label: "Router", sub: "picks 2 of 4 experts", icon: Shuffle, color: "text-blue-500", x: 50, y: 42 },
          { id: "eA", label: "Expert A", sub: "GPU 0", icon: Boxes, color: "text-muted-foreground", x: 14, y: 78 },
          { id: "eB", label: "Expert B", sub: "GPU 1, selected", icon: Boxes, color: "text-foreground", x: 38, y: 78 },
          { id: "eC", label: "Expert C", sub: "GPU 2, selected", icon: Boxes, color: "text-foreground", x: 62, y: 78 },
          { id: "eD", label: "Expert D", sub: "GPU 3", icon: Boxes, color: "text-muted-foreground", x: 86, y: 78 },
        ]}
        edges={[
          { id: "e0", from: "tokens", to: "router" },
          { id: "e1", from: "router", to: "eA" },
          { id: "e2", from: "router", to: "eB", dashed: false },
          { id: "e3", from: "router", to: "eC", dashed: false },
          { id: "e4", from: "router", to: "eD" },
        ]}
      />

      <Heading level={2} delay={1.60}>
        Sharded optimizer states, stop replicating what you don't need
      </Heading>

      <Paragraph delay={1.65}>
        Even after splitting the model and the data, there's a third thing eating memory that's easy to overlook, the optimizer's own bookkeeping. Adam, the optimizer almost everything trains with today, keeps a running momentum and variance estimate for every single parameter, on top of the parameter itself and its gradient. For every one parameter, there are effectively three or four numbers of state to store, not one, and that overhead can outweigh the memory the raw model weights take up.
      </Paragraph>

      <Paragraph delay={1.70}>
        Plain data parallelism doesn't help here, since every worker holds an identical full copy of the model, which means an identical full copy of that optimizer state too, duplicated across every worker for no real reason, since each worker only ever updates its own copy using the same shared gradient anyway. <strong>Sharded optimizer state</strong>, the idea behind the Zero Redundancy Optimizer (ZeRO), splits that state across workers instead of replicating it, so each worker owns and updates only its own slice, and briefly fetches whichever other slices it needs over the network exactly when a step requires them. More aggressive versions of the same idea extend this sharding to the gradients and then to the parameters themselves, trading a little extra communication for a large cut in how much memory any single worker has to hold.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Communication bottlenecks and stragglers
      </Heading>

      <Paragraph delay={1.80}>
        Every technique above, gradient syncing, pipeline handoffs, expert routing, sharded optimizer fetches, has one thing in common, it moves data over a network between devices. As a training run adds more workers, the total volume of that traffic grows too, and at some point it can exceed what the network connecting the workers can actually carry. When that happens, workers spend more time waiting for data to arrive than actually computing, and adding yet more workers stops making training faster, sometimes it makes it slower. This <strong>communication bottleneck</strong> shapes most of the practical decisions in this post, which kind of parallelism to reach for, how many workers to keep in one tightly-connected group before splitting further, how aggressively to shard optimizer state, are all really answers to the same underlying question, how much can the network in front of you actually carry.
      </Paragraph>

      <Paragraph delay={1.85}>
        Stragglers make this worse in a way that's easy to miss at small scale. A large training run might have thousands of workers, and it only takes one of them running slow, a degraded GPU, a noisy network link, an unlucky scheduling collision with another job on the same machine, for a synchronous step to end up waiting on it. The bigger the cluster, the higher the odds that at least one worker is having a bad moment on any given step, so at scale a straggler stops being a rare annoyance and becomes something that shows up on a schedule. Real systems handle this by timing out slow workers and either dropping their contribution for that step or replacing them mid-run, rather than letting the whole cluster wait indefinitely on whichever machine happens to be unlucky.
      </Paragraph>

      <Heading level={2} delay={1.90}>
        Fault-tolerant checkpoints
      </Heading>

      <Paragraph delay={1.95}>
        Scale turns failure from an edge case into a certainty. A training run using a handful of machines for an afternoon might never see a hardware failure. The same run stretched across thousands of machines for weeks will see GPUs fail, network links drop, and machines get pulled out from under it, not as a hypothetical, but as something that will happen at some point before training finishes.
      </Paragraph>

      <Paragraph delay={2.00}>
        The standard defense is checkpointing, periodically saving the full training state, model weights, optimizer state, and the current step number, to persistent storage, so a failure only costs the time since the last save instead of the entire run. Naive checkpointing can itself become a bottleneck if it stalls every worker while it writes, so production systems checkpoint asynchronously in the background, and shard the checkpoint itself across workers so each one only writes its own slice instead of funneling everything through one machine. When a worker does fail mid-run, an elastic setup can drop that worker, redistribute its share of the work across whoever's left, or bring in a replacement, and resume from the last checkpoint, instead of restarting the entire job from scratch over one bad GPU.
      </Paragraph>

      <Heading level={2} delay={2.05}>
        Takeaways
      </Heading>

      <List delay={2.10}>
        <ListItem>Data parallelism copies the whole model to every worker and splits the data, gradients get combined, usually averaged, across workers before anyone updates their weights.</ListItem>
        <ListItem>Synchronous updates keep every worker's model identical but wait on the slowest one, asynchronous updates keep every worker busy but risk stale gradients.</ListItem>
        <ListItem>All-reduce, commonly implemented as ring all-reduce, spreads communication evenly across every worker instead of funneling it through a parameter server, which is why it scales to much larger clusters.</ListItem>
        <ListItem>Tensor, pipeline, context, and expert parallelism each split a model that's too big for one device along a different axis, a single layer's math, the model's depth, the input sequence, or which experts a token visits.</ListItem>
        <ListItem>Sharded optimizer state, watching for communication bottlenecks and stragglers, and fault-tolerant checkpointing are what keep a training run spanning hundreds of machines actually finishing instead of stalling or losing days of progress to one failure.</ListItem>
      </List>

      <Paragraph delay={2.15}>
        None of this exists because distributed systems are interesting for their own sake. It exists because a single machine ran out of room, either for the data or for the model, and something had to give. Data parallelism, model parallelism in its various forms, sharded optimizer state, all of it is really just a different answer to the same question, how do you split a computation that used to fit on one machine across many, without losing the model's ability to train as if it never got split at all. Thanks for reading.
      </Paragraph>
    </>
  ),
};
