import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  InlineCode,
  List,
  ListItem,
  ReplicationDiagram,
  IconArchitectureDiagram,
} from "../components";
import type { DiagramNode, DiagramEdge } from "../components";
import { Key, Hash, Database } from "lucide-react";

const shardingNodes: DiagramNode[] = [
  { id: "key", label: "Partition key", sub: "user_id", icon: Key, color: "text-slate-500", x: 10, y: 50 },
  { id: "hash", label: "Hash function", sub: "mod 3", icon: Hash, color: "text-violet-500", x: 42, y: 50 },
  { id: "shard0", label: "Shard 0", icon: Database, color: "text-blue-600", x: 78, y: 15 },
  { id: "shard1", label: "Shard 1", icon: Database, color: "text-blue-600", x: 78, y: 50 },
  { id: "shard2", label: "Shard 2", icon: Database, color: "text-blue-600", x: 78, y: 85 },
];

const shardingEdges: DiagramEdge[] = [
  { id: "e1", from: "key", to: "hash" },
  { id: "e2", from: "hash", to: "shard0" },
  { id: "e3", from: "hash", to: "shard1" },
  { id: "e4", from: "hash", to: "shard2" },
];

export const dataPartitioning: BlogPostData = {
  title: "Data Partitioning",
  date: "May 25, 2026",
  slug: "data-partitioning",
  content: (
    <>
      <Paragraph delay={0.10}>
        At some point, your database table gets too big for one machine. Queries slow down. Backups take hours. A single disk failure takes down everything. The answer isn't a bigger machine, it's splitting the data across many smaller ones. That's data partitioning: dividing a large dataset into independent, more manageable pieces called partitions, each living on its own storage node and processing its own slice of the workload.
      </Paragraph>

      <Heading level={2} delay={0.15}>
        Key Concepts
      </Heading>

      <List delay={0.20}>
        <ListItem><strong>Partition:</strong> an independent subset of a larger dataset. Each partition contains a portion of the rows, columns, or both, depending on the partitioning method.</ListItem>
        <ListItem><strong>Partition key:</strong> the attribute used to decide which partition a given data record belongs to. Choosing a good partition key, one that distributes data evenly and aligns with common query patterns, is the central challenge in partition design.</ListItem>
        <ListItem><strong>Shard:</strong> used interchangeably with partition, especially in the context of horizontal partitioning. A shard is a horizontal partition stored on a separate database node.</ListItem>
      </List>

      <Heading level={2} delay={0.25}>
        Partitioning Methods
      </Heading>

      <Heading level={3} delay={0.30}>
        Horizontal Partitioning (Sharding)
      </Heading>

      <Paragraph delay={0.35}>
        Horizontal partitioning splits a table by rows. Each shard contains the same columns but a different subset of records, and each shard lives on a different database server. This enables parallel processing: a query targeting user IDs 1–1M hits Shard 1 without touching Shards 2 or 3.
      </Paragraph>

      <Paragraph delay={0.40}>
        The classic example: a social media platform partitions its user table by geographic region. US users land on one shard, European users on another. Login queries route directly to the relevant shard, scanning a fraction of the total data. The risk: if the partition key isn't chosen carefully, some shards get far more data than others, a "hot shard" problem that defeats the purpose.
      </Paragraph>

      <Heading level={3} delay={0.45}>
        Vertical Partitioning
      </Heading>

      <Paragraph delay={0.50}>
        Vertical partitioning splits a table by columns. The original table is divided into two or more narrower tables, each containing a subset of columns for the same rows. A user table might be split into a "User Core" shard (<InlineCode>user_id</InlineCode>, <InlineCode>name</InlineCode>, <InlineCode>email</InlineCode>) and a "User Extended" shard (<InlineCode>phone</InlineCode>, <InlineCode>address</InlineCode>, <InlineCode>created_at</InlineCode>). Queries that only need core identity data never touch the extended table.
      </Paragraph>

      <Paragraph delay={0.55}>
        This is especially useful for security: separating sensitive columns (social security numbers, payment info) into a dedicated partition with stricter access controls limits blast radius if one partition is compromised.
      </Paragraph>

      <ReplicationDiagram
        delay={0.05}
        panels={[
          {
            title: "Horizontal partitioning",
            writeLabel: "Users table (rows)",
            fanLabel: "split by partition key",
            nodes: ["Shard 1", "Shard 2", "Shard 3"],
            note: "Every shard keeps the same columns, but only a slice of the rows.",
          },
          {
            title: "Vertical partitioning",
            writeLabel: "Users table (columns)",
            fanLabel: "split by column group",
            nodes: ["User Core", "User Extended"],
            note: "Every partition keeps the same rows, but only a slice of the columns.",
          },
        ]}
      />

      <Heading level={3} delay={0.60}>
        Hybrid Partitioning
      </Heading>

      <Paragraph delay={0.65}>
        Hybrid partitioning combines horizontal and vertical partitioning. A users table might first be sharded horizontally by country (US Shard, EU Shard, APAC Shard), and then each country shard is split vertically into "Core" columns (<InlineCode>user_id</InlineCode>, <InlineCode>name</InlineCode>, <InlineCode>email</InlineCode>) and "Extended" columns (<InlineCode>country</InlineCode>, <InlineCode>last_login</InlineCode>). Queries get data locality (from horizontal sharding) and column-level filtering (from vertical splitting) at the same time.
      </Paragraph>

      <Heading level={2} delay={0.70}>
        Sharding Techniques
      </Heading>

      <Paragraph delay={0.75}>
        Sharding is horizontal partitioning in practice. The technique determines how the partition key maps to a specific shard. Each approach trades off between simplicity, even distribution, flexibility, and operational overhead.
      </Paragraph>

      <Heading level={3} delay={0.80}>
        Range-Based Sharding
      </Heading>

      <Paragraph delay={0.85}>
        Data is divided into shards based on contiguous ranges of the partition key. User IDs 1–1M go to Shard 1, 1M–2M to Shard 2, 2M–3M to Shard 3. An e-commerce platform sharding order data by date creates monthly or yearly shards, a query for Q1 orders hits only the Q1 shard. Range queries are fast and predictable. The downside: if recent data is accessed far more than old data, the "latest range" shard becomes a hotspot.
      </Paragraph>

      <Heading level={3} delay={0.90}>
        Hash-Based Sharding
      </Heading>

      <Paragraph delay={0.95}>
        A hash function is applied to the partition key, and the result determines the shard. <InlineCode>hash(user_id) % N</InlineCode> distributes users across N shards uniformly, regardless of the distribution of user IDs themselves. A social media platform sharding by user ID gets even load across all shards with no hotspots. The tradeoff: range queries are expensive (a query for "all users registered this month" has to hit every shard), and adding or removing shards requires rehashing, potentially moving a large fraction of data.
      </Paragraph>

      <IconArchitectureDiagram
        nodes={shardingNodes}
        edges={shardingEdges}
        height={340}
        delay={0.05}
        caption="A partition key runs through a hash function, and the result picks one of N shards, no lookup, no scan, no ranges to maintain."
      />

      <Heading level={3} delay={1.00}>
        Directory-Based Sharding
      </Heading>

      <Paragraph delay={1.05}>
        A lookup table (the "directory") explicitly maps each record to a shard. An online gaming platform might maintain a directory mapping each player's username to a specific shard. When a query arrives, the system consults the directory to find the right shard, then fetches data from it. This gives maximum flexibility, shards can be added, reorganized, or rebalanced by updating the directory without touching the underlying data. The cost: the directory is an additional component that must stay consistent, available, and fast, since every query hits it first.
      </Paragraph>

      <Heading level={3} delay={1.10}>
        Geographical Sharding
      </Heading>

      <Paragraph delay={1.15}>
        Data is partitioned by geographic location, country, region, or continent. A global streaming service stores each country's user data in a data center within or near that country. Users in Germany hit the EU data center, users in Japan hit the Asia data center. Latency drops because data travels fewer kilometers. Regulatory compliance becomes easier too, data residency laws (GDPR, for example) often require that certain data stays within specific geographic boundaries.
      </Paragraph>

      <Heading level={3} delay={1.20}>
        Dynamic Sharding
      </Heading>

      <Paragraph delay={1.25}>
        Dynamic sharding automatically adjusts the number of shards based on load and data volume. An IoT platform ingesting sensor data from millions of devices can create new shards as data volume grows and merge shards as devices go offline. No manual rebalancing, no pre-planned shard count. The system adapts. The complexity is in the automation layer: something has to monitor load, decide when to split or merge, and coordinate data migration without downtime.
      </Paragraph>

      <Heading level={2} delay={1.30}>
        Benefits
      </Heading>

      <List delay={1.35}>
        <ListItem><strong>Improved query performance:</strong> queries target specific partitions instead of scanning the full dataset. A mystery novel search on a range-partitioned book database never touches the romance or sci-fi partitions.</ListItem>
        <ListItem><strong>Enhanced scalability:</strong> as data grows, add partitions. The existing partitions don't slow down. Horizontal scaling becomes a data operation, not just an infrastructure one.</ListItem>
        <ListItem><strong>Load balancing:</strong> workload distributes across nodes. No single node handles all reads and writes. A messaging service assigning messages round-robin across nodes keeps all nodes equally busy.</ListItem>
        <ListItem><strong>Data isolation and security:</strong> partition failure doesn't cascade. A corrupted shard affects only its data. Sensitive columns in a separate vertical partition can have stricter access controls and encryption, limiting exposure in a breach.</ListItem>
        <ListItem><strong>Parallel processing:</strong> independent partitions process simultaneously. An e-commerce company processing regional order data during peak sales can run each region in parallel, cutting total processing time proportional to the number of shards.</ListItem>
        <ListItem><strong>Storage efficiency and resource optimization:</strong> hot data (frequently accessed) goes on fast, expensive storage, cold data (archival, infrequent) goes on cheap, slow storage. Partitioning by access pattern makes this alignment possible without a single monolithic tier.</ListItem>
        <ListItem><strong>Faster data recovery:</strong> recover one partition instead of the whole dataset. A regional sales database can restore the most critical market's shard first, resuming operations before the full recovery is complete.</ListItem>
      </List>

      <Heading level={2} delay={1.40}>
        Takeaways
      </Heading>

      <List delay={1.45}>
        <ListItem>Partitioning splits data into independent pieces, horizontal by rows, vertical by columns, hybrid by both. The right method depends on your query patterns and access characteristics.</ListItem>
        <ListItem>The partition key is the most important design decision. A bad key creates hot shards that perform worse than no partitioning at all.</ListItem>
        <ListItem>Range-based sharding suits time-series and sequential data. Hash-based suits uniform distribution. Directory-based suits maximum flexibility. Geographical suits latency and compliance. Dynamic suits unpredictable growth.</ListItem>
        <ListItem>Most large-scale systems combine techniques, geographical at the top level, hash or range within each region, with a directory managing the mapping.</ListItem>
        <ListItem>Partitioning solves performance and scalability, but introduces operational complexity: shard rebalancing, cross-shard queries, and partition metadata management all need careful handling.</ListItem>
      </List>

      <Paragraph delay={1.50}>
        Data partitioning is one of the first tools you reach for when a single database node stops being enough. The mechanics are straightforward, the hard part is choosing the right scheme for your data's shape and your application's access patterns. Get that right and partitioning becomes a force multiplier, more nodes, more throughput, more resilience, with each piece independently manageable. Thanks for reading.
      </Paragraph>
    </>
  ),
};
