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
            initial={{ opacity: 0, y: 30, rotate: 0 }}
            whileInView={{ opacity: 1, y: 0, rotate: 2 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            onMouseEnter={() => setIsLifted(true)}
            onMouseLeave={() => setIsLifted(false)}
            className="relative"
          >
            <motion.div
              animate={{
                y: isLifted ? -12 : 0,
                rotate: isLifted ? 0 : 2,
                scale: isLifted ? 1.03 : 1,
              }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="relative"
              style={{ 
                perspective: "1000px",
                transformStyle: "preserve-3d"
              }}
            >
              {/* Index Card */}
              <div className="bg-[#f5f5f3] rounded-sm shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)] overflow-hidden w-[420px] max-w-[90vw]">
                {/* Card Content with dashed border */}
                <div className="relative border-2 border-dashed border-primary m-3 rounded-sm">
                  {/* From field */}
                  <div className="flex items-center gap-3 px-4 py-3 border-b border-dashed border-primary">
                    <span className="font-serif italic text-primary font-medium">From:</span>
                    <input
                      type="text"
                      placeholder="Leave empty to be anonymous ;)"
                      value={formData.from}
                      onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                      className="flex-1 bg-transparent text-sm font-sans text-[#666] placeholder:text-[#999] focus:outline-none"
                    />
                  </div>

                  {/* Message field */}
                  <div className="p-4">
                    <textarea
                      placeholder="Write your message here!"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={8}
                      className="w-full bg-transparent font-serif text-[#666] placeholder:text-[#999] focus:outline-none resize-none leading-relaxed"
                    />
                  </div>
                </div>

                {/* Send Button */}
                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSubmit}
                  className="w-[calc(100%-1.5rem)] mx-3 mb-3 py-3 bg-primary text-primary-foreground font-serif text-lg rounded-sm"
                >
                  Send
                </motion.button>
              </div>

              {/* Card shadow/depth effect */}
              <div 
                className="absolute -bottom-3 left-4 right-0 h-6 bg-gradient-to-b from-black/10 to-transparent rounded-b-sm -z-10"
                style={{ transform: "skewX(-2deg)" }}
              />
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
            <span className="text-primary underline cursor-pointer">Hi</span>
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default ContactCard;
