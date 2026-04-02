import type { Memo, CalendarEvent } from '../types';

export const notificationService = {
  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.requestPermission();
  },

  isSupported(): boolean {
    return 'Notification' in window;
  },

  getPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied';
    }
    return Notification.permission;
  },

  showNotification(title: string, options?: NotificationOptions): Notification | null {
    if (Notification.permission !== 'granted') {
      return null;
    }

    const notification = new Notification(title, {
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      ...options,
    });

    return notification;
  },

  scheduleMemoReminder(
    memo: Memo,
    onClick?: () => void
  ): string | null {
    if (!memo.reminderAt) return null;

    const now = Date.now();
    const delay = memo.reminderAt - now;

    if (delay <= 0) return null;

    setTimeout(() => {
      const notification = this.showNotification(`Reminder: ${memo.title}`, {
        body: memo.content.substring(0, 100),
        tag: `memo-${memo.id}`,
      });

      if (notification && onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }
    }, delay);

    return `memo-${memo.id}`;
  },

  scheduleEventReminder(
    event: CalendarEvent,
    minutesBefore: number,
    onClick?: () => void
  ): string | null {
    const reminderTime = event.startTime - minutesBefore * 60 * 1000;
    const now = Date.now();
    const delay = reminderTime - now;

    if (delay <= 0) return null;

    setTimeout(() => {
      const notification = this.showNotification(`Upcoming: ${event.title}`, {
        body: event.description?.substring(0, 100) || `Starting at ${new Date(event.startTime).toLocaleTimeString()}`,
        tag: `event-${event.id}-${minutesBefore}`,
      });

      if (notification && onClick) {
        notification.onclick = () => {
          window.focus();
          onClick();
          notification.close();
        };
      }
    }, delay);

    return `event-${event.id}-${minutesBefore}`;
  },

  cancelScheduledNotification(_notificationId: string, timeoutId: ReturnType<typeof setTimeout>): void {
    clearTimeout(timeoutId);
  },
};
