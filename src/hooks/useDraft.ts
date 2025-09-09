import { useState, useEffect, useCallback } from 'react';
import { saveDraft, loadDraft, clearDraft as clearStoredDraft } from '../services/storage.service';

interface UseDraftResult<T> {
  draft: T | null;
  updateDraft: (data: T) => void;
  clearDraft: () => void;
}

export const useDraft = <T>(key: string): UseDraftResult<T> => {
  const [draft, setDraft] = useState<T | null>(null);

  useEffect(() => {
    const loaded = loadDraft<T>(key);
    if (loaded) {
      setDraft(loaded);
    }
  }, [key]);

  const updateDraft = useCallback((data: T) => {
    setDraft(data);
    saveDraft(key, data);
  }, [key]);

  const clearDraft = useCallback(() => {
    setDraft(null);
    clearStoredDraft(key);
  }, [key]);

  return {
    draft,
    updateDraft,
    clearDraft
  };
};