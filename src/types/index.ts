export interface Memo {
  id: string;
  title: string;
  content: string;
  link?: string;
  tagIds: string[];
  isPinned: boolean;
  isArchived: boolean;
  createdAt: number;
  updatedAt: number;
  reminderAt?: number;
  color?: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export type RecurrencePattern =
  | { type: 'daily'; interval: number }
  | { type: 'weekly'; interval: number; weekdays: number[] }
  | { type: 'monthly'; interval: number; dayOfMonth: number }
  | { type: 'yearly'; interval: number; month: number; dayOfMonth: number };

export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  startTime: number;
  endTime: number;
  isAllDay: boolean;
  location?: string;
  recurrence?: RecurrencePattern;
  recurrenceEndDate?: number;
  exceptions: number[];
  reminders: number[];
  color?: string;
  googleCalendarEventId?: string;
}

export interface Calendar {
  id: string;
  name: string;
  color: string;
  isPrimary: boolean;
  googleCalendarId?: string;
}

export interface Settings {
  id: string;
  key: string;
  value: string;
}

export type ViewMode = 'day' | 'week' | 'month';

export interface AppState {
  currentView: ViewMode;
  selectedDate: Date;
  sidebarOpen: boolean;
  googleAccessToken?: string;
}
