import { R } from '../tokens';
import { RecallWordmark } from './RecallMark';

function FooterCol({ title, links }: { title: string; links: string[] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ fontFamily: R.fontMono, fontSize: 11, color: R.muted, letterSpacing: '0.06em', textTransform: 'uppercase' }}>{title}</div>
      {links.map((l) => (
        <a key={l} href="#" style={{ fontSize: 14, color: R.ink, textDecoration: 'none', opacity: 0.85 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.85')}>
          {l}
        </a>
      ))}
    </div>
  );
}

export function Footer() {
  return (
    <footer style={{ background: R.bg, padding: 'clamp(40px,6vw,64px) clamp(24px, 6vw, 96px) 40px', borderTop: `1px solid ${R.hairline}`, fontFamily: R.fontUI }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'clamp(24px,4vw,40px)' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <RecallWordmark size={28} />
          <p style={{ fontSize: 13, color: R.muted, lineHeight: 1.5, margin: 0, maxWidth: 280 }}>
            A semantic clipboard for macOS. Built on-device.
          </p>
        </div>
        <FooterCol title="Product" links={['Features', 'Download', 'Changelog', 'Roadmap']} />
        <FooterCol title="Open source" links={['GitHub', 'License (MIT)', 'Issues', 'Contribute']} />
        <FooterCol title="Etc." links={['Privacy', 'Press kit', 'Twitter', 'RSS']} />
      </div>
      <div style={{ maxWidth: 1280, margin: '48px auto 0', paddingTop: 24, borderTop: `1px solid ${R.hairline}`, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, fontFamily: R.fontMono, fontSize: 11, color: R.muted, letterSpacing: '0.04em' }}>
        <span>© 2026 recall · made with care, for your mac</span>
        <span>v0.1.0 · MIT · apple silicon</span>
      </div>
    </footer>
  );
}
