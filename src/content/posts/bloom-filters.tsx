import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  BlogImage,
  Formula,
  InlineCode,
  List,
  ListItem,
} from "../components";

export const bloomFilters: BlogPostData = {
  title: "Bloom Filters",
  date: "May 29, 2026",
  slug: "bloom-filters",
  content: (
    <>
      <Paragraph delay={0.1}>
        Imagine you need to check whether something is in a huge collection without keeping the whole collection in memory. A Bloom filter does exactly that. It's a space-efficient probabilistic data structure for set membership: it can tell you an item is definitely not in a set, or that it's probably in the set. The asymmetry is the whole point. False negatives are impossible, the filter never misses something that was actually added, but false positives are possible, it can occasionally claim an item is present when it isn't.
      </Paragraph>

      <Paragraph delay={0.15}>
        That trade, a tiny error rate in exchange for big wins in space and speed, pays off constantly in real systems where memory is precious and an occasional false alarm just means one extra lookup. Burton Bloom described the structure in 1970, and it's only gotten more useful as datasets have grown.
      </Paragraph>

      <Heading level={2} delay={0.2}>
        What Is a Bloom Filter?
      </Heading>

      <Paragraph delay={0.25}>
        At its core a Bloom filter answers one question: "have we seen this item before?" It has two parts. A <strong>bit array</strong> of <InlineCode>m</InlineCode> bits, all initialized to 0, which stores the set bits. And <strong>k hash functions</strong>, each of which maps an input key to a position in that bit array. That's it. No keys are stored, no values, just a strip of bits and a handful of hash functions.
      </Paragraph>

      <BlogImage
        delay={0.3}
        size="lg"
        src="/blog/bloom_filters/what_is.png"
        alt="A Bloom filter consists of a bit array of size m initialized to 0s, plus k independent hash functions. Add(key) sets bits at each hash position to 1; Query(key) checks membership."
        caption="Figure 1: A Bloom filter is a bit array plus k hash functions. Add sets bits, query checks them."
      />

      <Heading level={2} delay={0.35}>
        Structure and Operations
      </Heading>

      <Paragraph delay={0.4}>
        There are exactly two operations. <strong>Insert</strong> takes a key, runs it through all <InlineCode>k</InlineCode> hash functions to get <InlineCode>k</InlineCode> positions, and sets the bit at each of those positions to 1. If a bit is already 1, it stays 1. <strong>Query</strong> runs the same key through the same <InlineCode>k</InlineCode> hash functions and checks those positions. If all of them are 1, the item is probably in the set. If even one of them is 0, the item is definitely not in the set, because if it had been inserted, that bit would have been set.
      </Paragraph>

      <BlogImage
        delay={0.45}
        size="lg"
        src="/blog/bloom_filters/structure.png"
        alt="Structure: bit array of m bits initialized to 0, and k hash functions mapping keys to positions. Insert 'apple' sets bits via h1, h2, h3. Query 'apple' all 1s means probably in set; query 'banana' at least one 0 means definitely not in set."
        caption="Figure 2: Insert sets all k bits to 1. On query, all 1s means probably present, any 0 means definitely absent."
      />

      <Paragraph delay={0.5}>
        Why several hash functions instead of one? Think of each hash as stamping the item with an independent label somewhere in the array. Spreading each item across <InlineCode>k</InlineCode> positions is what makes false negatives impossible: an inserted item would have to lose all <InlineCode>k</InlineCode> of its bits to be missed, and bits never get unset. The flip side is that when many items crowd the array, their stamps can collectively cover every position some other item would check, and that's where a false positive comes from.
      </Paragraph>

      <Heading level={2} delay={0.55}>
        A Numerical Walkthrough
      </Heading>

      <Paragraph delay={0.6}>
        Take a bit array of size <InlineCode>m = 10</InlineCode> and <InlineCode>k = 3</InlineCode> hash functions. We insert the key <InlineCode>"cat"</InlineCode>. The three hashes give us positions <InlineCode>h1("cat") = 1</InlineCode>, <InlineCode>h2("cat") = 4</InlineCode>, <InlineCode>h3("cat") = 7</InlineCode>, so we set bits 1, 4, and 7 to 1. The rest of the array stays 0.
      </Paragraph>

      <Paragraph delay={0.65}>
        Now query <InlineCode>"cat"</InlineCode>: it hashes to (1, 4, 7), all three bits are 1, so the answer is "probably in set." Correct. Now query <InlineCode>"dog"</InlineCode>: it hashes to (2, 6, 8), and those bits are still (0, 0, 0). Because at least one is 0, we can say with certainty that <InlineCode>"dog"</InlineCode> is definitely not in the set. No lookup needed, we've ruled it out for free.
      </Paragraph>

      <BlogImage
        delay={0.7}
        size="lg"
        src="/blog/bloom_filters/example.png"
        alt="Example with m=10 and k=3. Insert 'cat': h1=1, h2=4, h3=7, so bits 1,4,7 are set. Query 'cat' hashes to (1,4,7), all bits 1, result probably in set. Query 'dog' hashes to (2,6,8), bits (0,0,0), result definitely not in set."
        caption="Figure 3: Walkthrough for m=10, k=3. Inserting 'cat' sets bits 1, 4, 7. 'cat' queries positive; 'dog' hits a 0 and is ruled out."
      />

      <Heading level={2} delay={0.75}>
        Key Characteristics
      </Heading>

      <Paragraph delay={0.8}>
        Four properties define the structure and explain where it fits.
      </Paragraph>

      <List delay={0.85}>
        <ListItem><strong>Constant time:</strong> both insert and query are <InlineCode>O(k)</InlineCode>. Since <InlineCode>k</InlineCode> is a small fixed number (often 3 to 10), operations cost a fixed handful of hash computations and array accesses regardless of how many items the filter already holds. A filter with a million items is just as fast as one with ten.</ListItem>
        <ListItem><strong>Space efficient:</strong> a compact bit array stands in for the whole set. There's no storing of the actual keys, which is what makes it viable for billions of items.</ListItem>
        <ListItem><strong>Probabilistic:</strong> it allows false positives but never false negatives. A "no" is always trustworthy. A "yes" means "maybe."</ListItem>
        <ListItem><strong>No deletions:</strong> a standard Bloom filter can't remove an item. Clearing a bit might erase evidence of other items that hashed to the same position.</ListItem>
      </List>

      <BlogImage
        delay={0.9}
        size="md"
        src="/blog/bloom_filters/key_characteristics.png"
        alt="Key characteristics: Time complexity O(k) for insert and query (constant time); Space efficient compact bit array ideal for large datasets; Probabilistic, allows false positives but never false negatives; No deletions, standard Bloom filter doesn't support deletions."
        caption="Figure 4: The four defining traits. Constant time, compact, probabilistic, and append-only."
      />

      <Heading level={2} delay={0.95}>
        Why "Probably"? Understanding False Positives
      </Heading>

      <Paragraph delay={1.0}>
        Here's an analogy that makes the false positive click. Picture a guest log that's a single large sheet of paper. Instead of writing names, every visitor presses their thumb on a few specific spots, leaving fingerprints. The spots are fixed per person by some rule, that's the hash functions. To check whether someone visited before, you have them press the same spots and look: if any of those spots is clean, they've definitely never been here. But if all their spots are already smudged, maybe they visited, or maybe other people's thumbs happened to smudge exactly those spots. You can't tell the difference, so you answer "probably."
      </Paragraph>

      <Paragraph delay={1.05}>
        That's the whole mechanism. The paper is the bit array, each thumbprint covers several positions, and overlapping smudges from different people are false positives. What you'll never get wrong is a "no" for someone who did visit, because once their spots are smudged they stay smudged. In Bloom filter terms, once a bit is set for an inserted item, it stays set, so a query for that item can never find a 0. The structure compresses the set into a fixed number of bits, and that compression is exactly what buys the space savings and what loses the ability to tell some combinations of items apart.
      </Paragraph>

      <Paragraph delay={1.1}>
        When the filter returns "probably in set," systems that need certainty just fall through to a slower exact check, the real database read or cache lookup. The Bloom filter's job isn't to be the final word, it's to cheaply screen out the definite misses so you never waste an expensive lookup on something that isn't there.
      </Paragraph>

      <Heading level={2} delay={1.15}>
        Pros and Cons
      </Heading>

      <Paragraph delay={1.2}>
        The strengths and the sharp edges, side by side.
      </Paragraph>

      <List delay={1.25}>
        <ListItem><strong>Pros:</strong> very space efficient, fast insert and lookup at <InlineCode>O(k)</InlineCode>, scales to billions of items, perfect for read-heavy workloads, and zero false negatives.</ListItem>
        <ListItem><strong>Cons:</strong> false positives are possible, the standard version has no deletions, performance degrades as the filter fills up, and it's simply the wrong tool when 100% accuracy is required.</ListItem>
      </List>

      <BlogImage
        delay={1.3}
        size="lg"
        src="/blog/bloom_filters/pros_cons.png"
        alt="Pros: very space efficient, fast insert and lookup O(k), scales well for billions of items, perfect for read-heavy workloads, zero false negatives. Cons: false positives possible, no support for deletions (standard version), performance degrades as filter gets full, not suitable when 100% accuracy is required."
        caption="Figure 5: Bloom filters trade a small, tunable false-positive rate for big gains in space and speed."
      />

      <Heading level={2} delay={1.35}>
        A System Use Case
      </Heading>

      <Paragraph delay={1.4}>
        The canonical use is as a pre-filter that sits in memory in front of expensive storage. A client request hits the Bloom filter first. If the filter says "definitely not" (it found a 0), the system skips the disk read or network hop entirely and returns "not found." Only when the filter says "might exist" (all 1s) does the system pay for the real lookup, accepting that a small fraction of those will be false alarms.
      </Paragraph>

      <Paragraph delay={1.45}>
        Apache Cassandra is the textbook example. It keeps a Bloom filter per SSTable so it can decide whether a key might live in that file before reading it from disk. Most of the time a key isn't in a given SSTable, and the filter lets Cassandra skip the read instead of paying for it. The same pattern shows up in databases avoiding lookups for non-existent keys, web caches screening requests, and distributed systems cutting network round-trips for missing data.
      </Paragraph>

      <BlogImage
        delay={1.5}
        size="lg"
        src="/blog/bloom_filters/system_use_case.png"
        alt="System use case: client request hits an in-memory Bloom filter before the storage layer. 'Might exist' (all 1s) goes to disk/DB; 'definitely not' (any 0) skips the lookup and returns not found. Example: Cassandra uses Bloom filters in SSTables to decide if a key might exist before reading from disk."
        caption="Figure 6: A Bloom filter as a pre-filter. Definite misses skip the disk read entirely; Cassandra does this per SSTable."
      />

      <Heading level={2} delay={1.55}>
        Tuning: Size and Hash Count
      </Heading>

      <Paragraph delay={1.6}>
        Two knobs control the false positive rate. The bit array size <InlineCode>m</InlineCode>: a larger array means bits are filled more sparsely for the same number of items, so accidental overlaps are rarer, fewer false positives but more memory. And the number of hash functions <InlineCode>k</InlineCode>: too few and each item doesn't stake out enough territory, too many and you fill the array too fast. There's a sweet spot. For an expected <InlineCode>n</InlineCode> items in an <InlineCode>m</InlineCode>-bit array, the <InlineCode>k</InlineCode> that minimizes the false positive rate is:
      </Paragraph>

      <Formula block delay={1.65}>
        {`k = \\frac{m}{n} \\ln 2`}
      </Formula>

      <Paragraph delay={1.7}>
        The practical goal is to choose <InlineCode>m</InlineCode> and <InlineCode>k</InlineCode> together to balance memory against an acceptable false positive rate. The relationship between <InlineCode>k</InlineCode> and the false positive rate is U-shaped: it drops as you add hash functions, bottoms out at the optimal <InlineCode>k</InlineCode>, then climbs again as extra hashes just crowd the array. Most systems let you set a target rate, 1% or 0.1% or lower, and size the filter to hit it. Cassandra, for instance, lets you tune the per-table false positive target, spending more memory to push it down.
      </Paragraph>

      <BlogImage
        delay={1.75}
        size="lg"
        src="/blog/bloom_filters/tuning_tips.png"
        alt="Tuning tips: Size m, a larger bit array means fewer false positives but more memory. Hash functions k, optimal k is (m/n) ln 2 where n is the expected number of items. Goal: choose m and k to balance memory usage and acceptable false positive rate. A U-shaped curve shows false positive rate against number of hash functions k."
        caption="Figure 7: Bigger array means fewer false positives. The false-positive curve against k is U-shaped, with a clear optimum."
      />

      <Heading level={2} delay={1.8}>
        Takeaways
      </Heading>

      <List delay={1.85}>
        <ListItem>A Bloom filter is a bit array plus <InlineCode>k</InlineCode> hash functions. Insert sets <InlineCode>k</InlineCode> bits, query checks them: all 1s means probably present, any 0 means definitely absent.</ListItem>
        <ListItem>No false negatives, ever. False positives are possible but their rate is tunable through the array size and hash count.</ListItem>
        <ListItem>Both operations are <InlineCode>O(k)</InlineCode>, constant time independent of how many items are stored, which is why filters scale to billions of entries.</ListItem>
        <ListItem>The standard filter can't delete. If you need removals, reach for a counting Bloom filter (counters instead of bits) at the cost of more memory.</ListItem>
        <ListItem>The killer use is screening out definite misses before an expensive lookup, exactly what Cassandra does with per-SSTable filters.</ListItem>
      </List>

      <Paragraph delay={1.9}>
        Bloom filters are one of those ideas that feel like a cheat once they click: you give up perfect accuracy in one direction only, and in return you get a membership test that fits billions of items into a few megabytes and answers in constant time. For any read-heavy system where most lookups are misses, that's an enormous win. Thanks for reading.
      </Paragraph>
    </>
  ),
};
