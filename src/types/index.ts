export type NoteNames = 'C' | 'C#' | 'D' | 'D#' | 'E' | 'F' | 'F#' | 'G' | 'G#' | 'A' | 'A#' | 'B';

export type ModeKey = 'ionian' | 'dorian' | 'phrygian' | 'lydian' | 'mixolydian' | 'aeolian' | 'locrian';
export type ScaleKey = 'major' | 'naturalMinor' | 'harmonicMinor' | 'melodicMinor' | 'majorPenta' | 'minorPenta' | 'blues' | 'wholeTone' | 'diminished';
export type ChordKey = 'major' | 'minor' | 'dim' | 'aug' | 'maj7' | 'dom7' | 'min7' | 'min7b5' | 'dim7' | 'sus2' | 'sus4' | 'add9';
export type ChordQuality = 'maj' | 'min' | 'dim' | 'aug' | 'dom' | 'sus';

export interface ModeData {
  label: string;
  short: string;
  color: string;
  intervals: number[];
  degrees: string[];
  alterations: string;
  parentDegree: string;
  vibe: string;
  genres: string;
  chordNums: string[];
  chordQualities: string[];
  keyFact: string;
  earMark: string;
}

export interface ScaleFormula {
  intervals: number[];
  label: string;
  color: string;
}

export interface ChordType {
  label: string;
  symbol: string;
  intervals: number[];
  quality: ChordQuality;
  theory: string;
}

export interface CircleKey {
  note: string;
  sharps: number;
  major: string;
  minor: string;
  angle: number;
}

export interface QuizQuestion {
  q: string;
  a: string;
  c: string[];
}

export interface TrainQuestion {
  id: string;
  topic: 'modes' | 'scales' | 'chords' | 'numbers';
  subtopic: string;
  diff: 1 | 2 | 3;
  q: string;
  a: string;
  choices: string[];
  explanation: string;
}

export interface QuestionHistory {
  correct: number;
  wrong: number;
  srsLevel: number;
  lastSeen: number;
}

export interface StudentModel {
  xp: number;
  streak: number;
  lastSessionDate: string | null;
  level: number;
  questionHistory: Record<string, QuestionHistory>;
  topicMastery: Record<string, number>;
  weakAreas: string[];
  strongAreas: string[];
  totalAnswered: number;
  currentStreak: number;
  bestStreak: number;
  badges: string[];
}

export type ActivityType = 'scale_builder' | 'chord_completer' | 'mode_parent' | 'degree_tap';

export interface Activity {
  type: ActivityType;
  root: string;
  color: string;
  prompt: string;
  hint: string;
  correctNotes?: string[];
  choices?: string[];
  targetNote?: string;
  targetDeg?: string;
  scaleIdxs?: number[];
  modeKey?: ModeKey;
  modeShort?: string;
  parentRoot?: string;
  scaleName?: string;
  scaleKey?: ScaleKey;
  chordKey?: ChordKey;
  symbol?: string;
  chordName?: string;
  missingIdxs?: number[];
}

export type TrainPhase = 'home' | 'question' | 'result' | 'breakdown' | 'reteach' | 'activity';
