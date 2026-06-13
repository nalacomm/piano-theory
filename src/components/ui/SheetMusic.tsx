'use client';

interface SheetMusicProps {
  noteIndices: number[];  // chromatic 0-11
  rootIdx: number;
  color?: string;
  layout?: 'scale' | 'chord';
}

// Standard flat spelling for most common cases (works correctly for C-rooted scales)
const NOTE_MAP: { pos: number; acc: 'sharp' | 'flat' | null }[] = [
  { pos: 0, acc: null },    // C
  { pos: 0, acc: 'sharp' }, // C#
  { pos: 1, acc: null },    // D
  { pos: 2, acc: 'flat' },  // Eb  (E line with flat)
  { pos: 2, acc: null },    // E
  { pos: 3, acc: null },    // F
  { pos: 3, acc: 'sharp' }, // F#  (F space with sharp)
  { pos: 4, acc: null },    // G
  { pos: 5, acc: 'flat' },  // Ab  (A space with flat)
  { pos: 5, acc: null },    // A
  { pos: 6, acc: 'flat' },  // Bb  (B line with flat)
  { pos: 6, acc: null },    // B
];

const STAFF_TOP = 20;  // y of top staff line (F5, diatonic pos 10)
const HALF = 5;        // px per diatonic step

// y for diatonic staff position (pos=0 is C4 ledger, pos=10 is F5 top line)
const noteY = (pos: number) => STAFF_TOP + (10 - pos) * HALF;

// 5 staff lines top→bottom: F5(10), D5(8), B4(6), G4(4), E4(2)
const STAFF_Y = [20, 30, 40, 50, 60];
const CLEF_X = 8;
const NOTES_START = 52;
const SCALE_STEP = 26;

interface StaffNote { diatPos: number; acc: 'sharp' | 'flat' | null; chromatic: number; }

function buildStaffNotes(indices: number[]): StaffNote[] {
  let octave = 0, prev = -1;
  return indices.map(ni => {
    const m = NOTE_MAP[ni % 12];
    if (m.pos <= prev) octave += 7;
    prev = m.pos;
    return { diatPos: m.pos + octave, acc: m.acc, chromatic: ni % 12 };
  });
}

function ledgerLinesFor(pos: number): number[] {
  const ys: number[] = [];
  if (pos <= 0) ys.push(noteY(0));   // C4
  if (pos <= -2) ys.push(noteY(-2)); // A3
  if (pos >= 12) ys.push(noteY(12)); // A5
  if (pos >= 14) ys.push(noteY(14)); // C6
  return ys;
}

export default function SheetMusic({ noteIndices, rootIdx, color = '#4ade80', layout = 'scale' }: SheetMusicProps) {
  const notes = buildStaffNotes(noteIndices);
  const isChord = layout === 'chord';
  const svgWidth = isChord ? 130 : Math.max(180, NOTES_START + notes.length * SCALE_STEP + 16);
  const svgH = 88;

  const chordX = 85;
  const sorted = isChord ? [...notes].sort((a, b) => a.diatPos - b.diatPos) : notes;

  // Offset adjacent chord tones (intervals of 2nd) slightly right
  const offsets = new Array(sorted.length).fill(0);
  if (isChord) {
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].diatPos - sorted[i-1].diatPos <= 1) offsets[i] = 11;
    }
  }

  const getX = (note: StaffNote, i: number) => {
    if (!isChord) return NOTES_START + i * SCALE_STEP;
    const si = sorted.findIndex(n => n === note);
    return chordX + (si >= 0 ? offsets[si] : 0);
  };

  // Chord stem from bottom note going down (stem down convention for notes above middle)
  const stemFromNote = isChord && sorted.length > 0 ? sorted[0] : null;
  const stemX = stemFromNote ? chordX + 5 : 0;
  const stemY1 = stemFromNote ? noteY(stemFromNote.diatPos) : 0;
  const stemY2 = stemFromNote ? noteY(stemFromNote.diatPos) + 28 : 0;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg width={svgWidth} height={svgH} style={{ display: 'block' }}>
        {/* Staff lines */}
        {STAFF_Y.map((y, i) => (
          <line key={i} x1={CLEF_X} y1={y} x2={svgWidth - 4} y2={y} stroke="#2d3f55" strokeWidth={1} />
        ))}

        {/* Treble clef */}
        <text x={CLEF_X + 1} y={svgH - 8} fontSize={60} fill="#3d5068"
          fontFamily="Georgia, 'Times New Roman', serif"
          style={{ userSelect: 'none' } as React.CSSProperties}>
          𝄞
        </text>

        {/* Chord stem */}
        {isChord && sorted.length > 1 && (
          <line x1={stemX} y1={stemY1} x2={stemX} y2={stemY2} stroke="#8fa3b8" strokeWidth={1.2} />
        )}

        {/* Notes */}
        {notes.map((note, i) => {
          const x = getX(note, i);
          const y = noteY(note.diatPos);
          const isRoot = note.chromatic === rootIdx % 12;
          const nc = isRoot ? color : '#6b8096';
          const ledgers = ledgerLinesFor(note.diatPos);

          return (
            <g key={i}>
              {ledgers.map((ly, li) => (
                <line key={li} x1={x - 9} y1={ly} x2={x + 9} y2={ly} stroke="#4b6280" strokeWidth={1} />
              ))}
              {note.acc === 'sharp' && (
                <text x={x - 14} y={y + 4} fontSize={11} fill={nc}
                  fontFamily="Georgia, serif" style={{ userSelect: 'none' } as React.CSSProperties}>♯</text>
              )}
              {note.acc === 'flat' && (
                <text x={x - 12} y={y + 6} fontSize={13} fill={nc}
                  fontFamily="Georgia, serif" style={{ userSelect: 'none' } as React.CSSProperties}>♭</text>
              )}
              <ellipse cx={x} cy={y} rx={5} ry={3.5} fill={nc} />
              {!isChord && (
                <line x1={x + 5} y1={y} x2={x + 5} y2={y - 20} stroke={nc} strokeWidth={1} opacity={0.5} />
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}
