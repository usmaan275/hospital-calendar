"use client";

import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";

import { supabase } from "@/lib/supabase";
import { Visit } from "@/types/visit";

interface Props {
  selectedDay: Date;
  onOpenForm: (visit: Visit) => void;
  onVisitsLoaded?: (reload: () => void) => void;
}

const START_HOUR = 7;
const END_HOUR = 23;
const PX_PER_HOUR = 64;

type PositionedVisit = Visit & {
  column: number;
  columns: number;
};

const COLORS = [
  "#8b5cf6",
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#dfbb2c",
  "#d97706",
  "#ef4444",
];

export default function DayView({ selectedDay, onOpenForm, onVisitsLoaded }: Props) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  async function loadVisits() {
    const { data } = await supabase
      .from("visits")
      .select("*")
      .order("start_time");
    setVisits((data as Visit[]) || []);
    setIsLoaded(true);
  }

  useEffect(() => {
    loadVisits();
  }, []);

  // Expose reload to parent so VisitForm can trigger a refresh
  useEffect(() => {
    onVisitsLoaded?.(loadVisits);
  }, []);

  const dayVisits = useMemo(() => {
    return visits.filter((v) => {
      const start = new Date(v.start_time);
      const end = new Date(v.end_time);
      const dayStart = new Date(selectedDay);
      dayStart.setHours(START_HOUR, 0, 0, 0);
      const dayEnd = new Date(selectedDay);
      dayEnd.setHours(END_HOUR, 0, 0, 0);
      return start < dayEnd && end > dayStart;
    });
  }, [visits, selectedDay]);

  const positionedVisits = useMemo(() => calculatePositions(dayVisits), [dayVisits]);

  function timeToPosition(date: Date) {
    return (date.getHours() + date.getMinutes() / 60 - START_HOUR) * PX_PER_HOUR;
  }

  function timeToHeight(start: Date, end: Date) {
    return ((end.getTime() - start.getTime()) / (1000 * 60 * 60)) * PX_PER_HOUR;
  }

  function handleCreate(hour: number) {
    const start = new Date(selectedDay);
    start.setHours(hour, 0, 0, 0);
    const end = new Date(start);
    end.setHours(hour + 1);
    onOpenForm({
      id: "",
      name: "",
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
    });
  }

  function calculatePositions(visits: Visit[]): PositionedVisit[] {
    const sorted = [...visits].sort(
      (a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
    );
    const positioned: PositionedVisit[] = [];

    for (const visit of sorted) {
      const usedColumns = new Set<number>();
      positioned.forEach((other) => {
        if (
          new Date(visit.start_time) < new Date(other.end_time) &&
          new Date(visit.end_time) > new Date(other.start_time)
        ) usedColumns.add(other.column);
      });
      let column = 0;
      while (usedColumns.has(column)) column++;
      positioned.push({ ...visit, column, columns: 1 });
    }

    positioned.forEach((visit) => {
      let maxColumns = 1;
      positioned.forEach((other) => {
        if (
          new Date(visit.start_time) < new Date(other.end_time) &&
          new Date(visit.end_time) > new Date(other.start_time)
        ) maxColumns = Math.max(maxColumns, other.column + 1);
      });
      visit.columns = maxColumns;
    });

    return positioned;
  }

  return (
    <div className="p-4">
      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold">
          {format(selectedDay, "EEEE d MMMM yyyy")}
        </h2>
        <button
          onClick={() => {
            const start = new Date(selectedDay);
            start.setHours(22, 0, 0, 0);
            const end = new Date(selectedDay);
            end.setDate(end.getDate() + 1);
            end.setHours(10, 0, 0, 0);
            onOpenForm({
              id: "",
              name: "",
              start_time: start.toISOString(),
              end_time: end.toISOString(),
              color: COLORS[Math.floor(Math.random() * COLORS.length)],
            });
          }}
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 cursor-pointer active:scale-[0.98] transition text-sm"
        >
          🌙 Night Shift
        </button>
      </div>

      {/* SPINNER — shown while loading */}
      {!isLoaded && (
        <div className="flex items-center justify-center py-32">
          <div className="h-8 w-8 rounded-full border-[3px] border-blue-600/30 border-t-blue-600 animate-spin" />
        </div>
      )}

      {/* GRID — fades in once loaded */}
      <div className="relative" style={{ opacity: isLoaded ? 1 : 0, transition: "opacity 200ms ease" }}>
        <div className="flex">
          <div className="w-14 pr-2 text-right text-xs text-slate-300">
            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => {
              const hour = START_HOUR + i;
              return (
                <div key={hour} className="h-16 flex items-start justify-end">
                  {String(hour).padStart(2, "0")}:00
                </div>
              );
            })}
          </div>

          <div className="relative flex-1 border-l border-white/10">
            {Array.from({ length: END_HOUR - START_HOUR }).map((_, i) => (
              <div
                key={i}
                className="h-16 border-b border-white/10 hover:bg-white/5 cursor-pointer transition"
                onClick={() => handleCreate(START_HOUR + i)}
              />
            ))}

            <div className="absolute left-0 right-0 top-0">
              {positionedVisits.map((visit) => {
                const start = new Date(visit.start_time);
                const end = new Date(visit.end_time);
                const dayStart = new Date(selectedDay);
                dayStart.setHours(START_HOUR, 0, 0, 0);
                const dayEnd = new Date(selectedDay);
                dayEnd.setHours(END_HOUR, 0, 0, 0);
                const visibleStart = new Date(Math.max(start.getTime(), dayStart.getTime()));
                const visibleEnd = new Date(Math.min(end.getTime(), dayEnd.getTime()));
                if (visibleEnd <= visibleStart) return null;

                const top = timeToPosition(visibleStart);
                const height = timeToHeight(visibleStart, visibleEnd);
                const width = 100 / visit.columns;
                const left = visit.column * width;

                return (
                  <div
                    key={visit.id}
                    onClick={() => onOpenForm(visit)}
                    className="absolute left-2 right-2 rounded-lg p-2 text-white shadow-md cursor-pointer hover:brightness-110 active:scale-[0.98] transition"
                    style={{
                      top,
                      height,
                      left: `${left}%`,
                      width: `${width}%`,
                      backgroundColor: visit.color,
                    }}
                  >
                    {(() => {
                      const durationMins = (end.getTime() - start.getTime()) / (1000 * 60);
                      const isShort = durationMins < 60;
                      return isShort ? (
                        <div className="text-xs leading-tight truncate">
                          <span className="font-semibold">{visit.name}</span>
                          <span className="opacity-90"> {format(start, "HH:mm")}–{format(end, "HH:mm")}</span>
                        </div>
                      ) : (
                        <>
                          <div className="font-semibold">{visit.name}</div>
                          <div className="text-xs opacity-90">
                            {format(start, "HH:mm")} – {format(end, "HH:mm")}
                          </div>
                        </>
                      );
                    })()}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}