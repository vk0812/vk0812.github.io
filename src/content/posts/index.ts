import { BlogPostData } from "./types";
import { llmsCreation } from "./llms-creation";
import { onBullshit } from "./on-bullshit";
import { erc721Factory } from "./erc721-factory";
import { sandboxDesign } from "./sandbox-design";
import { technopoly } from "./technopoly";
import { trueBeliver } from "./true-believer";
import { exampleShowcase } from "./example-showcase";

export const blogPosts: Record<string, BlogPostData> = {
  "example-showcase": exampleShowcase,
  "llms-creation": llmsCreation,
  "on-bullshit": onBullshit,
  "erc721-factory": erc721Factory,
  "sandbox-design": sandboxDesign,
  "technopoly": technopoly,
  "true-believer": trueBeliver,
};

export type { BlogPostData, BlogPostMeta } from "./types";
