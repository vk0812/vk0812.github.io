import { R } from '../tokens';

interface RecallMarkProps {
  size?: number;
  fg?: string;
  accent?: string;
  bg?: string | null;
  ring?: boolean;
  gap?: boolean;
  dotScale?: number;
}

export function RecallMark({
  size = 64, fg = R.ink, accent = R.accent,
  bg = null, ring = true, gap = true, dotScale = 1,
}: RecallMarkProps) {
  const s = size, c = s / 2;
  const ringR = s * 0.34;
  const dotR = s * 0.085 * dotScale;
  const stroke = Math.max(1.5, s * 0.022);
  const circ = 2 * Math.PI * ringR;
  const dash = gap ? `${circ - s * 0.08} ${s * 0.08}` : 'none';
  return (
    <svg width={s} height={s} viewBox={`0 0 ${s} ${s}`} style={{ display: 'block' }}>
      {bg && <rect width={s} height={s} fill={bg} />}
      {ring && (
        <circle cx={c} cy={c} r={ringR} fill="none" stroke={fg}
          strokeWidth={stroke} strokeDasharray={dash} strokeLinecap="round"
          transform={`rotate(-12 ${c} ${c})`} opacity={0.9} />
      )}
      {ring && (
        <circle cx={c} cy={c} r={ringR * 0.62} fill="none" stroke={fg}
          strokeWidth={stroke * 0.7} opacity={0.18} />
      )}
      <circle cx={c} cy={c} r={dotR} fill={accent} />
    </svg>
  );
}

export function RecallWordmark({ size = 48, color = R.ink, accent = R.accent }: { size?: number; color?: string; accent?: string }) {
  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: size * 0.36 }}>
      <RecallMark size={size} fg={color} accent={accent} />
      <span style={{ fontFamily: R.fontUI, fontSize: size * 0.78, fontWeight: 500, letterSpacing: '-0.02em', color, lineHeight: 1 }}>
        recall
      </span>
    </div>
  );
}
