import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { Tag } from '../types';
import { dbService } from '../db';

const DEFAULT_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e',
];

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);

  const loadTags = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dbService.getAllTags();
      setTags(data);
    } catch (error) {
      console.error('Failed to load tags:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTags();
  }, [loadTags]);

  const createTag = useCallback(async (name: string, color?: string) => {
    const tagColor = color || DEFAULT_COLORS[tags.length % DEFAULT_COLORS.length];
    const tag: Tag = {
      id: uuidv4(),
      name,
      color: tagColor,
    };
    await dbService.createTag(tag);
    setTags((prev) => [...prev, tag]);
    return tag;
  }, [tags.length]);

  const updateTag = useCallback(async (id: string, updates: Partial<Tag>) => {
    await dbService.updateTag(id, updates);
    setTags((prev) =>
      prev.map((tag) => (tag.id === id ? { ...tag, ...updates } : tag))
    );
  }, []);

  const deleteTag = useCallback(async (id: string) => {
    await dbService.deleteTag(id);
    setTags((prev) => prev.filter((tag) => tag.id !== id));
  }, []);

  const getTagById = useCallback(
    (id: string) => {
      return tags.find((tag) => tag.id === id);
    },
    [tags]
  );

  return {
    tags,
    loading,
    createTag,
    updateTag,
    deleteTag,
    getTagById,
    refreshTags: loadTags,
    availableColors: DEFAULT_COLORS,
  };
}
