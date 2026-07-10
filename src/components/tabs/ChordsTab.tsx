'use client';
import { useState } from 'react';
import { NOTES, CHORD_TYPES, buildChord } from '@/lib/theory';
import { playChordTogether, playChordArp } from '@/lib/audio';
import PianoKeys from '@/components/ui/PianoKeys';
import ChordVoiceVisual from '@/components/ui/ChordVoiceVisual';
import SheetMusic from '@/components/ui/SheetMusic';
import PlayBtn from '@/components/ui/PlayBtn';
import type { ChordKey } from '@/types';

const CHORD_KEYS = Object.keys(CHORD_TYPES) as ChordKey[];

const QUALITY_COLORS: Record<string, string> = {
  maj: '#4ade80', min: '#818cf8', dim: '#f87171', aug: '#facc15', dom: '#fb923c', sus: '#22d3ee',
};

export default function ChordsTab() {
  const [root, setRoot] = useState('C');
  const [chordKey, setChordKey] = useState<ChordKey>('major');

  const chord = CHORD_TYPES[chordKey];
  const chordIdxs = buildChord(root, chord.intervals);
  const chordNotes = chordIdxs.map(i => NOTES[i % 12]);
  const rootIdx = NOTES.indexOf(root as typeof NOTES[number]);
  const color = QUALITY_COLORS[chord.quality] || 'var(--green)';
  const chordName = `${root}${chord.symbol}`;

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };
  const label: React.CSSProperties = { fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 };
  const chip = (active: boolean, c?: string): React.CSSProperties => ({
    padding: '5px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
    background: active ? (c || 'var(--green)') : 'var(--surface2)',
    color: active ? 'var(--on-accent)' : 'var(--text2)',
    fontWeight: active ? 700 : 400,
    border: `1px solid ${active ? (c || 'var(--green)') : 'var(--border)'}`,
  });

  return (
    <div style={{ padding: '0 0 80px' }}>
      <div style={card}>
        <div style={label}>Chord Type</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {CHORD_KEYS.map(k => (
            <button key={k} style={chip(chordKey === k, QUALITY_COLORS[CHORD_TYPES[k].quality])} onClick={() => setChordKey(k)}>
              {CHORD_TYPES[k].label}
            </button>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={label}>Root</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {NOTES.map(n => (
            <button key={n} style={chip(root === n, color)} onClick={() => setRoot(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...card, borderLeft: `3px solid ${color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 700, color }}>{chordName}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>{chord.label}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <PlayBtn small label="Together" color={color} onPlay={() => playChordTogether(chordNotes)} />
            <PlayBtn small label="Arp Up" color={color} onPlay={() => playChordArp(chordNotes, 0.22)} />
            <PlayBtn small label="Arp Down" color={color} onPlay={() => playChordArp([...chordNotes].reverse(), 0.22)} />
            <PlayBtn small label="Slow" color={color} onPlay={() => playChordArp(chordNotes, 0.5, 1.4)} />
          </div>
        </div>

        <PianoKeys highlightedNotes={chordIdxs.map(i => i % 12)} rootNote={rootIdx} />
        <div style={{ marginTop: 10 }}>
          <SheetMusic noteIndices={chordIdxs.map(i => i % 12)} rootIdx={rootIdx} color={color} layout="chord" />
        </div>
        <ChordVoiceVisual noteIndices={chordIdxs.map(i => i % 12)} rootIdx={rootIdx} color={color} />

        <div style={{ marginTop: 10, display: 'flex', gap: 4 }}>
          {chordNotes.map((n, i) => (
            <div key={i} style={{
              padding: '4px 8px', borderRadius: 4, fontSize: 13, fontWeight: 600,
              background: i === 0 ? color : 'var(--surface2)',
              color: i === 0 ? 'var(--on-accent)' : 'var(--text)',
              border: `1px solid ${i === 0 ? color : 'var(--border)'}`,
            }}>
              {n}
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={label}>Theory</div>
        <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{chord.theory}</div>
      </div>

      <div style={card}>
        <div style={label}>Interval Structure</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {chord.intervals.map((iv, i) => (
            <div key={i} style={{
              padding: '5px 10px', borderRadius: 6, fontSize: 12,
              background: 'var(--surface2)', border: `1px solid ${color}`, color,
            }}>
              +{iv} st
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={label}>All {chord.label} Chords</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NOTES.map(n => {
            const idxs = buildChord(n, chord.intervals);
            const notes = idxs.map(i => NOTES[i % 12]);
            return (
              <div key={n}
                onClick={() => setRoot(n)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                  borderRadius: 6, cursor: 'pointer',
                  background: root === n ? `${color}15` : 'transparent',
                  border: `1px solid ${root === n ? color : 'transparent'}`,
                }}>
                <span style={{ width: 40, fontSize: 13, fontWeight: 700, color }}>{n}{chord.symbol}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{notes.join(' · ')}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
