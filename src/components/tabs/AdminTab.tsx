'use client';
import { useState, useEffect } from 'react';

interface UserRow {
  user_email: string;
  lesson_completions: string[];
  updated_at: string;
}

interface FeedbackRow {
  id: number;
  user_email: string;
  rating: number | null;
  suggestion: string | null;
  created_at: string;
}

interface IssueRow {
  id: number;
  user_email: string | null;
  question_prompt: string;
  question_topic: string | null;
  note: string | null;
  resolved: boolean;
  created_at: string;
}

const TOTAL_LESSONS = 22;

const TOPIC_COLORS: Record<string, string> = {
  modes: '#34d399', scales: '#fb923c', chords: '#4ade80',
  intervals: '#4d9ef7', notation: '#34d399', numbers: '#22d3ee',
};

export default function AdminTab() {
  const [users,     setUsers]     = useState<UserRow[]>([]);
  const [feedback,  setFeedback]  = useState<FeedbackRow[]>([]);
  const [issues,    setIssues]    = useState<IssueRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<'users' | 'feedback' | 'issues'>('users');

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/users').then(r => r.json()),
      fetch('/api/admin/feedback').then(r => r.json()),
      fetch('/api/issues').then(r => r.json()),
    ]).then(([userData, feedbackData, issueData]) => {
      setUsers(userData.users ?? []);
      setFeedback(feedbackData.feedback ?? []);
      setIssues(issueData.issues ?? []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  async function toggleResolved(issue: IssueRow) {
    const next = !issue.resolved;
    setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, resolved: next } : i));
    try {
      await fetch('/api/issues', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: issue.id, resolved: next }),
      });
    } catch {
      // Revert on error
      setIssues(prev => prev.map(i => i.id === issue.id ? { ...i, resolved: issue.resolved } : i));
    }
  }

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };

  const ratedRows = feedback.filter(f => f.rating !== null);
  const avgRating = ratedRows.length
    ? (ratedRows.reduce((s, f) => s + (f.rating ?? 0), 0) / ratedRows.length).toFixed(1)
    : null;

  const openIssues = issues.filter(i => !i.resolved).length;

  if (loading) {
    return <div style={{ padding: '20px 0', fontSize: 13, color: 'var(--text3)' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '0 0 80px' }}>
      {/* Summary row */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
        <div style={{ ...card, flex: 1, marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--green)' }}>{users.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Users</div>
        </div>
        <div style={{ ...card, flex: 1, marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)' }}>{feedback.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Ratings</div>
        </div>
        <div style={{ ...card, flex: 1, marginBottom: 0, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 700, color: 'var(--amber)' }}>
            {avgRating ?? '—'}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>Avg ★</div>
        </div>
      </div>

      {/* Section toggle */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        {(['users', 'feedback', 'issues'] as const).map(s => {
          const label = s === 'users'
            ? `Users (${users.length})`
            : s === 'feedback'
            ? `Feedback (${feedback.length})`
            : `Issues (${openIssues} open)`;
          const active = activeSection === s;
          return (
            <button key={s} onClick={() => setActiveSection(s)} style={{
              padding: '5px 14px', borderRadius: 16, fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit',
              background: active ? 'var(--blue)' : 'var(--surface)',
              color: active ? '#0a0f1e' : 'var(--text2)',
              border: `1px solid ${active ? 'var(--blue)' : 'var(--border)'}`,
              position: 'relative',
            }}>
              {label}
              {s === 'issues' && openIssues > 0 && !active && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  width: 8, height: 8, borderRadius: '50%',
                  background: 'var(--red)',
                }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Users */}
      {activeSection === 'users' && users.length === 0 && (
        <div style={{ ...card, color: 'var(--text3)', fontSize: 13 }}>No users yet.</div>
      )}
      {activeSection === 'users' && users.map(u => {
        const count = u.lesson_completions?.length ?? 0;
        const pct = Math.round((count / TOTAL_LESSONS) * 100);
        const isOpen = expanded === u.user_email;
        const lastActive = new Date(u.updated_at).toLocaleDateString('en-US', {
          month: 'short', day: 'numeric', year: 'numeric',
        });
        return (
          <div key={u.user_email} style={card}>
            <button
              onClick={() => setExpanded(isOpen ? null : u.user_email)}
              style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit', textAlign: 'left' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', wordBreak: 'break-all' }}>{u.user_email}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>Last active: {lastActive}</div>
                </div>
                <div style={{ textAlign: 'right', marginLeft: 12, flexShrink: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: pct === 100 ? 'var(--green)' : 'var(--text2)' }}>
                    {count}/{TOTAL_LESSONS}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{pct}%</div>
                </div>
              </div>
              <div style={{ marginTop: 8, height: 4, background: 'var(--surface2)', borderRadius: 2 }}>
                <div style={{
                  height: '100%', borderRadius: 2, width: `${pct}%`,
                  background: pct === 100 ? 'var(--green)' : 'var(--blue)', transition: 'width 0.3s',
                }} />
              </div>
            </button>
            {isOpen && (
              <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {(u.lesson_completions ?? []).length === 0 ? (
                  <span style={{ fontSize: 12, color: 'var(--text3)' }}>No lessons completed yet.</span>
                ) : (u.lesson_completions ?? []).map(id => (
                  <div key={id} style={{
                    padding: '3px 8px', borderRadius: 4, fontSize: 11,
                    background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)', color: 'var(--green)',
                  }}>
                    {id.replace('fund-', '').replace('mode-', '').replace('scale-', '').replace('chord-', '')}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {/* Feedback */}
      {activeSection === 'feedback' && (
        <>
          {feedback.length === 0 && (
            <div style={{ ...card, color: 'var(--text3)', fontSize: 13 }}>No feedback yet.</div>
          )}
          {feedback.map(f => (
            <div key={f.id} style={card}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: f.suggestion ? 8 : 0 }}>
                <div>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 3 }}>{f.user_email}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {new Date(f.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                </div>
                <div style={{ fontSize: 16, letterSpacing: 1, color: 'var(--amber)' }}>
                  {f.rating
                    ? <>{'★'.repeat(f.rating)}{'☆'.repeat(5 - f.rating)}</>
                    : <span style={{ fontSize: 11, color: 'var(--text3)', letterSpacing: 0 }}>comment</span>
                  }
                </div>
              </div>
              {f.suggestion && (
                <div style={{
                  fontSize: 13, color: 'var(--text)', lineHeight: 1.5,
                  padding: '8px 10px', borderRadius: 6,
                  background: 'var(--surface2)', borderLeft: '3px solid var(--blue)',
                }}>
                  {f.suggestion}
                </div>
              )}
            </div>
          ))}
        </>
      )}

      {/* Issues */}
      {activeSection === 'issues' && (
        <>
          {issues.length === 0 && (
            <div style={{ ...card, color: 'var(--text3)', fontSize: 13 }}>No issues reported yet.</div>
          )}
          {issues.map(issue => (
            <div key={issue.id} style={{
              ...card,
              opacity: issue.resolved ? 0.55 : 1,
              borderLeft: `3px solid ${issue.resolved ? 'var(--border)' : 'var(--red)'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                  {issue.question_topic && (
                    <span style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 10,
                      background: `${TOPIC_COLORS[issue.question_topic] ?? 'var(--text3)'}20`,
                      color: TOPIC_COLORS[issue.question_topic] ?? 'var(--text3)',
                      border: `1px solid ${TOPIC_COLORS[issue.question_topic] ?? 'var(--border)'}50`,
                    }}>
                      {issue.question_topic}
                    </span>
                  )}
                  {issue.resolved && (
                    <span style={{ fontSize: 10, color: 'var(--text3)' }}>resolved</span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    {new Date(issue.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </div>
                  <button onClick={() => toggleResolved(issue)} style={{
                    padding: '3px 9px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
                    fontFamily: 'inherit', fontWeight: 600,
                    background: issue.resolved ? 'var(--surface2)' : 'rgba(74,222,128,0.12)',
                    border: `1px solid ${issue.resolved ? 'var(--border)' : 'var(--green)'}`,
                    color: issue.resolved ? 'var(--text3)' : 'var(--green)',
                  }}>
                    {issue.resolved ? 'Reopen' : 'Resolve'}
                  </button>
                </div>
              </div>

              <div style={{
                fontSize: 13, color: 'var(--text)', lineHeight: 1.5,
                padding: '7px 10px', borderRadius: 6, background: 'var(--surface2)',
                marginBottom: issue.note ? 8 : 0,
              }}>
                {issue.question_prompt}
              </div>

              {issue.note && (
                <div style={{
                  fontSize: 12, color: 'var(--text2)', lineHeight: 1.5,
                  padding: '7px 10px', borderRadius: 6,
                  background: 'rgba(248,113,113,0.06)', borderLeft: '3px solid var(--red)',
                }}>
                  {issue.note}
                </div>
              )}

              {issue.user_email && (
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 6 }}>
                  from {issue.user_email}
                </div>
              )}
            </div>
          ))}
        </>
      )}
    </div>
  );
}
