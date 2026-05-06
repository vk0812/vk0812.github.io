import { ReactNode } from 'react';
import { useReveal } from '../hooks';

interface RevealProps {
  children: ReactNode;
  delay?: number;
  y?: number;
}

export function Reveal({ children, delay = 0, y = 24 }: RevealProps) {
  const [ref, shown] = useReveal();
  return (
    <div ref={ref} style={{
      opacity: shown ? 1 : 0,
      transform: shown ? 'translateY(0)' : `translateY(${y}px)`,
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(.2,.8,.2,1) ${delay}ms`,
    }}>
      {children}
    </div>
  );
}
