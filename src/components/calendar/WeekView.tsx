import type { CalendarEvent } from '../../types';
import {
  format,
  startOfWeek,
  addDays,
  isSameDay,
  isToday,
  isSameMonth,
  startOfMonth,
  endOfMonth,
} from 'date-fns';

interface WeekViewProps {
  date: Date;
  events: CalendarEvent[];
  getEventsByDateRange: (start: Date, end: Date) => CalendarEvent[];
  onEventClick: (event: CalendarEvent, e: React.MouseEvent) => void;
  onDateClick: (date: Date) => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

export function WeekView({ date, events, onEventClick, onDateClick }: WeekViewProps) {
  const weekStart = startOfWeek(date);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  const getEventsForDayHour = (day: Date, hour: number) => {
    return events.filter((event) => {
      const eventDate = new Date(event.startTime);
      return isSameDay(eventDate, day) && eventDate.getHours() === hour;
    });
  };

  const monthStart = startOfMonth(date);
  const monthEnd = endOfMonth(date);

  return (
    <div className="flex flex-col h-full">
      {/* Day headers */}
      <div className="flex border-b">
        <div className="w-16 flex-shrink-0" />
        {weekDays.map((day) => (
          <div
            key={day.toISOString()}
            className={`flex-1 py-2 text-center border-l ${
              isToday(day) ? 'bg-primary-50' : isSameMonth(day, monthStart) || isSameMonth(day, monthEnd) ? 'bg-white' : 'bg-gray-50'
            }`}
          >
            <div className="text-xs text-gray-500">{format(day, 'EEE')}</div>
            <div
              className={`text-lg font-semibold ${
                isToday(day) ? 'text-primary-600' : 'text-gray-900'
              }`}
            >
              {format(day, 'd')}
            </div>
          </div>
        ))}
      </div>

      {/* Time grid */}
      <div className="flex-1 overflow-y-auto">
        {HOURS.map((hour) => (
          <div key={hour} className="flex border-b border-gray-100 min-h-[40px]">
            <div className="w-16 flex-shrink-0 py-1 pr-2 text-right text-xs text-gray-400">
              {format(new Date().setHours(hour, 0, 0, 0), 'h a')}
            </div>
            {weekDays.map((day) => {
              const dayEvents = getEventsForDayHour(day, hour);
              return (
                <div
                  key={day.toISOString()}
                  className="flex-1 border-l border-gray-100 relative hover:bg-gray-50 cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    const clickedTime = new Date(day);
                    clickedTime.setHours(hour, 0, 0, 0);
                    onDateClick(clickedTime);
                  }}
                >
                  {dayEvents.map((event) => (
                    <div
                      key={event.id}
                      className="absolute left-0 right-0 px-1 py-0.5 text-xs rounded cursor-pointer hover:opacity-80 overflow-hidden"
                      style={{
                        backgroundColor: event.color || '#0ea5e9',
                        color: 'white',
                        top: '1px',
                        height: 'calc(100% - 2px)',
                      }}
                      onClick={(e) => onEventClick(event, e)}
                    >
                      <span className="truncate">{event.title}</span>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
