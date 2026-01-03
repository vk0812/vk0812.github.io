import { motion } from "framer-motion";

interface BlogImageProps {
  src: string;
  alt: string;
  caption?: string;
  delay?: number;
}

export const BlogImage = ({ src, alt, caption, delay = 0 }: BlogImageProps) => (
  <motion.figure
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay }}
    className="mb-8"
  >
    <img
      src={src}
      alt={alt}
      className="w-full rounded-lg border border-border shadow-sm"
    />
    {caption && (
      <figcaption className="text-center text-sm text-muted-foreground mt-3 font-serif italic">
        {caption}
      </figcaption>
    )}
  </motion.figure>
);
