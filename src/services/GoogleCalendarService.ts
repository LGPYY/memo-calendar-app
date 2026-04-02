import type { CalendarEvent, RecurrencePattern } from '../types';
import { v4 as uuidv4 } from 'uuid';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/calendar';

export interface GoogleCalendarConfig {
  clientId: string;
  apiKey: string;
}

export const googleCalendarService = {
  isConfigured(): boolean {
    return Boolean(GOOGLE_CLIENT_ID && GOOGLE_API_KEY);
  },

  async initialize(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.warn('Google Calendar not configured');
      return false;
    }

    return new Promise((resolve) => {
      gapi.load('client:auth2', async () => {
        try {
          await gapi.client.init({
            apiKey: GOOGLE_API_KEY,
            clientId: GOOGLE_CLIENT_ID,
            discoveryDocs: DISCOVERY_DOCS,
            scope: SCOPES,
          });
          resolve(true);
        } catch (error) {
          console.error('Failed to initialize Google API:', error);
          resolve(false);
        }
      });
    });
  },

  async signIn(): Promise<boolean> {
    if (!gapi.auth2) {
      await this.initialize();
    }

    try {
      const auth = gapi.auth2.getAuthInstance();
      if (auth.isSignedIn.get()) {
        return true;
      }
      await auth.signIn();
      return auth.isSignedIn.get();
    } catch (error) {
      console.error('Failed to sign in:', error);
      return false;
    }
  },

  async signOut(): Promise<void> {
    const auth = gapi.auth2.getAuthInstance();
    await auth.signOut();
  },

  isSignedIn(): boolean {
    const auth = gapi.auth2.getAuthInstance();
    return auth?.isSignedIn.get() || false;
  },

  getAccessToken(): string | null {
    const auth = gapi.auth2.getAuthInstance();
    if (auth?.isSignedIn.get()) {
      return auth.currentUser.get().getAuthResponse().access_token;
    }
    return null;
  },

  async listCalendars(): Promise<any[]> {
    const response = await gapi.client.calendar.calendarList.list();
    return response.result.items || [];
  },

  async getEvents(calendarId: string, timeMin: string, timeMax: string): Promise<any[]> {
    const response = await gapi.client.calendar.events.list({
      calendarId,
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return response.result.items || [];
  },

  async createEvent(calendarId: string, event: CalendarEvent): Promise<string> {
    const googleEvent = convertToGoogleEvent(event);
    const response = await gapi.client.calendar.events.insert({
      calendarId,
      resource: googleEvent,
    });
    return response.result.id;
  },

  async updateEvent(calendarId: string, googleEventId: string, event: CalendarEvent): Promise<void> {
    const googleEvent = convertToGoogleEvent(event);
    await gapi.client.calendar.events.update({
      calendarId,
      eventId: googleEventId,
      resource: googleEvent,
    });
  },

  async deleteEvent(calendarId: string, googleEventId: string): Promise<void> {
    await gapi.client.calendar.events.delete({
      calendarId,
      eventId: googleEventId,
    });
  },

  syncEventToGoogle(event: CalendarEvent, calendarId: string): Promise<string | null> {
    return this.createEvent(calendarId, event);
  },

  async syncGoogleEventToLocal(googleEvent: any, events: CalendarEvent[]): Promise<CalendarEvent | null> {
    const existingEvent = events.find(
      (e) => e.googleCalendarEventId === googleEvent.id
    );

    const convertedEvent = convertFromGoogleEvent(googleEvent);

    if (existingEvent) {
      return { ...existingEvent, ...convertedEvent };
    }

    return {
      ...convertedEvent,
      id: uuidv4(),
      googleCalendarEventId: googleEvent.id,
    } as CalendarEvent;
  },
};

function convertToGoogleEvent(event: CalendarEvent): any {
  const googleEvent: any = {
    summary: event.title,
    description: event.description,
    location: event.location,
    start: {},
    end: {},
    recurringEventId: event.recurrence ? undefined : undefined,
  };

  if (event.isAllDay) {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    googleEvent.start = {
      date: formatDate(startDate),
    };
    googleEvent.end = {
      date: formatDate(endDate),
    };
  } else {
    googleEvent.start = {
      dateTime: new Date(event.startTime).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
    googleEvent.end = {
      dateTime: new Date(event.endTime).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    };
  }

  if (event.recurrence) {
    googleEvent.recurrence = [`RRULE:${generateRRule(event.recurrence)}`];
  }

  if (event.color) {
    googleEvent.colorId = getGoogleColorId(event.color);
  }

  return googleEvent;
}

function convertFromGoogleEvent(googleEvent: any): Partial<CalendarEvent> {
  const start = googleEvent.start?.dateTime || googleEvent.start?.date;
  const end = googleEvent.end?.dateTime || googleEvent.end?.date;

  const isAllDay = Boolean(googleEvent.start?.date);

  return {
    title: googleEvent.summary || 'Untitled',
    description: googleEvent.description,
    location: googleEvent.location,
    startTime: new Date(start).getTime(),
    endTime: new Date(end).getTime(),
    isAllDay,
    color: getColorFromGoogle(googleEvent.colorId),
    recurrence: parseRRule(googleEvent.recurrence?.[0]),
  };
}

function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}${month}${day}`;
}

function generateRRule(recurrence: RecurrencePattern): string {
  const { type, interval = 1 } = recurrence;
  const parts: string[] = [];

  switch (type) {
    case 'daily':
      parts.push('FREQ=DAILY');
      break;
    case 'weekly':
      parts.push('FREQ=WEEKLY');
      break;
    case 'monthly':
      parts.push('FREQ=MONTHLY');
      break;
    case 'yearly':
      parts.push('FREQ=YEARLY');
      break;
  }

  if (interval > 1) {
    parts.push(`INTERVAL=${interval}`);
  }

  return parts.join(';');
}

function parseRRule(rrule?: string): RecurrencePattern | undefined {
  if (!rrule) return undefined;

  const match = rrule.match(/FREQ=(\w+)/i);
  if (!match) return undefined;

  const freq = match[1].toUpperCase();
  const intervalMatch = rrule.match(/INTERVAL=(\d+)/i);
  const interval = intervalMatch ? parseInt(intervalMatch[1]) : 1;

  switch (freq) {
    case 'DAILY':
      return { type: 'daily', interval };
    case 'WEEKLY':
      return { type: 'weekly', interval, weekdays: [] };
    case 'MONTHLY':
      return { type: 'monthly', interval, dayOfMonth: 1 };
    case 'YEARLY':
      return { type: 'yearly', interval, month: 0, dayOfMonth: 1 };
    default:
      return undefined;
  }
}

const GOOGLE_COLORS: Record<string, string> = {
  '1': '#7986cb',
  '2': '#33b679',
  '3': '#8e24aa',
  '4': '#e67c73',
  '5': '#f6c026',
  '6': '#f5511d',
  '7': '#039be5',
  '8': '#616161',
  '9': '#3f51b5',
  '10': '#795548',
  '11': '#d50000',
};

function getGoogleColorId(color: string): string | undefined {
  const entry = Object.entries(GOOGLE_COLORS).find(([, c]) => c === color);
  return entry?.[0];
}

function getColorFromGoogle(colorId?: string): string | undefined {
  if (!colorId) return undefined;
  return GOOGLE_COLORS[colorId];
}

// Type declaration for gapi
declare const gapi: {
  load: (api: string, callback: () => void) => void;
  client: {
    init: (config: any) => Promise<void>;
    calendar: {
      calendarList: {
        list: () => Promise<{ result: { items: any[] } }>;
      };
      events: {
        list: (params: any) => Promise<{ result: { items: any[] } }>;
        insert: (params: any) => Promise<{ result: { id: string } }>;
        update: (params: any) => Promise<void>;
        delete: (params: any) => Promise<void>;
      };
    };
  };
  auth2: {
    getAuthInstance: () => {
      isSignedIn: {
        get: () => boolean;
      };
      signIn: () => Promise<void>;
      signOut: () => Promise<void>;
      currentUser: {
        get: () => {
          getAuthResponse: () => { access_token: string };
        };
      };
    };
  };
};
