import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

interface ReadingProgressHeaderProps {
  title: string;
  progress: number;
  isVisible: boolean;
}

const ReadingProgressHeader = ({ title, progress, isVisible }: ReadingProgressHeaderProps) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="fixed top-[72px] left-0 right-0 z-[60] bg-background/95 backdrop-blur-md border-b border-border/50"
        >
          <div className="container mx-auto px-6">
            <div className="flex items-center gap-4 py-4">
              <Link
                to="/writings"
                className="p-2 -ml-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted/50"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>
              <h2 className="font-serif text-base md:text-lg text-foreground truncate flex-1">
                {title}
              </h2>
              <span className="text-xs font-sans text-muted-foreground tabular-nums">
                {Math.round(progress)}%
              </span>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="h-[2px] bg-border/30 w-full">
            <motion.div
              className="h-full bg-gradient-to-r from-foreground/70 via-foreground to-foreground/70 origin-left"
              style={{ scaleX: progress / 100 }}
              transition={{ duration: 0.1, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ReadingProgressHeader;
