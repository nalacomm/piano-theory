'use client';
import { NOTES } from '@/lib/theory';

interface PianoKeysProps {
  highlightedNotes: number[];
  rootNote: number;
  label?: string;
  onKeyClick?: (noteName: string) => void;
}

const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEYS = [1, 3, -1, 6, 8, 10, -1];
const BLACK_OFFSETS = [0.6, 1.6, -1, 3.6, 4.6, 5.6, -1];

export default function PianoKeys({ highlightedNotes, rootNote, label, onKeyClick }: PianoKeysProps) {
  const getWhiteColor = (noteIdx: number) => {
    if (noteIdx === rootNote) return 'var(--green)';
    if (highlightedNotes.includes(noteIdx)) return '#bfdbfe';
    return '#f8fafc';
  };
  const getBlackColor = (noteIdx: number) => {
    if (noteIdx === rootNote) return 'var(--green)';
    if (highlightedNotes.includes(noteIdx)) return '#818cf8';
    return '#1e293b';
  };

  return (
    <div style={{ userSelect: 'none' }}>
      {label && <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4, textAlign: 'center' }}>{label}</div>}
      <div style={{ position: 'relative', height: 80, width: '100%', maxWidth: 320, margin: '0 auto' }}>
        {WHITE_KEYS.map((noteIdx, i) => (
          <div
            key={i}
            onClick={() => onKeyClick?.(NOTES[noteIdx])}
            style={{
              position: 'absolute',
              left: `${(i / 7) * 100}%`,
              width: `${100 / 7}%`,
              height: '100%',
              background: getWhiteColor(noteIdx),
              border: '1px solid #94a3b8',
              borderRadius: '0 0 4px 4px',
              cursor: onKeyClick ? 'pointer' : 'default',
              transition: 'background 0.15s',
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'center',
              paddingBottom: 3,
            }}
          >
            <span style={{ fontSize: 9, color: highlightedNotes.includes(noteIdx) || noteIdx === rootNote ? 'var(--on-accent)' : '#94a3b8' }}>
              {NOTES[noteIdx]}
            </span>
          </div>
        ))}
        {BLACK_KEYS.map((noteIdx, i) => {
          if (noteIdx === -1) return null;
          return (
            <div
              key={i}
              onClick={() => onKeyClick?.(NOTES[noteIdx])}
              style={{
                position: 'absolute',
                left: `calc(${(BLACK_OFFSETS[i] / 7) * 100}%)`,
                width: `${(100 / 7) * 0.6}%`,
                height: '60%',
                background: getBlackColor(noteIdx),
                border: '1px solid #0f172a',
                borderRadius: '0 0 3px 3px',
                zIndex: 2,
                cursor: onKeyClick ? 'pointer' : 'default',
                transition: 'background 0.15s',
              }}
            />
          );
        })}
      </div>
    </div>
  );
}
