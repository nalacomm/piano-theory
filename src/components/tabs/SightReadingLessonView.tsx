'use client';
import { useState, useCallback } from 'react';
import { playSingleNote } from '@/lib/audio';

// ── Staff data ─────────────────────────────────────────────────────────────────
// Staff lines at Y = 80 (line 1, bottom) → 40 (line 5, top), 10px spacing

interface StaffNote {
  label: string;   // "E4" — unique key
  display: string; // "E" — single letter
  y: number;
  isLine: boolean;
  isLedger?: boolean;
  ledgerY?: number;
  mnemonic: string;
  audioName: string;
}

const TREBLE: StaffNote[] = [
  { label: 'C4', display: 'C', y: 90, isLine: true,  isLedger: true, ledgerY: 90, audioName: 'C', mnemonic: 'Ledger line below the staff — Middle C' },
  { label: 'D4', display: 'D', y: 85, isLine: false,                              audioName: 'D', mnemonic: 'Space below the staff' },
  { label: 'E4', display: 'E', y: 80, isLine: true,                               audioName: 'E', mnemonic: 'Line 1 — Every (Good Boy Does Fine)' },
  { label: 'F4', display: 'F', y: 75, isLine: false,                              audioName: 'F', mnemonic: 'Space 1 — (F)ACE' },
  { label: 'G4', display: 'G', y: 70, isLine: true,                               audioName: 'G', mnemonic: 'Line 2 — Every (G)ood Boy Does Fine' },
  { label: 'A4', display: 'A', y: 65, isLine: false,                              audioName: 'A', mnemonic: 'Space 2 — F(A)CE' },
  { label: 'B4', display: 'B', y: 60, isLine: true,                               audioName: 'B', mnemonic: 'Line 3 — Every Good (B)oy Does Fine' },
  { label: 'C5', display: 'C', y: 55, isLine: false,                              audioName: 'C', mnemonic: 'Space 3 — FA(C)E' },
  { label: 'D5', display: 'D', y: 50, isLine: true,                               audioName: 'D', mnemonic: 'Line 4 — Every Good Boy (D)oes Fine' },
  { label: 'E5', display: 'E', y: 45, isLine: false,                              audioName: 'E', mnemonic: 'Space 4 — FAC(E)' },
  { label: 'F5', display: 'F', y: 40, isLine: true,                               audioName: 'F', mnemonic: 'Line 5 — Every Good Boy Does (F)ine' },
  { label: 'G5', display: 'G', y: 35, isLine: false,                              audioName: 'G', mnemonic: 'Space above the staff' },
];

const BASS: StaffNote[] = [
  { label: 'G2', display: 'G', y: 80, isLine: true,                               audioName: 'G', mnemonic: 'Line 1 — (G)ood Boys Do Fine Always' },
  { label: 'A2', display: 'A', y: 75, isLine: false,                              audioName: 'A', mnemonic: 'Space 1 — (A)ll Cows Eat Grass' },
  { label: 'B2', display: 'B', y: 70, isLine: true,                               audioName: 'B', mnemonic: 'Line 2 — Good (B)oys Do Fine Always' },
  { label: 'C3', display: 'C', y: 65, isLine: false,                              audioName: 'C', mnemonic: 'Space 2 — All (C)ows Eat Grass' },
  { label: 'D3', display: 'D', y: 60, isLine: true,                               audioName: 'D', mnemonic: 'Line 3 — Good Boys (D)o Fine Always' },
  { label: 'E3', display: 'E', y: 55, isLine: false,                              audioName: 'E', mnemonic: 'Space 3 — All Cows (E)at Grass' },
  { label: 'F3', display: 'F', y: 50, isLine: true,                               audioName: 'F', mnemonic: 'Line 4 — Good Boys Do (F)ine Always' },
  { label: 'G3', display: 'G', y: 45, isLine: false,                              audioName: 'G', mnemonic: 'Space 4 — All Cows Eat (G)rass' },
  { label: 'A3', display: 'A', y: 40, isLine: true,                               audioName: 'A', mnemonic: 'Line 5 — Good Boys Do Fine (A)lways' },
  { label: 'B3', display: 'B', y: 35, isLine: false,                              audioName: 'B', mnemonic: 'Space above the staff' },
  { label: 'C4', display: 'C', y: 30, isLine: true, isLedger: true, ledgerY: 30, audioName: 'C', mnemonic: 'Ledger line above the staff — Middle C' },
];

// ── Staff SVG ──────────────────────────────────────────────────────────────────

type NoteFilter = 'lines' | 'spaces' | 'all';

function getFiltered(notes: StaffNote[], filter: NoteFilter): StaffNote[] {
  if (filter === 'lines')  return notes.filter(n => n.isLine && !n.isLedger);
  if (filter === 'spaces') return notes.filter(n => !n.isLine && !n.isLedger && n.y >= 40 && n.y <= 80);
  return notes;
}

function StaffSVG({
  clef, notes, highlighted, onNoteClick, filter = 'all', drillNote,
}: {
  clef: 'treble' | 'bass';
  notes: StaffNote[];
  highlighted?: string | null;
  onNoteClick: (n: StaffNote) => void;
  filter?: NoteFilter;
  drillNote?: string | null;
}) {
  const W = 360, H = 108;
  const NX0 = 65, NX1 = 348;

  const visible: StaffNote[] = drillNote
    ? notes.filter(n => n.label === drillNote)
    : getFiltered(notes, filter);

  const xs = visible.map((_, i) =>
    visible.length === 1 ? (NX0 + NX1) / 2 : NX0 + i * (NX1 - NX0) / (visible.length - 1)
  );

  const rx = visible.length <= 5 ? 10 : visible.length <= 8 ? 8 : 7;
  const ry = visible.length <= 5 ?  7 : visible.length <= 8 ? 6 : 5.5;
  const fs = visible.length <= 5 ? 10 : 9;

  function noteCol(n: StaffNote): string {
    if (n.label === highlighted) return '#facc15';
    if (n.isLedger) return '#22d3ee';
    return n.isLine ? '#4d9ef7' : '#a78bfa';
  }

  const ledgers = visible
    .map((n, i) => n.isLedger && n.ledgerY != null ? { x: xs[i], y: n.ledgerY! } : null)
    .filter(Boolean) as { x: number; y: number }[];

  const anyHighlighted = highlighted != null && !drillNote;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ display: 'block', maxWidth: 400 }}>
      {[80, 70, 60, 50, 40].map((y, i) => (
        <line key={i} x1={42} y1={y} x2={W - 4} y2={y} stroke="var(--text3)" strokeWidth={1.2} />
      ))}
      {clef === 'treble'
        ? <text x={6}  y={76} fontSize={64} fontFamily="serif" fill="var(--text2)" style={{ userSelect: 'none' }}>𝄞</text>
        : <text x={11} y={65} fontSize={44} fontFamily="serif" fill="var(--text2)" style={{ userSelect: 'none' }}>𝄢</text>
      }
      {ledgers.map((l, i) => (
        <line key={i} x1={l.x - rx - 6} y1={l.y} x2={l.x + rx + 6} y2={l.y} stroke="var(--text3)" strokeWidth={1.5} />
      ))}
      {visible.map((n, i) => {
        const x = xs[i];
        const col = noteCol(n);
        const dim = anyHighlighted && n.label !== highlighted;
        return (
          <g key={n.label} onClick={() => onNoteClick(n)} style={{ cursor: drillNote ? 'default' : 'pointer' }}>
            <ellipse cx={x} cy={n.y} rx={rx} ry={ry} fill={col} opacity={dim ? 0.3 : 0.9} />
            {!drillNote && (
              <text x={x} y={n.y + fs * 0.38} textAnchor="middle" fontSize={fs} fontWeight="700"
                fill="#0a0f1e" opacity={dim ? 0.3 : 1}
                style={{ userSelect: 'none', pointerEvents: 'none' }}>
                {n.display}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

// ── Mnemonic card ──────────────────────────────────────────────────────────────

function MnemonicCard({ title, phrase, letters, color }: {
  title: string; phrase: string; letters: string[]; color: string;
}) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 8, marginBottom: 8,
      background: `${color}0f`, border: `1px solid ${color}30`,
    }}>
      <div style={{ fontSize: 11, color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text2)', fontStyle: 'italic', marginBottom: 8 }}>{phrase}</div>
      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
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

// ── Clef section ───────────────────────────────────────────────────────────────

function ClefSection({ clef, notes, color }: { clef: 'treble' | 'bass'; notes: StaffNote[]; color: string }) {
  const [filter,      setFilter]      = useState<NoteFilter>('lines');
  const [highlighted, setHighlighted] = useState<string | null>(null);

  const handleNoteClick = useCallback((n: StaffNote) => {
    setHighlighted(h => (h === n.label ? null : n.label));
    playSingleNote(n.audioName);
  }, []);

  const highlightedNote = notes.find(n => n.label === highlighted);
  const isTreble = clef === 'treble';

  const lineMnemo = isTreble
    ? { title: 'Lines: E G B D F', phrase: '"Every Good Boy Does Fine"', letters: ['E','G','B','D','F'], color: '#4d9ef7' }
    : { title: 'Lines: G B D F A', phrase: '"Good Boys Do Fine Always"', letters: ['G','B','D','F','A'], color: '#4d9ef7' };
  const spaceMnemo = isTreble
    ? { title: 'Spaces: F A C E', phrase: '"FACE — the spaces spell a word"', letters: ['F','A','C','E'], color: '#a78bfa' }
    : { title: 'Spaces: A C E G', phrase: '"All Cows Eat Grass"', letters: ['A','C','E','G'], color: '#a78bfa' };

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };

  return (
    <>
      <div style={card}>
        <div style={{ display: 'flex', gap: 5, marginBottom: 10 }}>
          {(['lines', 'spaces', 'all'] as NoteFilter[]).map(f => (
            <button key={f} onClick={() => { setFilter(f); setHighlighted(null); }} style={{
              padding: '4px 11px', borderRadius: 14, fontSize: 11,
              cursor: 'pointer', fontFamily: 'inherit',
              background: filter === f ? color : 'var(--surface2)',
              color: filter === f ? '#0a0f1e' : 'var(--text3)',
              border: `1px solid ${filter === f ? color : 'var(--border)'}`,
              fontWeight: filter === f ? 700 : 400,
            }}>
              {f === 'lines' ? 'Lines only' : f === 'spaces' ? 'Spaces only' : 'All notes'}
            </button>
          ))}
        </div>

        <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '6px 4px', marginBottom: 10 }}>
          <StaffSVG clef={clef} notes={notes} highlighted={highlighted} onNoteClick={handleNoteClick} filter={filter} />
        </div>

        {highlightedNote ? (
          <div style={{ padding: '10px 12px', borderRadius: 8, background: `${color}12`, border: `1px solid ${color}40` }}>
            <div style={{ fontSize: 15, fontWeight: 700, color, marginBottom: 2 }}>{highlightedNote.label}</div>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>{highlightedNote.mnemonic}</div>
          </div>
        ) : (
          <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'center' }}>
            {filter === 'lines'  ? 'Blue = line notes · click to hear and learn'  :
             filter === 'spaces' ? 'Purple = space notes · click to hear and learn' :
             'Blue = lines · Purple = spaces · Teal = ledger · Click any note'}
          </div>
        )}
      </div>

      {(filter === 'lines'  || filter === 'all') && <MnemonicCard {...lineMnemo}  />}
      {(filter === 'spaces' || filter === 'all') && <MnemonicCard {...spaceMnemo} />}

      <div style={{ ...card, background: '#22d3ee0f', borderColor: '#22d3ee30' }}>
        <div style={{ fontSize: 11, color: '#22d3ee', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>Middle C</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
          {isTreble
            ? 'Middle C (C4) sits on a ledger line just below the treble staff. Switch to "All notes" to see it — it is the teal note at the bottom.'
            : 'Middle C (C4) sits on a ledger line just above the bass staff. Switch to "All notes" to see it — teal note at the top.'
          }
        </p>
      </div>
    </>
  );
}

// ── Drill ──────────────────────────────────────────────────────────────────────

const TREBLE_DRILL = TREBLE.filter(n => !n.isLedger && n.y >= 40 && n.y <= 80);
const BASS_DRILL   = BASS.filter(n => !n.isLedger && n.y >= 40 && n.y <= 80);
const ALL_LETTERS  = ['A','B','C','D','E','F','G'];

function pick<T>(arr: T[], exclude?: T): T {
  const pool = exclude !== undefined ? arr.filter(x => x !== exclude) : arr;
  return pool[Math.floor(Math.random() * pool.length)];
}

function makeChoices(correct: string): string[] {
  const others = ALL_LETTERS.filter(l => l !== correct);
  for (let i = others.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [others[i], others[j]] = [others[j], others[i]];
  }
  const all = [...others.slice(0, 3), correct];
  for (let i = all.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [all[i], all[j]] = [all[j], all[i]];
  }
  return all;
}

function DrillSection({ color }: { color: string }) {
  const [clef,       setClef]       = useState<'treble' | 'bass'>('treble');
  const [note,       setNote]       = useState<StaffNote>(() => pick(TREBLE_DRILL));
  const [choices,    setChoices]    = useState<string[]>(() => makeChoices(note.display));
  const [picked,     setPicked]     = useState<string | null>(null);
  const [answered,   setAnswered]   = useState(false);
  const [score,      setScore]      = useState({ correct: 0, total: 0 });
  const [streak,     setStreak]     = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  function advance(fromNote: StaffNote, toClef: 'treble' | 'bass') {
    const pool = toClef === 'treble' ? TREBLE_DRILL : BASS_DRILL;
    const next = pick(pool, fromNote);
    setNote(next);
    setChoices(makeChoices(next.display));
    setPicked(null);
    setAnswered(false);
  }

  function changeClef(c: 'treble' | 'bass') { setClef(c); advance(note, c); }

  function handlePick(choice: string) {
    if (answered) return;
    const right = choice === note.display;
    setPicked(choice);
    setAnswered(true);
    playSingleNote(note.audioName);
    const ns = right ? streak + 1 : 0;
    setStreak(ns);
    setBestStreak(b => Math.max(b, ns));
    setScore(s => ({ correct: s.correct + (right ? 1 : 0), total: s.total + 1 }));
  }

  const pct = score.total > 0 ? Math.round((score.correct / score.total) * 100) : null;

  return (
    <div style={{
      background: 'var(--surface)', border: '1px solid var(--border)',
      borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 5 }}>
          {(['treble','bass'] as const).map(c => (
            <button key={c} onClick={() => changeClef(c)} style={{
              padding: '4px 12px', borderRadius: 14, fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
              background: clef === c ? color : 'var(--surface2)',
              color: clef === c ? '#0a0f1e' : 'var(--text3)',
              border: `1px solid ${clef === c ? color : 'var(--border)'}`,
              fontWeight: clef === c ? 700 : 400,
            }}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', fontSize: 12 }}>
          {streak >= 3 && <span style={{ color: '#facc15', fontSize: 11 }}>streak {streak}</span>}
          {score.total > 0 && (
            <span style={{ color: pct! >= 70 ? 'var(--green)' : 'var(--amber)' }}>
              {score.correct}/{score.total}
            </span>
          )}
        </div>
      </div>

      <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '6px 4px', marginBottom: 10 }}>
        <StaffSVG clef={clef} notes={clef === 'treble' ? TREBLE : BASS} onNoteClick={() => {}} drillNote={note.label} />
      </div>

      <div style={{ fontSize: 12, color: 'var(--text3)', textAlign: 'center', marginBottom: 10 }}>
        What note is this?
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 10 }}>
        {choices.map(choice => {
          const isRight = choice === note.display;
          let bg = 'var(--surface2)', border = 'var(--border)', textColor = 'var(--text)';
          if (answered) {
            if (isRight)              { bg = 'rgba(74,222,128,0.14)'; border = 'var(--green)'; textColor = 'var(--green)'; }
            else if (choice === picked){ bg = 'rgba(248,113,113,0.14)'; border = 'var(--red)';  textColor = 'var(--red)'; }
          }
          return (
            <button key={choice} onClick={() => handlePick(choice)} style={{
              padding: '14px', borderRadius: 8, fontSize: 20, fontWeight: 700, textAlign: 'center',
              background: bg, border: `1px solid ${border}`, color: textColor,
              cursor: answered ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.1s',
            }}>
              {choice}
            </button>
          );
        })}
      </div>

      {answered && (
        <>
          <div style={{
            padding: '9px 12px', borderRadius: 7, fontSize: 12, lineHeight: 1.6, color: 'var(--text2)', marginBottom: 10,
            background: picked === note.display ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${picked === note.display ? 'var(--green)' : 'var(--red)'}`,
          }}>
            <span style={{ fontWeight: 700, color: picked === note.display ? 'var(--green)' : 'var(--red)' }}>
              {picked === note.display ? 'Correct! ' : `It\'s ${note.display}. `}
            </span>
            {note.mnemonic}
          </div>
          <button onClick={() => advance(note, clef)} style={{
            width: '100%', padding: '11px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            background: color, color: '#0a0f1e', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Next note →
          </button>
        </>
      )}
      {bestStreak >= 5 && (
        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
          Best streak: {bestStreak}
        </div>
      )}
    </div>
  );
}

// ── Quick check ────────────────────────────────────────────────────────────────

const QUICK_CHECKS = [
  {
    question: 'Which mnemonic helps you remember the treble clef LINE notes (E G B D F)?',
    choices: ['FACE', 'All Cows Eat Grass', 'Every Good Boy Does Fine', 'Good Boys Do Fine Always'],
    answer: 'Every Good Boy Does Fine',
    explanation: 'Lines from bottom to top: E-G-B-D-F. "Every Good Boy Does Fine" gives the first letter of each line note. FACE is for the spaces.',
  },
  {
    question: 'The first SPACE of the treble clef (from the bottom) is which note?',
    choices: ['E', 'F', 'G', 'A'],
    answer: 'F',
    explanation: 'Spaces spell FACE bottom to top: F-A-C-E. First (bottom) space = F4. The line just below it is E4.',
  },
  {
    question: 'Middle C (C4) appears where on the staff?',
    choices: ['Bottom line of the treble clef', 'A ledger line below the treble clef', 'Top line of the bass clef', 'Middle line of the bass clef'],
    answer: 'A ledger line below the treble clef',
    explanation: 'Middle C sits on a short ledger line just below the treble staff. In bass clef it sits on a ledger line just above the staff. It connects both staves in the grand staff.',
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
  const [section,       setSection]      = useState<Section>('treble');
  const [checkIdx,      setCheckIdx]     = useState(0);
  const [checkPicked,   setCheckPicked]  = useState<string | null>(null);
  const [checkAnswered, setCheckAnswered]= useState(false);
  const [everDone,      setEverDone]     = useState(false);

  const handleCheck = useCallback((choice: string) => {
    if (checkAnswered) return;
    setCheckPicked(choice);
    setCheckAnswered(true);
    if (choice === QUICK_CHECKS[checkIdx].answer && !everDone) {
      onComplete(lessonId);
      setEverDone(true);
    }
  }, [checkAnswered, checkIdx, everDone, lessonId, onComplete]);

  const nextQ = () => { setCheckIdx(i => i + 1); setCheckPicked(null); setCheckAnswered(false); };

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };
  const sLabel: React.CSSProperties = { fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 };

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
          Musical notation places notes on a five-line staff. Position tells you pitch. The clef at the start tells you which lines mean which notes. Use the Drill tab to practice — try to build a streak of 5 or more correct in a row.
        </p>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
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

      {section === 'treble' && <ClefSection clef="treble" notes={TREBLE} color={color} />}
      {section === 'bass'   && <ClefSection clef="bass"   notes={BASS}   color={color} />}

      {section === 'grand' && (
        <>
          <div style={card}>
            <div style={sLabel}>Treble + Bass together</div>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '6px 4px', marginBottom: 8 }}>
              <StaffSVG clef="treble" notes={TREBLE} onNoteClick={() => {}} filter="all" />
            </div>
            <div style={{
              textAlign: 'center', fontSize: 11, color: '#22d3ee', fontWeight: 700,
              padding: '5px 0', borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', marginBottom: 8,
            }}>
              ─── Middle C (C4) ───
            </div>
            <div style={{ background: 'var(--surface2)', borderRadius: 8, padding: '6px 4px' }}>
              <StaffSVG clef="bass" notes={BASS} onNoteClick={() => {}} filter="all" />
            </div>
          </div>
          <div style={{ ...card, background: `${color}0f`, borderColor: `${color}40` }}>
            <div style={{ fontSize: 11, color, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>How it works</div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: '0 0 10px' }}>
              Right hand reads treble (C4 and above). Left hand reads bass (B3 and below). Middle C is the bridge — it sits on a ledger line just below treble and just above bass.
            </p>
            {[
              { range: 'C4 and above', desc: 'Treble clef · right hand', c: '#4d9ef7' },
              { range: 'Middle C (C4)', desc: 'Ledger line on either staff', c: '#22d3ee' },
              { range: 'B3 and below', desc: 'Bass clef · left hand', c: '#a78bfa' },
            ].map((r, i) => (
              <div key={i} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '8px 10px', borderRadius: 7, marginBottom: 5,
                background: 'var(--surface2)', border: `1px solid ${r.c}40`,
              }}>
                <span style={{ fontSize: 12, color: r.c, fontWeight: 700 }}>{r.range}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{r.desc}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {section === 'drill' && <DrillSection color={color} />}

      {/* Quick check */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={sLabel}>Quick check</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{checkIdx + 1} / {QUICK_CHECKS.length}</div>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 10, lineHeight: 1.5 }}>{currentQ.question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {currentQ.choices.map((choice, i) => {
            const isRight = choice === currentQ.answer;
            let bg = 'var(--surface2)', border = 'var(--border)', textColor = 'var(--text)';
            if (checkAnswered) {
              if (isRight)                   { bg = 'rgba(74,222,128,0.12)'; border = 'var(--green)'; textColor = 'var(--green)'; }
              else if (choice === checkPicked){ bg = 'rgba(248,113,113,0.12)'; border = 'var(--red)';  textColor = 'var(--red)'; }
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
            {checkIdx < QUICK_CHECKS.length - 1 ? (
              <button onClick={nextQ} style={{
                marginTop: 10, width: '100%', padding: '10px', borderRadius: 8, fontSize: 13,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Next question →
              </button>
            ) : (
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
