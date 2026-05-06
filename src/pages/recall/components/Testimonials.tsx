import { R } from '../tokens';
import { Reveal } from './Reveal';

const TESTIMONIALS = [
  { q: 'i copy stuff and forget about it 40 times a day. recall is the first app that actually finds it.', a: 'maya c.', r: 'staff engineer' },
  { q: '"the screenshot of the auth dialog" — and it found it. i didn\'t know i wanted this until i had it.', a: 'ben w.', r: 'design lead' },
  { q: 'on-device LLM context notes are wild. it\'s like the clip wrote a journal entry about itself.', a: 'priya k.', r: 'ml researcher' },
  { q: 'finally a clipboard manager that doesn\'t look like it was built in 2009.', a: 'jonas r.', r: 'product designer' },
  { q: 'shipped in 30 seconds. zero permissions panic. zero accounts. just works.', a: 'tomás l.', r: 'indie hacker' },
  { q: 'six months of clipboard, fully offline, in 38 megabytes. how is this even free.', a: 'sara m.', r: 'security engineer' },
];

function Marquee({ items, speed = 60, reverse = false }: { items: typeof TESTIMONIALS; speed?: number; reverse?: boolean }) {
  const tripled = [...items, ...items, ...items];
  return (
    <div style={{ overflow: 'hidden', WebkitMaskImage: 'linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)' }}>
      <style>{`@keyframes recall-marquee-t { from { transform: translateX(0); } to { transform: translateX(calc(-100% / 3)); } }`}</style>
      <div style={{ display: 'flex', gap: 20, width: 'max-content', animation: `recall-marquee-t ${speed}s linear infinite ${reverse ? 'reverse' : ''}` }}>
        {tripled.map((t, i) => (
          <div key={i} style={{ width: 'clamp(300px,35vw,380px)', padding: 24, borderRadius: 14, background: '#fff', border: `1px solid ${R.hairline}`, flex: '0 0 auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            <p style={{ fontSize: 15, lineHeight: 1.5, margin: 0, color: R.ink, letterSpacing: '-0.005em' }}>{t.q}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
              <div style={{ width: 28, height: 28, borderRadius: 99, background: 'linear-gradient(135deg, #1f5fff, #0b2670)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: R.fontMono, fontSize: 11, flexShrink: 0 }}>{t.a[0].toUpperCase()}</div>
              <div>
                <div style={{ fontSize: 12, fontWeight: 500, color: R.ink }}>{t.a}</div>
                <div style={{ fontSize: 11, color: R.muted, fontFamily: R.fontMono }}>{t.r}</div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function Testimonials() {
  return (
    <section style={{ padding: 'clamp(80px,12vw,160px) 0 clamp(60px,8vw,120px)', background: R.bg, overflow: 'hidden' }}>
      <div style={{ padding: '0 clamp(24px, 6vw, 96px)', maxWidth: 1280, margin: '0 auto' }}>
        <Reveal>
          <span style={{ fontFamily: R.fontMono, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: R.accent }}>03 · what people say</span>
        </Reveal>
        <Reveal delay={80}>
          <h2 style={{ fontSize: 'clamp(28px, 5vw, 64px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05, margin: '16px 0 0', maxWidth: 900 }}>
            From people who copy{' '}
            <span style={{ color: R.muted }}>far too much.</span>
          </h2>
        </Reveal>
      </div>
      <div style={{ marginTop: 64, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <Marquee items={TESTIMONIALS} speed={60} />
        <Marquee items={[...TESTIMONIALS].reverse()} speed={75} reverse />
      </div>
    </section>
  );
}
