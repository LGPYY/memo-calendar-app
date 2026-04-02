import { useState, useEffect, useCallback, useRef } from 'react';
import type { Memo, CalendarEvent } from '../types';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const timeoutsRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    if ('Notification' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) {
      return 'denied';
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    return result;
  }, []);

  const scheduleNotification = useCallback(
    (
      id: string,
      title: string,
      body: string,
      timestamp: number,
      onClick?: () => void
    ) => {
      if (permission !== 'granted') return;

      // Clear existing timeout for this id
      if (timeoutsRef.current.has(id)) {
        clearTimeout(timeoutsRef.current.get(id));
      }

      const now = Date.now();
      const delay = timestamp - now;

      if (delay <= 0) return;

      const timeout = setTimeout(() => {
        const notification = new Notification(title, {
          body,
          icon: '/pwa-192x192.png',
          badge: '/pwa-192x192.png',
        });

        notification.onclick = () => {
          window.focus();
          onClick?.();
          notification.close();
        };

        timeoutsRef.current.delete(id);
      }, delay);

      timeoutsRef.current.set(id, timeout);
    },
    [permission]
  );

  const cancelNotification = useCallback((id: string) => {
    if (timeoutsRef.current.has(id)) {
      clearTimeout(timeoutsRef.current.get(id));
      timeoutsRef.current.delete(id);
    }
  }, []);

  const cancelAllNotifications = useCallback(() => {
    timeoutsRef.current.forEach((timeout) => clearTimeout(timeout));
    timeoutsRef.current.clear();
  }, []);

  const scheduleMemoReminder = useCallback(
    (memo: Memo, onClick?: () => void) => {
      if (memo.reminderAt) {
        scheduleNotification(
          `memo-${memo.id}`,
          `Reminder: ${memo.title}`,
          memo.content.substring(0, 100),
          memo.reminderAt,
          onClick
        );
      }
    },
    [scheduleNotification]
  );

  const scheduleEventReminder = useCallback(
    (event: CalendarEvent, minutesBefore: number, onClick?: () => void) => {
      const reminderTime = event.startTime - minutesBefore * 60 * 1000;
      scheduleNotification(
        `event-${event.id}-${minutesBefore}`,
        `Upcoming: ${event.title}`,
        event.description?.substring(0, 100) || `Starting at ${new Date(event.startTime).toLocaleTimeString()}`,
        reminderTime,
        onClick
      );
    },
    [scheduleNotification]
  );

  useEffect(() => {
    return () => {
      cancelAllNotifications();
    };
  }, [cancelAllNotifications]);

  return {
    permission,
    isSupported,
    requestPermission,
    scheduleNotification,
    cancelNotification,
    cancelAllNotifications,
    scheduleMemoReminder,
    scheduleEventReminder,
  };
}
