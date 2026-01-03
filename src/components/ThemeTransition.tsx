import { motion, AnimatePresence } from "framer-motion";

interface ThemeTransitionProps {
  isAnimating: boolean;
  origin: { x: number; y: number };
  targetTheme: "dark" | "light";
}

const ThemeTransition = ({ isAnimating, origin, targetTheme }: ThemeTransitionProps) => {
  // Calculate the maximum distance to cover the entire screen
  const maxDistance = Math.max(
    Math.hypot(origin.x, origin.y),
    Math.hypot(window.innerWidth - origin.x, origin.y),
    Math.hypot(origin.x, window.innerHeight - origin.y),
    Math.hypot(window.innerWidth - origin.x, window.innerHeight - origin.y)
  );

  return (
    <AnimatePresence>
      {isAnimating && (
        <motion.div
          initial={{ 
            clipPath: `circle(0px at ${origin.x}px ${origin.y}px)` 
          }}
          animate={{ 
            clipPath: `circle(${maxDistance}px at ${origin.x}px ${origin.y}px)` 
          }}
          exit={{ opacity: 0 }}
          transition={{ 
            duration: 0.5, 
            ease: [0.22, 1, 0.36, 1]
          }}
          style={{ 
            mixBlendMode: "difference",
          }}
          className="fixed inset-0 z-[100] pointer-events-none bg-white"
        />
      )}
    </AnimatePresence>
  );
};

export default ThemeTransition;
