'use client';
import { useState, useCallback, useRef } from 'react';
import { playFreq, getAudioCtx } from '@/lib/audio';

// ── Audio helpers ──────────────────────────────────────────────────────────────

function playRhythm(clicks: number, bpm: number, accent = false) {
  const ctx = getAudioCtx();
  if (!ctx) return;
  const secPerClick = 60 / bpm;
  const now = ctx.currentTime;
  for (let i = 0; i < clicks; i++) {
    const isAccent = accent && i === 0;
    playFreq(isAccent ? 880 : 660, now + i * secPerClick, 0.055, isAccent ? 0.5 : 0.32);
  }
}

// ── Note SVG ───────────────────────────────────────────────────────────────────

function NoteSymbol({ type, color, size = 1 }: { type: string; color: string; size?: number }) {
  const w = 34 * size, h = 52 * size;
  const cx = 13 * size, cy = 38 * size;
  const rx = 11 * size, ry = 7.5 * size;
  const stemX = (cx + rx - 1) * size, stemTop = 6 * size;
  const sw = 2.5 * size;

  const oval = (filled: boolean) => (
    <ellipse cx={cx} cy={cy} rx={rx} ry={ry}
      fill={filled ? color : 'none'} stroke={color} strokeWidth={sw}
      transform={`rotate(-12, ${cx}, ${cy})`} />
  );
  const stem = <line x1={stemX} y1={cy - ry * 0.5} x2={stemX} y2={stemTop} stroke={color} strokeWidth={sw} />;
  const flag1 = <path d={`M ${stemX} ${stemTop} Q ${stemX + 14 * size} ${stemTop + 8 * size} ${stemX + 6 * size} ${stemTop + 18 * size}`} fill="none" stroke={color} strokeWidth={sw} />;
  const flag2 = <path d={`M ${stemX} ${stemTop + 10 * size} Q ${stemX + 14 * size} ${stemTop + 18 * size} ${stemX + 6 * size} ${stemTop + 28 * size}`} fill="none" stroke={color} strokeWidth={sw} />;

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {type === 'whole' && oval(false)}
      {type === 'half'  && <>{oval(false)}{stem}</>}
      {type === 'quarter' && <>{oval(true)}{stem}</>}
      {type === 'eighth' && <>{oval(true)}{stem}{flag1}</>}
      {type === 'sixteenth' && <>{oval(true)}{stem}{flag1}{flag2}</>}
    </svg>
  );
}

// ── Content data ───────────────────────────────────────────────────────────────

const NOTE_VALUES = [
  { id: 'whole',     name: 'Whole Note',      beats: 4,   color: '#4ade80', desc: '4 beats. The longest standard note value. Held for a full measure in 4/4.' },
  { id: 'half',      name: 'Half Note',       beats: 2,   color: '#4d9ef7', desc: '2 beats. Half of a whole note. Common in slower melodies.' },
  { id: 'quarter',   name: 'Quarter Note',    beats: 1,   color: '#a78bfa', desc: '1 beat. The most common note value — the basic pulse in most music.' },
  { id: 'eighth',    name: 'Eighth Note',     beats: 0.5, color: '#facc15', desc: '½ beat. Two eighth notes = one quarter note. Creates faster movement.' },
  { id: 'sixteenth', name: 'Sixteenth Note',  beats: 0.25,color: '#f97316', desc: '¼ beat. Four sixteenth notes = one quarter note. Used in rapid passages.' },
];

const TIME_SIGS = [
  { id: '4/4', top: 4, bottom: 4, name: 'Common Time', beats: 4, clicksPerMeasure: 4, bpm: 80,
    desc: '4 quarter-note beats per measure. The most common time signature. Feels balanced and even.',
    genre: 'Pop, Rock, Jazz, Classical', feel: 'Strong beat 1, slight accent on 3' },
  { id: '3/4', top: 3, bottom: 4, name: 'Waltz',       beats: 3, clicksPerMeasure: 3, bpm: 80,
    desc: '3 quarter-note beats per measure. Waltz feel — ONE-two-three.',
    genre: 'Waltz, Minuet, Ballads', feel: 'Strong downbeat, light 2 and 3' },
  { id: '6/8', top: 6, bottom: 8, name: 'Compound Duple', beats: 6, clicksPerMeasure: 6, bpm: 120,
    desc: '6 eighth-note beats per measure. Feels like 2 groups of 3 — a lilting, compound duple feel.',
    genre: 'Irish jig, hymns, marches', feel: 'Two main pulses, each split into triplets' },
  { id: '2/4', top: 2, bottom: 4, name: 'Cut/March',   beats: 2, clicksPerMeasure: 2, bpm: 80,
    desc: '2 quarter-note beats per measure. March feel — ONE-two, ONE-two. Brisk and driven.',
    genre: 'Marches, polka, some folk', feel: 'Strong 1, weak 2 — very direct' },
  { id: '5/4', top: 5, bottom: 4, name: 'Asymmetric',  beats: 5, clicksPerMeasure: 5, bpm: 80,
    desc: '5 quarter-note beats per measure. Asymmetric — often felt as 3+2 or 2+3.',
    genre: 'Progressive rock, jazz, film', feel: 'Uneven groupings create tension and forward drive' },
];

const DYNAMICS = [
  { symbol: 'pp',  name: 'Pianissimo',    level: 1, desc: 'Very soft. Nearly inaudible — ghostlike.' },
  { symbol: 'p',   name: 'Piano',         level: 2, desc: 'Soft. Gentle, understated, intimate.' },
  { symbol: 'mp',  name: 'Mezzo-piano',   level: 3, desc: 'Moderately soft. A comfortable conversational volume.' },
  { symbol: 'mf',  name: 'Mezzo-forte',   level: 4, desc: 'Moderately loud. The most commonly used dynamic in practice.' },
  { symbol: 'f',   name: 'Forte',         level: 5, desc: 'Loud. Confident and assertive.' },
  { symbol: 'ff',  name: 'Fortissimo',    level: 6, desc: 'Very loud. Full power, maximum presence.' },
];

const DYN_MARKINGS = [
  { symbol: '<',   name: 'Crescendo',      desc: 'Gradually get louder.' },
  { symbol: '>',   name: 'Decrescendo',    desc: 'Gradually get softer (also: diminuendo).' },
  { symbol: 'sfz', name: 'Sforzando',      desc: 'Sudden strong accent on a single note.' },
  { symbol: 'fp',  name: 'Forte-piano',    desc: 'Loud then immediately soft.' },
];

const TEMPOS = [
  { name: 'Grave',       bpm: '< 40',   feel: 'Very slow, solemn, heavy',         color: '#94a3b8', clickBpm: 36 },
  { name: 'Largo',       bpm: '40–60',  feel: 'Broad and slow',                   color: '#818cf8', clickBpm: 50 },
  { name: 'Andante',     bpm: '76–108', feel: 'Walking pace — calm and flowing',   color: '#4d9ef7', clickBpm: 90 },
  { name: 'Moderato',    bpm: '108–120',feel: 'Moderate — not rushed, not slow',   color: '#4ade80', clickBpm: 114 },
  { name: 'Allegro',     bpm: '120–168',feel: 'Fast, lively, bright',              color: '#facc15', clickBpm: 140 },
  { name: 'Presto',      bpm: '168–200',feel: 'Very fast — energetic, urgent',     color: '#f97316', clickBpm: 180 },
  { name: 'Prestissimo', bpm: '> 200',  feel: 'Extremely fast — near limit',       color: '#f87171', clickBpm: 210 },
];

const TEMPO_MODIFIERS = [
  { symbol: 'accel.', name: 'Accelerando', desc: 'Gradually speed up.' },
  { symbol: 'rit.',   name: 'Ritardando',  desc: 'Gradually slow down.' },
  { symbol: 'a tempo',name: 'A Tempo',     desc: 'Return to the original tempo.' },
  { symbol: 'rubato', name: 'Rubato',      desc: 'Freely — flex the tempo for expression.' },
];

const QUICK_CHECKS = [
  {
    question: 'How many quarter notes fit in one whole note?',
    choices: ['2', '4', '6', '8'],
    answer: '4',
    explanation: 'A whole note lasts 4 beats; a quarter note lasts 1 beat. So 4 quarter notes fill a whole note. This is why 4/4 is called "common time."',
  },
  {
    question: 'In 3/4 time, how many beats are in each measure?',
    choices: ['2', '3', '4', '6'],
    answer: '3',
    explanation: 'The top number of a time signature tells you the beats per measure. 3/4 has 3 beats. The bottom 4 means a quarter note gets one beat.',
  },
  {
    question: '"Allegro" describes what kind of tempo?',
    choices: ['Very slow and solemn', 'Walking pace', 'Fast and lively', 'Gradually slowing down'],
    answer: 'Fast and lively',
    explanation: 'Allegro means fast and lively — typically 120–168 BPM. It comes from the Italian for "cheerful." Largo is slow; Andante is walking; Ritardando means slowing down.',
  },
];

// ── Main component ─────────────────────────────────────────────────────────────

type Section = 'values' | 'time' | 'dynamics' | 'tempo';

interface Props {
  root: string;
  lessonId: string;
  color: string;
  onBack: () => void;
  onComplete: (id: string) => void;
}

export default function RhythmLessonView({ lessonId, color, onBack, onComplete }: Props) {
  const [section, setSection] = useState<Section>('values');
  const [activeNote, setActiveNote] = useState('quarter');
  const [activeTimeSig, setActiveTimeSig] = useState('4/4');
  const [activeDynamic, setActiveDynamic] = useState('mf');
  const [activeTempo, setActiveTempo] = useState('Andante');

  const [checkIdx, setCheckIdx] = useState(0);
  const [checkPicked, setCheckPicked] = useState<string | null>(null);
  const [checkAnswered, setCheckAnswered] = useState(false);
  const [everCompleted, setEverCompleted] = useState(false);

  const selectedNote = NOTE_VALUES.find(n => n.id === activeNote)!;
  const selectedTimeSig = TIME_SIGS.find(t => t.id === activeTimeSig)!;
  const selectedDynamic = DYNAMICS.find(d => d.symbol === activeDynamic)!;
  const selectedTempo = TEMPOS.find(t => t.name === activeTempo)!;

  const handlePlayNote = useCallback(() => {
    const n = NOTE_VALUES.find(v => v.id === activeNote)!;
    const BPM = 80;
    const clicks = Math.max(1, Math.round(4 / n.beats));
    playRhythm(clicks, BPM * (4 / n.beats < 1 ? 1 : 4 / n.beats));
  }, [activeNote]);

  const handlePlayTimeSig = useCallback(() => {
    const ts = TIME_SIGS.find(t => t.id === activeTimeSig)!;
    playRhythm(ts.clicksPerMeasure, ts.bpm, true);
  }, [activeTimeSig]);

  const handlePlayTempo = useCallback(() => {
    playRhythm(8, selectedTempo.clickBpm, true);
  }, [selectedTempo]);

  const handleCheck = useCallback((choice: string) => {
    if (checkAnswered) return;
    setCheckPicked(choice);
    setCheckAnswered(true);
    if (choice === QUICK_CHECKS[checkIdx].answer && !everCompleted) {
      onComplete(lessonId);
      setEverCompleted(true);
    }
  }, [checkAnswered, checkIdx, everCompleted, lessonId, onComplete]);

  const nextQuestion = () => {
    setCheckIdx(i => i + 1);
    setCheckPicked(null);
    setCheckAnswered(false);
  };

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };
  const sLabel: React.CSSProperties = {
    fontSize: 11, color: 'var(--text3)', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 1,
  };

  const SECTIONS: { id: Section; label: string }[] = [
    { id: 'values',   label: 'Note Values' },
    { id: 'time',     label: 'Time Sigs' },
    { id: 'dynamics', label: 'Dynamics' },
    { id: 'tempo',    label: 'Tempo' },
  ];

  const currentQ = QUICK_CHECKS[checkIdx];

  return (
    <div style={{ padding: '0 0 80px' }}>
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text3)', fontSize: 13, fontFamily: 'inherit', marginBottom: 10,
      }}>
        ← Back to lessons
      </button>

      <div style={{ ...card, borderLeft: `3px solid ${color}` }}>
        <div style={{ fontSize: 10, color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>Fundamentals</div>
        <div style={{ fontSize: 20, fontWeight: 700, color }}>Rhythm Basics</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>Note values, time signatures, dynamics, and tempo</div>
      </div>

      <div style={card}>
        <div style={sLabel}>What it is</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, margin: 0 }}>
          Rhythm is the timing of music — when notes happen and how long they last. Note values determine duration. Time signatures group beats into measures. Dynamics control volume. Tempo sets the speed. Together these give a performance its energy, feel, and shape.
        </p>
      </div>

      {/* Section tabs */}
      <div style={{ display: 'flex', gap: 5, marginBottom: 10, flexWrap: 'wrap' }}>
        {SECTIONS.map(s => (
          <button key={s.id} onClick={() => setSection(s.id)} style={{
            padding: '5px 12px', borderRadius: 16, fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
            background: section === s.id ? color : 'var(--surface2)',
            color: section === s.id ? '#0a0f1e' : 'var(--text2)',
            border: `1px solid ${section === s.id ? color : 'var(--border)'}`,
            fontWeight: section === s.id ? 700 : 400,
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {/* ── NOTE VALUES ─────────────────────────────────────────────────────── */}
      {section === 'values' && (
        <>
          <div style={{ ...card, borderLeft: `3px solid ${selectedNote.color}` }}>
            <div style={sLabel}>Select a note value</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {NOTE_VALUES.map(n => (
                <button key={n.id} onClick={() => setActiveNote(n.id)} style={{
                  padding: '5px 12px', borderRadius: 16, fontSize: 12,
                  cursor: 'pointer', fontFamily: 'inherit',
                  background: activeNote === n.id ? n.color : 'var(--surface2)',
                  color: activeNote === n.id ? '#0a0f1e' : 'var(--text2)',
                  border: `1px solid ${activeNote === n.id ? n.color : 'var(--border)'}`,
                  fontWeight: activeNote === n.id ? 700 : 400,
                }}>
                  {n.name.replace(' Note', '')}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 12 }}>
              <NoteSymbol type={selectedNote.id} color={selectedNote.color} size={1.4} />
              <div>
                <div style={{ fontSize: 16, fontWeight: 700, color: selectedNote.color }}>{selectedNote.name}</div>
                <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 3 }}>
                  {selectedNote.beats === 0.25 ? '¼' : selectedNote.beats === 0.5 ? '½' : selectedNote.beats} beat{selectedNote.beats !== 1 ? 's' : ''} in 4/4
                </div>
              </div>
              <button onClick={handlePlayNote} style={{
                marginLeft: 'auto', padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                background: selectedNote.color, color: '#0a0f1e',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Tap
              </button>
            </div>

            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{selectedNote.desc}</p>
          </div>

          <div style={card}>
            <div style={sLabel}>Beat relationships</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {NOTE_VALUES.map(n => {
                const widthPct = (n.beats / 4) * 100;
                return (
                  <div key={n.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 80, fontSize: 12, color: 'var(--text3)', flexShrink: 0 }}>{n.name.replace(' Note', '')}</div>
                    <div style={{ flex: 1, height: 18, background: 'var(--surface2)', borderRadius: 4, overflow: 'hidden' }}>
                      <div style={{
                        width: `${widthPct}%`, height: '100%',
                        background: n.color, borderRadius: 4,
                      }} />
                    </div>
                    <div style={{ width: 40, fontSize: 11, color: 'var(--text3)', textAlign: 'right', flexShrink: 0 }}>
                      {n.beats === 0.25 ? '¼' : n.beats === 0.5 ? '½' : n.beats}b
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div style={{ ...card, background: `${color}0f`, borderColor: `${color}40` }}>
            <div style={{ fontSize: 11, color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>Dotted notes & rests</div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: '0 0 8px' }}>
              A dot after a note adds half its value. A dotted quarter note = 1 + ½ = 1½ beats. A dotted half note = 2 + 1 = 3 beats.
            </p>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
              Every note value has a corresponding rest — the same duration, but silence. Rests are as important as notes; they give music space to breathe.
            </p>
          </div>
        </>
      )}

      {/* ── TIME SIGNATURES ─────────────────────────────────────────────────── */}
      {section === 'time' && (
        <>
          <div style={{ ...card, borderLeft: `3px solid ${color}` }}>
            <div style={sLabel}>Select a time signature</div>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 14 }}>
              {TIME_SIGS.map(t => (
                <button key={t.id} onClick={() => setActiveTimeSig(t.id)} style={{
                  padding: '5px 14px', borderRadius: 8, fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  background: activeTimeSig === t.id ? color : 'var(--surface2)',
                  color: activeTimeSig === t.id ? '#0a0f1e' : 'var(--text2)',
                  border: `1px solid ${activeTimeSig === t.id ? color : 'var(--border)'}`,
                }}>
                  {t.id}
                </button>
              ))}
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 14 }}>
              {/* Large fraction */}
              <div style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                fontFamily: 'Georgia, serif', fontSize: 42, fontWeight: 700, color,
                lineHeight: 1, width: 64, flexShrink: 0,
              }}>
                <span>{selectedTimeSig.top}</span>
                <div style={{ width: '100%', height: 2, background: color, margin: '4px 0' }} />
                <span>{selectedTimeSig.bottom}</span>
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 15, fontWeight: 700, color, marginBottom: 4 }}>{selectedTimeSig.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 8 }}>{selectedTimeSig.genre}</div>
                <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{selectedTimeSig.desc}</p>
              </div>
            </div>

            {/* Beat grid */}
            <div style={{ display: 'flex', gap: 5, marginBottom: 14, flexWrap: 'wrap' }}>
              {Array.from({ length: selectedTimeSig.clicksPerMeasure }).map((_, i) => (
                <div key={i} style={{
                  width: 36, height: 36, borderRadius: 6, fontSize: 13, fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: i === 0 ? color : `${color}28`,
                  color: i === 0 ? '#0a0f1e' : color,
                  border: `1px solid ${color}`,
                }}>
                  {i + 1}
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>{selectedTimeSig.feel}</div>
              <button onClick={handlePlayTimeSig} style={{
                padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                background: color, color: '#0a0f1e',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Play measure
              </button>
            </div>
          </div>

          <div style={{ ...card, background: `${color}0f`, borderColor: `${color}40` }}>
            <div style={{ fontSize: 11, color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>How to read it</div>
            <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>
              The top number = beats per measure. The bottom number = which note value gets one beat (4 = quarter note, 8 = eighth note). So 6/8 means 6 eighth-note beats per measure. The symbol C means 4/4; a C with a vertical line means 2/2 (cut time).
            </p>
          </div>
        </>
      )}

      {/* ── DYNAMICS ────────────────────────────────────────────────────────── */}
      {section === 'dynamics' && (
        <>
          <div style={{ ...card, borderLeft: `3px solid ${color}` }}>
            <div style={sLabel}>Volume levels</div>

            {/* Spectrum bar */}
            <div style={{
              height: 10, borderRadius: 5, marginBottom: 12,
              background: 'linear-gradient(to right, #374151, #f1f5f9)',
            }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {DYNAMICS.map(d => {
                const active = activeDynamic === d.symbol;
                const fillPct = (d.level / 6) * 100;
                return (
                  <button key={d.symbol} onClick={() => setActiveDynamic(d.symbol)} style={{
                    padding: '10px 12px', borderRadius: 8, textAlign: 'left',
                    background: active ? `${color}18` : 'var(--surface2)',
                    border: `1px solid ${active ? color : 'var(--border)'}`,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', gap: 12,
                  }}>
                    <span style={{ fontFamily: 'Georgia, serif', fontSize: 18, fontWeight: 700, color: active ? color : 'var(--text2)', width: 28, textAlign: 'center' }}>
                      {d.symbol}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 12, color: active ? color : 'var(--text)', fontWeight: active ? 700 : 400 }}>{d.name}</div>
                      <div style={{ height: 4, marginTop: 4, borderRadius: 2, background: 'var(--surface)', overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${fillPct}%`, background: color, borderRadius: 2 }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text3)', flexShrink: 0 }}>{d.desc.split('.')[0]}</span>
                  </button>
                );
              })}
            </div>

            <div style={{ padding: '10px 12px', borderRadius: 8, background: `${color}0f`, border: `1px solid ${color}40` }}>
              <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color, marginBottom: 4 }}>{selectedDynamic.symbol}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{selectedDynamic.name}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6 }}>{selectedDynamic.desc}</div>
            </div>
          </div>

          <div style={card}>
            <div style={sLabel}>Expression markings</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {DYN_MARKINGS.map(m => (
                <div key={m.symbol} style={{
                  display: 'flex', gap: 12, padding: '8px 12px', borderRadius: 7,
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  alignItems: 'center',
                }}>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: 16, fontWeight: 700, color, width: 36, textAlign: 'center', flexShrink: 0 }}>
                    {m.symbol}
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── TEMPO ───────────────────────────────────────────────────────────── */}
      {section === 'tempo' && (
        <>
          <div style={{ ...card, borderLeft: `3px solid ${selectedTempo.color}` }}>
            <div style={sLabel}>Select a tempo</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
              {TEMPOS.map(t => {
                const active = activeTempo === t.name;
                return (
                  <button key={t.name} onClick={() => setActiveTempo(t.name)} style={{
                    padding: '10px 12px', borderRadius: 8, textAlign: 'left',
                    background: active ? `${t.color}18` : 'var(--surface2)',
                    border: `1px solid ${active ? t.color : 'var(--border)'}`,
                    cursor: 'pointer', fontFamily: 'inherit',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  }}>
                    <div>
                      <span style={{ fontSize: 14, fontWeight: active ? 700 : 400, color: active ? t.color : 'var(--text)' }}>
                        {t.name}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--text3)', marginLeft: 8 }}>{t.feel}</span>
                    </div>
                    <span style={{ fontSize: 11, color: active ? t.color : 'var(--text3)', fontWeight: 700, flexShrink: 0 }}>
                      {t.bpm} BPM
                    </span>
                  </button>
                );
              })}
            </div>

            <div style={{
              padding: '12px 14px', borderRadius: 8,
              background: `${selectedTempo.color}14`, border: `1px solid ${selectedTempo.color}50`,
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}>
              <div>
                <div style={{ fontFamily: 'Georgia, serif', fontSize: 22, fontWeight: 700, color: selectedTempo.color, marginBottom: 2 }}>
                  {selectedTempo.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{selectedTempo.bpm} BPM · {selectedTempo.feel}</div>
              </div>
              <button onClick={handlePlayTempo} style={{
                padding: '7px 14px', borderRadius: 6, fontSize: 12, fontWeight: 700,
                background: selectedTempo.color, color: '#0a0f1e',
                border: 'none', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Click
              </button>
            </div>
          </div>

          <div style={card}>
            <div style={sLabel}>Tempo modifiers</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {TEMPO_MODIFIERS.map(m => (
                <div key={m.symbol} style={{
                  display: 'flex', gap: 12, padding: '8px 12px', borderRadius: 7,
                  background: 'var(--surface2)', border: '1px solid var(--border)',
                  alignItems: 'center',
                }}>
                  <span style={{ fontFamily: 'Georgia, serif', fontSize: 13, fontWeight: 700, color, width: 52, flexShrink: 0 }}>
                    {m.symbol}
                  </span>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{m.name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{m.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {/* ── QUICK CHECK ─────────────────────────────────────────────────────── */}
      <div style={card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div style={sLabel}>Quick check</div>
          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{checkIdx + 1} / {QUICK_CHECKS.length}</div>
        </div>
        <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 10, lineHeight: 1.5 }}>{currentQ.question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {currentQ.choices.map((choice, i) => {
            const isCorrect = choice === currentQ.answer;
            let bg = 'var(--surface2)', border = 'var(--border)', textColor = 'var(--text)';
            if (checkAnswered) {
              if (isCorrect) { bg = 'rgba(74,222,128,0.12)'; border = 'var(--green)'; textColor = 'var(--green)'; }
              else if (choice === checkPicked) { bg = 'rgba(248,113,113,0.12)'; border = 'var(--red)'; textColor = 'var(--red)'; }
            }
            return (
              <button key={i} onClick={() => handleCheck(choice)} style={{
                padding: '10px 12px', borderRadius: 7, fontSize: 13, textAlign: 'left',
                background: bg, border: `1px solid ${border}`, color: textColor,
                cursor: checkAnswered ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}>
                {choice}
              </button>
            );
          })}
        </div>
        {checkAnswered && (
          <>
            <div style={{
              marginTop: 10, padding: '10px 12px', borderRadius: 7, fontSize: 12, lineHeight: 1.6, color: 'var(--text2)',
              background: checkPicked === currentQ.answer ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
              border: `1px solid ${checkPicked === currentQ.answer ? 'var(--green)' : 'var(--red)'}`,
            }}>
              <span style={{ fontWeight: 700, color: checkPicked === currentQ.answer ? 'var(--green)' : 'var(--red)' }}>
                {checkPicked === currentQ.answer ? 'Correct! ' : `Answer: ${currentQ.answer}. `}
              </span>
              {currentQ.explanation}
            </div>
            {checkIdx < QUICK_CHECKS.length - 1 && (
              <button onClick={nextQuestion} style={{
                marginTop: 10, width: '100%', padding: '10px', borderRadius: 8, fontSize: 13,
                background: 'var(--surface2)', border: '1px solid var(--border)',
                color: 'var(--text2)', cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Next question →
              </button>
            )}
            {checkIdx === QUICK_CHECKS.length - 1 && (
              <div style={{ marginTop: 10, fontSize: 12, color: 'var(--green)', textAlign: 'center' }}>
                Lesson complete — explore the sections above.
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
