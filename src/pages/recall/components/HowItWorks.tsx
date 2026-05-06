import { useRef } from 'react';
import { R } from '../tokens';
import { MiniSearchPanel } from './MiniSearchPanel';
import { useScrollProgress, useWindowWidth } from '../hooks';

const STAGES = [
  { label: '01 · capture', title: 'You copy something.', body: 'Recall watches your pasteboard quietly. Text, code, images, screenshots — every clip is captured and stored locally on your Mac.', chips: ['text', 'image', 'screenshot', 'rtf'] },
  { label: '02 · context', title: 'It quietly notices the moment.', body: 'Source app, window title, URL, recent app focus, calendar event, near-in-time clips, git branch — captured at copy time, never sent anywhere.', chips: ['app', 'window', 'url', 'meeting', 'branch', 'time'] },
  { label: '03 · note', title: 'An on-device VLM writes a one-line note.', body: '"copied from a vLLM PR review during the team sync, near a Python traceback." Now the clip remembers itself in your language.', chips: ['Qwen2.5-VL', '<200ms', 'on-device'] },
  { label: '04 · recall', title: 'You search in plain English.', body: 'Hybrid lexical (BM25) + semantic vector. Sub-50ms over 100k entries. The right clip surfaces — even when you forgot what was in it.', chips: ['BM25', 'vector', '< 50ms'] },
];

function CaptureViz({ localP }: { localP: number }) {
  const items = [
    { y: -60, t: 'screenshot · 2FA prompt', kind: '◧' },
    { y: 0,   t: 'def sample(logits, temp)', kind: '≡' },
    { y: 60,  t: '{ "user_id": 4218 }',      kind: '≡' },
  ];
  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: 480, height: 300 }}>
      {items.map((it, i) => (
        <div key={i} style={{ position: 'absolute', left: '50%', top: '50%', transform: `translate(-50%, calc(-50% + ${it.y}px)) scale(${1 - i * 0.04})`, width: 'min(320px, 90%)', padding: '14px 16px', borderRadius: 12, background: '#fff', border: `1px solid ${R.hairline}`, boxShadow: `0 ${10 + i * 4}px ${30 + i * 6}px -10px #00000020`, fontFamily: R.fontUI, opacity: 1 - i * 0.18, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ width: 20, height: 20, borderRadius: 4, background: '#0000000d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: R.fontMono, fontSize: 10, color: R.muted, flexShrink: 0 }}>{it.kind}</span>
          <span style={{ fontSize: 13, color: R.ink, fontFamily: it.kind === '≡' ? R.fontMono : R.fontUI, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{it.t}</span>
          <span style={{ marginLeft: 'auto', fontFamily: R.fontMono, fontSize: 10, color: R.accent, flexShrink: 0 }}>+{(localP * 100).toFixed(0)}%</span>
        </div>
      ))}
    </div>
  );
}

function ContextViz({ localP }: { localP: number }) {
  const fields: [string, string][] = [
    ['app', 'VS Code'], ['window', 'vllm/vllm — PR #4218'], ['url', 'github.com/vllm-project/vllm/pull/4218'], ['branch', 'fix/sampler-overflow'], ['meeting', 'Eng sync · 14:02'], ['near', '3 clips · python traceback'],
  ];
  const visible = Math.ceil(localP * fields.length);
  return (
    <div style={{ width: '100%', maxWidth: 460, padding: 'clamp(16px,3vw,28px)', borderRadius: 16, background: '#fff', border: `1px solid ${R.hairline}`, boxShadow: '0 30px 60px -20px #0000002b', fontFamily: R.fontMono, fontSize: 13 }}>
      <div style={{ fontSize: 10, color: R.muted, letterSpacing: '0.06em', marginBottom: 16, textTransform: 'uppercase' }}>captured at copy-time</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: '10px 24px', overflow: 'hidden' }}>
        {fields.map(([k, v], i) => (
          <><span key={k + 'k'} style={{ color: R.muted, opacity: i < visible ? 1 : 0.15, transition: 'opacity 0.3s' }}>{k}</span>
          <span key={k + 'v'} style={{ color: R.ink, opacity: i < visible ? 1 : 0.15, transition: 'opacity 0.3s', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</span></>
        ))}
      </div>
    </div>
  );
}

function NoteViz({ localP }: { localP: number }) {
  const full = '"copied from a vLLM PR review during the team sync, near a Python traceback."';
  const len = Math.ceil(localP * full.length);
  return (
    <div style={{ width: '100%', maxWidth: 460, padding: 'clamp(20px,4vw,32px)', borderRadius: 16, background: R.dark, color: R.darkInk, boxShadow: '0 30px 60px -20px #0000004f', fontFamily: R.fontUI }}>
      <div style={{ fontFamily: R.fontMono, fontSize: 10, color: R.darkMuted, letterSpacing: '0.06em', marginBottom: 16, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ color: R.accent }}>◐</span> on-device · qwen2.5-vl
      </div>
      <div style={{ fontSize: 'clamp(16px,2vw,22px)', lineHeight: 1.4, fontWeight: 400, letterSpacing: '-0.01em', minHeight: 80 }}>
        {full.slice(0, len)}
        <span style={{ display: 'inline-block', width: 2, height: 22, background: R.accent, marginLeft: 2, verticalAlign: 'middle', animation: 'recall-blink 1s steps(2) infinite' }} />
      </div>
    </div>
  );
}

function SearchViz({ localP }: { localP: number }) {
  const queries = ['vllm pr', 'vllm pr review', 'vllm pr review traceback'];
  const qIdx = Math.min(queries.length - 1, Math.floor(localP * queries.length));
  return (
    <MiniSearchPanel width="100%" query={queries[qIdx]} rows={[
      { kind: '≡', title: 'def sample(logits, temperature):', note: 'copied from a vLLM PR review during the team sync' },
      { kind: '◧', title: 'Image · Python traceback', note: 'VS Code · vllm/vllm@a3f9' },
      { kind: '≡', title: 'meeting notes · sampler bug', note: 'Cal · Eng sync · 14:02' },
      { kind: '≡', title: '{ "user_id": 4218, "scope": "admin" }', note: 'Slack · #eng-platform' },
    ]} />
  );
}

function StageVisual({ stage, localP }: { stage: number; localP: number }) {
  if (stage === 0) return <CaptureViz localP={localP} />;
  if (stage === 1) return <ContextViz localP={localP} />;
  if (stage === 2) return <NoteViz localP={localP} />;
  return <SearchViz localP={localP} />;
}

export function HowItWorks() {
  const wrap = useRef<HTMLElement>(null);
  const p = useScrollProgress(wrap as React.RefObject<HTMLElement>);
  const stage = Math.min(STAGES.length - 1, Math.floor(p * STAGES.length));
  const localP = p * STAGES.length - stage;
  const width = useWindowWidth();
  const isMobile = width < 768;

  return (
    <section id="how" ref={wrap} style={{ position: 'relative', height: `${STAGES.length * 100}vh`, background: R.bg }}>
      <div style={{
        position: 'sticky', top: 0, height: '100vh',
        display: 'grid',
        gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr',
        alignItems: 'center',
        gap: isMobile ? 0 : 64,
        padding: `0 clamp(24px, 6vw, 96px)`,
        overflow: 'hidden',
      }}>
        {/* Text side */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: isMobile ? 40 : 0 }}>
          <span style={{ fontFamily: R.fontMono, fontSize: 11, letterSpacing: '0.04em', textTransform: 'uppercase', color: R.accent }}>{STAGES[stage].label}</span>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 56px)', fontWeight: 500, letterSpacing: '-0.03em', lineHeight: 1.05, margin: 0, color: R.ink }}>
            {STAGES[stage].title}
          </h2>
          <p style={{ fontSize: 'clamp(14px, 1.3vw, 18px)', lineHeight: 1.55, color: R.inkSoft, margin: 0, maxWidth: 520 }}>
            {STAGES[stage].body}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 4 }}>
            {STAGES[stage].chips.map((c) => (
              <span key={c} style={{ fontFamily: R.fontMono, fontSize: 11, padding: '5px 9px', border: `1px solid ${R.hairline}`, borderRadius: 999, color: R.inkSoft, background: '#ffffff80' }}>{c}</span>
            ))}
          </div>
          {/* progress dots */}
          <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
            {STAGES.map((_, i) => (
              <div key={i} style={{ height: 3, flex: 1, maxWidth: 60, borderRadius: 99, background: i < stage ? R.ink : i === stage ? R.ink : '#0000001a', position: 'relative', overflow: 'hidden' }}>
                {i === stage && (
                  <div style={{ position: 'absolute', inset: 0, background: R.accent, transformOrigin: 'left', transform: `scaleX(${localP})`, transition: 'transform 0.1s linear' }} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Visual side */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: isMobile ? '40vh' : '70vh', paddingBottom: isMobile ? 24 : 0 }}>
          <div style={{ width: '100%', maxWidth: isMobile ? 340 : 480 }}>
            <StageVisual stage={stage} localP={localP} />
          </div>
        </div>
      </div>
    </section>
  );
}
