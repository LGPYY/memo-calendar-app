import { useEffect } from 'react';
import { useEvents, useNotifications } from '../hooks';
import { CalendarView } from '../components/calendar';

export function CalendarPage() {
  const {
    events,
    createEvent,
    updateEvent,
    deleteEvent,
    getEventsByDateRange,
  } = useEvents();
  const { permission, scheduleEventReminder } = useNotifications();

  // Set up reminder notifications for events
  useEffect(() => {
    if (permission === 'granted') {
      events.forEach((event) => {
        // Schedule reminders for 15 minutes before
        scheduleEventReminder(event, 15, () => {
          // Navigate to calendar or focus the app
        });
      });
    }
  }, [events, permission, scheduleEventReminder]);

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)]">
      <CalendarView
        events={events}
        onCreateEvent={createEvent}
        onUpdateEvent={updateEvent}
        onDeleteEvent={deleteEvent}
        getEventsByDateRange={getEventsByDateRange}
      />
    </div>
  );
}
