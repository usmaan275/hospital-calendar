"use client";

import { useEffect, useMemo, useState } from "react";
import { format, isSameDay } from "date-fns";

import { supabase } from "@/lib/supabase";
import { Visit } from "@/types/visit";
import VisitForm from "./VisitForm";

interface Props {
  selectedDay: Date;
}

const START_HOUR = 7;
const END_HOUR = 23;
const PX_PER_HOUR = 64;

export default function DayView({
  selectedDay,
}: Props) {
  const [visits, setVisits] = useState<Visit[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedVisit, setSelectedVisit] =
    useState<Visit | null>(null);

  async function loadVisits() {
    const { data } = await supabase
      .from("visits")
      .select("*")
      .order("start_time");

    setVisits((data as Visit[]) || []);
  }

  useEffect(() => {
    loadVisits();
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

  function timeToPosition(date: Date) {
    const hours =
      date.getHours() +
      date.getMinutes() / 60;

    return (hours - START_HOUR) * PX_PER_HOUR;
  }

  function timeToHeight(start: Date, end: Date) {
    const diff =
      (end.getTime() - start.getTime()) /
      (1000 * 60 * 60);

    return diff * PX_PER_HOUR;
  }

  function handleCreate(hour: number, minute = 0) {
    const start = new Date(selectedDay);
    start.setHours(hour, minute, 0, 0);

    const end = new Date(start);
    end.setHours(start.getHours() + 1);

    setSelectedVisit({
      id: "",
      name: "",
      start_time: start.toISOString(),
      end_time: end.toISOString(),
      color: "#3b82f6",
      is_night_shift: false,
    });

    setOpen(true);
  }

  return (
    <div className="p-4">
      {/* HEADER */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold">
          {format(selectedDay, "EEEE d MMMM yyyy")}
        </h2>

        <button
          onClick={() => {
            const start = new Date(selectedDay);
            start.setHours(22, 0, 0, 0);

            const end = new Date(selectedDay);
            end.setDate(end.getDate() + 1);
            end.setHours(10, 0, 0, 0);

            setSelectedVisit({
              id: "",
              name: "",
              start_time: start.toISOString(),
              end_time: end.toISOString(),
              color: "#3b82f6",
              is_night_shift: true,
            });

            setOpen(true);
          }}
          className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 active:scale-[0.98] transition text-sm"
        >
          🌙 Night Shift
        </button>
      </div>

      {/* CALENDAR */}
      <div className="relative">

        <div className="flex">

          {/* TIME LABELS COLUMN */}
          <div className="w-14 pr-2 text-right text-xs text-slate-400">
            {Array.from({
              length: END_HOUR - START_HOUR,
            }).map((_, i) => {
              const hour = START_HOUR + i;

              return (
                <div
                  key={hour}
                  className="h-16 flex items-start justify-end"
                >
                  {String(hour).padStart(2, "0")}:00
                </div>
              );
            })}
          </div>

          {/* GRID AREA */}
          <div className="relative flex-1 border-l border-white/10">

            {/* HOURLY ROWS */}
            {Array.from({
              length: END_HOUR - START_HOUR,
            }).map((_, i) => {
              const hour = START_HOUR + i;

              return (
                <div
                  key={hour}
                  className="h-16 border-b border-white/10 hover:bg-white/5 cursor-pointer transition"
                  onClick={() => handleCreate(hour)}
                />
              );
            })}

            {/* VISITS */}
            <div className="absolute left-0 right-0 top-0">
              {dayVisits.map((visit) => {
                const start = new Date(visit.start_time);
                const end = new Date(visit.end_time);

                // DAY BOUNDS
                const dayStart = new Date(selectedDay);
                dayStart.setHours(START_HOUR, 0, 0, 0);

                const dayEnd = new Date(selectedDay);
                dayEnd.setHours(END_HOUR, 0, 0, 0);

                // CLAMP
                const visibleStart = new Date(
                  Math.max(start.getTime(), dayStart.getTime())
                );

                const visibleEnd = new Date(
                  Math.min(end.getTime(), dayEnd.getTime())
                );

                // SKIP IF COMPLETELY OUTSIDE VIEW
                if (visibleEnd <= visibleStart) return null;

                const top = timeToPosition(visibleStart);
                const height = timeToHeight(visibleStart, visibleEnd);

                return (
                  <div
                    key={visit.id}
                    onClick={() => {
                      setSelectedVisit(visit);
                      setOpen(true);
                    }}
                    className="absolute left-2 right-2 rounded-lg p-2 text-white shadow-md cursor-pointer hover:brightness-110 active:scale-[0.98] transition"
                    style={{
                      top,
                      height,
                      backgroundColor: visit.color,
                    }}
                  >
                    <div className="font-semibold">
                      {visit.name}
                    </div>
                    <div className="text-xs opacity-90">
                      {format(start, "HH:mm")} -{" "}
                      {format(end, "HH:mm")}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>

      {/* MODAL */}
      <VisitForm
        open={open}
        setOpen={setOpen}
        visit={selectedVisit}
        onSaved={loadVisits}
      />
    </div>
  );
}