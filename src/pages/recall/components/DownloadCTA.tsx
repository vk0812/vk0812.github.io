import { R } from '../tokens';
import { RecallMark } from './RecallMark';
import { Reveal } from './Reveal';

export function DownloadCTA() {
  return (
    <section id="download" style={{ padding: 'clamp(80px,12vw,160px) clamp(24px, 6vw, 96px)', background: R.dark, color: R.darkInk, textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(40% 60% at 50% 50%, #1f5fff22, transparent 70%)', pointerEvents: 'none' }} />
      <div style={{ position: 'relative', maxWidth: 760, margin: '0 auto' }}>
        <Reveal>
          <div style={{ display: 'inline-block', marginBottom: 24 }}>
            <RecallMark size={64} fg={R.darkInk} accent={R.accent} />
          </div>
        </Reveal>
        <Reveal delay={80}>
          <h2 style={{ fontSize: 'clamp(40px, 6vw, 80px)', fontWeight: 500, letterSpacing: '-0.035em', lineHeight: 1.0, margin: 0 }}>Try recall.</h2>
        </Reveal>
        <Reveal delay={160}>
          <p style={{ fontSize: 'clamp(15px, 1.3vw, 19px)', color: R.darkMuted, marginTop: 20, lineHeight: 1.5 }}>
            Free. Open source. Apple Silicon. ~38 MB.
          </p>
        </Reveal>
        <Reveal delay={240}>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 40, flexWrap: 'wrap' }}>
            <a href="https://github.com/vk0812/Recall/releases/latest" target="_blank" rel="noopener noreferrer"
              style={{ padding: '16px 28px', borderRadius: 12, background: '#fff', color: R.ink, textDecoration: 'none', fontSize: 15, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 12 }}>
              <svg width="16" height="18" viewBox="0 0 384 512" fill="currentColor">
                <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9z" />
              </svg>
              <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1.1 }}>
                <span style={{ fontSize: 11, opacity: 0.6, fontFamily: R.fontMono }}>download for</span>
                <span>macOS · Apple Silicon</span>
              </span>
            </a>
            <a href="https://github.com/vk0812/Recall" target="_blank" rel="noopener noreferrer"
              style={{ padding: '16px 28px', borderRadius: 12, background: 'transparent', color: R.darkInk, textDecoration: 'none', border: '1px solid #ffffff2a', fontSize: 15, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 10 }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.3.7-4-1.4-4-1.4-.6-1.4-1.4-1.8-1.4-1.8-1.1-.7.1-.7.1-.7 1.2.1 1.9 1.3 1.9 1.3 1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.5-1.3-5.5-6 0-1.2.5-2.3 1.3-3.1-.2-.4-.6-1.6 0-3.2 0 0 1-.3 3.4 1.2a11.5 11.5 0 0 1 6 0c2.4-1.5 3.4-1.2 3.4-1.2.7 1.6.2 2.8.1 3.2.8.8 1.3 1.9 1.3 3.1 0 4.6-2.8 5.6-5.5 6 .4.4.8 1.1.8 2.2v3.3c0 .3.2.7.8.6A12 12 0 0 0 12 .3" />
              </svg>
              GitHub
            </a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
