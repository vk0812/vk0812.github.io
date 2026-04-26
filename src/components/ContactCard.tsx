import { motion } from "framer-motion";
import { useState } from "react";

const ContactCard = () => {
  const [isLifted, setIsLifted] = useState(false);
  const [formData, setFormData] = useState({ from: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.message.trim()) {
      alert("Please write a message!");
      return;
    }

    setStatus("sending");

    try {
      const response = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          access_key: "c2664ba8-fc9f-41c3-893a-d3a558c66c24",
          from_name: formData.from || "Anonymous",
          email: formData.from || "no-reply@anonymous.com",
          message: formData.message,
          subject: "New message from your portfolio website",
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setFormData({ from: "", message: "" });
        setTimeout(() => setStatus("idle"), 3000);
      } else {
        setStatus("error");
        setTimeout(() => setStatus("idle"), 3000);
      }
    } catch (error) {
      console.error("Failed to send message:", error);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 3000);
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-20 lg:py-24 px-5 sm:px-6">
      <div className="container mx-auto max-w-4xl">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="font-serif text-3xl sm:text-4xl md:text-5xl text-center text-foreground mb-10 sm:mb-12 lg:mb-16"
        >
          <span className="italic text-primary text-4xl sm:text-5xl md:text-6xl">G</span>et in touch!
        </motion.h2>

        <div className="flex flex-col lg:flex-row items-center justify-center gap-4 sm:gap-6 lg:gap-8">
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground font-sans text-sm sm:text-base lg:flex-shrink-0 lg:whitespace-nowrap text-center lg:text-left order-1 lg:order-1"
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
            className="relative flex-shrink-0 order-2 lg:order-2 w-full max-w-[420px]"
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
                transformStyle: "preserve-3d",
              }}
            >
              <div className="bg-[#f5f5f3] rounded-sm shadow-[0_20px_50px_-15px_rgba(0,0,0,0.25)] overflow-hidden w-full">
                <div className="relative border-2 border-dashed border-primary m-3 rounded-sm">
                  <div className="flex items-center gap-3 px-3 sm:px-4 py-3 border-b border-dashed border-primary">
                    <span className="font-serif italic text-primary font-medium text-sm sm:text-base">From:</span>
                    <input
                      type="email"
                      placeholder="your.email@example.com"
                      value={formData.from}
                      onChange={(e) => setFormData({ ...formData, from: e.target.value })}
                      className="flex-1 min-w-0 bg-transparent text-sm font-sans text-[#666] placeholder:text-[#999] focus:outline-none"
                    />
                  </div>

                  <div className="p-3 sm:p-4">
                    <textarea
                      placeholder="Write your message here!"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      rows={7}
                      className="w-full bg-transparent font-serif text-[#666] placeholder:text-[#999] focus:outline-none resize-none leading-relaxed text-sm sm:text-base"
                    />
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={handleSubmit}
                  disabled={status === "sending"}
                  className="w-[calc(100%-1.5rem)] mx-3 mb-3 py-2.5 sm:py-3 bg-primary text-primary-foreground font-serif text-base sm:text-lg rounded-sm disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
                >
                  {status === "sending"
                    ? "Sending..."
                    : status === "success"
                    ? "✓ Sent!"
                    : status === "error"
                    ? "Failed - Try again"
                    : "Send"}
                </motion.button>
              </div>

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
            className="text-muted-foreground font-sans text-sm sm:text-base lg:flex-shrink-0 lg:whitespace-nowrap text-center lg:text-right order-3 lg:order-3"
          >
            It would be rude to not say <span className="text-primary underline cursor-pointer">Hi</span>
          </motion.p>
        </div>
      </div>
    </section>
  );
};

export default ContactCard;
