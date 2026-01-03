import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useState, useRef } from "react";
import ThemeTransition from "./ThemeTransition";

const Header = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const navItems = ["Home", "About", "Contact", "Resume", "Writings"];
  const [isAnimating, setIsAnimating] = useState(false);
  const [transitionOrigin, setTransitionOrigin] = useState({ x: 0, y: 0 });
  const [targetTheme, setTargetTheme] = useState<"dark" | "light">("light");
  const buttonRef = useRef<HTMLButtonElement>(null);

  const toggleTheme = () => {
    if (isAnimating) return;
    
    // Get button position for animation origin
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTransitionOrigin({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
    }
    
    const newTheme = theme === "dark" ? "light" : "dark";
    setTargetTheme(newTheme);
    setIsAnimating(true);
    
    // Change theme midway through animation for seamless feel
    setTimeout(() => {
      setTheme(newTheme);
    }, 300);
    
    // End animation
    setTimeout(() => {
      setIsAnimating(false);
    }, 600);
  };

  return (
    <>
      <ThemeTransition 
        isAnimating={isAnimating} 
        origin={transitionOrigin} 
        targetTheme={targetTheme} 
      />
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
      >
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-charcoal rounded-full flex items-center justify-center">
              <span className="text-background font-serif text-lg font-bold">VK</span>
            </div>
            <h1 className="font-sans font-semibold text-foreground">Vidit Khazanchi</h1>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) =>
              item === "Writings" ? (
                <Link
                  key={item}
                  to="/writings"
                  className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors duration-200 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1.5px] after:bottom-[-2px] after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                >
                  {item}
                </Link>
              ) : item === "Resume" ? (
                <a
                  key={item}
                  href="/Vidit_Khazanchi_Resume.pdf"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors duration-200 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1.5px] after:bottom-[-2px] after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                >
                  {item}
                </a>
              ) : (
                <a
                  key={item}
                  href={item === "Home" ? "/" : `#${item.toLowerCase()}`}
                  className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors duration-200 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1.5px] after:bottom-[-2px] after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
                >
                  {item}
                </a>
              ),
            )}
          </nav>

          {/* Theme Toggle */}
          <motion.button
            ref={buttonRef}
            onClick={toggleTheme}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="hidden md:flex p-2.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors duration-200"
            aria-label="Toggle theme"
          >
            <motion.div
              key={theme}
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.div>
          </motion.button>
        </div>
      </motion.header>
    </>
  );
};

export default Header;
