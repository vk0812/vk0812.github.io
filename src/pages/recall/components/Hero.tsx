import { useState, useEffect } from 'react';
import { R } from '../tokens';
import { RecallMark } from './RecallMark';
import { DownloadBtn } from './Nav';
import { useTypewriter, useWindowWidth } from '../hooks';

const QUERIES = [
  { q: 'auth dialog screenshot',     hit: { kind: '◧', title: 'Image · 2FA prompt',                     note: 'the screenshot of the auth dialog you copied' } },
  { q: 'json from anna last tuesday', hit: { kind: '≡', title: '{ "user_id": 4218, "scope": "admin" }',   note: 'Slack · #eng-platform · 2 May · with Anna' } },
  { q: 'vllm pr review',             hit: { kind: '≡', title: 'def sample(logits, temperature):',        note: 'copied from a vLLM PR review during the team sync' } },
  { q: 'figma login copy',           hit: { kind: '≡', title: '"welcome back. let’s pick up where you left off."', note: 'Figma · Onboarding v3 · 28 Apr' } },
  { q: 'sampler overflow traceback', hit: { kind: '◧', title: 'Image · Python traceback',                note: 'VS Code · vllm/vllm@a3f9 · fix/sampler-overflow' } },
];

function QueryRow({ hit, active }: { hit: typeof QUERIES[0]['hit']; active: boolean }) {
  return (
    <div style={{ display: 'flex', gap: 12, padding: '12px 14px', background: active ? '#1f5fff12' : 'transparent', borderRadius: 10, alignItems: 'flex-start', transition: 'background 0.3s ease' }}>
      <div style={{ width: 22, height: 22, borderRadius: 4, marginTop: 1, background: active ? R.accent : '#0000000d', color: active ? '#fff' : R.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontFamily: R.fontMono, flexShrink: 0 }}>{hit.kind}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 14, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{hit.title}</div>
        <div style={{ fontSize: 12, color: R.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 2 }}>{hit.note}</div>
      </div>
      {active && <span style={{ fontFamily: R.fontMono, fontSize: 10, color: R.accent, alignSelf: 'center', letterSpacing: '0.06em', flexShrink: 0 }}>↵ MATCH</span>}
    </div>
  );
}

function HeroSearchDemo() {
  const [idx, setIdx] = useState(0);
  const [typed, done] = useTypewriter(QUERIES[idx].q);
  useEffect(() => {
    if (done) {
      const t = setTimeout(() => setIdx((i) => (i + 1) % QUERIES.length), 1600);
      return () => clearTimeout(t);
    }
  }, [done]);
  const showResults = typed.length > 4;
  const others = QUERIES.filter((_, i) => i !== idx).slice(0, 3);
  return (
    <div style={{ width: '100%', maxWidth: 720, margin: '0 auto', borderRadius: 18, background: 'linear-gradient(180deg, #ffffffe0, #ffffffb8)', border: '1px solid #00000014', boxShadow: '0 30px 80px -20px #0000002b, 0 6px 18px -6px #00000014', backdropFilter: 'blur(24px)', overflow: 'hidden', fontFamily: R.fontUI, color: R.ink }}>
      {/* title bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #00000010' }}>
        <span style={{ width: 11, height: 11, borderRadius: 99, background: '#ff5f57', display: 'block' }} />
        <span style={{ width: 11, height: 11, borderRadius: 99, background: '#febc2e', display: 'block' }} />
        <span style={{ width: 11, height: 11, borderRadius: 99, background: '#28c840', display: 'block' }} />
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: R.fontMono, fontSize: 11, color: R.muted, letterSpacing: '0.04em' }}>recall · ⌘ ⇧ V</span>
      </div>
      {/* input */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 22px', borderBottom: '1px solid #00000010' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={R.ink} strokeWidth="2" opacity={0.55}>
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <span style={{ fontSize: 18, letterSpacing: '-0.01em' }}>
          {typed || <span style={{ color: R.muted }}>search your clipboard…</span>}
          <span style={{ display: 'inline-block', width: 2, height: 18, background: R.accent, marginLeft: 2, verticalAlign: 'middle', animation: 'recall-blink 1s steps(2) infinite' }} />
        </span>
      </div>
      {/* results */}
      <div style={{ padding: 8, minHeight: 220 }}>
        {showResults ? (
          <>
            <QueryRow hit={QUERIES[idx].hit} active />
            {others.map((o, i) => <QueryRow key={i} hit={o.hit} active={false} />)}
          </>
        ) : (
          <div style={{ padding: 32, color: R.muted, fontSize: 13, fontFamily: R.fontMono, letterSpacing: '0.02em' }}>
            ↳ matching across <span style={{ color: R.ink }}>BM25</span> · <span style={{ color: R.ink }}>vector</span> · <span style={{ color: R.ink }}>CLIP</span> · <span style={{ color: R.ink }}>filters</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function Hero() {
  const width = useWindowWidth();
  const isMobile = width < 640;
  return (
    <section style={{ minHeight: '100vh', position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: isMobile ? 80 : 96, paddingBottom: 80, overflow: 'hidden' }}>
      {/* subtle dot grid bg */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.5 }}>
        <defs>
          <pattern id="hero-dots" width="32" height="32" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#0000000d" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#hero-dots)" />
      </svg>
      {/* radial glow */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', background: 'radial-gradient(60% 50% at 50% 0%, #1f5fff14, transparent 70%)' }} />

      <div style={{ position: 'relative', textAlign: 'center', maxWidth: 900, padding: '0 clamp(20px, 5vw, 24px)', width: '100%', boxSizing: 'border-box' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '6px 12px', borderRadius: 999, border: `1px solid ${R.hairline}`, background: '#ffffff80', backdropFilter: 'blur(8px)', marginBottom: 28, maxWidth: '100%', boxSizing: 'border-box' }}>
          <span style={{ width: 6, height: 6, borderRadius: 99, background: R.accent, boxShadow: `0 0 0 4px ${R.accent}22`, display: 'block', flexShrink: 0 }} />
          <span style={{ fontFamily: R.fontMono, fontSize: 11, letterSpacing: '0.04em', color: R.inkSoft, textTransform: 'uppercase', whiteSpace: isMobile ? 'normal' : 'nowrap', lineHeight: 1.4 }}>v1.0 · now available · macOS · MIT</span>
        </div>
        <h1 style={{
          fontSize: isMobile ? '24px' : 'clamp(48px, 8vw, 104px)',
          fontWeight: 500, letterSpacing: isMobile ? '-0.02em' : '-0.04em', lineHeight: 1.15, margin: 0,
          overflowWrap: 'break-word', wordBreak: 'break-word',
          width: '100%',
        }}>
          {isMobile ? (
            <>
              The clipboard<br />
              you can<br />
              <span style={{ color: R.accent, fontStyle: 'italic', fontWeight: 400 }}>ask questions to.</span>
            </>
          ) : (
            <>The clipboard <br />you can <span style={{ color: R.accent, fontStyle: 'italic', fontWeight: 400 }}>ask questions to.</span></>
          )}
        </h1>
        <p style={{ fontSize: isMobile ? 14 : 'clamp(15px, 1.4vw, 20px)', lineHeight: 1.6, color: R.inkSoft, maxWidth: isMobile ? '100%' : 620, margin: '20px auto 0', overflowWrap: 'break-word' }}>
          Recall is a semantic clipboard for macOS. Every text and image you copy — kept for six months, searchable in plain English, and quietly annotated with where it came from. All on your Mac.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginTop: 32, flexDirection: isMobile ? 'column' : 'row', alignItems: isMobile ? 'stretch' : 'center' }}>
          <DownloadBtn />
          <a href="#how" style={{ padding: '14px 22px', borderRadius: 12, border: `1px solid ${R.hairline}`, color: R.ink, textDecoration: 'none', fontSize: 14, fontWeight: 500, background: '#ffffff80', backdropFilter: 'blur(8px)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            See how it works <span aria-hidden style={{ fontFamily: R.fontMono, opacity: 0.6 }}>↓</span>
          </a>
        </div>
        <div style={{ marginTop: 12, fontFamily: R.fontMono, fontSize: 11, color: R.muted, letterSpacing: '0.04em' }}>
          free · open source · apple silicon · ~38 MB
        </div>
      </div>

      {!isMobile && (
        <div style={{ marginTop: 80, width: '100%', padding: '0 24px', position: 'relative' }}>
          <HeroSearchDemo />
        </div>
      )}

      {isMobile && (
        <div style={{ marginTop: 48, width: '100%', padding: '0 16px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ borderRadius: 14, background: 'linear-gradient(180deg,#ffffffe0,#ffffffb8)', border: '1px solid #00000014', boxShadow: '0 20px 40px -10px #0000001a', overflow: 'hidden', fontFamily: R.fontUI }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderBottom: '1px solid #00000010' }}>
              <span style={{ width: 11, height: 11, borderRadius: 99, background: '#ff5f57', display: 'block' }} />
              <span style={{ width: 11, height: 11, borderRadius: 99, background: '#febc2e', display: 'block' }} />
              <span style={{ width: 11, height: 11, borderRadius: 99, background: '#28c840', display: 'block' }} />
              <span style={{ marginLeft: 'auto', fontFamily: R.fontMono, fontSize: 11, color: R.muted }}>recall · ⌘ ⇧ V</span>
            </div>
            <div style={{ padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #00000010' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={R.ink} strokeWidth="2" opacity={0.4}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <span style={{ fontSize: 15, color: R.muted }}>search your clipboard…</span>
            </div>
            <div style={{ padding: 8 }}>
              {QUERIES.slice(0, 3).map((q, i) => (
                <div key={i} style={{ display: 'flex', gap: 10, padding: '10px 12px', background: i === 0 ? '#1f5fff10' : 'transparent', borderRadius: 8, alignItems: 'center' }}>
                  <div style={{ width: 20, height: 20, borderRadius: 4, background: i === 0 ? R.accent : '#0000000d', color: i === 0 ? '#fff' : R.muted, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontFamily: R.fontMono, flexShrink: 0 }}>{q.hit.kind}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.hit.title}</div>
                    <div style={{ fontSize: 11, color: R.muted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.hit.note}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
