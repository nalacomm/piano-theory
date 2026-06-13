'use client';
import { useState, useCallback } from 'react';
import { loadStudentModel, saveStudentModel, computeWeakAreas, getLevel } from '@/lib/student';
import type { StudentModel, QuestionHistory } from '@/types';

export function useStudent() {
  const [student, setStudent] = useState<StudentModel>(() => loadStudentModel());

  const update = useCallback((updater: (prev: StudentModel) => StudentModel) => {
    setStudent(prev => {
      const next = updater({ ...prev, questionHistory: { ...prev.questionHistory } });
      saveStudentModel(next);
      return next;
    });
  }, []);

  const recordAnswer = useCallback((questionId: string, correct: boolean, diff: number) => {
    update(prev => {
      const h: QuestionHistory = { ...(prev.questionHistory[questionId] || { correct:0, wrong:0, srsLevel:0, lastSeen:0 }) };
      if (correct) { h.correct++; h.srsLevel = Math.min((h.srsLevel||0)+1, 4); }
      else { h.wrong++; h.srsLevel = 0; }
      h.lastSeen = Date.now();
      const next = { ...prev, questionHistory: { ...prev.questionHistory, [questionId]: h }, totalAnswered: prev.totalAnswered + 1 };
      if (correct) {
        next.xp = prev.xp + diff * 10 + (prev.currentStreak >= 2 ? 5 : 0);
        next.currentStreak = prev.currentStreak + 1;
        next.bestStreak = Math.max(prev.bestStreak, next.currentStreak);
      } else { next.currentStreak = 0; }
      next.level = getLevel(next.xp);
      const { weak, strong } = computeWeakAreas(next.questionHistory);
      next.weakAreas = weak; next.strongAreas = strong;
      return next;
    });
  }, [update]);

  const reset = useCallback(() => {
    const fresh: StudentModel = { xp:0, streak:0, lastSessionDate:null, level:1, questionHistory:{}, topicMastery:{}, weakAreas:[], strongAreas:[], totalAnswered:0, currentStreak:0, bestStreak:0, badges:[] };
    setStudent(fresh);
    saveStudentModel(fresh);
  }, []);

  return { student, update, recordAnswer, reset };
}
