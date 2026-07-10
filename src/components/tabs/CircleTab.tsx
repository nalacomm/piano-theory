'use client';
import { useState } from 'react';
import { CIRCLE_KEYS, buildScale, SCALE_FORMULAS, NOTES, getDiatonicChords, qColor } from '@/lib/theory';
import { playScaleUp, playChordTogether } from '@/lib/audio';
import PianoKeys from '@/components/ui/PianoKeys';
import PlayBtn from '@/components/ui/PlayBtn';

export default function CircleTab() {
  const [selected, setSelected] = useState(CIRCLE_KEYS[0]);

  const scaleIdxs = buildScale(selected.note, SCALE_FORMULAS.major.intervals);
  const scaleNotes = scaleIdxs.map(i => NOTES[i]);
  const rootIdx = NOTES.indexOf(selected.note as typeof NOTES[number]);
  const diatonic = getDiatonicChords(selected.note);

  const cx = 140, cy = 140, r = 110, rInner = 72;

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };
  const label: React.CSSProperties = { fontSize: 11, color: 'var(--text3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 };

  return (
    <div style={{ padding: '0 0 80px' }}>
      <div style={{ ...card, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <div style={label}>Circle of Fifths</div>
        <svg width={280} height={280} viewBox="0 0 280 280">
          {CIRCLE_KEYS.map((k) => {
            const rad = (k.angle - 90) * (Math.PI / 180);
            const x = cx + r * Math.cos(rad);
            const y = cy + r * Math.sin(rad);
            const xi = cx + rInner * Math.cos(rad);
            const yi = cy + rInner * Math.sin(rad);
            const isSelected = selected.note === k.note;
            return (
              <g key={k.note} onClick={() => setSelected(k)} style={{ cursor: 'pointer' }}>
                <circle cx={x} cy={y} r={20}
                  fill={isSelected ? 'var(--green)' : 'var(--surface2)'}
                  stroke={isSelected ? 'var(--green)' : 'var(--text3)'}
                  strokeWidth={1.5}
                />
                <text x={x} y={y + 1} textAnchor="middle" dominantBaseline="middle"
                  fontSize={11} fontWeight={700} fill={isSelected ? 'var(--bg)' : 'var(--text)'}
                  fontFamily="'Courier New', monospace">
                  {k.note}
                </text>
                <circle cx={xi} cy={yi} r={15}
                  fill="var(--surface)"
                  stroke={isSelected ? 'var(--green)' : 'var(--border)'}
                  strokeWidth={isSelected ? 2 : 1}
                />
                <text x={xi} y={yi + 1} textAnchor="middle" dominantBaseline="middle"
                  fontSize={8} fill={isSelected ? 'var(--green)' : 'var(--text2)'}
                  fontFamily="'Courier New', monospace">
                  {k.minor.replace(' minor', 'm')}
                </text>
              </g>
            );
          })}
          <circle cx={cx} cy={cy} r={30} fill="var(--surface2)" stroke="var(--border)" strokeWidth={1} />
          <text x={cx} y={cy - 8} textAnchor="middle" fontSize={14} fontWeight={700} fill="var(--green)" fontFamily="'Courier New', monospace">
            {selected.note}
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fontSize={9} fill="var(--text2)" fontFamily="'Courier New', monospace">
            {selected.sharps > 0 ? `${selected.sharps}#` : selected.sharps < 0 ? `${Math.abs(selected.sharps)}b` : '0 acc'}
          </text>
        </svg>
      </div>

      <div style={{ ...card, borderLeft: '3px solid var(--green)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)' }}>{selected.major}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>Relative minor: {selected.minor}</div>
            <div style={{ fontSize: 12, color: 'var(--text3)' }}>
              {selected.sharps > 0 ? `${selected.sharps} sharp${selected.sharps > 1 ? 's' : ''}` :
               selected.sharps < 0 ? `${Math.abs(selected.sharps)} flat${Math.abs(selected.sharps) > 1 ? 's' : ''}` :
               'No accidentals'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            <PlayBtn small label="Scale" onPlay={() => playScaleUp(scaleNotes)} />
            <PlayBtn small label="I Chord" onPlay={() => playChordTogether(scaleNotes.slice(0,3))} />
          </div>
        </div>
        <PianoKeys highlightedNotes={scaleIdxs} rootNote={rootIdx} />
        <div style={{ marginTop: 8, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {scaleNotes.map((n, i) => (
            <span key={i} style={{
              padding: '3px 7px', borderRadius: 4, fontSize: 12,
              background: i === 0 ? 'var(--green)' : 'var(--surface2)',
              color: i === 0 ? '#0a0f1e' : 'var(--text)',
            }}>{n}</span>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={label}>Diatonic Chords — {selected.major}</div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {diatonic.map((c, i) => (
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

      <div style={card}>
        <div style={label}>Neighboring Keys</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[-1, 1].map(dir => {
            const idx = (CIRCLE_KEYS.indexOf(selected) + dir + 12) % 12;
            const neighbor = CIRCLE_KEYS[idx];
            return (
              <div key={dir}
                onClick={() => setSelected(neighbor)}
                style={{
                  flex: 1, padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                }}>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 2 }}>
                  {dir === -1 ? '← 4th (subdominant)' : '5th (dominant) →'}
                </div>
                <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--green)' }}>{neighbor.major}</div>
                <div style={{ fontSize: 11, color: 'var(--text3)' }}>{neighbor.minor}</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
