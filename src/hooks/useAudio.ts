'use client';
import { useState, useCallback } from 'react';
import { unlockAudio as unlockAudioLib } from '@/lib/audio';

export function useAudio() {
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const unlock = useCallback(() => {
    const success = unlockAudioLib();
    if (success) setAudioUnlocked(true);
    return success;
  }, []);
  return { audioUnlocked, unlock };
}
