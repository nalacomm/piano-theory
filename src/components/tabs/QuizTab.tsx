'use client';
import { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { NOTES, QUIZ_QUESTIONS, SCALE_FORMULAS, CHORD_TYPES, MODE_DATA, buildScale, buildChord } from '@/lib/theory';
import { playScaleUp, playChordTogether, playSingleNote } from '@/lib/audio';
import MiniKeyboard from '@/components/ui/MiniKeyboard';
import PianoKeys from '@/components/ui/PianoKeys';
import type { ScaleKey, ChordKey, ModeKey } from '@/types';
import QuickFeedback from '@/components/ui/QuickFeedback';

// ── Types ──────────────────────────────────────────────────────────────────────

type Topic = 'modes' | 'scales' | 'chords' | 'intervals' | 'notation' | 'numbers';

interface MCQuestion {
  kind: 'mc';
  topic: Topic;
  prompt: string;
  answer: string;
  choices: string[];
  explanation?: string;
}

interface KeyboardQuestion {
  kind: 'keyboard';
  subtype: 'scale' | 'chord' | 'interval' | 'chord_id';
  topic: Topic;
  prompt: string;
  hint: string;
  color: string;
  root: string;
  correctNotes: string[];
  allNotes?: string[];
  label?: string;
  explanation?: string;
  referenceIdxs?: number[];
  referenceRoot?: number;
}

type AnyQuestion = MCQuestion | KeyboardQuestion;

interface TopicPerf { correct_count: number; wrong_count: number; }
type PerfMap = Partial<Record<Topic, TopicPerf>>;

// ── Helpers ────────────────────────────────────────────────────────────────────

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomRoot(): string { return NOTES[Math.floor(Math.random() * 12)]; }

// Weight = 1 (no data) up to ~4 (all wrong). More wrong attempts → more likely to appear.
function topicWeight(perf: PerfMap, topic: Topic): number {
  const p = perf[topic];
  if (!p) return 1.5; // unseen topics get a small boost
  const total = p.correct_count + p.wrong_count;
  if (total === 0) return 1.5;
  const wrongRate = p.wrong_count / total;
  return 1 + wrongRate * 3; // 1 (all correct) to 4 (all wrong)
}

function weightedSample<T>(groups: Array<{ topic: Topic; items: T[] }>, perf: PerfMap, count: number): T[] {
  if (groups.every(g => g.items.length === 0)) return [];
  const result: T[] = [];
  const remaining = groups.map(g => ({ ...g, items: shuffle(g.items) }));
  let attempts = 0;
  while (result.length < count && attempts < count * 10) {
    attempts++;
    const weights = remaining.map(g => g.items.length > 0 ? topicWeight(perf, g.topic) : 0);
    const total = weights.reduce((s, w) => s + w, 0);
    if (total === 0) break;
    let r = Math.random() * total;
    for (let i = 0; i < remaining.length; i++) {
      r -= weights[i];
      if (r <= 0 && remaining[i].items.length > 0) {
        result.push(remaining[i].items.pop()!);
        break;
      }
    }
  }
  return result;
}

async function reportResult(topic: Topic, correct: boolean) {
  try {
    await fetch('/api/quiz-results', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, correct }),
    });
  } catch { /* fire-and-forget */ }
}

// ── Topic map for legacy QUIZ_QUESTIONS ───────────────────────────────────────

const QUIZ_TOPIC_MAP: Record<string, Topic> = {
  'Dorian differs from natural minor by which degree?': 'modes',
  "Lydian's signature note vs major scale?": 'modes',
  'Mixolydian is the same as major except?': 'modes',
  'Which mode lives on the II chord of a major key?': 'modes',
  'Which mode lives on the V chord of a major key?': 'modes',
  'A minor is the relative minor of which key?': 'modes',
  'Degree I in Lydian has what chord quality?': 'modes',
  "Phrygian's defining interval vs major?": 'modes',
  'D Dorian and C major share the same notes?': 'modes',
  'What interval separates C and E?': 'intervals',
  'The V chord naturally resolves to?': 'chords',
  'Which scale adds a ♭5 to minor pentatonic?': 'scales',
  'Aeolian lives on which scale degree?': 'modes',
  'How many notes in a pentatonic scale?': 'scales',
  'Dominant 7th = major triad plus?': 'chords',
  'The ♭VII chord in Mixolydian is what quality?': 'modes',
  'Which mode is minor with a raised 6th?': 'modes',
  "Locrian's I chord quality?": 'modes',
  'Relative minor starts on which degree?': 'modes',
  "In number system 1-4-5, the 4 means?": 'numbers',
};

// ── Notation MC questions ──────────────────────────────────────────────────────

const NOTATION_MC: MCQuestion[] = [
  {
    kind: 'mc', topic: 'notation',
    prompt: 'Which mnemonic helps remember treble clef LINE notes (E G B D F)?',
    answer: 'Every Good Boy Does Fine',
    choices: ['FACE', 'All Cows Eat Grass', 'Every Good Boy Does Fine', 'Good Boys Do Fine Always'],
    explanation: 'Lines from bottom to top: E-G-B-D-F. "Every Good Boy Does Fine" — first letter of each note.',
  },
  {
    kind: 'mc', topic: 'notation',
    prompt: 'Treble clef SPACES (F A C E) are remembered how?',
    answer: 'They spell the word FACE',
    choices: ['Good Boys Do Fine Always', 'They spell the word FACE', 'Every Good Boy Does Fine', 'All Cows Eat Grass'],
    explanation: 'Treble spaces bottom to top: F-A-C-E — they literally spell FACE.',
  },
  {
    kind: 'mc', topic: 'notation',
    prompt: 'What note is on the 2nd line of the treble clef?',
    answer: 'G',
    choices: ['E', 'F', 'G', 'A'],
    explanation: 'Lines (bottom to top): E G B D F. The 2nd line is G — "Every GOOD Boy Does Fine."',
  },
  {
    kind: 'mc', topic: 'notation',
    prompt: 'Middle C (C4) appears where on the staff?',
    answer: 'On a ledger line just below the treble clef',
    choices: ['On the bottom line of treble clef', 'On a ledger line just below the treble clef', 'On the top line of the bass clef', 'In the first space of treble clef'],
    explanation: 'Middle C sits on a short ledger line just below the treble staff. In bass clef it sits on a ledger line just above the staff.',
  },
  {
    kind: 'mc', topic: 'notation',
    prompt: 'Bass clef line notes (G B D F A) are remembered with?',
    answer: 'Good Boys Do Fine Always',
    choices: ['FACE', 'Every Good Boy Does Fine', 'Good Boys Do Fine Always', 'All Cows Eat Grass'],
    explanation: 'Bass clef lines bottom to top: G-B-D-F-A. "Good Boys Do Fine Always."',
  },
  {
    kind: 'mc', topic: 'notation',
    prompt: 'Bass clef space notes (A C E G) are remembered with?',
    answer: 'All Cows Eat Grass',
    choices: ['Every Good Boy Does Fine', 'All Cows Eat Grass', 'Good Boys Do Fine Always', 'FACE'],
    explanation: 'Bass clef spaces bottom to top: A-C-E-G. "All Cows Eat Grass."',
  },
  {
    kind: 'mc', topic: 'notation',
    prompt: 'What note is in the 1st space of the treble clef?',
    answer: 'F',
    choices: ['E', 'F', 'G', 'A'],
    explanation: 'Treble spaces spell FACE from bottom to top. First (bottom) space = F4.',
  },
  {
    kind: 'mc', topic: 'notation',
    prompt: 'In the grand staff, which clef covers the right hand?',
    answer: 'Treble clef',
    choices: ['Bass clef', 'Treble clef', 'Alto clef', 'Both clefs equally'],
    explanation: 'Treble clef (C4 and above) covers the right hand. Bass clef (B3 and below) covers the left hand.',
  },
  {
    kind: 'mc', topic: 'notation',
    prompt: 'What note is on the middle (3rd) line of the treble clef?',
    answer: 'B',
    choices: ['A', 'B', 'C', 'D'],
    explanation: 'Treble clef lines (bottom to top): E G B D F. The middle (3rd) line is B4.',
  },
  {
    kind: 'mc', topic: 'notation',
    prompt: 'Which note is in the top space (space 4) of the treble clef?',
    answer: 'E',
    choices: ['C', 'D', 'E', 'F'],
    explanation: 'Treble spaces spell FACE: F(1) A(2) C(3) E(4). Top space = E5.',
  },
];

// ── MC explanations (legacy questions) ────────────────────────────────────────

const MC_EXPLANATIONS: Record<string, string> = {
  'Dorian differs from natural minor by which degree?': 'Dorian has a natural (raised) 6th compared to Aeolian (natural minor). Both have ♭3 and ♭7. That raised 6 is what gives Dorian its warmer, less dark sound.',
  "Lydian's signature note vs major scale?": 'Lydian is a major scale with only one change — the 4th is raised by a half step (♯4). This creates a dreamy, floating quality because of the tritone between the root and the 4th.',
  'Mixolydian is the same as major except?': 'Mixolydian = major with one flat — the 7th. The I chord stays major, but the ♭7 creates a blues-gospel pocket. Every other degree is identical to major.',
  'Which mode lives on the II chord of a major key?': 'Modes are named by which scale degree they start on. Dorian starts on degree II. D Dorian uses the exact same notes as C major — just treats D as home.',
  'Which mode lives on the V chord of a major key?': 'Mixolydian lives on degree V of a major key. G Mixolydian and C major share every note — G just becomes the home note instead of C.',
  'A minor is the relative minor of which key?': 'Relative minor starts on the 6th degree of the major scale. Count up C major: C D E F G A — A is the 6th. A minor and C major share all 7 notes.',
  'Degree I in Lydian has what chord quality?': "In Lydian, the 1-3-5 are all natural (no alterations), so the I chord is a major triad. Only the 4th is raised — that doesn't affect the I chord's quality.",
  "Phrygian's defining interval vs major?": 'Phrygian has a flat 2nd (♭2). That half step immediately above the root creates maximum tension. Phrygian also has ♭3, ♭6, ♭7 — but the ♭2 is the signature.',
  'D Dorian and C major share the same notes?': 'True. Both use C D E F G A B — but Dorian treats D as home and Aeolian/Ionian treat C as home. Same notes, different tonal center changes the feel completely.',
  'What interval separates C and E?': 'C to E = 4 half steps = a major 3rd. Count: C→C#(1)→D(2)→D#(3)→E(4). Major 3rd = 4 semitones. Minor 3rd = 3 semitones.',
  'The V chord naturally resolves to?': 'V → I is the strongest harmonic motion in tonal music. The V chord contains the leading tone (7th degree) which wants to resolve up a half step to the tonic (I).',
  'Which scale adds a ♭5 to minor pentatonic?': 'The blues scale = minor pentatonic + one note: the ♭5 (tritone/blue note). Minor penta has 5 notes; blues has 6. That ♭5 is the "bent" note that defines blues phrasing.',
  'Aeolian lives on which scale degree?': 'Aeolian (natural minor) starts on the 6th degree of its parent major key. A Aeolian is the relative minor of C major — same notes, A as home.',
  'How many notes in a pentatonic scale?': 'Penta = five. Major pentatonic removes the 4th and 7th from major. Minor pentatonic removes the 2nd and 6th from natural minor. 5 notes each.',
  'Dominant 7th = major triad plus?': 'Dominant 7th = 1-3-5-♭7. The ♭7 (flat 7th) is what makes it dominant and creates tension. Add a natural 7 instead and you get major 7th — jazzy and smooth, not tense.',
  'The ♭VII chord in Mixolydian is what quality?': 'In Mixolydian, the ♭VII chord is built on the flatted 7th degree. Stack 1-3-5 on that degree and you get a major triad. The ♭VII → I move is the gospel/rock anthem formula.',
  'Which mode is minor with a raised 6th?': "Dorian is the minor mode with a natural (raised) 6th. Aeolian has a ♭6. That one note difference lifts Dorian's mood above the pure darkness of natural minor.",
  "Locrian's I chord quality?": 'Locrian has a ♭5, which turns the I chord into a diminished triad (1-♭3-♭5). A diminished chord has no stable root, so Locrian has no real tonal center.',
  'Relative minor starts on which degree?': 'The relative minor starts on the 6th degree of the major scale. In C major: count C(1) D(2) E(3) F(4) G(5) A(6). A minor is the relative minor.',
  "In number system 1-4-5, the 4 means?": "The number system counts scale degrees. In C major: 1=C, 2=D, 3=E, 4=F, 5=G. 'The 4' means the chord built on the 4th scale degree — in C, that's an F major chord.",
};

// ── Scale descriptions for keyboard question explanations ─────────────────────

const SCALE_DESCRIPTIONS: Record<string, string> = {
  major:         'W-W-H-W-W-W-H. The reference — all other scales are measured against it. Bright and resolved.',
  naturalMinor:  'W-H-W-W-H-W-W. Three flats vs major: ♭3, ♭6, ♭7. The most common minor sound in Western music.',
  harmonicMinor: 'Natural minor with a raised 7th (♯7). Creates a strong leading tone and an exotic augmented 2nd gap between ♭6 and 7.',
  melodicMinor:  'Natural minor with raised 6th and 7th going up. Smooth voice-leading. Classical and jazz use this ascending form.',
  majorPenta:    '5 notes (1-2-3-5-6). Major without the 4th and 7th removes all half-step tension. Works over any major chord.',
  minorPenta:    '5 notes (1-♭3-4-5-♭7). Minor without the 2nd and 6th. The foundation of blues, rock, and R&B soloing.',
  blues:         'Minor pentatonic + ♭5 (the blue note). That flat 5 is the bent, raw sound that defines the blues genre.',
  wholeTone:     '6 notes, each a whole step apart. No half steps, no leading tone — everything floats with no resolution possible.',
  diminished:    'Alternates W-H-W-H-W-H-W-H (8 notes total). Fully symmetrical — the pattern repeats every 3 semitones. High tension.',
};

// ── Keyboard question generator ────────────────────────────────────────────────

const MODE_KEYS: ModeKey[] = ['dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian'];

const MODE_PARENT_OFFSETS: Record<string, number> = {
  dorian: 2, phrygian: 4, lydian: 5, mixolydian: 7, aeolian: 9,
};

function generateKeyboardQuestions(): KeyboardQuestion[] {
  const qs: KeyboardQuestion[] = [];

  // Scales
  const scaleKeys = Object.keys(SCALE_FORMULAS) as ScaleKey[];
  for (const sk of scaleKeys) {
    const root = randomRoot();
    const formula = SCALE_FORMULAS[sk];
    const idxs = buildScale(root, formula.intervals);
    const notes = idxs.map(i => NOTES[i]);
    const desc = SCALE_DESCRIPTIONS[sk] ?? `${notes.length} notes built from root by steps: ${formula.intervals.join('-')} semitones.`;
    qs.push({
      kind: 'keyboard', subtype: 'scale', topic: 'scales',
      prompt: `Tap all notes of ${root} ${formula.label}`,
      hint: `${notes.length} notes — tap them in any order`,
      color: formula.color, root,
      correctNotes: notes,
      referenceIdxs: idxs,
      referenceRoot: idxs[0],
      label: `${root} ${formula.label}: ${notes.join(' · ')}`,
      explanation: `${root} ${formula.label} — ${desc}`,
    });
  }

  // Chords
  const chordKeys = Object.keys(CHORD_TYPES) as ChordKey[];
  for (const ck of chordKeys) {
    const root = randomRoot();
    const chord = CHORD_TYPES[ck];
    const idxs = buildChord(root, chord.intervals);
    const notes = idxs.map(i => NOTES[i % 12]);
    const qualColors: Record<string, string> = {
      maj: '#4ade80', min: '#818cf8', dim: '#f87171', aug: '#facc15', dom: '#fb923c', sus: '#22d3ee',
    };
    qs.push({
      kind: 'keyboard', subtype: 'chord', topic: 'chords',
      prompt: `Tap all notes of ${root}${chord.symbol} (${chord.label})`,
      hint: `${notes.length} notes — intervals: ${chord.intervals.join('-')} semitones`,
      color: qualColors[chord.quality] || 'var(--green)', root,
      correctNotes: notes,
      referenceIdxs: idxs.map(i => i % 12),
      referenceRoot: idxs[0] % 12,
      label: `${root}${chord.symbol}: ${notes.join(' · ')}`,
      explanation: chord.theory,
    });
  }

  // Modes
  for (const mk of MODE_KEYS) {
    const root = randomRoot();
    const mode = MODE_DATA[mk];
    const idxs = buildScale(root, mode.intervals);
    const notes = idxs.map(i => NOTES[i]);
    const rootIdx = NOTES.indexOf(root as typeof NOTES[number]);
    const parentOffset = MODE_PARENT_OFFSETS[mk] ?? 0;
    const parentRoot = NOTES[(rootIdx - parentOffset + 12) % 12];
    qs.push({
      kind: 'keyboard', subtype: 'scale', topic: 'modes',
      prompt: `Tap all notes of ${root} ${mode.label}`,
      hint: `${notes.length} notes · ${mode.alterations}`,
      color: mode.color, root,
      correctNotes: notes,
      referenceIdxs: idxs,
      referenceRoot: idxs[0],
      label: `${root} ${mode.short}: ${notes.join(' · ')}`,
      explanation: `${root} ${mode.label} uses the same notes as ${parentRoot} major (its parent key). ${mode.keyFact}`,
    });
  }

  // Intervals
  const intervals: Array<{ semitones: number; name: string }> = [
    { semitones: 2,  name: 'major 2nd' },
    { semitones: 3,  name: 'minor 3rd' },
    { semitones: 4,  name: 'major 3rd' },
    { semitones: 5,  name: 'perfect 4th' },
    { semitones: 7,  name: 'perfect 5th' },
    { semitones: 9,  name: 'major 6th' },
    { semitones: 10, name: 'minor 7th (♭7)' },
    { semitones: 11, name: 'major 7th' },
  ];
  for (const iv of intervals) {
    const root = randomRoot();
    const rootIdx = NOTES.indexOf(root as typeof NOTES[number]);
    const targetIdx = (rootIdx + iv.semitones) % 12;
    const targetNote = NOTES[targetIdx];
    qs.push({
      kind: 'keyboard', subtype: 'interval', topic: 'intervals',
      prompt: `From ${root} — tap a ${iv.name} above`,
      hint: `+${iv.semitones} semitones from ${root}`,
      color: '#4d9ef7', root,
      correctNotes: [targetNote],
      referenceIdxs: [rootIdx],
      referenceRoot: rootIdx,
      label: `${root} + ${iv.semitones} semitones = ${targetNote}`,
      explanation: `A ${iv.name} = ${iv.semitones} semitones. From ${root}, count ${iv.semitones} half steps up to reach ${targetNote}. On the piano, count every key (black and white) including the starting note.`,
    });
  }

  return qs;
}

// ── Pool builder (adaptive) ────────────────────────────────────────────────────

function buildQuestionPool(perf: PerfMap): AnyQuestion[] {
  const theoryMC: MCQuestion[] = QUIZ_QUESTIONS.map(q => ({
    kind: 'mc' as const,
    topic: QUIZ_TOPIC_MAP[q.q] ?? 'numbers' as Topic,
    prompt: q.q,
    answer: q.a,
    choices: q.c,
    explanation: MC_EXPLANATIONS[q.q],
  }));

  const notationSample = shuffle(NOTATION_MC).slice(0, 4);
  const allMC = [...theoryMC, ...notationSample];
  const kbQs = generateKeyboardQuestions();

  // Group by topic
  const topics: Topic[] = ['modes', 'scales', 'chords', 'intervals', 'notation', 'numbers'];
  const mcGroups = topics.map(t => ({ topic: t, items: allMC.filter(q => q.topic === t) }));
  const kbGroups = topics.map(t => ({ topic: t, items: kbQs.filter(q => q.topic === t) }));

  // Sample ~12 MC and ~8 keyboard, weighted by weakness
  const pickedMC = weightedSample(mcGroups, perf, 12);
  const pickedKB = weightedSample(kbGroups, perf, 8);

  return shuffle([...pickedMC, ...pickedKB]);
}

// ── Keyboard question component ────────────────────────────────────────────────

function KeyboardQ({ q, onCorrect, onWrong }: {
  q: KeyboardQuestion;
  onCorrect: () => void;
  onWrong: () => void;
}) {
  const [tapped,   setTapped]   = useState<string[]>([]);
  const [wrongTaps,setWrongTaps]= useState<string[]>([]);
  const [solved,   setSolved]   = useState(false);
  const [failed,   setFailed]   = useState(false);

  const tap = useCallback((note: string) => {
    if (solved || failed) return;
    if (tapped.includes(note)) return;

    if (q.correctNotes.includes(note)) {
      playSingleNote(note);
      const next = [...tapped, note];
      setTapped(next);
      if (next.length === q.correctNotes.length) {
        setSolved(true);
        if (q.subtype === 'scale') playScaleUp(q.correctNotes);
        else if (q.subtype === 'chord') playChordTogether(q.correctNotes);
        onCorrect();
      }
    } else {
      playSingleNote(note);
      setWrongTaps(w => [...w, note]);
      setFailed(true);
      onWrong();
    }
  }, [tapped, solved, failed, q, onCorrect, onWrong]);

  const correctSoFar = tapped.filter(n => q.correctNotes.includes(n));

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
        {solved ? `All ${q.correctNotes.length} notes found!` :
         failed ? 'Missed — correct notes shown below' :
         `${correctSoFar.length} / ${q.correctNotes.length} tapped`}
      </div>
      <MiniKeyboard
        onTap={tap}
        correctNotes={solved || failed ? q.correctNotes : correctSoFar}
        wrongNotes={wrongTaps}
      />
      {q.referenceIdxs && (solved || failed) && (
        <div style={{ marginTop: 10 }}>
          <PianoKeys highlightedNotes={q.referenceIdxs} rootNote={q.referenceRoot ?? 0} label="answer" />
        </div>
      )}
      {(solved || failed) && q.label && (
        <div style={{ marginTop: 8, padding: '8px 10px', borderRadius: 6, fontSize: 12, background: 'var(--surface2)', color: 'var(--text2)' }}>
          {q.label}
        </div>
      )}
      {(solved || failed) && q.explanation && (
        <div style={{
          marginTop: 8, padding: '10px 12px', borderRadius: 7, fontSize: 12, lineHeight: 1.6,
          color: 'var(--text2)',
          background: solved ? 'rgba(74,222,128,0.07)' : 'rgba(248,113,113,0.07)',
          border: `1px solid ${solved ? 'var(--green)' : 'var(--red)'}`,
        }}>
          <span style={{ fontWeight: 700, color: solved ? 'var(--green)' : 'var(--red)', marginRight: 4 }}>
            {solved ? 'Correct!' : 'Explanation:'}
          </span>
          {q.explanation}
        </div>
      )}
    </div>
  );
}

// ── Inline issue reporter ──────────────────────────────────────────────────────

function ReportButton({ question, topic }: { question: AnyQuestion; topic: Topic }) {
  const [open,      setOpen]      = useState(false);
  const [note,      setNote]      = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [sending,   setSending]   = useState(false);

  async function submit() {
    if (sending) return;
    setSending(true);
    try {
      await fetch('/api/issues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question_prompt: question.prompt,
          question_topic: topic,
          note: note.trim() || undefined,
        }),
      });
    } catch { /* silent */ }
    setSending(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div style={{ fontSize: 11, color: 'var(--text3)', textAlign: 'right', marginTop: 6 }}>
        Issue reported — thanks.
      </div>
    );
  }

  return (
    <div style={{ marginTop: 6 }}>
      {!open ? (
        <button onClick={() => setOpen(true)} style={{
          background: 'none', border: 'none', cursor: 'pointer',
          fontSize: 11, color: 'var(--text3)', padding: 0, fontFamily: 'inherit',
          float: 'right',
        }}>
          ⚑ Report an issue
        </button>
      ) : (
        <div style={{
          padding: '10px 12px', borderRadius: 8, marginTop: 4,
          background: 'var(--surface2)', border: '1px solid var(--border)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>
            What's wrong with this question? (optional)
          </div>
          <textarea
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Wrong answer, unclear wording, typo…"
            rows={2}
            style={{
              width: '100%', boxSizing: 'border-box', padding: '7px 9px',
              borderRadius: 6, border: '1px solid var(--border)',
              background: 'var(--surface)', color: 'var(--text)',
              fontSize: 12, fontFamily: 'inherit', resize: 'none',
              marginBottom: 8,
            }}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={submit} disabled={sending} style={{
              padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
              background: 'var(--red)', color: '#fff', border: 'none',
              cursor: sending ? 'default' : 'pointer', fontFamily: 'inherit', opacity: sending ? 0.6 : 1,
            }}>
              {sending ? 'Sending…' : 'Report'}
            </button>
            <button onClick={() => { setOpen(false); setNote(''); }} style={{
              padding: '6px 12px', borderRadius: 6, fontSize: 12,
              background: 'none', border: '1px solid var(--border)',
              color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Weak topic banner ──────────────────────────────────────────────────────────

const TOPIC_LABELS: Record<Topic, string> = {
  modes: 'Modes', scales: 'Scales', chords: 'Chords',
  intervals: 'Intervals', notation: 'Notation', numbers: 'Number system',
};

function WeakTopicBanner({ perf }: { perf: PerfMap }) {
  const weak = (Object.entries(perf) as [Topic, TopicPerf][])
    .filter(([, p]) => p.wrong_count + p.correct_count >= 3 && p.wrong_count / (p.wrong_count + p.correct_count) >= 0.5)
    .sort(([, a], [, b]) => (b.wrong_count / (b.wrong_count + b.correct_count)) - (a.wrong_count / (a.wrong_count + a.correct_count)))
    .slice(0, 2)
    .map(([t]) => t);

  if (weak.length === 0) return null;

  return (
    <div style={{
      padding: '9px 12px', borderRadius: 8, marginBottom: 10, fontSize: 12,
      background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.3)',
      color: 'var(--text2)', lineHeight: 1.5,
    }}>
      <span style={{ color: '#fb923c', fontWeight: 700 }}>Focus area: </span>
      {weak.map(t => TOPIC_LABELS[t]).join(' · ')} — this quiz has more of those questions.
    </div>
  );
}

// ── Main QuizTab ───────────────────────────────────────────────────────────────

export default function QuizTab() {
  const [perf,    setPerf]    = useState<PerfMap>({});
  const [perfLoaded, setPerfLoaded] = useState(false);

  useEffect(() => {
    fetch('/api/quiz-results')
      .then(r => r.json())
      .then(data => {
        const map: PerfMap = {};
        for (const row of (data.performance ?? [])) {
          map[row.topic as Topic] = { correct_count: row.correct_count, wrong_count: row.wrong_count };
        }
        setPerf(map);
        setPerfLoaded(true);
      })
      .catch(() => setPerfLoaded(true));
  }, []);

  const questions = useMemo(() => perfLoaded ? buildQuestionPool(perf) : [], [perf, perfLoaded]);

  const [idx,      setIdx]      = useState(0);
  const [answered, setAnswered] = useState(false);
  const [correct,  setCorrect]  = useState(false);
  const [picked,   setPicked]   = useState<string | null>(null);
  const [score,    setScore]    = useState(0);
  const [done,     setDone]     = useState(false);
  const [kbKey,    setKbKey]    = useState(0);

  // Reset when questions load
  const prevQLen = useRef(0);
  useEffect(() => {
    if (questions.length > 0 && prevQLen.current === 0) {
      prevQLen.current = questions.length;
      setIdx(0); setAnswered(false); setCorrect(false); setPicked(null);
      setScore(0); setDone(false); setKbKey(k => k + 1);
    }
  }, [questions]);

  const q = questions[idx];
  const total = questions.length;

  const handleMCPick = useCallback((choice: string) => {
    if (answered || !q) return;
    const mq = q as MCQuestion;
    const isCorrect = choice === mq.answer;
    setPicked(choice);
    setAnswered(true);
    setCorrect(isCorrect);
    if (isCorrect) setScore(s => s + 1);
    reportResult(mq.topic, isCorrect);
  }, [answered, q]);

  const handleKBCorrect = useCallback(() => {
    if (!q) return;
    setAnswered(true);
    setCorrect(true);
    setScore(s => s + 1);
    reportResult((q as KeyboardQuestion).topic, true);
  }, [q]);

  const handleKBWrong = useCallback(() => {
    if (!q) return;
    setAnswered(true);
    setCorrect(false);
    reportResult((q as KeyboardQuestion).topic, false);
  }, [q]);

  const next = useCallback(() => {
    if (idx + 1 >= total) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
      setAnswered(false);
      setCorrect(false);
      setPicked(null);
      setKbKey(k => k + 1);
    }
  }, [idx, total]);

  const restart = useCallback(() => {
    // Re-fetch performance before rebuilding
    fetch('/api/quiz-results')
      .then(r => r.json())
      .then(data => {
        const map: PerfMap = {};
        for (const row of (data.performance ?? [])) {
          map[row.topic as Topic] = { correct_count: row.correct_count, wrong_count: row.wrong_count };
        }
        setPerf(map);
        prevQLen.current = 0;
      })
      .catch(() => { prevQLen.current = 0; });
    setIdx(0); setAnswered(false); setCorrect(false); setPicked(null);
    setScore(0); setDone(false); setKbKey(k => k + 1);
  }, []);

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };

  if (!perfLoaded || questions.length === 0) {
    return <div style={{ padding: '20px 0', fontSize: 13, color: 'var(--text3)' }}>Loading quiz...</div>;
  }

  if (done) {
    const pct = Math.round((score / total) * 100);
    const grade = pct >= 90 ? 'Sharp' : pct >= 75 ? 'Solid' : pct >= 60 ? 'Getting there' : 'Review the material';
    // Recompute weak topics from current perf for end-screen hint
    const weakTopics = (Object.entries(perf) as [Topic, TopicPerf][])
      .filter(([, p]) => p.wrong_count + p.correct_count >= 3 && p.wrong_count / (p.wrong_count + p.correct_count) >= 0.5)
      .sort(([, a], [, b]) => (b.wrong_count / (b.wrong_count + b.correct_count)) - (a.wrong_count / (a.wrong_count + a.correct_count)))
      .slice(0, 3);

    return (
      <div style={{ padding: '20px 0 80px' }}>
        <div style={{ ...card, textAlign: 'center', padding: 28 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: pct >= 75 ? 'var(--green)' : 'var(--amber)', marginBottom: 4 }}>
            {score}/{total}
          </div>
          <div style={{ fontSize: 16, color: 'var(--text2)', marginBottom: 20 }}>{pct}% — {grade}</div>

          {weakTopics.length > 0 && (
            <div style={{
              textAlign: 'left', marginBottom: 20, padding: '12px 14px', borderRadius: 8,
              background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.3)',
            }}>
              <div style={{ fontSize: 11, color: '#fb923c', fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
                Needs more work
              </div>
              {weakTopics.map(([t, p]) => {
                const total2 = p.correct_count + p.wrong_count;
                const pct2 = Math.round((p.correct_count / total2) * 100);
                return (
                  <div key={t} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                    <span style={{ fontSize: 12, color: 'var(--text2)' }}>{TOPIC_LABELS[t]}</span>
                    <span style={{ fontSize: 11, color: pct2 < 50 ? 'var(--red)' : 'var(--amber)' }}>{pct2}% correct</span>
                  </div>
                );
              })}
            </div>
          )}

          <button onClick={restart} style={{
            padding: '10px 24px', borderRadius: 8, fontSize: 14,
            background: 'var(--green)', color: 'var(--on-accent)', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
          }}>
            New Quiz
          </button>
          <QuickFeedback />
        </div>
      </div>
    );
  }

  if (!q) return null;

  const isKB = q.kind === 'keyboard';
  const kbColor = isKB ? (q as KeyboardQuestion).color : 'var(--green)';
  const typeLabel = isKB
    ? (q as KeyboardQuestion).subtype.replace('_', ' ')
    : TOPIC_LABELS[(q as MCQuestion).topic] ?? 'theory';

  return (
    <div style={{ padding: '0 0 80px' }}>
      <WeakTopicBanner perf={perf} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--text3)' }}>{idx + 1}/{total}</span>
          <span style={{
            fontSize: 10, padding: '2px 7px', borderRadius: 10,
            background: isKB ? `${kbColor}20` : 'var(--surface2)',
            color: isKB ? kbColor : 'var(--text3)',
            border: `1px solid ${isKB ? kbColor : 'var(--border)'}`,
          }}>
            {typeLabel}
          </span>
        </div>
        <div style={{ fontSize: 12, color: 'var(--green)' }}>
          {score}/{idx + (answered ? 1 : 0)}
        </div>
      </div>

      <div style={{ height: 3, background: 'var(--surface2)', borderRadius: 2, marginBottom: 14 }}>
        <div style={{
          height: '100%', borderRadius: 2, transition: 'width 0.3s',
          width: `${((idx + (answered ? 1 : 0)) / total) * 100}%`,
          background: isKB ? kbColor : 'var(--green)',
        }} />
      </div>

      <div style={{ ...card, minHeight: 64 }}>
        <div style={{ fontSize: 15, lineHeight: 1.5 }}>{q.prompt}</div>
        {isKB && (
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
            {(q as KeyboardQuestion).hint}
          </div>
        )}
        <ReportButton question={q} topic={q.kind === 'mc' ? (q as MCQuestion).topic : (q as KeyboardQuestion).topic} />
      </div>

      {!isKB && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(q as MCQuestion).choices.map((c, i) => {
            let bg = 'var(--surface)', border = 'var(--border)', color = 'var(--text)';
            if (answered) {
              if (c === (q as MCQuestion).answer) { bg = 'rgba(74,222,128,0.12)'; border = 'var(--green)'; color = 'var(--green)'; }
              else if (c === picked)              { bg = 'rgba(248,113,113,0.12)'; border = 'var(--red)';   color = 'var(--red)'; }
            }
            return (
              <button key={i} onClick={() => handleMCPick(c)} style={{
                padding: '12px 14px', borderRadius: 8, fontSize: 13, textAlign: 'left',
                background: bg, border: `1px solid ${border}`, color,
                cursor: answered ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}>
                <span style={{ color: 'var(--text3)', marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
                {c}
              </button>
            );
          })}
        </div>
      )}

      {isKB && (
        <div style={card}>
          <KeyboardQ
            key={kbKey}
            q={q as KeyboardQuestion}
            onCorrect={handleKBCorrect}
            onWrong={handleKBWrong}
          />
        </div>
      )}

      {answered && (
        <div style={{ marginTop: 10 }}>
          {!isKB && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 10,
              background: correct ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
              border: `1px solid ${correct ? 'var(--green)' : 'var(--red)'}`,
            }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: correct ? 'var(--green)' : 'var(--red)', marginBottom: correct ? 0 : 6 }}>
                {correct ? 'Correct!' : `Correct answer: ${(q as MCQuestion).answer}`}
              </div>
              {!correct && (q as MCQuestion).explanation && (
                <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.55 }}>
                  {(q as MCQuestion).explanation}
                </div>
              )}
            </div>
          )}
          <button onClick={next} style={{
            width: '100%', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            background: 'var(--green)', color: 'var(--on-accent)', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {idx + 1 >= total ? 'See Results' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
