import { motion } from "framer-motion";
import { useState } from "react";

const ContactCard = () => {
  const [isLifted, setIsLifted] = useState(false);
  const [formData, setFormData] = useState({ from: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Form submitted:", formData);
    // Handle form submission
  };

  return (
    <section id="contact" className="py-24 px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-4xl md:text-5xl text-center text-foreground mb-16"
        >
          <span className="italic text-primary text-5xl md:text-6xl">G</span>et in touch!
        </motion.h2>

        <div className="flex items-center justify-center gap-8 flex-wrap">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-sans hidden md:block"
          >
            Hey, you made it till here
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            onMouseEnter={() => setIsLifted(true)}
            onMouseLeave={() => setIsLifted(false)}
            className="relative"
          >
            <motion.div
              animate={{
                y: isLifted ? -8 : 0,
                rotateX: isLifted ? 3 : 0,
                scale: isLifted ? 1.02 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="relative"
              style={{ perspective: "1000px" }}
            >
              {/* Index Card */}
              <div className="index-card rounded-lg shadow-card overflow-hidden max-w-md">
                {/* Card Header with dashed border */}
                <div className="relative border-2 border-dashed border-primary/30 m-4 rounded">
                  {/* From field */}
                  <div className="flex items-center gap-2 p-4 pb-2 border-b border-dashed border-primary/30">
                    <span className="font-serif italic text-primary">From:</span>
                    <input
                      type="text"
                      placeholder="Leave empty to be anonymous :)"
                      value={formData.from}
                      onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                      className="flex-1 bg-transparent text-sm font-sans text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none"
                    />
                  </div>

                  {/* Message field */}
                  <div className="p-4">
                    <textarea
                      placeholder="Write your message here!"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={6}
                      className="w-full bg-transparent font-serif text-muted-foreground placeholder:text-muted-foreground/60 focus:outline-none resize-none"
                    />
                  </div>
                </div>

                {/* Send Button */}
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSubmit}
                  className="w-full py-4 bg-primary text-primary-foreground font-serif text-lg"
                >
                  Send
                </motion.button>
              </div>

              {/* Card shadow/depth effect */}
              <div className="absolute -bottom-2 left-2 right-2 h-4 bg-muted rounded-b-lg -z-10" />
            </motion.div>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-sans hidden md:block"
          >
            It would be rude to not say{" "}
            <span className="text-secondary underline cursor-pointer">Hi</span>
          </motion.p>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center text-muted-foreground font-sans mt-8"
        >
          Tap the card!
        </motion.p>
      </div>
    </section>
  );
};

export default ContactCard;
