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
} from "../components";
import { ToolCallRoundTripDiagram } from "../components/animations/tool-use-function-calling-and-mcp/ConceptViz";
import { AppWindow, Cable, Server, Wrench } from "lucide-react";

const mcpNodes: DiagramNode[] = [
  { id: "host", label: "Coding assistant", sub: "the host application", icon: AppWindow, color: "text-slate-500", x: 10, y: 50 },
  { id: "clientA", label: "MCP client", sub: "talks to the GitHub server", icon: Cable, color: "text-blue-500", x: 34, y: 25 },
  { id: "clientB", label: "MCP client", sub: "talks to the weather server", icon: Cable, color: "text-blue-500", x: 34, y: 75 },
  { id: "serverGithub", label: "GitHub MCP server", sub: "a separate process", icon: Server, color: "text-indigo-500", x: 60, y: 25 },
  { id: "serverWeather", label: "Weather MCP server", sub: "a separate process", icon: Server, color: "text-indigo-500", x: 60, y: 75 },
  { id: "toolsGithub", label: "Tools", sub: "create_pull_request, create_issue", icon: Wrench, color: "text-emerald-500", x: 88, y: 25 },
  { id: "toolWeather", label: "Tools", sub: "get_weather", icon: Wrench, color: "text-emerald-500", x: 88, y: 75 },
];

const mcpEdges: DiagramEdge[] = [
  { id: "e-host-a", from: "host", to: "clientA" },
  { id: "e-host-b", from: "host", to: "clientB" },
  { id: "e-a-server", from: "clientA", to: "serverGithub" },
  { id: "e-b-server", from: "clientB", to: "serverWeather" },
  { id: "e-server-tools-a", from: "serverGithub", to: "toolsGithub" },
  { id: "e-server-tools-b", from: "serverWeather", to: "toolWeather" },
];

export const toolUseFunctionCallingAndMcp: BlogPostData = {
  title: "Tool use, function calling, and the Model Context Protocol",
  date: "August 12, 2026",
  slug: "tool-use-function-calling-and-mcp",
  content: (
    <>
      <Paragraph delay={0.10}>
        Ask a chat assistant what the weather is like in Denver right now, and if it has no way to check, it can
        only guess. It might say something plausible sounding, based on the season or the general climate, but it
        has no actual idea. A language model, left on its own, only ever produces text. It reads a prompt and
        writes a reply. It cannot open a browser, run a script, look up a row in a database, or send an email,
        because none of those things live inside the model's weights.
      </Paragraph>

      <Paragraph delay={0.15}>
        <strong>Tool use</strong> is the fix for exactly that gap. It gives the model a way to trigger a real
        action somewhere else and get a real result back, instead of quietly making something up that sounds
        right. Once a model can call a weather tool instead of guessing, "what's the weather in Denver" stops
        being a question about training data and becomes a question the model can actually go find the answer to.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What a tool call actually looks like
      </Heading>

      <Paragraph delay={0.25}>
        Every tool a model can use gets described the same way, no matter what it actually does behind the
        scenes. A tool has a name, a plain-language description of what it does and when to use it, and a
        parameter spec listing every argument's name, type, and its own short description. That spec is usually
        written in JSON schema, a format for describing the shape of a piece of JSON data.
      </Paragraph>

      <CodeBlock
        delay={0.30}
        language="JSON"
        code={`{
  "name": "get_weather",
  "description": "Returns the current temperature and conditions for a given city. Use this for any question about current weather.",
  "parameters": {
    "type": "object",
    "properties": {
      "city": { "type": "string", "description": "The city name, e.g. 'Denver'" },
      "unit": { "type": "string", "enum": ["celsius", "fahrenheit"], "description": "Temperature unit to return" }
    },
    "required": ["city"]
  }
}`}
      />

      <Paragraph delay={0.35}>
        This whole schema gets handed to the model alongside the conversation, every single turn, right next to
        the actual messages. When someone asks about the weather in Denver, the model reads that schema, matches
        the intent of the question against the tool's description, and decides <InlineCode>get_weather</InlineCode>{" "}
        fits. Instead of answering directly, it emits a structured request naming the tool and filling in the
        arguments it can infer from the question.
      </Paragraph>

      <CodeBlock
        delay={0.40}
        language="JSON"
        code={`{
  "tool_call": {
    "name": "get_weather",
    "arguments": { "city": "Denver" }
  }
}`}
      />

      <Paragraph delay={0.45}>
        The important part is who does what next. The model itself never touches a weather service, a browser, or
        anything outside the conversation, it only writes text, and this structured call is still just text,
        formatted so the surrounding application can parse it reliably. The <strong>application</strong>, not the
        model, is the thing that actually executes the call, reaches out to whatever weather service it's wired
        up to, gets back a real temperature and condition, and feeds that result back into the conversation as a
        new message. Only then does the model continue, and this time it has something real to work with instead
        of a guess.
      </Paragraph>

      <Paragraph delay={0.50}>
        This is a back and forth, not a single step. A model can call a tool, look at what came back, decide it
        still needs another tool, call that one too, and keep going for as many rounds as the task needs. Nothing
        about the mechanism caps it at one call. A travel-planning request might trigger a flight search, then a
        hotel search based on where that flight lands, then a currency conversion, each one waiting for the
        previous result before it runs.
      </Paragraph>

      <ToolCallRoundTripDiagram
        delay={0.08}
        caption="One full tool call round trip. The model sends a value out, the host runs the real code, a real result comes back, and the model resumes with that result already in view."
      />

      <Heading level={2} delay={0.55}>
        The schema is doing more work than it looks like
      </Heading>

      <Paragraph delay={0.60}>
        It's tempting to treat a tool's description as documentation, a comment for humans skimming a list of
        integrations. In practice the model reads that description every time it decides whether to use the tool
        at all, so a vague one causes real mistakes. A description that just says "gets data" gives the model
        almost nothing to match against, so it either reaches for the tool when it shouldn't, ignores it when it's
        exactly what was needed, or fills in arguments as a guess rather than something backed by the
        description.
      </Paragraph>

      <Paragraph delay={0.65}>
        Compare that to the description already sitting in the schema above, returns the current temperature and
        conditions for a given city, use this for any question about current weather. That sentence does two jobs
        at once, it tells the model when to reach for this specific tool over some other one, and it tells the
        model roughly what shape of answer to expect back. The same care applies to individual parameters. A city
        field described only as "location" invites the model to pass a full address, a zip code, or a landmark
        name interchangeably, when the tool underneath might only accept a bare city name. A badly specified enum
        or date format causes the same kind of failure, the model passes something that looks reasonable and
        isn't valid, and the call fails before it ever reaches real code.
      </Paragraph>

      <Paragraph delay={0.70}>
        None of this is a documentation nicety, it's an actual reliability lever available to whoever builds the
        tool. The code behind <InlineCode>get_weather</InlineCode> might be perfectly correct and still get called
        at the wrong moment, or called with the wrong argument, if the words describing it don't give the model
        enough to work with.
      </Paragraph>

      <Heading level={2} delay={0.75}>
        One protocol instead of custom code for every tool
      </Heading>

      <Paragraph delay={0.80}>
        Everything above assumed the application already had working code wired up to call some real service, its
        own weather client, written and maintained by whoever built that application. Before long that becomes its
        own problem. If ten different chat applications all want to let their model check the weather, look
        something up on GitHub, or query a company database, each one has historically had to write and maintain
        its own integration code for every tool, and any tool provider wanting to reach multiple applications had
        to write a separate integration for each one right back. Ten applications and ten tools was potentially a
        hundred separate pieces of glue code, each one slightly different.
      </Paragraph>

      <Paragraph delay={0.85}>
        The <strong>Model Context Protocol</strong>, MCP for short, fixes that by standardizing the interface
        instead of leaving every pair of application and tool to invent its own. A tool provider builds one
        server once, speaking one protocol, and any application that also speaks that protocol can use it without
        writing custom integration code for that specific tool.
      </Paragraph>

      <Paragraph delay={0.90}>
        MCP splits the picture into three roles. The <strong>host</strong> is the actual application a person is
        using, the thing responsible for orchestrating the whole conversation, a coding assistant built into an
        editor, say. The <strong>client</strong> is a small piece of protocol code that lives inside the host, one
        per connected server, whose only job is speaking MCP to that one server on the host's behalf. The{" "}
        <strong>server</strong> is a separate process, often written by someone else entirely, that exposes a set
        of tools and sometimes other things too, files, or ready made prompt templates, over that same protocol.
      </Paragraph>

      <Paragraph delay={0.95}>
        Picture that coding assistant connecting out to a GitHub MCP server that exposes tools like creating a
        pull request or looking up an issue, and separately to a weather MCP server exposing the same{" "}
        <InlineCode>get_weather</InlineCode> tool from earlier. The coding assistant is the host either way, and
        it keeps a separate client for each server it talks to, one client speaking to the GitHub server, another
        speaking to the weather server. The person using the editor never has to know or care that two completely
        different teams built those two servers.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.08}
        height={380}
        nodes={mcpNodes}
        edges={mcpEdges}
        caption="A host running one client per connected server. Each server is a separate process exposing its own tools over the same protocol."
      />

      <Paragraph delay={1.00}>
        The model itself still doesn't know or care whether a tool came from an MCP server or was hardcoded
        straight into the host. From where it sits, every tool still just looks like a name, a description, and a
        parameter spec, the same as it always did. MCP only changes how the host obtains that schema and routes
        the call, not the mechanics of function calling covered above.
      </Paragraph>

      <Heading level={2} delay={1.05}>
        Finding out what tools exist without hardcoding anything
      </Heading>

      <Paragraph delay={1.10}>
        None of this requires the host to know ahead of time which tools a server offers. When a client connects
        to a server, it can send a request asking, in effect, what tools do you have, and the server answers with
        the current list, names, descriptions, and parameter specs included. The real mechanism behind this is
        usually a method called <InlineCode>tools/list</InlineCode>, and it can return results a page at a time
        rather than the entire list at once, which matters once a server offers a lot of tools.
      </Paragraph>

      <Paragraph delay={1.15}>
        This is what makes MCP genuinely pluggable rather than just tidier. Because the host asks rather than
        assumes, a brand new MCP server can be pointed at an existing application with zero code changes on the
        host side. Connect the weather server for the first time and the coding assistant simply discovers{" "}
        <InlineCode>get_weather</InlineCode> exists, the same way it discovered whatever GitHub tools it already
        had wired up. Some servers go further and can tell a connected client mid-session that their tool list
        changed, so a host doesn't even need to reconnect to notice a new tool appeared or an old one went away.
      </Paragraph>

      <Heading level={2} delay={1.20}>
        More tools, worse choices
      </Heading>

      <Paragraph delay={1.25}>
        A host that only ever talks to one weather server has a short, easy to read tool list. A host connected to
        a dozen MCP servers, each contributing its own handful of tools, can easily end up with dozens or even
        hundreds of tools registered at once. That sounds like a purely good thing, more capability available,
        but it comes with a real cost to reliability, one that shows up in practice, not just in theory.
      </Paragraph>

      <Paragraph delay={1.30}>
        Two things go wrong as the tool count grows. Every tool's schema competes for the model's attention
        alongside the actual conversation, so a long enough list of tool descriptions starts to crowd out the
        context the model is supposed to be reasoning over. And a lot of real tools genuinely look similar to each
        other once there are enough of them, a <InlineCode>get_current_weather</InlineCode> tool and a{" "}
        <InlineCode>get_weather_forecast</InlineCode> tool from two different servers, say. The model has to pick
        correctly between options that are legitimately close together, not just avoid an obviously wrong one.
      </Paragraph>

      <Paragraph delay={1.35}>
        One real mitigation is grouping or namespacing tools so related ones are described together instead of
        dumped into one flat list, the way file paths group related files under a shared prefix. Another is
        adding a retrieval step in front of tool selection itself. Instead of handing the model every registered
        tool on every turn, the host first narrows the full set down to the handful actually relevant to the
        current request, using something as simple as a keyword match or as involved as its own small retrieval
        model, and only those few schemas get included in what the model actually sees.
      </Paragraph>

      <Heading level={2} delay={1.40}>
        Every registered tool costs something, whether it gets used or not
      </Heading>

      <Paragraph delay={1.45}>
        The reliability problem above is about the model choosing badly. There's a separate, more mechanical cost
        sitting underneath it. Every registered tool's full schema, its name, its description, every parameter's
        name, type, and description, gets serialized into text and included in the model's context on every single
        turn, whether or not that tool ends up getting called at all.
      </Paragraph>

      <Paragraph delay={1.50}>
        A host with a hundred verbose tool schemas can burn a meaningful chunk of the available context window
        before the actual conversation even starts. That's not hypothetical, it's the same context budget the
        conversation history, the system instructions, and everything else all have to share, and tool schemas
        that never get used still take their cut of it turn after turn.
      </Paragraph>

      <Paragraph delay={1.55}>
        Pagination helps here too. The same <InlineCode>tools/list</InlineCode> mechanism that supports
        discovering tools a page at a time can also mean a host doesn't have to load every tool from every
        connected server up front. Some hosts go further and load full tool schemas on demand, only pulling in the
        handful actually needed right before a turn that's likely to use them, rather than keeping the entire
        catalog resident in context for the whole conversation. It's the same instinct as the retrieval step from
        the section above, aimed at the token budget instead of at decision quality, and in a system connected to
        enough servers, both problems tend to need solving at once.
      </Paragraph>

      <Heading level={2} delay={1.60}>
        Takeaways
      </Heading>

      <List delay={1.65}>
        <ListItem>
          Tool use lets a model trigger a real action and get a real result back, instead of producing plausible
          sounding text about what it thinks the answer is.
        </ListItem>
        <ListItem>
          Function calling is a turn taking loop. The model emits a structured call, the application executes it,
          the result comes back as a new message, and the model continues from there.
        </ListItem>
        <ListItem>
          A tool's schema is a reliability lever, not documentation. A vague name or description causes wrong
          tool choices and malformed arguments just as surely as a bug in the underlying code would.
        </ListItem>
        <ListItem>
          MCP standardizes the interface between hosts and tool providers, one server built once, discoverable by
          any compliant host, instead of custom integration code for every pairing.
        </ListItem>
        <ListItem>
          More registered tools means both worse selection accuracy and a bigger permanent tax on the context
          window, and grouping, retrieval, and on demand schema loading are the practical answers to each.
        </ListItem>
      </List>

      <Paragraph delay={1.70}>
        None of this makes a model any smarter on its own. It still only reads text and writes text. What tool
        use and MCP change is what's sitting on the other end of that text, a real weather service, a real
        database, a real GitHub repository, instead of nothing. Getting the schema, the loop, and the plumbing
        right is what turns a model that talks about the world into one that can actually reach into it. Thanks
        for reading.
      </Paragraph>
    </>
  ),
};
