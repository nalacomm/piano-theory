'use client';
import { NOTES } from '@/lib/theory';

interface ChordVoiceVisualProps {
  noteIndices: number[];
  rootIdx: number;
  color?: string;
}

export default function ChordVoiceVisual({ noteIndices, rootIdx, color = 'var(--green)' }: ChordVoiceVisualProps) {
  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'center', marginTop: 8 }}>
      {noteIndices.map((idx, i) => (
        <div
          key={i}
          style={{
            width: 44,
            height: 44,
            borderRadius: 8,
            background: idx === rootIdx ? color : 'var(--surface2)',
            border: `1px solid ${idx === rootIdx ? color : 'var(--border)'}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 600,
            color: idx === rootIdx ? 'var(--on-accent)' : 'var(--text)',
            transition: 'all 0.2s',
          }}
        >
          <span>{NOTES[idx % 12]}</span>
          <span style={{ fontSize: 9, opacity: 0.7 }}>{['R','3','5','7','9'][i] || ''}</span>
        </div>
      ))}
    </div>
  );
}
