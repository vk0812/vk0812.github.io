import { BlogPostData } from "./types";
import {
  Paragraph,
  Heading,
  List,
  ListItem,
  IconArchitectureDiagram,
  DiagramNode,
  DiagramEdge,
} from "../components";
import { LostInMiddleDiagram } from "../components/animations/retrieval-augmented-generation/ConceptViz";
import {
  FileText,
  Scissors,
  Layers,
  Cpu,
  Database,
  Search,
  SlidersHorizontal,
  MessageSquare,
  CheckCircle,
} from "lucide-react";

const ingestionNodes: DiagramNode[] = [
  { id: "doc", label: "Product docs page", sub: "raw source document", icon: FileText, color: "text-slate-500", x: 50, y: 12 },
  { id: "chunk", label: "Chunking", sub: "fixed, semantic, or hierarchical", icon: Scissors, color: "text-amber-500", x: 50, y: 32 },
  { id: "chunks", label: "Chunks", sub: "small text spans", icon: Layers, color: "text-purple-500", x: 50, y: 52 },
  { id: "embed", label: "Embedding model", sub: "one vector per chunk", icon: Cpu, color: "text-blue-500", x: 50, y: 72 },
  { id: "store", label: "Vector store", sub: "chunk text plus its vector", icon: Database, color: "text-emerald-500", x: 50, y: 92 },
];

const ingestionEdges: DiagramEdge[] = [
  { id: "e-doc-chunk", from: "doc", to: "chunk" },
  { id: "e-chunk-chunks", from: "chunk", to: "chunks" },
  { id: "e-chunks-embed", from: "chunks", to: "embed" },
  { id: "e-embed-store", from: "embed", to: "store" },
];

const queryNodes: DiagramNode[] = [
  { id: "query", label: "User question", sub: "e.g. lost phone", icon: Search, color: "text-slate-500", x: 50, y: 12 },
  { id: "retrieve", label: "Retrieve", sub: "hybrid sparse plus dense search", icon: Database, color: "text-amber-500", x: 50, y: 32 },
  { id: "rerank", label: "Rerank", sub: "reorders candidates", icon: SlidersHorizontal, color: "text-purple-500", x: 50, y: 52 },
  { id: "generate", label: "Generate with citations", sub: "markers point back to chunks", icon: MessageSquare, color: "text-blue-500", x: 50, y: 72 },
  { id: "answer", label: "Answer", sub: "checkable against its cited sources", icon: CheckCircle, color: "text-emerald-500", x: 50, y: 92 },
];

const queryEdges: DiagramEdge[] = [
  { id: "e-query-retrieve", from: "query", to: "retrieve" },
  { id: "e-retrieve-rerank", from: "retrieve", to: "rerank" },
  { id: "e-rerank-generate", from: "rerank", to: "generate" },
  { id: "e-generate-answer", from: "generate", to: "answer" },
];

export const retrievalAugmentedGeneration: BlogPostData = {
  title: "Retrieval-augmented generation",
  date: "August 12, 2026",
  slug: "retrieval-augmented-generation",
  content: (
    <>
      <Paragraph delay={0.10}>
        Ask a large language model a question about something that happened last week, and one of two things happens. It either says it doesn't know, or it guesses with total confidence and gets the details wrong. Every model has a training cutoff, a fixed point in time after which it has seen nothing new. That's one real limit. The other is narrower but just as common. A model trained on public internet text has no idea what's in a company's internal wiki, a product's support docs, or last quarter's sales report, because none of that was ever public enough to end up in training data in the first place.
      </Paragraph>

      <Paragraph delay={0.15}>
        Retrieval-augmented generation, usually shortened to RAG, is the standard fix for both problems. Instead of asking a model to answer purely from what it memorized during training, a RAG system first goes and finds text that's actually relevant to the question, hands that text to the model as part of the prompt, and asks the model to answer using it. The model still does the writing, but it's no longer working from memory alone. It's working from a source handed to it a moment ago.
      </Paragraph>

      <Paragraph delay={0.20}>
        There's a second reason this matters beyond freshness and coverage. A model that answers purely from its own weights gives a reader no way to check its work. A model that answers from retrieved text can point back to exactly which passage it used, so a reader can verify the claim instead of trusting the model's tone alone. That property, tracing an answer back to a source, is arguably the more valuable half of RAG, and it's the part that takes the most care to get right.
      </Paragraph>

      <Heading level={2} delay={0.25}>
        Turning a document into retrievable chunks
      </Heading>

      <Paragraph delay={0.30}>
        Picture a fairly ordinary support docs page, one titled "Setting up two-factor authentication." It has five sections. An overview of what two-factor authentication is, a walkthrough for turning it on, a section on backup codes covering how many you get and how they work, a section on turning it back off, and a troubleshooting section for people who get locked out. Before any of this can be retrieved, it has to be broken into pieces small enough to search over and small enough to fit into a model's prompt alongside everything else. That breaking-into-pieces step is called chunking, and how it's done ends up mattering more than most people expect.
      </Paragraph>

      <Heading level={3} delay={0.35}>
        Fixed-size chunking
      </Heading>

      <Paragraph delay={0.40}>
        The simplest approach just picks a size, say 200 tokens, and cuts the document into pieces of that size. It usually keeps some overlap between consecutive pieces, so a chunk boundary doesn't erase context that spans two chunks. This is called <strong>fixed-size chunking</strong>, and it's fast, requires no understanding of the document's structure, and works the same way on any kind of text. The problem shows up the moment a cut lands in the wrong place. If chunk boundaries fall every 200 tokens with no regard for sentence or section breaks, a cut can land right in the middle of the backup codes section, splitting the sentence that says each code works only once into two separate chunks. Neither half reads as a complete thought on its own, and a search step that retrieves only the first half loses the actual point.
      </Paragraph>

      <Heading level={3} delay={0.45}>
        Semantic chunking
      </Heading>

      <Paragraph delay={0.50}>
        A different approach respects the document's natural boundaries, sentences and paragraphs, instead of a fixed character count. This is usually called <strong>semantic chunking</strong>. One common way to decide where a topic actually shifts, rather than just where a paragraph tag happens to sit, is to embed each sentence and compare it to the sentence right before it. When the similarity between two adjacent sentences drops sharply, that's a signal the topic just changed, and that's where a chunk boundary goes. Applied to the two-factor authentication page, this tends to produce a chunk that lines up neatly with the backup codes section, since the sentences inside it are about the same thing and the similarity to the neighboring troubleshooting section's sentences drops noticeably right at the break. The chunk this produces is a complete idea instead of an arbitrary slice.
      </Paragraph>

      <Heading level={3} delay={0.55}>
        Hierarchical chunking
      </Heading>

      <Paragraph delay={0.60}>
        A third approach keeps the document's actual structure around instead of throwing it away. This is usually called <strong>hierarchical chunking</strong>. Rather than treating the page as one flat wall of text, it keeps track of which chunk belongs to which section and which section belongs to which page. In practice this often means indexing small chunks, maybe a single paragraph inside the backup codes section, for precise matching, while also keeping a pointer from that small chunk back to its parent, the whole backup codes section. This is sometimes called parent document retrieval. A search step can match against the small, precise chunk to decide relevance, then hand the model the larger parent section instead of the tiny chunk alone, so the model gets the surrounding context the small chunk left out.
      </Paragraph>

      <Paragraph delay={0.65}>
        All three approaches are really trading off the same two things. A small chunk is easy to match precisely against a specific question, because it's about exactly one thing and nothing else dilutes it. But a small chunk can lose the surrounding context a reader would need to fully understand it, the way half a sentence about backup codes means nothing without the other half. A large chunk keeps that context intact, but it also drags in text that has nothing to do with the question, which makes the match less precise and costs more tokens once it lands in the model's prompt. There's no chunk size that wins on both axes at once. Production systems usually land somewhere in the middle, or reach for the hierarchical approach specifically so they don't have to pick just one.
      </Paragraph>

      <Paragraph delay={0.70}>
        Put all three ideas together, and the offline half of a RAG system, the part that runs before any user ever asks a question, looks like the same five-step pipeline no matter which chunking strategy runs inside it.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.05}
        height={650}
        nodes={ingestionNodes}
        edges={ingestionEdges}
        caption="The offline ingestion pipeline. A document gets chunked, each chunk gets embedded, and the result lands in a vector store ready to be searched."
      />

      <Heading level={2} delay={0.75}>
        Finding the right chunks
      </Heading>

      <Paragraph delay={0.80}>
        Once a document is chunked and every chunk has a vector, finding the right ones for a given question comes down to search. Production RAG systems typically run a keyword-style search and an embedding-based search against the same question at the same time, then merge the two candidate lists, a pattern usually called <strong>hybrid retrieval</strong>, rather than betting on just one. The two methods miss different things. A keyword search catches an exact product name or error code that an embedding search might blur past, while an embedding search catches a question that means the same thing as a chunk without sharing any of its words. Combining them catches more of what either one would have missed alone.
      </Paragraph>

      <Heading level={2} delay={0.85}>
        Reranking before generation
      </Heading>

      <Paragraph delay={0.90}>
        Retrieval usually pulls back more candidates than the model actually needs, somewhere in the dozens, and hands them to a second, slower model that scores each one against the question more carefully before the final few get passed along. That reranking step earns its cost because the first retrieval pass has to stay fast enough to search over a huge number of chunks, which means it can't afford to look closely at each one. A slower model that only has to score a short list can afford to be pickier, and it's usually the reranked order, not the original retrieval order, that decides which handful of chunks actually reach the model doing the writing.
      </Paragraph>

      <Heading level={2} delay={0.95}>
        Grounding the answer and citing where it came from
      </Heading>

      <Paragraph delay={1.00}>
        Say a user of that same documentation asks a support assistant built on top of it, "I lost my phone. How do I get back into my account." A retrieval step pulls back three chunks. The first is from the backup codes section, saying the account has ten single-use backup codes generated during setup. The second is from the troubleshooting section, saying to contact support if backup codes are also lost. The third, for reasons that will matter later, is from an older revision of the same page describing a since-removed SMS recovery flow. All three get handed to the model, and the model has to turn them into one coherent answer.
      </Paragraph>

      <Paragraph delay={1.05}>
        The way a RAG system produces an answer that actually cites its sources, instead of blending everything into one voice with no attribution, is mostly a matter of prompt design. This is what people mean by <strong>citation grounding</strong>. Each retrieved chunk gets a marker, something like [1], [2], [3], right in the prompt the model sees. The model is then instructed to reference those markers whenever it states a fact that came from one of the chunks. Ask the model the backup codes question and a well-behaved answer reads something like "You can use one of your ten backup codes [1], and if you've lost those too, contact support [2]."
      </Paragraph>

      <Paragraph delay={1.10}>
        A citation marker on its own is just a number the model chose to type. Nothing stops a model from citing the wrong chunk, or stating something with a lot of confidence and no citation at all. A useful safeguard is a post-processing step, sometimes called attribution checking or provenance checking, that takes each cited claim and checks whether the chunk it points to actually supports it. This can be as simple as another model call asking whether chunk one actually says this, or as involved as a dedicated model built for exactly that check. When the check fails, the system can flag the claim, drop it, or ask the model to try again.
      </Paragraph>

      <Paragraph delay={1.15}>
        It's worth being honest about what this buys and what it doesn't. Citing sources is instruction-following, not a guarantee. A model that's told to cite its sources is more likely to, and a model whose citations get checked afterward is more likely to have citations that hold up. Neither step makes it impossible for the model to cite the wrong source, state something unsupported without flagging it, or lean on its own pretrained knowledge instead of the text it was actually handed. Citation grounding narrows the gap between what a model says and what it can actually back up. It doesn't close it.
      </Paragraph>

      <Paragraph delay={1.20}>
        The online half of a RAG system, the part that runs every time a user actually asks something, chains these pieces together in order.
      </Paragraph>

      <IconArchitectureDiagram
        delay={0.06}
        height={650}
        nodes={queryNodes}
        edges={queryEdges}
        caption="The online query-time pipeline. Retrieval finds candidates for the question, reranking reorders them, and the model generates an answer with citations pointing back to the chunks it used."
      />

      <Heading level={2} delay={1.25}>
        Where retrieval-augmented generation actually breaks
      </Heading>

      <Paragraph delay={1.30}>
        Most of what goes wrong in a RAG system has nothing to do with retrieval or generation being broken in isolation. Each piece can work exactly as designed, and the system can still produce a bad answer, because the failure lives in how the pieces interact.
      </Paragraph>

      <Heading level={3} delay={1.35}>
        Retrieval mismatch
      </Heading>

      <Paragraph delay={1.40}>
        Sometimes the retriever returns text that's topically related to the question without actually answering it. Ask how to get back into an account without a phone, and a retriever leaning on keyword overlap might surface the section on disabling two-factor authentication, since it also talks about phones and account access, instead of the backup codes section that actually answers the question. The retrieved chunk isn't wrong or irrelevant exactly, it's just not an answer. A model asked to generate from it either stretches it into something that sounds like an answer or admits it doesn't know, when the real answer was one section away.
      </Paragraph>

      <Heading level={3} delay={1.45}>
        Stale index
      </Heading>

      <Paragraph delay={1.50}>
        A vector store or search index is a snapshot, not a live view of a document. If the two-factor authentication page gets edited to remove the old SMS recovery flow, and the index behind the retrieval step never gets rebuilt against the new version, a question about account recovery can still confidently retrieve a description of a feature that no longer exists. Nothing about the retrieval step signals that anything is wrong, since the chunk was a perfectly good match for the query at the time it was indexed. The mismatch only shows up once someone tries to actually follow the outdated instructions.
      </Paragraph>

      <Heading level={3} delay={1.55}>
        Context stuffing and lost in the middle
      </Heading>

      <Paragraph delay={1.60}>
        It's tempting to fix a weak retrieval step by just retrieving more, stuffing eight or ten chunks into the prompt instead of three or four so the right one is more likely to be somewhere in there. This runs into a real limit of how language models read long contexts. Information placed near the very start or the very end of a context window tends to get used more reliably than information buried in the middle of it, an effect usually called <strong>lost in the middle</strong>. Put the backup codes chunk in fifth position out of eight, and the model can have every fact it needs sitting in its context and still write an answer that skips it, simply because of where that chunk happened to land.
      </Paragraph>

      <LostInMiddleDiagram
        delay={0.07}
        caption="A chunk's position in the prompt, not just its relevance, shapes how reliably a model actually uses it. Chunks near the start and end of the context tend to fare better than ones buried in the middle."
      />

      <Heading level={3} delay={1.65}>
        Contradiction between retrieved chunks
      </Heading>

      <Paragraph delay={1.70}>
        Two retrieved chunks can also just disagree. Say an older FAQ page, still sitting in the index alongside the current docs, says backup codes can be reused, while the current backup codes section says each code works exactly once. A retrieval step that doesn't know one source is authoritative and the other is stale will happily hand both to the model. The model then has to reconcile two contradictory facts with no signal about which one is right, and it usually does that silently, picking one version and writing a confident answer that never mentions the other chunk disagreed with it at all.
      </Paragraph>

      <Heading level={3} delay={1.75}>
        Over-reliance and under-reliance
      </Heading>

      <Paragraph delay={1.80}>
        The failure can point in either direction. A model that over-relies on retrieved text treats whatever it was handed as fact, even the outdated SMS recovery chunk from the stale index example, and repeats it without applying any judgment about whether it's still accurate. A model that under-relies on retrieved text does the opposite. It gets handed the exact right chunk about backup codes and, for whatever reason, defaults to what it already knows about two-factor authentication in general instead, giving a generic answer that doesn't match this specific product's actual recovery flow. Both failures look the same from the outside, a wrong answer, but they come from opposite instincts, trusting the retrieved text too much and trusting it too little.
      </Paragraph>

      <Heading level={2} delay={1.85}>
        Takeaways
      </Heading>

      <List delay={1.90}>
        <ListItem>Retrieval-augmented generation hands a model retrieved text so it can answer using knowledge that's newer than its training cutoff or too narrow to have ever been in training data, and so its answers can be checked against a source.</ListItem>
        <ListItem>Chunking strategy, fixed-size, semantic, or hierarchical, trades retrieval precision against preserved context, and that trade shapes almost everything downstream of it.</ListItem>
        <ListItem>Hybrid retrieval and reranking exist to narrow a huge corpus down to a short, carefully ordered list before generation ever runs.</ListItem>
        <ListItem>Citation markers plus a post-hoc attribution check make an answer's sources checkable, but getting a model to cite correctly is instruction-following, not a guarantee.</ListItem>
        <ListItem>Most real RAG failures, retrieval mismatch, a stale index, lost in the middle, contradiction between chunks, over-reliance or under-reliance, come from how retrieval and generation interact, not from either half being broken alone.</ListItem>
      </List>

      <Paragraph delay={1.95}>
        Zoom out and RAG is really an admission that a language model's weights are not the only place useful knowledge should live. Some of it belongs in a document that gets edited next week, some of it belongs behind a company's login wall, and some of it just needs to be checkable by a reader who doesn't want to take a model's word for it. Retrieval is how that knowledge gets into the conversation. Getting the handoff between retrieval and generation right, chunked well, ranked well, cited honestly, is most of the actual engineering work. Thanks for reading.
      </Paragraph>
    </>
  ),
};
