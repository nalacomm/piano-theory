'use client';
import { useState, useCallback, useEffect } from 'react';
import { NOTES, buildScale, buildChord, SCALE_FORMULAS, CHORD_TYPES, MODE_DATA } from '@/lib/theory';
import { playScaleUp, playChordTogether } from '@/lib/audio';
import PianoKeys from '@/components/ui/PianoKeys';
import SheetMusic from '@/components/ui/SheetMusic';
import InversionLessonView from '@/components/tabs/InversionLessonView';

// ── Lesson data ──

interface CheckQ {
  question: string;
  choices: string[];
  answer: string;
  explanation: string;
}

interface Lesson {
  id: string;
  category: 'Fundamentals' | 'Modes' | 'Scales' | 'Chords';
  title: string;
  subtitle: string;
  color: string;
  inversionType?: 'triads' | 'sevenths';
  intro?: string;
  keyFacts?: string[];
  identTip?: string;
  noteBuilder?: (root: string) => number[];
  layout?: 'scale' | 'chord';
  playFn?: (notes: string[]) => void;
  playLabel?: string;
  checkQ?: CheckQ;
}

const LESSONS: Lesson[] = [
  {
    id: 'fund-major',
    category: 'Fundamentals',
    title: 'The Major Scale',
    subtitle: 'The reference for everything',
    color: '#4ade80',
    intro: 'Every mode, scale, and chord is described by how it differs from the major scale. Learn this one first. The pattern is: Whole Whole Half Whole Whole Whole Half — written W W H W W W H. A whole step = 2 piano keys. A half step = 1 piano key (the very next key, black or white).',
    keyFacts: [
      '7 notes, 8 counting the octave',
      'Pattern: W W H W W W H',
      'C major uses no sharps or flats: C D E F G A B',
      'All other major scales follow the same pattern from a different root',
    ],
    identTip: 'Hum Do Re Mi Fa Sol La Ti Do. That is the major scale. If a melody sounds happy and complete, it is likely major.',
    noteBuilder: (root) => buildScale(root, [2,2,1,2,2,2,1]),
    layout: 'scale',
    playFn: (notes) => playScaleUp(notes),
    playLabel: 'Play Scale',
    checkQ: {
      question: 'The major scale pattern between the 3rd and 4th note is a?',
      choices: ['Whole step', 'Half step', 'Minor 3rd', 'Tritone'],
      answer: 'Half step',
      explanation: 'W W H — the third interval is a half step (1 piano key). Same between notes 7 and 8.',
    },
  },
  {
    id: 'fund-intervals',
    category: 'Fundamentals',
    title: 'Intervals',
    subtitle: 'Distance between two notes',
    color: '#4d9ef7',
    intro: 'An interval is the distance between two notes, counted in half steps (semitones). Half step = 1 key. Whole step = 2 keys. When you see ♭3, it means the 3rd degree of the major scale lowered by 1 half step. ♯4 means the 4th raised by 1 half step. These symbols appear everywhere in theory.',
    keyFacts: [
      'Half step = 1 semitone — the smallest interval on piano',
      'Whole step = 2 semitones',
      'Major 3rd = 4 semitones (C to E)',
      'Minor 3rd = 3 semitones (C to Eb)',
      'Perfect 5th = 7 semitones (C to G)',
    ],
    identTip: 'Count every key from note to note, including black keys. C to G: C C# D D# E F F# G = 7 keys = perfect 5th.',
    noteBuilder: (root) => {
      const ri = NOTES.indexOf(root as typeof NOTES[number]);
      return [ri, (ri+4)%12, (ri+7)%12];
    },
    layout: 'chord',
    playFn: (notes) => playChordTogether(notes),
    playLabel: 'Play 1-3-5',
    checkQ: {
      question: 'How many half steps is a perfect 5th?',
      choices: ['5', '6', '7', '8'],
      answer: '7',
      explanation: 'Perfect 5th = 7 semitones. C to G = 7 keys. This is the most consonant interval after the octave.',
    },
  },
  {
    id: 'fund-numbers',
    category: 'Fundamentals',
    title: 'The Number System',
    subtitle: 'Degrees and Roman numerals',
    color: '#22d3ee',
    intro: 'The number system assigns a number to each note of the scale. In C major: C=1, D=2, E=3, F=4, G=5, A=6, B=7. A chord built on the 1st degree is called the I chord. Roman numerals are used — uppercase means major, lowercase means minor. The 1-4-5 (I-IV-V) are the three most important chords in any key.',
    keyFacts: [
      'I IV V = the three most common chords in Western music',
      'In C major: I=C, IV=F, V=G',
      'Uppercase I = major chord, lowercase i = minor chord',
      '♭7 means: take the 7th degree and lower it one half step',
      'vii° means diminished chord on the 7th degree',
    ],
    identTip: 'When someone says "go to the 4" in a jam, they mean the chord built on the 4th degree of whatever key you are in.',
    noteBuilder: (root) => buildScale(root, [2,2,1,2,2,2,1]),
    layout: 'scale',
    playFn: (notes) => playScaleUp(notes),
    playLabel: 'Play Scale',
    checkQ: {
      question: 'In G major, what is the IV chord?',
      choices: ['D major', 'C major', 'F major', 'E minor'],
      answer: 'C major',
      explanation: 'G major scale: G A B C D E F#. Count: 1=G, 2=A, 3=B, 4=C. The IV chord in G is C major.',
    },
  },

  // MODES
  {
    id: 'mode-ionian',
    category: 'Modes',
    title: 'Ionian',
    subtitle: 'The major scale itself',
    color: '#4ade80',
    intro: 'Ionian is just the major scale. It is the reference point for all other modes. When you hear a happy, resolved, or finished-sounding melody, it is likely Ionian. The I, IV, and V chords all live here as major chords.',
    keyFacts: [
      'Intervals: W W H W W W H',
      'Degrees: 1 2 3 4 5 6 7',
      'No alterations vs major — it IS major',
      'Lives on the I chord of a major key',
      'Diatonic chords: I ii iii IV V vi vii°',
    ],
    identTip: 'Do Re Mi. You already know this scale. Bright, resolved, finished-feeling. The 1, 4, and 5 are all major chords.',
    noteBuilder: (root) => buildScale(root, [2,2,1,2,2,2,1]),
    layout: 'scale',
    playFn: (notes) => playScaleUp(notes),
    playLabel: 'Play Ionian',
    checkQ: {
      question: 'Ionian is the same as?',
      choices: ['Natural minor scale', 'Major scale', 'Pentatonic scale', 'Dorian mode'],
      answer: 'Major scale',
      explanation: 'Ionian and major scale are the same thing — just different names for the same pattern (W W H W W W H).',
    },
  },
  {
    id: 'mode-dorian',
    category: 'Modes',
    title: 'Dorian',
    subtitle: 'Minor but soulful — lives on II',
    color: '#34d399',
    intro: 'Dorian is a minor mode with a flat 3rd (♭3) and flat 7th (♭7). But unlike natural minor, Dorian keeps a natural 6th. That raised 6 is the signature — it lifts Dorian above the pure darkness of Aeolian. Dorian lives on the II chord of a major key. D Dorian uses the same notes as C major, but treats D as home.',
    keyFacts: [
      'Intervals: W H W W W H W',
      'Degrees: 1 2 ♭3 4 5 6 ♭7',
      'Natural 6th is the defining note (vs natural minor which has ♭6)',
      'Lives on degree II of its parent major key',
      'D Dorian = C major notes, D as root',
    ],
    identTip: 'Natural minor with a raised 6th. Sounds minor but with a soulful lift. Common in jazz, funk, and R&B.',
    noteBuilder: (root) => buildScale(root, MODE_DATA.dorian.intervals),
    layout: 'scale',
    playFn: (notes) => playScaleUp(notes),
    playLabel: 'Play Dorian',
    checkQ: {
      question: 'Dorian differs from natural minor (Aeolian) because it has a?',
      choices: ['Flat 2nd', 'Natural 6th', 'Sharp 4th', 'Natural 3rd'],
      answer: 'Natural 6th',
      explanation: 'Aeolian has a ♭6. Dorian raises that 6th back to natural. Every other degree is the same between the two modes.',
    },
  },
  {
    id: 'mode-phrygian',
    category: 'Modes',
    title: 'Phrygian',
    subtitle: 'Dark and tense — lives on III',
    color: '#fb7185',
    intro: 'Phrygian is the darkest of the common modes. The defining note is the flat 2nd (♭2) — just a half step above the root, creating immediate maximum tension. Phrygian also has ♭3, ♭6, and ♭7. Lives on the III chord of a major key. E Phrygian uses C major notes with E as home.',
    keyFacts: [
      'Intervals: H W W W H W W',
      'Degrees: 1 ♭2 ♭3 4 5 ♭6 ♭7',
      '♭2 is the signature — one half step above root',
      'Lives on degree III of its parent major key',
      'Used in flamenco, metal, and film scores',
    ],
    identTip: 'Natural minor with a flat 2nd. The ♭2 creates a Spanish or heavy metal tension. Hear it in flamenco guitar.',
    noteBuilder: (root) => buildScale(root, MODE_DATA.phrygian.intervals),
    layout: 'scale',
    playFn: (notes) => playScaleUp(notes),
    playLabel: 'Play Phrygian',
    checkQ: {
      question: "Phrygian's signature vs natural minor is?",
      choices: ['Flat 5th', 'Sharp 4th', 'Flat 2nd', 'Natural 7th'],
      answer: 'Flat 2nd',
      explanation: "The ♭2 is what sets Phrygian apart. That half step right above the root creates maximum tension — Phrygian's defining sound.",
    },
  },
  {
    id: 'mode-lydian',
    category: 'Modes',
    title: 'Lydian',
    subtitle: 'Dreamy and floating — lives on IV',
    color: '#a78bfa',
    intro: 'Lydian sounds bright and happy like Ionian, but one note is different: the 4th is raised by a half step (♯4). That single raised 4th creates a magical, floating, unresolved quality. Lydian lives on the IV chord of a major key. F Lydian uses C major notes with F as home.',
    keyFacts: [
      'Intervals: W W W H W W H',
      'Degrees: 1 2 3 ♯4 5 6 7',
      '♯4 is the only change from major',
      'Lives on degree IV of its parent major key',
      'The I chord stays major — just sounds lifted and dreamy',
    ],
    identTip: 'Major scale with a raised 4th. Sounds dreamy and cinematic. Used in film scores and jazz for a floating, ungrounded feel.',
    noteBuilder: (root) => buildScale(root, MODE_DATA.lydian.intervals),
    layout: 'scale',
    playFn: (notes) => playScaleUp(notes),
    playLabel: 'Play Lydian',
    checkQ: {
      question: 'Lydian differs from the major scale by?',
      choices: ['Flat 7th', 'Sharp 5th', 'Sharp 4th', 'Flat 3rd'],
      answer: 'Sharp 4th',
      explanation: 'Lydian = major scale with one change: raise the 4th by a half step. That ♯4 is the only difference.',
    },
  },
  {
    id: 'mode-mixolydian',
    category: 'Modes',
    title: 'Mixolydian',
    subtitle: 'Major with a bluesy edge — lives on V',
    color: '#f87171',
    intro: 'Mixolydian is a major mode — the I chord is still major. But the 7th is lowered by a half step (♭7). That flat 7 creates a groove and a blues-gospel edge. Mixolydian lives on the V chord of a major key. G Mixolydian uses C major notes with G as home. The ♭VII → I move (Bb → C) is everywhere in gospel and classic rock.',
    keyFacts: [
      'Intervals: W W H W W H W',
      'Degrees: 1 2 3 4 5 6 ♭7',
      '♭7 is the only change from major',
      'Lives on degree V of its parent major key',
      'The ♭VII → I move is the gospel anthem formula',
    ],
    identTip: 'Major scale with a flat 7th. If a song sounds major but has a bluesy groove or a big ♭VII chord, it is probably Mixolydian.',
    noteBuilder: (root) => buildScale(root, MODE_DATA.mixolydian.intervals),
    layout: 'scale',
    playFn: (notes) => playScaleUp(notes),
    playLabel: 'Play Mixolydian',
    checkQ: {
      question: 'Mixolydian is major with which alteration?',
      choices: ['Flat 3rd', 'Flat 6th', 'Flat 7th', 'Sharp 4th'],
      answer: 'Flat 7th',
      explanation: 'Mixolydian = major + ♭7. Everything else stays the same. That one flat 7 adds the blues-gospel groove.',
    },
  },
  {
    id: 'mode-aeolian',
    category: 'Modes',
    title: 'Aeolian (Natural Minor)',
    subtitle: 'The relative minor — lives on VI',
    color: '#818cf8',
    intro: 'Aeolian is natural minor — the most common minor sound in Western music. It has three flats compared to major: ♭3, ♭6, and ♭7. Aeolian lives on the VI chord of a major key. A Aeolian uses C major notes with A as home. This is why A minor and C major are called "relative" keys — they share all 7 notes.',
    keyFacts: [
      'Intervals: W H W W H W W',
      'Degrees: 1 2 ♭3 4 5 ♭6 ♭7',
      'Three flats vs major: ♭3, ♭6, ♭7',
      'Lives on degree VI of its parent major key',
      'A Aeolian = C major same notes, A as root',
    ],
    identTip: 'Dark, emotional, melancholic. The most common minor sound. Start a major scale on the 6th degree and you are in Aeolian.',
    noteBuilder: (root) => buildScale(root, MODE_DATA.aeolian.intervals),
    layout: 'scale',
    playFn: (notes) => playScaleUp(notes),
    playLabel: 'Play Aeolian',
    checkQ: {
      question: 'Aeolian lives on which degree of its parent major key?',
      choices: ['II', 'IV', 'V', 'VI'],
      answer: 'VI',
      explanation: 'Aeolian starts on the 6th degree. A Aeolian has the same notes as C major — A is the 6th note of C major (C D E F G A).',
    },
  },
  {
    id: 'mode-locrian',
    category: 'Modes',
    title: 'Locrian',
    subtitle: 'Maximum tension — lives on VII',
    color: '#94a3b8',
    intro: 'Locrian is the most tense and unstable mode. It has five alterations vs major: ♭2, ♭3, ♭5, ♭6, ♭7. The flat 5th makes the I chord diminished — there is no stable tonal center. Locrian is rarely used for full songs but appears in metal, avant-garde, and horror film scoring.',
    keyFacts: [
      'Intervals: H W W H W W W',
      'Degrees: 1 ♭2 ♭3 4 ♭5 ♭6 ♭7',
      'The ♭5 makes the I chord diminished',
      'Lives on degree VII of its parent major key',
      'No stable tonal center — maximum tension',
    ],
    identTip: 'If it sounds ominous with no resolution, it is probably Locrian. The ♭5 destroys any sense of home. Used sparingly.',
    noteBuilder: (root) => buildScale(root, MODE_DATA.locrian.intervals),
    layout: 'scale',
    playFn: (notes) => playScaleUp(notes),
    playLabel: 'Play Locrian',
    checkQ: {
      question: "Locrian's I chord is diminished because of the?",
      choices: ['Flat 2nd', 'Flat 3rd', 'Flat 5th', 'Flat 7th'],
      answer: 'Flat 5th',
      explanation: 'The I chord is 1-♭3-♭5. A diminished triad requires a flat 5th. That ♭5 destroys the stability of the root chord.',
    },
  },

  // SCALES
  {
    id: 'scale-minor-penta',
    category: 'Scales',
    title: 'Minor Pentatonic',
    subtitle: '5 notes — no tension, works everywhere',
    color: '#fb923c',
    intro: 'The minor pentatonic is the most-played scale in rock, blues, and pop. It takes 5 notes from natural minor — removing the 2nd and 6th to eliminate half-step tensions. Every note sounds good over minor chord progressions. It is the first scale most guitarists learn.',
    keyFacts: [
      '5 notes: 1 ♭3 4 5 ♭7',
      'Removes the 2nd and 6th from natural minor',
      'No half steps — every note feels resolved',
      'Works over almost any minor chord progression',
      'Intervals: 3 W 2 W 2 W 3 W 2',
    ],
    identTip: 'If it sounds like a guitar solo or blues riff, it is probably minor pentatonic. Simple, powerful, works everywhere in rock.',
    noteBuilder: (root) => buildScale(root, SCALE_FORMULAS.minorPenta.intervals),
    layout: 'scale',
    playFn: (notes) => playScaleUp(notes),
    playLabel: 'Play Scale',
    checkQ: {
      question: 'Minor pentatonic removes which two degrees from natural minor?',
      choices: ['3rd and 7th', '2nd and 6th', '4th and 7th', '2nd and 5th'],
      answer: '2nd and 6th',
      explanation: 'Natural minor has 7 notes. Remove the 2nd and 6th (both create half-step tensions) and you get minor pentatonic: 1 ♭3 4 5 ♭7.',
    },
  },
  {
    id: 'scale-blues',
    category: 'Scales',
    title: 'Blues Scale',
    subtitle: 'Minor pentatonic + the blue note',
    color: '#22d3ee',
    intro: 'The blues scale is minor pentatonic with one added note: the ♭5 (also called the "blue note"). That flat 5 is the sound of the blues — bent, raw, slightly off. It creates tension before resolving. The slide from ♭5 to 5 is the most characteristic blues guitar move.',
    keyFacts: [
      '6 notes: 1 ♭3 4 ♭5 5 ♭7',
      '= minor pentatonic + ♭5',
      'The ♭5 is the "blue note" — 6 semitones from root',
      'Used in blues, jazz, rock, and R&B',
      'The ♭5 → 5 half-step slide is the signature lick',
    ],
    identTip: 'The blues scale is minor pentatonic with that one bent, raw note in the middle. The slide from ♭5 to 5 defines the blues sound.',
    noteBuilder: (root) => buildScale(root, SCALE_FORMULAS.blues.intervals),
    layout: 'scale',
    playFn: (notes) => playScaleUp(notes),
    playLabel: 'Play Scale',
    checkQ: {
      question: 'The blues scale adds which note to minor pentatonic?',
      choices: ['Flat 2nd', 'Natural 6th', 'Flat 5th', 'Sharp 7th'],
      answer: 'Flat 5th',
      explanation: 'Blues scale = minor pentatonic + ♭5. That flat 5 (tritone) is the "blue note" — the sound that defines the blues genre.',
    },
  },
  {
    id: 'scale-harmonic',
    category: 'Scales',
    title: 'Harmonic Minor',
    subtitle: 'Natural minor with a raised 7th',
    color: '#c084fc',
    intro: 'Harmonic minor is natural minor with one change: the 7th is raised to natural. This creates a strong leading tone — a note just a half step below the root that pulls powerfully upward to resolve. This also creates a distinctive augmented 2nd interval (3 semitones) between the ♭6 and the natural 7, giving harmonic minor its exotic sound.',
    keyFacts: [
      'Degrees: 1 2 ♭3 4 5 ♭6 7',
      'Natural 7th creates a strong pull to the root',
      'The ♭6 → 7 step is an augmented 2nd (3 semitones)',
      'Common in classical, metal, and Middle Eastern music',
      'Raised 7th vs natural minor is the only change',
    ],
    identTip: 'Natural minor with a raised 7th. The exotic "snake charmer" sound comes from the augmented 2nd between the ♭6 and the natural 7.',
    noteBuilder: (root) => buildScale(root, SCALE_FORMULAS.harmonicMinor.intervals),
    layout: 'scale',
    playFn: (notes) => playScaleUp(notes),
    playLabel: 'Play Scale',
    checkQ: {
      question: 'Harmonic minor differs from natural minor by?',
      choices: ['Raised 3rd', 'Raised 6th', 'Raised 7th', 'Raised 5th'],
      answer: 'Raised 7th',
      explanation: 'Natural minor has a ♭7. Harmonic minor raises that 7th back to natural, creating a leading tone that pulls strongly to the root.',
    },
  },

  // CHORDS
  {
    id: 'chord-triads',
    category: 'Chords',
    title: 'Triads',
    subtitle: 'Major, minor, diminished, augmented',
    color: '#4ade80',
    intro: 'A triad is a chord with 3 notes stacked in thirds. The four basic triads are: major (1-3-5), minor (1-♭3-5), diminished (1-♭3-♭5), and augmented (1-3-♯5). Every chord in pop, rock, and classical is either a triad or a triad with extra notes added. The quality is determined by the intervals between notes.',
    keyFacts: [
      'Major: 1-3-5 (4+3 semitones). Bright, happy',
      'Minor: 1-♭3-5 (3+4 semitones). Dark, sad',
      'Diminished: 1-♭3-♭5 (3+3 semitones). Tense, unstable',
      'Augmented: 1-3-♯5 (4+4 semitones). Dreamy, unresolved',
      'The 3rd determines major vs minor',
    ],
    identTip: 'If it has a flat 3rd, it is minor. If it also has a flat 5th, it is diminished. The quality of the 3rd is everything.',
    noteBuilder: (root) => buildChord(root, CHORD_TYPES.major.intervals),
    layout: 'chord',
    playFn: (notes) => playChordTogether(notes),
    playLabel: 'Play Major Triad',
    checkQ: {
      question: 'What makes a minor chord different from a major chord?',
      choices: ['The 5th is raised', 'The 3rd is lowered by a half step', 'A 7th is added', 'The root is different'],
      answer: 'The 3rd is lowered by a half step',
      explanation: 'Major triad: 1-3-5. Minor triad: 1-♭3-5. Only the 3rd changes — lowered one half step. That single note makes the difference between happy and sad.',
    },
  },
  {
    id: 'chord-sevenths',
    category: 'Chords',
    title: '7th Chords',
    subtitle: 'Triads with a 7th degree added',
    color: '#4d9ef7',
    intro: 'A 7th chord takes a triad and adds the 7th degree. The most important are: dominant 7th (1-3-5-♭7), major 7th (1-3-5-7), and minor 7th (1-♭3-5-♭7). The V7 chord (dominant 7th) has the strongest pull to the I in all of tonal music. The ii-V-I jazz progression uses all three of these chord types.',
    keyFacts: [
      'Dominant 7th (V7): 1-3-5-♭7. Tension → resolution',
      'Major 7th (maj7): 1-3-5-7. Smooth and jazzy',
      'Minor 7th (m7): 1-♭3-5-♭7. Soulful',
      'Dominant vs major 7th: only the 7th differs (♭7 vs natural 7)',
      'ii-V-I in C: Dm7 → G7 → Cmaj7',
    ],
    identTip: 'That tense, wanting-to-resolve sound is the dominant 7th. The dreamy, settled jazz sound is major 7th. Soulful and middle-ground is minor 7th.',
    noteBuilder: (root) => buildChord(root, CHORD_TYPES.dom7.intervals),
    layout: 'chord',
    playFn: (notes) => playChordTogether(notes),
    playLabel: 'Play Dominant 7th',
    checkQ: {
      question: 'Dominant 7th vs major 7th — the difference is?',
      choices: ['The 5th', 'The 3rd', 'The 7th', 'The root'],
      answer: 'The 7th',
      explanation: 'Both are major triads (1-3-5). Dominant 7th adds ♭7. Major 7th adds natural 7. That half-step difference changes tense to smooth.',
    },
  },
  {
    id: 'chord-sus',
    category: 'Chords',
    title: 'Sus Chords',
    subtitle: 'Suspended — no 3rd, open and floating',
    color: '#22d3ee',
    intro: 'Sus chords replace the 3rd with either a 2nd or 4th. Because there is no 3rd, sus chords have no major or minor quality — they sound open and unresolved. Sus4 (1-4-5) is the most common and naturally wants to resolve to a major chord by dropping the 4th to a 3rd. Sus chords appear constantly in pop, gospel, and ambient music.',
    keyFacts: [
      'Sus4: 1-4-5. The 4 wants to fall to the 3',
      'Sus2: 1-2-5. Open, floating — no tension',
      'No 3rd = no major or minor quality',
      'Sus4 → major chord resolution is very common in pop',
      'Common in pop, gospel, ambient, and soul music',
    ],
    identTip: 'Sounds open and floating, not clearly happy or sad. If a chord resolves into a clear major by moving one note down, that was a sus chord.',
    noteBuilder: (root) => buildChord(root, CHORD_TYPES.sus4.intervals),
    layout: 'chord',
    playFn: (notes) => playChordTogether(notes),
    playLabel: 'Play Sus4',
    checkQ: {
      question: 'What does a sus chord replace the 3rd with?',
      choices: ['A 7th', 'A 6th', 'A 2nd or 4th', 'A flat 5th'],
      answer: 'A 2nd or 4th',
      explanation: 'Sus = suspended. The 3rd is removed and replaced by either a 2nd (sus2) or 4th (sus4). No 3rd means no major or minor quality.',
    },
  },
  {
    id: 'chord-triad-inv',
    category: 'Chords',
    title: 'Triads in Inversion',
    subtitle: 'Rearranging the bass note',
    color: '#22d3ee',
    inversionType: 'triads',
  },
  {
    id: 'chord-7th-inv',
    category: 'Chords',
    title: '7th Chord Inversions',
    subtitle: 'Root through 3rd inversion',
    color: '#a78bfa',
    inversionType: 'sevenths',
  },
];

const CATEGORIES = ['Fundamentals', 'Modes', 'Scales', 'Chords'] as const;

async function fetchProgress(): Promise<string[]> {
  try {
    const r = await fetch('/api/progress');
    if (!r.ok) return [];
    const data = await r.json();
    return data.lesson_completions ?? [];
  } catch { return []; }
}

async function saveProgress(ids: string[]): Promise<void> {
  try {
    await fetch('/api/progress', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ lesson_completions: ids }),
    });
  } catch { /* silent — state is already updated in memory */ }
}

// ── Lesson viewer ──

type StaticLesson = Required<Omit<Lesson, 'inversionType'>>;

function LessonView({
  lesson, root, onBack, onComplete,
}: {
  lesson: StaticLesson;
  root: string;
  onBack: () => void;
  onComplete: (id: string) => void;
}) {
  const noteIdxs = lesson.noteBuilder(root);
  const rootIdx = NOTES.indexOf(root as typeof NOTES[number]);
  const noteNames = noteIdxs.map(i => NOTES[i % 12]);

  const [checkPicked, setCheckPicked] = useState<string | null>(null);
  const [checkAnswered, setCheckAnswered] = useState(false);

  const handleCheck = useCallback((choice: string) => {
    if (checkAnswered) return;
    setCheckPicked(choice);
    setCheckAnswered(true);
    if (choice === lesson.checkQ.answer) onComplete(lesson.id);
  }, [checkAnswered, lesson, onComplete]);

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };
  const sLabel: React.CSSProperties = {
    fontSize: 11, color: 'var(--text3)', marginBottom: 8,
    textTransform: 'uppercase', letterSpacing: 1,
  };

  return (
    <div style={{ padding: '0 0 80px' }}>
      <button onClick={onBack} style={{
        display: 'flex', alignItems: 'center', gap: 6, padding: '6px 0',
        background: 'none', border: 'none', cursor: 'pointer',
        color: 'var(--text3)', fontSize: 13, fontFamily: 'inherit', marginBottom: 10,
      }}>
        ← Back to lessons
      </button>

      <div style={{ ...card, borderLeft: `3px solid ${lesson.color}` }}>
        <div style={{ fontSize: 10, color: lesson.color, marginBottom: 4, textTransform: 'uppercase', letterSpacing: 1 }}>
          {lesson.category}
        </div>
        <div style={{ fontSize: 20, fontWeight: 700, color: lesson.color }}>{lesson.title}</div>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginTop: 2 }}>{lesson.subtitle}</div>
      </div>

      <div style={card}>
        <div style={sLabel}>What it is</div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.65, margin: 0 }}>{lesson.intro}</p>
      </div>

      <div style={{ ...card, borderLeft: `3px solid ${lesson.color}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: lesson.color }}>{root} {lesson.title}</div>
          <button onClick={() => lesson.playFn(noteNames)} style={{
            padding: '6px 12px', borderRadius: 6, fontSize: 12,
            background: lesson.color, color: '#0a0f1e',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700,
          }}>
            {lesson.playLabel}
          </button>
        </div>

        <PianoKeys highlightedNotes={noteIdxs.map(i => i % 12)} rootNote={rootIdx} />

        <div style={{ marginTop: 10 }}>
          <SheetMusic noteIndices={noteIdxs.map(i => i % 12)} rootIdx={rootIdx} color={lesson.color} layout={lesson.layout} />
        </div>

        <div style={{ marginTop: 10, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {noteNames.map((n, i) => (
            <div key={i} style={{
              padding: '4px 8px', borderRadius: 4, fontSize: 12, fontWeight: 600,
              background: i === 0 ? lesson.color : 'var(--surface2)',
              color: i === 0 ? '#0a0f1e' : 'var(--text)',
              border: `1px solid ${i === 0 ? lesson.color : 'var(--border)'}`,
            }}>
              {n}
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <div style={sLabel}>Key facts</div>
        <ul style={{ margin: 0, padding: '0 0 0 16px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {lesson.keyFacts.map((f, i) => (
            <li key={i} style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.5 }}>{f}</li>
          ))}
        </ul>
      </div>

      <div style={{ ...card, background: `${lesson.color}0f`, borderColor: `${lesson.color}40` }}>
        <div style={{ fontSize: 11, color: lesson.color, marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 }}>
          How to identify it
        </div>
        <p style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.6, margin: 0 }}>{lesson.identTip}</p>
      </div>

      <div style={card}>
        <div style={sLabel}>Quick check</div>
        <div style={{ fontSize: 14, color: 'var(--text)', marginBottom: 10, lineHeight: 1.5 }}>{lesson.checkQ.question}</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
          {lesson.checkQ.choices.map((choice, i) => {
            const isCorrect = choice === lesson.checkQ.answer;
            let bg = 'var(--surface2)', border = 'var(--border)', color = 'var(--text)';
            if (checkAnswered) {
              if (isCorrect) { bg = 'rgba(74,222,128,0.12)'; border = 'var(--green)'; color = 'var(--green)'; }
              else if (choice === checkPicked) { bg = 'rgba(248,113,113,0.12)'; border = 'var(--red)'; color = 'var(--red)'; }
            }
            return (
              <button key={i} onClick={() => handleCheck(choice)} style={{
                padding: '10px 12px', borderRadius: 7, fontSize: 13, textAlign: 'left',
                background: bg, border: `1px solid ${border}`, color,
                cursor: checkAnswered ? 'default' : 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
              }}>
                {choice}
              </button>
            );
          })}
        </div>
        {checkAnswered && (
          <div style={{
            marginTop: 10, padding: '10px 12px', borderRadius: 7, fontSize: 12, lineHeight: 1.6,
            color: 'var(--text2)',
            background: checkPicked === lesson.checkQ.answer ? 'rgba(74,222,128,0.08)' : 'rgba(248,113,113,0.08)',
            border: `1px solid ${checkPicked === lesson.checkQ.answer ? 'var(--green)' : 'var(--red)'}`,
          }}>
            <span style={{ fontWeight: 700, color: checkPicked === lesson.checkQ.answer ? 'var(--green)' : 'var(--red)' }}>
              {checkPicked === lesson.checkQ.answer ? 'Correct! ' : `Answer: ${lesson.checkQ.answer}. `}
            </span>
            {lesson.checkQ.explanation}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main TrainTab ──

export default function TrainTab() {
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [root, setRoot] = useState('C');
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('Fundamentals');

  useEffect(() => {
    fetchProgress().then(ids => {
      setCompleted(new Set(ids));
      setProgressLoaded(true);
    });
  }, []);

  const handleComplete = useCallback(async (id: string) => {
    setCompleted(prev => {
      const next = new Set(prev);
      next.add(id);
      saveProgress([...next]);
      return next;
    });
  }, []);

  const handleBack = useCallback(() => {
    setActiveLesson(null);
  }, []);

  const card: React.CSSProperties = {
    background: 'var(--surface)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '14px 16px', marginBottom: 10,
  };

  if (activeLesson) {
    if (activeLesson.inversionType) {
      return (
        <InversionLessonView
          root={root}
          lessonId={activeLesson.id}
          inversionType={activeLesson.inversionType}
          color={activeLesson.color}
          onBack={handleBack}
          onComplete={handleComplete}
        />
      );
    }
    return <LessonView lesson={activeLesson as Required<Lesson>} root={root} onBack={handleBack} onComplete={handleComplete} />;
  }

  const totalLessons = LESSONS.length;
  const doneCount = progressLoaded ? LESSONS.filter(l => completed.has(l.id)).length : 0;

  return (
    <div style={{ padding: '0 0 80px' }}>
      <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Learn Piano Theory</div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
            {doneCount}/{totalLessons} lessons completed
          </div>
        </div>
        <div style={{ fontSize: 18, fontWeight: 700, color: doneCount === totalLessons ? 'var(--green)' : 'var(--text3)' }}>
          {Math.round((doneCount / totalLessons) * 100)}%
        </div>
      </div>

      <div style={card}>
        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 }}>Root key</div>
        <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
          {NOTES.map(n => (
            <button key={n} onClick={() => setRoot(n)} style={{
              padding: '4px 9px', borderRadius: 16, fontSize: 12,
              cursor: 'pointer', fontFamily: 'inherit',
              background: root === n ? 'var(--green)' : 'var(--surface2)',
              color: root === n ? '#0a0f1e' : 'var(--text2)',
              border: `1px solid ${root === n ? 'var(--green)' : 'var(--border)'}`,
            }}>
              {n}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)} style={{
            padding: '5px 12px', borderRadius: 16, fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit',
            background: activeCategory === cat ? 'var(--blue)' : 'var(--surface)',
            color: activeCategory === cat ? '#0a0f1e' : 'var(--text2)',
            border: `1px solid ${activeCategory === cat ? 'var(--blue)' : 'var(--border)'}`,
          }}>
            {cat}
          </button>
        ))}
      </div>

      {LESSONS.filter(l => l.category === activeCategory).map(lesson => {
        const done = completed.has(lesson.id);
        return (
          <button key={lesson.id} onClick={() => setActiveLesson(lesson)} style={{
            width: '100%', textAlign: 'left', padding: '12px 14px',
            background: 'var(--surface)', border: `1px solid ${done ? lesson.color + '60' : 'var(--border)'}`,
            borderRadius: 'var(--radius)', marginBottom: 8, cursor: 'pointer',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 12,
          }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: done ? lesson.color : 'var(--surface2)',
              border: `2px solid ${done ? lesson.color : 'var(--border)'}`,
            }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: done ? lesson.color : 'var(--text)' }}>
                {lesson.title}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 2 }}>{lesson.subtitle}</div>
            </div>
            <div style={{ fontSize: 18, color: 'var(--text3)' }}>›</div>
          </button>
        );
      })}
    </div>
  );
}
