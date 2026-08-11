import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  InlineCode,
  CodeBlock,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
  ReplicationDiagram,
} from "../components";
import {
  Brain,
  Wrench,
  Eye,
  Inbox,
  Route,
  Cog,
  UserCheck,
  CheckCircle2,
  XCircle,
  Compass,
  Bot,
  ClipboardCheck,
} from "lucide-react";

const loopNodes: DiagramNode[] = [
  { id: "think", label: "Think", sub: "reason about the next step", icon: Brain, color: "text-violet-500", x: 50, y: 15 },
  { id: "act", label: "Act", sub: "call a tool with arguments", icon: Wrench, color: "text-blue-500", x: 80, y: 78 },
  { id: "observe", label: "Observe", sub: "read the tool's result", icon: Eye, color: "text-emerald-500", x: 20, y: 78 },
];

const loopEdges: DiagramEdge[] = [
  { id: "e-think-act", from: "think", to: "act" },
  { id: "e-act-observe", from: "act", to: "observe" },
  { id: "e-observe-think", from: "observe", to: "think" },
];

const stateMachineNodes: DiagramNode[] = [
  { id: "queued", label: "Queued", sub: "task accepted", icon: Inbox, color: "text-slate-500", x: 8, y: 50 },
  { id: "planning", label: "Planning", sub: "break into steps", icon: Route, color: "text-indigo-500", x: 26, y: 50 },
  { id: "acting", label: "Acting", sub: "run the current step", icon: Cog, color: "text-blue-500", x: 46, y: 50 },
  { id: "waiting", label: "Waiting", sub: "blocked on human approval", icon: UserCheck, color: "text-amber-500", x: 70, y: 20 },
  { id: "done", label: "Done", sub: "task complete", icon: CheckCircle2, color: "text-emerald-500", x: 92, y: 50 },
  { id: "failed", label: "Failed", sub: "step errored, no retry", icon: XCircle, color: "text-rose-500", x: 70, y: 80 },
];

const stateMachineEdges: DiagramEdge[] = [
  { id: "e-queued-planning", from: "queued", to: "planning" },
  { id: "e-planning-acting", from: "planning", to: "acting" },
  { id: "e-acting-waiting", from: "acting", to: "waiting" },
  { id: "e-acting-done", from: "acting", to: "done" },
  { id: "e-acting-failed", from: "acting", to: "failed" },
];

const multiAgentNodes: DiagramNode[] = [
  { id: "planner", label: "Planner", sub: "splits the task into subtasks", icon: Compass, color: "text-violet-500", x: 12, y: 50 },
  { id: "worker1", label: "Worker", sub: "flights specialist", icon: Bot, color: "text-blue-500", x: 48, y: 18 },
  { id: "worker2", label: "Worker", sub: "hotel specialist", icon: Bot, color: "text-blue-600", x: 48, y: 50 },
  { id: "worker3", label: "Worker", sub: "budget specialist", icon: Bot, color: "text-blue-400", x: 48, y: 82 },
  { id: "reviewer", label: "Reviewer", sub: "checks and merges results", icon: ClipboardCheck, color: "text-emerald-500", x: 85, y: 50 },
];

const multiAgentEdges: DiagramEdge[] = [
  { id: "e-planner-w1", from: "planner", to: "worker1" },
  { id: "e-planner-w2", from: "planner", to: "worker2" },
  { id: "e-planner-w3", from: "planner", to: "worker3" },
  { id: "e-w1-reviewer", from: "worker1", to: "reviewer" },
  { id: "e-w2-reviewer", from: "worker2", to: "reviewer" },
  { id: "e-w3-reviewer", from: "worker3", to: "reviewer" },
];

export const agentsPlanningAndMemory: BlogPostData = {
  title: "Agents, Planning, and Memory",
  date: "August 11, 2026",
  slug: "agents-planning-and-memory",
  content: (
    <>
      <Paragraph delay={0.10}>
        Ask a chatbot to book a flight to Denver and a hotel for two nights, and a single reply cannot actually do it.
        Booking that trip means checking a calendar for conflicts, searching flights, picking one that fits a budget,
        booking it, then searching hotels near wherever that flight lands, and confirming all of it back to the
        traveler. That is five or six separate actions, each one depending on what the last one returned, and the
        model has to keep track of all of it without losing the thread halfway through.
      </Paragraph>

      <Paragraph delay={0.15}>
        A plain question-answering model has no way to do any of that. It reads a prompt and writes a reply, once,
        and then it is done. An <strong>agent</strong> is what you get when a model like that gets wrapped in a loop,
        given a set of tools it can call, and given somewhere to keep track of what has happened so far. Every piece
        of that wrapping, tool selection, the loop itself, memory, and the guardrails around it, is its own small
        design problem. This post walks through each one.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        Giving the model a menu of tools
      </Heading>

      <Paragraph delay={0.25}>
        The model itself cannot search flights or touch a calendar. What it can do is read a description of a tool,
        decide that the tool is relevant right now, and write out a structured call to it. Each tool gets a name, a
        plain-language description of what it does, and a schema describing exactly what arguments it needs and what
        type each one is. That schema is handed to the model alongside the conversation, every single turn.
      </Paragraph>

      <CodeBlock
        delay={0.30}
        language="JSON"
        code={`{
  "name": "search_flights",
  "description": "Search available flights between two airports on a given date.",
  "parameters": {
    "type": "object",
    "properties": {
      "origin": { "type": "string", "description": "Origin airport code, e.g. SFO" },
      "destination": { "type": "string", "description": "Destination airport code, e.g. DEN" },
      "date": { "type": "string", "description": "Travel date, YYYY-MM-DD" },
      "max_price": { "type": "number", "description": "Maximum fare in USD" }
    },
    "required": ["origin", "destination", "date"]
  }
}`}
      />

      <Paragraph delay={0.35}>
        Given a handful of tools like this, tool selection is the model matching the intent of the conversation
        against each tool's description and picking the one that fits, then filling in the arguments from whatever
        it already knows. Asked to book a Denver trip, it should reach for <InlineCode>search_flights</InlineCode>{" "}
        before <InlineCode>search_hotels</InlineCode>, and it should fill <InlineCode>destination</InlineCode> with{" "}
        <InlineCode>DEN</InlineCode> rather than the literal word "Denver," because the schema said the field
        expects an airport code.
      </Paragraph>

      <Paragraph delay={0.40}>
        None of this is guaranteed to be right. A model can call the wrong tool, invent an argument the tool never
        asked for, or get a date field slightly wrong. That is why almost every real agent validates a tool call's
        arguments against the schema before actually running it, and rejects or asks for a correction on anything
        that does not fit, rather than letting a malformed call reach a real system.
      </Paragraph>

      <Heading level={2} delay={0.45}>
        The loop that keeps the agent going
      </Heading>

      <Paragraph delay={0.50}>
        One tool call is not a plan, it is a single step. What actually produces a multi-step task is a loop
        that keeps handing control back to the model after every action. The pattern most agents use for this
        is often called <strong>ReAct</strong>, short for reason and act. The model writes out a short piece of
        reasoning about what to do next, acts by calling a tool, observes whatever that tool returns, and then
        goes back to reasoning with that new information added to what it already knew.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={380}
        nodes={loopNodes}
        edges={loopEdges}
        caption="Think, act, observe, repeat. Each pass appends its result to the running history, so the next think step sees everything that happened before it."
      />

      <Paragraph delay={0.55}>
        Nothing here is stateful in the way a running program is stateful. The model is still just reading a prompt
        and writing a reply, every single time. What makes it look like it is making progress on a task is that the
        prompt keeps growing, the result of every past action gets appended to the conversation the model sees, so
        by the fifth loop it is reasoning over the flight it already booked and the hotel search it already ran.
        The loop stops once the model decides the task is finished, or once one of the limits described further
        down kicks in first.
      </Paragraph>

      <Heading level={2} delay={0.60}>
        Putting real structure on the loop
      </Heading>

      <Paragraph delay={0.65}>
        A free-running think-act-observe loop works fine for a short task, but it has no memory of where it is
        supposed to be in a longer one. Nothing stops the model from calling the flight search tool three times in
        a row, or trying to book a hotel before a flight has actually been picked. The loop just keeps looping,
        trusting the model's own reasoning to keep the task on track.
      </Paragraph>

      <Paragraph delay={0.70}>
        A <strong>state machine</strong> fixes that by making the task's structure explicit instead of implicit.
        The task is broken into a fixed set of named states, and the only moves allowed are the transitions defined
        between them. A booking task might live in a queued state until it is picked up, move to planning while it
        works out which steps it needs, move to acting while it actually calls tools, and then land in one of three
        places, waiting for a human to approve something risky, done because everything succeeded, or failed
        because a step could not complete.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={420}
        nodes={stateMachineNodes}
        edges={stateMachineEdges}
        caption="A task modeled as explicit states instead of a free-running loop. The agent can only be in one of these states at a time, and only the drawn transitions are legal."
      />

      <Paragraph delay={0.75}>
        The gain is predictability. Debugging a stuck task is a matter of asking which state it is in, not
        replaying pages of reasoning text to guess what the model thought it was doing. Guardrails get attached to
        specific states too, requiring a human sign-off before leaving planning and entering acting on anything
        that spends real money is a rule on a transition, not a hope that the model remembers to ask first.
      </Paragraph>

      <Heading level={2} delay={0.80}>
        What the agent remembers, and for how long
      </Heading>

      <Paragraph delay={0.85}>
        Everything the loop has done so far, every tool call and every result, lives in the context window, the
        text the model actually reads on its next turn. That makes the context window the agent's{" "}
        <strong>short-term memory</strong>. It is fast, it is exactly what the model is reasoning over right now,
        and it is also strictly bounded and temporary. Once a conversation ends, or once enough steps pile up that
        older turns have to be dropped to stay under the model's length limit, whatever lived only in that context
        is simply gone.
      </Paragraph>

      <Paragraph delay={0.90}>
        <strong>Long-term memory</strong> is a separate store that lives outside the model entirely, a database, a
        file, or some other durable system the agent deliberately writes to and reads from. Nothing about the model
        makes this happen automatically, the agent code has to decide what is worth saving and when to save it, and
        decide when a later run should go fetch it back.
      </Paragraph>

      <ReplicationDiagram
        delay={0.08}
        panels={[
          {
            title: "Short-term memory",
            writeLabel: "The context window",
            fanLabel: "holds",
            nodes: ["System instructions", "Tool definitions", "This session's history"],
            highlightNodes: [2],
            note: "Fast and complete, but it disappears the moment the session ends or the window fills up.",
          },
          {
            title: "Long-term memory",
            writeLabel: "A database, file, or store outside the model",
            fanLabel: "holds",
            nodes: ["User preferences", "Past task outcomes"],
            note: "Survives across sessions, because the agent explicitly wrote it there on purpose.",
          },
        ]}
      />

      <Paragraph delay={0.95}>
        The traveler's preferred airline, or the fact that a previous trip to Denver had its hotel booking fall
        through because of a date mix-up, is exactly the kind of thing worth writing to long-term memory once and
        reusing on every future trip, instead of hoping it survives by luck in whatever context happens to still be
        loaded.
      </Paragraph>

      <Heading level={2} delay={1.00}>
        Pulling the right memory back into view
      </Heading>

      <Paragraph delay={1.05}>
        Writing something to long-term memory is only half the job, the agent also has to get the right piece of it
        back into context at the right moment. This step is usually called retrieval, and the core idea is simple
        even though building a good retrieval system on top of a large memory store is its own deep topic. Before
        or during a task, the agent asks its memory store something like "what do I already know that's relevant
        here," and whatever comes back gets folded into the prompt alongside the current task.
      </Paragraph>

      <Paragraph delay={1.10}>
        For an agent, the practical trick is keeping retrieval narrow. Dumping an entire memory store into every
        prompt defeats the point of having a separate store at all, since a huge stuffed prompt is slow, expensive,
        and starts to compete with the working memory the current task actually needs. A good retrieval step pulls
        back a handful of the most relevant facts, this traveler's seat preference, not every trip they have ever
        booked, and leaves the rest sitting in storage until it is actually needed.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        Making the agent check its own work
      </Heading>

      <Paragraph delay={1.20}>
        Left alone, an agent that just keeps acting on its own first draft will carry a mistake forward for as long
        as the loop keeps running. <strong>Reflection</strong> inserts a deliberate pause where the agent, or a
        second call to the same model, looks back at what it just produced and checks it before moving on. After
        drafting a full itinerary, a reflection step might ask the model to check its own work, does the hotel's
        check-in date actually match the flight's arrival date, does the total cost stay under the traveler's
        budget, and only continue once that check comes back clean.
      </Paragraph>

      <Paragraph delay={1.25}>
        This costs an extra call and adds a little latency, which is exactly why it tends to get reserved for the
        steps that matter most, right before an action that is expensive, risky, or hard to undo, rather than after
        every single tool call in the loop.
      </Paragraph>

      <Heading level={2} delay={1.30}>
        When one agent isn't enough
      </Heading>

      <Paragraph delay={1.35}>
        A single agent juggling flights, hotels, and a budget check all at once tends to do a mediocre job of all
        three. One common fix is to split the work across several agents that each specialize in a narrower slice
        of the problem. A <strong>planner</strong> breaks the overall task into subtasks and hands each one to a
        worker built and prompted for exactly that kind of work, a flights specialist, a hotel specialist, a
        budget specialist, and then a reviewer agent checks what came back from each worker before anything gets
        merged into a final plan.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={420}
        nodes={multiAgentNodes}
        edges={multiAgentEdges}
        caption="A planner delegates to specialized workers, and a reviewer checks and merges what comes back before the task is considered finished."
      />

      <Paragraph delay={1.40}>
        A related pattern puts two agents in an explicit debate instead of a hierarchy, one proposes an answer and
        the other is prompted specifically to find problems with it, back and forth for a fixed number of rounds.
        Both patterns are really the same bet, that a single model reasoning once tends to miss things a second
        pass, from a different angle or a different prompt, would catch.
      </Paragraph>

      <Heading level={2} delay={1.45}>
        Guardrails, what the agent is and isn't allowed to do
      </Heading>

      <Paragraph delay={1.50}>
        Giving a model tools also means giving it the ability to do real damage if something goes wrong, so
        <strong> permissions</strong> matter as much as the tools themselves. A read-only tool like checking flight
        prices is cheap to let the agent call freely. A tool that actually charges a card or sends a confirmation
        email is not, and usually sits behind an explicit allowlist, a required human confirmation, or a cap on how
        much it is allowed to spend without asking first. The rule of thumb is that the bar for permission should
        scale with how expensive or hard to undo an action is, not with how confident the model happened to sound
        when it asked to run it.
      </Paragraph>

      <Paragraph delay={1.55}>
        A closely related problem shows up the moment a tool call can fail partway through. A network timeout after
        a booking request has already reached the airline's system leaves the agent unsure whether the booking
        actually went through, and the natural instinct is to retry. If <InlineCode>book_flight</InlineCode> just
        charges the card again on every retry, one slow response turns into two flights bought by accident. An{" "}
        <strong>idempotent</strong> action avoids this by design, the call carries a unique key generated once for
        that specific booking attempt, and the airline's system is built to recognize a repeated key and return the
        original result instead of booking a second flight. Any tool an agent might retry, which in practice is
        most of them, needs this property, or retries themselves become a source of real-world mistakes.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        Watching the agent think
      </Heading>

      <Paragraph delay={1.65}>
        Debugging a multi-step agent after the fact requires seeing every think, act, and observe step it took, not
        just the final message it produced. A <strong>trace</strong> is that full record, every reasoning snippet,
        every tool call with its exact arguments, every result that came back, kept in order. Without one, a wrong
        final booking is nearly impossible to diagnose, since there is no way to tell whether the flight search
        returned bad data, the model misread good data, or a tool call silently failed and got treated as a success.
      </Paragraph>

      <Paragraph delay={1.70}>
        Traces answer "what happened on this one run," but they do not answer "is this agent actually good," which
        is a harder and different question. A trace can look completely reasonable, sensible thoughts, clean tool
        calls, a confident final answer, while the booking underneath it is still wrong. Real{" "}
        <strong>evaluation</strong> needs task-level ground truth, running the agent against a set of tasks with a
        known correct outcome and checking whether it actually reached that outcome, not whether its transcript
        reads well. A trip-booking agent gets evaluated by checking whether the flight and hotel it booked actually
        satisfy the original request, on dates, on budget, on destination, across many test trips, not by having
        someone skim a handful of transcripts and nod along.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Keeping the agent on a leash
      </Heading>

      <Paragraph delay={1.80}>
        A loop with no limit on how long it can run is a real, common failure mode, not a theoretical one. A tool
        call that returns an unexpected error can send a model back into reasoning that concludes the same tool
        should be tried again, and again, each attempt looking locally reasonable while the loop as a whole goes
        nowhere. A <strong>budget</strong> caps this directly, a maximum number of steps, a maximum number of
        tokens spent across the whole run, or a maximum dollar cost, whichever limit an agent hits first ends the
        run rather than letting it spin indefinitely.
      </Paragraph>

      <Paragraph delay={1.85}>
        Hitting a limit is not itself a failure, it is a signal that something needs a different response than
        pretending everything is fine. <strong>Graceful failure</strong> means the agent stops, reports exactly
        where it got stuck and what it already managed to complete, and hands the situation back to a human instead
        of two worse alternatives, looping forever burning through budget for nothing, or quietly claiming the trip
        is booked when it is not. An agent that says "I found flights but couldn't confirm the hotel, here's what I
        have so far" is far more useful than one that goes silent or invents a confirmation number that does not
        exist.
      </Paragraph>

      <Heading level={2} delay={1.90}>
        Takeaways
      </Heading>

      <List delay={1.95}>
        <ListItem>
          Tool selection turns a plain-language request into a structured call, and validating the arguments
          against the tool's schema before running it catches most of what a model gets wrong.
        </ListItem>
        <ListItem>
          The think-act-observe loop is what lets an otherwise stateless model handle a multi-step task, and a
          state machine adds explicit structure on top when a free-running loop gets hard to trust or debug.
        </ListItem>
        <ListItem>
          Short-term memory is the context window, fast but temporary, long-term memory is a store the agent
          writes to and reads from on purpose, and retrieval is what pulls the relevant slice of it back into view.
        </ListItem>
        <ListItem>
          Permissions and idempotent actions are the two guardrails that keep a tool-using agent from causing real
          damage, one by limiting what it can do, the other by making a retried action safe.
        </ListItem>
        <ListItem>
          Traces show what happened on one run, task-level evaluation shows whether the agent actually works, and
          budgets plus graceful failure keep a run that goes wrong from spinning forever or lying about the outcome.
        </ListItem>
      </List>

      <Paragraph delay={2.00}>
        None of these pieces are exotic on their own, a loop, a schema, a database, a limit on how long something
        gets to run. What makes an agent feel capable is having all of them working together, so that a request
        like booking a trip turns into a sequence of well-chosen, safely retried, properly remembered actions
        instead of one long guess. Thanks for reading.
      </Paragraph>
    </>
  ),
};
