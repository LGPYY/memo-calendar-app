import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Memo } from '../types';
import { dbService } from '../db';

export function useMemos() {
  const [memos, setMemos] = useState<Memo[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMemos, setFilteredMemos] = useState<Memo[]>([]);

  const loadMemos = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dbService.getAllMemos();
      setMemos(data);
    } catch (error) {
      console.error('Failed to load memos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMemos();
  }, [loadMemos]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredMemos(memos);
    } else {
      const query = searchQuery.toLowerCase();
      setFilteredMemos(
        memos.filter(
          (memo) =>
            memo.title.toLowerCase().includes(query) ||
            memo.content.toLowerCase().includes(query)
        )
      );
    }
  }, [memos, searchQuery]);

  const createMemo = useCallback(async (data: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => {
    const memo: Memo = {
      ...data,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await dbService.createMemo(memo);
    setMemos((prev) => [memo, ...prev]);
    return memo;
  }, []);

  const updateMemo = useCallback(async (id: string, updates: Partial<Memo>) => {
    await dbService.updateMemo(id, updates);
    setMemos((prev) =>
      prev.map((memo) =>
        memo.id === id ? { ...memo, ...updates, updatedAt: Date.now() } : memo
      )
    );
  }, []);

  const deleteMemo = useCallback(async (id: string) => {
    await dbService.deleteMemo(id);
    setMemos((prev) => prev.filter((memo) => memo.id !== id));
  }, []);

  const getMemoById = useCallback((id: string) => {
    return memos.find((memo) => memo.id === id);
  }, [memos]);

  const getMemosByTagId = useCallback(
    (tagId: string) => {
      return memos.filter((memo) => memo.tagIds.includes(tagId));
    },
    [memos]
  );

  return {
    memos,
    filteredMemos,
    loading,
    searchQuery,
    setSearchQuery,
    createMemo,
    updateMemo,
    deleteMemo,
    getMemoById,
    getMemosByTagId,
    refreshMemos: loadMemos,
  };
}
