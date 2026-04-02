import Dexie, { type Table } from 'dexie';
import type { Memo, Tag, CalendarEvent, Calendar, Settings } from '../types';

export class AppDatabase extends Dexie {
  memos!: Table<Memo, string>;
  tags!: Table<Tag, string>;
  events!: Table<CalendarEvent, string>;
  calendars!: Table<Calendar, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super('memoCalendarApp');

    this.version(1).stores({
      memos: 'id, createdAt, updatedAt, *tagIds, isPinned, isArchived',
      tags: 'id, name',
      events: 'id, startTime, endTime, *recurrence, *exceptions',
      calendars: 'id, name, isPrimary',
      settings: 'id, key'
    });
  }
}

export const db = new AppDatabase();

export const dbService = {
  // Memo operations
  async getAllMemos(): Promise<Memo[]> {
    return db.memos.orderBy('createdAt').reverse().toArray();
  },

  async getMemo(id: string): Promise<Memo | undefined> {
    return db.memos.get(id);
  },

  async createMemo(memo: Memo): Promise<string> {
    return db.memos.add(memo);
  },

  async updateMemo(id: string, updates: Partial<Memo>): Promise<number> {
    return db.memos.update(id, { ...updates, updatedAt: Date.now() });
  },

  async deleteMemo(id: string): Promise<void> {
    return db.memos.delete(id);
  },

  async searchMemos(query: string): Promise<Memo[]> {
    const lowerQuery = query.toLowerCase();
    return db.memos
      .filter(memo =>
        memo.title.toLowerCase().includes(lowerQuery) ||
        memo.content.toLowerCase().includes(lowerQuery)
      )
      .toArray();
  },

  // Tag operations
  async getAllTags(): Promise<Tag[]> {
    return db.tags.toArray();
  },

  async createTag(tag: Tag): Promise<string> {
    return db.tags.add(tag);
  },

  async updateTag(id: string, updates: Partial<Tag>): Promise<number> {
    return db.tags.update(id, updates);
  },

  async deleteTag(id: string): Promise<void> {
    await db.tags.delete(id);
    // Remove tag from all memos
    const memos = await db.memos.where('tagIds').equals(id).toArray();
    for (const memo of memos) {
      await db.memos.update(memo.id, {
        tagIds: memo.tagIds.filter(tid => tid !== id)
      });
    }
  },

  // Event operations
  async getAllEvents(): Promise<CalendarEvent[]> {
    return db.events.toArray();
  },

  async getEvent(id: string): Promise<CalendarEvent | undefined> {
    return db.events.get(id);
  },

  async createEvent(event: CalendarEvent): Promise<string> {
    return db.events.add(event);
  },

  async updateEvent(id: string, updates: Partial<CalendarEvent>): Promise<number> {
    return db.events.update(id, updates);
  },

  async deleteEvent(id: string): Promise<void> {
    return db.events.delete(id);
  },

  async getEventsByDateRange(start: Date, end: Date): Promise<CalendarEvent[]> {
    return db.events
      .filter(event => event.startTime >= start.getTime() && event.startTime <= end.getTime())
      .toArray();
  },

  // Calendar operations
  async getAllCalendars(): Promise<Calendar[]> {
    return db.calendars.toArray();
  },

  async createCalendar(calendar: Calendar): Promise<string> {
    return db.calendars.add(calendar);
  },

  async updateCalendar(id: string, updates: Partial<Calendar>): Promise<number> {
    return db.calendars.update(id, updates);
  },

  async deleteCalendar(id: string): Promise<void> {
    return db.calendars.delete(id);
  },

  // Settings operations
  async getSetting(key: string): Promise<string | undefined> {
    const setting = await db.settings.get(key);
    return setting?.value;
  },

  async setSetting(key: string, value: string): Promise<string> {
    return db.settings.put({ id: key, key, value });
  },

  // Export/Import
  async exportAllData(): Promise<{
    memos: Memo[];
    tags: Tag[];
    events: CalendarEvent[];
    calendars: Calendar[];
  }> {
    const [memos, tags, events, calendars] = await Promise.all([
      db.memos.toArray(),
      db.tags.toArray(),
      db.events.toArray(),
      db.calendars.toArray()
    ]);
    return { memos, tags, events, calendars };
  },

  async importData(data: {
    memos?: Memo[];
    tags?: Tag[];
    events?: CalendarEvent[];
    calendars?: Calendar[];
  }): Promise<void> {
    await db.transaction('rw', [db.memos, db.tags, db.events, db.calendars], async () => {
      if (data.tags) {
        for (const tag of data.tags) {
          await db.tags.put(tag);
        }
      }
      if (data.calendars) {
        for (const calendar of data.calendars) {
          await db.calendars.put(calendar);
        }
      }
      if (data.memos) {
        for (const memo of data.memos) {
          await db.memos.put(memo);
        }
      }
      if (data.events) {
        for (const event of data.events) {
          await db.events.put(event);
        }
      }
    });
  },

  async clearAllData(): Promise<void> {
    await db.transaction('rw', [db.memos, db.tags, db.events, db.calendars, db.settings], async () => {
      await db.memos.clear();
      await db.tags.clear();
      await db.events.clear();
      await db.calendars.clear();
      await db.settings.clear();
    });
  }
};
