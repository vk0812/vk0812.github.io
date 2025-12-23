import { motion } from "framer-motion";

const Header = () => {
  const navItems = ["Home", "About", "Projects", "Contact", "Resume"];

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
            <span className="text-primary-foreground font-serif text-lg font-bold">A</span>
          </div>
          <div>
            <h1 className="font-sans font-semibold text-foreground">Adith Narein</h1>
            <p className="text-xs text-emerald-600 font-medium tracking-wide">OPEN FOR NEW ROLES</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase()}`}
              className="text-sm font-sans text-muted-foreground hover:text-foreground transition-colors duration-200"
            >
              {item}
            </a>
          ))}
        </nav>

        {/* CTA */}
        <motion.a
          href="#contact"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="hidden md:inline-flex px-5 py-2.5 bg-charcoal text-primary-foreground font-sans text-sm font-medium rounded-lg shadow-soft hover:shadow-card transition-shadow duration-300"
        >
          Book a Call
        </motion.a>
      </div>
    </motion.header>
  );
};

export default Header;
