import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from 'date-fns';

interface DatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  minDate?: Date;
}

export function DatePicker({ value, onChange, label, minDate }: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(value || new Date());

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  const handleSelect = (date: Date) => {
    onChange(date);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 text-left border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        {value ? format(value, 'PPP') : '选择日期'}
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <span className="font-medium">{format(currentMonth, 'yyyy年 MMMM')}</span>
            <button
              type="button"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-1 hover:bg-gray-100 rounded"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-sm">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <div key={day} className="text-gray-500 font-medium py-1">
                {day}
              </div>
            ))}
            {Array.from({ length: monthStart.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {days.map((day) => (
              <button
                key={day.toISOString()}
                type="button"
                onClick={() => handleSelect(day)}
                disabled={minDate && day < minDate}
                className={`p-2 rounded-lg text-sm ${
                  value && isSameDay(day, value)
                    ? 'bg-primary-600 text-white'
                    : isSameMonth(day, currentMonth)
                    ? 'hover:bg-gray-100'
                    : 'text-gray-400'
                } ${minDate && day < minDate ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {format(day, 'd')}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
