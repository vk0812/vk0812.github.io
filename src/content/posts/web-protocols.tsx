import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  InlineCode,
  List,
  ListItem,
  SchemaCards,
  WebSocketHandshakeDiagram,
} from "../components";

export const webProtocols: BlogPostData = {
  title: "Long-Polling, WebSockets, and Server-Sent Events",
  date: "May 26, 2026",
  slug: "web-protocols",
  content: (
    <>
      <Paragraph delay={0.10}>
        The standard HTTP request-response cycle was designed for a world where clients ask and servers answer: fetch a page, get a page. That model falls apart the moment you need real-time updates. A chat app that polls for new messages every 5 seconds makes hundreds of empty requests per hour per user. A live stock ticker that refreshes on a fixed interval shows prices that are already 4 seconds stale. The protocols covered in this post, long-polling, WebSockets, and Server-Sent Events, are the evolution from that inefficient polling model toward persistent, low-overhead connections that actually match how real-time applications behave.
      </Paragraph>

      <Heading level={2} delay={0.15}>
        Standard HTTP and Ajax Polling
      </Heading>

      <Paragraph delay={0.20}>
        A standard HTTP request is synchronous and stateless: the client opens a connection, sends a request, the server calculates a response and sends it back, and the connection closes. Neither party can initiate contact outside of this cycle. The server has no way to notify the client that something changed.
      </Paragraph>

      <Paragraph delay={0.25}>
        Ajax polling is the naive workaround: the client sends <InlineCode>GET /data</InlineCode> at a fixed interval, every 500ms, every 5 seconds, whatever the application requires. The server responds immediately, with either new data or an empty body if nothing has changed. The client schedules the next poll and repeats.
      </Paragraph>

      <Paragraph delay={0.30}>
        The problem is obvious once you think about it: the vast majority of responses are empty. A social media feed polling every 5 seconds gets a non-empty response maybe once every few minutes. The other 95% of requests hit the server, get computed, and return nothing useful. Every one of those still incurs a full HTTP round-trip: TCP connection (or connection reuse overhead), HTTP headers, server processing time. At scale, this generates enormous unnecessary traffic and server load.
      </Paragraph>

      <Heading level={2} delay={0.35}>
        HTTP Long-Polling
      </Heading>

      <Paragraph delay={0.40}>
        Long-polling is sometimes called "Hanging GET", a name that describes it precisely. The client sends a normal HTTP request, but instead of responding immediately with an empty body when no data is available, the server holds the connection open and waits. When data becomes available, the server sends the full response and closes the connection. The client immediately opens a new long-poll request, and the cycle continues.
      </Paragraph>

      <Paragraph delay={0.45}>
        The lifecycle:
      </Paragraph>

      <List ordered delay={0.50}>
        <ListItem>Client sends <InlineCode>GET /data</InlineCode> and waits.</ListItem>
        <ListItem>Server holds the request open until data is available or a timeout occurs.</ListItem>
        <ListItem>When data arrives, server sends the response. Client receives it immediately.</ListItem>
        <ListItem>Client opens a new long-poll request. The server always has a waiting connection ready to push data through.</ListItem>
        <ListItem>If the timeout fires before data arrives, server sends an empty response and the client reconnects.</ListItem>
      </List>

      <Paragraph delay={0.55}>
        Long-polling eliminates the flood of empty responses from regular polling. Instead of a response every 5 seconds regardless of whether there's data, the client only gets a response when something actually happened (or when the timeout forces a reconnect). This is meaningfully more efficient for applications like chat or notifications where updates are infrequent and latency matters, a new chat message appears within milliseconds of the server receiving it, not at the next polling interval.
      </Paragraph>

      <Paragraph delay={0.60}>
        The tradeoff: connection management overhead. Every response requires a new connection (or HTTP keep-alive coordination). Timeouts require the client to detect and reconnect. At high concurrency, the server holds thousands of open connections simultaneously, which is a different kind of resource pressure than handling many short requests.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        WebSockets
      </Heading>

      <Paragraph delay={0.70}>
        WebSockets solve the fundamental limitation of HTTP: it's a request-response protocol where the server can only speak when asked. WebSockets replace that with a persistent, full-duplex TCP connection where either party can send data at any time, without waiting for the other to ask.
      </Paragraph>

      <Paragraph delay={0.75}>
        The connection starts as HTTP, a standard <InlineCode>GET /chat</InlineCode> request with an <InlineCode>Upgrade: websocket</InlineCode> header. If the server supports WebSockets, it responds with <InlineCode>101 Switching Protocols</InlineCode>, and the connection transitions from HTTP to the WebSocket protocol. From that point forward, both client and server can send messages independently, without any request-response ceremony. A message from the client doesn't need a response. A push from the server doesn't need a prior request. The connection stays open until one side closes it.
      </Paragraph>

      <WebSocketHandshakeDiagram
        delay={0.1}
        caption="The HTTP Upgrade handshake crosses once, then messages flow independently in both directions."
      />

      <Paragraph delay={0.80}>
        Overhead drops dramatically compared to polling. After the initial handshake, WebSocket frames have a 2–10 byte header versus the hundreds of bytes in an HTTP request. A live chat application sending a message every few seconds generates almost no protocol overhead per message. The connection persists for the session's lifetime, no reconnection, no timeout management, no repeated handshakes.
      </Paragraph>

      <Paragraph delay={0.85}>
        The right use cases: online gaming (player positions need to flow both directions continuously), live collaborative tools like whiteboards or shared documents (every keystroke or cursor move from every participant goes to every other participant), and financial trading dashboards (prices stream from server to client, user orders stream from client to server, simultaneously).
      </Paragraph>

      <Heading level={2} delay={0.90}>
        Server-Sent Events (SSEs)
      </Heading>

      <Paragraph delay={0.95}>
        Server-Sent Events are the right tool when the data flow is one-directional: server pushes updates to client, client doesn't need to send data back. SSEs establish a persistent HTTP connection where the server streams events using the <InlineCode>text/event-stream</InlineCode> content type. The client uses the browser's <InlineCode>EventSource</InlineCode> API, which handles reconnection automatically if the connection drops.
      </Paragraph>

      <Paragraph delay={1.00}>
        The protocol is simple: the client sends a standard <InlineCode>GET /events</InlineCode> request. The server responds with <InlineCode>200 OK</InlineCode> and <InlineCode>Content-Type: text/event-stream</InlineCode> but never closes the response body. Instead, it keeps writing event data to the open stream as updates occur. Each event is plain text in a simple format:
      </Paragraph>

      <List delay={1.05}>
        <ListItem><InlineCode>event: update</InlineCode></ListItem>
        <ListItem><InlineCode>data: {"{ price: 182.45 }"}</InlineCode></ListItem>
      </List>

      <Paragraph delay={1.10}>
        The client's <InlineCode>EventSource</InlineCode> listener receives each event as it arrives and dispatches it to application code. Live stock prices, live sports scores, news feed updates, progress notifications for long-running server jobs, these are all natural fits. The server is the source of truth generating a stream, the client just consumes it.
      </Paragraph>

      <Paragraph delay={1.15}>
        SSEs have a key advantage over WebSockets for one-way use cases: they run over plain HTTP/2, which means they work through proxies and load balancers without special configuration. WebSockets require WebSocket-aware infrastructure. SSEs also get automatic reconnection from the browser for free, with the server able to send a <InlineCode>Last-Event-ID</InlineCode> to resume a stream from where it left off after a disconnect. For pure server-to-client streaming, SSE is often simpler and more robust than WebSockets.
      </Paragraph>

      <Heading level={2} delay={1.20}>
        Choosing Between Them
      </Heading>

      <SchemaCards
        delay={0.1}
        tables={[
          {
            name: "Ajax polling",
            fields: [
              { name: "Direction", note: "One-way, client polls" },
              { name: "Connection", note: "Short-lived, repeated" },
              { name: "Overhead", note: "High, mostly empty" },
              { name: "Best for", note: "Simple, non-critical updates" },
            ],
          },
          {
            name: "Long-polling",
            fields: [
              { name: "Direction", note: "One-way, server-led" },
              { name: "Connection", note: "Long-lived, held open" },
              { name: "Overhead", note: "Medium, connection churn" },
              { name: "Best for", note: "Chat, notifications" },
            ],
          },
          {
            name: "WebSockets",
            fields: [
              { name: "Direction", note: "Two-way, full-duplex" },
              { name: "Connection", note: "Persistent" },
              { name: "Overhead", note: "Low after handshake" },
              { name: "Best for", note: "Gaming, collaboration, trading" },
            ],
          },
          {
            name: "Server-Sent Events",
            fields: [
              { name: "Direction", note: "One-way, server to client" },
              { name: "Connection", note: "Persistent" },
              { name: "Overhead", note: "Low, plain HTTP" },
              { name: "Best for", note: "Live feeds, dashboards" },
            ],
          },
        ]}
      />

      <List delay={1.25}>
        <ListItem><strong>Ajax polling:</strong> use when updates are infrequent, latency tolerance is high, and simplicity matters more than efficiency. Simple admin dashboards, non-critical status checks. Easy to implement and debug, works everywhere. Not suitable for anything latency-sensitive or high-frequency.</ListItem>
        <ListItem><strong>Long-polling:</strong> use when you need near-real-time updates but can't use WebSockets (legacy infrastructure, proxy constraints) and data flows primarily server-to-client. Chat notifications, activity feeds. More efficient than regular polling, works over standard HTTP. Reconnection logic and timeout handling add complexity.</ListItem>
        <ListItem><strong>WebSockets:</strong> use when you need full-duplex real-time communication, both client and server send messages independently and frequently. Live gaming, collaborative editing, trading terminals, live auctions. Lowest latency and overhead for bidirectional traffic. Requires WebSocket-aware proxies and load balancers, more complex to scale (sticky sessions or a message broker to route messages across server instances).</ListItem>
        <ListItem><strong>Server-Sent Events:</strong> use when data flows one-way from server to client and you want simplicity and HTTP/2 compatibility. Live price feeds, news updates, progress bars for long-running jobs, real-time dashboards. Simpler than WebSockets for one-way use cases, built-in reconnection, no special infrastructure needed. Can't send data from client to server over the same connection, use a separate HTTP request for that.</ListItem>
      </List>

      <Heading level={2} delay={1.30}>
        Takeaways
      </Heading>

      <List delay={1.35}>
        <ListItem>Standard HTTP is request-response: the client asks, the server answers, the connection closes. The server can never initiate. Everything else on this list is a workaround for that limitation.</ListItem>
        <ListItem>Ajax polling is simple but wasteful, most responses are empty. Only use it when latency requirements are loose and updates are rare.</ListItem>
        <ListItem>Long-polling holds the connection open until data is ready, eliminating empty responses. Better than polling, but connection churn and timeout management add overhead.</ListItem>
        <ListItem>WebSockets upgrade HTTP to a persistent full-duplex TCP channel. Either side sends at any time. Lowest latency for bidirectional real-time traffic, but requires WebSocket-aware infrastructure.</ListItem>
        <ListItem>Server-Sent Events are WebSockets for one-way streaming, simpler, HTTP/2 native, with built-in browser reconnection. When data flows server-to-client only, SSE is usually the better choice.</ListItem>
      </List>

      <Paragraph delay={1.40}>
        The evolution from polling to WebSockets mirrors a broader shift in how we think about web applications: from documents you fetch to live systems you connect to. Picking the right protocol means understanding what direction your data actually flows, how often, and what latency your application can tolerate. Thanks for reading.
      </Paragraph>
    </>
  ),
};
