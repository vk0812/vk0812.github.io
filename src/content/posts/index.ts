import { BlogPostData } from "./types";
import { exampleShowcase } from "./example-showcase";
import { internExp } from "./intern-exp";
import { contrastiveLearning } from "./contrastive-learning";
import { grpoPost } from "./grpo";

export const blogPosts: Record<string, BlogPostData> = {
  "example-showcase": exampleShowcase,
  "intern-exp": internExp,
  "contrastive-learning": contrastiveLearning,
  "grpo": grpoPost,
};

export type { BlogPostData, BlogPostMeta } from "./types";
