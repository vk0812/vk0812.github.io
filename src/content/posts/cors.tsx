import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  BlogImage,
  InlineCode,
  List,
  ListItem,
} from "../components";

export const cors: BlogPostData = {
  title: "Cross-Origin Resource Sharing",
  date: "July 2, 2026",
  slug: "cors",
  content: (
    <>
      <Paragraph delay={0.1}>
        If you've ever opened your browser console and seen the words "blocked by CORS policy" while your Postman request to the exact same endpoint worked fine, you've met one of the most misunderstood pieces of the web platform. CORS (Cross-Origin Resource Sharing) feels like an obstacle when you're the one hitting it, but it exists to protect something you rely on every day: the fact that your logged-in cookies don't get silently handed to whatever tab you happen to have open.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        The Problem CORS Solves
      </Heading>

      <Paragraph delay={0.25}>
        Modern browsers let you have a dozen tabs open at once. Say one of them is your bank's website, and you're logged in. That session is backed by a cookie sitting in your browser, and the browser will attach that cookie to any request it sends to the bank's domain, regardless of which tab initiated the request.
      </Paragraph>

      <Paragraph delay={0.3}>
        Now imagine you open a second tab to some sketchy site, and that site's page runs a script that does <InlineCode>fetch("https://yourbank.com/api/transfer", {"{"} method: "POST", credentials: "include" {"}"})</InlineCode>. Without any protection, the browser would attach your bank cookie to that request, the bank's server would see a valid authenticated session, and it would happily process it, even though you never intended to touch your bank in that tab at all. The malicious site never had your password or your session token. It didn't need them. It just needed your browser to do what it normally does: attach cookies to requests.
      </Paragraph>

      <Paragraph delay={0.35}>
        CORS is the browser's answer to this. It's a security mechanism that restricts which websites are allowed to make requests to which other websites and read the results, precisely so that one open tab can't quietly abuse the authenticated session sitting in another.
      </Paragraph>

      <Heading level={2} delay={0.4}>
        Defining an Origin
      </Heading>

      <Paragraph delay={0.45}>
        To enforce this, browsers need a precise definition of "different website." That definition is the <strong>origin</strong>, a triple of three parts: <strong>scheme</strong> (<InlineCode>http</InlineCode> or <InlineCode>https</InlineCode>), <strong>host</strong> (<InlineCode>example.com</InlineCode>), and <strong>port</strong> (<InlineCode>443</InlineCode>, <InlineCode>8000</InlineCode>, whatever it happens to be). Two URLs share an origin only if all three match exactly.
      </Paragraph>

      <Paragraph delay={0.5}>
        That last part trips people up constantly. <InlineCode>https://app.example.com:443</InlineCode> and <InlineCode>http://app.example.com:443</InlineCode> are cross-origin, the scheme differs. <InlineCode>https://app.example.com:443</InlineCode> and <InlineCode>https://api.example.com:443</InlineCode> are cross-origin, the host differs, even though they're both under the same parent domain. <InlineCode>https://app.example.com:443</InlineCode> and <InlineCode>https://app.example.com:8080</InlineCode> are cross-origin, only the port differs. Change any one of the three and you've triggered a cross-origin request, no exceptions.
      </Paragraph>

      <BlogImage
        delay={0.55}
        size="md"
        src="/blog/cors/origin_tuple.png"
        alt="An origin is scheme, host, and port. https://api.example.com:443 splits into https, api.example.com, and 443. Same-origin examples must match all three exactly; cross-origin examples show a differing scheme, host, or port each triggering a not-equal and a block."
        caption="Figure 1: An origin is scheme + host + port. Any single mismatch, even just the port, makes a request cross-origin."
      />

      <Paragraph delay={0.6}>
        This is exactly why local development trips this wire so often. A frontend running on <InlineCode>http://localhost:5173</InlineCode> (a typical Vite dev server) calling a backend on <InlineCode>http://localhost:8000</InlineCode> is a cross-origin request, even though both are "localhost." The port differs, and that's enough.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        The Same-Origin Policy, and How the Server Opts Out
      </Heading>

      <Paragraph delay={0.7}>
        By default, browsers enforce the <strong>Same-Origin Policy</strong>: a page can only read the response of a request if that request went to its own origin. A request to a different origin still gets sent over the wire in most cases, the server does process it, but the browser withholds the response from the calling script unless it's been told it's allowed to hand it over.
      </Paragraph>

      <BlogImage
        delay={0.75}
        size="md"
        src="/blog/cors/policy.png"
        alt="Same-Origin Policy diagram: a web app at https://app.com attempts a request to an API server at https://api.com, and the response is blocked by SOP by default, protecting against unauthorized requests on behalf of authenticated users."
        caption="Figure 2: By default, a request from one origin to another is blocked. The server has to explicitly opt in."
      />

      <Paragraph delay={0.8}>
        CORS is how a server opts out of that default. When the browser makes a cross-origin request, it attaches an <InlineCode>Origin</InlineCode> header identifying where the request came from. The server inspects that header and, if it trusts the origin, responds with an <InlineCode>Access-Control-Allow-Origin</InlineCode> header naming that same origin (or a wildcard). The browser checks that response header against the origin that made the request, and only if they match does it let the calling script actually see the response body.
      </Paragraph>

      <BlogImage
        delay={0.85}
        size="md"
        src="/blog/cors/requests.png"
        alt="CORS server permission diagram: a web app at https://app.com sends a request to an API server at https://api.com, and the server responds with headers including Access-Control-Allow-Origin: https://app.com, Vary: Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers, and Access-Control-Allow-Credentials: true."
        caption="Figure 3: The server explicitly grants access by echoing the trusted origin back in Access-Control-Allow-Origin."
      />

      <Paragraph delay={0.9}>
        This is worth repeating because it's the single most common source of confusion: <strong>the request already reached the server</strong>. CORS doesn't stop the server from receiving or processing the request, it stops the browser from letting your JavaScript read what came back. That's also why the fix always lives on the server. If a frontend team hits a CORS error, adding headers on the client does nothing, the browser is refusing to hand over a response until the server says it's fine, and only the server can say that.
      </Paragraph>

      <Heading level={2} delay={1.0}>
        Wildcards and Credentials
      </Heading>

      <Paragraph delay={1.05}>
        The simplest thing a server can do is send <InlineCode>Access-Control-Allow-Origin: *</InlineCode>, which allows any origin to read the response. This is common for public, unauthenticated APIs, a weather API or a public dataset doesn't care who's reading it.
      </Paragraph>

      <Paragraph delay={1.1}>
        It breaks down the moment cookies or authentication get involved. If a request is made with <InlineCode>credentials: "include"</InlineCode> so that cookies travel with it, the browser refuses to accept a wildcard in the response. The server must name the exact origin it trusts. This isn't an arbitrary restriction, it's the whole point of CORS: a wildcard combined with credentials would mean "any website on the internet may make authenticated requests on this user's behalf," which is precisely the attack from the opening scenario. So the rule is strict: credentialed requests require an explicit, specific <InlineCode>Access-Control-Allow-Origin</InlineCode>, never <InlineCode>*</InlineCode>.
      </Paragraph>

      <BlogImage
        delay={1.15}
        size="md"
        src="/blog/cors/creds_wildcard.png"
        alt="Credentials and wildcard rule: allowed configuration has Origin https://app.com, Access-Control-Allow-Origin https://app.com, Access-Control-Allow-Credentials true. Not allowed configuration has the same Origin and credentials true but Access-Control-Allow-Origin set to a wildcard asterisk, which browsers reject."
        caption="Figure 4: A wildcard origin is fine for public data, but browsers reject it outright once credentials are involved."
      />

      <Heading level={2} delay={1.2}>
        Preflight Requests
      </Heading>

      <Paragraph delay={1.25}>
        Not every cross-origin request gets the same treatment. Browsers distinguish between "simple" requests and everything else. A <strong>simple request</strong> uses <InlineCode>GET</InlineCode>, <InlineCode>HEAD</InlineCode>, or <InlineCode>POST</InlineCode>, sticks to a small set of standard headers, and if it's a <InlineCode>POST</InlineCode>, uses a content type like <InlineCode>application/x-www-form-urlencoded</InlineCode>, <InlineCode>multipart/form-data</InlineCode>, or <InlineCode>text/plain</InlineCode>. These are requests an old-fashioned HTML form could have sent anyway, so the browser just sends them directly and checks the CORS headers on the response, as covered above.
      </Paragraph>

      <Paragraph delay={1.3}>
        Anything else, a <InlineCode>PUT</InlineCode>, <InlineCode>PATCH</InlineCode>, or <InlineCode>DELETE</InlineCode>, a custom header like <InlineCode>Authorization</InlineCode>, or a JSON body with <InlineCode>Content-Type: application/json</InlineCode>, counts as a <strong>complex request</strong>. Browsers treat these as risky enough that they refuse to send them blind. First, they send a <strong>preflight request</strong>: an <InlineCode>OPTIONS</InlineCode> request to the same URL, carrying headers like <InlineCode>Access-Control-Request-Method</InlineCode> and <InlineCode>Access-Control-Request-Headers</InlineCode> that describe what the real request intends to do.
      </Paragraph>

      <BlogImage
        delay={1.35}
        size="md"
        src="/blog/cors/permission.png"
        alt="Simple versus complex requests: simple requests use GET, HEAD, or POST with standard headers and no custom headers, going directly from client to server. Complex requests use methods like PUT, DELETE, PATCH, custom headers such as Authorization, or content types like application/json, and require a preflight OPTIONS round trip before the server."
        caption="Figure 5: Simple requests go straight through. Anything riskier triggers a preflight round trip first."
      />

      <Paragraph delay={1.4}>
        The server responds to that <InlineCode>OPTIONS</InlineCode> request with the methods, headers, and origins it permits, all without touching any application logic. Only if the browser is satisfied with that answer does it send the actual request. This is why a single logical action, say updating a user's profile with a <InlineCode>PUT</InlineCode> and a JSON body, shows up as two network calls in your browser's dev tools: the preflight <InlineCode>OPTIONS</InlineCode> and then the real request.
      </Paragraph>

      <BlogImage
        delay={1.45}
        size="lg"
        src="/blog/cors/preflight.png"
        alt="Preflight OPTIONS flow: browser at https://app.com sends OPTIONS /resource to the server at https://api.com, server responds with Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers, and Access-Control-Allow-Credentials headers, then the browser sends the actual PUT /resource request and receives the actual response."
        caption="Figure 6: The preflight OPTIONS call checks permissions first. Only once it succeeds does the real request go out."
      />

      <Paragraph delay={1.5}>
        Preflighting adds a round trip, but it's a deliberate tradeoff. It means a server can be strict about exactly which methods and headers it accepts from which origins, and the browser checks that permission before any state-changing request (a delete, an update) is even attempted, not just before the response is read.
      </Paragraph>

      <Heading level={2} delay={1.55}>
        CORS Is a Browser-Only Protection
      </Heading>

      <Paragraph delay={1.6}>
        It's worth being explicit about the boundary here. CORS is enforced by the browser, full stop. It has no meaning for server-to-server communication, and no meaning for tools like Postman, curl, or a backend service calling another backend service. Those clients don't run the Same-Origin Policy, so there's no <InlineCode>Origin</InlineCode> header being checked against anything. The request goes out, the server responds, and the caller reads it, no browser gatekeeping involved at any point.
      </Paragraph>

      <BlogImage
        delay={1.65}
        size="md"
        src="/blog/cors/protection.png"
        alt="CORS is client protection only: browser to server communication is CORS enforced, while server to server communication is not enforced by CORS and is allowed by default. If an API needs securing beyond CORS, authentication and authorization must be implemented on the server."
        caption="Figure 7: CORS only guards browser-to-server calls. Server-to-server traffic, and tools like Postman, never see it."
      />

      <Paragraph delay={1.7}>
        This is also why CORS is not, and was never meant to be, an authentication mechanism. Loosening it doesn't expose your API to the world in some new way that authentication would have blocked, and tightening it doesn't secure an API that has no authentication to begin with. Anyone who wants your data can hit your endpoint directly from a server, a script, or Postman, sidestepping the browser entirely. If an API genuinely needs to be locked down, that has to happen through real authentication and authorization on the server, CORS just decides which browser-based frontends are allowed to read the responses of an already-processed request.
      </Paragraph>

      <Heading level={2} delay={1.75}>
        Takeaways
      </Heading>

      <List delay={1.8}>
        <ListItem>CORS exists because browsers attach cookies to requests automatically, and without it, any open tab could ride an authenticated session with a completely different site.</ListItem>
        <ListItem>An origin is scheme, host, and port together. Any single difference, even just the port, makes a request cross-origin.</ListItem>
        <ListItem>The Same-Origin Policy blocks a script from reading a cross-origin response by default. A server opts in by sending <InlineCode>Access-Control-Allow-Origin</InlineCode> matching the requesting origin.</ListItem>
        <ListItem>A wildcard <InlineCode>*</InlineCode> works for public, unauthenticated data, but credentialed requests require the exact origin to be named, never a wildcard.</ListItem>
        <ListItem>Complex requests (non-simple methods, custom headers, JSON bodies) trigger a preflight <InlineCode>OPTIONS</InlineCode> check before the real request goes out.</ListItem>
        <ListItem>CORS is enforced by browsers only. It's a server-side configuration concern, and it's not a substitute for real authentication.</ListItem>
      </List>

      <Paragraph delay={2.05}>
        Once you see CORS as a permission handshake the browser runs on the user's behalf, rather than an arbitrary wall between your frontend and backend, the error messages stop being mysterious. The browser is just refusing to hand your script a response the server hasn't explicitly cleared it to see. Configure the right header on the server, and that's the whole fix. Thanks for reading.
      </Paragraph>
    </>
  ),
};
