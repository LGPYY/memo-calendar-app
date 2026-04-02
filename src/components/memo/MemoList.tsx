import type { Memo, Tag } from '../../types';
import { MemoItem } from './MemoItem';

interface MemoListProps {
  memos: Memo[];
  tags: Tag[];
  onMemoClick: (memo: Memo) => void;
  onMemoDelete: (id: string) => void;
  onMemoPin: (id: string) => void;
  onMemoArchive: (id: string) => void;
  filterTagId?: string;
  showArchived?: boolean;
}

export function MemoList({
  memos,
  tags,
  onMemoClick,
  onMemoDelete,
  onMemoPin,
  onMemoArchive,
  filterTagId,
  showArchived = false,
}: MemoListProps) {
  let filteredMemos = memos.filter((memo) => {
    if (!showArchived && memo.isArchived) return false;
    if (showArchived && !memo.isArchived) return false;
    if (filterTagId) return memo.tagIds.includes(filterTagId);
    return true;
  });

  // Sort: pinned first, then by updatedAt
  filteredMemos = [...filteredMemos].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return b.updatedAt - a.updatedAt;
  });

  if (filteredMemos.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <h3 className="mt-2 text-sm font-medium text-gray-900">暂无备忘录</h3>
        <p className="mt-1 text-sm text-gray-500">
          {filterTagId
            ? '没有带有此标签的备忘录'
            : showArchived
            ? '没有已归档的备忘录'
            : '点击上方按钮创建新备忘录'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {filteredMemos.map((memo) => (
        <MemoItem
          key={memo.id}
          memo={memo}
          tags={tags}
          onClick={() => onMemoClick(memo)}
          onDelete={() => onMemoDelete(memo.id)}
          onTogglePin={() => onMemoPin(memo.id)}
          onToggleArchive={() => onMemoArchive(memo.id)}
        />
      ))}
    </div>
  );
}
