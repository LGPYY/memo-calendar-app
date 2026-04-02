import { useState, useEffect } from 'react';
import type { Memo } from '../types';
import { useMemos, useTags, useNotifications } from '../hooks';
import { MemoList, MemoEditor, TagManager } from '../components/memo';
import { Modal, Button } from '../components/common';

export function MemoPage() {
  const {
    memos,
    filteredMemos,
    loading,
    searchQuery,
    setSearchQuery,
    createMemo,
    updateMemo,
    deleteMemo,
  } = useMemos();
  const { tags, createTag, updateTag, deleteTag } = useTags();
  const { permission, requestPermission, scheduleMemoReminder } = useNotifications();

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [selectedMemo, setSelectedMemo] = useState<Memo | null>(null);
  const [filterTagId, setFilterTagId] = useState<string | undefined>();
  const [showArchived, setShowArchived] = useState(false);

  // Set up reminder notifications for memos
  useEffect(() => {
    if (permission === 'granted') {
      memos.forEach((memo) => {
        if (memo.reminderAt && !memo.isArchived) {
          scheduleMemoReminder(memo, () => {
            // Navigate to memo or focus the app
          });
        }
      });
    }
  }, [memos, permission, scheduleMemoReminder]);

  const handleCreateNew = () => {
    setSelectedMemo(null);
    setIsEditorOpen(true);
  };

  const handleEditMemo = (memo: Memo) => {
    setSelectedMemo(memo);
    setIsEditorOpen(true);
  };

  const handleSaveMemo = async (data: Omit<Memo, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (selectedMemo) {
      await updateMemo(selectedMemo.id, data);
    } else {
      await createMemo(data);
    }
    setIsEditorOpen(false);
    setSelectedMemo(null);
  };

  const handleDeleteMemo = async (id: string) => {
    if (confirm('确定要删除这条备忘录吗？')) {
      await deleteMemo(id);
    }
  };

  const handleArchiveMemo = async (id: string) => {
    const memo = memos.find((m) => m.id === id);
    if (memo) {
      await updateMemo(id, { isArchived: !memo.isArchived });
    }
  };

  const handlePinMemo = async (id: string) => {
    const memo = memos.find((m) => m.id === id);
    if (memo) {
      await updateMemo(id, { isPinned: !memo.isPinned });
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">备忘录</h1>
          <p className="text-sm text-gray-500 mt-1">
            共 {filteredMemos.length} 条备忘录
            {filterTagId && '（已筛选标签）'}
            {showArchived && '（已归档）'}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {permission === 'default' && (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => requestPermission()}
            >
              启用通知
            </Button>
          )}
          <Button variant="ghost" onClick={() => setIsTagManagerOpen(true)}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
            </svg>
            标签管理
          </Button>
          <Button onClick={handleCreateNew}>
            <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            新建备忘录
          </Button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center space-x-4 mb-4">
        <div className="flex-1 relative">
          <svg
            className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索备忘录..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white text-black placeholder-black"
          />
        </div>

        <select
          value={filterTagId || ''}
          onChange={(e) => setFilterTagId(e.target.value || undefined)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white text-black"
        >
          <option value="">全部标签</option>
          {tags.map((tag) => (
            <option key={tag.id} value={tag.id}>
              {tag.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setShowArchived(!showArchived)}
          className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
            showArchived
              ? 'bg-gray-200 text-gray-800'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          {showArchived ? '隐藏已归档' : '显示已归档'}
        </button>
      </div>

      {/* Tag filter pills */}
      {tags.length > 0 && !filterTagId && (
        <div className="flex flex-wrap gap-2 mb-4">
          {tags.map((tag) => (
            <button
              key={tag.id}
              onClick={() => setFilterTagId(tag.id)}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium transition-colors hover:opacity-80"
              style={{ backgroundColor: tag.color + '20', color: tag.color }}
            >
              {tag.name}
            </button>
          ))}
        </div>
      )}

      {/* Memo List */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" />
          </div>
        ) : (
          <MemoList
            memos={filteredMemos}
            tags={tags}
            onMemoClick={handleEditMemo}
            onMemoDelete={handleDeleteMemo}
            onMemoPin={handlePinMemo}
            onMemoArchive={handleArchiveMemo}
            filterTagId={filterTagId}
            showArchived={showArchived}
          />
        )}
      </div>

      {/* Memo Editor Modal */}
      <Modal
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false);
          setSelectedMemo(null);
        }}
        title={selectedMemo ? '编辑备忘录' : '新建备忘录'}
        size="lg"
      >
        <MemoEditor
          memo={selectedMemo}
          tags={tags}
          onSave={handleSaveMemo}
          onCancel={() => {
            setIsEditorOpen(false);
            setSelectedMemo(null);
          }}
          onCreateTag={createTag}
        />
      </Modal>

      {/* Tag Manager Modal */}
      <Modal
        isOpen={isTagManagerOpen}
        onClose={() => setIsTagManagerOpen(false)}
        title="管理标签"
        size="md"
      >
        <TagManager
          tags={tags}
          onCreateTag={createTag}
          onUpdateTag={updateTag}
          onDeleteTag={deleteTag}
        />
      </Modal>
    </div>
  );
}
