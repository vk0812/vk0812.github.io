import { useRef } from 'react';
import { R } from '../tokens';
import { Reveal } from './Reveal';
import { useScrollProgress, useWindowWidth } from '../hooks';

interface ShotProps {
  src: string;
  alt: string;
  style?: React.CSSProperties;
}

function Shot({ src, alt, style }: ShotProps) {
  return (
    <div style={{ position: 'absolute', top: 0, width: 'min(880px, 90%)', borderRadius: 16, overflow: 'hidden', border: '1px solid #ffffff14', boxShadow: '0 40px 100px -20px #0000007a', background: '#1a1a1d', transition: 'transform 0.2s ease-out, filter 0.2s ease-out', ...style }}>
      <img src={src} alt={alt} style={{ width: '100%', height: 'auto', display: 'block' }} />
    </div>
  );
}

export function Screenshots() {
  const wrap = useRef<HTMLElement>(null);
  const p = useScrollProgress(wrap as React.RefObject<HTMLElement>);
  const lift = Math.min(1, Math.max(0, (p - 0.1) * 1.6));
  const rot = (1 - lift) * 6;
  const dx = (1 - lift) * 80;
  const width = useWindowWidth();
  const isMobile = width < 768;

  if (isMobile) {
    return (
      <section style={{ background: R.dark, color: R.darkInk, padding: 'clamp(64px,10vw,120px) clamp(16px,5vw,48px)' }}>
        <div style={{ maxWidth: 760, margin: '0 auto', textAlign: 'center' }}>
          <Reveal>
            <span style={{ fontFamily: R.fontMono, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: R.accent }}>02 · the app</span>
          </Reveal>
          <Reveal delay={80}>
            <h2 style={{ fontSize: 'clamp(28px, 7vw, 56px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '16px 0 12px' }}>Designed to disappear.</h2>
          </Reveal>
          <Reveal delay={160}>
            <p style={{ fontSize: 'clamp(14px,3.5vw,18px)', color: R.darkMuted, lineHeight: 1.5, margin: '0 0 40px' }}>
              A single overlay. One keystroke. Type, and your past comes back to you.
            </p>
          </Reveal>
          <Reveal delay={240}>
            <img src="/recall/screens/clipboard.png" alt="Recall clipboard view" style={{ width: '100%', borderRadius: 12, border: '1px solid #ffffff14', boxShadow: '0 20px 60px #0000006a', display: 'block' }} />
          </Reveal>
        </div>
      </section>
    );
  }

  return (
    <section ref={wrap} style={{ position: 'relative', height: '180vh', background: R.dark, color: R.darkInk }}>
      <div style={{ position: 'sticky', top: 0, height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 clamp(24px, 6vw, 96px)', overflow: 'hidden' }}>
        <span style={{ fontFamily: R.fontMono, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: R.accent }}>02 · the app</span>
        <h2 style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '16px 0 12px', textAlign: 'center', maxWidth: 900 }}>Designed to disappear.</h2>
        <p style={{ fontSize: 'clamp(14px, 1.2vw, 18px)', color: R.darkMuted, maxWidth: 580, textAlign: 'center', margin: 0, lineHeight: 1.5 }}>
          A single overlay. One keystroke. Type, and your past comes back to you.
        </p>
        <div style={{ position: 'relative', width: 'min(1100px, 96%)', height: 520, marginTop: 56 }}>
          <Shot src="/recall/screens/screenshots.png" alt="Recall screenshots view"
            style={{ left: '50%', transform: `translateX(calc(-50% - ${dx}px)) rotate(-${rot}deg) scale(${0.92 + lift * 0.04})`, zIndex: 1, filter: `brightness(${0.7 + lift * 0.3})` }} />
          <Shot src="/recall/screens/clipboard.png" alt="Recall clipboard view"
            style={{ left: '50%', transform: `translateX(calc(-50% + ${dx}px)) rotate(${rot}deg) scale(${0.96 + lift * 0.04})`, zIndex: 2 }} />
        </div>
      </div>
    </section>
  );
}
