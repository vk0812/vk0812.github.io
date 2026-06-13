import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  BlogImage,
  InlineCode,
  List,
  ListItem,
} from "../components";

export const consistentHashing: BlogPostData = {
  title: "Consistent Hashing",
  date: "May 29, 2026",
  slug: "consistent-hashing",
  content: (
    <>
      <Paragraph delay={0.1}>
        When you design a system that spreads data across many servers, two questions sit at the center of everything. Given a key, which server holds its data? And when you add or remove a server, how much data has to move? Get the first wrong and lookups become a guessing game. Get the second wrong and every scaling event becomes a painful, system-wide reshuffle. Consistent hashing is the answer to both, and it's the partitioning scheme underneath systems like Amazon DynamoDB and Apache Cassandra.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        Why Not Just Use Modulo?
      </Heading>

      <Paragraph delay={0.25}>
        The obvious approach: hash the key to a number, then take that number modulo the server count to pick a server. <InlineCode>server = hash(key) % N</InlineCode>. With 4 servers, keys land on servers 0 through 3, nicely spread out. It works perfectly until <InlineCode>N</InlineCode> changes.
      </Paragraph>

      <Paragraph delay={0.3}>
        The moment you add or remove a server, <InlineCode>N</InlineCode> changes, and since <InlineCode>N</InlineCode> is baked into the formula, almost every key now maps to a different server. Going from 4 servers to 5 remaps roughly 80% of keys. Every one of those keys has to physically move to a new node before reads work again. That's a near-total reshuffle for the sake of one new machine, and it's exactly what makes plain modulo hashing unusable at scale.
      </Paragraph>

      <BlogImage
        delay={0.35}
        size="md"
        src="/blog/consistent_hashing/what_is.png"
        alt="What is consistent hashing: a way to distribute keys across servers in a distributed system. Traditional modulo hashing reshuffles almost everything when a node count changes, while consistent hashing moves only a small set of keys when nodes are added or removed."
        caption="Figure 1: Modulo hashing remaps almost everything when a node joins or leaves. Consistent hashing moves only a small fraction."
      />

      <Heading level={2} delay={0.4}>
        How It Works
      </Heading>

      <Paragraph delay={0.45}>
        Consistent hashing arranges the entire hash space, say <InlineCode>0</InlineCode> to <InlineCode>2^32 - 1</InlineCode>, into a circle. Both servers and keys get hashed onto this same ring. Each server lands at some position, and the position where a server sits is called its <strong>token</strong>. To find which server owns a key, you hash the key onto the ring and walk clockwise until you hit the first server. That server is the key's <strong>coordinator</strong>, responsible for storing it.
      </Paragraph>

      <Paragraph delay={0.5}>
        Equivalently, each server owns the arc of the ring between the previous server's token and its own. With tokens at 100, 800, 1600, 2400, and 3200, the server at token 800 owns everything that hashes into the gap leading up to it. A read or write hashes the key (using something like MD5), the result lands somewhere on the ring, and clockwise walk lands on the owning node. No global <InlineCode>N</InlineCode> in the formula, which is the entire trick.
      </Paragraph>

      <BlogImage
        delay={0.55}
        size="md"
        src="/blog/consistent_hashing/how_it_works.png"
        alt="How it works, the ring: servers S1 through S5 and keys K1 through K5 are placed on the same circular hash space from 0 to 2^32 - 1. A key is assigned to the first node encountered moving clockwise; that coordinator node is responsible for the key."
        caption="Figure 2: Servers and keys share one circular hash space. Each key is owned by the first node found walking clockwise."
      />

      <Heading level={2} delay={0.6}>
        The Payoff
      </Heading>

      <Paragraph delay={0.65}>
        Now the part that makes it all worthwhile. When a node leaves the ring, only the keys it owned need to move, and they all go to a single place: its clockwise successor. Every other key on the ring stays exactly where it was. If you have 5 evenly spread nodes and one dies, only about <InlineCode>1/5</InlineCode> of the keys move, not 80%.
      </Paragraph>

      <Paragraph delay={0.7}>
        Adding a node is the mirror image. A new node drops onto the ring and takes over just one slice of the key space, the portion stretching back to its clockwise predecessor. Joining a cluster of 5 to make 6 moves only about <InlineCode>1/6</InlineCode> of the keys. The rest of the ring never notices. This locality, where a membership change touches only a neighbor, is the defining property of consistent hashing.
      </Paragraph>

      <BlogImage
        delay={0.75}
        size="md"
        src="/blog/consistent_hashing/node_changes.png"
        alt="Node changes, minimal remapping. When a node leaves, the keys it held are reassigned to its clockwise successor, only about 1/5 of keys remap. When a node joins, it takes a portion of the key space from its clockwise predecessor, only about 1/6 of keys remap."
        caption="Figure 3: A node leaving hands its keys to its clockwise successor; a node joining takes a slice from its predecessor. Only a fraction moves."
      />

      <Heading level={2} delay={0.8}>
        Virtual Nodes
      </Heading>

      <Paragraph delay={0.85}>
        The basic scheme has a flaw. With one token per physical node, the ring is carved into a few big arcs, and there's no reason those arcs are equal. One node might own a huge slice and become a hotspot while another sits nearly idle. Worse, when a node dies, all its load dumps onto a single successor, and rebuilding a node leans entirely on its handful of replicas.
      </Paragraph>

      <Paragraph delay={0.9}>
        Virtual nodes fix this. Instead of one token, each physical node is assigned many tokens scattered around the ring, each owning a small subrange. So a single machine shows up at dozens or hundreds of points on the ring rather than one. Because the load is now an average over many small ranges, it spreads far more evenly, and the law of large numbers smooths out the lumps.
      </Paragraph>

      <Paragraph delay={0.95}>
        Virtual nodes also make heterogeneous clusters easy. A more powerful machine simply gets more virtual nodes, say 8 instead of 4, so it owns more ranges and handles proportionally more keys. And when a node fails, its many small ranges are inherited by many different physical nodes, so the rebuild and the extra load are shared across the cluster instead of crushing one neighbor.
      </Paragraph>

      <BlogImage
        delay={1.0}
        size="lg"
        src="/blog/consistent_hashing/virtual_nodes.png"
        alt="Virtual nodes for load balancing. Each physical node is assigned multiple virtual nodes on the ring, breaking the ring into many small token ranges so keys distribute more evenly. A powerful machine can be given more vnodes, for example 8 instead of 4, so it owns more ranges and handles more keys."
        caption="Figure 4: Each physical node holds many vnodes scattered around the ring. More vnodes for a stronger machine, smoother load for everyone."
      />

      <Heading level={2} delay={1.05}>
        Replication for High Availability
      </Heading>

      <Paragraph delay={1.1}>
        Partitioning decides where data lives. Replication decides how many copies survive a failure. The <strong>replication factor</strong> <InlineCode>N</InlineCode> is the number of nodes that hold a copy of each item. With <InlineCode>N = 3</InlineCode>, every item exists on three different nodes.
      </Paragraph>

      <Paragraph delay={1.15}>
        It follows the ring naturally. The coordinator (the first node clockwise from the key) stores the data, then copies it to the next <InlineCode>N - 1</InlineCode> nodes walking clockwise. So for <InlineCode>N = 3</InlineCode>, a key stored at its coordinator is also replicated to the next two successors. If the coordinator fails, the replicas still have the data and serve reads without interruption. In most of these systems the copying happens asynchronously in the background, which means the system is eventually consistent: replicas may briefly diverge but are designed to converge, and that relaxation is what buys high availability.
      </Paragraph>

      <BlogImage
        delay={1.2}
        size="lg"
        src="/blog/consistent_hashing/replication.png"
        alt="Replication for high availability with replication factor 3. The coordinator node stores the data and replicates it to the next N successor nodes clockwise on the ring. Replication happens asynchronously, so if a node fails the data still lives on the other replicas. A key A is stored on the coordinator plus its first, second, and third clockwise replicas."
        caption="Figure 5: With N=3, the coordinator copies each item to its next two clockwise successors. A node failure costs no data."
      />

      <Heading level={2} delay={1.3}>
        Takeaways
      </Heading>

      <List delay={1.35}>
        <ListItem>Plain <InlineCode>hash(key) % N</InlineCode> works until <InlineCode>N</InlineCode> changes, then it remaps almost every key. Consistent hashing removes <InlineCode>N</InlineCode> from the lookup entirely.</ListItem>
        <ListItem>Servers and keys share one circular hash space. A key is owned by the first node found walking clockwise, equivalently the node whose token ends its arc.</ListItem>
        <ListItem>A node joining or leaving touches only a neighbor, so only about <InlineCode>1/N</InlineCode> of keys move instead of nearly all of them.</ListItem>
        <ListItem>Virtual nodes give each physical machine many small ranges, which evens out load, supports heterogeneous hardware, and spreads rebuild work across the cluster.</ListItem>
        <ListItem>Replication walks the ring: the coordinator copies each item to its next <InlineCode>N - 1</InlineCode> clockwise successors, usually asynchronously, for eventual consistency and high availability.</ListItem>
      </List>

      <Paragraph delay={1.6}>
        Consistent hashing is one of those rare ideas that's simple to picture, a ring with points on it, yet quietly solves the hardest part of running a stateful distributed system: changing the cluster without moving the world. Bolt on virtual nodes for balance and ring-based replication for durability, and you have the backbone of DynamoDB, Cassandra, and most large-scale stores in production today. Thanks for reading.
      </Paragraph>
    </>
  ),
};
