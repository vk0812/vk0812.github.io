import { R } from '../tokens';
import { Reveal } from './Reveal';

const FEATURES = [
  { t: 'Multimodal capture',  b: 'Text, RTF, code, images, screenshots — one history, one search bar.' },
  { t: 'Hybrid search',       b: 'Lexical (BM25 via FTS5) + semantic vectors + multimodal CLIP, blended.' },
  { t: 'Sub-50ms at 100k',    b: 'Search-as-you-type stays instant whether you have 100 or 100,000 clips.' },
  { t: '6+ months retention', b: 'Default retention is generous. Tune it per app, or per data type.' },
  { t: 'Per-app blacklist',   b: '1Password, banking apps, anything you flag is never read or stored.' },
  { t: 'Secret redaction',    b: 'Tokens, keys, JWTs, AWS pairs — masked on capture by regex.' },
  { t: 'On-device VLM',       b: 'Qwen2.5-VL runs locally for the context note. Nothing leaves your Mac.' },
  { t: '100% offline',        b: 'No accounts. No telemetry. No network calls. Verified by Little Snitch.' },
];

export function Features() {
  return (
    <section id="features" style={{ padding: 'clamp(80px,12vw,160px) clamp(24px, 6vw, 96px)', background: R.bg }}>
      <div style={{ maxWidth: 1280, margin: '0 auto' }}>
        <Reveal>
          <span style={{ fontFamily: R.fontMono, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: R.accent }}>features</span>
        </Reveal>
        <Reveal delay={80}>
          <h2 style={{ fontSize: 'clamp(32px, 5vw, 64px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '16px 0 0', maxWidth: 900 }}>
            Quietly powerful.{' '}
            <span style={{ color: R.muted }}>Aggressively local.</span>
          </h2>
        </Reveal>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 1, marginTop: 80, background: R.hairline, border: `1px solid ${R.hairline}`, borderRadius: 16, overflow: 'hidden' }}>
          {FEATURES.map((f, i) => (
            <Reveal key={f.t} delay={i * 40}>
              <div style={{ background: R.bg, padding: 'clamp(20px,3vw,32px)', height: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
                <span style={{ fontFamily: R.fontMono, fontSize: 11, color: R.muted, letterSpacing: '0.06em' }}>{String(i + 1).padStart(2, '0')}</span>
                <h3 style={{ fontSize: 20, fontWeight: 500, letterSpacing: '-0.01em', margin: 0, color: R.ink }}>{f.t}</h3>
                <p style={{ fontSize: 14, lineHeight: 1.55, color: R.inkSoft, margin: 0 }}>{f.b}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
