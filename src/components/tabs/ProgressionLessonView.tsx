'use client';
import { useState, useCallback, useRef } from 'react';
import { NOTES } from '@/lib/theory';
import { playChordTogether, playChordArp, getAudioCtx } from '@/lib/audio';
import PianoKeys from '@/components/ui/PianoKeys';
import SheetMusic from '@/components/ui/SheetMusic';

type Quality = 'maj' | 'min' | 'dim';

const QUALITY_INTERVALS: Record<Quality, number[]> = {
  maj: [0, 4, 7],
  min: [0, 3, 7],
  dim: [0, 3, 6],
};

const QUALITY_SYMBOL: Record<Quality, string> = { maj: '', min: 'm', dim: '°' };

interface ChordSlot {
  numeral: string;
  degreeOffset: number;
  quality: Quality;
}

interface ProgEntry {
  id: string;
  name: string;
  color: string;
  genre: string;
  description: string;
  chords: ChordSlot[];
}

interface CadenceEntry {
  id: string;
  name: string;
  short: string;
  color: string;
  description: string;
  detail: string;
  chords: ChordSlot[];
}

const PROGRESSIONS: ProgEntry[] = [
  {
    id: 'I-IV-V-I',
    name: 'I - IV - V - I',
    color: '#4ade80',
    genre: 'Pop, Rock, Country, Gospel',
    description: 'The foundation of Western tonal music. IV adds lift, V creates tension, and I resolves. Nearly every genre uses this.',
    chords: [
      { numeral: 'I',  degreeOffset: 0, quality: 'maj' },
      { numeral: 'IV', degreeOffset: 5, quality: 'maj' },
      { numeral: 'V',  degreeOffset: 7, quality: 'maj' },
      { numeral: 'I',  degreeOffset: 0, quality: 'maj' },
    ],
  },
  {
    id: 'I-V-vi-IV',
    name: 'I - V - vi - IV',
    color: '#4d9ef7',
    genre: 'Modern Pop',
    description: 'The "Axis" progression — used in hundreds of pop hits. The vi (relative minor) creates an emotional dip before the IV resolves it.',
    chords: [
      { numeral: 'I',  degreeOffset: 0, quality: 'maj' },
      { numeral: 'V',  degreeOffset: 7, quality: 'maj' },
      { numeral: 'vi', degreeOffset: 9, quality: 'min' },
      { numeral: 'IV', degreeOffset: 5, quality: 'maj' },
    ],
  },
  {
    id: 'ii-V-I',
    name: 'ii - V - I',
    color: '#facc15',
    genre: 'Jazz, Bossa Nova',
    description: 'The most important jazz progression. The ii sets up tension for the V, which resolves to I. In jazz, these become ii7 - V7 - Imaj7.',
    chords: [
      { numeral: 'ii', degreeOffset: 2, quality: 'min' },
      { numeral: 'V',  degreeOffset: 7, quality: 'maj' },
      { numeral: 'I',  degreeOffset: 0, quality: 'maj' },
    ],
  },
  {
    id: 'I-vi-IV-V',
    name: 'I - vi - IV - V',
    color: '#f97316',
    genre: 'Doo-wop, 50s Rock, Pop Ballads',
    description: 'The 50s progression. Descends naturally through the diatonic chords. Used in countless standards and early rock.',
    chords: [
      { numeral: 'I',  degreeOffset: 0, quality: 'maj' },
      { numeral: 'vi', degreeOffset: 9, quality: 'min' },
      { numeral: 'IV', degreeOffset: 5, quality: 'maj' },
      { numeral: 'V',  degreeOffset: 7, quality: 'maj' },
    ],
  },
  {
    id: 'i-VII-VI-VII',
    name: 'i - VII - VI - VII',
    color: '#818cf8',
    genre: 'Rock, Metal, Folk',
    description: 'A minor (Aeolian) progression. The major VII and VI chords are borrowed from the relative major, giving it power and drive.',
    chords: [
      { numeral: 'i',   degreeOffset: 0,  quality: 'min' },
      { numeral: 'VII', degreeOffset: 10, quality: 'maj' },
      { numeral: 'VI',  degreeOffset: 8,  quality: 'maj' },
      { numeral: 'VII', degreeOffset: 10, quality: 'maj' },
    ],
  },
];

const CADENCES: CadenceEntry[] = [
  {
    id: 'perfect',
    name: 'Perfect Authentic',
    short: 'V → I',
    color: '#4ade80',
    description: 'The strongest resolution in tonal music. V (or V7) resolves to I. Used to conclusively close phrases and pieces.',
    detail: 'The leading tone (7th degree) in V rises by half step to the root. The 5th of V falls to the 3rd of I. Maximum pull and release.',
    chords: [
      { numeral: 'V', degreeOffset: 7, quality: 'maj' },
      { numeral: 'I', degreeOffset: 0, quality: 'maj' },
    ],
  },
  {
    id: 'plagal',
    name: 'Plagal',
    short: 'IV → I',
    color: '#4d9ef7',
    description: 'The "Amen" cadence. IV resolves to I. Softer than the authentic cadence — spiritual, affirming.',
    detail: 'Common at the end of hymns and gospel. The IV chord shares two notes with I, making the resolution smooth and gentle.',
    chords: [
      { numeral: 'IV', degreeOffset: 5, quality: 'maj' },
      { numeral: 'I',  degreeOffset: 0, quality: 'maj' },
    ],
  },
  {
    id: 'half',
    name: 'Half Cadence',
    short: 'I → V',
    color: '#facc15',
    description: 'Ends on V — unresolved. Sounds like a question. Creates suspense and pushes the phrase forward.',
    detail: 'The phrase lands on V instead of resolving to I. Forces the listener forward. Common mid-phrase, before a repeat or the next section.',
    chords: [
      { numeral: 'I', degreeOffset: 0, quality: 'maj' },
      { numeral: 'V', degreeOffset: 7, quality: 'maj' },
    ],
  },
  {
    id: 'deceptive',
    name: 'Deceptive',
    short: 'V → vi',
    color: '#f87171',
    description: 'Sounds like it will resolve to I — then lands on vi instead. Surprise, emotion, forward motion.',
    detail: 'The ear expects V → I. Getting vi is a twist. Used to extend phrases, delay resolution, or create unexpected emotion.',
    chords: [
      { numeral: 'V',  degreeOffset: 7, quality: 'maj' },
      { numeral: 'vi', degreeOffset: 9, quality: 'min' },
    ],
  },
];

interface CheckQ { question: string; choices: string[]; answer: string; explanation: string }

const QUICK_CHECKS: CheckQ[] = [
  {
    question: 'Which cadence ends on V, leaving the phrase unresolved?',
    choices: ['Perfect Authentic', 'Plagal', 'Half Cadence', 'Deceptive'],
    answer: 'Half Cadence',
    explanation: 'A half cadence lands on V without resolving to I. It sounds like a question. The perfect authentic cadence (V → I) is the one that resolves fully.',
  },
  {
    question: 'The ii - V - I progression is most associated with which genre?',
    choices: ['Country', 'Metal', 'Jazz', 'Folk'],
    answer: 'Jazz',
    explanation: 'ii - V - I is the cornerstone of jazz harmony. In jazz these become ii7 - V7 - Imaj7. Almost every jazz standard uses it in some form.',
  },
  {
    question: 'In I - V - vi - IV, the vi chord is what quality?',
    choices: ['Major', 'Minor', 'Diminished', 'Augmented'],
    answer: 'Minor',
    explanation: 'In a major key, the vi chord is always minor — it\'s the relative minor. That minor quality is what gives the I-V-vi-IV its emotional dip.',
  },
];

interface Props {
  root: string;
  lessonId: string;
  color: string;
  onBack: () => void;
  onComplete: (id: string) => void;
}

export default function ProgressionLessonView({ root, lessonId, color, onBack, onComplete }: Props) {
  const [section, setSection] = useState<'progressions' | 'cadences'>('progressions');
  const [selectedProgId, setSelectedProgId] = useState(PROGRESSIONS[0].id);
  const [selectedCadId, setSelectedCadId] = useState(CADENCES[0].id);
  const [activeChordIdx, setActiveChordIdx] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const stopRef = useRef(false);

  const [checkIdx, setCheckIdx] = useState(0);
  const [checkPicked, setCheckPicked] = useState<string | null>(null);
  const [checkAnswered, setCheckAnswered] = useState(false);
  const [everCompleted, setEverCompleted] = useState(false);

  const rootIdx = NOTES.indexOf(root as typeof NOTES[number]);

  const currentEntries = section === 'progressions' ? PROGRESSIONS : CADENCES;
  const selectedId = section === 'progressions' ? selectedProgId : selectedCadId;
  const currentEntry = (currentEntries as Array<ProgEntry | CadenceEntry>).find(e => e.id === selectedId)
    ?? currentEntries[0];

  function getChordNotes(slot: ChordSlot): number[] {
    const chordRoot = (rootIdx + slot.degreeOffset) % 12;
    return QUALITY_INTERVALS[slot.quality].map(i => (chordRoot + i) % 12);
  }

  function getChordName(slot: ChordSlot): string {
    const chordRoot = (rootIdx + slot.degreeOffset) % 12;
    return NOTES[chordRoot] + QUALITY_SYMBOL[slot.quality];
  }

  const activeSlot = currentEntry.chords[Math.min(activeChordIdx, currentEntry.chords.length - 1)];
  const activeNotes = getChordNotes(activeSlot);
  const activeRootIdx = (rootIdx + activeSlot.degreeOffset) % 12;

  const playProgression = useCallback(async () => {
    if (isPlaying) { stopRef.current = true; return; }
    stopRef.current = false;
    setIsPlaying(true);
    const ctx = getAudioCtx();
    const chords = currentEntry.chords;
    for (let i = 0; i < chords.length; i++) {
      if (stopRef.current) break;
      setActiveChordIdx(i);
      const notes = getChordNotes(chords[i]).map(idx => NOTES[idx]);
      playChordTogether(notes, 1.0);
      await new Promise(r => setTimeout(r, 1100));
    }
    setIsPlaying(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying, currentEntry, rootIdx]);

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

  const currentQ = QUICK_CHECKS[checkIdx];
  const entryColor = currentEntry.color;

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
        <div style={{ fontSize: 20, fontWeight: 700, color }}>Progressions & Cadences</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>How chords move and resolve</div>
      </div>

      <div style={card}>
        <div style={sLabel}>What it is</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, margin: 0 }}>
          A chord progression is a sequence of chords that creates harmonic motion. Some progressions feel resolved and stable; others create tension that pushes the music forward. A cadence is the specific harmonic gesture that ends a phrase — the way a sentence ends with punctuation. Understanding these patterns lets you recognize them in any song, write your own, and improvise confidently.
        </p>
      </div>

      {/* Section toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['progressions', 'cadences'] as const).map(s => (
          <button key={s} onClick={() => { setSection(s); setActiveChordIdx(0); }} style={{
            padding: '5px 16px', borderRadius: 16, fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
            background: section === s ? color : 'var(--surface2)',
            color: section === s ? '#0a0f1e' : 'var(--text2)',
            border: `1px solid ${section === s ? color : 'var(--border)'}`,
            fontWeight: section === s ? 700 : 400,
          }}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {/* Progression / cadence selector */}
      <div style={{ ...card }}>
        <div style={sLabel}>Select {section === 'progressions' ? 'a progression' : 'a cadence'}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {currentEntries.map(e => {
            const active = e.id === selectedId;
            return (
              <button key={e.id} onClick={() => {
                if (section === 'progressions') setSelectedProgId(e.id);
                else setSelectedCadId(e.id);
                setActiveChordIdx(0);
              }} style={{
                padding: '10px 12px', borderRadius: 8, fontSize: 13, textAlign: 'left',
                background: active ? `${e.color}18` : 'var(--surface2)',
                border: `1px solid ${active ? e.color : 'var(--border)'}`,
                color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                <div style={{ fontWeight: 700, color: active ? e.color : 'var(--text)' }}>
                  {section === 'cadences' ? (e as CadenceEntry).short + ' — ' : ''}{e.name}
                </div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
                  {section === 'progressions'
                    ? (e as ProgEntry).genre
                    : (e as CadenceEntry).description.slice(0, 60) + '…'
                  }
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Interactive explorer */}
      <div style={{ ...card, borderLeft: `3px solid ${entryColor}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: entryColor }}>
              {root}: {currentEntry.name}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>
              {section === 'progressions'
                ? (currentEntry as ProgEntry).genre
                : (currentEntry as CadenceEntry).short
              }
            </div>
          </div>
          <button
            onClick={playProgression}
            style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              background: isPlaying ? 'var(--red)' : entryColor,
              color: '#0a0f1e', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}
          >
            {isPlaying ? 'Stop' : 'Play All'}
          </button>
        </div>

        {/* Chord sequence */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
          {currentEntry.chords.map((slot, i) => {
            const active = activeChordIdx === i;
            return (
              <button key={i} onClick={() => setActiveChordIdx(i)} style={{
                padding: '8px 12px', borderRadius: 8, fontSize: 13, textAlign: 'center',
                cursor: 'pointer', fontFamily: 'inherit', minWidth: 52,
                background: active ? entryColor : 'var(--surface2)',
                color: active ? '#0a0f1e' : 'var(--text2)',
                border: `1px solid ${active ? entryColor : 'var(--border)'}`,
                fontWeight: active ? 700 : 400,
              }}>
                <div style={{ fontSize: 11, opacity: 0.7 }}>{slot.numeral}</div>
                <div style={{ fontSize: 13, fontWeight: 700, marginTop: 1 }}>{getChordName(slot)}</div>
              </button>
            );
          })}
        </div>

        <PianoKeys highlightedNotes={activeNotes} rootNote={activeRootIdx} />

        <div style={{ marginTop: 10 }}>
          <SheetMusic noteIndices={activeNotes} rootIdx={activeRootIdx} color={entryColor} layout="chord" />
        </div>

        <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 10, color: 'var(--text3)', marginRight: 2 }}>Notes:</span>
          {activeNotes.map((idx, i) => (
            <div key={i} style={{
              padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
              background: i === 0 ? entryColor : 'var(--surface2)',
              color: i === 0 ? '#0a0f1e' : 'var(--text)',
              border: `1px solid ${i === 0 ? entryColor : 'var(--border)'}`,
            }}>
              {NOTES[idx]}
            </div>
          ))}
          <button onClick={() => playChordArp(activeNotes.map(i => NOTES[i]))} style={{
            marginLeft: 'auto', padding: '4px 10px', borderRadius: 6, fontSize: 11,
            background: 'var(--surface2)', border: '1px solid var(--border)',
            color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Arp
          </button>
        </div>
      </div>

      {/* About this progression/cadence */}
      <div style={{ ...card, background: `${entryColor}0f`, borderColor: `${entryColor}40` }}>
        <div style={{ fontSize: 11, color: entryColor, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          About {currentEntry.name}
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: '0 0 8px' }}>
          {section === 'progressions'
            ? (currentEntry as ProgEntry).description
            : (currentEntry as CadenceEntry).description
          }
        </p>
        {section === 'cadences' && (
          <p style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.5, margin: 0, fontStyle: 'italic' }}>
            {(currentEntry as CadenceEntry).detail}
          </p>
        )}
      </div>

      {/* Quick check */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={sLabel}>Quick check</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{checkIdx + 1} / {QUICK_CHECKS.length}</div>
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
                Lesson complete — explore the progressions and cadences above.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
