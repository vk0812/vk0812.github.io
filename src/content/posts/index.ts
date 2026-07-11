import { BlogPostData } from "./types";
import { exampleShowcase } from "./example-showcase";
import { internExp } from "./intern-exp";
import { contrastiveLearning } from "./contrastive-learning";
import { grpoPost } from "./grpo";
import { loadBalancing } from "./load-balancing";
import { cachingPost } from "./caching";
import { systemDesignBasics } from "./system-design-basics";
import { dataPartitioning } from "./data-partitioning";
import { proxies } from "./proxies";
import { redundancyAndReplication } from "./redundancy-and-replication";
import { cdn } from "./cdn";
import { capTheorem } from "./cap-theorem";
import { webProtocols } from "./web-protocols";
import { heartbeatAndChecksum } from "./heartbeat-and-checksum";
import { quorum } from "./quorum";
import { bloomFilters } from "./bloom-filters";
import { consistentHashing } from "./consistent-hashing";
import { cors } from "./cors";
import { rateLimiting } from "./rate-limiting";
import { messageQueues } from "./message-queues";
import { designingUrlShortener } from "./designing-url-shortener";
import { designingPastebin } from "./designing-pastebin";
import { designingInstagram } from "./designing-instagram";
import { designingDropbox } from "./designing-dropbox";
import { designingMessenger } from "./designing-messenger";
import { designingYoutube } from "./designing-youtube";
import { designingTypeahead } from "./designing-typeahead";

export const blogPosts: Record<string, BlogPostData> = {
  "example-showcase": exampleShowcase,
  "intern-exp": internExp,
  "contrastive-learning": contrastiveLearning,
  "grpo": grpoPost,
  "load-balancing": loadBalancing,
  "caching": cachingPost,
  "system-design-basics": systemDesignBasics,
  "data-partitioning": dataPartitioning,
  "proxies": proxies,
  "redundancy-and-replication": redundancyAndReplication,
  "cdn": cdn,
  "cap-theorem": capTheorem,
  "web-protocols": webProtocols,
  "heartbeat-and-checksum": heartbeatAndChecksum,
  "quorum": quorum,
  "bloom-filters": bloomFilters,
  "consistent-hashing": consistentHashing,
  "cors": cors,
  "rate-limiting": rateLimiting,
  "message-queues": messageQueues,
  "designing-url-shortener": designingUrlShortener,
  "designing-pastebin": designingPastebin,
  "designing-instagram": designingInstagram,
  "designing-dropbox": designingDropbox,
  "designing-messenger": designingMessenger,
  "designing-youtube": designingYoutube,
  "designing-typeahead": designingTypeahead,
};

export type { BlogPostData, BlogPostMeta } from "./types";
