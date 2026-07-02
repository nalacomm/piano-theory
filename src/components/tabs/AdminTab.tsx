'use client';
import { useState, useEffect } from 'react';

interface UserRow {
  user_email: string;
  lesson_completions: string[];
  updated_at: string;
}

const TOTAL_LESSONS = 17;

export default function AdminTab() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => { setUsers(data.users ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };

  if (loading) {
    return <div style={{ padding: '20px 0', fontSize: 13, color: 'var(--text3)' }}>Loading...</div>;
  }

  return (
    <div style={{ padding: '0 0 80px' }}>
      <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Registered Users</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Admin view only</div>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: 'var(--green)' }}>{users.length}</div>
      </div>

      {users.length === 0 && (
        <div style={{ ...card, color: 'var(--text3)', fontSize: 13 }}>No users yet.</div>
      )}

      {users.map(u => {
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
              style={{
                width: '100%', background: 'none', border: 'none', cursor: 'pointer',
                padding: 0, fontFamily: 'inherit', textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', wordBreak: 'break-all' }}>
                    {u.user_email}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 3 }}>
                    Last active: {lastActive}
                  </div>
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
                  height: '100%', borderRadius: 2,
                  width: `${pct}%`,
                  background: pct === 100 ? 'var(--green)' : 'var(--blue)',
                  transition: 'width 0.3s',
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
                    background: 'rgba(74,222,128,0.12)', border: '1px solid rgba(74,222,128,0.3)',
                    color: 'var(--green)',
                  }}>
                    {id.replace('fund-', '').replace('mode-', '').replace('scale-', '').replace('chord-', '')}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
