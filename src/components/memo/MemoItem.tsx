import type { Memo, Tag } from '../../types';
import { format } from 'date-fns';

interface MemoItemProps {
  memo: Memo;
  tags: Tag[];
  onClick: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onToggleArchive: () => void;
}

export function MemoItem({
  memo,
  tags,
  onClick,
  onDelete,
  onTogglePin,
  onToggleArchive,
}: MemoItemProps) {
  const memoTags = tags.filter((tag) => memo.tagIds.includes(tag.id));

  return (
    <div
      className={`group bg-white rounded-lg shadow-sm border border-gray-200 p-4 cursor-pointer hover:shadow-md transition-shadow ${
        memo.isPinned ? 'border-l-4 border-l-primary-500' : ''
      } ${memo.color ? '' : ''}`}
      style={memo.color ? { borderLeftColor: memo.color, borderLeftWidth: '4px' } : undefined}
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            {memo.isPinned && (
              <svg className="w-4 h-4 text-primary-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
              </svg>
            )}
            <h3 className="font-semibold text-gray-900 truncate">{memo.title}</h3>
          </div>

          <p className="mt-1 text-sm text-gray-600 line-clamp-2">
            {memo.content}
          </p>

          {memo.link && (
            <a
              href={memo.link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="mt-2 inline-flex items-center text-sm text-primary-600 hover:text-primary-700"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {memo.link}
            </a>
          )}

          {memoTags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {memoTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                  style={{ backgroundColor: tag.color + '20', color: tag.color }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}

          <p className="mt-2 text-xs text-gray-400">
            {format(memo.updatedAt, 'MMM d, yyyy h:mm a')}
          </p>
        </div>

        <div className="flex items-center space-x-1 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onTogglePin();
            }}
            className="p-1 text-gray-400 hover:text-primary-600 hover:bg-gray-100 rounded"
            title={memo.isPinned ? '取消置顶' : '置顶'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleArchive();
            }}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
            title={memo.isArchived ? '取消归档' : '归档'}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V10m-9 4h4" />
            </svg>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            className="p-1 text-gray-400 hover:text-red-600 hover:bg-gray-100 rounded"
            title="删除"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
