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
  { id: "intern-exp", title: "Going into the Adobe Life", date: "03/01", tag: "Dev", year: 2026 },
];

const tagColors: Record<string, string> = {
  LLMs: "bg-green-100 text-green-700",
  Book: "bg-yellow-100 text-yellow-700",
  Dev: "bg-blue-100 text-blue-700",
};

const Writings = () => {
  const years = [...new Set(blogPosts.map((post) => post.year))].sort((a, b) => b - a);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="pt-32 pb-20 flex-1">
        <div className="container mx-auto px-6 max-w-4xl">
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
                  <Link
                    key={post.id}
                    to={`/writings/${post.id}`}
                    className="block group"
                  >
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3, delay: yearIndex * 0.1 + postIndex * 0.05 }}
                      className="flex items-center py-6 border-b border-border/50 hover:bg-muted/30 transition-colors -mx-4 px-4 rounded-lg"
                    >
                      {/* Year column - only show for first post of each year */}
                      <div className="w-20 shrink-0">
                        {postIndex === 0 && (
                          <span className="font-serif text-muted-foreground text-lg">
                            {year}
                          </span>
                        )}
                      </div>

                      {/* Title and author */}
                      <div className="flex-1 min-w-0">
                        <span className="font-serif text-foreground text-xl group-hover:text-foreground/80 transition-colors">
                          {post.title}
                        </span>
                        {post.author && (
                          <span className="font-serif text-muted-foreground text-xl italic ml-2">
                            {post.author}
                          </span>
                        )}
                      </div>

                      {/* Date */}
                      <div className="w-20 text-right shrink-0">
                        <span className="font-serif text-muted-foreground">
                          {post.date}
                        </span>
                      </div>

                      {/* Tag */}
                      <div className="w-20 flex justify-end shrink-0 ml-4">
                        <span
                          className={`px-3 py-1 rounded-full text-sm font-sans ${tagColors[post.tag] || "bg-muted text-muted-foreground"}`}
                        >
                          {post.tag}
                        </span>
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
