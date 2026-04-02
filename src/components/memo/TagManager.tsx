import { useState } from 'react';
import type { Tag } from '../../types';
import { Button, Input } from '../common';

interface TagManagerProps {
  tags: Tag[];
  onCreateTag: (name: string, color?: string) => void;
  onUpdateTag: (id: string, updates: Partial<Tag>) => void;
  onDeleteTag: (id: string) => void;
}

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#64748b',
];

export function TagManager({ tags, onCreateTag, onUpdateTag, onDeleteTag }: TagManagerProps) {
  const [newTagName, setNewTagName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0]);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  const handleCreate = () => {
    if (newTagName.trim()) {
      onCreateTag(newTagName.trim(), selectedColor);
      setNewTagName('');
      setSelectedColor(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]);
    }
  };

  const startEditing = (tag: Tag) => {
    setEditingTagId(tag.id);
    setEditingName(tag.name);
  };

  const saveEditing = () => {
    if (editingTagId && editingName.trim()) {
      onUpdateTag(editingTagId, { name: editingName.trim() });
    }
    setEditingTagId(null);
    setEditingName('');
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center space-x-2">
        <Input
          value={newTagName}
          onChange={(e) => setNewTagName(e.target.value)}
          placeholder="新标签名称"
          className="flex-1"
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleCreate();
          }}
        />
        <div className="flex items-center space-x-1">
          {COLOR_OPTIONS.slice(0, 6).map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => setSelectedColor(color)}
              className={`w-5 h-5 rounded-full transition-transform ${
                selectedColor === color ? 'ring-2 ring-offset-1 ring-gray-400 scale-110' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
        <Button onClick={handleCreate} size="sm" disabled={!newTagName.trim()}>
          添加
        </Button>
      </div>

      <div className="space-y-2">
        {tags.map((tag) => (
          <div
            key={tag.id}
            className="flex items-center justify-between p-2 bg-gray-50 rounded-lg group"
          >
            {editingTagId === tag.id ? (
              <div className="flex items-center flex-1 space-x-2">
                <Input
                  value={editingName}
                  onChange={(e) => setEditingName(e.target.value)}
                  className="flex-1"
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEditing();
                    if (e.key === 'Escape') setEditingTagId(null);
                  }}
                />
                <Button size="sm" onClick={saveEditing}>
                  保存
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingTagId(null)}>
                  取消
                </Button>
              </div>
            ) : (
              <>
                <div className="flex items-center space-x-2">
                  <span
                    className="w-4 h-4 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  <span className="font-medium text-gray-900">{tag.name}</span>
                </div>
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => startEditing(tag)}
                    className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => onDeleteTag(tag.id)}
                    className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-200 rounded"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {tags.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-4">
            暂无标签，请在上方创建
          </p>
        )}
      </div>
    </div>
  );
}
