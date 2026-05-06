import { useEffect } from 'react';
import { R } from './tokens';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { PrivacyStrip } from './components/PrivacyStrip';
import { HowItWorks } from './components/HowItWorks';
import { Features } from './components/Features';
import { Screenshots } from './components/Screenshots';
import { Testimonials } from './components/Testimonials';
import { DownloadCTA } from './components/DownloadCTA';
import { Footer } from './components/Footer';

export default function RecallSitePage() {
  useEffect(() => {
    const prev = document.title;
    document.title = 'Recall — the clipboard you can ask questions to';
    const prevBg = document.body.style.background;
    document.body.style.background = R.bg;
    return () => {
      document.title = prev;
      document.body.style.background = prevBg;
    };
  }, []);

  return (
    <div style={{
      background: R.bg,
      color: R.ink,
      fontFamily: R.fontUI,
      overflowX: 'hidden',
      minHeight: '100vh',
    }}>
      {/* Global keyframes needed by multiple components */}
      <style>{`
        @keyframes recall-blink { to { opacity: 0; } }
        @keyframes recall-marquee { from { transform: translateX(0); } to { transform: translateX(calc(-100% / 3)); } }
        .recall-page ::selection { background: #1f5fff; color: #fff; }
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500;600&display=swap');
      `}</style>

      <Nav />
      <main id="top">
        <Hero />
        <PrivacyStrip />
        <HowItWorks />
        <Features />
        <Screenshots />
        <Testimonials />
        <PrivacyStrip />
        <DownloadCTA />
      </main>
      <Footer />
    </div>
  );
}
