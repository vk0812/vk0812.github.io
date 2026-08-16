import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  InlineCode,
  List,
  ListItem,
  CacheFlowDiagram,
  LruEvictionDiagram,
} from "../components";

export const cachingPost: BlogPostData = {
  title: "Caching",
  date: "May 25, 2026",
  slug: "caching",
  content: (
    <>
      <Paragraph delay={0.10}>
        You open an e-commerce site and the homepage loads instantly. Product images, prices, recommended items: all there in milliseconds. Behind the scenes, none of that came from a database query. It came from a cache. Someone else already triggered those queries a few seconds ago, and the results are sitting in fast memory, waiting for the next request.
      </Paragraph>

      <Paragraph delay={0.15}>
        Caching is one of those ideas that looks simple until you're actually implementing it at scale. The core concept is easy. The tricky parts are knowing where to put the cache, how to keep it fresh, and what to do when it fills up.
      </Paragraph>

      <Heading level={2} delay={0.20}>
        What is Caching?
      </Heading>

      <Paragraph delay={0.25}>
        A cache is a high-speed storage layer that sits between your application and its data source. The principle it exploits is called locality of reference: recently accessed data is likely to be accessed again. So instead of fetching the same user profile from the database on every request, you fetch it once, store it in fast memory, and return the stored copy for the next hundred requests.
      </Paragraph>

      <Paragraph delay={0.30}>
        Four terms come up constantly when talking about caches:
      </Paragraph>

      <List delay={0.35}>
        <ListItem><strong>Cache hit:</strong> the requested data is already in the cache. Fast path, no round-trip to the data source.</ListItem>
        <ListItem><strong>Cache miss:</strong> the data isn't in the cache. Fetch it from the source, store it, then return it. Slower this time, faster next time.</ListItem>
        <ListItem><strong>Eviction:</strong> when the cache fills up, something has to go. Eviction policies (LRU, LFU, and others) decide what gets removed to make room for new entries.</ListItem>
        <ListItem><strong>Staleness:</strong> cached data can drift from the source of truth. Managing that drift is the hard part of caching.</ListItem>
      </List>

      <Heading level={2} delay={0.40}>
        Where Caches Live
      </Heading>

      <Paragraph delay={0.45}>
        Caches aren't one-size-fits-all. They exist at every layer of a typical stack, and the right choice depends on what you're storing and how fast you need it.
      </Paragraph>

      <List delay={0.50}>
        <ListItem><strong>In-memory</strong> (Redis, Memcached): RAM-speed access with microsecond latency. The go-to for session data, rate limiting counters, and any hot data that's read constantly. Volatile by default, capacity-limited by available RAM.</ListItem>
        <ListItem><strong>Disk</strong> (SSD Cache, RocksDB): persistent storage for larger datasets that don't fit in RAM. Slower than memory but far cheaper per gigabyte. Good for computed aggregations you don't want to recompute from scratch.</ListItem>
        <ListItem><strong>Client-side / Server-side</strong> (Browser Local Storage, Server Object Cache): browser caches store static assets locally, saving network round-trips entirely. Server-side object caches (like an in-process cache in your application tier) avoid even the network hop to Redis.</ListItem>
        <ListItem><strong>Database</strong> (MySQL Query Cache, PostgreSQL cache): databases cache query results and buffer pool pages internally. Often invisible to the application, but tuning buffer pool size has a significant effect on read throughput.</ListItem>
        <ListItem><strong>CDN / DNS</strong> (Cloudflare, DNS resolver caches): globally distributed edge caches that serve static assets and cacheable responses from locations close to the user. DNS resolver caches mean your domain lookup doesn't hit an authoritative server every single time.</ListItem>
      </List>

      <Heading level={2} delay={0.55}>
        How Caching Works
      </Heading>

      <Paragraph delay={0.60}>
        Every cached request follows one of two paths. On a hit, the cache returns the data directly. No database involved. On a miss, the cache fetches from the data source, stores the result, and returns it to the caller. That stored copy handles every future request until it's evicted or invalidated.
      </Paragraph>

      <CacheFlowDiagram
        delay={0.67}
        caption="The two-path flow. A hit returns straight from the cache, a miss falls through to the data source and backfills the cache for next time."
      />

      <Paragraph delay={0.65}>
        The three outcomes of getting this right: faster response times (no round-trip to the DB), reduced load on the source (fewer queries, less CPU on the database), and better user experience at scale (the cache absorbs traffic spikes that would otherwise saturate your backend).
      </Paragraph>

      <Heading level={2} delay={0.70}>
        Eviction Policies
      </Heading>

      <Paragraph delay={0.75}>
        Every cache has a size limit. When it fills up, an eviction policy decides which entry gets removed to make room. The right policy depends on your access patterns.
      </Paragraph>

      <LruEvictionDiagram
        delay={0.82}
        caption="LRU in motion. Access slides a key to the most-recently-used end, an overflow evicts whatever sits at the least-recently-used end."
      />

      <List delay={0.80}>
        <ListItem><strong>LRU (Least Recently Used):</strong> evicts the entry that hasn't been accessed in the longest time. Works well for most access patterns since recently used data tends to be used again soon.</ListItem>
        <ListItem><strong>LFU (Least Frequently Used):</strong> evicts the entry with the lowest access count. Better than LRU when access frequency matters more than recency, though it can keep stale entries alive if they were popular early on.</ListItem>
        <ListItem><strong>MRU (Most Recently Used):</strong> evicts the most recently accessed entry. Counter-intuitive, but useful for scan workloads where recently accessed data is unlikely to be needed again.</ListItem>
        <ListItem><strong>FIFO (First In, First Out):</strong> evicts the oldest-added entry regardless of access history. Simple and predictable, not great for performance-sensitive use cases.</ListItem>
        <ListItem><strong>LIFO (Last In, First Out):</strong> evicts the most recently added entry. Niche use cases, rarely optimal for general caching.</ListItem>
        <ListItem><strong>TTL (Time to Live):</strong> entries expire after a fixed time. Not strictly an eviction policy but often combined with one: a cache might evict LRU entries on capacity pressure and also expire all entries after 60 seconds regardless.</ListItem>
        <ListItem><strong>Random:</strong> evicts a random entry. Zero bookkeeping overhead, statistically reasonable performance on uniform access patterns.</ListItem>
      </List>

      <Heading level={2} delay={0.85}>
        Cache Invalidation
      </Heading>

      <Paragraph delay={0.90}>
        Stale data is the cost of caching. The question isn't whether your cache will drift from the source of truth, it's how you manage that drift. Cache invalidation is the set of mechanisms that answer that question.
      </Paragraph>

      <List delay={0.95}>
        <ListItem><strong>Purge:</strong> remove a specific key immediately. Used when you know exactly which entry just became stale (a user updated their profile, so you purge <InlineCode>user:123</InlineCode>).</ListItem>
        <ListItem><strong>Ban:</strong> block a pattern of keys from being cached, often with a regex or tag. Useful when a category of data changes and you can't enumerate every affected key.</ListItem>
        <ListItem><strong>TTL expiration:</strong> let entries expire automatically after a set time. Simple and stateless. The tradeoff: you serve stale data for up to TTL seconds after the source changes, and you always pay for a cache miss when the TTL clock runs out even if nothing changed.</ListItem>
        <ListItem><strong>Stale-while-revalidate:</strong> serve the stale entry immediately (fast response), while a background task fetches a fresh copy from the source. The next request gets the updated value. Best of both worlds for most cases: no latency penalty, no visible staleness after the first miss.</ListItem>
      </List>

      <Heading level={2} delay={1.00}>
        Write Strategies
      </Heading>

      <Paragraph delay={1.05}>
        Read patterns get a lot of attention, but write patterns are equally important. How you write through the cache determines consistency and latency.
      </Paragraph>

      <List delay={1.10}>
        <ListItem><strong>Write-through:</strong> write to the cache and the database at the same time. The write completes only when both succeed. High consistency, higher write latency. The cache is never stale, but every write waits for two operations.</ListItem>
        <ListItem><strong>Write-around:</strong> skip the cache entirely on writes, write directly to the database. The cache gets populated on the next read (a cache miss). Lower write latency, but reads after a write always miss the cache. Good when written data is rarely re-read immediately.</ListItem>
        <ListItem><strong>Write-back (write-behind):</strong> write to the cache immediately, sync to the database asynchronously later. Low write latency (only one operation in the critical path), but if the cache fails before the flush, you lose data. Use when write throughput matters more than durability.</ListItem>
      </List>

      <Heading level={2} delay={1.15}>
        Read Strategies
      </Heading>

      <List delay={1.20}>
        <ListItem><strong>Read-through:</strong> the cache handles fetching from the database on a miss automatically. The application always talks to the cache, the cache talks to the database when needed. Simpler application logic, less control.</ListItem>
        <ListItem><strong>Read-aside (cache-aside):</strong> the application manages cache population itself. On a miss, the application fetches from the database, then explicitly stores the result in the cache. More code, but more control over what gets cached, how long, and how it's structured.</ListItem>
      </List>

      <Heading level={2} delay={1.25}>
        Takeaways
      </Heading>

      <List delay={1.30}>
        <ListItem>Caching exploits locality of reference: recently accessed data will be accessed again. Put a fast storage layer in front of your slow one.</ListItem>
        <ListItem>Caches exist at every layer: in-memory, disk, client-side, database-internal, and CDN. Pick the right layer for the data, not just the technology you're familiar with.</ListItem>
        <ListItem>Eviction policy matters. LRU is a reasonable default. LFU wins for frequency-skewed access patterns. TTL adds a time dimension to either.</ListItem>
        <ListItem>Cache invalidation is the hard part. Purge for specific keys, ban for patterns, TTL for simplicity, stale-while-revalidate for the best latency and freshness tradeoff.</ListItem>
        <ListItem>Write strategy determines consistency. Write-through for safety, write-back for speed, write-around when written data isn't immediately re-read.</ListItem>
        <ListItem>The end goal: performance and data accuracy together. A cache that's fast but stale is a bug. A cache that's consistent but slow missed the point.</ListItem>
      </List>

      <Paragraph delay={1.35}>
        Caching is one of those primitives that shows up everywhere once you know what to look for. Every layer of a production system has some form of it, and the tradeoffs at each layer compound. Get the fundamentals right and you have a useful mental model for every caching decision, from Redis TTL tuning to CDN cache-control headers. Thanks for reading.
      </Paragraph>
    </>
  ),
};
