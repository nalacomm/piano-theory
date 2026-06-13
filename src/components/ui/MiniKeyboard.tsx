'use client';
import { NOTES } from '@/lib/theory';

interface MiniKeyboardProps {
  onTap: (note: string) => void;
  highlightNotes?: string[];
  correctNotes?: string[];
  wrongNotes?: string[];
}

const WHITE_KEYS = [0, 2, 4, 5, 7, 9, 11];
const BLACK_KEYS = [1, 3, -1, 6, 8, 10, -1];
const BLACK_OFFSETS = [0.6, 1.6, -1, 3.6, 4.6, 5.6, -1];

export default function MiniKeyboard({ onTap, highlightNotes = [], correctNotes = [], wrongNotes = [] }: MiniKeyboardProps) {
  const getWhiteColor = (noteIdx: number) => {
    const name = NOTES[noteIdx];
    if (correctNotes.includes(name)) return 'var(--green)';
    if (wrongNotes.includes(name)) return 'var(--red)';
    if (highlightNotes.includes(name)) return '#bfdbfe';
    return '#f8fafc';
  };
  const getBlackColor = (noteIdx: number) => {
    const name = NOTES[noteIdx];
    if (correctNotes.includes(name)) return 'var(--green)';
    if (wrongNotes.includes(name)) return 'var(--red)';
    if (highlightNotes.includes(name)) return '#818cf8';
    return '#1e293b';
  };

  return (
    <div style={{ position: 'relative', height: 90, width: '100%', maxWidth: 320, margin: '0 auto', userSelect: 'none' }}>
      {WHITE_KEYS.map((noteIdx, i) => (
        <div
          key={i}
          onPointerDown={() => onTap(NOTES[noteIdx])}
          style={{
            position: 'absolute',
            left: `${(i / 7) * 100}%`,
            width: `${100 / 7}%`,
            height: '100%',
            background: getWhiteColor(noteIdx),
            border: '1px solid #94a3b8',
            borderRadius: '0 0 4px 4px',
            cursor: 'pointer',
            transition: 'background 0.12s',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            paddingBottom: 3,
          }}
        >
          <span style={{ fontSize: 9, color: '#475569', pointerEvents: 'none' }}>{NOTES[noteIdx]}</span>
        </div>
      ))}
      {BLACK_KEYS.map((noteIdx, i) => {
        if (noteIdx === -1) return null;
        return (
          <div
            key={i}
            onPointerDown={() => onTap(NOTES[noteIdx])}
            style={{
              position: 'absolute',
              left: `calc(${(BLACK_OFFSETS[i] / 7) * 100}%)`,
              width: `${(100 / 7) * 0.6}%`,
              height: '60%',
              background: getBlackColor(noteIdx),
              border: '1px solid #0f172a',
              borderRadius: '0 0 3px 3px',
              zIndex: 2,
              cursor: 'pointer',
              transition: 'background 0.12s',
            }}
          />
        );
      })}
    </div>
  );
}
