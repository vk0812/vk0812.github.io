import { ReactNode } from "react";

export interface BlogPostMeta {
  title: string;
  author?: string;
  date: string;
  slug: string;
}

export interface BlogPostData extends BlogPostMeta {
  content: ReactNode;
}
