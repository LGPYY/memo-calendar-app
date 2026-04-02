# MemoCal - 备忘录与日历应用

一款功能丰富的备忘录和日历 Web 应用，支持离线使用，可作为 PWA（渐进式网页应用）安装到桌面。

## 功能特性

### 备忘录
- 创建、编辑、删除备忘录
- 置顶和归档功能
- 标签管理（支持自定义颜色）
- 关键词搜索
- 备忘录颜色标记
- 浏览器通知提醒

### 日历
- 日视图、周视图、月视图切换
- 事件管理（创建、编辑、删除）
- 重复日程支持（每天、每周、每月、每年）
- 事件颜色分类

### 数据管理
- JSON 格式完整备份导出/导入
- CSV 格式备忘录导出
- iCal (.ics) 格式事件导入/导出
- 本地 IndexedDB 存储，无需服务器

### PWA 与离线支持
- 可安装到桌面（Windows、macOS、Linux）
- 离线时所有功能正常可用
- 自动更新

### Google 日历集成（可选）
- OAuth 2.0 授权
- 双向同步事件
- 需要配置 Google Cloud Console

## 技术栈

| 技术 | 用途 |
|------|------|
| React 18 + TypeScript | 框架 + 类型安全 |
| Vite | 构建工具 |
| Tailwind CSS | 样式 |
| Dexie.js | IndexedDB 封装 |
| Zustand | 状态管理 |
| date-fns | 日期处理 |

## 快速开始

### 安装依赖

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

访问 http://localhost:5173

### 构建生产版本

```bash
npm run build
```

构建产物在 `dist/` 目录。

### 预览生产版本

```bash
npm run preview
```

## Google 日历集成（可选）

1. 在 [Google Cloud Console](https://console.cloud.google.com/) 创建项目
2. 启用 Google Calendar API
3. 创建 OAuth 2.0 客户端 ID
4. 在项目根目录创建 `.env` 文件：

```env
VITE_GOOGLE_CLIENT_ID=your_client_id
VITE_GOOGLE_API_KEY=your_api_key
```

## 项目结构

```
memo-calendar-app/
├── src/
│   ├── components/       # UI 组件
│   │   ├── common/      # Button, Modal, Input, DatePicker 等
│   │   ├── layout/       # Sidebar, Header, Layout
│   │   ├── memo/         # MemoList, MemoItem, MemoEditor, TagManager
│   │   └── calendar/     # CalendarView, DayView, WeekView, MonthView, EventModal
│   ├── pages/            # MemoPage, CalendarPage, SettingsPage
│   ├── hooks/            # useMemos, useEvents, useTags, useNotifications, useOffline
│   ├── db/               # Dexie 实例和数据模型
│   ├── services/          # NotificationService, ExportService, GoogleCalendarService
│   ├── types/            # TypeScript 类型定义
│   └── store/            # Zustand store
├── public/               # PWA manifest, icons
├── vite.config.ts        # Vite + PWA 配置
└── tailwind.config.js    # Tailwind 配置
```

## 许可证

MIT
