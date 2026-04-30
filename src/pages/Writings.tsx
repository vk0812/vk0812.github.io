import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface BlogPost {
  id: string;
  title: string;
  author?: string;
  date: string;
  tag: string;
  year: number;
}

const blogPosts: BlogPost[] = [
  { id: "grpo", title: "Group Relative Policy Optimization (GRPO)", date: "30/04", tag: "ML", year: 2026 },
  { id: "contrastive-learning", title: "Contrastive Learning", date: "30/04", tag: "ML", year: 2026 },
  { id: "intern-exp", title: "Going into the Adobe Life", date: "19/07", tag: "Intern", year: 2024 },
];

const tagColors: Record<string, string> = {
  LLMs: "bg-green-100 text-green-700",
  ML: "bg-purple-100 text-purple-700",
  Book: "bg-yellow-100 text-yellow-700",
  Intern: "bg-blue-100 text-blue-700",
};

const Writings = () => {
  const years = [...new Set(blogPosts.map((post) => post.year))].sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="pt-28 sm:pt-32 pb-16 sm:pb-20 flex-1 px-5 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground mb-8 sm:mb-12"
          >
            <span className="italic">W</span>ritings
          </motion.h1>

          {years.map((year, yearIndex) => (
            <motion.div
              key={year}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: yearIndex * 0.1 }}
            >
              {blogPosts
                .filter((post) => post.year === year)
                .map((post, postIndex) => (
                  <Link key={post.id} to={`/writings/${post.id}`} className="block group">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: yearIndex * 0.1 + postIndex * 0.05 }}
                      className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[5rem_1fr_auto_5rem] items-start sm:items-center gap-x-3 sm:gap-x-4 gap-y-2 py-5 sm:py-6 border-b border-border/50 hover:bg-muted/30 transition-colors -mx-3 sm:-mx-4 px-3 sm:px-4 rounded-lg"
                    >
                      {/* Year — desktop column / mobile inline tag */}
                      <div className="hidden sm:block w-20 shrink-0">
                        {postIndex === 0 && (
                          <span className="font-serif text-muted-foreground text-lg">{year}</span>
                        )}
                      </div>

                      {/* Mobile-only year (only first of group) */}
                      {postIndex === 0 && (
                        <span className="sm:hidden font-serif text-muted-foreground text-sm row-start-1 col-start-1">
                          {year}
                        </span>
                      )}
                      {postIndex !== 0 && <span className="sm:hidden row-start-1 col-start-1" />}

                      {/* Title */}
                      <div className="min-w-0 row-start-1 col-start-2 sm:col-start-2">
                        <span className="font-serif text-foreground text-lg sm:text-xl group-hover:text-foreground/80 transition-colors leading-snug block">
                          {post.title}
                        </span>
                        {post.author && (
                          <span className="font-serif text-muted-foreground text-base sm:text-xl italic block sm:inline sm:ml-2 mt-1 sm:mt-0">
                            {post.author}
                          </span>
                        )}
                      </div>

                      {/* Tag — top right on mobile, far right on desktop */}
                      <div className="row-start-1 col-start-3 sm:col-start-4 flex justify-end">
                        <span
                          className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-sans whitespace-nowrap ${tagColors[post.tag] || "bg-muted text-muted-foreground"}`}
                        >
                          {post.tag}
                        </span>
                      </div>

                      {/* Date — second row on mobile, third column on desktop */}
                      <div className="row-start-2 col-start-2 sm:row-start-1 sm:col-start-3 sm:text-right">
                        <span className="font-serif text-muted-foreground text-sm sm:text-base">{post.date}</span>
                      </div>
                    </motion.div>
                  </Link>
                ))}
            </motion.div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Writings;
