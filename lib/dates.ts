import {
    startOfWeek,
    addDays,
    format,
  } from "date-fns";
  
  export function getWeekDays(date: Date) {
    const start = startOfWeek(date, {
      weekStartsOn: 1,
    });
  
    return Array.from({ length: 7 }, (_, i) =>
      addDays(start, i)
    );
  }
  
  export function formatDayLabel(date: Date) {
    return format(date, "EEE");
  }
  
  export function formatDayNumber(date: Date) {
    return format(date, "d");
  }