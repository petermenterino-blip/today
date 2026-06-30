import { useState, useMemo } from 'react';

export type CalendarView = 'month' | 'week' | 'day' | 'agenda';

export interface CalendarCell {
  dayNumber: number;
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
}

export function useCalendar() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [currentView, setCurrentView] = useState<CalendarView>('month');

  const navigatePrev = () => {
    const d = new Date(currentDate);
    if (currentView === 'month' || currentView === 'agenda') d.setMonth(d.getMonth() - 1);
    else if (currentView === 'week') d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 1);
    setCurrentDate(d);
  };

  const navigateNext = () => {
    const d = new Date(currentDate);
    if (currentView === 'month' || currentView === 'agenda') d.setMonth(d.getMonth() + 1);
    else if (currentView === 'week') d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 1);
    setCurrentDate(d);
  };

  const goToToday = () => setCurrentDate(new Date());

  const jumpToDate = (dateStr: string) => {
    if (dateStr) setCurrentDate(new Date(dateStr));
  };

  const monthCells = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay();
    const daysCount = new Date(year, month + 1, 0).getDate();
    const cells: CalendarCell[] = [];

    const prevMonthDays = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      cells.push({ dayNumber: d, date: new Date(year, month - 1, d), isCurrentMonth: false, isToday: false });
    }
    for (let d = 1; d <= daysCount; d++) {
      const date = new Date(year, month, d);
      cells.push({ dayNumber: d, date, isCurrentMonth: true, isToday: date.toDateString() === new Date().toDateString() });
    }
    const remaining = 42 - cells.length;
    for (let d = 1; d <= remaining; d++) {
      cells.push({ dayNumber: d, date: new Date(year, month + 1, d), isCurrentMonth: false, isToday: false });
    }
    return cells;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const current = new Date(currentDate);
    const day = current.getDay();
    const diff = current.getDate() - day;
    const sunday = new Date(current.setDate(diff));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const hourSlots = useMemo(() => {
    const hours: string[] = [];
    for (let h = 8; h <= 20; h++) {
      hours.push(`${h.toString().padStart(2, '0')}:00`);
      hours.push(`${h.toString().padStart(2, '0')}:30`);
    }
    return hours;
  }, []);

  const calendarTitle = useMemo(() => {
    if (currentView === 'month' || currentView === 'agenda') {
      return currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
    }
    if (currentView === 'week') {
      const start = weekDays[0];
      const end = weekDays[6];
      return `${start.toLocaleDateString('default', { month: 'short', day: 'numeric' })} \u2013 ${end.toLocaleDateString('default', { month: 'short', day: 'numeric' })}`;
    }
    if (currentView === 'day') {
      return `${currentDate.toLocaleDateString('default', { weekday: 'long' })}, ${currentDate.toLocaleDateString('default', { month: 'long' })} ${currentDate.getDate()}`;
    }
    return '';
  }, [currentDate, currentView, weekDays]);

  return {
    currentDate,
    setCurrentDate,
    currentView,
    setCurrentView,
    navigatePrev,
    navigateNext,
    goToToday,
    jumpToDate,
    monthCells,
    weekDays,
    hourSlots,
    calendarTitle,
  };
}
