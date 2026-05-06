import { R } from '../tokens';

export function PrivacyStrip() {
  const items = ['no accounts', 'no telemetry', 'no network calls', 'no cloud', 'no tracking', 'all local', 'all yours'];
  const looped = [...items, ...items, ...items, ...items];
  return (
    <section style={{ padding: '24px 0', borderTop: `1px solid ${R.hairline}`, borderBottom: `1px solid ${R.hairline}`, background: R.bgAlt, overflow: 'hidden' }}>
      <style>{`@keyframes recall-marquee { from { transform: translateX(0); } to { transform: translateX(calc(-100% / 4)); } }`}</style>
      <div style={{ display: 'flex', gap: 48, animation: 'recall-marquee 35s linear infinite', width: 'max-content' }}>
        {looped.map((it, i) => (
          <span key={i} style={{ fontFamily: R.fontMono, fontSize: 13, color: R.inkSoft, letterSpacing: '0.04em', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: 48 }}>
            <span>{it}</span>
            <span style={{ color: R.accent }}>●</span>
          </span>
        ))}
      </div>
    </section>
  );
}
