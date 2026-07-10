'use client';
import { useState, useCallback } from 'react';
import { NOTES } from '@/lib/theory';
import { playChordTogether, playChordArp } from '@/lib/audio';
import PianoKeys from '@/components/ui/PianoKeys';
import SheetMusic from '@/components/ui/SheetMusic';

type TriadKey = 'major' | 'minor' | 'dim' | 'aug';
type SeventhKey = 'maj7' | 'dom7' | 'min7';

const TRIAD_TYPES: Record<TriadKey, { label: string; intervals: number[]; color: string; symbol: string }> = {
  major: { label: 'Major',      intervals: [0, 4, 7], color: '#4ade80', symbol: '' },
  minor: { label: 'Minor',      intervals: [0, 3, 7], color: '#818cf8', symbol: 'm' },
  dim:   { label: 'Diminished', intervals: [0, 3, 6], color: '#f87171', symbol: '°' },
  aug:   { label: 'Augmented',  intervals: [0, 4, 8], color: '#f97316', symbol: '+' },
};

const SEVENTH_TYPES: Record<SeventhKey, { label: string; intervals: number[]; color: string; symbol: string }> = {
  maj7: { label: 'Major 7',    intervals: [0, 4, 7, 11], color: '#4ade80', symbol: 'maj7' },
  dom7: { label: 'Dominant 7', intervals: [0, 4, 7, 10], color: '#facc15', symbol: '7' },
  min7: { label: 'Minor 7',    intervals: [0, 3, 7, 10],  color: '#818cf8', symbol: 'm7' },
};

const TRIAD_INV = [
  {
    label: 'Root Position',
    short: 'Root',
    bassIs: 'Root (1)',
    fact: 'Root in the bass. Most stable and resonant voicing. The 3rd and 5th stack above it.',
    usage: 'Default for any chord. Strong downbeats, final cadences, chord blocks.',
  },
  {
    label: '1st Inversion',
    short: '1st',
    bassIs: '3rd',
    fact: 'The 3rd sits in the bass. Lighter feel than root position — less final. Allows smooth stepwise bass motion.',
    usage: 'Passing chords, smooth bass lines. I - I⁶ descending bass patterns.',
  },
  {
    label: '2nd Inversion',
    short: '2nd',
    bassIs: '5th',
    fact: 'The 5th in the bass — most unstable triad inversion. Typically needs to resolve.',
    usage: 'Cadential ⁶⁄₄ (I → V → I). Pedal bass and passing figures.',
  },
];

const SEVENTH_INV = [
  {
    label: 'Root Position',
    short: 'Root',
    bassIs: 'Root (1)',
    fact: 'Root in the bass with all four chord tones stacking above. Standard 7th chord voicing.',
    usage: 'V7 root position = strongest dominant pull. Common everywhere.',
  },
  {
    label: '1st Inversion',
    short: '1st',
    bassIs: '3rd',
    fact: '3rd in the bass. Softer and smoother than root position. Maintains forward motion in the bass line.',
    usage: 'Smooth voice leading. ii⁶⁵ → V is a classic jazz progression.',
  },
  {
    label: '2nd Inversion',
    short: '2nd',
    bassIs: '5th',
    fact: '5th in the bass. More dissonant than 1st inversion. Used as a passing chord in moving bass lines.',
    usage: 'Passing chord in bass lines. V⁴³ with descending bass.',
  },
  {
    label: '3rd Inversion',
    short: '3rd',
    bassIs: '7th',
    fact: 'The 7th sits in the bass — strongest sense of motion. The 7th wants to resolve down by step.',
    usage: 'V²₄ (dom 7, 3rd inv) resolves to I⁶. Creates a driving bass line with maximum pull.',
  },
];

interface CheckQ { question: string; choices: string[]; answer: string; explanation: string }

const TRIAD_CHECKS: CheckQ[] = [
  {
    question: 'Which inversion places the 5th of the chord in the bass?',
    choices: ['Root Position', '1st Inversion', '2nd Inversion'],
    answer: '2nd Inversion',
    explanation: '2nd inversion = 5th in the bass. It\'s the most unstable triad position and typically resolves — most commonly as a cadential ⁶⁄₄ before the V chord.',
  },
  {
    question: 'In a C major chord, 1st inversion puts which note in the bass?',
    choices: ['C', 'E', 'G', 'B'],
    answer: 'E',
    explanation: 'C major = C-E-G. 1st inversion puts the 3rd (E) in the bass. Use the piano explorer above: select Major, set inversion to 1st, root C — the green key shows E.',
  },
  {
    question: 'Root position sounds the most stable because?',
    choices: [
      'It has the most notes',
      'The 5th is in the bass',
      'The root in the bass provides the strongest foundation',
      'It only works for major chords',
    ],
    answer: 'The root in the bass provides the strongest foundation',
    explanation: 'When the root is lowest, the chord sounds fully grounded and resolved. Inversions create motion and variety but are inherently less stable.',
  },
];

const SEVENTH_CHECKS: CheckQ[] = [
  {
    question: 'A 7th chord in 3rd inversion has which note in the bass?',
    choices: ['Root', '3rd', '5th', '7th'],
    answer: '7th',
    explanation: '3rd inversion places the 7th in the bass. It creates the strongest pull because the 7th degree wants to resolve down by step — strongest motion of any 7th chord inversion.',
  },
  {
    question: 'G dominant 7 (G-B-D-F) in 1st inversion — what is the bass note?',
    choices: ['G', 'B', 'D', 'F'],
    answer: 'B',
    explanation: '1st inversion always puts the 3rd in the bass. G dom7 = G-B-D-F. The 3rd is B. Try it: select Dominant 7, set root to G, choose 1st inversion — the green key is B.',
  },
  {
    question: 'How many inversions does a 7th chord have (including root position)?',
    choices: ['2', '3', '4', '5'],
    answer: '4',
    explanation: 'A 7th chord has 4 notes: root, 3rd, 5th, 7th. Each can be in the bass, giving 4 positions — root position plus 1st, 2nd, and 3rd inversion.',
  },
];

interface Props {
  root: string;
  lessonId: string;
  inversionType: 'triads' | 'sevenths';
  color: string;
  onBack: () => void;
  onComplete: (id: string) => void;
}

export default function InversionLessonView({ root, lessonId, inversionType, color, onBack, onComplete }: Props) {
  const isTriads = inversionType === 'triads';

  const [chordType, setChordType] = useState<TriadKey | SeventhKey>(isTriads ? 'major' : 'maj7');
  const [inversion, setInversion] = useState(0);
  const [checkIdx, setCheckIdx] = useState(0);
  const [checkPicked, setCheckPicked] = useState<string | null>(null);
  const [checkAnswered, setCheckAnswered] = useState(false);
  const [everCompleted, setEverCompleted] = useState(false);

  const chordDef = isTriads
    ? TRIAD_TYPES[chordType as TriadKey]
    : SEVENTH_TYPES[chordType as SeventhKey];

  const invData = isTriads ? TRIAD_INV : SEVENTH_INV;
  const maxInv = chordDef.intervals.length - 1;
  const clampedInv = Math.min(inversion, maxInv);
  const currentInv = invData[clampedInv];

  const rootIdx = NOTES.indexOf(root as typeof NOTES[number]);
  const bassInterval = chordDef.intervals[clampedInv];
  const bassNoteIdx = (rootIdx + bassInterval) % 12;
  const highlightedNotes = chordDef.intervals.map(i => (rootIdx + i) % 12);

  const rotatedIntervals = [
    ...chordDef.intervals.slice(clampedInv),
    ...chordDef.intervals.slice(0, clampedInv),
  ];
  const noteNamesInOrder = rotatedIntervals.map(i => NOTES[(rootIdx + i) % 12]);

  const handlePlay = useCallback(() => {
    playChordTogether(noteNamesInOrder);
  }, [noteNamesInOrder]);

  const handleArp = useCallback(() => {
    playChordArp(noteNamesInOrder);
  }, [noteNamesInOrder]);

  const checks = isTriads ? TRIAD_CHECKS : SEVENTH_CHECKS;
  const currentQ = checks[checkIdx];

  const handleCheck = useCallback((choice: string) => {
    if (checkAnswered) return;
    setCheckPicked(choice);
    setCheckAnswered(true);
    if (choice === currentQ.answer && !everCompleted) {
      onComplete(lessonId);
      setEverCompleted(true);
    }
  }, [checkAnswered, currentQ, everCompleted, lessonId, onComplete]);

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

  const title = isTriads ? 'Triads in Inversion' : '7th Chord Inversions';
  const subtitle = isTriads ? 'Root position, 1st, and 2nd inversion' : 'Root position through 3rd inversion';
  const chordName = clampedInv === 0
    ? `${root}${chordDef.symbol}`
    : `${root}${chordDef.symbol}/${NOTES[bassNoteIdx]}`;

  const triKeys = Object.keys(TRIAD_TYPES) as TriadKey[];
  const sevKeys = Object.keys(SEVENTH_TYPES) as SeventhKey[];
  const chordKeys = isTriads ? triKeys : sevKeys;

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
        <div style={{ fontSize: 10, color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Chords</div>
        <div style={{ fontSize: 20, fontWeight: 700, color }}>{title}</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{subtitle}</div>
      </div>

      <div style={card}>
        <div style={sLabel}>What it is</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, margin: 0 }}>
          {isTriads
            ? 'An inversion rearranges a chord\'s notes so a different pitch sits lowest (in the bass). Every triad has 3 positions: root position (root in bass), 1st inversion (3rd in bass), and 2nd inversion (5th in bass). The chord tones are always the same — only the bass note changes. Inversions control smoothness of bass motion and how stable or restless the chord sounds.'
            : '7th chords have 4 notes, giving them 4 positions: root position through 3rd inversion. Each position places a different chord tone in the bass. The 3rd inversion (7th in the bass) has the strongest forward pull — the 7th degree wants to resolve down by step. Classical figured bass notation labels these as ⁷, ⁶⁄₅, ⁴⁄₃, and ²⁄₄.'
          }
        </p>
      </div>

      {/* Interactive explorer */}
      <div style={{ ...card, borderLeft: `3px solid ${color}` }}>
        <div style={sLabel}>Chord type</div>
        <div style={{ display: 'flex', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
          {chordKeys.map(k => {
            const def = isTriads
              ? TRIAD_TYPES[k as TriadKey]
              : SEVENTH_TYPES[k as SeventhKey];
            const active = chordType === k;
            return (
              <button key={k} onClick={() => { setChordType(k); setInversion(0); }} style={{
                padding: '4px 10px', borderRadius: 16, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
                background: active ? def.color : 'var(--surface2)',
                color: active ? '#0a0f1e' : 'var(--text2)',
                border: `1px solid ${active ? def.color : 'var(--border)'}`,
                fontWeight: active ? 700 : 400,
              }}>
                {def.label}
              </button>
            );
          })}
        </div>

        <div style={sLabel}>Inversion</div>
        <div style={{ display: 'flex', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
          {invData.map((inv, i) => {
            const active = clampedInv === i;
            return (
              <button key={i} onClick={() => setInversion(i)} style={{
                padding: '5px 14px', borderRadius: 16, fontSize: 12,
                cursor: 'pointer', fontFamily: 'inherit',
                background: active ? color : 'var(--surface2)',
                color: active ? '#0a0f1e' : 'var(--text2)',
                border: `1px solid ${active ? color : 'var(--border)'}`,
                fontWeight: active ? 700 : 400,
              }}>
                {inv.short}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color }}>{chordName}</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              {currentInv.label} — bass: {NOTES[bassNoteIdx]} ({currentInv.bassIs})
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={handleArp} style={{
              padding: '6px 10px', borderRadius: 6, fontSize: 11,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Arp
            </button>
            <button onClick={handlePlay} style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 12,
              background: color, color: '#0a0f1e',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
            }}>
              Play
            </button>
          </div>
        </div>

        <PianoKeys highlightedNotes={highlightedNotes} rootNote={bassNoteIdx} />

        <div style={{ marginTop: 10 }}>
          <SheetMusic noteIndices={highlightedNotes} rootIdx={bassNoteIdx} color={color} layout="chord" />
        </div>

        <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text3)', marginRight: 2 }}>Bass → top:</span>
          {noteNamesInOrder.map((n, i) => (
            <div key={i} style={{
              padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
              background: i === 0 ? color : 'var(--surface2)',
              color: i === 0 ? '#0a0f1e' : 'var(--text)',
              border: `1px solid ${i === 0 ? color : 'var(--border)'}`,
            }}>
              {n}
            </div>
          ))}
        </div>
      </div>

      {/* Inversion facts */}
      <div style={{ ...card, background: `${color}0f`, borderColor: `${color}40` }}>
        <div style={{ fontSize: 11, color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          About {currentInv.label}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: '0 0 8px' }}>
          {currentInv.fact}
        </p>
        <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
          Where you hear it: {currentInv.usage}
        </p>
      </div>

      {/* Quick check */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={sLabel}>Quick check</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{checkIdx + 1} / {checks.length}</div>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 10, lineHeight: 1.5 }}>
          {currentQ.question}
        </div>
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
              marginTop: 10, padding: '10px 12px', borderRadius: 7, fontSize: 12, lineHeight: 1.6,
              color: 'var(--text2)',
              background: checkPicked === currentQ.answer ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
              border: `1px solid ${checkPicked === currentQ.answer ? 'var(--green)' : 'var(--red)'}`,
            }}>
              <span style={{ fontWeight: 700, color: checkPicked === currentQ.answer ? 'var(--green)' : 'var(--red)' }}>
                {checkPicked === currentQ.answer ? 'Correct! ' : `Answer: ${currentQ.answer}. `}
              </span>
              {currentQ.explanation}
            </div>
            {checkIdx < checks.length - 1 && (
              <button onClick={nextQuestion} style={{
                marginTop: 10, width: '100%', padding: '10px', borderRadius: 8, fontSize: 13,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Next question →
              </button>
            )}
            {checkIdx === checks.length - 1 && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--green)', textAlign: 'center' }}>
                Lesson complete — keep exploring the chord types and inversions above.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
