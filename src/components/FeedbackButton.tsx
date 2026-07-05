'use client';
import { useState, useCallback, useEffect } from 'react';

export default function FeedbackButton() {
  const [open, setOpen] = useState(false);
  const [hasRated, setHasRated] = useState(false);
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [suggestion, setSuggestion] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const alreadySubmitted = localStorage.getItem('piano_feedback_given') === 'true';
    if (alreadySubmitted) {
      setHasRated(true);
      return;
    }

    const prev = parseInt(localStorage.getItem('piano_visit_count') ?? '0', 10);
    const next = prev + 1;
    localStorage.setItem('piano_visit_count', String(next));
    if (next % 5 === 0) {
      setTimeout(() => setOpen(true), 1500);
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (saving) return;
    if (!hasRated && !rating) return;
    if (!hasRated && !suggestion.trim() && !rating) return;
    setSaving(true);
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rating: rating || null, suggestion }),
    });
    setSaving(false);
    if (!hasRated) {
      localStorage.setItem('piano_feedback_given', 'true');
      setHasRated(true);
    }
    setSubmitted(true);
  }, [rating, suggestion, saving, hasRated]);

  const handleClose = () => {
    setOpen(false);
    setTimeout(() => {
      setSuggestion('');
      setSubmitted(false);
    }, 300);
  };

  const canSubmit = hasRated ? suggestion.trim().length > 0 : rating > 0;

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setOpen(true)}
        style={{
          position: 'fixed', bottom: 24, right: 16, zIndex: 50,
          width: 44, height: 44, borderRadius: '50%',
          background: 'var(--surface2)', border: '1px solid var(--border)',
          color: 'var(--text3)', fontSize: 18, cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 12px rgba(0,0,0,0.4)',
        }}
        title="Give feedback"
      >
        💬
      </button>

      {/* Backdrop */}
      {open && (
        <div
          onClick={handleClose}
          style={{
            position: 'fixed', inset: 0, zIndex: 51,
            background: 'rgba(0,0,0,0.5)',
          }}
        />
      )}

      {/* Sheet */}
      <div style={{
        position: 'fixed', bottom: 0, left: '50%',
        width: '100%', maxWidth: 520, zIndex: 52,
        background: 'var(--surface)', borderTop: '1px solid var(--border)',
        borderRadius: '16px 16px 0 0',
        padding: '20px 20px 36px',
        transition: 'transform 0.25s ease',
        transform: open ? 'translateX(-50%) translateY(0)' : 'translateX(-50%) translateY(110%)',
        fontFamily: "'Courier New', Courier, monospace",
      }}>
        {/* Handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'var(--border)', margin: '0 auto 18px',
        }} />

        {submitted ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <div style={{ fontSize: 28, marginBottom: 10 }}>🙏</div>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)', marginBottom: 6 }}>
              {hasRated ? 'Comment sent!' : 'Thanks for the feedback!'}
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 20 }}>
              It helps make the app better for everyone.
            </div>
            <button onClick={handleClose} style={{
              padding: '9px 24px', borderRadius: 8, fontSize: 13,
              background: 'var(--green)', color: '#0a0f1e',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
            }}>
              Done
            </button>
          </div>
        ) : (
          <>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
              {hasRated ? 'Leave a comment' : 'How is the app?'}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16 }}>
              {hasRated ? 'Suggestions are always welcome.' : 'Your feedback shapes what gets built next.'}
            </div>

            {/* Stars — only shown before first rating */}
            {!hasRated && (
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[1,2,3,4,5].map(n => (
                  <button
                    key={n}
                    onClick={() => setRating(n)}
                    onMouseEnter={() => setHovered(n)}
                    onMouseLeave={() => setHovered(0)}
                    style={{
                      fontSize: 28, background: 'none', border: 'none',
                      cursor: 'pointer', padding: 0,
                      color: n <= (hovered || rating) ? 'var(--amber)' : 'var(--text3)',
                      transition: 'color 0.1s',
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            )}

            <textarea
              value={suggestion}
              onChange={e => setSuggestion(e.target.value)}
              placeholder={hasRated ? 'What would you like to see?' : 'What would make this better? (optional)'}
              rows={3}
              style={{
                width: '100%', padding: '10px 12px', borderRadius: 8, fontSize: 13,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text)', fontFamily: 'inherit', resize: 'none',
                outline: 'none', boxSizing: 'border-box',
              }}
            />

            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={handleClose} style={{
                flex: 1, padding: '10px', borderRadius: 8, fontSize: 13,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!canSubmit || saving}
                style={{
                  flex: 2, padding: '10px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  background: canSubmit ? 'var(--green)' : 'var(--surface2)',
                  color: canSubmit ? '#0a0f1e' : 'var(--text3)',
                  border: 'none', cursor: canSubmit ? 'pointer' : 'default',
                  fontFamily: 'inherit', transition: 'all 0.15s',
                }}
              >
                {saving ? 'Sending...' : hasRated ? 'Send Comment' : 'Send Feedback'}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
