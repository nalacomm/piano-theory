'use client';
import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { useAudio } from '@/hooks/useAudio';
import AuthGate from './AuthGate';
import AdminTab from './tabs/AdminTab';
import FeedbackButton from './FeedbackButton';
import TrainTab from './tabs/TrainTab';
import ModesTab from './tabs/ModesTab';
import ScalesTab from './tabs/ScalesTab';
import ChordsTab from './tabs/ChordsTab';
import CircleTab from './tabs/CircleTab';
import QuizTab from './tabs/QuizTab';
import AskAITab from './tabs/AskAITab';

const ADMIN_EMAIL = 'eddieriley.tmo@gmail.com';

type Tab = 'train' | 'modes' | 'scales' | 'chords' | 'circle' | 'quiz' | 'ai' | 'admin';

const BASE_TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'train',  label: 'Train',   icon: '⚡' },
  { id: 'modes',  label: 'Modes',   icon: 'M' },
  { id: 'scales', label: 'Scales',  icon: 'S' },
  { id: 'chords', label: 'Chords',  icon: 'C' },
  { id: 'circle', label: 'Circle',  icon: '○' },
  { id: 'quiz',   label: 'Quiz',    icon: '?' },
  { id: 'ai',     label: 'Ask AI',  icon: '✦' },
];

function ThemeToggle() {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme');
    if (saved === 'light') setTheme('light');
  }, []);

  function toggle() {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    if (next === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }

  return (
    <button
      onClick={toggle}
      title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
        fontSize: 16, lineHeight: 1, color: 'var(--text3)',
      }}
    >
      {theme === 'dark' ? '☀' : '☾'}
    </button>
  );
}

function UserChip() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);

  if (!session?.user) return null;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', cursor: 'pointer', padding: 0,
        }}
      >
        {session.user.image ? (
          <img
            src={session.user.image}
            alt={session.user.name ?? 'User'}
            width={28} height={28}
            style={{ borderRadius: '50%', border: '1px solid var(--border)' }}
          />
        ) : (
          <div style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'var(--surface2)', border: '1px solid var(--border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 12, color: 'var(--text2)', fontFamily: 'inherit',
          }}>
            {(session.user.name ?? session.user.email ?? '?')[0].toUpperCase()}
          </div>
        )}
      </button>

      {open && (
        <div style={{
          position: 'absolute', right: 0, top: 36, zIndex: 20,
          background: 'var(--surface)', border: '1px solid var(--border)',
          borderRadius: 8, padding: 12, minWidth: 180,
          boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
        }}>
          <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 4, fontWeight: 600 }}>
            {session.user.name}
          </div>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>
            {session.user.email}
          </div>
          <button
            onClick={() => { setOpen(false); signOut(); }}
            style={{
              width: '100%', padding: '7px 10px', borderRadius: 6, fontSize: 12,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
            }}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('train');
  const { audioUnlocked, unlock } = useAudio();
  const { data: session } = useSession();
  const isAdmin = session?.user?.email === ADMIN_EMAIL;
  const TABS = isAdmin ? [...BASE_TABS, { id: 'admin' as Tab, label: 'Admin', icon: '★' }] : BASE_TABS;

  return (
    <div style={{
      maxWidth: 520, margin: '0 auto', minHeight: '100vh',
      display: 'flex', flexDirection: 'column',
      background: 'var(--bg)', fontFamily: "'Courier New', Courier, monospace",
    }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        padding: '10px 16px',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)', letterSpacing: 1 }}>
          Piano Theory
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          {!audioUnlocked && (
            <button onClick={unlock} style={{
              fontSize: 11, padding: '4px 10px', borderRadius: 6,
              background: 'var(--surface2)', border: '1px solid var(--border)',
              color: 'var(--text3)', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Enable Audio
            </button>
          )}
          {audioUnlocked && (
            <span style={{ fontSize: 10, color: 'var(--green)' }}>♪ Audio On</span>
          )}
          <ThemeToggle />
          <UserChip />
        </div>
      </div>

      {/* Tab bar */}
      <div style={{
        position: 'sticky', top: 45, zIndex: 9,
        background: 'var(--bg)', borderBottom: '1px solid var(--border)',
        display: 'flex', overflowX: 'auto',
        scrollbarWidth: 'none',
      }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            style={{
              flex: '0 0 auto', padding: '8px 9px', fontSize: 11,
              background: 'none', border: 'none', cursor: 'pointer',
              fontFamily: 'inherit',
              color: activeTab === t.id ? 'var(--green)' : 'var(--text3)',
              borderBottom: activeTab === t.id ? '2px solid var(--green)' : '2px solid transparent',
              whiteSpace: 'nowrap',
            }}>
            <span style={{ marginRight: 3 }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '14px 16px', overflowY: 'auto' }}>
        {activeTab === 'train'  && <TrainTab />}
        {activeTab === 'modes'  && <ModesTab />}
        {activeTab === 'scales' && <ScalesTab />}
        {activeTab === 'chords' && <ChordsTab />}
        {activeTab === 'circle' && <CircleTab />}
        {activeTab === 'quiz'   && <QuizTab />}
        {activeTab === 'ai'     && <AskAITab />}
        {activeTab === 'admin'  && <AdminTab />}
      </div>
      <FeedbackButton />
    </div>
  );
}

export default function PianoTheoryApp() {
  return (
    <AuthGate>
      <App />
    </AuthGate>
  );
}
