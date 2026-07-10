'use client';
import { useState, useCallback, useEffect } from 'react';
import { playSingleNote } from '@/lib/audio';

// ── Staff geometry ─────────────────────────────────────────────────────────────
// Lines at y = 40, 50, 60, 70, 80  (line 1 = bottom = y 80)
// Spaces: 45, 55, 65, 75
// Ledger below treble: y = 90 (Middle C)
// Ledger above bass:   y = 30 (Middle C)

const LINE_Y = [80, 70, 60, 50, 40]; // bottom → top (line 1 → line 5)

interface StaffNote {
  label: string;     // "E4", "G4" etc.
  display: string;   // "E", "F", "G" — letter only for quiz
  y: number;
  isLine: boolean;
  isLedger?: boolean;
  ledgerY?: number;
  mnemonic: string;
  audioName: string; // note name for playback
}

const TREBLE: StaffNote[] = [
  { label: 'C4', display: 'C', y: 90,  isLine: true,  isLedger: true,  ledgerY: 90,  mnemonic: 'Middle C — ledger line below the staff',               audioName: 'C' },
  { label: 'D4', display: 'D', y: 85,  isLine: false,                                mnemonic: 'D — space just below the staff',                       audioName: 'D' },
  { label: 'E4', display: 'E', y: 80,  isLine: true,                                 mnemonic: 'Line 1 — Every (Good Boy Does Fine)',                   audioName: 'E' },
  { label: 'F4', display: 'F', y: 75,  isLine: false,                                mnemonic: 'Space 1 — (F)ACE',                                     audioName: 'F' },
  { label: 'G4', display: 'G', y: 70,  isLine: true,                                 mnemonic: 'Line 2 — Every (G)ood Boy Does Fine',                  audioName: 'G' },
  { label: 'A4', display: 'A', y: 65,  isLine: false,                                mnemonic: 'Space 2 — F(A)CE',                                     audioName: 'A' },
  { label: 'B4', display: 'B', y: 60,  isLine: true,                                 mnemonic: 'Line 3 — Every Good (B)oy Does Fine',                  audioName: 'B' },
  { label: 'C5', display: 'C', y: 55,  isLine: false,                                mnemonic: 'Space 3 — FA(C)E',                                     audioName: 'C' },
  { label: 'D5', display: 'D', y: 50,  isLine: true,                                 mnemonic: 'Line 4 — Every Good Boy (D)oes Fine',                  audioName: 'D' },
  { label: 'E5', display: 'E', y: 45,  isLine: false,                                mnemonic: 'Space 4 — FAC(E)',                                     audioName: 'E' },
  { label: 'F5', display: 'F', y: 40,  isLine: true,                                 mnemonic: 'Line 5 — Every Good Boy Does (F)ine',                  audioName: 'F' },
  { label: 'G5', display: 'G', y: 35,  isLine: false,                                mnemonic: 'Space above staff',                                    audioName: 'G' },
];

const BASS: StaffNote[] = [
  { label: 'G2', display: 'G', y: 80,  isLine: true,                                 mnemonic: 'Line 1 — (G)ood Boys Do Fine Always',                  audioName: 'G' },
  { label: 'A2', display: 'A', y: 75,  isLine: false,                                mnemonic: 'Space 1 — (A)ll Cows Eat Grass',                       audioName: 'A' },
  { label: 'B2', display: 'B', y: 70,  isLine: true,                                 mnemonic: 'Line 2 — Good (B)oys Do Fine Always',                  audioName: 'B' },
  { label: 'C3', display: 'C', y: 65,  isLine: false,                                mnemonic: 'Space 2 — All (C)ows Eat Grass',                       audioName: 'C' },
  { label: 'D3', display: 'D', y: 60,  isLine: true,                                 mnemonic: 'Line 3 — Good Boys (D)o Fine Always',                  audioName: 'D' },
  { label: 'E3', display: 'E', y: 55,  isLine: false,                                mnemonic: 'Space 3 — All Cows (E)at Grass',                       audioName: 'E' },
  { label: 'F3', display: 'F', y: 50,  isLine: true,                                 mnemonic: 'Line 4 — Good Boys Do (F)ine Always',                  audioName: 'F' },
  { label: 'G3', display: 'G', y: 45,  isLine: false,                                mnemonic: 'Space 4 — All Cows Eat (G)rass',                       audioName: 'G' },
  { label: 'A3', display: 'A', y: 40,  isLine: true,                                 mnemonic: 'Line 5 — Good Boys Do Fine (A)lways',                  audioName: 'A' },
  { label: 'B3', display: 'B', y: 35,  isLine: false,                                mnemonic: 'Space above staff',                                    audioName: 'B' },
  { label: 'C4', display: 'C', y: 30,  isLine: true,  isLedger: true,  ledgerY: 30,  mnemonic: 'Middle C — ledger line above the staff',               audioName: 'C' },
];

// ── Staff SVG ──────────────────────────────────────────────────────────────────

function StaffSVG({
  clef,
  notes,
  highlighted,
  onNoteClick,
  showAll,
}: {
  clef: 'treble' | 'bass';
  notes: StaffNote[];
  highlighted: string | null;
  onNoteClick: (n: StaffNote) => void;
  showAll: boolean;
}) {
  const W = 340, H = clef === 'treble' ? 120 : 110;
  const startX = 58, endX = W - 12;
  const noteX = 200;
  const lineColor = 'var(--text3)';
  const lineNoteColor = '#4d9ef7';
  const spaceNoteColor = '#a78bfa';
  const ledgerNoteColor = '#22d3ee';

  const visibleNotes = showAll ? notes : notes.filter(n => n.label === highlighted);

  function noteColor(n: StaffNote) {
    if (n.label === highlighted) return '#facc15';
    if (n.isLedger) return ledgerNoteColor;
    return n.isLine ? lineNoteColor : spaceNoteColor;
  }

  // Ledger lines for notes outside the main staff
  const ledgerLines: number[] = [];
  visibleNotes.forEach(n => {
    if (n.isLedger && n.ledgerY !== undefined) ledgerLines.push(n.ledgerY);
  });

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H + 10}`} style={{ display: 'block', maxWidth: 380 }}>
      {/* Staff lines */}
      {LINE_Y.map((y, i) => (
        <line key={i} x1={startX} y1={y} x2={endX} y2={y} stroke={lineColor} strokeWidth={1.2} />
      ))}

      {/* Clef symbol */}
      {clef === 'treble' ? (
        <text x={10} y={76} fontSize={68} fontFamily="serif" fill="var(--text2)" style={{ userSelect: 'none' }}>𝄞</text>
      ) : (
        <text x={14} y={65} fontSize={46} fontFamily="serif" fill="var(--text2)" style={{ userSelect: 'none' }}>𝄢</text>
      )}

      {/* Ledger lines */}
      {ledgerLines.map((y, i) => (
        <line key={i} x1={noteX - 12} y1={y} x2={noteX + 12} y2={y} stroke={lineColor} strokeWidth={1.5} />
      ))}

      {/* Note circles */}
      {visibleNotes.map(n => (
        <g key={n.label} onClick={() => onNoteClick(n)} style={{ cursor: 'pointer' }}>
          <ellipse
            cx={noteX} cy={n.y} rx={7} ry={5.5}
            fill={noteColor(n)}
            opacity={showAll && n.label !== highlighted ? 0.55 : 1}
          />
          {showAll && (
            <text x={noteX + 11} y={n.y + 4} fontSize={10} fill={noteColor(n)} fontWeight="600" style={{ userSelect: 'none' }}>
              {n.display}
            </text>
          )}
        </g>
      ))}
    </svg>
  );
}

// ── Mnemonics card ─────────────────────────────────────────────────────────────

function MnemonicCard({ title, phrase, letters, color }: {
  title: string; phrase: string; letters: string[]; color: string;
}) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 8,
      background: `${color}0f`, border: `1px solid ${color}30`, marginBottom: 8,
    }}>
      <div style={{ fontSize: 11, color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', marginBottom: 8 }}>{phrase}</div>
      <div style={{ display: 'flex', gap: 5 }}>
        {letters.map((l, i) => (
          <div key={i} style={{
            width: 32, height: 32, borderRadius: 6, fontSize: 14, fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: color, color: '#0a0f1e',
          }}>{l}</div>
        ))}
      </div>
    </div>
  );
}

// ── Drill section ──────────────────────────────────────────────────────────────

// Notes used in the drill — main staff notes only (no ledger line notes for beginners)
const TREBLE_DRILL = TREBLE.filter(n => !n.isLedger && n.y >= 40 && n.y <= 80);
const BASS_DRILL   = BASS.filter(n => !n.isLedger && n.y >= 40 && n.y <= 80);
const ALL_LETTERS  = ['A', 'B', 'C', 'D', 'E', 'F', 'G'];

function pickRandom<T>(arr: T[], exclude?: T): T {
  const pool = exclude !== undefined ? arr.filter(x => x !== exclude) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

function generateChoices(correct: string): string[] {
  const others = ALL_LETTERS.filter(l => l !== correct);
  const picked = [others[0], others[1], others[2]]; // deterministic start — will be shuffled
  // shuffle all 4
  const all = [...picked, correct];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

function DrillSection({ color }: { color: string }) {
  const [clef, setClef] = useState<'treble' | 'bass'>('treble');
  const [note, setNote] = useState<StaffNote>(() => pickRandom(TREBLE_DRILL));
  const [choices, setChoices] = useState<string[]>(() => generateChoices(note.display));
  const [picked, setPicked] = useState<string | null>(null);
  const [answered, setAnswered] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  function nextNote(currentNote: StaffNote) {
    const pool = clef === 'treble' ? TREBLE_DRILL : BASS_DRILL;
    const next = pickRandom(pool, currentNote);
    setNote(next);
    setChoices(generateChoices(next.display));
    setPicked(null);
    setAnswered(false);
  }

  function handleClefChange(c: 'treble' | 'bass') {
    setClef(c);
    const pool = c === 'treble' ? TREBLE_DRILL : BASS_DRILL;
    const next = pickRandom(pool);
    setNote(next);
    setChoices(generateChoices(next.display));
    setPicked(null);
    setAnswered(false);
  }

  function handlePick(choice: string) {
    if (answered) return;
    setPicked(choice);
    setAnswered(true);
    playSingleNote(note.audioName);
    setScore(s => ({
      correct: s.correct + (choice === note.display ? 1 : 0),
      total: s.total + 1,
    }));
  }

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };

  return (
    <div style={card}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: 1 }}>Note drill</div>
        <div style={{ fontSize: 12, color: score.total === 0 ? 'var(--text3)' : score.correct / score.total >= 0.7 ? 'var(--green)' : 'var(--amber)' }}>
          {score.total > 0 ? `${score.correct} / ${score.total} correct` : 'Start identifying notes'}
        </div>
      </div>

      {/* Clef selector */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
        {(['treble', 'bass'] as const).map(c => (
          <button key={c} onClick={() => handleClefChange(c)} style={{
            padding: '4px 14px', borderRadius: 16, fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
            background: clef === c ? color : 'var(--surface2)',
            color: clef === c ? '#0a0f1e' : 'var(--text2)',
            border: `1px solid ${clef === c ? color : 'var(--border)'}`,
            fontWeight: clef === c ? 700 : 400,
          }}>
            {c.charAt(0).toUpperCase() + c.slice(1)} clef
          </button>
        ))}
      </div>

      {/* Staff with single note */}
      <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 4px', marginBottom: 12 }}>
        <StaffSVG
          clef={clef}
          notes={clef === 'treble' ? TREBLE : BASS}
          highlighted={note.label}
          onNoteClick={() => playSingleNote(note.audioName)}
          showAll={false}
        />
      </div>

      {/* Choices */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 10 }}>
        {choices.map(choice => {
          const isCorrect = choice === note.display;
          let bg = 'var(--surface2)', border = 'var(--border)', textColor = 'var(--text)';
          if (answered) {
            if (isCorrect) { bg = 'rgba(74,222,128,0.12)'; border = 'var(--green)'; textColor = 'var(--green)'; }
            else if (choice === picked) { bg = 'rgba(248,113,113,0.12)'; border = 'var(--red)'; textColor = 'var(--red)'; }
          }
          return (
            <button key={choice} onClick={() => handlePick(choice)} style={{
              padding: '12px', borderRadius: 8, fontSize: 18, fontWeight: 700, textAlign: 'center',
              background: bg, border: `1px solid ${border}`, color: textColor,
              cursor: answered ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
            }}>
              {choice}
            </button>
          );
        })}
      </div>

      {answered && (
        <div style={{
          padding: '10px 12px', borderRadius: 7, fontSize: 12, lineHeight: 1.6,
          color: 'var(--text2)', marginBottom: 10,
          background: picked === note.display ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
          border: `1px solid ${picked === note.display ? 'var(--green)' : 'var(--red)'}`,
        }}>
          <span style={{ fontWeight: 700, color: picked === note.display ? 'var(--green)' : 'var(--red)' }}>
            {picked === note.display ? 'Correct! ' : `It\'s ${note.display}. `}
          </span>
          {note.mnemonic}
        </div>
      )}

      {answered && (
        <button onClick={() => nextNote(note)} style={{
          width: '100%', padding: '10px', borderRadius: 8, fontSize: 13,
          background: color, color: '#0a0f1e',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
        }}>
          Next note →
        </button>
      )}
    </div>
  );
}

// ── Quick check ────────────────────────────────────────────────────────────────

const QUICK_CHECKS = [
  {
    question: 'Which mnemonic helps you remember the treble clef LINES (E G B D F)?',
    choices: ['FACE', 'All Cows Eat Grass', 'Every Good Boy Does Fine', 'Good Boys Do Fine Always'],
    answer: 'Every Good Boy Does Fine',
    explanation: 'E-G-B-D-F from bottom to top. "Every Good Boy Does Fine" gives you the first letter of each line note. FACE is for the spaces.',
  },
  {
    question: 'The first SPACE of the treble clef (from the bottom) is which note?',
    choices: ['E', 'F', 'G', 'A'],
    answer: 'F',
    explanation: 'The spaces spell FACE bottom to top: F-A-C-E. So the first (bottom) space is F4. The first LINE below it is E4.',
  },
  {
    question: 'Middle C appears on which staff position?',
    choices: [
      'The bottom line of the treble clef',
      'A ledger line below the treble clef',
      'The top line of the bass clef',
      'The middle line of both clefs',
    ],
    answer: 'A ledger line below the treble clef',
    explanation: 'Middle C (C4) sits on a short ledger line just below the treble clef staff. In bass clef it appears on a ledger line just above the staff. It\'s the note that connects both clefs in the grand staff.',
  },
];

// ── Main component ─────────────────────────────────────────────────────────────

type Section = 'treble' | 'bass' | 'grand' | 'drill';

interface Props {
  root: string;
  lessonId: string;
  color: string;
  onBack: () => void;
  onComplete: (id: string) => void;
}

export default function SightReadingLessonView({ lessonId, color, onBack, onComplete }: Props) {
  const [section, setSection] = useState<Section>('treble');
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const [checkIdx, setCheckIdx] = useState(0);
  const [checkPicked, setCheckPicked] = useState<string | null>(null);
  const [checkAnswered, setCheckAnswered] = useState(false);
  const [everCompleted, setEverCompleted] = useState(false);

  const handleNoteClick = useCallback((n: StaffNote) => {
    setHighlighted(h => h === n.label ? null : n.label);
    playSingleNote(n.audioName);
  }, []);

  const handleCheck = useCallback((choice: string) => {
    if (checkAnswered) return;
    setCheckPicked(choice);
    setCheckAnswered(true);
    if (choice === QUICK_CHECKS[checkIdx].answer && !everCompleted) {
      onComplete(lessonId);
      setEverCompleted(true);
    }
  }, [checkAnswered, checkIdx, everCompleted, lessonId, onComplete]);

  const nextQuestion = () => {
    setCheckIdx(i => i + 1);
    setCheckPicked(null);
    setCheckAnswered(false);
  };

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };
  const sLabel: React.CSSProperties = {
    fontSize: 11, color: 'var(--text3)', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 1,
  };

  const highlightedNote = section === 'treble'
    ? TREBLE.find(n => n.label === highlighted)
    : BASS.find(n => n.label === highlighted);

  const SECTIONS: { id: Section; label: string }[] = [
    { id: 'treble', label: 'Treble Clef' },
    { id: 'bass',   label: 'Bass Clef' },
    { id: 'grand',  label: 'Grand Staff' },
    { id: 'drill',  label: 'Drill' },
  ];

  const currentQ = QUICK_CHECKS[checkIdx];

  return (
    <div style={{ padding: '0 0 80px' }}>
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text3)', fontSize: 13, fontFamily: 'inherit', marginBottom: 10,
      }}>
        ← Back to lessons
      </button>

      <div style={{ ...card, borderLeft: `3px solid ${color}` }}>
        <div style={{ fontSize: 10, color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Fundamentals</div>
        <div style={{ fontSize: 20, fontWeight: 700, color }}>Notation & Sight-Reading</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Reading notes on the staff</div>
      </div>

      <div style={card}>
        <div style={sLabel}>What it is</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, margin: 0 }}>
          Musical notation places notes on a five-line staff. The position of a note — which line or space it sits on — tells you its pitch. The clef at the start of the staff tells you which lines mean which notes. Mnemonics make the note positions stick: learn them once and they stay forever.
        </p>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => { setSection(s.id); setHighlighted(null); }} style={{
            padding: '5px 12px', borderRadius: 16, fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
            background: section === s.id ? color : 'var(--surface2)',
            color: section === s.id ? '#0a0f1e' : 'var(--text2)',
            border: `1px solid ${section === s.id ? color : 'var(--border)'}`,
            fontWeight: section === s.id ? 700 : 400,
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── TREBLE CLEF ─────────────────────────────────────────────────────── */}
      {section === 'treble' && (
        <>
          <div style={{ ...card, borderLeft: `3px solid ${color}` }}>
            <div style={sLabel}>Click any note to hear it</div>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 4px', marginBottom: 10 }}>
              <StaffSVG clef="treble" notes={TREBLE} highlighted={highlighted} onNoteClick={handleNoteClick} showAll />
            </div>

            {highlightedNote ? (
              <div style={{
                padding: '10px 12px', borderRadius: 8,
                background: `${color}12`, border: `1px solid ${color}40`,
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color, marginBottom: 2 }}>{highlightedNote.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{highlightedNote.mnemonic}</div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', fontStyle: 'italic' }}>
                Blue = line notes · Purple = space notes · Tap any note
              </div>
            )}
          </div>

          <MnemonicCard
            title="Lines (bottom to top): E G B D F"
            phrase='"Every Good Boy Does Fine"'
            letters={['E','G','B','D','F']}
            color="#4d9ef7"
          />
          <MnemonicCard
            title="Spaces (bottom to top): F A C E"
            phrase='"FACE — the spaces spell a word"'
            letters={['F','A','C','E']}
            color="#a78bfa"
          />
          <div style={{ ...card, background: '#22d3ee0f', borderColor: '#22d3ee30' }}>
            <div style={{ fontSize: 11, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Middle C</div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
              Middle C sits on a short ledger line just below the treble clef staff. It is the reference note for the whole piano — 4th C from the left on a standard 88-key keyboard.
            </p>
          </div>
        </>
      )}

      {/* ── BASS CLEF ───────────────────────────────────────────────────────── */}
      {section === 'bass' && (
        <>
          <div style={{ ...card, borderLeft: `3px solid ${color}` }}>
            <div style={sLabel}>Click any note to hear it</div>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 4px', marginBottom: 10 }}>
              <StaffSVG clef="bass" notes={BASS} highlighted={highlighted} onNoteClick={handleNoteClick} showAll />
            </div>

            {highlightedNote ? (
              <div style={{
                padding: '10px 12px', borderRadius: 8,
                background: `${color}12`, border: `1px solid ${color}40`,
              }}>
                <div style={{ fontSize: 15, fontWeight: 700, color, marginBottom: 2 }}>{highlightedNote.label}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{highlightedNote.mnemonic}</div>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', fontStyle: 'italic' }}>
                Blue = line notes · Purple = space notes · Tap any note
              </div>
            )}
          </div>

          <MnemonicCard
            title="Lines (bottom to top): G B D F A"
            phrase='"Good Boys Do Fine Always"'
            letters={['G','B','D','F','A']}
            color="#4d9ef7"
          />
          <MnemonicCard
            title="Spaces (bottom to top): A C E G"
            phrase='"All Cows Eat Grass"'
            letters={['A','C','E','G']}
            color="#a78bfa"
          />
          <div style={{ ...card, background: '#22d3ee0f', borderColor: '#22d3ee30' }}>
            <div style={{ fontSize: 11, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Bass clef range</div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
              The bass clef covers the lower register — G2 on the bottom line to A3 on the top line. Middle C (C4) appears on a ledger line just above the bass staff. Bass clef is used for left-hand piano, cello, bass guitar, and tuba.
            </p>
          </div>
        </>
      )}

      {/* ── GRAND STAFF ─────────────────────────────────────────────────────── */}
      {section === 'grand' && (
        <>
          <div style={card}>
            <div style={sLabel}>Treble + Bass together</div>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 4px', marginBottom: 10 }}>
              <StaffSVG clef="treble" notes={TREBLE} highlighted={null} onNoteClick={() => {}} showAll />
            </div>
            <div style={{
              textAlign: 'center', fontSize: 11, color: '#22d3ee', fontWeight: 700,
              padding: '4px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)',
              marginBottom: 10,
            }}>
              ─── Middle C (C4) — connects both staves ───
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '8px 4px' }}>
              <StaffSVG clef="bass" notes={BASS} highlighted={null} onNoteClick={() => {}} showAll />
            </div>
          </div>

          <div style={{ ...card, background: `${color}0f`, borderColor: `${color}40` }}>
            <div style={{ fontSize: 11, color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>How it works</div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: '0 0 8px' }}>
              The grand staff combines treble and bass into one system with a brace on the left. The right hand (higher notes) reads the treble clef. The left hand (lower notes) reads the bass clef. Middle C is the bridge between the two — it appears on a ledger line below the treble staff and on a ledger line above the bass staff.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
              When you read piano music, your eyes track both staves simultaneously — treble for melody, bass for accompaniment and harmony.
            </p>
          </div>

          <div style={card}>
            <div style={sLabel}>Register comparison</div>
            {[
              { range: 'C4 and above', clef: 'Treble clef (right hand)', color: '#4d9ef7' },
              { range: 'C4 (Middle C)', clef: 'Ledger line on either staff', color: '#22d3ee' },
              { range: 'B3 and below', clef: 'Bass clef (left hand)', color: '#a78bfa' },
            ].map((r, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: 7, marginBottom: 6,
                background: 'var(--surface2)', border: `1px solid ${r.color}40`,
              }}>
                <span style={{ fontSize: 12, color: r.color, fontWeight: 700 }}>{r.range}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{r.clef}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* ── DRILL ───────────────────────────────────────────────────────────── */}
      {section === 'drill' && <DrillSection color={color} />}

      {/* ── QUICK CHECK ─────────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={sLabel}>Quick check</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{checkIdx + 1} / {QUICK_CHECKS.length}</div>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 10, lineHeight: 1.5 }}>{currentQ.question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {currentQ.choices.map((choice, i) => {
            const isCorrect = choice === currentQ.answer;
            let bg = 'var(--surface2)', border = 'var(--border)', textColor = 'var(--text)';
            if (checkAnswered) {
              if (isCorrect) { bg = 'rgba(74,222,128,0.12)'; border = 'var(--green)'; textColor = 'var(--green)'; }
              else if (choice === checkPicked) { bg = 'rgba(248,113,113,0.12)'; border = 'var(--red)'; textColor = 'var(--red)'; }
            }
            return (
              <button key={i} onClick={() => handleCheck(choice)} style={{
                padding: '10px 12px', borderRadius: 7, fontSize: 13, textAlign: 'left',
                background: bg, border: `1px solid ${border}`, color: textColor,
                cursor: checkAnswered ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}>
                {choice}
              </button>
            );
          })}
        </div>
        {checkAnswered && (
          <>
            <div style={{
              marginTop: 10, padding: '10px 12px', borderRadius: 7, fontSize: 12, lineHeight: 1.6, color: 'var(--text2)',
              background: checkPicked === currentQ.answer ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
              border: `1px solid ${checkPicked === currentQ.answer ? 'var(--green)' : 'var(--red)'}`,
            }}>
              <span style={{ fontWeight: 700, color: checkPicked === currentQ.answer ? 'var(--green)' : 'var(--red)' }}>
                {checkPicked === currentQ.answer ? 'Correct! ' : `Answer: ${currentQ.answer}. `}
              </span>
              {currentQ.explanation}
            </div>
            {checkIdx < QUICK_CHECKS.length - 1 && (
              <button onClick={nextQuestion} style={{
                marginTop: 10, width: '100%', padding: '10px', borderRadius: 8, fontSize: 13,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Next question →
              </button>
            )}
            {checkIdx === QUICK_CHECKS.length - 1 && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--green)', textAlign: 'center' }}>
                Lesson complete — use the Drill tab to keep practising.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
