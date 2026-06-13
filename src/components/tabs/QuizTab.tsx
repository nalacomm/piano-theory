'use client';
import { useState, useCallback } from 'react';
import { QUIZ_QUESTIONS } from '@/lib/theory';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function QuizTab() {
  const [questions] = useState(() => shuffle(QUIZ_QUESTIONS));
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string | null>(null);
  const [score, setScore] = useState(0);
  const [done, setDone] = useState(false);

  const q = questions[idx];
  const choices = q.c;

  const pick = useCallback((c: string) => {
    if (picked) return;
    setPicked(c);
    if (c === q.a) setScore(s => s + 1);
  }, [picked, q.a]);

  const next = useCallback(() => {
    if (idx + 1 >= questions.length) {
      setDone(true);
    } else {
      setIdx(i => i + 1);
      setPicked(null);
    }
  }, [idx, questions.length]);

  const restart = useCallback(() => {
    setIdx(0);
    setPicked(null);
    setScore(0);
    setDone(false);
  }, []);

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };

  if (done) {
    const pct = Math.round((score / questions.length) * 100);
    const grade = pct >= 90 ? 'Excellent' : pct >= 75 ? 'Good' : pct >= 60 ? 'Keep going' : 'Review the material';
    return (
      <div style={{ padding: '20px 0 80px' }}>
        <div style={{ ...card, textAlign: 'center', padding: 28 }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>
            {pct >= 90 ? '🎯' : pct >= 75 ? '✓' : '◎'}
          </div>
          <div style={{ fontSize: 32, fontWeight: 700, color: pct >= 75 ? 'var(--green)' : 'var(--amber)' }}>
            {score}/{questions.length}
          </div>
          <div style={{ fontSize: 16, color: 'var(--text2)', marginTop: 4 }}>{pct}% — {grade}</div>
          <button
            onClick={restart}
            style={{
              marginTop: 20, padding: '10px 24px', borderRadius: 8, fontSize: 14,
              background: 'var(--green)', color: '#0a0f1e', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
            }}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 0 80px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>
          Question {idx + 1} of {questions.length}
        </div>
        <div style={{ fontSize: 12, color: 'var(--green)' }}>
          Score: {score}/{idx + (picked ? 1 : 0)}
        </div>
      </div>

      <div style={{ height: 3, background: 'var(--surface2)', borderRadius: 2, marginBottom: 16 }}>
        <div style={{ height: '100%', background: 'var(--green)', borderRadius: 2, width: `${((idx + (picked ? 1 : 0)) / questions.length) * 100}%`, transition: 'width 0.3s' }} />
      </div>

      <div style={{ ...card, minHeight: 80 }}>
        <div style={{ fontSize: 16, lineHeight: 1.5, color: 'var(--text)' }}>{q.q}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {choices.map((c, i) => {
          let bg = 'var(--surface)';
          let borderColor = 'var(--border)';
          let textColor = 'var(--text)';
          if (picked) {
            if (c === q.a) { bg = 'rgba(74,222,128,0.12)'; borderColor = 'var(--green)'; textColor = 'var(--green)'; }
            else if (c === picked) { bg = 'rgba(248,113,113,0.12)'; borderColor = 'var(--red)'; textColor = 'var(--red)'; }
          }
          return (
            <button key={i} onClick={() => pick(c)}
              style={{
                padding: '12px 14px', borderRadius: 8, fontSize: 13, textAlign: 'left',
                background: bg, border: `1px solid ${borderColor}`, color: textColor,
                cursor: picked ? 'default' : 'pointer', fontFamily: 'inherit',
                transition: 'all 0.15s',
              }}>
              <span style={{ color: 'var(--text3)', marginRight: 8 }}>{String.fromCharCode(65 + i)}.</span>
              {c}
            </button>
          );
        })}
      </div>

      {picked && (
        <div style={{ marginTop: 12 }}>
          <div style={{
            padding: '10px 14px', borderRadius: 8, marginBottom: 10,
            background: picked === q.a ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${picked === q.a ? 'var(--green)' : 'var(--red)'}`,
            fontSize: 13, color: picked === q.a ? 'var(--green)' : 'var(--red)',
          }}>
            {picked === q.a ? 'Correct!' : `Correct answer: ${q.a}`}
          </div>
          <button
            onClick={next}
            style={{
              width: '100%', padding: '12px', borderRadius: 8, fontSize: 14,
              background: 'var(--green)', color: '#0a0f1e', border: 'none',
              cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
            }}>
            {idx + 1 >= questions.length ? 'See Results' : 'Next Question'}
          </button>
        </div>
      )}
    </div>
  );
}
