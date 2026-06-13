'use client';
import { useState, useCallback, useMemo } from 'react';
import { NOTES, QUIZ_QUESTIONS, SCALE_FORMULAS, CHORD_TYPES, MODE_DATA, buildScale, buildChord } from '@/lib/theory';
import { playScaleUp, playChordTogether, playSingleNote } from '@/lib/audio';
import MiniKeyboard from '@/components/ui/MiniKeyboard';
import PianoKeys from '@/components/ui/PianoKeys';
import type { ScaleKey, ChordKey, ModeKey } from '@/types';

// ── Question types ──

interface MCQuestion {
  kind: 'mc';
  prompt: string;
  answer: string;
  choices: string[];
  explanation?: string;
}

interface KeyboardQuestion {
  kind: 'keyboard';
  subtype: 'scale' | 'chord' | 'interval' | 'chord_id';
  prompt: string;
  hint: string;
  color: string;
  root: string;
  correctNotes: string[];
  allNotes?: string[];     // for chord_id — show all, identify root
  label?: string;          // e.g. "C Major" for reveal
  referenceIdxs?: number[];
  referenceRoot?: number;
}

type AnyQuestion = MCQuestion | KeyboardQuestion;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function randomRoot(): string {
  return NOTES[Math.floor(Math.random() * 12)];
}

function generateKeyboardQuestions(): KeyboardQuestion[] {
  const qs: KeyboardQuestion[] = [];

  // Scale tap questions — one per scale type
  const scaleKeys = Object.keys(SCALE_FORMULAS) as ScaleKey[];
  for (const sk of scaleKeys) {
    const root = randomRoot();
    const formula = SCALE_FORMULAS[sk];
    const idxs = buildScale(root, formula.intervals);
    const notes = idxs.map(i => NOTES[i]);
    qs.push({
      kind: 'keyboard', subtype: 'scale',
      prompt: `Tap all notes of ${root} ${formula.label}`,
      hint: `${notes.length} notes — tap them in any order`,
      color: formula.color, root,
      correctNotes: notes,
      referenceIdxs: idxs,
      referenceRoot: idxs[0],
      label: `${root} ${formula.label}: ${notes.join(' · ')}`,
    });
  }

  // Chord tap questions — one per chord type
  const chordKeys = Object.keys(CHORD_TYPES) as ChordKey[];
  for (const ck of chordKeys) {
    const root = randomRoot();
    const chord = CHORD_TYPES[ck];
    const idxs = buildChord(root, chord.intervals);
    const notes = idxs.map(i => NOTES[i % 12]);
    const qualityColors: Record<string, string> = {
      maj: '#4ade80', min: '#818cf8', dim: '#f87171', aug: '#facc15', dom: '#fb923c', sus: '#22d3ee',
    };
    qs.push({
      kind: 'keyboard', subtype: 'chord',
      prompt: `Tap all notes of ${root}${chord.symbol} (${chord.label})`,
      hint: `${notes.length} notes — intervals: ${chord.intervals.join('-')} semitones`,
      color: qualityColors[chord.quality] || 'var(--green)', root,
      correctNotes: notes,
      referenceIdxs: idxs.map(i => i % 12),
      referenceRoot: idxs[0] % 12,
      label: `${root}${chord.symbol}: ${notes.join(' · ')}`,
    });
  }

  // Mode scale tap questions — a few modes
  const modeKeys = ['dorian', 'phrygian', 'lydian', 'mixolydian', 'aeolian'] as ModeKey[];
  for (const mk of modeKeys) {
    const root = randomRoot();
    const mode = MODE_DATA[mk];
    const idxs = buildScale(root, mode.intervals);
    const notes = idxs.map(i => NOTES[i]);
    qs.push({
      kind: 'keyboard', subtype: 'scale',
      prompt: `Tap all notes of ${root} ${mode.label}`,
      hint: `${notes.length} notes · ${mode.alterations}`,
      color: mode.color, root,
      correctNotes: notes,
      referenceIdxs: idxs,
      referenceRoot: idxs[0],
      label: `${root} ${mode.short}: ${notes.join(' · ')}`,
    });
  }

  // Interval questions — find a note at interval from root
  const intervals: Array<{ semitones: number; name: string }> = [
    { semitones: 2, name: 'major 2nd' },
    { semitones: 3, name: 'minor 3rd' },
    { semitones: 4, name: 'major 3rd' },
    { semitones: 5, name: 'perfect 4th' },
    { semitones: 7, name: 'perfect 5th' },
    { semitones: 9, name: 'major 6th' },
    { semitones: 10, name: 'minor 7th (♭7)' },
    { semitones: 11, name: 'major 7th' },
  ];
  for (const iv of intervals) {
    const root = randomRoot();
    const rootIdx = NOTES.indexOf(root as typeof NOTES[number]);
    const targetIdx = (rootIdx + iv.semitones) % 12;
    const targetNote = NOTES[targetIdx];
    qs.push({
      kind: 'keyboard', subtype: 'interval',
      prompt: `From ${root} — tap a ${iv.name} above`,
      hint: `+${iv.semitones} semitones from ${root}`,
      color: '#4d9ef7', root,
      correctNotes: [targetNote],
      referenceIdxs: [rootIdx],
      referenceRoot: rootIdx,
      label: `${root} + ${iv.semitones} semitones = ${targetNote}`,
    });
  }

  return qs;
}

function buildQuestionPool(): AnyQuestion[] {
  const mc: MCQuestion[] = QUIZ_QUESTIONS.map(q => ({
    kind: 'mc', prompt: q.q, answer: q.a, choices: q.c,
  }));
  const kb = generateKeyboardQuestions();
  // Interleave: roughly 60% MC, 40% keyboard
  const pool: AnyQuestion[] = [];
  const shuffledMC = shuffle(mc);
  const shuffledKB = shuffle(kb);
  let mi = 0, ki = 0;
  while (mi < shuffledMC.length || ki < shuffledKB.length) {
    if (mi < shuffledMC.length) pool.push(shuffledMC[mi++]);
    if (mi < shuffledMC.length) pool.push(shuffledMC[mi++]);
    if (ki < shuffledKB.length) pool.push(shuffledKB[ki++]);
  }
  return shuffle(pool).slice(0, 20);
}

// ── Keyboard question component ──

function KeyboardQ({
  q, onCorrect, onWrong,
}: {
  q: KeyboardQuestion;
  onCorrect: () => void;
  onWrong: () => void;
}) {
  const [tapped, setTapped] = useState<string[]>([]);
  const [wrongTaps, setWrongTaps] = useState<string[]>([]);
  const [solved, setSolved] = useState(false);
  const [failed, setFailed] = useState(false);
  const [revealed, setReveal] = useState(false);

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
  }, [tapped, wrongTaps, solved, failed, q, onCorrect, onWrong]);

  const correctSoFar = tapped.filter(n => q.correctNotes.includes(n));

  return (
    <div>
      <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
        {solved ? `All ${q.correctNotes.length} notes found!` :
         failed ? `Missed — correct notes shown below` :
         `${correctSoFar.length} / ${q.correctNotes.length} tapped`}
      </div>

      <MiniKeyboard
        onTap={tap}
        correctNotes={solved || failed ? q.correctNotes : correctSoFar}
        wrongNotes={wrongTaps}
      />

      {q.referenceIdxs && (solved || failed) && (
        <div style={{ marginTop: 10 }}>
          <PianoKeys
            highlightedNotes={q.referenceIdxs}
            rootNote={q.referenceRoot ?? 0}
            label="answer"
          />
        </div>
      )}

      {(solved || failed) && q.label && (
        <div style={{
          marginTop: 8, padding: '8px 10px', borderRadius: 6, fontSize: 12,
          background: 'var(--surface2)', color: 'var(--text2)',
        }}>
          {q.label}
        </div>
      )}
    </div>
  );
}

// ── Main QuizTab ──

export default function QuizTab() {
  const questions = useMemo(() => buildQuestionPool(), []);
  const [idx, setIdx] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);
  const [kbKey, setKbKey] = useState(0);

  const q = questions[idx];
  const total = questions.length;

  const handleMCPick = useCallback((choice: string) => {
    if (answered) return;
    const isCorrect = choice === (q as MCQuestion).answer;
    setPicked(choice);
    setAnswered(true);
    setCorrect(isCorrect);
    if (isCorrect) setScore(s => s + 1);
  }, [answered, q]);

  const handleKBCorrect = useCallback(() => {
    setAnswered(true);
    setCorrect(true);
    setScore(s => s + 1);
  }, []);

  const handleKBWrong = useCallback(() => {
    setAnswered(true);
    setCorrect(false);
  }, []);

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
    setIdx(0);
    setAnswered(false);
    setCorrect(false);
    setPicked(null);
    setScore(0);
    setDone(false);
    setKbKey(k => k + 1);
  }, []);

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };

  if (done) {
    const pct = Math.round((score / total) * 100);
    const grade = pct >= 90 ? 'Sharp' : pct >= 75 ? 'Solid' : pct >= 60 ? 'Getting there' : 'Review the material';
    return (
      <div style={{ padding: '20px 0 80px' }}>
        <div style={{ ...card, textAlign: 'center', padding: 28 }}>
          <div style={{ fontSize: 32, fontWeight: 700, color: pct >= 75 ? 'var(--green)' : 'var(--amber)', marginBottom: 4 }}>
            {score}/{total}
          </div>
          <div style={{ fontSize: 16, color: 'var(--text2)' }}>{pct}% — {grade}</div>
          <button onClick={restart} style={{
            marginTop: 20, padding: '10px 24px', borderRadius: 8, fontSize: 14,
            background: 'var(--green)', color: '#0a0f1e', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
          }}>
            New Quiz
          </button>
        </div>
      </div>
    );
  }

  const isKB = q.kind === 'keyboard';
  const kbColor = isKB ? (q as KeyboardQuestion).color : 'var(--green)';
  const typeLabel = isKB ? (q as KeyboardQuestion).subtype.replace('_', ' ') : 'theory';

  return (
    <div style={{ padding: '0 0 80px' }}>
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
        <div style={{ height: '100%', borderRadius: 2, transition: 'width 0.3s',
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
      </div>

      {/* MC question */}
      {!isKB && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {(q as MCQuestion).choices.map((c, i) => {
            let bg = 'var(--surface)', border = 'var(--border)', color = 'var(--text)';
            if (answered) {
              if (c === (q as MCQuestion).answer) { bg = 'rgba(74,222,128,0.12)'; border = 'var(--green)'; color = 'var(--green)'; }
              else if (c === picked) { bg = 'rgba(248,113,113,0.12)'; border = 'var(--red)'; color = 'var(--red)'; }
            }
            return (
              <button key={i} onClick={() => handleMCPick(c)}
                style={{
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

      {/* Keyboard question */}
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

      {/* Result + next */}
      {answered && (
        <div style={{ marginTop: 10 }}>
          {!isKB && (
            <div style={{
              padding: '10px 14px', borderRadius: 8, marginBottom: 10, fontSize: 13,
              background: correct ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
              border: `1px solid ${correct ? 'var(--green)' : 'var(--red)'}`,
              color: correct ? 'var(--green)' : 'var(--red)',
            }}>
              {correct ? 'Correct!' : `Answer: ${(q as MCQuestion).answer}`}
            </div>
          )}
          <button onClick={next} style={{
            width: '100%', padding: '12px', borderRadius: 8, fontSize: 14, fontWeight: 700,
            background: 'var(--green)', color: '#0a0f1e', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            {idx + 1 >= total ? 'See Results' : 'Next'}
          </button>
        </div>
      )}
    </div>
  );
}
