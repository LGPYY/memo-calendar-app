import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { CalendarEvent } from '../types';
import { dbService } from '../db';
import {
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  addDays,
  addWeeks,
  addMonths,
} from 'date-fns';

export function useEvents() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await dbService.getAllEvents();
      setEvents(data);
    } catch (error) {
      console.error('Failed to load events:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEvents();
  }, [loadEvents]);

  const generateOccurrences = useCallback(
    (event: CalendarEvent, rangeStart: Date, rangeEnd: Date): CalendarEvent[] => {
      if (!event.recurrence) {
        return [event];
      }

      const occurrences: CalendarEvent[] = [];
      const pattern = event.recurrence;
      let currentDate = new Date(event.startTime);
      const endDate = event.recurrenceEndDate
        ? new Date(event.recurrenceEndDate)
        : addMonths(new Date(event.startTime), 12);

      while (currentDate <= endDate && currentDate <= rangeEnd) {
        if (currentDate >= rangeStart && !event.exceptions.includes(currentDate.getTime())) {
          const duration = event.endTime - event.startTime;
          occurrences.push({
            ...event,
            startTime: currentDate.getTime(),
            endTime: currentDate.getTime() + duration,
          });
        }

        switch (pattern.type) {
          case 'daily':
            currentDate = addDays(currentDate, pattern.interval);
            break;
          case 'weekly':
            currentDate = addWeeks(currentDate, pattern.interval);
            if (pattern.weekdays && pattern.weekdays.length > 0) {
              // For simplicity, just add weeks
              currentDate = addWeeks(currentDate, pattern.interval);
            }
            break;
          case 'monthly':
            currentDate = addMonths(currentDate, pattern.interval);
            break;
          case 'yearly':
            currentDate = addMonths(currentDate, 12 * pattern.interval);
            break;
        }
      }

      return occurrences;
    },
    []
  );

  const getEventsByDateRange = useCallback(
    (start: Date, end: Date): CalendarEvent[] => {
      const allOccurrences: CalendarEvent[] = [];

      for (const event of events) {
        const occurrences = generateOccurrences(event, start, end);
        allOccurrences.push(...occurrences);
      }

      return allOccurrences.sort((a, b) => a.startTime - b.startTime);
    },
    [events, generateOccurrences]
  );

  const getEventsByDay = useCallback(
    (date: Date): CalendarEvent[] => {
      return getEventsByDateRange(startOfDay(date), endOfDay(date));
    },
    [getEventsByDateRange]
  );

  const getEventsByWeek = useCallback(
    (date: Date): CalendarEvent[] => {
      return getEventsByDateRange(startOfWeek(date), endOfWeek(date));
    },
    [getEventsByDateRange]
  );

  const getEventsByMonth = useCallback(
    (date: Date): CalendarEvent[] => {
      return getEventsByDateRange(startOfMonth(date), endOfMonth(date));
    },
    [getEventsByDateRange]
  );

  const createEvent = useCallback(
    async (data: Omit<CalendarEvent, 'id'>) => {
      const event: CalendarEvent = {
        ...data,
        id: uuidv4(),
        exceptions: data.exceptions || [],
        reminders: data.reminders || [],
      };
      await dbService.createEvent(event);
      setEvents((prev) => [...prev, event]);
      return event;
    },
    []
  );

  const updateEvent = useCallback(async (id: string, updates: Partial<CalendarEvent>) => {
    await dbService.updateEvent(id, updates);
    setEvents((prev) =>
      prev.map((event) => (event.id === id ? { ...event, ...updates } : event))
    );
  }, []);

  const deleteEvent = useCallback(async (id: string) => {
    await dbService.deleteEvent(id);
    setEvents((prev) => prev.filter((event) => event.id !== id));
  }, []);

  const addException = useCallback(
    async (id: string, exceptionDate: number) => {
      const event = events.find((e) => e.id === id);
      if (event) {
        const newExceptions = [...event.exceptions, exceptionDate];
        await updateEvent(id, { exceptions: newExceptions });
      }
    },
    [events, updateEvent]
  );

  const getEventById = useCallback(
    (id: string) => {
      return events.find((event) => event.id === id);
    },
    [events]
  );

  return {
    events,
    loading,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventById,
    getEventsByDay,
    getEventsByWeek,
    getEventsByMonth,
    getEventsByDateRange,
    addException,
    refreshEvents: loadEvents,
    generateOccurrences,
  };
}
