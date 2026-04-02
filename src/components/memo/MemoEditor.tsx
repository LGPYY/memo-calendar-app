import { useState, useEffect } from 'react';
import type { Memo, Tag } from '../../types';
import { Button, Input, Textarea } from '../common';
import { DatePicker } from '../common/DatePicker';
import { format } from 'date-fns';

interface MemoEditorProps {
  memo?: Memo | null;
  tags: Tag[];
  onSave: (data: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
  onCreateTag: (name: string) => void;
}

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#64748b',
];

export function MemoEditor({ memo, tags, onSave, onCancel, onCreateTag }: MemoEditorProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [link, setLink] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [isPinned, setIsPinned] = useState(false);
  const [reminderAt, setReminderAt] = useState<Date | null>(null);
  const [color, setColor] = useState<string>('');
  const [newTagName, setNewTagName] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);

  useEffect(() => {
    if (memo) {
      setTitle(memo.title);
      setContent(memo.content);
      setLink(memo.link || '');
      setSelectedTagIds(memo.tagIds);
      setIsPinned(memo.isPinned);
      setReminderAt(memo.reminderAt ? new Date(memo.reminderAt) : null);
      setColor(memo.color || '');
    }
  }, [memo]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      content: content.trim(),
      link: link.trim() || undefined,
      tagIds: selectedTagIds,
      isPinned,
      isArchived: memo?.isArchived || false,
      reminderAt: reminderAt?.getTime(),
      color: color || undefined,
    });
  };

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleCreateTag = () => {
    if (newTagName.trim()) {
      onCreateTag(newTagName.trim());
      setNewTagName('');
      setShowTagInput(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="标题"
        autoFocus
      />

      <Textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="写下你的备忘录..."
        rows={6}
      />

      <Input
        value={link}
        onChange={(e) => setLink(e.target.value)}
        placeholder="添加链接（可选）"
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">标签</label>
        <div className="flex flex-wrap gap-2">
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggleTag(tag.id)}
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedTagIds.includes(tag.id)
                  ? 'ring-2 ring-offset-1'
                  : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: tag.color + '20',
                color: tag.color,
                ...(selectedTagIds.includes(tag.id) ? { ringColor: tag.color } : {}),
              }}
            >
              {tag.name}
              {selectedTagIds.includes(tag.id) && (
                <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              )}
            </button>
          ))}

          {showTagInput ? (
            <div className="flex items-center space-x-1">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="标签名称"
                className="w-24 px-2 py-1 text-sm border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleCreateTag();
                  }
                }}
              />
              <button
                type="button"
                onClick={handleCreateTag}
                className="p-1 text-primary-600 hover:bg-primary-50 rounded-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => setShowTagInput(false)}
                className="p-1 text-gray-400 hover:bg-gray-100 rounded-full"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowTagInput(true)}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-gray-500 bg-gray-100 hover:bg-gray-200 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              新标签
            </button>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">颜色</label>
        <div className="flex flex-wrap gap-2">
          {COLOR_OPTIONS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setColor(color === c ? '' : c)}
              className={`w-6 h-6 rounded-full transition-transform ${
                color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'
              }`}
              style={{ backgroundColor: c }}
            />
          ))}
          {color && (
            <button
              type="button"
              onClick={() => setColor('')}
              className="inline-flex items-center px-2 py-1 rounded text-sm text-gray-500 hover:bg-gray-100"
            >
              清除
            </button>
          )}
        </div>
      </div>

      <div>
        <DatePicker
          value={reminderAt}
          onChange={(date) => setReminderAt(date)}
          label="提醒时间"
          minDate={new Date()}
        />
        {reminderAt && (
          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-500">
              提醒时间已设置为 {format(reminderAt, 'PPpp')}
            </p>
            <button
              type="button"
              onClick={() => setReminderAt(null)}
              className="inline-flex items-center px-2 py-1 rounded text-sm text-gray-500 hover:bg-gray-100"
            >
              清除
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={isPinned}
            onChange={(e) => setIsPinned(e.target.checked)}
            className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <span className="ml-2 text-sm text-gray-600">置顶此备忘录</span>
        </label>
      </div>

      <div className="flex justify-end space-x-3 pt-4 border-t">
        <Button type="button" variant="ghost" onClick={onCancel}>
          取消
        </Button>
        <Button type="submit" disabled={!title.trim()}>
          {memo ? '更新' : '保存'} 备忘录
        </Button>
      </div>
    </form>
  );
}
