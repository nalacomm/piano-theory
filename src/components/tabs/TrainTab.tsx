'use client';
import { useState, useCallback } from 'react';
import { NOTES, SCALE_FORMULAS, CHORD_TYPES, MODE_DATA, buildScale, buildChord, getParentRoot } from '@/lib/theory';
import { selectNextQuestion, computeWeakAreas, topicMasteryStats, getLevelName, getLevelThreshold } from '@/lib/student';
import { getReteachExplanation } from '@/lib/ai';
import { playScaleUp, playChordTogether, playSingleNote } from '@/lib/audio';
import { useStudent } from '@/hooks/useStudent';
import MiniKeyboard from '@/components/ui/MiniKeyboard';
import PianoKeys from '@/components/ui/PianoKeys';
import type { TrainPhase, Activity, ModeKey, ScaleKey, ChordKey } from '@/types';

const TOPICS = ['modes', 'scales', 'chords', 'numbers'] as const;

function generateActivity(weakAreas: string[]): Activity {
  const types = ['scale_builder', 'chord_completer', 'mode_parent', 'degree_tap'] as const;
  const type = types[Math.floor(Math.random() * types.length)];
  const root = NOTES[Math.floor(Math.random() * 12)];

  if (type === 'scale_builder') {
    const keys = Object.keys(SCALE_FORMULAS) as ScaleKey[];
    const scaleKey = keys[Math.floor(Math.random() * keys.length)];
    const formula = SCALE_FORMULAS[scaleKey];
    const idxs = buildScale(root, formula.intervals);
    return {
      type, root, color: formula.color, scaleKey,
      scaleName: formula.label,
      scaleIdxs: idxs,
      correctNotes: idxs.map(i => NOTES[i]),
      prompt: `Tap all notes of ${root} ${formula.label}`,
      hint: `${idxs.length} notes`,
    };
  }

  if (type === 'chord_completer') {
    const keys = Object.keys(CHORD_TYPES) as ChordKey[];
    const chordKey = keys[Math.floor(Math.random() * keys.length)];
    const chord = CHORD_TYPES[chordKey];
    const idxs = buildChord(root, chord.intervals);
    const missingCount = chord.intervals.length > 3 ? 2 : 1;
    const missingIdxs = [];
    const available = [...Array(idxs.length).keys()].slice(1);
    for (let i = 0; i < missingCount && available.length; i++) {
      const ri = Math.floor(Math.random() * available.length);
      missingIdxs.push(available.splice(ri, 1)[0]);
    }
    return {
      type, root, color: '#f87171', chordKey, symbol: chord.symbol,
      chordName: chord.label,
      scaleIdxs: idxs,
      correctNotes: missingIdxs.map(i => NOTES[idxs[i] % 12]),
      missingIdxs,
      prompt: `Complete ${root}${chord.symbol} — tap the missing note${missingCount > 1 ? 's' : ''}`,
      hint: `${chord.label} = ${chord.intervals.map((_, i) => ['R','3','5','7'][i]).join('-')}`,
    };
  }

  if (type === 'mode_parent') {
    const modeKeys = Object.keys(MODE_DATA) as ModeKey[];
    const modeKey = modeKeys[Math.floor(Math.random() * modeKeys.length)];
    const mode = MODE_DATA[modeKey];
    const parentRoot = getParentRoot(root, modeKey);
    return {
      type, root, color: mode.color, modeKey,
      modeShort: mode.short, parentRoot,
      choices: NOTES.map(n => n),
      prompt: `${root} ${mode.short} — tap the parent major key root`,
      hint: `${mode.short} lives on degree ${mode.parentDegree}`,
    };
  }

  // degree_tap
  const scaleKey: ScaleKey = 'major';
  const idxs = buildScale(root, SCALE_FORMULAS.major.intervals);
  const degreeNum = Math.floor(Math.random() * 7) + 1;
  const targetIdx = idxs[degreeNum - 1];
  const targetNote = NOTES[targetIdx];
  return {
    type: 'degree_tap', root, color: '#facc15', scaleKey,
    scaleIdxs: idxs,
    targetNote,
    targetDeg: `${degreeNum}`,
    correctNotes: [targetNote],
    prompt: `In ${root} major — tap scale degree ${degreeNum}`,
    hint: `Count up from ${root}`,
  };
}

export default function TrainTab() {
  const { student, recordAnswer, reset } = useStudent();
  const [phase, setPhase] = useState<TrainPhase>('home');
  const [currentQ, setCurrentQ] = useState(() => selectNextQuestion(student));
  const [picked, setPicked] = useState<string | null>(null);
  const [activity, setActivity] = useState<Activity | null>(null);
  const [actTapped, setActTapped] = useState<string[]>([]);
  const [actResult, setActResult] = useState<'correct' | 'wrong' | null>(null);
  const [reteachText, setReteachText] = useState('');
  const [reteachLoading, setReteachLoading] = useState(false);

  const { weak } = computeWeakAreas(student.questionHistory);

  const startQuestion = useCallback(() => {
    const q = selectNextQuestion(student, currentQ.id);
    setCurrentQ(q);
    setPicked(null);
    setPhase('question');
  }, [student, currentQ.id]);

  const pickAnswer = useCallback((choice: string) => {
    if (picked) return;
    setPicked(choice);
    const correct = choice === currentQ.a;
    recordAnswer(currentQ.id, correct, currentQ.diff);
    setPhase('result');
  }, [picked, currentQ, recordAnswer]);

  const startActivity = useCallback(() => {
    const act = generateActivity(weak);
    setActivity(act);
    setActTapped([]);
    setActResult(null);
    setPhase('activity');
  }, [weak]);

  const tapKey = useCallback((note: string) => {
    if (!activity || actResult) return;

    if (activity.type === 'mode_parent') {
      const correct = note === activity.parentRoot;
      setActResult(correct ? 'correct' : 'wrong');
      setActTapped([note]);
      return;
    }

    if (activity.type === 'degree_tap') {
      const correct = note === activity.targetNote;
      setActResult(correct ? 'correct' : 'wrong');
      setActTapped([note]);
      playSingleNote(note);
      return;
    }

    if (activity.type === 'scale_builder') {
      if (actTapped.includes(note)) return;
      const correct = activity.correctNotes!.includes(note);
      if (!correct) { setActResult('wrong'); return; }
      const newTapped = [...actTapped, note];
      playSingleNote(note);
      setActTapped(newTapped);
      if (newTapped.length === activity.correctNotes!.length) {
        setActResult('correct');
        playScaleUp(activity.correctNotes!);
      }
      return;
    }

    if (activity.type === 'chord_completer') {
      if (actTapped.includes(note)) return;
      const correct = activity.correctNotes!.includes(note);
      if (!correct) { setActResult('wrong'); return; }
      const newTapped = [...actTapped, note];
      playSingleNote(note);
      setActTapped(newTapped);
      if (newTapped.length === activity.correctNotes!.length) {
        setActResult('correct');
        playChordTogether(activity.scaleIdxs!.map(i => NOTES[i % 12]));
      }
    }
  }, [activity, actTapped, actResult]);

  const loadReteach = useCallback(async () => {
    setPhase('reteach');
    setReteachLoading(true);
    setReteachText('');
    try {
      const wrongQs = Object.entries(student.questionHistory)
        .filter(([, h]) => h.wrong > h.correct)
        .map(([id]) => {
          const q = currentQ.id === id ? currentQ : null;
          return q ? q.q : id;
        })
        .filter(Boolean)
        .slice(0, 3) as string[];
      const text = await getReteachExplanation(weak, wrongQs);
      setReteachText(text);
    } catch {
      setReteachText('Unable to load explanation. Check your API key.');
    } finally {
      setReteachLoading(false);
    }
  }, [student.questionHistory, weak, currentQ]);

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };

  const xpToNext = getLevelThreshold(student.level + 1) - getLevelThreshold(student.level);
  const xpInLevel = student.xp - getLevelThreshold(student.level);
  const xpPct = Math.min(100, Math.round((xpInLevel / xpToNext) * 100));

  // ── HOME ──
  if (phase === 'home') {
    return (
      <div style={{ padding: '0 0 80px' }}>
        <div style={{ ...card, borderLeft: '3px solid var(--amber)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--amber)' }}>
                Lv.{student.level} {getLevelName(student.level)}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                {student.xp} XP · streak {student.currentStreak} · {student.totalAnswered} answered
              </div>
            </div>
            <button onClick={reset} style={{ fontSize: 10, color: 'var(--text3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Reset
            </button>
          </div>
          <div style={{ height: 4, background: 'var(--surface2)', borderRadius: 2, marginTop: 8 }}>
            <div style={{ height: '100%', background: 'var(--amber)', borderRadius: 2, width: `${xpPct}%`, transition: 'width 0.4s' }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)', marginTop: 4 }}>{xpInLevel}/{xpToNext} XP to next level</div>
        </div>

        {weak.length > 0 && (
          <div style={{ ...card, background: 'rgba(248,113,113,0.05)', borderColor: 'var(--red)' }}>
            <div style={{ fontSize: 12, color: 'var(--red)', marginBottom: 4 }}>Weak areas: {weak.join(', ')}</div>
            <button onClick={loadReteach} style={{
              fontSize: 12, color: 'var(--red)', background: 'none',
              border: '1px solid var(--red)', borderRadius: 6,
              padding: '4px 10px', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Re-Teach Me
            </button>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          {TOPICS.map(t => {
            const stats = topicMasteryStats(t, student.questionHistory);
            return (
              <div key={t} style={{ ...card, marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, textTransform: 'capitalize' }}>{t}</span>
                  <span style={{ fontSize: 11, color: 'var(--text3)' }}>{stats.pct}% · {stats.seen}/{stats.total}</span>
                </div>
                <div style={{ height: 3, background: 'var(--surface2)', borderRadius: 2 }}>
                  <div style={{ height: '100%', borderRadius: 2, width: `${stats.pct}%`, transition: 'width 0.4s',
                    background: stats.pct >= 80 ? 'var(--green)' : stats.pct >= 50 ? 'var(--amber)' : 'var(--red)' }} />
                </div>
              </div>
            );
          })}
        </div>

        <button onClick={startQuestion} style={{
          width: '100%', padding: '14px', borderRadius: 10, fontSize: 16, fontWeight: 700,
          background: 'var(--green)', color: '#0a0f1e', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8,
        }}>
          Start Training
        </button>
        <button onClick={startActivity} style={{
          width: '100%', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
          background: 'transparent', color: 'var(--blue)', border: '1px solid var(--blue)',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Interactive Activity
        </button>
      </div>
    );
  }

  // ── QUESTION ──
  if (phase === 'question') {
    const topicColor: Record<string, string> = { modes: '#34d399', scales: '#818cf8', chords: '#f87171', numbers: '#facc15' };
    const color = topicColor[currentQ.topic] || 'var(--green)';
    return (
      <div style={{ padding: '0 0 80px' }}>
        <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
          <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 11, background: `${color}20`, color, border: `1px solid ${color}` }}>
            {currentQ.topic}
          </span>
          <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 11, background: 'var(--surface2)', color: 'var(--text3)' }}>
            {'★'.repeat(currentQ.diff)}{'☆'.repeat(3 - currentQ.diff)}
          </span>
        </div>

        <div style={{ ...card, minHeight: 80 }}>
          <div style={{ fontSize: 16, lineHeight: 1.5 }}>{currentQ.q}</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {currentQ.choices.map((c, i) => (
            <button key={i} onClick={() => pickAnswer(c)}
              style={{
                padding: '12px 14px', borderRadius: 8, fontSize: 13, textAlign: 'left',
                background: 'var(--surface)', border: '1px solid var(--border)',
                color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit',
              }}>
              <span style={{ color: 'var(--text3)', marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
              {c}
            </button>
          ))}
        </div>

        <button onClick={() => setPhase('home')} style={{
          marginTop: 12, fontSize: 12, color: 'var(--text3)', background: 'none',
          border: 'none', cursor: 'pointer', fontFamily: 'inherit',
        }}>
          ← Back
        </button>
      </div>
    );
  }

  // ── RESULT ──
  if (phase === 'result') {
    const correct = picked === currentQ.a;
    return (
      <div style={{ padding: '0 0 80px' }}>
        <div style={{
          ...card,
          borderLeft: `3px solid ${correct ? 'var(--green)' : 'var(--red)'}`,
          background: correct ? 'rgba(74,222,128,0.05)' : 'rgba(248,113,113,0.05)',
        }}>
          <div style={{ fontSize: 16, fontWeight: 700, color: correct ? 'var(--green)' : 'var(--red)', marginBottom: 6 }}>
            {correct ? `+${currentQ.diff * 10 + (student.currentStreak >= 2 ? 5 : 0)} XP` : 'Wrong'}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{currentQ.explanation}</div>
          {!correct && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--green)' }}>
              Correct: <strong>{currentQ.a}</strong>
            </div>
          )}
        </div>

        <button onClick={startQuestion} style={{
          width: '100%', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700,
          background: 'var(--green)', color: '#0a0f1e', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8,
        }}>
          Next Question
        </button>
        <button onClick={startActivity} style={{
          width: '100%', padding: '11px', borderRadius: 10, fontSize: 13,
          background: 'transparent', color: 'var(--blue)', border: '1px solid var(--blue)',
          cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8,
        }}>
          Do an Activity Instead
        </button>
        <button onClick={() => setPhase('home')} style={{
          width: '100%', padding: '10px', borderRadius: 10, fontSize: 12,
          background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border)',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Home
        </button>
      </div>
    );
  }

  // ── RETEACH ──
  if (phase === 'reteach') {
    return (
      <div style={{ padding: '0 0 80px' }}>
        <div style={{ ...card, borderLeft: '3px solid var(--purple)' }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--purple)', marginBottom: 8 }}>
            Re-Teach: {weak.join(', ') || 'general review'}
          </div>
          {reteachLoading ? (
            <div style={{ color: 'var(--text3)', fontSize: 13 }}>Generating fresh explanation...</div>
          ) : (
            <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{reteachText}</div>
          )}
        </div>
        <button onClick={startQuestion} style={{
          width: '100%', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700,
          background: 'var(--green)', color: '#0a0f1e', border: 'none',
          cursor: 'pointer', fontFamily: 'inherit', marginBottom: 8,
        }}>
          Start Training
        </button>
        <button onClick={() => setPhase('home')} style={{
          width: '100%', padding: '10px', borderRadius: 10, fontSize: 12,
          background: 'transparent', color: 'var(--text3)', border: '1px solid var(--border)',
          cursor: 'pointer', fontFamily: 'inherit',
        }}>
          Back
        </button>
      </div>
    );
  }

  // ── ACTIVITY ──
  if (phase === 'activity' && activity) {
    const correctNotes = activity.correctNotes || [];
    const wrongTapped = actTapped.filter(n => !correctNotes.includes(n));

    const highlightNotes =
      activity.type === 'mode_parent' ? (activity.parentRoot ? [activity.parentRoot] : []) :
      activity.type === 'degree_tap' ? (activity.targetNote ? [activity.targetNote] : []) :
      activity.scaleIdxs ? activity.scaleIdxs.slice(0, activity.missingIdxs ? undefined : -1).map(i => NOTES[i % 12]) : [];

    return (
      <div style={{ padding: '0 0 80px' }}>
        <div style={{ ...card, borderLeft: `3px solid ${activity.color}` }}>
          <div style={{ fontSize: 15, fontWeight: 700, marginBottom: 4 }}>{activity.prompt}</div>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>{activity.hint}</div>
        </div>

        {activity.type === 'mode_parent' ? (
          <div style={{ ...card }}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>Tap the parent major key root</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {NOTES.map(n => {
                const isTapped = actTapped.includes(n);
                const isCorrect = n === activity.parentRoot;
                let bg = 'var(--surface2)', border = 'var(--border)', color = 'var(--text)';
                if (isTapped && actResult) {
                  bg = isCorrect ? 'rgba(74,222,128,0.2)' : 'rgba(248,113,113,0.2)';
                  border = isCorrect ? 'var(--green)' : 'var(--red)';
                  color = isCorrect ? 'var(--green)' : 'var(--red)';
                } else if (actResult && isCorrect) {
                  bg = 'rgba(74,222,128,0.2)'; border = 'var(--green)'; color = 'var(--green)';
                }
                return (
                  <button key={n} onClick={() => tapKey(n)} style={{
                    padding: '8px 12px', borderRadius: 6, fontSize: 13, fontWeight: 600,
                    background: bg, border: `1px solid ${border}`, color,
                    cursor: actResult ? 'default' : 'pointer', fontFamily: 'inherit',
                  }}>{n}</button>
                );
              })}
            </div>
          </div>
        ) : (
          <div style={card}>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
              {activity.type === 'scale_builder' && `Tap: ${actTapped.length}/${correctNotes.length} notes`}
              {activity.type === 'chord_completer' && `Tap missing: ${actTapped.filter(n => correctNotes.includes(n)).length}/${correctNotes.length}`}
              {activity.type === 'degree_tap' && 'Tap the note'}
            </div>
            <MiniKeyboard
              onTap={tapKey}
              highlightNotes={!actResult ? highlightNotes : []}
              correctNotes={actTapped.filter(n => correctNotes.includes(n))}
              wrongNotes={wrongTapped}
            />
            {activity.scaleIdxs && (
              <div style={{ marginTop: 8 }}>
                <PianoKeys
                  highlightedNotes={activity.scaleIdxs.map(i => i % 12)}
                  rootNote={NOTES.indexOf(activity.root as typeof NOTES[number])}
                  label="reference"
                />
              </div>
            )}
          </div>
        )}

        {actResult && (
          <div style={{
            ...card,
            borderLeft: `3px solid ${actResult === 'correct' ? 'var(--green)' : 'var(--red)'}`,
            background: actResult === 'correct' ? 'rgba(74,222,128,0.05)' : 'rgba(248,113,113,0.05)',
            marginBottom: 10,
          }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: actResult === 'correct' ? 'var(--green)' : 'var(--red)', marginBottom: 4 }}>
              {actResult === 'correct' ? 'Correct!' : `Wrong — answer: ${correctNotes.join(', ')}`}
            </div>
          </div>
        )}

        {actResult ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <button onClick={startActivity} style={{
              width: '100%', padding: '13px', borderRadius: 10, fontSize: 15, fontWeight: 700,
              background: activity.color, color: '#0a0f1e', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Next Activity
            </button>
            <button onClick={startQuestion} style={{
              width: '100%', padding: '11px', borderRadius: 10, fontSize: 13,
              background: 'transparent', color: 'var(--green)', border: '1px solid var(--green)',
              cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Switch to Questions
            </button>
          </div>
        ) : (
          <button onClick={() => setPhase('home')} style={{
            fontSize: 12, color: 'var(--text3)', background: 'none',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}>
            ← Back
          </button>
        )}
      </div>
    );
  }

  return null;
}
