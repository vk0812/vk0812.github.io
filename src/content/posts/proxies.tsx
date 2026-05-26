import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  BlogImage,
  InlineCode,
  List,
  ListItem,
} from "../components";

export const proxies: BlogPostData = {
  title: "Proxies",
  date: "May 25, 2026",
  slug: "proxies",
  content: (
    <>
      <Paragraph delay={0.1}>
        Every time your company laptop blocks a website, or a web server distributes your request across a backend fleet without you knowing, a proxy is involved. Proxies sit between two parties in a network conversation and act as intermediaries: they receive requests, forward them, and relay responses. Simple concept, surprisingly wide range of jobs.
      </Paragraph>

      <Paragraph delay={0.15}>
        This post covers what forward and reverse proxies are, how they differ, what they're actually used for, and how they compare to VPNs. Basic networking and client-server architecture assumed.
      </Paragraph>

      <BlogImage
        delay={0.2}
        size="lg"
        src="/blog/proxies/glance.png"
        alt="Forward proxy, reverse proxy, and VPN compared at a glance: forward proxy sits in front of clients and masks client identity, reverse proxy sits in front of servers and hides server identity, VPN is not a proxy, it encrypts all device traffic at the network level"
        caption="Figure 1: Forward proxy, reverse proxy, and VPN at a glance, where each sits and what each protects."
      />

      <Heading level={2} delay={0.25}>
        Forward Proxy
      </Heading>

      <Paragraph delay={0.3}>
        A forward proxy sits in front of one or more clients. When a client makes a request to the internet, the request goes to the forward proxy first. The proxy forwards it to the destination on the client's behalf, receives the response, and returns it to the client. From the destination server's perspective, the request came from the proxy, not the original client. The client's identity is hidden.
      </Paragraph>

      <BlogImage
        delay={0.32}
        src="/blog/proxies/forwardproxy.png"
        alt="Forward proxy diagram: clients route through forward proxy to reach the internet, use cases include caching, content filtering, access control, IP masking, bandwidth savings"
        caption="Figure 2: Forward proxy, sits between clients and the internet, masking client identity."
      />

      <Paragraph delay={0.35}>
        Office networks are the canonical example: all employees route traffic through a corporate forward proxy that caches frequently visited sites, blocks restricted content, logs all requests, and masks internal IP addresses from external servers. One configuration point manages traffic policy for the entire organization.
      </Paragraph>

      <Paragraph delay={0.4}>
        Forward proxies also enable a technique called collapsed forwarding: if multiple clients request the same uncached resource simultaneously, the proxy consolidates those into a single upstream request. Instead of hitting the origin server ten times for the same file, it hits once and fans the response out to all ten requesters. Significant reduction in origin load during traffic spikes.
      </Paragraph>

      <Heading level={2} delay={0.45}>
        Reverse Proxy
      </Heading>

      <Paragraph delay={0.5}>
        A reverse proxy sits in front of one or more backend servers. Clients send requests to the reverse proxy, which forwards them to an appropriate backend server, receives the response, and returns it to the client. From the client's perspective, the reverse proxy is the server, the actual backend machines are invisible. The server's identity is hidden.
      </Paragraph>

      <BlogImage
        delay={0.52}
        src="/blog/proxies/reverseproxy.png"
        alt="Reverse proxy diagram: internet traffic flows to reverse proxy which fans out to backend servers, use cases include load balancing, SSL termination, request routing, security, caching"
        caption="Figure 3: Reverse proxy, sits between the internet and backend servers, hiding server identity."
      />

      <Paragraph delay={0.55}>
        When you request a page from facebook.com, you're talking to a reverse proxy. It terminates your connection, decides which backend server handles your request, forwards it, and returns the response. You never know which server ultimately served you, or how many there are.
      </Paragraph>

      <Paragraph delay={0.6}>
        Nginx is the prototypical reverse proxy: it receives incoming requests, terminates SSL (so backend servers don't pay the encryption overhead), routes requests to the appropriate service, caches static content, and distributes load across the server fleet.
      </Paragraph>

      <Heading level={2} delay={0.65}>
        The Core Distinction
      </Heading>

      <Paragraph delay={0.7}>
        The simplest way to keep them straight: a forward proxy protects clients, a reverse proxy protects servers. Forward proxy hides who made the request. Reverse proxy hides who answered it. If you want to shield your internal network from the outside world, put clients behind a forward proxy. If you want to shield your backend servers from direct exposure, put them behind a reverse proxy.
      </Paragraph>

      <Heading level={2} delay={0.75}>
        What Proxies Are Used For
      </Heading>

      <BlogImage
        delay={0.77}
        src="/blog/proxies/howtheyimprove.png"
        alt="Six ways proxies improve systems: Performance (caching, compression, lower latency), Security (IP masking, access control, DDoS protection), Traffic Management (load balancing, routing, rate limiting), Observability (centralized logging, auditing, monitoring), Cost Efficiency (reduced bandwidth, optimized resources), Content Adaptation"
        caption="Figure 4: Six categories of work proxies do. Most production systems use them for several at once."
      />

      <List delay={0.8}>
        <ListItem><strong>Caching:</strong> store responses to frequent requests locally. Subsequent clients get the cached copy without hitting the origin server. Reduces latency, bandwidth, and backend load simultaneously.</ListItem>
        <ListItem><strong>Load balancing:</strong> reverse proxies distribute incoming requests across multiple backend servers, preventing any single server from becoming a bottleneck. The client sees one address, the proxy handles the fleet.</ListItem>
        <ListItem><strong>SSL termination:</strong> TLS handshakes are CPU-intensive. A reverse proxy handles all encryption and decryption at the edge, forwarding unencrypted (or lightly encrypted) traffic to backend servers over the private network. Backend servers spend their cycles on application logic, not OpenSSL.</ListItem>
        <ListItem><strong>IP masking and anonymity:</strong> forward proxies hide client IP addresses from external servers. Useful for accessing geo-restricted content or avoiding tracking.</ListItem>
        <ListItem><strong>Content filtering and access control:</strong> forward proxies can block requests to specific domains, filter malicious content, and enforce acceptable-use policies. Common in corporate and educational networks.</ListItem>
        <ListItem><strong>Security and DDoS protection:</strong> reverse proxies absorb incoming traffic before it reaches backend servers, filtering malicious requests, enforcing rate limits, and acting as a first line of defense against attacks. Backend server IPs never appear publicly.</ListItem>
        <ListItem><strong>Content adaptation:</strong> proxies can modify requests and responses in transit, compressing images, stripping unnecessary headers, transcoding content for low-bandwidth or mobile clients, without touching the origin server or the client application.</ListItem>
        <ListItem><strong>Logging and observability:</strong> all traffic flows through a single chokepoint, making proxies natural places to log requests, measure latency, detect anomalies, and audit access. Centralized without requiring instrumentation on every backend.</ListItem>
      </List>

      <Heading level={2} delay={0.85}>
        VPN vs. Proxy Server
      </Heading>

      <Paragraph delay={0.9}>
        VPNs and proxies both mask your IP address and let you route traffic through an intermediary. The difference is scope and encryption.
      </Paragraph>

      <BlogImage
        delay={0.92}
        src="/blog/proxies/proxyvpn.png"
        alt="Comparison table of Forward Proxy vs Reverse Proxy vs VPN across position, protection, encryption, scope, IP masking, and example tools, proxies work at the application layer (HTTP/HTTPS), VPNs work at the network layer"
        caption="Figure 5: Forward proxy, reverse proxy, and VPN side by side, same intermediary idea, very different scopes."
      />

      <Paragraph delay={0.95}>
        A VPN creates an encrypted tunnel between your device and a VPN server. All traffic from your device, every app, every protocol, flows through that tunnel. The VPN server decrypts it and forwards it to the destination. End-to-end encryption, network-level coverage, higher overhead.
      </Paragraph>

      <Paragraph delay={1.0}>
        A proxy intercepts traffic at the application level, typically only for the browser or a specific app. It doesn't encrypt traffic by default (HTTPS proxies do, but only for HTTP/HTTPS traffic). It's faster than a VPN because there's no encryption overhead, but it offers less security coverage and leaves non-proxied traffic unprotected.
      </Paragraph>

      <List delay={1.05}>
        <ListItem><strong>Encryption:</strong> VPN encrypts everything end-to-end. Proxy encrypts nothing by default (HTTPS proxies handle TLS, but only for web traffic).</ListItem>
        <ListItem><strong>Scope:</strong> VPN covers all apps and protocols on the device. Proxy covers specific apps or browsers only.</ListItem>
        <ListItem><strong>Performance:</strong> proxies are faster, no encryption overhead. VPNs add latency proportional to encryption cost and server distance.</ListItem>
        <ListItem><strong>Use case:</strong> use a VPN when handling sensitive data on untrusted networks (public Wi-Fi, remote work). Use a proxy when you need geo-restriction bypass or IP masking for browsing without encryption requirements.</ListItem>
      </List>

      <Paragraph delay={1.1}>
        Proxies work at the application layer (HTTP/HTTPS). VPNs work at the network layer, securing all protocols. That's the fundamental difference, proxies are application-aware intermediaries, VPNs are network-level tunnels.
      </Paragraph>

      <BlogImage
        delay={1.12}
        size="lg"
        src="/blog/proxies/examples.png"
        alt="Traffic flow examples for forward proxy, reverse proxy, and VPN: forward proxy benefits include caching/filtering/IP masking/control, reverse proxy benefits include load balancing/SSL/routing/security, VPN benefits include end-to-end encryption and full network security"
        caption="Figure 6: End-to-end traffic flow side by side, what each intermediary actually does on the wire."
      />

      <Heading level={2} delay={1.15}>
        Takeaways
      </Heading>

      <List delay={1.2}>
        <ListItem>Forward proxy sits in front of clients, hides client identity, and handles outbound traffic: caching, filtering, logging, IP masking.</ListItem>
        <ListItem>Reverse proxy sits in front of servers, hides server identity, and handles inbound traffic: load balancing, SSL termination, routing, security.</ListItem>
        <ListItem>Collapsed forwarding is an underappreciated forward proxy feature: multiple identical upstream requests collapse into one, cutting origin load significantly during spikes.</ListItem>
        <ListItem>VPNs encrypt all traffic at the network layer. Proxies are application-layer intermediaries with no inherent encryption. More security needs: VPN. Simple IP masking or bypassing filters: proxy.</ListItem>
        <ListItem>In practice, reverse proxies (Nginx, Cloudflare, AWS ALB) are invisible infrastructure in almost every production web system. You're almost always behind one.</ListItem>
      </List>

      <Paragraph delay={1.25}>
        Proxies are one of those concepts that's easy to understand in isolation but shows up everywhere once you start looking: CDN edge nodes are reverse proxies, corporate firewalls run forward proxies, API gateways are reverse proxies with added routing logic. The same intermediary pattern, applied at different layers and with different policies. Thanks for reading.
      </Paragraph>
    </>
  ),
};
