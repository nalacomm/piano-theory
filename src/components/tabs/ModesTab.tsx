'use client';
import { useState } from 'react';
import { NOTES, MODE_DATA, SCALE_FORMULAS, buildScale, getParentRoot, getDiatonicChords, qColor } from '@/lib/theory';
import { playScaleUp, playChordTogether } from '@/lib/audio';
import PianoKeys from '@/components/ui/PianoKeys';
import PlayBtn from '@/components/ui/PlayBtn';
import type { ModeKey } from '@/types';

const MODE_KEYS = Object.keys(MODE_DATA) as ModeKey[];

export default function ModesTab() {
  const [selectedMode, setSelectedMode] = useState<ModeKey>('ionian');
  const [modeRoot, setModeRoot] = useState('C');
  const [diatonicRoot, setDiatonicRoot] = useState('C');

  const mode = MODE_DATA[selectedMode];
  const scaleIdxs = buildScale(modeRoot, mode.intervals);
  const scaleNotes = scaleIdxs.map(i => NOTES[i]);
  const rootIdx = NOTES.indexOf(modeRoot as typeof NOTES[number]);
  const parentRoot = getParentRoot(modeRoot, selectedMode);
  const parentScale = buildScale(parentRoot, SCALE_FORMULAS.major.intervals);
  const diatonicChords = getDiatonicChords(diatonicRoot);

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };
  const label: React.CSSProperties = { fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 };
  const row: React.CSSProperties = { display: 'flex', gap: 6, flexWrap: 'wrap' };
  const chip = (active: boolean, color?: string): React.CSSProperties => ({
    padding: '5px 10px', borderRadius: 20, fontSize: 12, cursor: 'pointer', fontFamily: 'inherit',
    background: active ? (color || 'var(--green)') : 'var(--surface2)',
    color: active ? 'var(--on-accent)' : 'var(--text2)',
    fontWeight: active ? 700 : 400,
    border: `1px solid ${active ? (color || 'var(--green)') : 'var(--border)'}`,
  });

  return (
    <div style={{ padding: '0 0 80px' }}>
      <div style={card}>
        <div style={label}>Mode</div>
        <div style={row}>
          {MODE_KEYS.map(k => (
            <button key={k} style={chip(selectedMode === k, MODE_DATA[k].color)} onClick={() => setSelectedMode(k)}>
              {MODE_DATA[k].short}
            </button>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={label}>Root</div>
        <div style={row}>
          {NOTES.map(n => (
            <button key={n} style={chip(modeRoot === n, mode.color)} onClick={() => setModeRoot(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...card, borderLeft: `3px solid ${mode.color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: mode.color }}>{modeRoot} {mode.label}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{mode.vibe}</div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <PlayBtn small label="Scale" color={mode.color} onPlay={() => playScaleUp(scaleNotes)} />
            <PlayBtn small label="Chord" color={mode.color} onPlay={() => playChordTogether(scaleNotes.slice(0,3))} />
          </div>
        </div>

        <PianoKeys highlightedNotes={scaleIdxs} rootNote={rootIdx} />

        <div style={{ marginTop: 10, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {mode.degrees.map((d, i) => (
            <div key={i} style={{
              padding: '3px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
              background: i === 0 ? mode.color : 'var(--surface2)',
              color: i === 0 ? 'var(--on-accent)' : 'var(--text)',
              border: `1px solid ${i === 0 ? mode.color : 'var(--border)'}`,
            }}>
              {d} <span style={{ opacity: 0.6, fontWeight: 400 }}>{scaleNotes[i]}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={label}>Alterations vs Major</div>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>{mode.alterations}</div>
        <div style={{ marginTop: 8, fontSize: 12, color: mode.color }}>{mode.earMark}</div>
      </div>

      <div style={card}>
        <div style={label}>Parent Key Relation</div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 8 }}>
          <div style={{ fontSize: 13, color: 'var(--text2)' }}>
            <span style={{ color: mode.color, fontWeight: 700 }}>{modeRoot} {mode.short}</span>
            {' = '}
            <span style={{ color: 'var(--green)', fontWeight: 700 }}>{parentRoot} Major</span>
            {' starting on degree '}
            <span style={{ color: 'var(--amber)' }}>{mode.parentDegree}</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 6 }}>
          {parentScale.map((idx, i) => {
            const inMode = scaleIdxs.includes(idx);
            return (
              <div key={i} style={{
                padding: '3px 7px', borderRadius: 4, fontSize: 11,
                background: NOTES[idx] === modeRoot ? mode.color : inMode ? 'var(--surface2)' : 'transparent',
                color: NOTES[idx] === modeRoot ? 'var(--on-accent)' : inMode ? 'var(--text)' : 'var(--text3)',
                border: `1px solid ${inMode ? 'var(--border)' : 'transparent'}`,
              }}>
                {NOTES[idx]}
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text3)' }}>{mode.keyFact}</div>
      </div>

      <div style={card}>
        <div style={label}>Chord Qualities</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {mode.chordNums.map((num, i) => (
            <div key={i} style={{
              padding: '5px 8px', borderRadius: 6, fontSize: 12, textAlign: 'center',
              background: 'var(--surface2)',
              border: `1px solid ${qColor(mode.chordQualities[i])}`,
              color: qColor(mode.chordQualities[i]),
            }}>
              <div style={{ fontWeight: 700 }}>{num}</div>
              <div style={{ fontSize: 10, opacity: 0.8 }}>{mode.chordQualities[i]}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={label}>Diatonic Chords</div>
          <div style={{ display: 'flex', gap: 4 }}>
            {NOTES.map(n => (
              <button key={n} onClick={() => setDiatonicRoot(n)}
                style={{ ...chip(diatonicRoot === n), padding: '2px 6px', fontSize: 10 }}>
                {n}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {diatonicChords.map((c, i) => (
            <button key={i}
              onClick={() => playChordTogether([c.note])}
              style={{
                padding: '6px 10px', borderRadius: 6, fontSize: 12, cursor: 'pointer',
                background: 'var(--surface2)', fontFamily: 'inherit',
                border: `1px solid ${qColor(c.quality)}`, color: qColor(c.quality),
              }}>
              <div style={{ fontWeight: 700 }}>{c.numeral}</div>
              <div style={{ fontSize: 10 }}>{c.note}</div>
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...card, background: 'rgba(74,222,128,0.05)' }}>
        <div style={label}>Genres</div>
        <div style={{ fontSize: 13, color: 'var(--text2)' }}>{mode.genres}</div>
      </div>
    </div>
  );
}
