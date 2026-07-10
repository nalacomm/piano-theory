'use client';
import { useState, useRef, useEffect } from 'react';
import { askTutor } from '@/lib/ai';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const QUICK_PROMPTS = [
  'How do I find the relative minor of any key?',
  'Explain the ii-V-I in jazz using the number system',
  'What makes Dorian sound soulful vs natural minor?',
  'How do I use the ♭VII chord in gospel?',
  'What is the tritone substitution?',
  'Explain modal interchange in simple terms',
];

export default function AskAITab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: 'user', content: text.trim() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const reply = await askTutor(text.trim());
      setMessages(prev => [...prev, { role: 'assistant', content: reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Error reaching AI — check your API key.' }]);
    } finally {
      setLoading(false);
    }
  };

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 130px)', minHeight: 400 }}>
      <div style={{ flex: 1, overflowY: 'auto', paddingBottom: 12 }}>
        {messages.length === 0 && (
          <div>
            <div style={{ ...card, marginBottom: 12 }}>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>
                Your personal piano theory tutor. Ask anything — number system, modes, chords, progressions.
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>
              Quick questions
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button key={i} onClick={() => send(p)}
                  style={{
                    padding: '10px 12px', borderRadius: 8, fontSize: 12, textAlign: 'left',
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit',
                  }}>
                  {p}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} style={{
            marginBottom: 12,
            display: 'flex',
            justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
          }}>
            <div style={{
              maxWidth: '88%', padding: '10px 13px', borderRadius: 10,
              fontSize: 13, lineHeight: 1.6,
              background: m.role === 'user' ? 'var(--blue)' : 'var(--surface)',
              color: m.role === 'user' ? '#fff' : 'var(--text)',
              border: m.role === 'assistant' ? '1px solid var(--border)' : 'none',
              whiteSpace: 'pre-wrap',
            }}>
              {m.content}
            </div>
          </div>
        ))}

        {loading && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', marginBottom: 12 }}>
            <div style={{
              padding: '10px 14px', borderRadius: 10, fontSize: 13,
              background: 'var(--surface)', border: '1px solid var(--border)',
              color: 'var(--text3)',
            }}>
              Thinking...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: 'flex', gap: 8, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), send(input))}
          placeholder="Ask about chords, modes, theory..."
          style={{
            flex: 1, padding: '10px 12px', borderRadius: 8, fontSize: 13,
            background: 'var(--surface)', border: '1px solid var(--border)',
            color: 'var(--text)', fontFamily: 'inherit', outline: 'none',
          }}
        />
        <button
          onClick={() => send(input)}
          disabled={loading || !input.trim()}
          style={{
            padding: '10px 16px', borderRadius: 8, fontSize: 13, fontWeight: 700,
            background: loading || !input.trim() ? 'var(--surface2)' : 'var(--green)',
            color: loading || !input.trim() ? 'var(--text3)' : 'var(--on-accent)',
            border: 'none', cursor: loading || !input.trim() ? 'default' : 'pointer',
            fontFamily: 'inherit',
          }}>
          Send
        </button>
      </div>
    </div>
  );
}
