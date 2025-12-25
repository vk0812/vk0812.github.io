import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";

const Header = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const navItems = ["Home", "About", "Contact", "Resume", "Writings"];

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
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
            <span className="text-background font-serif text-lg font-bold">A</span>
          </div>
          <h1 className="font-sans font-semibold text-foreground">Adith Narein</h1>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            item === "Writings" ? (
              <Link
                key={item}
                to="/writings"
                className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {item}
              </Link>
            ) : (
              <a
                key={item}
                href={item === "Home" ? "/" : `#${item.toLowerCase()}`}
                className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                {item}
              </a>
            )
          ))}
        </nav>

        {/* Theme Toggle */}
        <motion.button
          onClick={toggleTheme}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="hidden md:flex p-2.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors duration-200"
          aria-label="Toggle theme"
        >
          {theme === "dark" ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </motion.button>
      </div>
    </motion.header>
  );
};

export default Header;
