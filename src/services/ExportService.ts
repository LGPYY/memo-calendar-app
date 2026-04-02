import { createEvents, type EventAttributes } from 'ics';
import { format } from 'date-fns';
import type { Memo, CalendarEvent, Tag } from '../types';

export const exportService = {
  async exportMemosToJSON(memos: Memo[]): Promise<Blob> {
    const data = JSON.stringify(memos, null, 2);
    return new Blob([data], { type: 'application/json' });
  },

  async exportTagsToJSON(tags: Tag[]): Promise<Blob> {
    const data = JSON.stringify(tags, null, 2);
    return new Blob([data], { type: 'application/json' });
  },

  async exportEventsToJSON(events: CalendarEvent[]): Promise<Blob> {
    const data = JSON.stringify(events, null, 2);
    return new Blob([data], { type: 'application/json' });
  },

  async exportAllToJSON(data: {
    memos: Memo[];
    tags: Tag[];
    events: CalendarEvent[];
    calendars?: any[];
  }): Promise<Blob> {
    const exportData = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      ...data,
    };
    return new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  },

  async exportMemosToCSV(memos: Memo[], tags: Tag[]): Promise<Blob> {
    const headers = ['Title', 'Content', 'Tags', 'Pinned', 'Archived', 'Created At', 'Updated At', 'Reminder'];
    const rows = memos.map((memo) => {
      const memoTags = tags
        .filter((tag) => memo.tagIds.includes(tag.id))
        .map((tag) => tag.name)
        .join('; ');
      return [
        `"${(memo.title || '').replace(/"/g, '""')}"`,
        `"${(memo.content || '').replace(/"/g, '""')}"`,
        `"${memoTags}"`,
        memo.isPinned ? 'Yes' : 'No',
        memo.isArchived ? 'Yes' : 'No',
        format(memo.createdAt, 'yyyy-MM-dd HH:mm:ss'),
        format(memo.updatedAt, 'yyyy-MM-dd HH:mm:ss'),
        memo.reminderAt ? format(memo.reminderAt, 'yyyy-MM-dd HH:mm:ss') : '',
      ].join(',');
    });

    const csv = [headers.join(','), ...rows].join('\n');
    return new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  },

  async exportEventsToICal(events: CalendarEvent[]): Promise<Blob> {
    const icsEvents: EventAttributes[] = events.map((event) => {
      const start = new Date(event.startTime);
      const end = new Date(event.endTime);

      return {
        title: event.title,
        description: event.description,
        location: event.location,
        start: [
          start.getFullYear(),
          start.getMonth() + 1,
          start.getDate(),
          start.getHours(),
          start.getMinutes(),
        ] as [number, number, number, number, number],
        end: [
          end.getFullYear(),
          end.getMonth() + 1,
          end.getDate(),
          end.getHours(),
          end.getMinutes(),
        ] as [number, number, number, number, number],
        allDay: event.isAllDay,
        busyStatus: 'BUSY' as const,
        categories: event.color ? [event.color] : undefined,
        recurrenceRule: event.recurrence
          ? generateRecurrenceRule(event.recurrence)
          : undefined,
      };
    });

    return new Promise((resolve, reject) => {
      createEvents(icsEvents, (error, value) => {
        if (error) {
          reject(error);
        } else {
          resolve(new Blob([value], { type: 'text/calendar;charset=utf-8' }));
        }
      });
    });
  },

  async importFromJSON(file: File): Promise<{
    memos?: Memo[];
    tags?: Tag[];
    events?: CalendarEvent[];
    calendars?: any[];
  }> {
    const text = await file.text();
    const data = JSON.parse(text);

    // Handle both full export and individual type imports
    if (data.memos || data.tags || data.events || data.calendars) {
      return data;
    }

    // Handle array of items
    if (Array.isArray(data)) {
      // Try to detect type based on structure
      const firstItem = data[0];
      if (firstItem && 'title' in firstItem && 'content' in firstItem) {
        return { memos: data };
      }
      if (firstItem && 'startTime' in firstItem && 'endTime' in firstItem) {
        return { events: data };
      }
      if (firstItem && 'name' in firstItem && 'color' in firstItem) {
        return { tags: data };
      }
    }

    throw new Error('Unknown JSON format');
  },

  async importFromICal(file: File): Promise<CalendarEvent[]> {
    const text = await file.text();
    const events = parseICal(text);
    return events;
  },
};

function generateRecurrenceRule(recurrence: any): string {
  const { type, interval } = recurrence;
  const intervalStr = interval > 1 ? `;INTERVAL=${interval}` : '';

  switch (type) {
    case 'daily':
      return `FREQ=DAILY${intervalStr}`;
    case 'weekly':
      return `FREQ=WEEKLY${intervalStr}`;
    case 'monthly':
      return `FREQ=MONTHLY${intervalStr}`;
    case 'yearly':
      return `FREQ=YEARLY${intervalStr}`;
    default:
      return '';
  }
}

function parseICal(icalString: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const lines = icalString.split(/\r?\n/);
  let currentEvent: Partial<CalendarEvent> | null = null;
  let currentKey = '';
  let currentValue = '';

  for (const line of lines) {
    if (line.startsWith('BEGIN:VEVENT')) {
      currentEvent = {
        exceptions: [],
        reminders: [],
      };
    } else if (line.startsWith('END:VEVENT') && currentEvent) {
      if (currentEvent.startTime && currentEvent.endTime) {
        events.push(currentEvent as CalendarEvent);
      }
      currentEvent = null;
    } else if (currentEvent) {
      // Handle line folding
      if (line.startsWith(' ') || line.startsWith('\t')) {
        currentValue += line.substring(1);
      } else {
        // Save previous key-value pair
        if (currentKey) {
          processICalLine(currentKey, currentValue, currentEvent);
        }
        const [key, ...valueParts] = line.split(':');
        currentKey = key;
        currentValue = valueParts.join(':');
      }
    }
  }

  // Process last key-value pair
  if (currentKey && currentEvent) {
    processICalLine(currentKey, currentValue, currentEvent);
  }

  return events;
}

function processICalLine(key: string, value: string, event: Partial<CalendarEvent>) {
  // Handle attributes with parameters (e.g., DTSTART;VALUE=DATE:20240101)
  const [baseKey, ...paramParts] = key.split(';');
  const params = paramParts.join(';');

  switch (baseKey) {
    case 'DTSTART':
      if (params.includes('VALUE=DATE')) {
        event.startTime = parseICalDate(value, true);
        event.isAllDay = true;
      } else {
        event.startTime = parseICalDate(value, false);
        event.isAllDay = false;
      }
      break;
    case 'DTEND':
      if (params.includes('VALUE=DATE')) {
        event.endTime = parseICalDate(value, true) + 86400000; // Add one day for all-day events
      } else {
        event.endTime = parseICalDate(value, false);
      }
      break;
    case 'SUMMARY':
      event.title = unescapeICal(value);
      break;
    case 'DESCRIPTION':
      event.description = unescapeICal(value);
      break;
    case 'LOCATION':
      event.location = unescapeICal(value);
      break;
    case 'RRULE':
      event.recurrence = parseRRule(value);
      break;
    case 'UID':
      // Use UID as temporary ID, will be replaced with new UUID
      break;
  }
}

function parseICalDate(dateStr: string, isAllDay: boolean): number {
  if (isAllDay) {
    // Format: YYYYMMDD
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    return new Date(year, month, day).getTime();
  } else {
    // Format: YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
    const year = parseInt(dateStr.substring(0, 4));
    const month = parseInt(dateStr.substring(4, 6)) - 1;
    const day = parseInt(dateStr.substring(6, 8));
    const hour = parseInt(dateStr.substring(9, 11));
    const minute = parseInt(dateStr.substring(11, 13));
    const second = parseInt(dateStr.substring(13, 15));
    const isUTC = dateStr.endsWith('Z');

    const date = new Date(year, month, day, hour, minute, second);
    if (isUTC) {
      return date.getTime() - date.getTimezoneOffset() * 60000;
    }
    return date.getTime();
  }
}

function parseRRule(rruleStr: string): any {
  const parts = rruleStr.split(';');
  const result: any = {};

  for (const part of parts) {
    const [key, value] = part.split('=');
    switch (key) {
      case 'FREQ':
        result.type = value.toLowerCase();
        break;
      case 'INTERVAL':
        result.interval = parseInt(value);
        break;
      case 'UNTIL':
        result.recurrenceEndDate = parseICalDate(value, false);
        break;
    }
  }

  return result;
}

function unescapeICal(str: string): string {
  return str
    .replace(/\\n/g, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
