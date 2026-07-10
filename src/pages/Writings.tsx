import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { Folder, FolderOpen, Search, X, FileText } from "lucide-react";
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
  { id: "designing-youtube", title: "Designing YouTube", date: "10/07", tag: "Case Studies", year: 2026 },
  { id: "designing-messenger", title: "Designing Facebook Messenger", date: "06/07", tag: "Case Studies", year: 2026 },
  { id: "designing-dropbox", title: "Designing Dropbox", date: "05/07", tag: "Case Studies", year: 2026 },
  { id: "designing-instagram", title: "Designing Instagram", date: "04/07", tag: "Case Studies", year: 2026 },
  { id: "designing-pastebin", title: "Designing a Pastebin", date: "04/07", tag: "Case Studies", year: 2026 },
  { id: "designing-url-shortener", title: "Designing a URL Shortener", date: "03/07", tag: "Case Studies", year: 2026 },
  { id: "message-queues", title: "Message Queues", date: "02/07", tag: "System Design", year: 2026 },
  { id: "rate-limiting", title: "Rate Limiting", date: "02/07", tag: "System Design", year: 2026 },
  { id: "cors", title: "Cross-Origin Resource Sharing (CORS)", date: "02/07", tag: "System Design", year: 2026 },
  { id: "consistent-hashing", title: "Consistent Hashing", date: "29/05", tag: "System Design", year: 2026 },
  { id: "bloom-filters", title: "Bloom Filters", date: "29/05", tag: "System Design", year: 2026 },
  { id: "quorum", title: "Quorum", date: "26/05", tag: "System Design", year: 2026 },
  { id: "heartbeat-and-checksum", title: "Heartbeat and Checksum", date: "26/05", tag: "System Design", year: 2026 },
  { id: "web-protocols", title: "Long-Polling, WebSockets, and Server-Sent Events", date: "26/05", tag: "System Design", year: 2026 },
  { id: "cap-theorem", title: "CAP Theorem", date: "26/05", tag: "System Design", year: 2026 },
  { id: "cdn", title: "Content Delivery Networks", date: "26/05", tag: "System Design", year: 2026 },
  { id: "redundancy-and-replication", title: "Redundancy and Replication", date: "26/05", tag: "System Design", year: 2026 },
  { id: "proxies", title: "Proxies", date: "25/05", tag: "System Design", year: 2026 },
  { id: "data-partitioning", title: "Data Partitioning", date: "25/05", tag: "System Design", year: 2026 },
  { id: "caching", title: "Caching", date: "25/05", tag: "System Design", year: 2026 },
  { id: "load-balancing", title: "Load Balancing", date: "25/05", tag: "System Design", year: 2026 },
  { id: "system-design-basics", title: "System Design Basics", date: "25/05", tag: "System Design", year: 2026 },
  { id: "grpo", title: "Group Relative Policy Optimization (GRPO)", date: "30/04", tag: "Machine Learning", year: 2026 },
  { id: "contrastive-learning", title: "Contrastive Learning", date: "30/04", tag: "Machine Learning", year: 2026 },
  { id: "intern-exp", title: "Going into the Adobe Life", date: "19/07", tag: "Intern", year: 2024 },
];

const tagColors: Record<string, string> = {
  LLMs: "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300",
  "Machine Learning": "bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300",
  Book: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300",
  Intern: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  "System Design": "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300",
  "Case Studies": "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
};

const tagAccent: Record<string, string> = {
  LLMs: "bg-green-400/80 dark:bg-green-500/70",
  "Machine Learning": "bg-purple-400/80 dark:bg-purple-500/70",
  Book: "bg-yellow-400/80 dark:bg-yellow-500/70",
  Intern: "bg-blue-400/80 dark:bg-blue-500/70",
  "System Design": "bg-orange-400/80 dark:bg-orange-500/70",
  "Case Studies": "bg-teal-400/80 dark:bg-teal-500/70",
};

interface FolderMeta {
  tag: string;
  count: number;
  years: number[];
}

const FolderCard = ({
  meta,
  isSelected,
  onSelect,
  index,
}: {
  meta: FolderMeta;
  isSelected: boolean;
  onSelect: () => void;
  index: number;
}) => {
  const accent = tagAccent[meta.tag] ?? "bg-muted-foreground/30";
  const chip = tagColors[meta.tag] ?? "bg-muted text-muted-foreground";

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.06 }}
      aria-pressed={isSelected}
      aria-label={`Show ${meta.count} posts in ${meta.tag}`}
      className="relative cursor-pointer text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-foreground/40 rounded-2xl"
    >
      <motion.div
        animate={{
          y: isSelected ? -8 : 0,
          rotateZ: isSelected ? -1.5 : 0,
          scale: isSelected ? 1.02 : 1,
        }}
        whileHover={{ y: isSelected ? -8 : -3 }}
        transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
        className="relative origin-center"
      >
        {/* Folder tab */}
        <div className={`absolute -top-3 left-5 sm:left-6 w-12 sm:w-14 h-5 rounded-t-lg z-10 ${accent}`} />

        <div
          className={`relative bg-muted rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow duration-300 ${
            isSelected ? "ring-2 ring-foreground/20" : ""
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-3 sm:mb-4">
            <div className={`p-2 rounded-lg ${chip}`}>
              {isSelected ? (
                <FolderOpen className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Folder className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </div>
            <span className="font-sans text-xs sm:text-sm text-muted-foreground tabular-nums">
              {meta.count} {meta.count === 1 ? "post" : "posts"}
            </span>
          </div>

          <h3 className="font-serif text-base sm:text-lg lg:text-xl text-foreground leading-tight mb-1">
            {meta.tag}
          </h3>
          <p className="font-sans text-xs text-muted-foreground">
            {meta.years.length === 1
              ? meta.years[0]
              : `${Math.min(...meta.years)}–${Math.max(...meta.years)}`}
          </p>
        </div>
      </motion.div>
    </motion.button>
  );
};

const PostRow = ({ post, showYear, index }: { post: BlogPost; showYear: boolean; index: number }) => (
  <Link to={`/writings/${post.id}`} className="block group">
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.03 }}
      className="grid grid-cols-[auto_1fr_auto] sm:grid-cols-[4rem_1fr_auto_auto] items-start sm:items-center gap-x-3 sm:gap-x-4 gap-y-1.5 py-3.5 sm:py-4 border-b border-border/50 hover:bg-muted/40 transition-colors -mx-3 sm:-mx-4 px-3 sm:px-4 rounded-lg"
    >
      <div className="hidden sm:block w-16 shrink-0">
        {showYear && <span className="font-serif text-muted-foreground text-base">{post.year}</span>}
      </div>

      {showYear ? (
        <span className="sm:hidden font-serif text-muted-foreground text-xs row-start-1 col-start-1">
          {post.year}
        </span>
      ) : (
        <span className="sm:hidden row-start-1 col-start-1" />
      )}

      <div className="min-w-0 row-start-1 col-start-2">
        <span className="font-serif text-foreground text-base sm:text-lg group-hover:text-foreground/80 transition-colors leading-snug block">
          {post.title}
        </span>
      </div>

      <div className="row-start-1 col-start-3 sm:col-start-4 flex justify-end">
        <span
          className={`px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-sans whitespace-nowrap ${
            tagColors[post.tag] || "bg-muted text-muted-foreground"
          }`}
        >
          {post.tag}
        </span>
      </div>

      <div className="row-start-2 col-start-2 sm:row-start-1 sm:col-start-3 sm:text-right">
        <span className="font-serif text-muted-foreground text-xs sm:text-sm">{post.date}</span>
      </div>
    </motion.div>
  </Link>
);

const Writings = () => {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const folders: FolderMeta[] = useMemo(() => {
    const map = new Map<string, FolderMeta>();
    for (const p of blogPosts) {
      const existing = map.get(p.tag);
      if (existing) {
        existing.count += 1;
        if (!existing.years.includes(p.year)) existing.years.push(p.year);
      } else {
        map.set(p.tag, { tag: p.tag, count: 1, years: [p.year] });
      }
    }
    return Array.from(map.values()).sort((a, b) => b.count - a.count);
  }, []);

  const isSearching = search.trim().length > 0;

  const visiblePosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return blogPosts
      .filter((p) => (isSearching ? true : selectedTag ? p.tag === selectedTag : false))
      .filter((p) =>
        q
          ? p.title.toLowerCase().includes(q) ||
            p.tag.toLowerCase().includes(q) ||
            String(p.year).includes(q)
          : true
      )
      .sort((a, b) => b.year - a.year);
  }, [selectedTag, search, isSearching]);

  const years = useMemo(() => [...new Set(visiblePosts.map((p) => p.year))].sort((a, b) => b - a), [visiblePosts]);

  const panelTitle = isSearching
    ? `Results for "${search.trim()}"`
    : selectedTag
    ? selectedTag
    : null;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      <main className="pt-28 sm:pt-32 pb-16 sm:pb-20 flex-1 px-5 sm:px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-10">
            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="font-serif text-3xl sm:text-4xl md:text-5xl text-foreground"
            >
              <span className="italic">W</span>ritings
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="font-sans text-sm text-muted-foreground"
            >
              {blogPosts.length} posts across {folders.length} folders
            </motion.p>
          </div>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            className="relative mb-6 sm:mb-8"
          >
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search across all folders…"
              className="w-full pl-10 pr-10 py-2.5 sm:py-3 rounded-xl bg-muted/60 border border-border/50 text-sm sm:text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 focus:border-transparent transition"
              aria-label="Search posts"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition"
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </motion.div>

          {/* Folder grid */}
          <LayoutGroup>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 mt-6 sm:mt-7">
              {folders.map((meta, i) => (
                <FolderCard
                  key={meta.tag}
                  meta={meta}
                  index={i}
                  isSelected={!isSearching && selectedTag === meta.tag}
                  onSelect={() =>
                    setSelectedTag((curr) => (curr === meta.tag ? null : meta.tag))
                  }
                />
              ))}
            </div>

            {/* Hint / Posts panel */}
            <AnimatePresence mode="wait">
              {!selectedTag && !isSearching ? (
                <motion.div
                  key="hint"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.25 }}
                  className="mt-8 sm:mt-10 flex flex-col items-center justify-center gap-2 py-10 sm:py-12 border border-dashed border-border/60 rounded-2xl text-center"
                >
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <p className="font-sans text-sm text-muted-foreground">
                    Open a folder to read its posts, or search above.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={isSearching ? `search-${search}` : `tag-${selectedTag}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                  className="mt-8 sm:mt-10"
                >
                  <div className="flex items-center justify-between mb-3 sm:mb-4">
                    <h2 className="font-serif text-xl sm:text-2xl text-foreground">{panelTitle}</h2>
                    <button
                      onClick={() => {
                        setSelectedTag(null);
                        setSearch("");
                      }}
                      className="font-sans text-xs sm:text-sm text-muted-foreground hover:text-foreground transition inline-flex items-center gap-1.5"
                      aria-label="Close folder"
                    >
                      <X className="w-3.5 h-3.5" />
                      Close
                    </button>
                  </div>

                  {visiblePosts.length === 0 ? (
                    <div className="py-10 text-center font-sans text-sm text-muted-foreground">
                      No posts match your search.
                    </div>
                  ) : (
                    <div className="bg-muted/30 rounded-2xl px-3 sm:px-4 py-1 sm:py-2">
                      {years.map((year) => {
                        const yearPosts = visiblePosts.filter((p) => p.year === year);
                        return (
                          <div key={year}>
                            {yearPosts.map((post, idx) => (
                              <PostRow
                                key={post.id}
                                post={post}
                                showYear={idx === 0}
                                index={idx}
                              />
                            ))}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Writings;
