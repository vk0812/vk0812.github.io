import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ReadingProgressHeader from "@/components/ReadingProgressHeader";
import { blogPosts } from "@/content/posts";

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? blogPosts[slug] : null;
  const [progress, setProgress] = useState(0);
  const [showProgressHeader, setShowProgressHeader] = useState(false);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const articleRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const titleEl = titleRef.current;
    const articleEl = articleRef.current;

    const updateProgress = () => {
      if (!articleEl) return;

      const articleTop = articleEl.offsetTop;
      const articleHeight = articleEl.offsetHeight;
      const windowHeight = window.innerHeight;
      const scrollY = window.scrollY;

      const start = articleTop - windowHeight;
      const end = articleTop + articleHeight - windowHeight;
      const total = Math.max(end - start, 1);
      const current = scrollY - start;

      const percentage = Math.min(Math.max((current / total) * 100, 0), 100);
      setProgress(percentage);
    };

    const onScroll = () => updateProgress();

    const observer = titleEl
      ? new IntersectionObserver(
          ([entry]) => {
            setShowProgressHeader(!entry.isIntersecting);
          },
          { root: null, threshold: 0, rootMargin: "-80px 0px 0px 0px" }
        )
      : null;

    if (titleEl && observer) observer.observe(titleEl);

    window.addEventListener("scroll", onScroll, { passive: true });
    updateProgress();

    return () => {
      window.removeEventListener("scroll", onScroll);
      if (titleEl && observer) observer.unobserve(titleEl);
      observer?.disconnect();
    };
  }, [slug]);

  if (!post) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <Header />
        <main className="pt-32 pb-20 flex-1">
          <div className="container mx-auto px-6 max-w-4xl">
            <p className="text-foreground">Post not found.</p>
            <Link to="/writings" className="text-muted-foreground hover:text-foreground mt-4 inline-block">
              ← Back to Writings
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ReadingProgressHeader 
        title={post.title} 
        progress={progress} 
        isVisible={showProgressHeader} 
      />
      <AnimatePresence>
        {!showProgressHeader && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          >
            <Header />
          </motion.div>
        )}
      </AnimatePresence>
      <main className="pt-32 pb-20 flex-1">
        <div className="container mx-auto px-6 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <Link
              to="/writings"
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="font-sans text-sm">Back to Writings</span>
            </Link>

            <header className="mb-12">
              <h1 ref={titleRef} className="font-serif text-4xl md:text-5xl text-foreground mb-4">{post.title}</h1>
              {post.author && <p className="font-serif text-xl text-muted-foreground italic mb-2">{post.author}</p>}
              <p className="font-sans text-sm text-muted-foreground">{post.date}</p>
            </header>

            <article ref={articleRef} className="prose prose-lg max-w-none">
              {post.content}
            </article>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default BlogPost;
