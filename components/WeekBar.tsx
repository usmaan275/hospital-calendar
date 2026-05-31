"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { addWeeks, isSameDay } from "date-fns";

import {
  getWeekDays,
  formatDayLabel,
  formatDayNumber,
} from "@/lib/dates";

interface Props {
  selectedDay: Date;
  onSelectDay: (day: Date) => void;
  weekDate: Date;
  setWeekDate: (date: Date) => void;
  onToday: () => void;
}

export default function WeekBar({
  selectedDay,
  onSelectDay,
  weekDate,
  setWeekDate,
  onToday,
}: Props) {
  const weekDays = getWeekDays(weekDate);
  const viewingToday = isSameDay(selectedDay, new Date());

  return (
    <div className="sticky top-0 z-20 bg-[#070B14] border-b border-white/10">
      <div className="flex items-center px-2 py-3">
        <button
          onClick={() =>
            setWeekDate(addWeeks(weekDate, -1))
          }
          className="p-2"
        >
          <ChevronLeft size={20} />
        </button>

        <div className="flex flex-1 justify-between">
          {weekDays.map((day) => {
            const selected = isSameDay(
              day,
              selectedDay
            );

            return (
              <button
                key={day.toISOString()}
                onClick={() =>
                  onSelectDay(day)
                }
                className="flex flex-col items-center"
              >
                <span className="text-xs text-slate-400">
                  {formatDayLabel(day)}
                </span>

                <div
                  className={`
                    mt-1
                    h-10
                    w-10
                    rounded-full
                    flex
                    items-center
                    justify-center
                    text-sm
                    transition
                    ${selected
                      ? "bg-blue-600 text-white"
                      : "bg-transparent"
                    }
                  `}
                >
                  {formatDayNumber(day)}
                </div>
              </button>
            );
          })}
        </div>

        <button
          onClick={() =>
            setWeekDate(addWeeks(weekDate, 1))
          }
          className="p-2"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      <div className="flex justify-center">
        <button
          onClick={onToday}
          disabled={viewingToday}
          className={`
            px-8 py-2 rounded-lg transition mb-4
            ${viewingToday
                ? "opacity-50 cursor-not-allowed bg-white/10"
                : "bg-blue-600 hover:bg-blue-500"
              }
          `}
        >
          Today
        </button>
      </div>
    </div>
  );
}