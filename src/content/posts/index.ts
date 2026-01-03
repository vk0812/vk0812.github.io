import { BlogPostData } from "./types";
import { exampleShowcase } from "./example-showcase";
import { internExp } from "./intern-exp";

export const blogPosts: Record<string, BlogPostData> = {
  "example-showcase": exampleShowcase,
  "intern-exp": internExp,
};

export type { BlogPostData, BlogPostMeta } from "./types";
