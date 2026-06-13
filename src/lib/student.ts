import type { StudentModel, QuestionHistory, TrainQuestion } from '@/types';
import { TRAIN_QUESTIONS } from './theory';

const STORAGE_KEY = 'pianoTheory_student_v2';

export function getInitialStudentModel(): StudentModel {
  return {
    xp: 0, streak: 0, lastSessionDate: null, level: 1,
    questionHistory: {}, topicMastery: {}, weakAreas: [],
    strongAreas: [], totalAnswered: 0, currentStreak: 0,
    bestStreak: 0, badges: [],
  };
}

export function loadStudentModel(): StudentModel {
  if (typeof window === 'undefined') return getInitialStudentModel();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...getInitialStudentModel(), ...JSON.parse(saved) };
  } catch {}
  return getInitialStudentModel();
}

export function saveStudentModel(model: StudentModel): void {
  if (typeof window === 'undefined') return;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(model)); } catch {}
}

export function computeWeakAreas(history: Record<string, QuestionHistory>) {
  const topicStats: Record<string, {correct: number; wrong: number}> = {};
  Object.entries(history).forEach(([qId, data]) => {
    const q = TRAIN_QUESTIONS.find(x => x.id === qId);
    if (!q) return;
    if (!topicStats[q.topic]) topicStats[q.topic] = { correct: 0, wrong: 0 };
    topicStats[q.topic].correct += data.correct || 0;
    topicStats[q.topic].wrong += data.wrong || 0;
  });
  const weak: string[] = [], strong: string[] = [];
  Object.entries(topicStats).forEach(([topic, data]) => {
    const total = data.correct + data.wrong;
    if (total < 2) return;
    const pct = data.correct / total;
    if (pct < 0.6) weak.push(topic);
    else if (pct > 0.8) strong.push(topic);
  });
  return { weak, strong, topicStats };
}

export function selectNextQuestion(model: StudentModel, lastQId?: string): TrainQuestion {
  const history = model.questionHistory;
  const { weak } = computeWeakAreas(history);
  const scored = TRAIN_QUESTIONS
    .filter(q => q.id !== lastQId)
    .map(q => {
      const h = history[q.id] || { correct: 0, wrong: 0, srsLevel: 0, lastSeen: 0 };
      const total = h.correct + h.wrong;
      let score = 0;
      if (total === 0) score += 50;
      if (weak.includes(q.topic)) score += 30;
      if (h.wrong > h.correct) score += 25;
      const targetDiff = model.currentStreak > 3 ? 3 : model.currentStreak > 1 ? 2 : 1;
      if (q.diff === targetDiff) score += 15;
      const recency = (Date.now() - (h.lastSeen || 0)) / 60000;
      if (recency < 3) score -= 40;
      else if (recency < 10) score -= 15;
      return { q, score };
    });
  scored.sort((a, b) => b.score - a.score);
  const pool = scored.slice(0, 3);
  return pool[Math.floor(Math.random() * pool.length)]?.q || TRAIN_QUESTIONS[0];
}

export function getLevel(xp: number): number {
  if (xp < 100) return 1; if (xp < 250) return 2; if (xp < 500) return 3;
  if (xp < 900) return 4; if (xp < 1500) return 5; if (xp < 2500) return 6;
  if (xp < 4000) return 7; if (xp < 6000) return 8; if (xp < 9000) return 9;
  return 10;
}

export function getLevelName(level: number): string {
  return ['','Beginner','Explorer','Student','Practitioner','Musician',
          'Theorist','Craftsman','Scholar','Master','Virtuoso'][level] || 'Virtuoso';
}

export function getLevelThreshold(level: number): number {
  return [0,0,100,250,500,900,1500,2500,4000,6000,9000][level] || 9000;
}

export function topicMasteryStats(topic: string, history: Record<string, QuestionHistory>) {
  const qs = TRAIN_QUESTIONS.filter(q => q.topic === topic);
  let correct = 0, wrong = 0, seen = 0;
  qs.forEach(q => {
    const h = history[q.id];
    if (h) { seen++; correct += h.correct || 0; wrong += h.wrong || 0; }
  });
  const attempts = correct + wrong;
  const pct = attempts === 0 ? 0 : Math.min(100, Math.round((correct / attempts) * 100));
  return { pct, seen, total: qs.length, correct, wrong };
}
