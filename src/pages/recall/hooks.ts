import { useState, useEffect, useRef, RefObject } from 'react';

export function useTypewriter(target: string, speed = 55, hold = 1400) {
  const [text, setText] = useState('');
  const [done, setDone] = useState(false);
  useEffect(() => {
    setText('');
    setDone(false);
    let i = 0;
    const id = setInterval(() => {
      i++;
      setText(target.slice(0, i));
      if (i >= target.length) {
        clearInterval(id);
        setTimeout(() => setDone(true), hold);
      }
    }, speed);
    return () => clearInterval(id);
  }, [target, speed, hold]);
  return [text, done] as const;
}

export function useReveal(threshold = 0.18): [RefObject<HTMLDivElement>, boolean] {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    if (!ref.current) return;
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => { if (e.isIntersecting) setShown(true); }),
      { threshold }
    );
    io.observe(ref.current);
    return () => io.disconnect();
  }, [threshold]);
  return [ref, shown];
}

export function useScrollProgress(ref: RefObject<HTMLElement>): number {
  const [p, setP] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      if (!ref.current) return;
      const r = ref.current.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const scrolled = -r.top;
      setP(Math.max(0, Math.min(1, scrolled / total)));
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [ref]);
  return p;
}

export function useWindowWidth(): number {
  const [w, setW] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);
  useEffect(() => {
    const handler = () => setW(window.innerWidth);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return w;
}
