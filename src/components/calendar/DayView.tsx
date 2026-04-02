import type { CalendarEvent } from '../../types';
import { format, isSameDay, isToday } from 'date-fns';

interface DayViewProps {
  date: Date;
  events: CalendarEvent[];
  getEventsByDateRange: (start: Date, end: Date) => CalendarEvent[];
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void;
  onDateClick: (date: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function DayView({ date, events, onEventClick, onDateClick }: DayViewProps) {
  const dayEvents = events.filter((event) => isSameDay(new Date(event.startTime), date));

  const getEventsForHour = (hour: number) => {
    return dayEvents.filter((event) => {
      const eventDate = new Date(event.startTime);
      return eventDate.getHours() === hour;
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Day header */}
      <div
        className={`flex items-center justify-center py-3 border-b ${
          isToday(date) ? 'bg-primary-50' : 'bg-gray-50'
        }`}
      >
        <div className="text-center">
          <div className="text-sm text-gray-500">{format(date, 'EEEE')}</div>
          <div
            className={`text-2xl font-semibold ${
              isToday(date) ? 'text-primary-600' : 'text-gray-900'
            }`}
          >
            {format(date, 'd')}
          </div>
        </div>
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        {HOURS.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          return (
            <div
              key={hour}
              className="flex border-b border-gray-100 min-h-[60px] hover:bg-gray-50 cursor-pointer"
              onClick={() => {
                const clickedTime = new Date(date);
                clickedTime.setHours(hour, 0, 0, 0);
                onDateClick(clickedTime);
              }}
            >
              <div className="w-16 flex-shrink-0 py-2 pr-2 text-right text-xs text-gray-400">
                {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
              </div>
              <div className="flex-1 border-l border-gray-100 relative">
                {hourEvents.map((event) => (
                  <div
                    key={event.id}
                    className="absolute left-0 right-0 px-2 py-1 text-xs rounded cursor-pointer hover:opacity-80 overflow-hidden"
                    style={{
                      backgroundColor: event.color || '#0ea5e9',
                      color: 'white',
                      top: '2px',
                      height: 'calc(100% - 4px)',
                    }}
                    onClick={(e) => onEventClick(event, e)}
                  >
                    <div className="font-medium truncate">
                      {format(new Date(event.startTime), 'h:mm a')} - {event.title}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
