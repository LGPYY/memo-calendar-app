import { useState, useEffect } from 'react';
import type { CalendarEvent, RecurrencePattern } from '../../types';
import { Button, Input, Textarea } from '../common';
import { Modal } from '../common/Modal';
import { format, addHours } from 'date-fns';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: CalendarEvent | null;
  defaultDate: Date | null;
  onSave: (data: Omit<CalendarEvent, 'id'>) => void;
  onDelete: () => void;
}

const RECURRENCE_TYPES = [
  { value: 'daily', label: '每天' },
  { value: 'weekly', label: '每周' },
  { value: 'monthly', label: '每月' },
  { value: 'yearly', label: '每年' },
];

const COLOR_OPTIONS = [
  '#ef4444', '#f97316', '#f59e0b', '#84cc16',
  '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9',
  '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7',
  '#d946ef', '#ec4899', '#f43f5e', '#64748b',
];

export function EventModal({
  isOpen,
  onClose,
  event,
  defaultDate,
  onSave,
  onDelete,
}: EventModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [isAllDay, setIsAllDay] = useState(false);
  const [location, setLocation] = useState('');
  const [color, setColor] = useState('#0ea5e9');
  const [recurrenceType, setRecurrenceType] = useState<string>('none');
  const [recurrenceInterval, setRecurrenceInterval] = useState(1);
  const [recurrenceEndDate, setRecurrenceEndDate] = useState('');

  useEffect(() => {
    if (event) {
      setTitle(event.title);
      setDescription(event.description || '');
      setStartDate(format(new Date(event.startTime), 'yyyy-MM-dd'));
      setStartTime(format(new Date(event.startTime), 'HH:mm'));
      setEndDate(format(new Date(event.endTime), 'yyyy-MM-dd'));
      setEndTime(format(new Date(event.endTime), 'HH:mm'));
      setIsAllDay(event.isAllDay);
      setLocation(event.location || '');
      setColor(event.color || '#0ea5e9');
      setRecurrenceType(event.recurrence?.type || 'none');
      setRecurrenceInterval(event.recurrence?.interval || 1);
      setRecurrenceEndDate(
        event.recurrenceEndDate ? format(new Date(event.recurrenceEndDate), 'yyyy-MM-dd') : ''
      );
    } else if (defaultDate) {
      const start = new Date(defaultDate);
      const end = addHours(start, 1);
      setTitle('');
      setDescription('');
      setStartDate(format(start, 'yyyy-MM-dd'));
      setStartTime(format(start, 'HH:mm'));
      setEndDate(format(end, 'yyyy-MM-dd'));
      setEndTime(format(end, 'HH:mm'));
      setIsAllDay(false);
      setLocation('');
      setColor('#0ea5e9');
      setRecurrenceType('none');
      setRecurrenceInterval(1);
      setRecurrenceEndDate('');
    }
  }, [event, defaultDate]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !startDate || !startTime) return;

    const startDateTime = new Date(`${startDate}T${startTime}`).getTime();
    const endDateTime = isAllDay
      ? new Date(`${endDate}T23:59`).getTime()
      : new Date(`${endDate}T${endTime}`).getTime();

    let recurrence: RecurrencePattern | undefined;
    if (recurrenceType !== 'none') {
      recurrence = {
        type: recurrenceType as RecurrencePattern['type'],
        interval: recurrenceInterval,
      } as RecurrencePattern;

      if (recurrenceType === 'weekly') {
        (recurrence as any).weekdays = [new Date(startDate).getDay()];
      } else if (recurrenceType === 'monthly') {
        (recurrence as any).dayOfMonth = new Date(startDate).getDate();
      } else if (recurrenceType === 'yearly') {
        (recurrence as any).month = new Date(startDate).getMonth();
        (recurrence as any).dayOfMonth = new Date(startDate).getDate();
      }
    }

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      startTime: startDateTime,
      endTime: endDateTime,
      isAllDay,
      location: location.trim() || undefined,
      recurrence,
      recurrenceEndDate: recurrenceEndDate ? new Date(recurrenceEndDate).getTime() : undefined,
      exceptions: event?.exceptions || [],
      reminders: event?.reminders || [],
      color: color !== '#0ea5e9' ? color : undefined,
    });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={event ? '编辑事件' : '新建事件'} size="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="事件标题"
          autoFocus
        />

        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="描述（可选）"
          rows={3}
        />

        <div className="flex items-center">
          <label className="flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isAllDay}
              onChange={(e) => setIsAllDay(e.target.checked)}
              className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
            />
            <span className="ml-2 text-sm text-gray-600">全天事件</span>
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            label="开始日期"
          />
          {!isAllDay && (
            <Input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              label="开始时间"
            />
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            label="结束日期"
          />
          {!isAllDay && (
            <Input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              label="结束时间"
            />
          )}
        </div>

        <Input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="地点（可选）"
          label="地点"
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">颜色</label>
          <div className="flex flex-wrap gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                className={`w-6 h-6 rounded-full transition-transform ${
                  color === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">重复</label>
          <div className="flex items-center space-x-4">
            <select
              value={recurrenceType}
              onChange={(e) => setRecurrenceType(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              <option value="none">不重复</option>
              {RECURRENCE_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>

            {recurrenceType !== 'none' && (
              <>
                <span className="text-sm text-gray-500">每</span>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={recurrenceInterval}
                  onChange={(e) => setRecurrenceInterval(parseInt(e.target.value) || 1)}
                  className="w-16 px-2 py-2 border border-gray-300 rounded-lg text-center focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <span className="text-sm text-gray-500">
                  {recurrenceType === 'daily' && '天'}
                  {recurrenceType === 'weekly' && '周'}
                  {recurrenceType === 'monthly' && '月'}
                  {recurrenceType === 'yearly' && '年'}
                </span>
              </>
            )}
          </div>

          {recurrenceType !== 'none' && (
            <div className="mt-2">
              <Input
                type="date"
                value={recurrenceEndDate}
                onChange={(e) => setRecurrenceEndDate(e.target.value)}
                label="重复结束日期"
                placeholder="截止日期"
              />
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          {event && (
            <Button type="button" variant="danger" onClick={onDelete}>
              删除
            </Button>
          )}
          <div className="flex space-x-3 ml-auto">
            <Button type="button" variant="ghost" onClick={onClose}>
              取消
            </Button>
            <Button type="submit" disabled={!title.trim() || !startDate}>
              {event ? '更新' : '创建'} 事件
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
