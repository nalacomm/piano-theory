import type { ModeKey, ScaleKey, ChordKey, ModeData, ScaleFormula, ChordType, CircleKey, TrainQuestion } from '@/types';

export const NOTES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B'] as const;

export const MODE_PARENT_OFFSET: Record<ModeKey, number> = {
  ionian: 0, dorian: 10, phrygian: 8, lydian: 7,
  mixolydian: 5, aeolian: 3, locrian: 1,
};

export const MODE_DATA: Record<ModeKey, ModeData> = {
  ionian:     { label:'Ionian (Major)',         short:'Ionian',    color:'#4ade80', intervals:[2,2,1,2,2,2,1], degrees:['1','2','3','4','5','6','7'],         alterations:'No alterations — this IS the reference scale',     parentDegree:'I',   vibe:'Bright, resolved, happy',              genres:'Pop, gospel, classical, country',         chordNums:['I','ii','iii','IV','V','vi','vii°'],     chordQualities:['maj','min','min','maj','maj','min','dim'], keyFact:'Every mode is measured against Ionian. The 1-4-5 lives here as I, IV, V. Nothing altered.',                              earMark:'Do Re Mi. You know this.' },
  dorian:     { label:'Dorian',                 short:'Dorian',    color:'#34d399', intervals:[2,1,2,2,2,1,2], degrees:['1','2','♭3','4','5','6','♭7'],       alterations:'♭3 and ♭7 vs major — natural 6 is the signature', parentDegree:'II',  vibe:'Minor but soulful — cool, not dark',    genres:'Jazz, funk, R&B, modal jazz',             chordNums:['i','ii','♭III','IV','v','vi°','♭VII'],   chordQualities:['min','min','maj','maj','min','dim','maj'], keyFact:'Dorian is the II chord\'s scale. D Dorian = C major same notes, different home. Natural 6 separates it from natural minor.', earMark:'Natural minor. Raise the 6th one half step.' },
  phrygian:   { label:'Phrygian',               short:'Phrygian',  color:'#fb7185', intervals:[1,2,2,2,1,2,2], degrees:['1','♭2','♭3','4','5','♭6','♭7'],     alterations:'♭2 ♭3 ♭6 ♭7 — only 4 and 5 stay natural',       parentDegree:'III', vibe:'Dark, tense, Spanish, heavy',           genres:'Flamenco, metal, film scores',            chordNums:['i','♭II','♭III','iv','v°','♭VI','♭VII'], chordQualities:['min','maj','maj','min','dim','maj','min'], keyFact:'Phrygian is the III chord\'s scale. The ♭2 is the signature — half step off the root, max tension.',                        earMark:'Natural minor. Flatten the 2nd.' },
  lydian:     { label:'Lydian',                 short:'Lydian',    color:'#a78bfa', intervals:[2,2,2,1,2,2,1], degrees:['1','2','3','♯4','5','6','7'],         alterations:'Only one change from major: ♯4 (raised 4th)',     parentDegree:'IV',  vibe:'Dreamy, floating, cinematic',           genres:'Film scores, jazz, prog rock',            chordNums:['I','II','iii','♯iv°','V','vi','vii'],    chordQualities:['maj','maj','min','dim','maj','min','min'], keyFact:'Lydian is the IV chord\'s scale. The ♯4 creates a floaty shimmer — I chord stays major but unresolved.',                   earMark:'Major scale. Raise the 4th. It floats.' },
  mixolydian: { label:'Mixolydian',             short:'Mixo',      color:'#f87171', intervals:[2,2,1,2,2,1,2], degrees:['1','2','3','4','5','6','♭7'],         alterations:'Only one change from major: ♭7',                  parentDegree:'V',   vibe:'Major with bluesy edge — groovy, soulful', genres:'Blues-rock, gospel, funk, classic rock', chordNums:['I','ii','iii°','IV','v','vi','♭VII'],    chordQualities:['maj','min','dim','maj','min','min','maj'], keyFact:'Mixolydian is the V chord\'s scale. The ♭7 makes it groove. ♭VII → I is everywhere in gospel.',                           earMark:'Major scale. Flatten the 7th.' },
  aeolian:    { label:'Aeolian (Natural Minor)', short:'Aeolian',   color:'#818cf8', intervals:[2,1,2,2,1,2,2], degrees:['1','2','♭3','4','5','♭6','♭7'],       alterations:'♭3 ♭6 ♭7 vs major — three flats',                parentDegree:'VI',  vibe:'Dark, emotional, melancholic',          genres:'Rock, pop, classical, metal, R&B',        chordNums:['i','ii°','♭III','iv','v','♭VI','♭VII'],  chordQualities:['min','dim','maj','min','min','maj','maj'], keyFact:'Aeolian = relative minor = VI chord\'s scale. A Aeolian and C major share every note — different home.',                   earMark:'Start a major scale on the 6th degree.' },
  locrian:    { label:'Locrian',                short:'Locrian',   color:'#94a3b8', intervals:[1,2,2,1,2,2,2], degrees:['1','♭2','♭3','4','♭5','♭6','♭7'],     alterations:'♭2 ♭3 ♭5 ♭6 ♭7 — only the 4 stays natural',     parentDegree:'VII', vibe:'Max tension, unstable, no tonal center', genres:'Metal, avant-garde, horror film scores', chordNums:['i°','♭II','♭III','iv','♭V','♭VI','♭VII'],chordQualities:['dim','maj','min','min','maj','maj','min'], keyFact:'Locrian is the VII chord\'s scale. The ♭5 makes the I chord diminished — no stable home.',                                 earMark:'Max tension. No resolution.' },
};

export const SCALE_FORMULAS: Record<ScaleKey, ScaleFormula> = {
  major:         { intervals:[2,2,1,2,2,2,1], label:'Major',            color:'#4ade80' },
  naturalMinor:  { intervals:[2,1,2,2,1,2,2], label:'Natural Minor',    color:'#818cf8' },
  harmonicMinor: { intervals:[2,1,2,2,1,3,1], label:'Harmonic Minor',   color:'#c084fc' },
  melodicMinor:  { intervals:[2,1,2,2,2,2,1], label:'Melodic Minor',    color:'#f472b6' },
  majorPenta:    { intervals:[2,2,3,2,3],      label:'Major Pentatonic', color:'#facc15' },
  minorPenta:    { intervals:[3,2,2,3,2],      label:'Minor Pentatonic', color:'#fb923c' },
  blues:         { intervals:[3,2,1,1,3,2],    label:'Blues',            color:'#22d3ee' },
  wholeTone:     { intervals:[2,2,2,2,2,2],    label:'Whole Tone',       color:'#67e8f9' },
  diminished:    { intervals:[2,1,2,1,2,1,2,1],label:'Diminished',       color:'#f9a8d4' },
};

export const CHORD_TYPES: Record<ChordKey, ChordType> = {
  major:  { label:'Major',        symbol:'',      intervals:[0,4,7],    quality:'maj', theory:'Major triad. Degrees 1-3-5. The I, IV, and V chords in a major key.' },
  minor:  { label:'Minor',        symbol:'m',     intervals:[0,3,7],    quality:'min', theory:'Minor triad. Degrees 1-♭3-5. The ii, iii, and vi chords in a major key.' },
  dim:    { label:'Diminished',   symbol:'dim',   intervals:[0,3,6],    quality:'dim', theory:'Diminished triad. 1-♭3-♭5. Maximum tension. The vii° chord.' },
  aug:    { label:'Augmented',    symbol:'aug',   intervals:[0,4,8],    quality:'aug', theory:'Augmented triad. 1-3-♯5. Chromatic instability.' },
  maj7:   { label:'Major 7th',    symbol:'maj7',  intervals:[0,4,7,11], quality:'maj', theory:'Major triad + natural 7. Smooth, jazzy.' },
  dom7:   { label:'Dominant 7th', symbol:'7',     intervals:[0,4,7,10], quality:'dom', theory:'Major triad + ♭7. The V7 chord. Strongest pull to I.' },
  min7:   { label:'Minor 7th',    symbol:'m7',    intervals:[0,3,7,10], quality:'min', theory:'Minor triad + ♭7. The ii, iii, vi chords in jazz.' },
  min7b5: { label:'Half Dim',     symbol:'ø7',    intervals:[0,3,6,10], quality:'dim', theory:'Diminished triad + ♭7. The ii chord in minor keys.' },
  dim7:   { label:'Full Dim 7th', symbol:'dim7',  intervals:[0,3,6,9],  quality:'dim', theory:'Fully diminished. Symmetrical — every interval a minor 3rd.' },
  sus2:   { label:'Sus2',         symbol:'sus2',  intervals:[0,2,7],    quality:'sus', theory:'Suspended 2nd. No 3rd — open, floating.' },
  sus4:   { label:'Sus4',         symbol:'sus4',  intervals:[0,5,7],    quality:'sus', theory:'Suspended 4th. Strong tension resolving to major.' },
  add9:   { label:'Add9',         symbol:'add9',  intervals:[0,4,7,14], quality:'maj', theory:'Major triad + 9th. Colorful, open. Pop and gospel.' },
};

export const CIRCLE_KEYS: CircleKey[] = [
  { note:'C',  sharps:0,  major:'C major',     minor:'A minor',   angle:0   },
  { note:'G',  sharps:1,  major:'G major',     minor:'E minor',   angle:30  },
  { note:'D',  sharps:2,  major:'D major',     minor:'B minor',   angle:60  },
  { note:'A',  sharps:3,  major:'A major',     minor:'F# minor',  angle:90  },
  { note:'E',  sharps:4,  major:'E major',     minor:'C# minor',  angle:120 },
  { note:'B',  sharps:5,  major:'B major',     minor:'G# minor',  angle:150 },
  { note:'F#', sharps:6,  major:'F#/Gb major', minor:'Eb minor',  angle:180 },
  { note:'Db', sharps:-5, major:'Db major',    minor:'Bb minor',  angle:210 },
  { note:'Ab', sharps:-4, major:'Ab major',    minor:'F minor',   angle:240 },
  { note:'Eb', sharps:-3, major:'Eb major',    minor:'C minor',   angle:270 },
  { note:'Bb', sharps:-2, major:'Bb major',    minor:'G minor',   angle:300 },
  { note:'F',  sharps:-1, major:'F major',     minor:'D minor',   angle:330 },
];

export const QUIZ_QUESTIONS = [
  { q:'Dorian differs from natural minor by which degree?', a:'Natural 6th', c:['Flat 2nd','Natural 6th','Sharp 4th','Flat 5th'] },
  { q:'Lydian\'s signature note vs major scale?', a:'Sharp 4 (♯4)', c:['Flat 7','Sharp 5','Sharp 4 (♯4)','Flat 2'] },
  { q:'Mixolydian is the same as major except?', a:'Flat 7 (♭7)', c:['Flat 3','Flat 6','Sharp 4','Flat 7 (♭7)'] },
  { q:'Which mode lives on the II chord of a major key?', a:'Dorian', c:['Phrygian','Lydian','Dorian','Mixolydian'] },
  { q:'Which mode lives on the V chord of a major key?', a:'Mixolydian', c:['Dorian','Lydian','Phrygian','Mixolydian'] },
  { q:'A minor is the relative minor of which key?', a:'C major', c:['F major','G major','C major','D major'] },
  { q:'Degree I in Lydian has what chord quality?', a:'Major', c:['Minor','Diminished','Major','Augmented'] },
  { q:'Phrygian\'s defining interval vs major?', a:'Flat 2 (♭2)', c:['Flat 3','Flat 2 (♭2)','Flat 5','Sharp 4'] },
  { q:'D Dorian and C major share the same notes?', a:'True', c:['True','False'] },
  { q:'What interval separates C and E?', a:'Major 3rd (4 semitones)', c:['Minor 3rd','Major 2nd','Major 3rd (4 semitones)','Perfect 4th'] },
  { q:'The V chord naturally resolves to?', a:'I (tonic)', c:['II','IV','I (tonic)','VI'] },
  { q:'Which scale adds a ♭5 to minor pentatonic?', a:'Blues scale', c:['Dorian','Harmonic minor','Blues scale','Diminished'] },
  { q:'Aeolian lives on which scale degree?', a:'VI', c:['II','III','V','VI'] },
  { q:'How many notes in a pentatonic scale?', a:'5', c:['4','5','6','7'] },
  { q:'Dominant 7th = major triad plus?', a:'Flat 7 (♭7)', c:['Natural 7','Flat 6','Flat 7 (♭7)','Flat 3'] },
  { q:'The ♭VII chord in Mixolydian is what quality?', a:'Major', c:['Minor','Diminished','Major','Augmented'] },
  { q:'Which mode is minor with a raised 6th?', a:'Dorian', c:['Aeolian','Phrygian','Dorian','Locrian'] },
  { q:'Locrian\'s I chord quality?', a:'Diminished', c:['Major','Minor','Diminished','Augmented'] },
  { q:'Relative minor starts on which degree?', a:'6th', c:['3rd','4th','5th','6th'] },
  { q:'In number system 1-4-5, the 4 means?', a:'Chord built on the 4th degree', c:['Play 4 notes','4/4 time','Chord built on the 4th degree','4th inversion'] },
];

export const TRAIN_QUESTIONS: TrainQuestion[] = [
  { id:'m1',  topic:'modes',  subtopic:'dorian',     diff:1, q:'What two scale degrees separate Dorian from natural minor?', a:'♭3 and ♭7', choices:['♭3 and ♭6','♭3 and ♭7','♭2 and ♭7','♭3 and ♭5'], explanation:'Dorian is natural minor with a natural (raised) 6th. So vs major it has ♭3 and ♭7. The natural 6 is what gives Dorian its soulful, less-dark sound.' },
  { id:'m2',  topic:'modes',  subtopic:'lydian',     diff:1, q:'What single note makes Lydian different from major?', a:'♯4', choices:['♭7','♯5','♯4','♭2'], explanation:'Lydian is a major scale with one change — the 4th is raised by one half step (♯4). That tritone above the root creates the dreamy, floating quality.' },
  { id:'m3',  topic:'modes',  subtopic:'mixolydian', diff:1, q:'Mixolydian is major with one change. What is it?', a:'♭7', choices:['♭3','♭6','♭7','♭2'], explanation:'Mixolydian = major scale with a flat 7th. The I chord stays major. That ♭7 creates the blues-gospel pocket.' },
  { id:'m4',  topic:'modes',  subtopic:'parent',     diff:2, q:'D Dorian\'s parent major key is?', a:'C major', choices:['D major','G major','C major','F major'], explanation:'Dorian lives on degree II. Go down a whole step from D → C. D Dorian and C major share every note — just different home bases.' },
  { id:'m5',  topic:'modes',  subtopic:'parent',     diff:2, q:'G Mixolydian\'s parent major key is?', a:'C major', choices:['G major','F major','C major','D major'], explanation:'Mixolydian lives on degree V. G is the 5th of C major. So G Mixolydian = C major starting on G.' },
  { id:'m6',  topic:'modes',  subtopic:'parent',     diff:2, q:'F Lydian\'s parent major key is?', a:'C major', choices:['F major','Bb major','C major','G major'], explanation:'Lydian lives on degree IV. F is the 4th of C major. F Lydian = C major starting on F.' },
  { id:'m7',  topic:'modes',  subtopic:'phrygian',   diff:1, q:'Phrygian\'s darkest feature vs natural minor is?', a:'♭2 (flat 2nd)', choices:['♭5','♭6','♭2 (flat 2nd)','♭3'], explanation:'Phrygian is natural minor with a flat 2nd. That half-step from the root creates maximum tension.' },
  { id:'m8',  topic:'modes',  subtopic:'aeolian',    diff:1, q:'Aeolian lives on which degree of the major scale?', a:'VI', choices:['II','III','V','VI'], explanation:'Aeolian is the natural minor — it starts on the 6th degree of its parent major key.' },
  { id:'m9',  topic:'modes',  subtopic:'degrees',    diff:2, q:'Which mode has a diminished I chord?', a:'Locrian', choices:['Phrygian','Dorian','Aeolian','Locrian'], explanation:'Locrian has a ♭5, which makes the I chord diminished — no stable tonal center is possible.' },
  { id:'m10', topic:'modes',  subtopic:'dorian',     diff:3, q:'You\'re playing over a minor groove. You want a brighter, less dark sound. Which mode?', a:'Dorian', choices:['Aeolian','Phrygian','Dorian','Locrian'], explanation:'Dorian is minor with a natural 6th. That raised 6 lifts the darkness vs Aeolian.' },
  { id:'m11', topic:'modes',  subtopic:'mixolydian', diff:3, q:'Gospel progressions often use a chord one whole step below the I (the ♭VII). This is characteristic of?', a:'Mixolydian', choices:['Lydian','Dorian','Mixolydian','Ionian'], explanation:'The ♭VII chord comes directly from Mixolydian — the ♭VII → I move is the gospel anthem formula.' },
  { id:'s1',  topic:'scales', subtopic:'pentatonic', diff:1, q:'How many notes does a pentatonic scale have?', a:'5', choices:['4','5','6','7'], explanation:'Penta = five. Pentatonic scales remove the 4th and 7th from major, leaving 5 notes with no half-step tension.' },
  { id:'s2',  topic:'scales', subtopic:'blues',      diff:1, q:'The blues scale adds which note to the minor pentatonic?', a:'♭5 (blue note)', choices:['♭2','♭3','♭5 (blue note)','♭6'], explanation:'The blues scale = minor pentatonic + one note: the ♭5 (tritone). That flat 5 is the "blue note."' },
  { id:'s3',  topic:'scales', subtopic:'major',      diff:1, q:'The major scale interval pattern starting from the root is?', a:'W W H W W W H', choices:['W H W W H W W','W W H W W W H','H W W W H W W','W W W H W W H'], explanation:'Whole-Whole-Half-Whole-Whole-Whole-Half. This is the Ionian formula. Every major scale follows this pattern.' },
  { id:'s4',  topic:'scales', subtopic:'harmonic',   diff:2, q:'Harmonic minor differs from natural minor by?', a:'Raised 7th', choices:['Raised 6th','Raised 5th','Raised 7th','Raised 4th'], explanation:'Harmonic minor raises the 7th by a half step, creating a leading tone that pulls strongly to the root.' },
  { id:'s5',  topic:'scales', subtopic:'wholetone',  diff:2, q:'The whole tone scale has how many notes?', a:'6', choices:['5','6','7','8'], explanation:'6 notes, each a whole step apart. No tension points, no leading tone — everything floats.' },
  { id:'s6',  topic:'scales', subtopic:'pentatonic', diff:2, q:'Major pentatonic removes which two degrees from the major scale?', a:'4th and 7th', choices:['2nd and 6th','3rd and 7th','4th and 7th','2nd and 7th'], explanation:'Remove the 4th and 7th — the two notes creating half-step tension. What\'s left: 1-2-3-5-6.' },
  { id:'s7',  topic:'scales', subtopic:'minor',      diff:1, q:'Natural minor vs major has which flats?', a:'♭3, ♭6, ♭7', choices:['♭3, ♭5, ♭7','♭2, ♭3, ♭7','♭3, ♭6, ♭7','♭3, ♭4, ♭7'], explanation:'Natural minor has three flats vs major: the 3rd, 6th, and 7th.' },
  { id:'s8',  topic:'scales', subtopic:'diminished', diff:3, q:'The diminished scale alternates which interval pattern?', a:'Whole-Half repeating', choices:['Half-Whole only','Whole-Whole-Half','Whole-Half repeating','Half-Half-Whole'], explanation:'Diminished scales alternate whole/half step. This symmetry means the scale repeats every 3 semitones.' },
  { id:'c1',  topic:'chords', subtopic:'triads',     diff:1, q:'A major triad is built from which intervals above the root?', a:'Major 3rd + Perfect 5th (1-3-5)', choices:['Minor 3rd + Perfect 5th','Major 3rd + Augmented 5th','Major 3rd + Perfect 5th (1-3-5)','Minor 3rd + Minor 5th'], explanation:'Major triad: root + major 3rd (4 semitones) + perfect 5th (7 semitones). Number system: 1-3-5.' },
  { id:'c2',  topic:'chords', subtopic:'triads',     diff:1, q:'What makes a minor chord different from major?', a:'The 3rd is flattened (♭3)', choices:['The 5th is raised','The root is lowered','The 3rd is flattened (♭3)','The 7th is added'], explanation:'Minor vs major: the only difference is the 3rd. Flatten it by one half step.' },
  { id:'c3',  topic:'chords', subtopic:'sevenths',   diff:2, q:'A dominant 7th chord = major triad plus?', a:'♭7', choices:['Natural 7','♭6','♭7','♭3'], explanation:'Dominant 7th = 1-3-5-♭7. The V7 chord — most powerful pull back to the I.' },
  { id:'c4',  topic:'chords', subtopic:'diatonic',   diff:2, q:'In any major key, which chord degrees are naturally major?', a:'I, IV, V', choices:['I, II, V','I, III, V','I, IV, V','I, IV, VI'], explanation:'Diatonic pattern: I(maj) ii(min) iii(min) IV(maj) V(maj) vi(min) vii°(dim). The I, IV, and V are major.' },
  { id:'c5',  topic:'chords', subtopic:'diatonic',   diff:2, q:'The ii chord in a major key is what quality?', a:'Minor', choices:['Major','Minor','Diminished','Augmented'], explanation:'Diatonic pattern: ii is always minor in a major key. In the ii-V-I jazz progression, that minor ii creates tension.' },
  { id:'c6',  topic:'chords', subtopic:'sevenths',   diff:2, q:'Major 7th vs Dominant 7th — what\'s the difference?', a:'Major 7th uses natural 7; Dominant uses ♭7', choices:['Major 7th has no 5th','Major 7th uses natural 7; Dominant uses ♭7','Dominant 7th is a minor chord','They are the same'], explanation:'Both are major triads + a 7th. Major 7th keeps natural 7 — jazzy. Dominant 7th uses ♭7 — creates tension.' },
  { id:'c7',  topic:'chords', subtopic:'sus',        diff:2, q:'A sus4 chord replaces which note?', a:'The 3rd', choices:['The root','The 5th','The 3rd','The 7th'], explanation:'Sus chords replace the 3rd with either a 2nd or 4th. No 3rd = no major or minor quality.' },
  { id:'c8',  topic:'chords', subtopic:'voicing',    diff:3, q:'When arpeggiating a chord, you ascend through which interval structure?', a:'The chord tones in order from root', choices:['Random notes','Chromatic scale','The chord tones in order from root','The full major scale'], explanation:'An arpeggio plays each chord tone individually from bottom to top. Root → 3rd → 5th → 7th if present.' },
  { id:'n1',  topic:'numbers', subtopic:'basics',    diff:1, q:'In the number system, what does \'♭7\' mean?', a:'One half step below the 7th degree', choices:['The 7th chord','7 flats in the key','One half step below the 7th degree','The diminished 7th chord'], explanation:'The number system uses scale degrees. ♭7 means take the 7th degree of the major scale and lower it by a half step.' },
  { id:'n2',  topic:'numbers', subtopic:'1-4-5',     diff:1, q:'In C major, the 1-4-5 chords are?', a:'C, F, G', choices:['C, D, G','C, E, G','C, F, G','C, F, A'], explanation:'Count up the major scale: 1=C, 2=D, 3=E, 4=F, 5=G. So 1-4-5 in C = C F G.' },
  { id:'n3',  topic:'numbers', subtopic:'relative',  diff:2, q:'The relative minor starts on which degree of the major scale?', a:'6th', choices:['3rd','5th','6th','7th'], explanation:'The relative minor = major scale starting on degree 6. C major → start on A → A natural minor.' },
  { id:'n4',  topic:'numbers', subtopic:'chords',    diff:2, q:'In number system notation, lowercase \'ii\' means?', a:'Minor chord on the 2nd degree', choices:['2nd inversion','Minor chord on the 2nd degree','Two sharps','Dominant 2nd'], explanation:'Roman numeral convention: uppercase = major, lowercase = minor. ii = minor chord on the 2nd degree.' },
  { id:'n5',  topic:'numbers', subtopic:'tritone',   diff:3, q:'The ♯4/♭5 interval is called the tritone. Why?', a:'It spans three whole tones', choices:['It has three sharps','It spans three whole tones','Three notes sound together','It\'s used in trio music'], explanation:'Tritone = three whole tones from the root. Divides the octave exactly in half — 6 semitones. Maximum tension.' },
];

// ── HELPER FUNCTIONS ──

export function buildScale(root: string, intervals: number[]): number[] {
  const ri = NOTES.indexOf(root as typeof NOTES[number]);
  if (ri === -1) return [0];
  let notes = [ri], cur = ri;
  for (let i = 0; i < intervals.length - 1; i++) {
    cur = (cur + intervals[i]) % 12;
    notes.push(cur);
  }
  return notes;
}

export function buildChord(root: string, intervals: number[]): number[] {
  const ri = NOTES.indexOf(root as typeof NOTES[number]);
  return intervals.map(i => (ri + (i % 12)) % 12);
}

export function getDiatonicChords(root: string) {
  const ri = NOTES.indexOf(root as typeof NOTES[number]);
  const ivals = [0,2,4,5,7,9,11];
  const quals = ['maj','min','min','maj','maj','min','dim'];
  const nums  = ['I','ii','iii','IV','V','vi','vii°'];
  return ivals.map((v, i) => ({
    note: NOTES[(ri+v)%12],
    quality: quals[i],
    numeral: nums[i],
    degree: i+1,
  }));
}

export function qColor(q: string): string {
  return q === 'maj' || q === 'dom' ? '#4ade80'
       : q === 'min' ? '#818cf8'
       : q === 'dim' ? '#f87171'
       : '#b8c8d8';
}

export function getParentRoot(modeRoot: string, modeKey: ModeKey): string {
  return NOTES[(NOTES.indexOf(modeRoot as typeof NOTES[number]) + MODE_PARENT_OFFSET[modeKey]) % 12];
}
