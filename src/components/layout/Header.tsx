import { useAppStore } from '../../store';
import { useOffline } from '../../hooks';

export function Header() {
  const { sidebarOpen, toggleSidebar } = useAppStore();
  const { isOnline: onlineStatus } = useOffline();

  return (
    <header className="sticky top-0 z-30 flex items-center h-16 px-6 bg-white border-b border-gray-200">
      <button
        onClick={toggleSidebar}
        className="p-2 -ml-2 text-gray-600 hover:bg-gray-100 rounded-lg"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d={sidebarOpen ? 'M4 6h16M4 12h16M4 18h16' : 'M4 6h16v12H4V6zm0 0h16'}
          />
        </svg>
      </button>

      <div className="flex-1" />

      <div className="flex items-center space-x-4">
        {!onlineStatus && (
          <div className="flex items-center px-3 py-1 text-sm text-orange-600 bg-orange-50 rounded-full">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"
              />
            </svg>
            离线
          </div>
        )}

        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              onlineStatus ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-sm text-gray-600">
            {onlineStatus ? '在线' : '离线'}
          </span>
        </div>
      </div>
    </header>
  );
}
