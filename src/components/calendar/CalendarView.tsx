import { useState, useCallback } from 'react';
import type { CalendarEvent, ViewMode } from '../../types';
import { useAppStore } from '../../store';
import { DayView } from './DayView';
import { WeekView } from './WeekView';
import { MonthView } from './MonthView';
import { EventModal } from './EventModal';
import {
  format,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  addWeeks,
  subWeeks,
  addDays,
  subDays,
} from 'date-fns';

interface CalendarViewProps {
  events: CalendarEvent[];
  onCreateEvent: (data: Omit<CalendarEvent, 'id'>) => void;
  onUpdateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  onDeleteEvent: (id: string) => void;
  getEventsByDateRange: (start: Date, end: Date) => CalendarEvent[];
}

export function CalendarView({
  events,
  onCreateEvent,
  onUpdateEvent,
  onDeleteEvent,
  getEventsByDateRange,
}: CalendarViewProps) {
  const { currentView, setCurrentView, selectedDate, setSelectedDate } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [clickedDate, setClickedDate] = useState<Date | null>(null);

  const navigatePrev = useCallback(() => {
    switch (currentView) {
      case 'month':
        setSelectedDate(subMonths(selectedDate, 1));
        break;
      case 'week':
        setSelectedDate(subWeeks(selectedDate, 1));
        break;
      case 'day':
        setSelectedDate(subDays(selectedDate, 1));
        break;
    }
  }, [currentView, selectedDate, setSelectedDate]);

  const navigateNext = useCallback(() => {
    switch (currentView) {
      case 'month':
        setSelectedDate(addMonths(selectedDate, 1));
        break;
      case 'week':
        setSelectedDate(addWeeks(selectedDate, 1));
        break;
      case 'day':
        setSelectedDate(addDays(selectedDate, 1));
        break;
    }
  }, [currentView, selectedDate, setSelectedDate]);

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setClickedDate(date);
    setSelectedEvent(null);
    setIsModalOpen(true);
  };

  const handleEventClick = (event: CalendarEvent, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedEvent(event);
    setClickedDate(null);
    setIsModalOpen(true);
  };

  const handleSaveEvent = (data: Omit<CalendarEvent, 'id'>) => {
    if (selectedEvent) {
      onUpdateEvent(selectedEvent.id, data);
    } else {
      onCreateEvent(data);
    }
    setIsModalOpen(false);
    setSelectedEvent(null);
    setClickedDate(null);
  };

  const handleDeleteEvent = () => {
    if (selectedEvent) {
      onDeleteEvent(selectedEvent.id);
    }
    setIsModalOpen(false);
    setSelectedEvent(null);
    setClickedDate(null);
  };

  const getTitle = () => {
    switch (currentView) {
      case 'month':
        return format(selectedDate, 'MMMM yyyy');
      case 'week':
        const weekStart = startOfWeek(selectedDate);
        const weekEnd = endOfWeek(selectedDate);
        if (weekStart.getMonth() === weekEnd.getMonth()) {
          return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'd, yyyy')}`;
        }
        return `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      case 'day':
        return format(selectedDate, 'EEEE, MMMM d, yyyy');
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <button
            onClick={goToToday}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            今天
          </button>
          <div className="flex items-center space-x-1">
            <button
              onClick={navigatePrev}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={navigateNext}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
          <h2 className="text-xl font-semibold text-gray-900">{getTitle()}</h2>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex bg-gray-100 rounded-lg p-1">
            {([
              { key: 'day', label: '日' },
              { key: 'week', label: '周' },
              { key: 'month', label: '月' },
            ] as { key: ViewMode; label: string }[]).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setCurrentView(key)}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors capitalize ${
                  currentView === key
                    ? 'bg-white text-primary-600 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={() => {
              setSelectedEvent(null);
              setClickedDate(new Date());
              setIsModalOpen(true);
            }}
            className="p-2 text-white bg-primary-600 hover:bg-primary-700 rounded-lg"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
        </div>
      </div>

      {/* Calendar View */}
      <div className="flex-1 bg-white rounded-lg shadow overflow-hidden">
        {currentView === 'day' && (
          <DayView
            date={selectedDate}
            events={events}
            getEventsByDateRange={getEventsByDateRange}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        )}
        {currentView === 'week' && (
          <WeekView
            date={selectedDate}
            events={events}
            getEventsByDateRange={getEventsByDateRange}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        )}
        {currentView === 'month' && (
          <MonthView
            date={selectedDate}
            events={events}
            getEventsByDateRange={getEventsByDateRange}
            onEventClick={handleEventClick}
            onDateClick={handleDateClick}
          />
        )}
      </div>

      {/* Event Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
          setClickedDate(null);
        }}
        event={selectedEvent}
        defaultDate={clickedDate}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
      />
    </div>
  );
}
