import { useState, useEffect } from 'react';
import { R } from '../tokens';
import { RecallMark } from './RecallMark';
import { useWindowWidth } from '../hooks';

function DownloadBtn({ small = false }: { small?: boolean }) {
  return (
    <a href="https://github.com/vk0812/Recall/releases/latest" target="_blank" rel="noopener noreferrer"
      style={{ padding: small ? '10px 16px' : '14px 22px', borderRadius: 12, background: R.ink, color: '#fff', textDecoration: 'none', fontSize: small ? 13 : 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 24px -8px #0007', transition: 'transform 0.15s ease' }}
      onMouseEnter={(e) => (e.currentTarget.style.transform = 'translateY(-1px)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'translateY(0)')}>
      <svg width="14" height="16" viewBox="0 0 384 512" fill="currentColor">
        <path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
      </svg>
      Download for macOS
    </a>
  );
}

export { DownloadBtn };

export function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const width = useWindowWidth();
  const isMobile = width < 720;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const links = ['How', 'Features', 'Download'];
  const hrefs = ['#how', '#features', '#download'];

  return (
    <>
      <nav style={{
        position: 'fixed', top: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 100,
        display: 'flex', alignItems: 'center', gap: isMobile ? 12 : 24,
        padding: scrolled ? '8px 12px 8px 18px' : '10px 14px 10px 20px',
        borderRadius: 999,
        background: scrolled ? '#ffffffc8' : '#ffffff80',
        border: `1px solid ${scrolled ? '#00000018' : '#00000010'}`,
        backdropFilter: 'blur(20px)',
        transition: 'all 0.25s ease',
        boxShadow: scrolled ? '0 6px 24px -10px #0003' : 'none',
        fontFamily: R.fontUI,
        whiteSpace: 'nowrap',
      }}>
        <a href="#top" style={{ display: 'flex', alignItems: 'center', gap: 8, textDecoration: 'none', color: R.ink }}>
          <RecallMark size={20} />
          <span style={{ fontSize: 14, fontWeight: 500, letterSpacing: '-0.01em' }}>recall</span>
        </a>

        {!isMobile && (
          <div style={{ display: 'flex', gap: 18, fontSize: 13, color: R.inkSoft }}>
            {links.map((l, i) => (
              <a key={l} href={hrefs[i]} style={{ color: 'inherit', textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        )}

        {!isMobile && <DownloadBtn small />}

        {isMobile && (
          <button onClick={() => setMenuOpen((o) => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px', color: R.ink, display: 'flex', alignItems: 'center' }}>
            {menuOpen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6 6 18M6 6l12 12" /></svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
            )}
          </button>
        )}
      </nav>

      {/* Mobile dropdown */}
      {isMobile && menuOpen && (
        <div style={{
          position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)', zIndex: 99,
          width: 'calc(100vw - 32px)', maxWidth: 400,
          background: '#fffffff0', backdropFilter: 'blur(20px)',
          borderRadius: 16, border: `1px solid ${R.hairline}`,
          boxShadow: '0 20px 60px -10px #0002',
          padding: 16,
          display: 'flex', flexDirection: 'column', gap: 4,
          fontFamily: R.fontUI,
        }}>
          {links.map((l, i) => (
            <a key={l} href={hrefs[i]} onClick={() => setMenuOpen(false)}
              style={{ padding: '12px 16px', borderRadius: 10, color: R.ink, textDecoration: 'none', fontSize: 15, fontWeight: 500, display: 'block' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#0000060a')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}>
              {l}
            </a>
          ))}
          <div style={{ paddingTop: 8 }}>
            <DownloadBtn />
          </div>
        </div>
      )}
    </>
  );
}
