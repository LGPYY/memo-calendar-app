import type { CalendarEvent } from '../../types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  isSameMonth,
  isSameDay,
  isToday,
} from 'date-fns';

interface MonthViewProps {
  date: Date;
  events: CalendarEvent[];
  getEventsByDateRange: (start: Date, end: Date) => CalendarEvent[];
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void;
  onDateClick: (date: Date) => void;
}

export function MonthView({ date, events, onEventClick, onDateClick }: MonthViewProps) {
  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const days: Date[] = [];
  let current = calendarStart;
  while (current <= calendarEnd) {
    days.push(current);
    current = addDays(current, 1);
  }

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getEventsForDay = (day: Date) => {
    return events.filter((event) => isSameDay(new Date(event.startTime), day));
  };

  return (
    <div className="flex flex-col h-full">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-medium text-gray-600 bg-gray-50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6">
        {days.map((day) => {
          const dayEvents = getEventsForDay(day);
          const isCurrentMonth = isSameMonth(day, monthStart);
          const isSelected = isToday(day);

          return (
            <div
              key={day.toISOString()}
              className={`border-b border-r p-1 min-h-[100px] cursor-pointer hover:bg-gray-50 transition-colors ${
                !isCurrentMonth ? 'bg-gray-50' : 'bg-white'
              }`}
              onClick={() => onDateClick(day)}
            >
              <div className="flex justify-between items-start">
                <span
                  className={`inline-flex items-center justify-center w-7 h-7 text-sm rounded-full ${
                    isSelected
                      ? 'bg-primary-600 text-white font-semibold'
                      : isCurrentMonth
                      ? 'text-gray-900 hover:bg-gray-100'
                      : 'text-gray-400'
                  }`}
                >
                  {format(day, 'd')}
                </span>
              </div>

              <div className="mt-1 space-y-1 overflow-y-auto max-h-[80px]">
                {dayEvents.slice(0, 3).map((event) => (
                  <div
                    key={event.id}
                    className="px-1 py-0.5 text-xs rounded truncate cursor-pointer hover:opacity-80"
                    style={{
                      backgroundColor: event.color || '#0ea5e9',
                      color: 'white',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEventClick(event, e);
                    }}
                  >
                    {event.title}
                  </div>
                ))}
                {dayEvents.length > 3 && (
                  <div className="text-xs text-gray-500 px-1">
                    +{dayEvents.length - 3} more
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
