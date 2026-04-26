import { motion, AnimatePresence } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import { Moon, Sun, Menu, X } from "lucide-react";
import { useEffect, useState } from "react";

interface NavItem {
  label: string;
  type: "route" | "anchor" | "external";
  to: string;
}

const Header = () => {
  const location = useLocation();
  const { theme, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);

  const onHome = location.pathname === "/";

  const navItems: NavItem[] = [
    { label: "Home", type: "route", to: "/" },
    { label: "About", type: "anchor", to: onHome ? "#about" : "/#about" },
    { label: "Contact", type: "anchor", to: onHome ? "#contact" : "/#contact" },
    { label: "Resume", type: "external", to: "/Vidit_Khazanchi_Resume.pdf" },
    { label: "Writings", type: "route", to: "/writings" },
  ];

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  // Close mobile menu when navigating
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll while drawer open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  const linkClass =
    "text-sm font-sans text-muted-foreground hover:text-foreground transition-colors duration-200 relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-[1.5px] after:bottom-[-2px] after:left-0 after:bg-foreground after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left";

  const renderItem = (item: NavItem, isMobile = false) => {
    const className = isMobile
      ? "text-2xl font-serif text-foreground/90 hover:text-foreground transition-colors py-2"
      : linkClass;
    if (item.type === "route") {
      return (
        <Link key={item.label} to={item.to} className={className} onClick={() => setMobileOpen(false)}>
          {item.label}
        </Link>
      );
    }
    if (item.type === "external") {
      return (
        <a
          key={item.label}
          href={item.to}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
          onClick={() => setMobileOpen(false)}
        >
          {item.label}
        </a>
      );
    }
    return (
      <a key={item.label} href={item.to} className={className} onClick={() => setMobileOpen(false)}>
        {item.label}
      </a>
    );
  };

  return (
    <>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50"
      >
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 sm:gap-3 shrink-0" aria-label="Home">
            <div className="w-9 h-9 sm:w-10 sm:h-10 bg-charcoal rounded-full flex items-center justify-center">
              <span className="text-background font-serif text-base sm:text-lg font-bold">VK</span>
            </div>
            <h1 className="font-sans font-semibold text-foreground text-sm sm:text-base">Vidit Khazanchi</h1>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6 lg:gap-8">{navItems.map((item) => renderItem(item))}</nav>

          {/* Right cluster: theme toggle + mobile menu button */}
          <div className="flex items-center gap-2">
            <motion.button
              onClick={toggleTheme}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="p-2 sm:p-2.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors duration-200"
              aria-label="Toggle theme"
            >
              <motion.div
                key={theme}
                initial={{ rotate: -180, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {theme === "dark" ? <Sun className="w-4 h-4 sm:w-5 sm:h-5" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
              </motion.div>
            </motion.button>

            <button
              onClick={() => setMobileOpen((o) => !o)}
              className="md:hidden p-2 rounded-lg bg-muted hover:bg-muted/80 text-foreground transition-colors"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 z-40 bg-background/60 backdrop-blur-sm"
            />
            <motion.div
              key="panel"
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
              className="md:hidden fixed top-[64px] left-0 right-0 z-40 bg-background border-b border-border/50 shadow-card"
            >
              <nav className="container mx-auto px-6 py-6 flex flex-col gap-1">
                {navItems.map((item) => renderItem(item, true))}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Header;
