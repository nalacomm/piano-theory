'use client';
import { useState, useEffect } from 'react';

export default function QuickFeedback() {
  const [visible, setVisible] = useState(false);
  const [hovered, setHovered] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (localStorage.getItem('piano_feedback_given') !== 'true') {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  async function pick(n: number) {
    setSubmitted(true);
    localStorage.setItem('piano_feedback_given', 'true');
    fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: n, suggestion: '' }),
    });
  }

  return (
    <div style={{
      marginTop: 14, padding: '12px 14px', borderRadius: 10,
      background: 'var(--surface2)', border: '1px solid var(--border)',
      textAlign: 'center',
    }}>
      {submitted ? (
        <div style={{ fontSize: 13, color: 'var(--green)', fontWeight: 700 }}>
          Thanks for the feedback!
        </div>
      ) : (
        <>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>
            Enjoying the app?
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4 }}>
            {[1, 2, 3, 4, 5].map(n => (
              <button
                key={n}
                onClick={() => pick(n)}
                onMouseEnter={() => setHovered(n)}
                onMouseLeave={() => setHovered(0)}
                style={{
                  fontSize: 26, background: 'none', border: 'none',
                  cursor: 'pointer', padding: '0 3px',
                  color: n <= hovered ? 'var(--amber)' : 'var(--text3)',
                  transition: 'color 0.1s',
                }}
              >
                ★
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
