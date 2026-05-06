import { R } from '../tokens';

interface Row { kind?: string; title: string; note: string }
interface Props { width?: number | string; dark?: boolean; query?: string; rows?: Row[] }

export function MiniSearchPanel({ width = 360, dark = false, query = '', rows = [] }: Props) {
  const ink = dark ? R.darkInk : R.ink;
  const bg = dark ? '#1c1c1f' : '#ffffffd9';
  const border = dark ? '#ffffff1a' : '#0000001a';
  return (
    <div style={{ width, borderRadius: 14, background: bg, border: `1px solid ${border}`, boxShadow: dark ? '0 20px 60px #0008' : '0 20px 60px #0002', backdropFilter: 'blur(20px)', overflow: 'hidden', fontFamily: R.fontUI, color: ink }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: `1px solid ${border}` }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={ink} strokeWidth="2" opacity={0.55}>
          <circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" />
        </svg>
        <span style={{ fontSize: 13, opacity: query ? 1 : 0.5 }}>{query || 'Search your clipboard…'}</span>
      </div>
      <div style={{ padding: 6 }}>
        {rows.map((r, i) => (
          <div key={i} style={{ display: 'flex', gap: 10, padding: '8px 10px', background: i === 0 ? (dark ? '#ffffff0a' : '#1f5fff14') : 'transparent', borderRadius: 8, alignItems: 'flex-start' }}>
            <div style={{ width: 16, height: 16, borderRadius: 3, marginTop: 2, background: dark ? '#ffffff14' : '#0000000d', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontFamily: R.fontMono, opacity: 0.6 }}>{r.kind || '≡'}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
              <div style={{ fontSize: 11, opacity: 0.6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.note}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
