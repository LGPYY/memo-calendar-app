import { useState, useRef } from 'react';
import { Button } from '../components/common';
import { exportService, downloadBlob, googleCalendarService } from '../services';
import { dbService } from '../db';
import { useMemos, useTags, useEvents } from '../hooks';
import { useNotifications } from '../hooks/useNotifications';

export function SettingsPage() {
  const { memos, refreshMemos } = useMemos();
  const { tags, refreshTags } = useTags();
  const { events, refreshEvents } = useEvents();
  const { permission, requestPermission, isSupported } = useNotifications();

  const [importStatus, setImportStatus] = useState<string>('');
  const [exportStatus, setExportStatus] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportAllJSON = async () => {
    try {
      setExportStatus('正在导出...');
      const data = await dbService.exportAllData();
      const blob = await exportService.exportAllToJSON(data);
      downloadBlob(blob, `memocal-backup-${new Date().toISOString().split('T')[0]}.json`);
      setExportStatus('导出成功！');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      setExportStatus('导出失败：' + (error as Error).message);
    }
  };

  const handleExportMemosCSV = async () => {
    try {
      setExportStatus('正在导出 CSV...');
      const blob = await exportService.exportMemosToCSV(memos, tags);
      downloadBlob(blob, `memos-${new Date().toISOString().split('T')[0]}.csv`);
      setExportStatus('CSV 导出成功！');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      setExportStatus('CSV 导出失败：' + (error as Error).message);
    }
  };

  const handleExportEventsICal = async () => {
    try {
      setExportStatus('正在导出 iCal...');
      const blob = await exportService.exportEventsToICal(events);
      downloadBlob(blob, `events-${new Date().toISOString().split('T')[0]}.ics`);
      setExportStatus('iCal 导出成功！');
      setTimeout(() => setExportStatus(''), 3000);
    } catch (error) {
      setExportStatus('iCal 导出失败：' + (error as Error).message);
    }
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('正在导入...');
      const data = await exportService.importFromJSON(file);
      await dbService.importData(data);
      await refreshMemos();
      await refreshTags();
      await refreshEvents();
      setImportStatus('导入成功！');
      setTimeout(() => setImportStatus(''), 3000);
    } catch (error) {
      setImportStatus('导入失败：' + (error as Error).message);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImportICal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImportStatus('正在导入 iCal...');
      const importedEvents = await exportService.importFromICal(file);
      for (const event of importedEvents) {
        await dbService.createEvent(event);
      }
      await refreshEvents();
      setImportStatus('iCal 导入成功！');
      setTimeout(() => setImportStatus(''), 3000);
    } catch (error) {
      setImportStatus('iCal 导入失败：' + (error as Error).message);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('确定要删除所有数据吗？此操作不可撤销！')) {
      return;
    }

    try {
      await dbService.clearAllData();
      await refreshMemos();
      await refreshTags();
      await refreshEvents();
      setImportStatus('所有数据已清除！');
      setTimeout(() => setImportStatus(''), 3000);
    } catch (error) {
      setImportStatus('清除数据失败：' + (error as Error).message);
    }
  };

  const handleGoogleSignIn = async () => {
    if (!googleCalendarService.isConfigured()) {
      setExportStatus('Google 日历未配置，请在 .env 文件中设置 VITE_GOOGLE_CLIENT_ID 和 VITE_GOOGLE_API_KEY');
      return;
    }

    const success = await googleCalendarService.signIn();
    if (success) {
      setExportStatus('已登录 Google 日历');
    } else {
      setExportStatus('登录失败');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">设置</h1>

      {/* Notifications */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">通知</h2>
        <div className="space-y-2">
          {isSupported ? (
            <>
              <p className="text-sm text-gray-600">
                当前权限状态：<span className="font-medium">{permission === 'granted' ? '已授权' : permission === 'denied' ? '已拒绝' : '未决定'}</span>
              </p>
              {permission === 'default' && (
                <Button onClick={() => requestPermission()}>
                  请求通知权限
                </Button>
              )}
              {permission === 'denied' && (
                <p className="text-sm text-red-600">
                  通知已被阻止，请在浏览器设置中启用。
                </p>
              )}
              {permission === 'granted' && (
                <p className="text-sm text-green-600">
                  通知已启用，您将收到备忘录和事件的提醒。
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-600">
              您的浏览器不支持通知功能。
            </p>
          )}
        </div>
      </section>

      {/* Google Calendar */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Google 日历</h2>
        <div className="space-y-2">
          {googleCalendarService.isConfigured() ? (
            <>
              <p className="text-sm text-gray-600">
                Google 日历集成已配置。
              </p>
              {googleCalendarService.isSignedIn() ? (
                <p className="text-sm text-green-600">已登录</p>
              ) : (
                <Button onClick={handleGoogleSignIn}>登录 Google</Button>
              )}
            </>
          ) : (
            <p className="text-sm text-gray-600">
              未配置，请在 .env 文件中设置 VITE_GOOGLE_CLIENT_ID 和 VITE_GOOGLE_API_KEY 来启用。
            </p>
          )}
        </div>
      </section>

      {/* Export */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">导出数据</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleExportAllJSON}>
              导出全部 (JSON)
            </Button>
            <Button variant="secondary" onClick={handleExportMemosCSV}>
              导出备忘录 (CSV)
            </Button>
            <Button variant="secondary" onClick={handleExportEventsICal}>
              导出事件 (iCal)
            </Button>
          </div>
          {exportStatus && (
            <p className={`text-sm ${exportStatus.includes('失败') ? 'text-red-600' : 'text-green-600'}`}>
              {exportStatus}
            </p>
          )}
        </div>
      </section>

      {/* Import */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">导入数据</h2>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleImportJSON}
                className="hidden"
                id="json-import"
              />
              <label htmlFor="json-import" className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                导入 JSON
              </label>
            </div>
            <div>
              <input
                type="file"
                accept=".ics"
                onChange={handleImportICal}
                className="hidden"
                id="ics-import"
              />
              <label htmlFor="ics-import" className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer">
                导入 iCal (.ics)
              </label>
            </div>
          </div>
          {importStatus && (
            <p className={`text-sm ${importStatus.includes('失败') ? 'text-red-600' : 'text-green-600'}`}>
              {importStatus}
            </p>
          )}
        </div>
      </section>

      {/* Danger Zone */}
      <section className="bg-white rounded-lg shadow p-6 border border-red-200">
        <h2 className="text-lg font-semibold text-red-600 mb-4">危险区域</h2>
        <p className="text-sm text-gray-600 mb-4">
          这将永久删除您的所有备忘录、事件、标签和设置。
        </p>
        <Button variant="danger" onClick={handleClearAllData}>
          清除所有数据
        </Button>
      </section>

      {/* Storage Info */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">存储</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>备忘录：{memos.length}</p>
          <p>标签：{tags.length}</p>
          <p>事件：{events.length}</p>
          <p className="text-xs text-gray-400 mt-4">
            数据存储在浏览器本地的 IndexedDB 中。它会在会话之间保留，但如果您清除浏览器数据可能会被清除。
          </p>
        </div>
      </section>

      {/* About */}
      <section className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">关于</h2>
        <div className="space-y-2 text-sm text-gray-600">
          <p>MemoCal v1.0.0</p>
          <p>一款支持离线功能的备忘录和日历 Web 应用。</p>
          <p className="text-xs text-gray-400 mt-4">
            基于 React、TypeScript、Tailwind CSS、Dexie.js 等技术构建。
          </p>
        </div>
      </section>
    </div>
  );
}
