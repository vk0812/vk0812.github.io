import { useEffect } from 'react';
import { R } from './tokens';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { PrivacyStrip } from './components/PrivacyStrip';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { DownloadCTA } from './components/DownloadCTA';
import { Footer } from './components/Footer';

export default function RecallSitePage() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Recall — the clipboard you can ask questions to';
    // Need bg on body so the sticky HowItWorks section doesn't show white behind it
    const prevBg = document.body.style.background;
    document.body.style.background = R.bg;
    return () => {
      document.title = prev;
      document.body.style.background = prevBg;
    };
  }, []);

  return (
    // overflow: clip (not hidden) — clip doesn't create a new scroll container,
    // so window.scroll events still fire correctly for useScrollProgress.
    // overflow: hidden would silently promote overflowY to 'auto', making the
    // div the scroll container and breaking the sticky HowItWorks section.
    <div style={{
      background: R.bg,
      color: R.ink,
      fontFamily: R.fontUI,
      minHeight: '100vh',
    }}>
      <style>{`
        @keyframes recall-blink { to { opacity: 0; } }
        @keyframes recall-marquee { from { transform: translateX(0); } to { transform: translateX(calc(-100% / 3)); } }
      `}</style>

      <Nav />
      <main id="top">
        <Hero />
        <PrivacyStrip />
        <HowItWorks />
        <Features />
        <PrivacyStrip />
        <DownloadCTA />
      </main>
      {/* <Footer /> */}
    </div>
  );
}
