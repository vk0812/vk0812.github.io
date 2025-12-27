import { useEffect, useState } from "react";

interface ScrambleTextProps {
  text: string;
  className?: string;
  delay?: number;
  speed?: number;
  scrambleSpeed?: number;
}

const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*(){}[]<>?/\\|~`";

const ScrambleText = ({ 
  text, 
  className = "", 
  delay = 500,
  speed = 50,
  scrambleSpeed = 30
}: ScrambleTextProps) => {
  const [displayText, setDisplayText] = useState("");
  const [revealedCount, setRevealedCount] = useState(0);
  const [isStarted, setIsStarted] = useState(false);

  useEffect(() => {
    // Initial delay before starting
    const startTimer = setTimeout(() => {
      setIsStarted(true);
    }, delay);

    return () => clearTimeout(startTimer);
  }, [delay]);

  useEffect(() => {
    if (!isStarted) {
      // Show scrambled text even before animation starts
      const scrambled = text
        .split("")
        .map((char) => (char === " " ? " " : characters[Math.floor(Math.random() * characters.length)]))
        .join("");
      setDisplayText(scrambled);
      return;
    }

    // Scramble effect interval
    const scrambleInterval = setInterval(() => {
      const newText = text
        .split("")
        .map((char, index) => {
          if (char === " ") return " ";
          if (index < revealedCount) return char;
          return characters[Math.floor(Math.random() * characters.length)];
        })
        .join("");
      setDisplayText(newText);
    }, scrambleSpeed);

    // Reveal characters one by one
    const revealInterval = setInterval(() => {
      setRevealedCount((prev) => {
        if (prev >= text.length) {
          clearInterval(revealInterval);
          clearInterval(scrambleInterval);
          return prev;
        }
        return prev + 1;
      });
    }, speed);

    return () => {
      clearInterval(scrambleInterval);
      clearInterval(revealInterval);
    };
  }, [isStarted, text, revealedCount, speed, scrambleSpeed]);

  return (
    <span className={className}>
      {displayText.split("").map((char, index) => (
        <span
          key={index}
          className={`inline-block transition-all duration-150 ${
            index < revealedCount ? "opacity-100" : "opacity-70"
          }`}
          style={{
            fontFamily: index < revealedCount ? "inherit" : "monospace",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
};

export default ScrambleText;
