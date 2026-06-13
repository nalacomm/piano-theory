'use client';
import { useState } from 'react';
import { NOTES, SCALE_FORMULAS, buildScale } from '@/lib/theory';
import { playScaleUp, playScaleDown, playChordTogether } from '@/lib/audio';
import PianoKeys from '@/components/ui/PianoKeys';
import PlayBtn from '@/components/ui/PlayBtn';
import type { ScaleKey } from '@/types';

const SCALE_KEYS = Object.keys(SCALE_FORMULAS) as ScaleKey[];

export default function ScalesTab() {
  const [root, setRoot] = useState('C');
  const [scaleKey, setScaleKey] = useState<ScaleKey>('major');

  const formula = SCALE_FORMULAS[scaleKey];
  const scaleIdxs = buildScale(root, formula.intervals);
  const scaleNotes = scaleIdxs.map(i => NOTES[i]);
  const rootIdx = NOTES.indexOf(root as typeof NOTES[number]);

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };
  const label: React.CSSProperties = { fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 };
  const chip = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '5px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
    background: active ? (color || 'var(--green)') : 'var(--surface2)',
    color: active ? '#0a0f1e' : 'var(--text2)',
    border: `1px solid ${active ? (color || 'var(--green)') : 'var(--border)'}`,
  });

  return (
    <div style={{ padding: '0 0 80px' }}>
      <div style={card}>
        <div style={label}>Scale Type</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {SCALE_KEYS.map(k => (
            <button key={k} style={chip(scaleKey === k, SCALE_FORMULAS[k].color)} onClick={() => setScaleKey(k)}>
              {SCALE_FORMULAS[k].label}
            </button>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={label}>Root</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {NOTES.map(n => (
            <button key={n} style={chip(root === n, formula.color)} onClick={() => setRoot(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...card, borderLeft: `3px solid ${formula.color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 18, fontWeight: 700, color: formula.color }}>
            {root} {formula.label}
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <PlayBtn small label="Up" color={formula.color} onPlay={() => playScaleUp(scaleNotes)} />
            <PlayBtn small label="Down" color={formula.color} onPlay={() => playScaleDown(scaleNotes)} />
            <PlayBtn small label="Chord" color={formula.color} onPlay={() => playChordTogether(scaleNotes.slice(0,3))} />
          </div>
        </div>

        <PianoKeys highlightedNotes={scaleIdxs} rootNote={rootIdx} />

        <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {scaleNotes.map((n, i) => (
            <div key={i} style={{
              padding: '4px 8px', borderRadius: 4, fontSize: 13, fontWeight: 600,
              background: i === 0 ? formula.color : 'var(--surface2)',
              color: i === 0 ? '#0a0f1e' : 'var(--text)',
              border: `1px solid ${i === 0 ? formula.color : 'var(--border)'}`,
            }}>
              {n}
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={label}>Interval Formula</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {formula.intervals.map((iv, i) => (
            <span key={i} style={{ fontSize: 14, color: iv === 1 ? 'var(--red)' : iv === 2 ? formula.color : 'var(--amber)' }}>
              {iv === 1 ? 'H' : iv === 2 ? 'W' : iv === 3 ? 'W+H' : `${iv}st`}
              {i < formula.intervals.length - 1 && <span style={{ color: 'var(--text3)', margin: '0 4px' }}>→</span>}
            </span>
          ))}
        </div>
        <div style={{ marginTop: 6, fontSize: 11, color: 'var(--text3)' }}>
          {formula.intervals.length} intervals · {scaleNotes.length} notes
        </div>
      </div>

      <div style={card}>
        <div style={label}>All {formula.label} Scales</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {NOTES.map(n => {
            const idxs = buildScale(n, formula.intervals);
            const notes = idxs.map(i => NOTES[i]);
            return (
              <div key={n}
                onClick={() => setRoot(n)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px',
                  borderRadius: 6, cursor: 'pointer',
                  background: root === n ? 'rgba(74,222,128,0.08)' : 'transparent',
                  border: `1px solid ${root === n ? formula.color : 'transparent'}`,
                }}>
                <span style={{ width: 28, fontSize: 13, fontWeight: 700, color: formula.color }}>{n}</span>
                <span style={{ fontSize: 11, color: 'var(--text3)' }}>{notes.join(' · ')}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
